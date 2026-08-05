// src/components/practice/FactSprintModal.tsx
// The daily FACT SPRINT: a short, rapid-fire retrieval drill. One fact at a
// time, big number pad, instant advance on a correct answer. Not graded — it
// builds automaticity (fast recall) on the fact levels. Adaptive: wrong/slow
// facts come back sooner (and persist as "weak" per child in localStorage);
// fast-correct facts fade out. Pure client — the server only supplies the pool.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/MathText";

interface Fact { q: string; a: string; key: string }

const SLOW_MS = 4000;   // a correct answer slower than this still counts as "weak"
const FAST_MS = 2500;   // faster than this retires the fact from the weak set

export function FactSprintModal({
  open, onClose, studentId,
}: { open: boolean; onClose: () => void; studentId: string }) {
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [op, setOp] = useState<string>("");
  const [levelCode, setLevelCode] = useState<string>("");
  const [seconds, setSeconds] = useState(90);
  const [pool, setPool] = useState<Fact[]>([]);

  // Drill state
  const [queue, setQueue] = useState<Fact[]>([]);
  const [entry, setEntry] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flash, setFlash] = useState<"none" | "good" | "bad">("none");
  const shownAtRef = useRef<number>(0);

  const weakKey = `bs:factweak:${studentId}:${op}`;
  const readWeak = useCallback((): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(weakKey) ?? "[]")); } catch { return new Set(); }
  }, [weakKey]);
  const writeWeak = useCallback((s: Set<string>) => {
    try { localStorage.setItem(weakKey, JSON.stringify([...s].slice(-200))); } catch { /* ignore */ }
  }, [weakKey]);

  // Fetch the pool when opened.
  useEffect(() => {
    if (!open) return;
    setLoading(true); setUnavailable(false); setDone(false);
    fetch(`/api/students/${studentId}/fact-sprint`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success || !d.data?.available) { setUnavailable(true); return; }
        setOp(d.data.op); setLevelCode(d.data.levelCode);
        setSeconds(d.data.seconds ?? 90); setPool(d.data.facts ?? []);
      })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, [open, studentId]);

  // Build the initial queue: weak facts first (they need the reps), then a
  // shuffled spread of the rest.
  const startDrill = useCallback(() => {
    const weak = readWeak();
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const weakFirst = [
      ...shuffled.filter((f) => weak.has(f.key)),
      ...shuffled.filter((f) => !weak.has(f.key)),
    ];
    setQueue(weakFirst);
    setEntry(""); setCorrect(0); setAttempts(0); setStreak(0); setBestStreak(0);
    setTimeLeft(seconds); setDone(false); setRunning(true);
    shownAtRef.current = Date.now();
  }, [pool, seconds, readWeak]);

  // Countdown.
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) { setRunning(false); setDone(true); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft]);

  const current = queue[0];

  const advance = useCallback((wasCorrect: boolean, elapsed: number) => {
    const weak = readWeak();
    setQueue((q) => {
      const [head, ...rest] = q;
      if (!head) return q;
      // Re-queue policy: wrong or slow → comes back ~6 ahead (soon); fast-correct
      // → drop it for this run. Everything else goes to the back.
      if (!wasCorrect || elapsed > SLOW_MS) {
        weak.add(head.key);
        const at = Math.min(6, rest.length);
        return [...rest.slice(0, at), head, ...rest.slice(at)];
      }
      if (elapsed < FAST_MS) weak.delete(head.key);
      return [...rest, head];
    });
    writeWeak(weak);
    setEntry("");
    shownAtRef.current = Date.now();
  }, [readWeak, writeWeak]);

  const submit = useCallback((value: string) => {
    if (!current || !running) return;
    const elapsed = Date.now() - shownAtRef.current;
    const wasCorrect = value === current.a;
    setAttempts((n) => n + 1);
    if (wasCorrect) {
      setCorrect((n) => n + 1);
      setStreak((s) => { const ns = s + 1; setBestStreak((b) => Math.max(b, ns)); return ns; });
      setFlash("good");
    } else {
      setStreak(0);
      setFlash("bad");
    }
    setTimeout(() => setFlash("none"), 180);
    advance(wasCorrect, elapsed);
  }, [current, running, advance]);

  // Auto-submit the moment the typed value equals the answer (snappy for the
  // common correct case); wrong answers are submitted with ✓ / Enter.
  const onDigit = (d: string) => {
    const next = (entry + d).slice(0, 4);
    setEntry(next);
    if (current && next === current.a) submit(next);
  };

  // Physical keyboard support.
  useEffect(() => {
    if (!open || !running) return;
    const h = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") onDigit(e.key);
      else if (e.key === "Backspace") setEntry((s) => s.slice(0, -1));
      else if (e.key === "Enter") submit(entry);
      else if (e.key === "-" && op === "-") { /* ignore sign; facts are non-negative */ }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, running, entry, current, submit, op]);

  const factsPerMin = attempts > 0 && seconds > timeLeft ? Math.round((correct / (seconds - timeLeft)) * 60) : 0;

  return (
    <Modal open={open} onClose={onClose} title="⚡ Fact Sprint" description={running ? `${op} facts · ${timeLeft}s left` : "A quick 90-second recall warm-up"} size="sm">
      {loading && <div className="py-10 text-center text-muted text-sm">Loading your facts…</div>}

      {!loading && unavailable && (
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-muted">The Fact Sprint is for the addition, subtraction, multiplication, and division fact levels. You&apos;re not on one right now — keep practising your packet!</p>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      )}

      {!loading && !unavailable && !running && !done && (
        <div className="py-6 text-center space-y-4">
          <div className="text-5xl">⚡</div>
          <p className="text-sm text-ink leading-snug">
            Answer as many {op === "+" ? "addition" : op === "-" ? "subtraction" : op === "×" ? "multiplication" : "division"} facts as you can in {seconds} seconds.
            Type the answer — correct ones jump ahead automatically. Speed builds memory! 🧠
          </p>
          <Button onClick={startDrill} className="w-full">Start the sprint →</Button>
        </div>
      )}

      {!loading && running && current && (
        <div className={`py-4 transition-colors rounded-xl ${flash === "good" ? "bg-brand-green/10" : flash === "bad" ? "bg-brand-red/10" : ""}`}>
          <div className="flex items-center justify-between px-1 mb-3 text-xs font-bold">
            <span className="text-brand-blue">✓ {correct}</span>
            <span className={`${timeLeft <= 10 ? "text-brand-red" : "text-muted"}`}>⏱️ {timeLeft}s</span>
            {streak >= 3 ? <span className="text-gold-dark">🔥 {streak}</span> : <span className="text-muted/50">🔥 {streak}</span>}
          </div>
          <div className="text-center py-4">
            <div className="font-serif font-bold text-4xl text-ink"><MathText>{`${current.q} =`}</MathText></div>
            <div className="mt-3 mx-auto w-28 h-12 rounded-lg border-2 border-brand-blue/40 flex items-center justify-center text-2xl font-bold text-ink">
              {entry || <span className="text-muted/30">?</span>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 max-w-[240px] mx-auto">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button key={d} onClick={() => onDigit(d)} className="h-11 rounded-lg bg-cream-dark text-lg font-bold text-ink hover:bg-gold-light active:scale-95 transition">{d}</button>
            ))}
            <button onClick={() => setEntry((s) => s.slice(0, -1))} className="h-11 rounded-lg bg-cream-dark text-base font-bold text-muted hover:bg-gold-light active:scale-95 transition">⌫</button>
            <button onClick={() => onDigit("0")} className="h-11 rounded-lg bg-cream-dark text-lg font-bold text-ink hover:bg-gold-light active:scale-95 transition">0</button>
            <button onClick={() => submit(entry)} className="h-11 rounded-lg bg-brand-blue text-lg font-bold text-white hover:bg-brand-blue/90 active:scale-95 transition">✓</button>
          </div>
          <button onClick={() => { setRunning(false); setDone(true); }} className="block mx-auto mt-4 text-xs text-muted hover:underline">End early</button>
        </div>
      )}

      {!loading && done && (
        <div className="py-6 text-center space-y-3">
          <div className="text-5xl">{correct >= 20 ? "🏆" : correct >= 10 ? "🌟" : "💪"}</div>
          <div className="font-serif font-bold text-2xl text-ink">{correct} correct!</div>
          <div className="flex justify-center gap-6 text-sm text-muted">
            <span><b className="text-ink">{factsPerMin}</b> / min</span>
            <span>best streak <b className="text-ink">{bestStreak}</b> 🔥</span>
            <span><b className="text-ink">{attempts ? Math.round((correct / attempts) * 100) : 0}%</b></span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Done</Button>
            <Button className="flex-1" onClick={startDrill}>Go again ⚡</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
