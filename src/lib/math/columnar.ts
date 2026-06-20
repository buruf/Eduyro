// src/lib/math/columnar.ts
// Decides whether an arithmetic problem should be shown STACKED (vertical,
// place-value aligned) the way written computation is taught in school, vs.
// left horizontal for early number facts.
//
//   74 + 6   →   stacked        2 + 1   →   horizontal (single-digit fact)
//   47 + 38  →   stacked        7 × 8   →   horizontal (times-table fact)
//   24 × 3   →   stacked        12 ÷ 3  →   horizontal (division is not stacked here)
//
// Shared by the PDF renderer (print) and the student practice UI (web) so both
// presentations match.

export interface Columnar {
  top: string;
  op: "+" | "−" | "×";
  bottom: string;
}

/**
 * Returns the stacked form when the problem is a two-operand +, −, or × where at
 * least one operand has two or more digits (i.e. written computation matters).
 * Returns null for single-digit facts, division, missing-operand blanks, algebra,
 * or anything that isn't a plain "a OP b" — those stay horizontal.
 */
export function parseColumnar(question: string): Columnar | null {
  const q = question.replace(/\s+/g, " ").trim().replace(/=\s*$/, "").trim();
  // Accept ASCII "-" and the unicode minus "−"; normalise the operator to "−".
  const m = q.match(/^(\d+)\s*([+−\-×])\s*(\d+)$/);
  if (!m) return null;
  const [, top, rawOp, bottom] = m;
  if (top.length < 2 && bottom.length < 2) return null; // single-digit fact → horizontal
  const op = rawOp === "+" ? "+" : rawOp === "×" ? "×" : "−";
  return { top, op, bottom };
}

export interface LongDivision {
  divisor: string;
  dividend: string;
}

/**
 * Returns the long-division form for a plain "a ÷ b" (rendered as b ) a with the
 * quotient bar). Missing-operand blanks ("a ÷ ___ = c") and anything that isn't a
 * clean two-number division return null and stay horizontal.
 */
export function parseLongDivision(question: string): LongDivision | null {
  const q = question.replace(/\s+/g, " ").trim().replace(/=\s*$/, "").trim();
  const m = q.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (!m) return null;
  return { dividend: m[1], divisor: m[2] };
}
