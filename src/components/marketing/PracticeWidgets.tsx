// src/components/marketing/PracticeWidgets.tsx
// Live mini-version of the REAL daily practice: one question at a time, a big
// tap-friendly number pad, "Check answer" → instant coaching on a miss (work it
// through, try again) or ✓ and Next on success, then an honest first-try score.
// Mirrors the student PracticeModal so the homepage demo matches the product.
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Problem = { q: string; a: number; hint: string };
const PROBLEMS: Problem[] = [
  { q: "6 × 7", a: 42, hint: "Think 6 × 7 = 6 × 7. Count by 7s: 7, 14, 21, 28, 35, 42." },
  { q: "9 × 8", a: 72, hint: "9 × 8 is one group of 8 less than 10 × 8 = 80. 80 − 8 = 72." },
  { q: "7 × 7", a: 49, hint: "A square fact: 7 × 7. Seven 7s — 49." },
  { q: "8 × 6", a: 48, hint: "8 × 6 is double 4 × 6. 4 × 6 = 24, doubled is 48." },
];

export function PracticeWidgets() {
  const [idx, setIdx] = useState(0);
  const [entry, setEntry] = useState("");
  const [state, setState] = useState<"answering" | "correct" | "wrong">("answering");
  const [firstTry, setFirstTry] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const total = PROBLEMS.length;
  const p = PROBLEMS[idx];

  function key(k: string) {
    if (state !== "answering") return;
    if (k === "del") return setEntry((e) => e.slice(0, -1));
    if (entry.length >= 4) return;
    setEntry((e) => e + k);
  }

  function check() {
    if (!entry) return;
    const ok = parseInt(entry, 10) === p.a;
    if (state === "answering" && firstTry[idx] === undefined) {
      setFirstTry((m) => ({ ...m, [idx]: ok }));
    }
    setState(ok ? "correct" : "wrong");
  }

  function next() {
    if (idx + 1 >= total) return setDone(true);
    setIdx((i) => i + 1);
    setEntry("");
    setState("answering");
  }

  function tryAgain() {
    setEntry("");
    setState("answering");
  }

  function restart() {
    setIdx(0); setEntry(""); setState("answering"); setFirstTry({}); setDone(false);
  }

  const ftCount = Object.values(firstTry).filter(Boolean).length;
  const ftPct = Math.round((ftCount / total) * 100);

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Math · Level M5</div>
          <div className="font-serif text-lg font-bold leading-tight">Multiplication facts</div>
        </div>
        <span className="text-2xl">∑</span>
      </div>

      {!done ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
              <div className="h-full bg-brand-green transition-all" style={{ width: `${(idx / total) * 100}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted shrink-0">{idx + 1}/{total}</span>
          </div>

          {/* Question card */}
          <div className="rounded-xl border border-border-mid bg-white px-4 py-7 min-h-[120px] flex items-center justify-center">
            <span className="font-serif text-3xl font-bold tracking-wide">
              {p.q} = <span className={cn("inline-block min-w-[2ch] border-b-2 px-1", entry ? "border-ink" : "border-border-mid text-muted/40")}>{entry || "?"}</span>
            </span>
          </div>

          {/* Number pad (only while answering) */}
          {state === "answering" && (
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "del"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => key(k)}
                  className={cn(
                    "h-12 rounded-xl border border-border-mid bg-white text-xl font-bold font-serif hover:bg-cream-dark/40 active:bg-cream-dark transition-colors",
                    k === "del" && "text-brand-red",
                    k === "0" && "col-start-2"
                  )}
                >
                  {k === "del" ? "⌫" : k}
                </button>
              ))}
            </div>
          )}

          {/* Coaching on a miss — mirrors the real "let's work through it" panel */}
          {state === "wrong" && (
            <div className="mt-3 space-y-1.5">
              <div className="text-sm font-bold text-brand-red">Not quite — let&apos;s work through it 💪</div>
              <div className="bg-gold-light/60 rounded-md p-2.5 text-sm flex gap-2">
                <span className="font-bold text-gold-dark shrink-0">Hint</span>
                <span className="flex-1">{p.hint}</span>
              </div>
            </div>
          )}

          {state === "correct" && (
            <div className="mt-3 text-sm font-bold text-brand-green text-center">✓ Correct! Nice work.</div>
          )}

          {/* Action */}
          <div className="mt-4">
            {state === "answering" ? (
              <button onClick={check} disabled={!entry}
                className="w-full bg-brand-blue text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-blue/90 disabled:opacity-40 transition-colors">
                Check answer
              </button>
            ) : state === "correct" ? (
              <button onClick={next}
                className="w-full bg-brand-green text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-green/90 transition-colors">
                {idx + 1 >= total ? "See results →" : "Next question →"}
              </button>
            ) : (
              <button onClick={tryAgain}
                className="w-full bg-cream-dark text-ink text-sm font-semibold py-2.5 rounded-lg hover:bg-border-mid/40 transition-colors">
                Try again
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-muted mt-3">
            Mastery is built on getting it right on the <strong>first try</strong> — so misses are coached, not just marked wrong.
          </p>
        </>
      ) : (
        // First-try results — honest accuracy, never a bare zero
        <div className="text-center py-6">
          <div className="text-4xl mb-2">{ftPct === 100 ? "🌟" : ftPct >= 50 ? "💪" : "📈"}</div>
          <div className="font-serif text-2xl font-bold">{ftCount} of {total}</div>
          <div className="text-sm text-muted mb-4">right on the first try ({ftPct}%)</div>
          <div className="text-sm text-ink mb-5">
            {ftPct === 100 ? "Perfect — every one first try! This is what mastery looks like."
              : ftPct >= 50 ? "Solid work. A few more days of practice and these become automatic."
              : "Great effort. Daily practice is exactly how these facts stick."}
          </div>
          <button onClick={restart}
            className="bg-ink text-cream text-sm font-semibold py-2.5 px-6 rounded-lg hover:bg-ink/90 transition-colors">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
