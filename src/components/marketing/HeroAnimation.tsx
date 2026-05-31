// src/components/marketing/HeroAnimation.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

// The animated sequence: problems appear one at a time, student "types" an answer,
// checkmark fires, streak increments, then next problem loads.

const PROBLEMS = [
  { q: "7 × 8 =", a: "56", subject: "Math · M5", color: "#1B4F8A" },
  { q: "Simplify 6/8", a: "3/4", subject: "Math · M7", color: "#1B4F8A" },
  { q: "Main idea?", a: "Bees work together", subject: "Reading · R5", color: "#C8902A" },
  { q: "9 × 7 =", a: "63", subject: "Math · M5", color: "#1B4F8A" },
  { q: "Identify the noun", a: "dog", subject: "Writing · W2", color: "#2D6A3F" },
  { q: "6 × 9 =", a: "54", subject: "Math · M5", color: "#1B4F8A" },
];

type Phase = "entering" | "typing" | "correct" | "exiting";

export function HeroAnimation() {
  const [idx, setIdx]       = useState(0);
  const [phase, setPhase]   = useState<Phase>("entering");
  const [typed, setTyped]   = useState("");
  const [streak, setStreak] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [sheetsDone, setSheetsDone] = useState(47);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const problem = PROBLEMS[idx % PROBLEMS.length];

  useEffect(() => {
    // Phase machine
    if (phase === "entering") {
      setTyped("");
      timerRef.current = setTimeout(() => setPhase("typing"), 600);
    } else if (phase === "typing") {
      // Type answer char by char
      const answer = problem.a;
      if (typed.length < answer.length) {
        timerRef.current = setTimeout(() => {
          setTyped(answer.slice(0, typed.length + 1));
        }, 120 + Math.random() * 80);
      } else {
        timerRef.current = setTimeout(() => setPhase("correct"), 300);
      }
    } else if (phase === "correct") {
      setStreak(s => Math.min(s + 1, 5));
      setSheetsDone(s => s + 1);
      timerRef.current = setTimeout(() => setPhase("exiting"), 900);
    } else if (phase === "exiting") {
      timerRef.current = setTimeout(() => {
        setIdx(i => i + 1);
        setPhase("entering");
      }, 400);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, typed, problem.a]);

  const isCorrect = phase === "correct" || phase === "exiting";
  const isExiting = phase === "exiting";

  return (
    <div className="relative w-full max-w-4xl mx-auto select-none">

      {/* Ambient glow behind the card */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-20 transition-colors duration-700"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${problem.color}, transparent 70%)` }}
      />

      {/* Main card */}
      <div className={cn(
        "relative bg-white border border-border rounded-2xl shadow-elev overflow-hidden",
        "transition-all duration-300",
        isExiting && "opacity-0 scale-[0.99]"
      )}>

        {/* Progress bar at top */}
        <div className="h-1 bg-cream-dark w-full">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${(streak / 5) * 100}%` }}
          />
        </div>

        <div className="p-6 lg:p-8">

          {/* Top row: subject badge + streak + accuracy */}
          <div className="flex items-center justify-between mb-6">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: problem.color }}
            >
              <svg viewBox="0 0 8 8" className="w-1.5 h-1.5 fill-current opacity-80"><circle cx="4" cy="4" r="4" /></svg>
              {problem.subject}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted font-sans">
              <div className="flex items-center gap-1.5">
                {/* Flame SVG */}
                <svg viewBox="0 0 16 20" className="w-3.5 h-4 fill-gold">
                  <path d="M8 0C8 0 4 4 4 8C4 6 2 5 2 5C2 5 0 8 0 11C0 15.418 3.582 19 8 19C12.418 19 16 15.418 16 11C16 7 12 4 12 4C12 4 12 7 10 8C10 4 8 0 8 0Z"/>
                </svg>
                <span className="font-semibold text-ink">{streak}</span>
                <span>day streak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-brand-green">
                  <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                </svg>
                <span className="font-semibold text-ink">{accuracy}%</span>
                <span>accuracy</span>
              </div>
            </div>
          </div>

          {/* The worksheet — two columns */}
          <div className="grid lg:grid-cols-[1fr_1px_1fr] gap-6 lg:gap-8">

            {/* Left: current problem being answered */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-4 font-sans">
                Today's worksheet · Sheet 2 of 3
              </div>

              {/* Active problem */}
              <div className={cn(
                "bg-cream rounded-xl p-5 mb-4 transition-all duration-300",
                isCorrect && "bg-brand-green-light"
              )}>
                <div className="font-serif text-3xl font-bold text-ink mb-4 tracking-tight">
                  {problem.q}
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex-1 h-11 rounded-lg border-2 px-4 flex items-center font-serif text-xl font-bold transition-all duration-200",
                    isCorrect
                      ? "border-brand-green bg-white text-brand-green"
                      : "border-border bg-white text-ink"
                  )}>
                    {typed}
                    {!isCorrect && (
                      <span className="ml-0.5 w-0.5 h-5 bg-ink animate-pulse inline-block" />
                    )}
                  </div>
                  <div className={cn(
                    "w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-300",
                    isCorrect
                      ? "bg-brand-green scale-110"
                      : "bg-cream-dark"
                  )}>
                    {isCorrect ? (
                      <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
                        <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="w-5 h-5 fill-muted opacity-40">
                        <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm1-11a1 1 0 1 0-2 0v3.586L7.707 9.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l3-3a1 1 0 0 0-1.414-1.414L11 10.586V7z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Remaining problems (blurred/placeholder) */}
              <div className="space-y-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-cream-dark/60">
                    <div className="w-24 h-3 rounded bg-border" />
                    <div className="flex-1" />
                    <div className="w-10 h-7 rounded border border-border bg-white" />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block bg-border" />

            {/* Right: stats panel */}
            <div className="flex flex-col gap-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-0 font-sans">
                Your child's progress
              </div>

              {/* Mastery progress */}
              <div className="bg-cream rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink">Mastery progress</span>
                  <span className="text-xs text-muted font-sans">{streak}/5 days</span>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {[1,2,3,4,5].map(d => (
                    <div
                      key={d}
                      className={cn(
                        "flex-1 h-2 rounded-full transition-all duration-500",
                        d <= streak ? "bg-gold" : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted font-sans">
                  Hit 95% for 5 days → auto-advance to next level
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sheets done", value: sheetsDone, unit: "this month", color: "text-brand-blue" },
                  { label: "Accuracy", value: `${accuracy}%`, unit: "last 7 days", color: "text-brand-green" },
                  { label: "Current level", value: "M5", unit: "Multiplication", color: "text-gold-dark" },
                  { label: "Time today", value: "8m", unit: "of 10m target", color: "text-muted" },
                ].map(stat => (
                  <div key={stat.label} className="bg-cream rounded-xl p-3">
                    <div className={cn("font-serif text-xl font-bold", stat.color)}>{stat.value}</div>
                    <div className="text-[10px] text-ink font-semibold font-sans mt-0.5">{stat.label}</div>
                    <div className="text-[10px] text-muted font-sans">{stat.unit}</div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-cream rounded-xl p-4 flex-1">
                <div className="text-xs font-semibold text-ink mb-3">Recent sessions</div>
                <div className="space-y-2">
                  {[
                    { day: "Today", score: "19/20", pct: 95, done: true },
                    { day: "Yesterday", score: "20/20", pct: 100, done: true },
                    { day: "Monday", score: "18/20", pct: 90, done: true },
                  ].map(row => (
                    <div key={row.day} className="flex items-center gap-2 text-xs font-sans">
                      <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-brand-green flex-shrink-0">
                        <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                      </svg>
                      <span className="text-muted w-20">{row.day}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-border">
                        <div
                          className={cn("h-full rounded-full transition-all", row.pct === 100 ? "bg-brand-green" : "bg-gold")}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="font-semibold text-ink w-12 text-right">{row.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom action row */}
          <div className="mt-6 pt-5 border-t border-cream-dark flex items-center justify-between">
            <div className="text-xs text-muted font-sans">
              <span className="font-semibold text-ink">{sheetsDone}</span> sheets completed this month · next level in{" "}
              <span className="font-semibold text-brand-blue">{5 - streak} day{5 - streak !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-xs text-muted font-sans">Live preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge — appears when streak hits a milestone */}
      {streak >= 3 && (
        <div className="absolute -top-4 -right-4 bg-gold text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-elev animate-bounce">
          🔥 {streak}-day streak!
        </div>
      )}
    </div>
  );
}
