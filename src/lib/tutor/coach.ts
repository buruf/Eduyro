// src/lib/tutor/coach.ts
// THE coaching path — what a child actually sees after a wrong answer.
//
// This was inline in the student page, which meant the audit that was supposed
// to police teaching depth measured something else: raw buildScaffold, without
// the worked-example fallback the page applies on top. The two drifted, and a
// broken fallback went unnoticed because the only thing watching it was
// looking at a different function.
//
// One path now. The page renders what this returns, and the audit grades what
// this returns, so "the audit passes" and "the child is taught" cannot come
// apart again.
import { buildScaffold, type Scaffold } from "./scaffold";
import { getMicroSkillLesson } from "@/lib/worksheet/tutorials";

export interface CoachInput {
  question: string;
  correctAnswer: string;
  /** What the child typed/chose, if anything — used to address them directly. */
  studentAnswer?: string;
  subjectSlug: string;
  levelCode: string;
  skillName: string;
  /** Per-item explanation, when the content bank ships one. */
  explanation?: string;
}

/**
 * Coach one wrong answer.
 *
 * First ask the scaffold, which knows how to work a great many question forms.
 * When it does not recognise the question it says so (`generic`), and rather
 * than falling back to "the correct answer is X" we teach the unit's authored
 * worked example — a similar problem, fully worked — and only then give the
 * answer. That keeps every question form coached without per-form authoring.
 */
export function coachFor(input: CoachInput): Scaffold {
  const { question, correctAnswer, studentAnswer = "", subjectSlug, levelCode, skillName, explanation } = input;

  const sc = buildScaffold(question, correctAnswer, studentAnswer, {
    subjectSlug,
    explanation,
    directive: skillName,
  });
  if (!sc.generic) return sc;

  const ex = getMicroSkillLesson(subjectSlug, levelCode, skillName)?.example;
  if (!ex?.steps?.length) return sc;

  return {
    explanation: studentAnswer
      ? `You answered ${studentAnswer}. Let's walk through a similar example first.`
      : `Let's walk through a similar example first.`,
    hints: [
      `Similar example: ${ex.problem}`,
      ...ex.steps,
      `The example's answer is ${ex.answer}. Use the SAME steps on yours — the correct answer is ${correctAnswer}.`,
    ],
    answer: correctAnswer,
  };
}

/** A hint that states no method — the audit's definition of "not teaching". */
export function isBlandHint(s: string): boolean {
  return /^(answer|the correct|remember|think about|read the question|re-read the question|rule out)/i.test(s.trim());
}

/** How many hints actually teach a method, as opposed to nudging or revealing. */
export function teachingDepth(sc: Scaffold): number {
  return sc.hints.filter((h) => !isBlandHint(h)).length;
}
