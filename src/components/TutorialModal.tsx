// src/components/TutorialModal.tsx
// World-class interactive tutorial for children — step-by-step reveal with animations
// Each step is revealed one at a time. Answer only appears after all steps shown.
// Mini celebration between examples. Full-screen immersive experience.

"use client";

import { useState, useEffect } from "react";
import type { TutorialContent } from "@/lib/worksheet/tutorials";
import type { TodaySheet } from "@/types";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  sheet: TodaySheet;
  content: TutorialContent;
  subjectSlug?: string;
  onComplete: () => void;
}

const SUBJECT_THEMES: Record<string, { bg: string; accent: string; icon: string }> = {
  MATH:    { bg: "#1B4F8A", accent: "#3B82F6", icon: "🔢" },
  READING: { bg: "#6D28D9", accent: "#8B5CF6", icon: "📖" },
  WRITING: { bg: "#065F46", accent: "#10B981", icon: "✏️" },
  SCIENCE: { bg: "#991B1B", accent: "#EF4444", icon: "🔬" },
};

const CELEBRATIONS = ["Great work! 🎉", "Excellent! ⭐", "You got it! 🚀", "Amazing! 💪", "Keep going! 🔥"];

export function TutorialModal({ open, onClose, sheet, content, subjectSlug = "MATH", onComplete }: TutorialModalProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [visible, setVisible] = useState(false);

  const theme = SUBJECT_THEMES[subjectSlug] ?? SUBJECT_THEMES.MATH;
  const example = content.examples[exampleIndex];
  const totalExamples = content.examples.length;
  const totalSteps = example?.steps.length ?? 0;
  const allStepsRevealed = revealedSteps >= totalSteps;
  const isLastExample = exampleIndex === totalExamples - 1;

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExampleIndex(0);
      setRevealedSteps(0);
      setShowAnswer(false);
      setCelebrating(false);
    }
  }, [open]);

  useEffect(() => {
    setRevealedSteps(0);
    setShowAnswer(false);
  }, [exampleIndex]);

  function revealNextStep() {
    const next = revealedSteps + 1;
    setRevealedSteps(next);
    if (next >= totalSteps) {
      setTimeout(() => setShowAnswer(true), 350);
    }
  }

  function handleNext() {
    if (!isLastExample) {
      setCelebrating(true);
      setTimeout(() => {
        setCelebrating(false);
        setExampleIndex(i => i + 1);
      }, 1400);
    } else {
      onComplete();
    }
  }

  if (!open || !visible) return null;

  return (
    <>
      <style>{`
        @keyframes tu-slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes tu-popIn {
          0% { transform: scale(0.6); opacity: 0; }
          65% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tu-fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes tu-bounceIn {
          0% { transform: scale(0.3) rotate(-5deg); opacity: 0; }
          55% { transform: scale(1.12) rotate(2deg); }
          75% { transform: scale(0.95); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes tu-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes tu-pulse-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        }
        @keyframes tu-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes tu-spin {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        .tu-fade { animation: tu-fadeIn 0.3s ease forwards; }
        .tu-slide { animation: tu-slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
        .tu-pop { animation: tu-popIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
        .tu-bounce { animation: tu-bounceIn 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
        .tu-float { animation: tu-float 2.8s ease-in-out infinite; }
        .tu-ready-btn { animation: tu-pulse-glow 2s ease-in-out infinite; }
        .tu-shimmer-btn {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%),
                      linear-gradient(135deg, #22c55e, #16a34a);
          background-size: 200% 100%, 100% 100%;
          animation: tu-shimmer 2s linear infinite;
        }
      `}</style>

      {/* Full-screen overlay */}
      <div
        className="tu-fade fixed inset-0 z-[100] flex flex-col overflow-hidden"
        style={{ background: `linear-gradient(155deg, ${theme.bg} 0%, #0a0f1e 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: theme.accent, filter: "blur(60px)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: theme.accent, filter: "blur(40px)", transform: "translate(-30%, 30%)" }} />

        {/* ── HEADER ── */}
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              {theme.icon}
            </div>
            <div>
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-bold">Tutorial</div>
              <div className="text-white text-sm font-bold tracking-tight">{content.skillName}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-all text-xl leading-none">
            ×
          </button>
        </div>

        {/* Progress pills */}
        <div className="relative px-5 pb-4 flex-shrink-0">
          <div className="flex gap-1.5 mb-1">
            {content.examples.map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: i <= exampleIndex ? "100%" : "0%",
                    background: i < exampleIndex ? "#4ade80" : "white",
                  }} />
              </div>
            ))}
          </div>
          <div className="text-white/35 text-[10px] font-medium">
            Example {exampleIndex + 1} of {totalExamples}
          </div>
        </div>

        {/* ── MAIN SCROLL AREA ── */}
        <div className="relative flex-1 overflow-y-auto px-5">
          {celebrating ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="tu-bounce text-8xl mb-5 select-none">
                {["🎉","⭐","🚀","💪","🔥"][exampleIndex % 5]}
              </div>
              <div className="tu-slide text-white text-2xl font-bold mb-2" style={{ animationDelay: "150ms", opacity: 0 }}>
                {CELEBRATIONS[exampleIndex % CELEBRATIONS.length]}
              </div>
              <div className="tu-slide text-white/40 text-sm" style={{ animationDelay: "300ms", opacity: 0 }}>
                Loading example {exampleIndex + 2}…
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {/* Problem box */}
              <div className="tu-slide rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: theme.accent, color: "white" }}>?</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Problem</div>
                </div>
                <div className="text-white font-bold text-lg leading-snug whitespace-pre-line">
                  {example.problem}
                </div>
              </div>

              {/* Revealed steps */}
              {Array.from({ length: revealedSteps }).map((_, i) => (
                <div key={i} className="tu-slide flex gap-3 rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    animationDelay: "0ms",
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: theme.accent, color: "white" }}>
                    {i + 1}
                  </div>
                  <div className="text-white/85 text-sm leading-relaxed pt-0.5">
                    {example.steps[i]}
                  </div>
                </div>
              ))}

              {/* Answer */}
              {showAnswer && (
                <div className="tu-pop rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.10))",
                    border: "1.5px solid rgba(74,222,128,0.45)",
                  }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "rgba(74,222,128,0.2)" }}>
                    ✅
                  </div>
                  <div>
                    <div className="text-green-300 text-[9px] uppercase tracking-[0.15em] font-bold mb-1">
                      Answer
                    </div>
                    <div className="text-green-200 font-bold text-base">{example.answer}</div>
                  </div>
                </div>
              )}

              {/* Steps remaining hint */}
              {revealedSteps > 0 && !allStepsRevealed && (
                <div className="text-center text-white/20 text-xs py-1">
                  {totalSteps - revealedSteps} more step{totalSteps - revealedSteps !== 1 ? "s" : ""} to reveal
                </div>
              )}

              {revealedSteps === 0 && (
                <div className="text-center text-white/20 text-xs py-1">
                  {totalSteps} step{totalSteps !== 1 ? "s" : ""} to work through
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        {!celebrating && (
          <div className="relative px-5 pb-7 pt-3 flex-shrink-0 space-y-2.5">
            {!allStepsRevealed ? (
              <button onClick={revealNextStep}
                className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.bg})`,
                  border: `1px solid ${theme.accent}60`,
                  boxShadow: `0 4px 24px ${theme.accent}40`,
                }}>
                Show me step {revealedSteps + 1} →
              </button>
            ) : showAnswer ? (
              isLastExample ? (
                <button onClick={handleNext}
                  className="tu-ready-btn w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #15803d)",
                    boxShadow: "0 4px 28px rgba(34,197,94,0.45)",
                  }}>
                  🚀 &nbsp; I'm ready — Start practice!
                </button>
              ) : (
                <button onClick={handleNext}
                  className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.bg}cc)`,
                    boxShadow: `0 4px 24px ${theme.accent}40`,
                  }}>
                  Next example → &nbsp;<span className="opacity-50 text-sm font-normal">({exampleIndex + 2}/{totalExamples})</span>
                </button>
              )
            ) : (
              <div className="w-full py-4 rounded-2xl text-center text-white/25 text-sm"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                …
              </div>
            )}

            <div className="text-center">
              <button onClick={onComplete}
                className="text-white/25 hover:text-white/50 text-xs transition-colors">
                Skip tutorial and go straight to practice
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
