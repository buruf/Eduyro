// src/lib/grading.ts
// Single source of truth for answer comparison, shared by full-sheet submission
// and the per-question "check as I go" endpoint so both grade identically.

export function normalizeAnswer(answer: string | number): string {
  return String(answer)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*%$/, ""); // "75%" and "75" grade the same (the percent input omits %)
}

export function answersMatch(submitted: string | number, correct: string | number): boolean {
  const a = normalizeAnswer(submitted);
  const b = normalizeAnswer(correct);
  if (a === b) return true;
  // Tolerate spacing differences inside fractions/expressions ("1 / 2" vs "1/2").
  if (a.replace(/\s+/g, "") === b.replace(/\s+/g, "")) return true;
  // Numerically equal answers are correct answers: "0.10" for 0.1, "3.0" for 3,
  // ".5" for 0.5. String comparison marked a child WRONG for writing 0.10 —
  // trailing zeros are a formatting choice, not a math error. Only applies when
  // BOTH sides parse cleanly as numbers, so fractions and worded answers keep
  // their exact-match behaviour.
  const na = parseNumeric(a);
  const nb = parseNumeric(b);
  return na !== null && nb !== null && na === nb;
}

/** Strict numeric parse: plain integers/decimals only (optional sign, commas
 *  allowed as thousands separators). Returns null for anything else — Number()
 *  alone is too permissive ("0x10", "1e3", "") to be a grading rule. */
function parseNumeric(s: string): number | null {
  const cleaned = s.replace(/,/g, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
