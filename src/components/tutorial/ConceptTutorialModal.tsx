// src/components/tutorial/ConceptTutorialModal.tsx
// Pre-practice concept tutorial: animated visual + spoken narration +
// key insights + "I get it — Start practising".
// Auto-opens on a student's FIRST visit to a skill; afterwards it's reachable
// via a small "Review tutorial" link.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ConceptTutorial, LESSON_FRAMING } from "@/lib/tutorials/concepts";
import { getTutorial, type MicroLesson } from "@/lib/worksheet/tutorials";
import { createNarrator } from "@/lib/tutorials/narrator";
import { TutorialVisual } from "./TutorialVisual";
import dynamic from "next/dynamic";

// Mafs is client-only; load the interactive parabola explorer lazily so it never
// runs during SSR and doesn't bloat the modal for non-quadratics lessons.
const ParabolaSliderExplorer = dynamic(
  () => import("./ParabolaSliderExplorer").then((m) => m.ParabolaSliderExplorer),
  { ssr: false, loading: () => <div className="h-[360px] grid place-items-center text-sm text-muted">Loading explorer…</div> },
);

interface Props {
  open: boolean;
  concept: ConceptTutorial;
  subjectSlug: string;
  skillName: string;
  /** The EXACT micro-skill the student is about to practice. When present its
   *  goal / big idea / worked example drive the lesson, so the tutorial always
   *  matches the upcoming questions (council rule). */
  microLesson?: MicroLesson | null;
  mode: "first" | "review";
  onStart: () => void;  // "I get it — Start practising"
  onClose: () => void;  // X / backdrop (review mode mainly)
}

