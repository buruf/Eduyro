// src/lib/shop/geometry-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO GEOMETRY ENGINE — angle relationships + perimeter & area
//   Complementary · Supplementary · Vertical · Angles on a line / around a point
//   · Triangle angle sum · Perimeter · Area (rectangle, square, triangle, circle)
//
// Same progression-first design as the other engines: each concept enumerates
// its valid problem space, every problem is scored by ONE deterministic
// difficulty function, and each sheet selects a unique, strictly-ascending slice
// via a window that slides upward sheet-to-sheet. Every answer is a short
// deterministic value so the student app can grade it server-side.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample } from "./progressive-generator";

interface XP { q: string; a: string; diff: number; key: string; }

// ── Angle relationships ───────────────────────────────────────────────────────
// Angles are drawn as DIAGRAMS via the [[viz ang…]] markers. Measures are kept in
// a readable range so each diagram's split is clearly visible.
const complement: Builder = () => {
  const out: XP[] = [];
  for (let a = 15; a <= 75; a++) out.push({ q: `[[viz angright ${a}]]`, a: String(90 - a), diff: Math.abs(45 - a) + a / 10, key: `comp:${a}` });
  return out;
};
const supplement: Builder = () => {
  const out: XP[] = [];
  for (let a = 20; a <= 160; a++) out.push({ q: `[[viz angline ${a}]]`, a: String(180 - a), diff: Math.abs(90 - a) + a / 20, key: `supp:${a}` });
  return out;
};
const vertical: Builder = () => {
  const out: XP[] = [];
  // Two lines cross → vertical angles are EQUAL; the answer is the same measure.
  for (let a = 25; a <= 155; a++) out.push({ q: `[[viz angcross ${a}]]`, a: String(a), diff: a / 10, key: `vert:${a}` });
  return out;
};
const linearPair: Builder = () => {
  const out: XP[] = [];
  for (let a = 20; a <= 160; a++) out.push({ q: `[[viz angline ${a}]]`, a: String(180 - a), diff: Math.abs(90 - a) / 2 + 10, key: `lin:${a}` });
  return out;
};
const aroundPoint: Builder = () => {
  const out: XP[] = [];
  for (let a = 40; a <= 200; a += 5) for (let b = 40; b <= 200; b += 5) {
    if (a + b >= 350 || a + b < 60) continue;
    out.push({ q: `${a}° + ${b}° + x = 360°`, a: String(360 - a - b), diff: (a + b) / 20 + 14, key: `pt:${a}_${b}` });
  }
  return out;
};
const triangleSum: Builder = () => {
  const out: XP[] = [];
  for (let a = 20; a <= 130; a += 5) for (let b = 20; b <= 130; b += 5) {
    if (a + b >= 165) continue;
    out.push({ q: `[[viz angtri ${a} ${b}]]`, a: String(180 - a - b), diff: (a + b) / 12 + 18, key: `tri:${a}_${b}` });
  }
  return out;
};

// ── Perimeter & area ──────────────────────────────────────────────────────────
const perimRect: Builder = () => {
  const out: XP[] = [];
  for (let l = 2; l <= 20; l++) for (let w = 1; w < l; w++)
    out.push({ q: `[[viz geomrect ${l} ${w}]]`, a: String(2 * (l + w)), diff: l + w, key: `pr:${l}_${w}` });
  return out;
};
const areaRect: Builder = () => {
  const out: XP[] = [];
  for (let l = 2; l <= 20; l++) for (let w = 1; w <= l; w++)
    out.push({ q: `[[viz geomrect ${l} ${w}]]`, a: String(l * w), diff: l * w / 4 + 6, key: `ar:${l}_${w}` });
  return out;
};
const squarePerim: Builder = () => {
  const out: XP[] = [];
  for (let s = 2; s <= 25; s++) out.push({ q: `[[viz geomsquare ${s}]]`, a: String(4 * s), diff: s, key: `sqp:${s}` });
  return out;
};
const squareArea: Builder = () => {
  const out: XP[] = [];
  for (let s = 2; s <= 25; s++) out.push({ q: `[[viz geomsquare ${s}]]`, a: String(s * s), diff: s * s / 8 + 4, key: `sqa:${s}` });
  return out;
};
const areaTri: Builder = () => {
  const out: XP[] = [];
  for (let b = 2; b <= 20; b += 2) for (let h = 2; h <= 20; h++) {
    if ((b * h) % 2 !== 0) continue;
    out.push({ q: `[[viz geomtri ${b} ${h}]]`, a: String((b * h) / 2), diff: b + h, key: `at:${b}_${h}` });
  }
  return out;
};
const circle: Builder = () => {
  const out: XP[] = [];
  for (let r = 1; r <= 12; r++) {
    out.push({ q: `[[viz geomcircle ${r}]] circumference (π = 3.14)`, a: trim(2 * 3.14 * r), diff: r, key: `cc:${r}` });
    out.push({ q: `[[viz geomcircle ${r}]] area (π = 3.14)`, a: trim(3.14 * r * r), diff: r * 1.5 + 6, key: `ca:${r}` });
  }
  return out;
};
const trim = (n: number) => String(Math.round(n * 100) / 100);

