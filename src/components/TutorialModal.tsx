// src/components/TutorialModal.tsx
// Shown once per skill before the child starts practice
// Tracks seen status in localStorage

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui";
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

export function TutorialModal({ open, onClose, sheet, content, onComplete }: TutorialModalProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = content.examples[exampleIndex];
  const isLast = exampleIndex === content.examples.length - 1;
  const total = content.examples.length;

  function handleNext() {
    if (!isLast) setExampleIndex(exampleIndex + 1);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Before you start — ${content.skillName}`}
      description={`Worked example ${exampleIndex + 1} of ${total}`}
      size="md"
    >
      {/* Intro — shown on first example */}
      {exampleIndex === 0 && (
        <div className="bg-brand-blue-light border border-brand-blue/20 rounded-lg p-3 mb-4 text-sm text-brand-blue leading-relaxed">
          📖 {content.intro}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4 justify-center">
        {content.examples.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all",
              i < exampleIndex ? "w-6 bg-brand-green" :
              i === exampleIndex ? "w-6 bg-brand-blue" :
              "w-2 bg-border"
            )}
          />
        ))}
      </div>

      {/* Worked example */}
      <div className="bg-cream-dark rounded-xl p-4 mb-4">
        {/* Problem */}
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Problem</div>
          <div className="font-serif text-base font-bold whitespace-pre-line">{example.problem}</div>
        </div>

        {/* Steps */}
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">Solution — step by step</div>
          <div className="space-y-1.5">
            {example.steps.map((step, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-brand-blue/15 text-brand-blue text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-ink leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Answer */}
        <div className="bg-brand-green-light border border-brand-green/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-brand-green font-bold text-base">✓</span>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-brand-green/70 mb-0.5">Answer</div>
            <div className="font-serif font-bold text-brand-green">{example.answer}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        {exampleIndex > 0 && (
          <Button
            variant="secondary"
            onClick={() => setExampleIndex(exampleIndex - 1)}
            className="flex-shrink-0"
          >
            ← Back
          </Button>
        )}

        {!isLast ? (
          <Button variant="blue" fullWidth onClick={handleNext}>
            Next example →
          </Button>
        ) : (
          <Button variant="green" fullWidth onClick={onComplete}>
            I'm ready — Start practice →
          </Button>
        )}
      </div>

      {/* Skip option */}
      <div className="text-center mt-3">
        <button
          onClick={onComplete}
          className="text-xs text-muted hover:text-ink transition-colors underline"
        >
          Skip tutorial
        </button>
      </div>
    </Modal>
  );
}