export function ConceptTutorialModal({ open, concept, subjectSlug, skillName, microLesson, mode, onStart, onClose }: Props) {
  const narrator = useMemo(() => createNarrator(), []);
  // Every lesson follows the same shape: 🎯 Goal · 💡 Big Idea · 📝 Worked
  // Example (steps) · ✓ Check. When a micro-skill lesson is supplied it wins
  // (its example matches the practice); otherwise fall back to the broad concept.
  const tutorial = useMemo(() => { try { return getTutorial(subjectSlug, skillName); } catch { return null; } }, [subjectSlug, skillName]);
  const framing = LESSON_FRAMING[concept.id];
  const goal = microLesson?.goal ?? concept.goal ?? framing?.goal ?? `Understand and practise ${skillName}.`;
  const bigIdea = microLesson?.bigIdea ?? concept.bigIdea ?? framing?.bigIdea ?? tutorial?.concepts?.[0]?.explanation ?? tutorial?.intro ?? concept.bullets[0];
  const example = microLesson?.example ?? tutorial?.examples?.[0] ?? null;
  // One-line orientation to the parent level (council: keep the "why" cheap).
  const umbrella = microLesson?.umbrella && microLesson.umbrella !== skillName ? microLesson.umbrella : null;
  // Narrate the micro-skill (goal → big idea → worked example) when supplied, so
  // what the student HEARS matches what they'll practise; else the concept script.
  const narrationText = useMemo(() => {
    if (!microLesson) return concept.narration;
    const ex = microLesson.example;
    const steps = ex?.steps?.length ? ` Here's an example. ${ex.problem}. ${ex.steps.join(". ")}. The answer is ${ex.answer}.` : "";
    return `${goal} ${bigIdea}${steps}`;
  }, [microLesson, concept.narration, goal, bigIdea]);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const startedRef = useRef(false);

  // Auto-play narration when the modal opens (best-effort; browsers may
  // require a click first — the ▶ button covers that case).
  useEffect(() => {
    if (!open) { narrator.stop(); setSpeaking(false); setPaused(false); startedRef.current = false; return; }
    if (!startedRef.current) {
      startedRef.current = true;
      setSpeaking(true);
      narrator.speak(narrationText, () => { setSpeaking(false); setPaused(false); });
    }
    return () => narrator.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, concept.id, skillName]);

  if (!open) return null;

  const play = () => {
    narrator.stop();
    setSpeaking(true); setPaused(false);
    narrator.speak(concept.narration, () => { setSpeaking(false); setPaused(false); });
  };
  const togglePause = () => {
    if (paused) { narrator.resume(); setPaused(false); }
    else { narrator.pause(); setPaused(true); }
  };
  const finish = () => { narrator.stop(); onStart(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={mode === "review" ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-ink text-cream px-6 py-4 rounded-t-2xl flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-mid mb-1">
              {umbrella ? `${umbrella} · ` : ""}{mode === "first" ? "quick lesson first" : "lesson review"}
            </div>
            <h2 className="font-serif text-xl font-bold leading-tight">{microLesson ? skillName : concept.title}</h2>
          </div>
          <button
            onClick={() => { narrator.stop(); onClose(); }}
            className="text-cream/60 hover:text-cream text-xl leading-none mt-1"
            aria-label="Close tutorial"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* 🎯 Goal */}
          <section className="mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1">🎯 Goal</div>
            <p className="text-sm text-ink leading-snug">{goal}</p>
          </section>

          {/* 💡 Big Idea */}
          {bigIdea && (
            <section className="mb-4 rounded-xl border border-brand-blue/20 p-3" style={{ backgroundColor: "rgba(27,79,138,0.05)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1">💡 Big Idea</div>
              <p className="text-sm text-ink leading-snug">{bigIdea}</p>
            </section>
          )}

          {/* Visual — quadratics gets the live, draggable parabola explorer
              (explore a/b/c); every other concept keeps its animated visual. */}
          <div className="bg-cream-dark border border-border rounded-xl p-3 mb-4">
            {concept.id === "quadratics" ? (
              <>
                <ParabolaSliderExplorer />
                <p className="text-center text-[11px] text-gold-dark font-semibold mt-1">
                  ☝ This one&rsquo;s interactive — drag the sliders!
                </p>
              </>
            ) : (
              <>
                <TutorialVisual visual={concept.visual} paused={paused} />
                {concept.interactive && (
                  <p className="text-center text-[11px] text-gold-dark font-semibold mt-1">
                    ☝ This one&rsquo;s interactive — try the slider{concept.visual === "linearGraph" ? "s" : ""}!
                  </p>
                )}
              </>
            )}
          </div>

          {/* Narration controls */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={speaking ? togglePause : play}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
            >
              {speaking ? (paused ? "▶ Resume" : "⏸ Pause") : "▶ Play the lesson"}
            </button>
            {speaking && !paused && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                Your teacher is talking…
              </span>
            )}
            {narrator.isFallback && (
              <span className="ml-auto text-[10px] text-muted" title="Using the browser's built-in voice. A premium natural voice can be plugged in later.">
                browser voice
              </span>
            )}
          </div>

          {/* 📝 Worked Example + ✓ Check */}
          {example && (
            <section className="mb-5 border border-border rounded-xl overflow-hidden">
              <div className="bg-ink/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted">📝 Worked Example</div>
              <div className="p-4">
                <p className="font-serif font-semibold text-ink mb-2">{example.problem}</p>
                <ol className="space-y-1.5">
                  {example.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink leading-snug">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-blue text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {example.answer && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="font-bold text-brand-green">✓ Check</span>
                    <span className="text-ink">Answer: <span className="font-semibold">{example.answer}</span></span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Key insights */}
          <div className="bg-gold/8 border border-gold/30 rounded-xl p-4 mb-5" style={{ backgroundColor: "rgba(200,144,42,0.07)" }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold-dark mb-2">Key insights</div>
            <ul className="space-y-1.5">
              {concept.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink leading-snug">
                  <span className="text-gold font-bold mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={finish}
            className="w-full bg-gold text-white font-semibold px-4 py-3.5 rounded-xl hover:bg-gold-dark transition-colors text-base"
          >
            {mode === "first" ? "I get it — Start practising →" : "Back to practising →"}
          </button>
        </div>
      </div>
    </div>
  );
}