// ── Trigonometry (right triangles) ────────────────────────────────────────────
// Pythagorean triples (primitives × scale) so every answer is an exact integer —
// no calculator needed. Legs ≤ 60, hypotenuse ≤ 75.
const gcdN = (a: number, b: number): number => (b === 0 ? a : gcdN(b, a % b));
const fr = (n: number, d: number): string => { const g = gcdN(n, d) || 1; return `${n / g}/${d / g}`; };
const TRIPLES: [number, number, number][] = (() => {
  const prims: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37], [11, 60, 61], [28, 45, 53]];
  const out: [number, number, number][] = [];
  for (const [a, b, c] of prims) for (let k = 1; a * k <= 60 && b * k <= 60 && c * k <= 75; k++) out.push([a * k, b * k, c * k]);
  return out;
})();
// Pythagorean theorem — find the hypotenuse. Figure: legs given, hyp = "?".
const pythagHyp: Builder = () => TRIPLES.map(([a, b, c]) => ({ q: `[[viz geomright ${a} ${b} 0]]`, a: String(c), diff: c, key: `ph:${a}_${b}` }));
// Pythagorean theorem — find a missing leg. Figure: one leg + hyp given, other = "?".
const pythagLeg: Builder = () => TRIPLES.map(([a, b, c]) => ({ q: `[[viz geomright 0 ${b} ${c}]]`, a: String(a), diff: c + 0.5, key: `pl:${a}_${b}` }));
// Trig ratios — read sin/cos/tan from a labelled right triangle. θ is at the
// bottom-right vertex, so opposite = vertical leg, adjacent = horizontal leg.
const trigRatio: Builder = () => {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) {
    out.push({ q: `[[viz geomright ${a} ${b} ${c} 1]] sin θ`, a: fr(b, c), diff: c, key: `ts:${a}_${b}` });
    out.push({ q: `[[viz geomright ${a} ${b} ${c} 1]] cos θ`, a: fr(a, c), diff: c + 0.3, key: `tco:${a}_${b}` });
    out.push({ q: `[[viz geomright ${a} ${b} ${c} 1]] tan θ`, a: fr(b, a), diff: c + 0.6, key: `tta:${a}_${b}` });
  }
  return out;
};
// Find a missing side from a given trig ratio and the hypotenuse.
const trigSide: Builder = () => {
  const out: XP[] = []; const seen = new Set<string>();
  // Scaled triples collapse to the same (ratio, hypotenuse) — e.g. (3,4,5)×2 and
  // (6,8,10)×1 both give "sin θ = 4/5, hyp = 10" — so dedupe by question text.
  for (const [, b, c] of TRIPLES) for (const k of [1, 2, 3, 4, 5]) {
    if (c * k > 120) continue;
    const q = `sin θ = ${fr(b, c)}. The hypotenuse is ${c * k}. Find the side opposite θ.`;
    if (seen.has(q)) continue; seen.add(q);
    out.push({ q, a: String(b * k), diff: c + k, key: `tso:${b}_${c}_${k}` });
  }
  return out;
};

type Builder = () => XP[];

// ── Curriculum ────────────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; directive: string; grade: string; stars: number;
  range: [number, number]; pool: Builder; example: WorkedExample;
}

