// src/lib/shop/fraction-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO FRACTION CURRICULUM ENGINE  (clean-slate, progression-first)
//
// Design philosophy (the 10 rules + GPI):
//   • The engine is a CURRICULUM, not a random generator.
//   • Every concept ENUMERATES its full valid problem space.
//   • Every problem is scored by ONE deterministic difficulty function.
//   • Each sheet selects a UNIQUE, strictly-ASCENDING slice of that space via a
//     window that slides upward sheet-to-sheet.
//   ⇒ No duplicates, rising within-sheet difficulty (Q1<Q30), and a monotonic
//     Global Progression Index are TRUE BY CONSTRUCTION — not by retry/patching.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample } from "./progressive-generator";

// A single backslash, written as a unicode escape so it never collides with
// JS string escapes like \f. At runtime this is char 0x5C → outputs "\frac…".
const BS = "\u005C";
const F = (n: number, d: number) => `${BS}frac{${n}}{${d}}`;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

// Reduced fraction → display string ("1" when it reduces to a whole number).
function reduced(n: number, d: number): string {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? String(nn) : F(nn, dd);
}

// ── A scored problem in the space ─────────────────────────────────────────────
interface FProblem {
  q: string;    // question (with \frac markup + ×/÷ operators)
  a: string;    // answer
  diff: number; // deterministic difficulty score
  key: string;  // canonical identity for de-duplication
}

// ── Deterministic difficulty model ───────────────────────────────────────────
// One scalar per problem. Concept base + denominator weight + structural extras.
// Bases are spaced so concept order dominates (one-idea-at-a-time monotonicity),
// and within a concept the denominator/LCM drive a smooth ramp.
const BASE = {
  identify:   0,
  equivalent: 12,
  simplify:   22,
  addSame:    34,
  subSame:    38,
  addUnlike:  54,
  multiply:   72,
  divide:     88,
  mixed:      96,
} as const;

// ── Problem-space enumerators ─────────────────────────────────────────────────
// Each returns EVERY valid problem for the given denominator configuration.

function enumIdentify(denoms: number[]): FProblem[] {
  const out: FProblem[] = [];
  for (const d of denoms) {
    for (let n = 1; n < d; n++) {
      out.push({
        q: `Write the fraction: ${n} shaded out of ${d}`,
        a: F(n, d),
        diff: BASE.identify + d * 1.6 + n * 0.3,
        key: `id:${n}/${d}`,
      });
    }
  }
  return out;
}

function enumEquivalent(denoms: number[], factors: number[]): FProblem[] {
  const out: FProblem[] = [];
  for (const d of denoms) {
    for (let n = 1; n < d; n++) {
      for (const f of factors) {
        const d2 = d * f, n2 = n * f;
        out.push({
          q: `${F(n, d)} = ${BS}frac{___}{${d2}}`,
          a: String(n2),
          diff: BASE.equivalent + d2 * 1.1 + f * 1.5,
          key: `eq:${n}/${d}=?/${d2}`,
        });
      }
    }
  }
  return out;
}

function enumSimplify(denoms: number[], minGcf: number): FProblem[] {
  const out: FProblem[] = [];
  for (const d of denoms) {
    for (let n = 1; n < d; n++) {
      const g = gcd(n, d);
      if (g < minGcf) continue;            // only reducible fractions at/above the target GCF
      out.push({
        q: `Simplify ${F(n, d)}`,
        a: reduced(n, d),
        diff: BASE.simplify + d * 1.2 + Math.log2(g) * 6,
        key: `sim:${n}/${d}`,
      });
    }
  }
  return out;
}

function enumAddSame(denoms: number[]): FProblem[] {
  const out: FProblem[] = [];
  for (const d of denoms) {
    for (let n1 = 1; n1 < d; n1++) {
      for (let n2 = 1; n2 < d; n2++) {
        const sum = n1 + n2;
        const improper = sum >= d ? 3 : 0;
        const needsReduce = gcd(sum, d) > 1 ? 2 : 0;
        out.push({
          q: `${F(n1, d)} + ${F(n2, d)}`,
          a: reduced(sum, d),
          diff: BASE.addSame + d * 1.5 + improper + needsReduce,
          key: `as:${n1}/${d}+${n2}/${d}`,
        });
      }
    }
  }
  return out;
}

