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

/** Same normalization MINUS the lowercasing, for questions where case IS the
 *  lesson (capitalization, proper nouns, copying exactly). */
function normalizeKeepingCase(answer: string | number): string {
  return String(answer)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*%$/, "");
}

/**
 * True when a multiple-choice item's options differ ONLY by capitalization —
 * "july" vs "July" vs "jULY". Those items exist to teach capitalization, so
 * grading them case-insensitively marks every option correct and the skill
 * becomes untestable. Detecting it from the options themselves means the
 * banks don't have to flag anything by hand.
 */
export function optionsDifferOnlyByCase(options?: readonly string[] | null): boolean {
  if (!options || options.length < 2) return false;
  const byLowercase = new Map<string, string>();
  for (const opt of options) {
    const key = normalizeAnswer(opt);
    const exact = normalizeKeepingCase(opt);
    const seen = byLowercase.get(key);
    if (seen !== undefined && seen !== exact) return true;
    byLowercase.set(key, exact);
  }
  return false;
}

export function answersMatch(
  submitted: string | number,
  correct: string | number,
  options?: readonly string[] | null,
): boolean {
  // Capitalization items: the difference between the options is the whole
  // question, so compare exactly (whitespace still normalized).
  if (optionsDifferOnlyByCase(options)) {
    return normalizeKeepingCase(submitted) === normalizeKeepingCase(correct);
  }

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

/** Strict numeric parse: plain integers/decimals only (optional sign). Commas
 *  are accepted ONLY in true thousands positions — "1,000" is a number, but
 *  "3,7" is a coordinate pair and must NOT collapse to 37. Number() alone is
 *  too permissive ("0x10", "1e3", "") to be a grading rule. */
function parseNumeric(s: string): number | null {
  const hasComma = s.includes(",");
  if (hasComma && !/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return null;
  const cleaned = hasComma ? s.replace(/,/g, "") : s;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet scoring
// ─────────────────────────────────────────────────────────────────────────────

/** The shape scoring needs from a graded answer. */
export interface ScorableItem {
  isCorrect: boolean;
  /** 0 marks an item that is NOT a question — a passage block, a heading. */
  points?: number;
}

export interface SheetScore {
  score: number;
  totalProblems: number;
  accuracyPct: number;
}

/** An item is graded only if it is worth points. Reading sheets ship the
 *  passage itself as an item with `points: 0` and the answer "(passage — no
 *  answer required)" — it is material to read, not a question. Counting it
 *  made every passage sheet unwinnable: the child was marked wrong for not
 *  answering something with no answer, and capped at 6/7 before starting. */
export function isGradable(item: { points?: number }): boolean {
  return (item.points ?? 1) > 0;
}

/**
 * The recorded score for a submission.
 *
 * Interactive practice retries until the answer is right, so grading the FINAL
 * answers always lands near 100%. The honest measure of mastery is the client's
 * FIRST-TRY accuracy, which is what gets recorded — and it is clamped to the
 * final graded accuracy so a tampered client cannot claim mastery it did not
 * demonstrate. Paper submissions omit first-try, where final IS first try.
 *
 * This is why a sheet's stored `score` legitimately differs from the number of
 * answers flagged correct: they measure different things, and `score` is
 * always the lower of the two.
 */
export function scoreSubmission(
  graded: ScorableItem[],
  firstTryAccuracyPct: number | null | undefined,
): SheetScore {
  const scored = graded.filter(isGradable);
  const totalProblems = scored.length;
  const gradedScore = scored.filter((a) => a.isCorrect).length;
  const finalPct = Math.round((gradedScore / Math.max(totalProblems, 1)) * 100);
  const ft =
    firstTryAccuracyPct != null
      ? Math.min(Math.max(0, Math.round(firstTryAccuracyPct)), finalPct)
      : null;
  const accuracyPct = ft != null ? ft : finalPct;
  const score = ft != null ? Math.round((accuracyPct / 100) * totalProblems) : gradedScore;
  return { score, totalProblems, accuracyPct };
}
