// src/lib/grading.ts
// Single source of truth for answer comparison, shared by full-sheet submission
// and the per-question "check as I go" endpoint so both grade identically.

export function normalizeAnswer(answer: string | number): string {
  return String(answer).trim().toLowerCase().replace(/\s+/g, " ");
}

export function answersMatch(submitted: string | number, correct: string | number): boolean {
  const a = normalizeAnswer(submitted);
  const b = normalizeAnswer(correct);
  if (a === b) return true;
  // Tolerate spacing differences inside fractions/expressions ("1 / 2" vs "1/2").
  return a.replace(/\s+/g, "") === b.replace(/\s+/g, "");
}
