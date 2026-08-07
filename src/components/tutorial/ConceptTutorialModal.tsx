// src/components/tutorial/ConceptTutorialModal.tsx
// Pre-practice concept tutorial: animated visual + spoken narration +
// key insights + "I get it — Start practising".
// Auto-opens on a student's FIRST visit to a skill; afterwards it's reachable
// via a small "Review tutorial" link.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ConceptTutorial, LESSON_FRAMING } from "@/lib/tutorials/concepts";
import { getTutorial, type MicroLesson } from "@/lib/worksheet/tutorials";
import { getLessonExtras, friendlyGoal } from "@/lib/tutorials/lesson-extras";
import { NarrationConductor } from "@/components/NarrationConductor";
import { useTutorialLog } from "@/hooks/useTutorialLog";
import { MathText } from "@/components/MathText";
import { SpecialTrianglesTable } from "./SpecialTrianglesTable";
import { TutorialVisual, visualForSkill } from "./TutorialVisual";
import { QuestionWithViz } from "@/components/FractionViz";
import dynamic from "next/dynamic";

// Mafs is client-only; load the interactive parabola explorer lazily so it never
// runs during SSR and doesn't bloat the modal for non-quadratics lessons.
const ParabolaSliderExplorer = dynamic(
  () => import("./ParabolaSliderExplorer").then((m) => m.ParabolaSliderExplorer),
  { ssr: false, loading: () => <div className="h-[360px] grid place-items-center text-sm text-muted">Loading explorer…</div> },
);
const UnitCircleExplorer = dynamic(
  () => import("./UnitCircleExplorer").then((m) => m.UnitCircleExplorer),
  { ssr: false, loading: () => <div className="h-[360px] grid place-items-center text-sm text-muted">Loading explorer…</div> },
);

interface Props {
  open: boolean;
  concept: ConceptTutorial;
  subjectSlug: string;
  skillName: string;
  /** Owning student — threads into the tutorial funnel logger (baseline
   *  vs pilot instrumentation, tutorial-redesign-pilot). */
  studentId: string;
  /** The EXACT micro-skill the student is about to practice. When present its
   *  goal / big idea / worked example drive the lesson, so the tutorial always
   *  matches the upcoming questions (council rule). */
  microLesson?: MicroLesson | null;
  /** The worksheet about to be practised. When present the modal fetches worked
   *  examples built from THAT sheet's own problems (one per question form), so
   *  the lesson covers every kind of question on the sheet. */
  worksheetId?: string | null;
  mode: "first" | "review";
  /** Number of questions on the sheet + pass bar — shown on the CTA so the
   *  student knows exactly what's coming ("Ready? You'll solve 20 questions…"). */
  questionCount?: number | null;
  passPct?: number | null;
  onStart: () => void;  // "I get it — Start practising"
  onClose: () => void;  // X / backdrop (review mode mainly)
}

interface SheetExample { problem: string; steps: string[]; answer: string }