function enumSubSame(denoms: number[]): FProblem[] {
  const out: FProblem[] = [];
  for (const d of denoms) {
    for (let n1 = 2; n1 < d; n1++) {
      for (let n2 = 1; n2 < n1; n2++) {     // ensure non-negative result
        const diff = n1 - n2;
        out.push({
          q: `${F(n1, d)} - ${F(n2, d)}`,
          a: reduced(diff, d),
          diff: BASE.subSame + d * 1.5 + (gcd(diff, d) > 1 ? 2 : 0),
          key: `ss:${n1}/${d}-${n2}/${d}`,
        });
      }
    }
  }
  return out;
}

// pairs: which (d1,d2) denominator pairs are allowed (d1<d2)
function enumBinaryFrac(
  base: number,
  op: "+" | "×" | "÷",
  pairs: [number, number][],
): FProblem[] {
  const out: FProblem[] = [];
  for (const [d1, d2] of pairs) {
    for (let n1 = 1; n1 < d1; n1++) {
      for (let n2 = 1; n2 < d2; n2++) {
        let an: number, ad: number, extra: number;
        if (op === "+") {
          const L = lcm(d1, d2);
          an = n1 * (L / d1) + n2 * (L / d2); ad = L;
          extra = Math.log2(L) * 3;
        } else if (op === "×") {
          an = n1 * n2; ad = d1 * d2;
          extra = 0;
        } else { // ÷  →  n1/d1 × d2/n2
          an = n1 * d2; ad = d1 * n2;
          extra = 2;
        }
        const needsReduce = gcd(an, ad) > 1 ? 2 : 0;
        const improper = an >= ad ? 2 : 0;
        out.push({
          q: `${F(n1, d1)} ${op} ${F(n2, d2)}`,
          a: reduced(an, ad),
          diff: base + Math.max(d1, d2) * 1.3 + extra + needsReduce + improper,
          key: `${op}:${n1}/${d1}${op}${n2}/${d2}`,
        });
      }
    }
  }
  return out;
}

// All ordered denominator pairs (d1<d2) drawn from a denominator set.
function pairsFrom(denoms: number[], opts: { relatedOnly?: boolean } = {}): [number, number][] {
  const ps: [number, number][] = [];
  for (let i = 0; i < denoms.length; i++) {
    for (let j = 0; j < denoms.length; j++) {
      if (i === j) continue;
      const d1 = denoms[i], d2 = denoms[j];
      if (d1 >= d2) continue;
      if (opts.relatedOnly && d2 % d1 !== 0) continue; // one denominator is a multiple of the other
      ps.push([d1, d2]);
    }
  }
  return ps;
}

// ── Curriculum units (one new idea at a time) ─────────────────────────────────
interface Unit {
  id: string;
  label: string;
  objective: string;
  grade: string;
  stars: number;
  range: [number, number];           // inclusive sheet range
  pool: () => FProblem[];            // full enumerated problem space
  example: WorkedExample;
}


