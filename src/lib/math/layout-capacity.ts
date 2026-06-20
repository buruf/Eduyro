// src/lib/math/layout-capacity.ts
// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT-CAPACITY SYSTEM
//
// A worksheet's question count is NOT fixed at 30. Each question type has a
// visual "weight" (its footprint on the page), and a page holds a fixed budget
// of weight. We generate questions until the budget is filled — so a page is
// neither half-empty nor overcrowded, whatever the question type.
//
//   arithmetic fact (one line)      weight 1    → ~30–36 per page
//   multi-digit stacked / division  weight 1.5–2 → ~18–24
//   single fraction (simplify)      weight 1.5  → ~24
//   two-fraction (equivalent/ops)   weight 2    → ~18
//   fraction strip / grid (viz)     weight 4    → ~9
//   pie / comparison picture (viz)  weight 5    → ~7
//   geometry figure                 weight 6    → ~6   (future)
//   coordinate graph                weight 8    → ~4–5 (future)
// ─────────────────────────────────────────────────────────────────────────────

import { parseColumnar, parseLongDivision } from "./columnar";

/** Total visual weight one worksheet page can hold. */
export const PAGE_CAPACITY = 36;

const MIN_COUNT = 4;
const MAX_COUNT = 40;

/** Visual footprint of a single question, used to budget a page. */
export function questionWeight(question: string): number {
  const q = String(question);
  // Visual figures (drawn shapes) dominate vertical space.
  if (/\[\[viz\s+(pie|cmp)/.test(q)) return 5; // pie / side-by-side comparison → ~7 (4-8)
  if (/\[\[viz\s+(bar|grid)/.test(q)) return 4; // fraction strip / area grid → ~9 (6-10)
  if (/\[\[viz\s+ang/.test(q)) return 6;        // angle diagram → ~6 per page
  if (/\[\[viz\s+geom/.test(q)) return 6;       // perimeter/area figure → ~6 per page
  if (/\[\[geo/.test(q)) return 6;              // geometry figure (future) → ~6
  if (/\[\[graph/.test(q)) return 8;            // coordinate graph (future) → ~4-5

  // Stacked fractions render ~2 text-lines tall; more fractions = wider/taller.
  const fracs = (q.match(/\\frac/g) || []).length;
  if (fracs >= 3) return 3;    // ordering three fractions → ~12 (8-12)
  if (fracs >= 2) return 2;    // equivalent / compare / operations → ~18
  if (fracs === 1) return 1.8; // simplify / single fraction → ~20

  if (parseLongDivision(q)) return 2;  // long-division bracket + workspace
  if (parseColumnar(q)) return 1.5;    // multi-digit column method

  // One-line content: weight by length too, so long word/instruction problems
  // (which wrap to several lines) claim more of the page than a short fact.
  const len = q.replace(/\[\[[^\]]*\]\]/g, "").trim().length;
  if (len > 64) return 2;
  if (len > 32) return 1.5;
  return 1; // short arithmetic fact / prompt
}

/**
 * How many questions fill one page, given a representative sample of the sheet's
 * questions. Uses the average weight so mixed sheets are handled correctly.
 */
export function adaptiveCount(sampleQuestions: string[], max: number = MAX_COUNT): number {
  if (!sampleQuestions.length) return 30;
  const avg = sampleQuestions.reduce((a, q) => a + questionWeight(q), 0) / sampleQuestions.length;
  const n = Math.round(PAGE_CAPACITY / Math.max(0.5, avg));
  return Math.max(MIN_COUNT, Math.min(max, n));
}