// ── Color-coded math ─────────────────────────────────────────
// Coefficients/numbers render blue, superscript exponents orange — color keys
// the eye to the two things the rules act on. Applied to problem lines and the
// rule chain, not prose steps (prose stays readable in ink).
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ⁻";
function ColorMath({ text }: { text: string }) {
  const parts = text.split(new RegExp(`([${SUPS}]+|\\d+(?:\\.\\d+)?)`, "g"));
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (new RegExp(`^[${SUPS}]+$`).test(p)) return <span key={i} className="text-[#c2410c] font-bold">{p}</span>;
        if (/^\d/.test(p)) return <span key={i} className="text-brand-blue font-bold">{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// Cumulative lesson XP lives client-side; the reward is a nudge, not a grade.
const XP_KEY = "bs:lesson-xp";
const XP_PER_LESSON = 20;

export function ConceptTutorialModal({ open, concept, subjectSlug, skillName, studentId, microLesson, worksheetId, mode, questionCount, passPct, onStart, onClose }: Props) {
  // Baseline funnel logging for the EXISTING (old) tutorial — this run's data
  // is the pilot's control group (tutorial-redesign-pilot Task 2).
  const tlog = useTutorialLog({ studentId, skillId: skillName, variant: "old", enabled: open && mode === "first" });
  const openedAtRef = useRef(Date.now());
  const narrationStartedRef = useRef(false);
  const playStartedAtRef = useRef<number | null>(null);
  // audioPlayedMs is stored as a plain field server-side (last write wins on
  // upsert, not accumulated) — so the client must track and send the
  // RUNNING TOTAL across every play/pause segment, not just the latest delta.
  const audioPlayedTotalRef = useRef(0);
  // Worked examples from the sheet the student is about to practise — one per
  // distinct question form, built server-side from the sheet's own problems.
  const [sheetExamples, setSheetExamples] = useState<SheetExample[]>([]);
  useEffect(() => {
    if (!open || !worksheetId) { setSheetExamples([]); return; }
    let alive = true;
    fetch(`/api/worksheet/by-id/${worksheetId}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d?.success && Array.isArray(d.data?.workedExamples)) setSheetExamples(d.data.workedExamples); })
      .catch(() => { /* the curated example still shows */ });
    return () => { alive = false; };
  }, [open, worksheetId]);
  // Every lesson follows the same shape: 🎯 Goal · 💡 Big Idea · 📝 Worked
  // Example (steps) · ✓ Check. When a micro-skill lesson is supplied it wins
  // (its example matches the practice); otherwise fall back to the broad concept.
  const tutorial = useMemo(() => { try { return getTutorial(subjectSlug, skillName); } catch { return null; } }, [subjectSlug, skillName]);
  const framing = LESSON_FRAMING[concept.id];
  const rawGoal = microLesson?.goal ?? concept.goal ?? framing?.goal ?? `Understand and practise ${skillName}.`;
  // Spec-sheet goals ("Differentiates axⁿ") become student-facing ("After this
  // lesson, you'll be able to differentiate axⁿ.").
  const goal = friendlyGoal(rawGoal, skillName);
  // Why-it-matters, the rule as a step chain, common mistakes, memory trick and
  // recap — matched by topic family so every skill gets a real lesson.
  const extras = useMemo(() => getLessonExtras(skillName, microLesson?.umbrella), [skillName, microLesson?.umbrella]);
  const rawBigIdea = microLesson?.bigIdea ?? concept.bigIdea ?? framing?.bigIdea ?? tutorial?.concepts?.[0]?.explanation ?? tutorial?.intro ?? concept.bullets[0];
  // Drop a spec-ish big idea ("Student differentiates axⁿ") — it teaches
  // nothing; the Rule chain below carries the idea instead.
  const bigIdeaIsSpec = !!rawBigIdea && (/^students?\s/i.test(rawBigIdea.trim()) || rawBigIdea.trim().toLowerCase() === rawGoal.trim().toLowerCase());
  const bigIdea = bigIdeaIsSpec && extras.rule.length ? null : rawBigIdea;
  const example = microLesson?.example ?? tutorial?.examples?.[0] ?? null;
  // One-line orientation to the parent level (council: keep the "why" cheap).
  const umbrella = microLesson?.umbrella && microLesson.umbrella !== skillName ? microLesson.umbrella : null;
  // Narrate the micro-skill (goal → big idea → worked example) when supplied, so
  // what the student HEARS matches what they'll practise; else the concept script.
  // Written to sound like a TEACHER talking, not a spec sheet: warm opening
  // ("Today we are going to cover …"), walks the example, points at the extra
  // per-question-kind examples, and hands off with encouragement.
  // The narration script is built from the SAME parts shown on screen, and each
  // part's character count is kept so the conductor can highlight the matching
  // card while the teacher reads it (no separate transcript — the info is
  // already on the page).
  const narration = useMemo(() => {
    const topic = (microLesson ? skillName : concept.title).replace(/\s*\(.*?\)\s*/g, " ").trim();
    const intro = `Hi there! Today we are going to cover ${topic}.`;
    const outro = ` Remember, you can come back to this lesson any time by tapping See examples. When you're ready, press Start practising. You've got this!`;
    if (!microLesson) {
      const t = `${intro} ${concept.narration}${outro}`;
      return { text: t, sections: [{ id: "", chars: t.length }] };
    }
    const ex = microLesson.example;
    const parts: { id: string; text: string }[] = [
      { id: "goal", text: `${intro} ${goal}` },
      { id: "why", text: extras.why ? ` Why does this matter? ${extras.why}` : "" },
      { id: "rule", text: (extras.rule.length ? ` Here's how to solve it, step by step: ${extras.rule.join(". Then, ")}.` : bigIdea ? ` Here's the big idea: ${bigIdea}` : "") + (extras.trick ? ` A trick to remember it: ${extras.trick}` : "") },
      { id: "example", text: ex?.steps?.length ? ` Let's work through an example together. ${ex.problem}. ${ex.steps.join(". ")}. So the answer is ${ex.answer}.` : "" },
      { id: "cta", text: (sheetExamples.length > 1 ? ` And don't worry — there's a worked example for every kind of question on today's sheet, so nothing will surprise you.` : "") + outro },
    ];
    return { text: parts.map((p) => p.text).join(""), sections: parts.filter((p) => p.text).map((p) => ({ id: p.id, chars: p.text.length })) };
  }, [microLesson, concept.narration, concept.title, skillName, goal, bigIdea, extras, sheetExamples.length]);
  // Whether the narration is currently playing — freezes the animated visual in
  // step with the voice (NarrationConductor reports this).
  const [paused, setPaused] = useState(true);
  // Which lesson card the teacher is currently reading — highlighted in place.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const setSec = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };
  useEffect(() => {
    if (!activeSection) return;
    sectionRefs.current[activeSection]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSection]);
  // Ring around the card being read.
  const secCls = (id: string) => (activeSection === id ? " ring-2 ring-brand-blue/50 rounded-xl" : "");
  // One worked example at a time keeps focus (council + user rule #13).
  const [exIdx, setExIdx] = useState(0);
  // Self-assessment before practice; "confused" rewinds to the first example.
  const [confidence, setConfidence] = useState<"got" | "almost" | "confused" | null>(null);
  // Prediction interaction: which option was picked (null = not yet).
  const [predictPick, setPredictPick] = useState<number | null>(null);
  // Lesson-complete celebration (+XP) shown briefly before practice starts.
  const [celebrate, setCelebrate] = useState<number | null>(null); // total XP
  // Bumped to ask the read-along to replay from the top (e.g. "I'm confused").
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    if (open) {
      setExIdx(0); setConfidence(null); setPredictPick(null); setCelebrate(null);
      openedAtRef.current = Date.now();
      narrationStartedRef.current = false;
      playStartedAtRef.current = null;
      audioPlayedTotalRef.current = 0;
    }
  }, [open, skillName]);

  if (!open) return null;

  // X / backdrop close without ever hitting "Start practising" — records the
  // skip that the pilot is trying to reduce. No-op when mode !== "first"
  // (tlog is disabled, so its calls are inert) or the lesson already finished.
  const handleClose = () => {
    if (mode === "first" && celebrate === null) {
      tlog.log({ skipTapped: true, skipAtMs: Date.now() - openedAtRef.current });
      tlog.end();
    }
    onClose();
  };

  const finish = () => {
    tlog.log({ beatIndex: 4 });
    tlog.end();
    // First completion of a lesson earns XP + a short celebration; review
    // visits skip straight back to practice.
    if (mode !== "first") { onStart(); return; }
    let total = XP_PER_LESSON;
    try {
      total = (parseInt(localStorage.getItem(XP_KEY) ?? "0", 10) || 0) + XP_PER_LESSON;
      localStorage.setItem(XP_KEY, String(total));
    } catch { /* storage unavailable — still celebrate */ }
    setCelebrate(total);
    setTimeout(onStart, 1400);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* z-[60]: must paint ABOVE the practice modal (z-50) — the lesson is now
          reachable mid-practice via the "See examples" button. */}
      <div className="absolute inset-0 bg-ink/60" onClick={mode === "review" ? handleClose : undefined} />
      {/* overflow-anchor:none — the read-along transcript scrolls internally
          during narration, and Chrome's scroll anchoring was "helpfully"
          scrolling the MODAL down in sympathy (student saw the page jump to the
          bottom while the teacher was still reading the top). */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto [overflow-anchor:none]">
        {/* Header */}
        <div className="bg-ink text-cream px-6 py-4 rounded-t-2xl flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-mid mb-1">
              {umbrella ? `${umbrella} · ` : ""}{mode === "first" ? "quick lesson first" : "lesson review"}
            </div>
            <h2 className="font-serif text-xl font-bold leading-tight">{microLesson ? skillName : concept.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-cream/60 hover:text-cream text-xl leading-none mt-1"
            aria-label="Close tutorial"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* 🎯 Goal — student-facing ("After this lesson, you'll be able to…") */}
          <section ref={setSec("goal")} className={`mb-3 p-1 -m-1${secCls("goal")}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1">🎯 Goal</div>
            <p className="text-sm text-ink leading-snug">{goal}</p>
          </section>

          {/* 🌍 Why it matters — one short paragraph, before any HOW */}
          {extras.why && (
            <section ref={setSec("why")} className={`mb-3 p-1 -m-1${secCls("why")}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-green mb-1">🌍 Why it matters</div>
              <p className="text-sm text-ink/80 leading-snug">{extras.why}</p>
            </section>
          )}

          {/* 📐 The Rule — the core idea as a memorable step chain */}
          {extras.rule.length > 0 ? (
            <section ref={setSec("rule")} className={`mb-4 rounded-xl border border-brand-blue/20 p-3${secCls("rule")}`} style={{ backgroundColor: "rgba(27,79,138,0.05)" }}>
              {/* "How to solve it", not "The Rule" — the goal is a repeatable
                  decision procedure, not a memorized rule (user direction). */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-2">🧭 How to solve it</div>
              <div className="flex flex-col items-center gap-0.5">
                {extras.rule.map((r, i) => (
                  <div key={i} className="contents">
                    {i > 0 && <span aria-hidden className="text-brand-blue/50 text-sm leading-none">↓</span>}
                    <div className={`text-center text-sm leading-snug px-3 py-1 rounded-md ${i === 0 ? "font-serif font-bold text-ink bg-white border border-brand-blue/30" : "text-ink"}`}><ColorMath text={r} /></div>
                  </div>
                ))}
              </div>
              {extras.trick && (
                <p className="mt-2 text-center text-[12px] text-gold-dark font-semibold">💭 {extras.trick}</p>
              )}
            </section>
          ) : bigIdea ? (
            <section className="mb-4 rounded-xl border border-brand-blue/20 p-3" style={{ backgroundColor: "rgba(27,79,138,0.05)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1">💡 Big Idea</div>
              <p className="text-sm text-ink leading-snug">{bigIdea}</p>
            </section>
          ) : null}

          {/* Visual — resolved from the MICRO-SKILL being taught (visualForSkill),
              so the animation always demonstrates this lesson's topic. When
              nothing genuinely fits, the card is HIDDEN for micro-lessons — a
              wrong animation misleads (user-reported: M14 composition showed the
              generic level visual). Broad concept lessons keep the level visual. */}
          {(() => {
            const sv = visualForSkill(skillName);
            const body = (() => {
              if (sv?.kind === "explorer" && sv.which === "parabola") return (
                <>
                  <ParabolaSliderExplorer />
                  <p className="text-center text-[11px] text-gold-dark font-semibold mt-1">☝ This one&rsquo;s interactive — drag the sliders!</p>
                </>
              );
              if (sv?.kind === "explorer" && sv.which === "unitCircle") return (
                <>
                  <UnitCircleExplorer />
                  <p className="text-center text-[11px] text-gold-dark font-semibold mt-1">☝ This one&rsquo;s interactive — drag the point around the circle!</p>
                </>
              );
              if (sv?.kind === "factStrategy") return <TutorialVisual visual="factStrategy" strategy={sv.strategy} paused={paused} />;
              if (sv?.kind === "visual") return <TutorialVisual visual={sv.name} paused={paused} />;
              // No honest match. Micro-lessons hide the card; broad concept
              // lessons (level intro / non-math) keep their curated visual.
              if (microLesson) return null;
              return (
                <>
                  <TutorialVisual visual={concept.visual} paused={paused} />
                  {concept.interactive && (
                    <p className="text-center text-[11px] text-gold-dark font-semibold mt-1">☝ This one&rsquo;s interactive — try the slider{concept.visual === "linearGraph" ? "s" : ""}!</p>
                  )}
                </>
              );
            })();
            return body ? <div className="bg-cream-dark border border-border rounded-xl p-3 mb-4">{body}</div> : null;
          })()}

          {/* The two special triangles + exact-value table — THE thing to
              memorise for special-angle trig (user-provided reference card). */}
          {/unit.circle|standard angle|right.triangle|sohcahtoa|degrees to radians/i.test(skillName) && (
            <div className="bg-cream-dark border border-border rounded-xl p-3 mb-4">
              <SpecialTrianglesTable />
            </div>
          )}

          {/* Narration — compact control; the teacher's voice highlights the
              REAL lesson cards in place as each part is read (the transcript
              box was redundant). `paused` freezes the animated visual too. */}
          <div className="mb-4">
            <NarrationConductor text={narration.text} sections={narration.sections} autoPlay replayNonce={replay}
              onSection={setActiveSection} onPlayingChange={(p) => {
                setPaused(!p);
                if (p) {
                  if (!narrationStartedRef.current) { narrationStartedRef.current = true; tlog.log({ beatIndex: 1 }); }
                  playStartedAtRef.current = Date.now();
                } else if (playStartedAtRef.current !== null) {
                  const delta = Date.now() - playStartedAtRef.current;
                  playStartedAtRef.current = null;
                  if (delta > 0) {
                    audioPlayedTotalRef.current += delta;
                    tlog.log({ audioPlayedMs: audioPlayedTotalRef.current });
                  }
                }
              }} />
          </div>

          {/* 🤔 Predict first — a tiny interaction before the examples locks the
              rule in ("what happens first?"). Wrong picks explain and let the
              student try again. */}
          {extras.predict && (
            <section className="mb-4 border border-border rounded-xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-blue mb-1.5">🤔 You predict</div>
              <p className="text-sm font-semibold text-ink mb-2"><ColorMath text={extras.predict.q} /></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {extras.predict.options.map((opt, i) => {
                  const picked = predictPick === i;
                  const isRight = i === extras.predict!.correct;
                  const answered = predictPick !== null && predictPick === extras.predict!.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => setPredictPick(i)}
                      disabled={answered}
                      className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                        picked && isRight ? "bg-brand-green/10 border-brand-green text-brand-green font-semibold"
                          : picked ? "bg-brand-red/5 border-brand-red/50 text-brand-red"
                          : "border-border hover:border-brand-blue/50"
                      }`}
                    >
                      {picked ? (isRight ? "✓ " : "✗ ") : ""}{opt}
                    </button>
                  );
                })}
              </div>
              {predictPick !== null && (
                <p className={`text-xs mt-2 ${predictPick === extras.predict.correct ? "text-brand-green font-semibold" : "text-muted"}`}>
                  {predictPick === extras.predict.correct
                    ? "Exactly right — now watch it in action below."
                    : "Not quite — look at the Rule above, then try again."}
                </p>
              )}
            </section>
          )}

          {/* 📝 Worked Examples + ✓ Check — the curated micro-lesson example
              first, then one example PER QUESTION FORM from the actual sheet the
              student is about to practise (fetched), so every kind of question
              on the sheet is demonstrated before practice. */}
          {(() => {
            const curated: SheetExample[] = example ? [{ problem: example.problem, steps: example.steps ?? [], answer: example.answer ?? "" }] : [];
            const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
            const extras = sheetExamples.filter((ex) => !curated.some((c) => norm(c.problem) === norm(ex.problem)));
            const all = [...curated, ...extras];
            if (all.length === 0) return null;
            // The scaffold's last step often restates the answer — drop it, the
            // ✓ Check line below already shows the answer.
            const cleanSteps = (steps: string[]) =>
              steps.filter((s, i) => !(i === steps.length - 1 && /^(answer|the correct)/i.test(s.trim())));
            // ONE example at a time — students stay focused (Next/Back stepper).
            const safe = Math.min(exIdx, all.length - 1);
            const ex = all[safe];
            return (
              <section ref={setSec("example")} className={`mb-4 border border-border rounded-xl overflow-hidden${secCls("example")}`}>
                <div className="bg-ink/[0.04] px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    📝 Worked Example {all.length > 1 ? `${safe + 1} of ${all.length} — one of each kind you'll practise` : ""}
                  </span>
                  {all.length > 1 && (
                    <span className="flex gap-1" aria-hidden>
                      {all.map((_, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= safe ? "bg-brand-blue" : "bg-border"}`} />
                      ))}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {/* QuestionWithViz: renders any [[viz]] figure AND stacks
                      fractions via KaTeX (1/(x−4) reads as 1 over x−4). */}
                  <p className="font-serif font-semibold text-ink mb-2"><QuestionWithViz text={ex.problem} size={56} /></p>
                  <ol className="space-y-1.5">
                    {cleanSteps(ex.steps).map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink leading-snug">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-brand-blue text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <MathText>{s}</MathText>
                      </li>
                    ))}
                  </ol>
                  {ex.answer && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="font-bold text-brand-green">✓ Check</span>
                      {/* MathText: answers can be LaTeX (\frac{3}{4}) — students
                          saw the raw markup as literal text. */}
                      <span className="text-ink">Answer: <MathText className="font-semibold">{ex.answer}</MathText></span>
                    </div>
                  )}
                  {all.length > 1 && (
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setExIdx(Math.max(0, safe - 1))}
                        disabled={safe === 0}
                        className="text-sm font-semibold text-brand-blue disabled:text-muted/40 px-3 py-1.5 rounded-lg hover:bg-brand-blue/5 disabled:hover:bg-transparent"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setExIdx(Math.min(all.length - 1, safe + 1))}
                        disabled={safe === all.length - 1}
                        className="text-sm font-semibold text-white bg-brand-blue disabled:bg-border px-4 py-1.5 rounded-lg hover:bg-brand-blue/90"
                      >
                        Next example →
                      </button>
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ⚠ Common mistakes — errors teach almost as much as examples */}
          {extras.mistakes.length > 0 && (
            <section className="mb-4 border border-brand-red/25 rounded-xl p-4" style={{ backgroundColor: "rgba(178,52,52,0.04)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-red mb-2">⚠ Common mistakes</div>
              <ul className="space-y-2">
                {extras.mistakes.map((m, i) => (
                  <li key={i} className="text-sm leading-snug">
                    <div className="flex items-start gap-2 text-ink/75"><span className="text-brand-red font-bold mt-0.5">✗</span><span>{m.wrong}</span></div>
                    <div className="flex items-start gap-2 text-ink mt-0.5"><span className="text-brand-green font-bold mt-0.5">✓</span><span>{m.right}</span></div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 🧠 Quick recap — the 2–3 things to remember */}
          <div className="border border-gold/30 rounded-xl p-4 mb-4" style={{ backgroundColor: "rgba(200,144,42,0.07)" }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold-dark mb-2">🧠 Remember</div>
            <ul className="space-y-1.5">
              {(extras.recap.length ? extras.recap : concept.bullets.slice(0, 3)).map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink leading-snug">
                  <span className="text-gold font-bold mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Confidence check — confused replays the lesson from the top */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 text-center">How confident are you?</div>
            <div className="flex gap-2 justify-center" role="group" aria-label="Confidence check">
              {([["got", "😀 I got it"], ["almost", "🙂 Almost"], ["confused", "😟 I'm confused"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => {
                    setConfidence(k);
                    if (k === "confused") { setExIdx(0); setReplay((n) => n + 1); }
                  }}
                  aria-pressed={confidence === k}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    confidence === k ? "bg-brand-blue text-white border-brand-blue" : "bg-white border-border hover:border-brand-blue/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {confidence === "confused" && (
              <p className="text-center text-xs text-muted mt-2">No problem — the lesson is replaying. Step through the examples again, then try when you&rsquo;re ready.</p>
            )}
          </div>

          {/* CTA — the student knows exactly what's coming */}
          <button
            ref={setSec("cta") as (el: HTMLButtonElement | null) => void}
            onClick={finish}
            className={`w-full bg-gold text-white font-semibold px-4 py-3 rounded-xl hover:bg-gold-dark transition-colors text-base${secCls("cta")}`}
          >
            <span className="block">{mode === "first" ? "I'm ready — Start practising →" : "Back to practising →"}</span>
            {mode === "first" && questionCount ? (
              <span className="block text-[11px] font-normal text-white/80 mt-0.5">
                {questionCount} questions · score {passPct ?? 90}% to pass — you can do it!
              </span>
            ) : null}
          </button>
        </div>

        {/* 🎉 Lesson-complete celebration — brief overlay, then practice opens */}
        {celebrate !== null && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-white/95 flex items-center justify-center" role="status">
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="text-5xl mb-2">🎉</div>
              <div className="font-serif text-xl font-bold text-ink mb-1">Lesson complete!</div>
              <div className="text-brand-green font-bold text-lg">+{XP_PER_LESSON} XP</div>
              <div className="text-xs text-muted mt-1">Total lesson XP: {celebrate}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