const CURRICULUM: Unit[] = [
  // ── Angle relationships (rebalanced: ~6 sheets each instead of 12–14) ──
  { id: "g-comp", label: "Complementary angles", objective: "Student finds the complement of an angle", directive: "Find the missing angle. Complementary angles add to 90°.", grade: "Grade 6-7", stars: 2, range: [1, 6], pool: complement, example: { problem: "[[viz angright 35]]", steps: ["Complements add to 90°", "90 − 35 = 55"], answer: "55" } },
  { id: "g-supp", label: "Supplementary angles", objective: "Student finds the supplement of an angle", directive: "Find the missing angle. Supplementary angles add to 180°.", grade: "Grade 6-7", stars: 2, range: [7, 12], pool: supplement, example: { problem: "[[viz angline 110]]", steps: ["Supplements add to 180°", "180 − 110 = 70"], answer: "70" } },
  { id: "g-vert", label: "Vertical angles", objective: "Student identifies equal vertical angles", directive: "Vertical angles are equal — write the missing angle.", grade: "Grade 7", stars: 2, range: [13, 18], pool: vertical, example: { problem: "[[viz angcross 70]]", steps: ["Vertical angles are equal"], answer: "70" } },
  { id: "g-line", label: "Angles on a straight line", objective: "Student finds a missing angle on a straight line", directive: "Find the missing angle. Angles on a straight line add to 180°.", grade: "Grade 7", stars: 3, range: [19, 24], pool: linearPair, example: { problem: "[[viz angline 65]]", steps: ["180 − 65 = 115"], answer: "115" } },
  { id: "g-point", label: "Angles around a point", objective: "Student finds a missing angle around a point", directive: "Find x. Angles around a point add to 360°.", grade: "Grade 7", stars: 4, range: [25, 30], pool: aroundPoint, example: { problem: "120° + 90° + x = 360°", steps: ["120 + 90 = 210", "360 − 210 = 150"], answer: "150" } },
  { id: "g-tri", label: "Triangle angle sum", objective: "Student finds the third angle of a triangle", directive: "Find the missing angle. A triangle's angles add to 180°.", grade: "Grade 7", stars: 4, range: [31, 36], pool: triangleSum, example: { problem: "[[viz angtri 50 60]]", steps: ["50 + 60 = 110", "180 − 110 = 70"], answer: "70" } },
  // ── Perimeter & area (expanded — were starved at 4–6 sheets) ──
  { id: "g-perim", label: "Perimeter of rectangles & squares", objective: "Student finds the perimeter of a rectangle or square", directive: "Find the perimeter of each shape.", grade: "Grade 4-5", stars: 3, range: [37, 43], pool: () => [...perimRect(), ...squarePerim()], example: { problem: "[[viz geomrect 8 5]]", steps: ["P = 2(l + w)", "2 × (8 + 5) = 26"], answer: "26" } },
  { id: "g-area-rect", label: "Area of rectangles & squares", objective: "Student finds the area of a rectangle or square", directive: "Find the area of each shape.", grade: "Grade 4-5", stars: 3, range: [44, 50], pool: () => [...areaRect(), ...squareArea()], example: { problem: "[[viz geomrect 8 5]]", steps: ["A = l × w", "8 × 5 = 40"], answer: "40" } },
  { id: "g-area-tri", label: "Area of triangles", objective: "Student finds the area of a triangle", directive: "Find the area of each triangle.", grade: "Grade 6", stars: 4, range: [51, 56], pool: areaTri, example: { problem: "[[viz geomtri 10 6]]", steps: ["A = ½ × b × h", "½ × 10 × 6 = 30"], answer: "30" } },
  { id: "g-circle", label: "Circumference & area of circles", objective: "Student finds circle measures using π", directive: "Find each circle measure (use π = 3.14).", grade: "Grade 7", stars: 5, range: [57, 62], pool: circle, example: { problem: "[[viz geomcircle 5]] area (π = 3.14)", steps: ["A = π r²", "3.14 × 25 = 78.5"], answer: "78.5" } },
  // ── Trigonometry (NEW — right-triangle geometry, Grade 8–9) ──
  { id: "g-pythag-hyp", label: "Pythagorean theorem — hypotenuse", objective: "Student finds the hypotenuse of a right triangle", directive: "Find the hypotenuse. Use a² + b² = c².", grade: "Grade 8", stars: 4, range: [63, 72], pool: pythagHyp, example: { problem: "[[viz geomright 3 4 0]]", steps: ["a² + b² = c²", "3² + 4² = 9 + 16 = 25", "c = √25 = 5"], answer: "5" } },
  { id: "g-pythag-leg", label: "Pythagorean theorem — find a leg", objective: "Student finds a missing leg of a right triangle", directive: "Find the missing leg. Use a² + b² = c².", grade: "Grade 8-9", stars: 5, range: [73, 82], pool: pythagLeg, example: { problem: "[[viz geomright 0 4 5]]", steps: ["a² = c² − b²", "5² − 4² = 25 − 16 = 9", "a = √9 = 3"], answer: "3" } },
  { id: "g-trig-ratio", label: "Trig ratios (sin, cos, tan)", objective: "Student writes sin, cos and tan as ratios from a right triangle", directive: "Write each ratio as a fraction. Opposite/hypotenuse = sin, adjacent/hypotenuse = cos, opposite/adjacent = tan.", grade: "Grade 9", stars: 5, range: [83, 91], pool: trigRatio, example: { problem: "[[viz geomright 3 4 5 1]] sin θ", steps: ["sin θ = opposite / hypotenuse", "opposite = 4, hypotenuse = 5", "sin θ = 4/5"], answer: "4/5" } },
  { id: "g-trig-side", label: "Find a side from a ratio", objective: "Student finds a missing side from a given trig ratio", directive: "Find the missing side using the given ratio.", grade: "Grade 9", stars: 5, range: [92, 100], pool: trigSide, example: { problem: "sin θ = 4/5. The hypotenuse is 10. Find the side opposite θ.", steps: ["sin θ = opposite / hypotenuse", "4/5 = opposite / 10", "opposite = 10 × 4/5 = 8"], answer: "8" } },
];