// NOTE: every unit's enumerated pool MUST contain ≥30 problems so each sheet is
// 30 DISTINCT questions (no in-sheet repetition). Identify is therefore kept to
// a few sheets over a wide denominator span rather than many sheets over a tiny
// one — the recognition space is simply too small to spread thinly.
const CURRICULUM: Unit[] = [
  // ── IDENTIFY (recognition) ──  pools: 36, 66
  { id:"identify-1", label:"Identify fractions (to ninths)",
    objective:"Student writes the fraction for parts of a whole, denominators 2–9",
    grade:"Grade 3", stars:1, range:[1,3], pool:()=>enumIdentify([2,3,4,5,6,7,8,9]),
    example:{ problem:"3 shaded out of 4", steps:["Parts shaded = 3","Total equal parts = 4","Fraction = shaded ÷ total"], answer:F(3,4) } },
  { id:"identify-2", label:"Identify fractions (to twelfths)",
    objective:"Student writes fractions for any denominator 2–12",
    grade:"Grade 4", stars:2, range:[4,6], pool:()=>enumIdentify([2,3,4,5,6,7,8,9,10,11,12]),
    example:{ problem:"7 shaded out of 10", steps:["Parts shaded = 7","Total equal parts = 10"], answer:F(7,10) } },

  // ── EQUIVALENT ──
  { id:"equivalent", label:"Equivalent fractions",
    objective:"Student finds the missing numerator of an equivalent fraction",
    grade:"Grade 4", stars:2, range:[7,12], pool:()=>enumEquivalent([2,3,4,5,6],[2,3,4]),
    example:{ problem:`${F(1,2)} = ${BS}frac{___}{4}`, steps:["4 ÷ 2 = 2 (scale factor)","1 × 2 = 2"], answer:"2" } },

  // ── SIMPLIFY ──
  { id:"simplify-gcf2", label:"Simplify fractions — divide by 2",
    objective:"Student simplifies fractions whose GCF is 2",
    grade:"Grade 4-5", stars:2, range:[13,18], pool:()=>enumSimplify([4,6,8,9,10,12,14,15,16,18,20,21],2),
    example:{ problem:`Simplify ${F(4,8)}`, steps:["GCF of 4 and 8 = 4","4÷4=1, 8÷4=2"], answer:F(1,2) } },
  { id:"simplify-gcf3", label:"Simplify fractions — larger GCF",
    objective:"Student simplifies fractions whose GCF is 3 or more",
    grade:"Grade 5", stars:3, range:[19,24], pool:()=>enumSimplify([6,9,12,15,18,21,24,27,30],3),
    example:{ problem:`Simplify ${F(6,9)}`, steps:["GCF of 6 and 9 = 3","6÷3=2, 9÷3=3"], answer:F(2,3) } },

  // ── ADD / SUBTRACT SAME DENOMINATOR ──
  { id:"add-same-small", label:"Add fractions — same denominator (small)",
    objective:"Student adds fractions with the same denominator (3–6)",
    grade:"Grade 4-5", stars:3, range:[25,32], pool:()=>enumAddSame([3,4,5,6]),
    example:{ problem:`${F(1,4)} + ${F(2,4)}`, steps:["Same denominator — add numerators: 1+2=3","Keep denominator 4"], answer:F(3,4) } },
  { id:"add-same-large", label:"Add fractions — same denominator (larger)",
    objective:"Student adds same-denominator fractions up to twelfths",
    grade:"Grade 5", stars:3, range:[33,38], pool:()=>enumAddSame([6,8,9,10,12]),
    example:{ problem:`${F(3,8)} + ${F(2,8)}`, steps:["3+2=5","Keep denominator 8"], answer:F(5,8) } },
  { id:"sub-same", label:"Subtract fractions — same denominator",
    objective:"Student subtracts fractions with the same denominator",
    grade:"Grade 5", stars:3, range:[39,44], pool:()=>enumSubSame([4,5,6,8,10,12]),
    example:{ problem:`${F(3,4)} - ${F(1,4)}`, steps:["3-1=2","Keep denominator 4, simplify"], answer:F(1,2) } },

  // ── ADD UNLIKE DENOMINATORS ──
  { id:"add-unlike-related", label:"Add fractions — unlike (related denominators)",
    objective:"Student adds fractions where one denominator is a multiple of the other",
    grade:"Grade 5", stars:4, range:[45,52],
    pool:()=>enumBinaryFrac(BASE.addUnlike,"+",pairsFrom([2,3,4,6,8,12],{relatedOnly:true})),
    example:{ problem:`${F(1,2)} + ${F(1,4)}`, steps:["LCD = 4","1/2 = 2/4","2/4 + 1/4 = 3/4"], answer:F(3,4) } },
  { id:"add-unlike-general", label:"Add fractions — unlike denominators",
    objective:"Student finds the LCM and adds unlike fractions",
    grade:"Grade 5", stars:4, range:[53,62],
    pool:()=>enumBinaryFrac(BASE.addUnlike,"+",pairsFrom([2,3,4,5,6])),
    example:{ problem:`${F(1,3)} + ${F(1,4)}`, steps:["LCM of 3,4 = 12","1/3=4/12, 1/4=3/12","4/12+3/12=7/12"], answer:F(7,12) } },
  { id:"add-unlike-large", label:"Add fractions — unlike (larger denominators)",
    objective:"Student adds unlike fractions with denominators up to 12",
    grade:"Grade 6", stars:5, range:[63,70],
    pool:()=>enumBinaryFrac(BASE.addUnlike,"+",pairsFrom([3,4,5,6,7,8,9,12])),
    example:{ problem:`${F(2,3)} + ${F(3,8)}`, steps:["LCM of 3,8 = 24","2/3=16/24, 3/8=9/24","=25/24"], answer:F(25,24) } },

  // ── MULTIPLY ──
  { id:"multiply-small", label:"Multiply fractions (small)",
    objective:"Student multiplies fractions with small denominators",
    grade:"Grade 5", stars:4, range:[71,78],
    pool:()=>enumBinaryFrac(BASE.multiply,"×",pairsFrom([2,3,4,5]).concat([[2,2],[3,3],[4,4],[5,5]])),
    example:{ problem:`${F(2,3)} × ${F(3,4)}`, steps:["Multiply across: 2×3=6, 3×4=12","Simplify 6/12 = 1/2"], answer:F(1,2) } },
  { id:"multiply-large", label:"Multiply fractions (larger)",
    objective:"Student multiplies fractions up to ninths and simplifies",
    grade:"Grade 6", stars:5, range:[79,86],
    pool:()=>enumBinaryFrac(BASE.multiply,"×",pairsFrom([2,3,4,5,6,7,8,9]).concat([[6,6],[7,7],[8,8]])),
    example:{ problem:`${F(3,5)} × ${F(5,6)}`, steps:["3×5=15, 5×6=30","Simplify 15/30 = 1/2"], answer:F(1,2) } },

  // ── DIVIDE ──
  { id:"divide-small", label:"Divide fractions (small)",
    objective:"Student divides fractions using the reciprocal rule",
    grade:"Grade 6", stars:5, range:[87,92],
    pool:()=>enumBinaryFrac(BASE.divide,"÷",pairsFrom([2,3,4,5]).concat([[2,2],[3,3],[4,4],[5,5]])),
    example:{ problem:`${F(3,4)} ÷ ${F(1,2)}`, steps:["Flip divisor: 1/2 → 2/1","3/4 × 2/1 = 6/4","Simplify = 3/2"], answer:F(3,2) } },
  { id:"divide-large", label:"Divide fractions (larger)",
    objective:"Student divides fractions with denominators up to ninths",
    grade:"Grade 6", stars:5, range:[93,98],
    pool:()=>enumBinaryFrac(BASE.divide,"÷",pairsFrom([2,3,4,5,6,7,8,9])),
    example:{ problem:`${F(2,3)} ÷ ${F(4,5)}`, steps:["Flip divisor: 4/5 → 5/4","2/3 × 5/4 = 10/12","Simplify = 5/6"], answer:F(5,6) } },

  // ── MIXED REVIEW ──
  { id:"mixed-review", label:"Fraction operations — mixed review",
    objective:"Student selects and applies the correct operation across all fraction types",
    grade:"Grade 6", stars:5, range:[99,100], pool:()=>[
      ...enumBinaryFrac(BASE.addUnlike,"+",pairsFrom([2,3,4,5,6])),
      ...enumBinaryFrac(BASE.multiply,"×",pairsFrom([2,3,4,5,6])),
      ...enumBinaryFrac(BASE.divide,"÷",pairsFrom([2,3,4,5,6])),
    ],
    example:{ problem:`${F(2,3)} × ${F(3,5)}`, steps:["Identify the operation (× here)","Multiply across: 2×3=6, 3×5=15","Simplify 6/15 = 2/5"], answer:F(2,5) } },
];

