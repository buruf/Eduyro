// src/hooks/useTutorialLog.ts
// Fire-and-forget funnel logger for the concept tutorial (old + pilot
// variants). Batches patches via a 1s debounce and flushes on pagehide via
// navigator.sendBeacon (Blob w/ explicit content-type so the server can
// still JSON-parse a beacon POST).
"use client";
import { useEffect, useMemo, useRef } from "react";

export type TutorialPatch = {
  beatIndex?: number; skipTapped?: boolean; skipAtMs?: number;
  audioPlayedMs?: number; predictionAnswer?: string; predictionCorrect?: boolean;
};

export function useTutorialLog(opts: { studentId: string; skillId: string; variant: "old" | "pilot"; enabled: boolean }) {
  const runId = useMemo(() => crypto.randomUUID(), []);
  const pending = useRef<TutorialPatch & { tapCount?: number }>({});
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // opts.enabled/studentId/skillId/variant can change across renders (e.g.
  // enabled flips true when the modal opens) — keep a live ref so `send`
  // always reads current values without re-creating the callback identity.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const send = (final = false) => {
    if (!optsRef.current.enabled) return;
    const body = JSON.stringify({
      runId, studentId: optsRef.current.studentId, skillId: optsRef.current.skillId, variant: optsRef.current.variant,
      tapCount: taps.current, ...pending.current, ...(final ? { endedAt: new Date().toISOString() } : {}),
    });
    pending.current = {};
    if (final && navigator.sendBeacon) {
      navigator.sendBeacon("/api/tutorial-events", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/tutorial-events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  };

  const log = (patch: TutorialPatch) => {
    Object.assign(pending.current, patch);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => send(false), 1000);
  };
  const bumpTap = () => { taps.current += 1; };
  const end = () => { if (timer.current) clearTimeout(timer.current); send(true); };

  useEffect(() => {
    if (!opts.enabled) return;
    send(false); // creates the row on open
    const onHide = () => send(true);
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled]);

  return { log, bumpTap, end };
}
