// src/components/TutorialModal.tsx
// World-class tutorial modal: Concepts phase → Examples phase → Practice
// Every skill shows its rules FIRST, then worked examples with step-by-step reveal

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TutorialContent } from "@/lib/worksheet/tutorials";
import type { TodaySheet } from "@/types";

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  sheet: TodaySheet;
  content: TutorialContent;
  onComplete: () => void;
}

type Phase = "concepts" | "example" | "celebrate";

const SUBJECT_THEMES: Record<string, { bg: string; accent: string; cardBg: string; icon: string }> = {
  MATH:    { bg: "#0F2744", accent: "#3B82F6", cardBg: "#1E3A5F", icon: "🔢" },
  READING: { bg: "#2D1B5E", accent: "#8B5CF6", cardBg: "#3D2570", icon: "📖" },
  WRITING: { bg: "#064E3B", accent: "#10B981", cardBg: "#065F46", icon: "✏️" },
  SCIENCE: { bg: "#450A0A", accent: "#EF4444", cardBg: "#5E1515", icon: "🔬" },
};

const CELEBRATIONS = ["Great work! 🎉", "Excellent! ⭐", "You got it! 🚀", "Amazing! 💪", "Keep going! 🔥"];

export function TutorialModal({ open, onClose, sheet, content, onComplete }: TutorialModalProps) {
  const [phase, setPhase] = useState<Phase>("concepts");
  const [conceptIndex, setConceptIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mounted, setMounted] = useState(false);

  const subjectSlug = (sheet as any).subjectSlug ?? "MATH";
  const theme = SUBJECT_THEMES[subjectSlug] ?? SUBJECT_THEMES.MATH;

  const concepts = content.concepts ?? [];
  const hasConcepts = concepts.length > 0;
  const concept = concepts[conceptIndex];
  const example = content.examples[exampleIndex];
  const totalExamples = content.examples.length;
  const totalSteps = example?.steps.length ?? 0;
  const allStepsRevealed = revealedSteps >= totalSteps;
  const isLastExample = exampleIndex === totalExamples - 1;
  const isLastConcept = conceptIndex === concepts.length - 1;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase(hasConcepts ? "concepts" : "example");
      setConceptIndex(0);
      setExampleIndex(0);
      setRevealedSteps(0);
      setShowAnswer(false);
    } else {
      setMounted(false);
    }
  }, [open, hasConcepts]);

  useEffect(() => {
    setRevealedSteps(0);
    setShowAnswer(false);
  }, [exampleIndex]);

  function nextConcept() {
    if (!isLastConcept) {
      setConceptIndex(conceptIndex + 1);
    } else {
      setPhase("example");
    }
  }

  function prevConcept() {
    if (conceptIndex > 0) setConceptIndex(conceptIndex - 1);
  }

  function revealNextStep() {
    if (revealedSteps < totalSteps) {
      setRevealedSteps(revealedSteps + 1);
      if (revealedSteps + 1 === totalSteps) {
        setTimeout(() => setShowAnswer(true), 400);
      }
    }
  }

  function handleNext() {
    if (!isLastExample) {
      setPhase("celebrate");
      setTimeout(() => {
        setExampleIndex(exampleIndex + 1);
        setPhase("example");
      }, 1600);
    } else {
      onComplete();
    }
  }

  if (!mounted) return null;

  // ── CONCEPTS PHASE ─────────────────────────────────────────────────────────
  if (phase === "concepts" && concept) {
    return (
      <div
        style={{ backgroundColor: theme.bg }}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      >
        {/* Decorative glowing orbs */}
        <div style={{ backgroundColor: theme.accent }} className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full opacity-10 blur-3xl" />
        <div style={{ backgroundColor: theme.accent }} className="absolute bottom-[-40px] left-[-40px] w-40 h-40 rounded-full opacity-10 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-10 pb-4">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: theme.accent + "33" }} className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl">
              {theme.icon}
            </div>
            <div>
              <div className="text-white/50 text-xs font-medium uppercase tracking-widest">Learn the Rules</div>
              <div className="text-white text-base font-bold">{content.skillName}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-2xl leading-none">×</button>
        </div>

        {/* Concept pills (navigation dots with titles) */}
        <div className="relative z-10 flex gap-2 px-6 pb-4 flex-wrap">
          {concepts.map((c, i) => (
            <button
              key={i}
              onClick={() => setConceptIndex(i)}
              style={{
                backgroundColor: i === conceptIndex ? theme.accent : theme.accent + "22",
                color: i === conceptIndex ? "#fff" : theme.accent,
                borderColor: theme.accent + "44",
              }}
              className="text-xs px-3 py-1 rounded-full border font-medium transition-all duration-200"
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Concept card */}
        <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 overflow-y-auto">
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.accent + "44" }}
            className="rounded-2xl border p-6 flex-1 flex flex-col gap-5"
          >
            {/* Rule title */}
            <div>
              <div style={{ color: theme.accent }} className="text-xs font-bold uppercase tracking-widest mb-1">
                Rule {conceptIndex + 1} of {concepts.length}
              </div>
              <h2 className="text-white text-2xl font-bold leading-tight">{concept.title}</h2>
            </div>

            {/* Formula block */}
            {concept.formula && (
              <div
                style={{ backgroundColor: theme.accent + "18", borderColor: theme.accent + "55" }}
                className="rounded-xl border px-5 py-4"
              >
                <div style={{ color: theme.accent }} className="text-[11px] uppercase tracking-widest font-semibold mb-1">Formula / Key Fact</div>
                <div className="text-white font-mono text-base leading-relaxed whitespace-pre-line">{concept.formula}</div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <div className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">What it means</div>
              <p className="text-white/85 text-base leading-relaxed">{concept.explanation}</p>
            </div>

            {/* Tip */}
            {concept.tip && (
              <div
                style={{ backgroundColor: "#FFD70018", borderColor: "#FFD70044" }}
                className="rounded-xl border px-4 py-3 flex gap-3 items-start"
              >
                <span className="text-xl">💡</span>
                <p className="text-yellow-200 text-sm leading-relaxed">{concept.tip}</p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Navigation */}
            <div className="flex gap-3">
              {conceptIndex > 0 && (
                <button
                  onClick={prevConcept}
                  style={{ borderColor: theme.accent + "55", color: theme.accent }}
                  className="flex-1 border rounded-xl py-3 font-semibold text-sm transition-all"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={nextConcept}
                style={{ backgroundColor: theme.accent }}
                className="flex-1 text-white font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
              >
                {isLastConcept ? "✓ Got it — show me examples →" : `Next: ${concepts[conceptIndex + 1]?.title} →`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CELEBRATE PHASE ────────────────────────────────────────────────────────
  if (phase === "celebrate") {
    const msg = CELEBRATIONS[exampleIndex % CELEBRATIONS.length];
    return (
      <div style={{ backgroundColor: theme.bg }} className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8">
        <div className="text-7xl mb-6 animate-bounce">{["🎉","⭐","🚀","💪","🔥"][exampleIndex % 5]}</div>
        <div className="text-white text-3xl font-extrabold mb-3">{msg}</div>
        <div className="text-white/50 text-base">Example {exampleIndex + 1} complete</div>
        <div className="text-white/30 text-sm mt-3">Next example loading…</div>
      </div>
    );
  }

  // ── EXAMPLE PHASE ──────────────────────────────────────────────────────────
  if (!example) return null;

  return (
    <div style={{ backgroundColor: theme.bg }} className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Decorative orbs */}
      <div style={{ backgroundColor: theme.accent }} className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div style={{ backgroundColor: theme.accent }} className="absolute bottom-[-40px] left-[-40px] w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-10 pb-2">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: theme.accent + "33" }} className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl">
            {theme.icon}
          </div>
          <div>
            <div className="text-white/50 text-xs font-medium uppercase tracking-widest">Worked Example</div>
            <div className="text-white text-base font-bold">{content.skillName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Back to concepts link */}
          {hasConcepts && (
            <button
              onClick={() => { setPhase("concepts"); setConceptIndex(0); }}
              style={{ color: theme.accent }}
              className="text-xs font-semibold opacity-70 hover:opacity-100 transition-opacity"
            >
              ← Rules
            </button>
          )}
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-2xl leading-none">×</button>
        </div>
      </div>

      {/* Example progress pills */}
      <div className="relative z-10 flex gap-2 px-6 py-3">
        {content.examples.map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: i < exampleIndex ? theme.accent : i === exampleIndex ? theme.accent + "CC" : theme.accent + "33",
              width: i === exampleIndex ? 28 : 10,
            }}
            className="h-2.5 rounded-full transition-all duration-300"
          />
        ))}
        <span className="text-white/40 text-xs ml-auto self-center font-medium">
          {exampleIndex + 1} / {totalExamples}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 overflow-y-auto gap-4">

        {/* Problem */}
        <div
          style={{ backgroundColor: theme.cardBg, borderColor: theme.accent + "44" }}
          className="rounded-2xl border p-5"
        >
          <div style={{ color: theme.accent }} className="text-xs font-bold uppercase tracking-widest mb-2">Problem</div>
          <p className="text-white text-lg font-semibold leading-snug">{example.problem}</p>
        </div>

        {/* Steps revealed one by one */}
        <div className="flex flex-col gap-3">
          {example.steps.map((step, i) => {
            if (i >= revealedSteps) return null;
            return (
              <div
                key={i}
                style={{ backgroundColor: theme.accent + "15", borderColor: theme.accent + "33" }}
                className="rounded-xl border px-4 py-3 flex gap-3 items-start"
              >
                <div
                  style={{ backgroundColor: theme.accent, minWidth: 24, minHeight: 24 }}
                  className="rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {i + 1}
                </div>
                <p className="text-white/85 text-sm leading-relaxed">{step}</p>
              </div>
            );
          })}
        </div>

        {/* Answer revealed after all steps */}
        {showAnswer && (
          <div
            style={{ backgroundColor: "#16A34A22", borderColor: "#16A34A55" }}
            className="rounded-2xl border px-5 py-4"
          >
            <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Answer</div>
            <p className="text-green-200 text-xl font-extrabold">{example.answer}</p>
          </div>
        )}

        <div className="flex-1" />

        {/* Action button */}
        {!allStepsRevealed ? (
          <button
            onClick={revealNextStep}
            style={{ backgroundColor: theme.accent }}
            className="w-full text-white font-bold py-4 rounded-xl text-base transition-all active:scale-95"
          >
            Show me step {revealedSteps + 1} →
          </button>
        ) : showAnswer ? (
          <button
            onClick={handleNext}
            style={{ backgroundColor: isLastExample ? "#16A34A" : theme.accent }}
            className="w-full text-white font-extrabold py-4 rounded-xl text-base transition-all active:scale-95"
          >
            {isLastExample ? "🚀 I'm ready — Start practice!" : "Next example →"}
          </button>
        ) : (
          <div
            style={{ borderColor: theme.accent + "44", color: theme.accent }}
            className="w-full border py-4 rounded-xl text-base font-semibold text-center opacity-60"
          >
            Loading answer…
          </div>
        )}
      </div>
    </div>
  );
}