function unitIndexForSheet(sheet: number): number {
  const idx = CURRICULUM.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? CURRICULUM.length - 1 : idx;
}
function unitForSheet(sheet: number): Unit {
  return CURRICULUM[unitIndexForSheet(sheet)];
}

// ── Global Progression Index (GPI) ────────────────────────────────────────────
// A unit's raw structural scores are NORMALISED into a small band [0, BAND] and
// stacked on an evenly-spaced unit base (unitIndex × STEP). Because STEP > BAND,
// concept order ALWAYS dominates: the hardest problem of unit K is still easier
// than the easiest problem of unit K+1. So the per-sheet mean (the GPI) strictly
// increases across the whole pack — by construction, not by retry.
const GPI_STEP = 12; // difficulty gap between consecutive units
const GPI_BAND = 8;   // internal difficulty spread within a unit (< STEP)

function buildScoredPool(unitIndex: number): FProblem[] {
  const raw = CURRICULUM[unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}

// Mean GPI of the 30 problems a given sheet actually selects.
function sheetGpi(sheetNumber: number, count = 30): number {
  const ui = unitIndexForSheet(sheetNumber);
  const unit = CURRICULUM[ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;
  const sel = selectProblems(buildScoredPool(ui), t, count);
  return sel.reduce((a, p) => a + p.diff, 0) / sel.length;
}

// ── Selection: unique, strictly-ascending, window slides up per sheet ─────────
// pool sorted by difficulty; sheet at intra-unit progress t takes a window that
// advances with t. Within the window we pick `count` items spread evenly
// (varied + ascending). Pools smaller than `count` are filled by even cyclic
// repetition (earliest recognition sheets only) — never N-in-a-row.
function selectProblems(pool: FProblem[], t: number, count: number): FProblem[] {
  const sorted = [...pool].sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;

  if (N <= count) {
    const out: FProblem[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }

  // Window covers ~60% of the pool and slides upward as the unit progresses,
  // so later sheets are measurably harder than earlier ones (cross-sheet ramp).
  const W = Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);

  // Even spread across the window for variety + ascending difficulty.
  const chosen: FProblem[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx = Math.round((i * (W - 1)) / (count - 1));
    while (used.has(idx)) idx = (idx + 1) % W;      // guarantee uniqueness
    used.add(idx);
    chosen.push(win[idx]);
  }
  return chosen.sort((a, b) => a.diff - b.diff);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function generateFractionSheet(
  sheetNumber: number,
  totalSheets: number,
  problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(sheetNumber);
  const unit = CURRICULUM[ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const pool = buildScoredPool(ui);
  const selected = selectProblems(pool, t, problemCount);

  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: "arithmetic" as const,
    question: p.q,
    answer: p.a,
    points: 1,
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));

  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems,
    answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill: "FRACTIONS",
      skillCode: "M7",
      sheetNumber,
      totalSheets,
      subSkillLabel: unit.label,
      gradeLevel: unit.grade,
      difficultyStars: unit.stars,
      learningObjective: unit.objective,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 10),
    },
  };
}

