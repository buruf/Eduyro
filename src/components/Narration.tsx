"use client";
// <Narration text="..." /> — plays the given line in the owner's cloned voice.
// Auto-plays on mount/when text changes (a 🔊 button lets the child replay).
// If narration isn't configured (503) or errors, it renders NOTHING and never
// blocks the UI. Audio is cached server-side, so repeats are free + instant.
import { useEffect, useRef, useState } from "react";

// Module-level memo so the same line isn't re-requested across mounts this session.
const urlCache = new Map<string, string | null>();

export function Narration({ text, autoPlay = true, className, onActive, onUnavailable }: {
  text: string; autoPlay?: boolean; className?: string;
  onActive?: () => void;       // fired when cloned-voice audio is available
  onUnavailable?: () => void;  // fired when TTS is off/errored (caller can fall back)
}) {
  const [url, setUrl] = useState<string | null>(() => urlCache.get(text) ?? null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "playing" | "off">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cbRef = useRef({ onActive, onUnavailable });
  cbRef.current = { onActive, onUnavailable };

  useEffect(() => {
    let cancelled = false;
    const t = (text ?? "").trim();
    if (!t) { setState("off"); return; }
    if (urlCache.get(t) === null) { setState("off"); cbRef.current.onUnavailable?.(); return; }
    if (urlCache.has(t)) { setUrl(urlCache.get(t)!); setState("ready"); cbRef.current.onActive?.(); return; }

    setState("loading");
    fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) })
      .then(async (r) => {
        if (r.status === 503) { urlCache.set(t, null); throw new Error("off"); }
        const j = await r.json();
        if (!j?.success || !j?.data?.url) throw new Error("no url");
        return j.data.url as string;
      })
      .then((u) => { if (!cancelled) { urlCache.set(t, u); setUrl(u); setState("ready"); cbRef.current.onActive?.(); } })
      .catch(() => { if (!cancelled) { setState("off"); cbRef.current.onUnavailable?.(); } });
    return () => { cancelled = true; };
  }, [text]);

  // Auto-play ONCE per clip when it first becomes ready. Guarded by a ref —
  // pausing sets state back to "ready", and without the guard this effect
  // instantly re-played the audio, making the pause button appear dead.
  const autoPlayedRef = useRef<string | null>(null);
  useEffect(() => {
    if (state !== "ready" || !url || !autoPlay) return;
    if (autoPlayedRef.current === url) return;
    const a = audioRef.current;
    if (!a) return;
    autoPlayedRef.current = url;
    a.play().then(() => setState("playing")).catch(() => {/* autoplay blocked — button still works */});
  }, [state, url, autoPlay]);

  if (state === "off" || state === "idle") return null;

  return (
    <span className={className}>
      {url && (
        <audio ref={audioRef} src={url} preload="auto"
          onEnded={() => setState("ready")} onPause={() => setState("ready")} onPlay={() => setState("playing")} />
      )}
      <button
        type="button"
        aria-label={state === "playing" ? "Pause narration" : "Play narration"}
        onClick={() => {
          const a = audioRef.current; if (!a) return;
          // Resume from where the child paused; only restart after it finished.
          if (a.paused) { if (a.ended) a.currentTime = 0; a.play().catch(() => {}); } else a.pause();
        }}
        disabled={state === "loading"}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 align-middle disabled:opacity-40"
      >
        {state === "loading" ? "…" : state === "playing" ? "❚❚" : "🔊"}
      </button>
    </span>
  );
}
