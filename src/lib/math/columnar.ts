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
  // Operands may be whole numbers or decimals (e.g. "0.51 − 0.20").
  const m = q.match(/^(\d+(?:\.\d+)?)\s*([+−\-×])\s*(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const [, top, rawOp, bottom] = m;
  const op = rawOp === "+" ? "+" : rawOp === "×" ? "×" : "−";

  if (top.includes(".") || bottom.includes(".")) {
    // Decimals: stack add/subtract (so the decimal points line up the way
    // column arithmetic is taught) but ONLY when there's more than 2 digits —
    // simple tenths like "0.6 − 0.3" stay horizontal. Decimal × stays inline
    // (it isn't decimal-point aligned). Comparison stems never reach here.
    if (op === "×") return null;
    const digitCount = (s: string) => s.replace(/\D/g, "").length;
    if (Math.max(digitCount(top), digitCount(bottom)) <= 2) return null;
    return { top, op, bottom };
  }

  // Whole numbers: stack unless it's a single-digit fact.
  if (top.length < 2 && bottom.length < 2) return null;
  return { top, op, bottom };
}

// A general stacked (vertical) form that also handles missing-operand equations
// and 3+ addends, so a whole multi-digit sheet can stack uniformly and every
// answer slot lands in the same aligned column.
export interface Stack {
  rows: (string | null)[]; // operands top→bottom; null = a blank the student fills
  op: "+" | "−" | "×";
  belowGiven: string | null; // number shown under the rule (given total in a missing-addend eq)
  belowBlank: boolean;       // true = the student writes the result under the rule
}

// Returns a stacked form for a whole-number problem when a known operand has at
// least `minKnownDigits` digits. Default 2 → single-digit facts stay horizontal.
// The renderer decides the threshold PER SHEET: on a multi-digit sheet it passes
// 1 so even a single-digit spiral-review problem stacks (keeps the sheet uniform).
// Handles: "a + b", "a + b + c", "a + ___ = c", "___ + b = c" (and −, × for the
// two-operand forms). Decimals are supported (they read as multi-digit).
export function parseStack(question: string, minKnownDigits = 2): Stack | null {
  let q = question.replace(/\s+/g, " ").trim().replace(/=\s*\?\s*$/, "").trim();
  let body = q;
  let resultTok: string | null = null;
  const eq = q.match(/^(.*?)\s*=\s*(___|[\d.]+)\s*$/);
  if (eq) { body = eq[1].trim(); resultTok = eq[2]; }

  const opCh = body.match(/[+\-−×]/);
  if (!opCh) return null;
  const op: "+" | "−" | "×" = opCh[0] === "+" ? "+" : opCh[0] === "×" ? "×" : "−";
  const splitRe = op === "+" ? /\+/ : op === "×" ? /×/ : /[-−]/;
  const parts = body.split(splitRe).map(t => t.trim());
  if (parts.length < 2) return null;
  if ((op === "−" || op === "×") && parts.length !== 2) return null; // only + chains 3+

  const rows: (string | null)[] = [];
  for (const p of parts) {
    if (p === "___" || p === "") rows.push(null);
    else if (/^[\d.]+$/.test(p)) rows.push(p);
    else return null; // algebra / non-numeric → don't stack
  }

  let belowGiven: string | null = null;
  let belowBlank = false;
  if (resultTok === null || resultTok === "___") belowBlank = true; // answer written below the rule
  else belowGiven = resultTok;                                      // total given (missing-addend eq)

  const hasBlankRow = rows.some(r => r === null);
  if (hasBlankRow && belowGiven === null) return null; // a blank operand needs the total shown

  // Stack only for multi-digit — base the decision on the KNOWN operands (a
  // single-digit fact whose sum happens to be two digits, e.g. 9+__=13, stays flat).
  const knownDigits = rows.filter((r): r is string => !!r).map(n => n.replace(/\D/g, "").length);
  if (Math.max(0, ...knownDigits) < minKnownDigits) return null;

  return { rows, op, belowGiven, belowBlank };
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