// ── Self-validation (used by tests) ──────────────────────────────────────────
// Verifies the engine's structural guarantees across the whole pack.
export function validateFractionPack(totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;

  // STRUCTURAL GUARD — every unit must offer ≥30 distinct problems, otherwise a
  // sheet would be forced to repeat questions. Also assert ranges tile 1..N.
  let expectedNext = 1;
  for (const u of CURRICULUM) {
    if (u.pool().length < 30) issues.push(`Unit ${u.id}: pool ${u.pool().length} < 30 (sheets would repeat)`);
    if (u.range[0] !== expectedNext) issues.push(`Unit ${u.id}: range gap/overlap at ${u.range[0]} (expected ${expectedNext})`);
    expectedNext = u.range[1] + 1;
  }
  if (expectedNext - 1 !== totalSheets) issues.push(`Curriculum covers ${expectedNext - 1} sheets, expected ${totalSheets}`);

  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(s);
    const unit = CURRICULUM[ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(ui), t, 30);
    const qs = sel.map(p => p.q);

    // RULE 4 — no exact duplicates (only permitted when a concept's pool < 30,
    // i.e. the earliest recognition sheets where the full space is tiny).
    const poolSize = unit.pool().length;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`Sheet ${s}: ${dupes} duplicate(s) despite pool=${poolSize}`);

    // RULE 5 — difficulty rises within the sheet (selected list is sorted asc).
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`Sheet ${s}: difficulty not ascending`);

    // RULE 6 + GPI — mean strictly non-decreasing across the whole pack.
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`Sheet ${s}: GPI dropped (${mean.toFixed(1)} < ${prevMean.toFixed(1)})`);
    prevMean = Math.max(prevMean, mean);
  }

  return { ok: issues.length === 0, issues, gpi };
}
