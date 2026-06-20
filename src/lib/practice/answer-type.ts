// src/lib/practice/answer-type.ts
// Classifies how a student should INPUT an answer, from the data already on a
// problem (question + options + the correct answer). Runs server-side — the
// client receives only the resulting answerType, never the answer. The practice
// renderer keys off this so it never has to guess the input from the question.

import type { AnswerType } from "@/types";

const TF = new Set(["true", "false"]);

export function classifyAnswerType(args: {
  question: string;
  options?: string[] | null;
  answer: string | number;
  subjectSlug: string;
  levelCode?: string;
}): AnswerType {
  const question = args.question ?? "";
  const opts = args.options ?? null;
  const ans = String(args.answer ?? "").trim();

  // Choice-based first — these never require typing.
  if (opts && opts.length >= 2) {
    const norm = opts.map((o) => o.trim().toLowerCase());
    if (opts.length === 2 && norm.every((o) => TF.has(o))) return "trueFalse";
    return "multipleChoice";
  }

  // Comparison: the answer is a single relational symbol.
  if (/^(<|>|=|≤|≥|≠)$/.test(ans)) return "comparison";

  // Non-math without options → short text (sized input, not a paragraph box).
  if (args.subjectSlug !== "MATH") return "text";

  // ── MATH numeric shapes (order matters: most specific first) ──
  if (/^-?\d+\s+\d+\/\d+$/.test(ans)) return "mixedFraction"; // "1 1/2"
  if (/^-?\d+\/\d+$/.test(ans)) return "fraction";            // "2/5"

  const wantsPercent = ans.endsWith("%") || /percent|%/i.test(question);
  const numericCore = ans.replace(/%$/, "").trim();
  if (wantsPercent && /^-?\d+(\.\d+)?$/.test(numericCore)) return "percent";

  if (/^-?\d+\.\d+$/.test(ans)) return "decimal";            // "0.75"
  if (/^-?\d+$/.test(ans)) return "integer";                 // "42"

  // Algebraic / multi-part answers ("5x", "x = 3", "±1", "3, -3"): keyboard text.
  return "expression";
}