const CODE = "GEOMETRY";

// ── Selection + GPI (identical guarantees to the other engines) ───────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(sheet: number): number {
  const idx = CURRICULUM.findIndex((u) => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? CURRICULUM.length - 1 : idx;
}
function buildScoredPool(unitIndex: number): XP[] {
  const raw = CURRICULUM[unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map((p) => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}
function selectProblems(pool: XP[], t: number, count: number): XP[] {
  const seen = new Set<string>();
  const uniq = pool.filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  if (N <= count) {
    const out: XP[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }
  const W = Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  const chosen: XP[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx = Math.round((i * (W - 1)) / (count - 1));
    while (used.has(idx)) idx = (idx + 1) % W;
    used.add(idx);
    chosen.push(win[idx]);
  }
  return chosen.sort((a, b) => a.diff - b.diff);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function isGeometrySkill(skill: string): boolean {
  return skill === CODE;
}

export function generateGeometrySheet(
  sheetNumber: number, totalSheets: number, problemCount = 24,
): WorksheetData {
  const ui = unitIndexForSheet(sheetNumber);
  const unit = CURRICULUM[ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(ui), t, problemCount);
  const problems = selected.map((p, i) => ({
    id: nanoid(8), type: "short_answer" as const, question: p.q, answer: p.a, points: 1,
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map((p) => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill: CODE as any, skillCode: "GEO", sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective, directive: unit.directive,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 8),
    },
  };
}

export function validateGeometryPack(totalSheets = 100): { ok: boolean; issues: string[]; gpi: number[] } {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(s);
    const unit = CURRICULUM[ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(ui), t, 24);
    const qs = sel.map((p) => p.q);
    const poolSize = new Set(unit.pool().map((p) => p.key)).size;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`GEO sheet ${s}: ${dupes} dup(s) (pool=${poolSize})`);
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`GEO sheet ${s}: not ascending`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`GEO sheet ${s}: GPI dropped ${prevMean.toFixed(1)}→${mean.toFixed(1)}`);
    prevMean = mean;
  }
  let expected = 1;
  for (const u of CURRICULUM) {
    if (u.range[0] !== expected) issues.push(`GEO unit ${u.id}: gap at ${u.range[0]} (expected ${expected})`);
    expected = u.range[1] + 1;
  }
  if (expected !== totalSheets + 1) issues.push(`GEO: ranges end at ${expected - 1}, expected ${totalSheets}`);
  return { ok: issues.length === 0, issues, gpi };
}
