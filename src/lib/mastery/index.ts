// src/lib/mastery/index.ts
// Mastery domain rules — the single source of truth for when a skill counts as
// "mastered". Previously these constants and predicates lived inside the
// dashboard route handler, so no other route could reuse them and they could
// drift. Keep the pure rules here; DB-coupled aggregation stays in the routes.

import type { ItemMastery } from "@/lib/worksheet/item-mastery";

// A skill is mastered after a SMALL number of high-accuracy sheets — Kumon-style
// "show you can do it well, then move on" — not after 80% of a 40-sheet bank.
export const MASTERY_ACCURACY = 90;

// Mastery target = how many DISTINCT sheets must be completed at ≥90%.
//  • MATH: 8 (the engine raises difficulty across sheets, so depth matters).
//  • Non-math: the number of distinct sheets the skill's bank actually supports
//    (capped at 3). Stops a tiny bank being "mastered" by repeating questions.
export function masteryTarget(isMath: boolean, distinctSheets: number): number {
  if (isMath) return 8;
  return Math.max(1, Math.min(3, distinctSheets || 3));
}

/**
 * Non-math mastery test. Keeps the sheet-count gate (the student worked through
 * the distinct content), but accuracy may pass via EITHER the legacy
 * sheet-average OR the per-distinct-item measure — so this never un-masters a
 * student who already qualified, while adding the fairer item-level signal.
 */
export function nonMathMastered(
  sheetsCompleted: number,
  avgAccuracy: number,
  target: number,
  im?: ItemMastery,
): boolean {
  if (sheetsCompleted < target) return false;
  if (avgAccuracy >= MASTERY_ACCURACY) return true;
  if (im && im.distinctSeen > 0 && im.itemAccuracyPct >= MASTERY_ACCURACY) return true;
  return false;
}

/** Unified mastery decision across math and non-math skills. */
export function isSkillMastered(args: {
  isMath: boolean;
  sheetsCompleted: number;
  avgAccuracy: number;
  distinctSheets: number;
  item?: ItemMastery;
}): boolean {
  const target = masteryTarget(args.isMath, args.distinctSheets);
  if (args.isMath) {
    return args.avgAccuracy >= MASTERY_ACCURACY && args.sheetsCompleted >= target;
  }
  return nonMathMastered(args.sheetsCompleted, args.avgAccuracy, target, args.item);
}
