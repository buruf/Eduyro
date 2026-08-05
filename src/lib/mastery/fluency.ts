// src/lib/mastery/fluency.ts
// Fact-FLUENCY gate for the arithmetic-fact levels (M3 +, M4 −, M5 ×, M6 ÷).
//
// Accuracy alone is not mastery for basic facts: a child who scores 90% but
// counts on fingers for 15 seconds a question has NOT learned the facts — they
// re-derive them every time. Kumon (and the research on math fluency) gate fact
// recall on SPEED as well as accuracy. So a fact sheet only "passes" (advances
// the student / retires from rotation) when it is BOTH accurate AND on-pace;
// an accurate-but-slow sheet repeats the next day to build automaticity.
//
// Targets live in CODE (like the curriculum engines), keyed by level + skill, so
// there is no migration and they are easy to tune. Non-fact skills (multi-digit
// procedures, mixed review, and every non-arithmetic subject) return null → no
// pace gate, so their behaviour is unchanged.

// Seconds-per-question a FLUENT child comfortably beats. Deliberately generous
// on first ship: a truly fluent kid answers a single fact in 2–4s; a
// finger-counter takes 10–15s. 6s cleanly separates the two without punishing a
// careful-but-quick child.
const FACT_PACE_SEC = 6;

// The single-digit fact levels. M1/M2 (counting / number sense) are NOT timed —
// they're about understanding, not recall speed.
const FACT_LEVELS = new Set(["M3", "M4", "M5", "M6"]);

// Within a fact level, these skills are multi-digit PROCEDURES or mixed review,
// not single-fact recall — computation time varies too much to gate on speed.
const NON_FACT_SKILL = /2-digit|3-digit|multi.?digit|mixed review|standard form/i;

/** Seconds-per-question a fact sheet must beat to count as FLUENT, or null when
 *  this level/skill isn't a timed fact skill (→ no pace gate). */
export function factPaceTargetSec(levelCode: string, skillLabel: string): number | null {
  if (!FACT_LEVELS.has(levelCode)) return null;
  if (NON_FACT_SKILL.test(skillLabel || "")) return null;
  return FACT_PACE_SEC;
}

/** A sheet is FLUENT when accurate enough AND (if a fact skill) on pace.
 *  Sheets with very few problems aren't pace-gated (too noisy to time). */
export function isSheetFluent(args: {
  levelCode: string; skillLabel: string;
  accuracyPct: number; thresholdPct: number;
  timeSeconds: number; problemCount: number;
}): boolean {
  const { levelCode, skillLabel, accuracyPct, thresholdPct, timeSeconds, problemCount } = args;
  if (accuracyPct < thresholdPct) return false;
  const target = factPaceTargetSec(levelCode, skillLabel);
  if (target == null || problemCount < 10) return true; // no pace gate
  const perQ = timeSeconds / Math.max(1, problemCount);
  return perQ <= target;
}

/** PACE only — ignores accuracy. The DAY gate checks accuracy once, as the
 *  daily average (which is what every screen promises the student and parent);
 *  folding per-sheet accuracy in here as well silently made a single low sheet
 *  block the day, and made the UI blame speed for an accuracy miss. */
export function isSheetOnPace(args: {
  levelCode: string; skillLabel: string;
  timeSeconds: number; problemCount: number;
}): boolean {
  const target = factPaceTargetSec(args.levelCode, args.skillLabel);
  if (target == null || args.problemCount < 10) return true; // no pace gate
  return args.timeSeconds / Math.max(1, args.problemCount) <= target;
}

/** Accurate enough to normally pass, but too SLOW to be fluent — the case that
 *  should repeat the sheet rather than advance. */
export function isAccurateButSlow(args: {
  levelCode: string; skillLabel: string;
  accuracyPct: number; thresholdPct: number;
  timeSeconds: number; problemCount: number;
}): boolean {
  return args.accuracyPct >= args.thresholdPct && !isSheetFluent(args);
}

/** The skill label baked into a math worksheet title ("<label> — Sheet N"). */
export function skillLabelFromTitle(title: string | null | undefined): string {
  return (title ?? "").split(" — Sheet")[0]?.trim() ?? "";
}
