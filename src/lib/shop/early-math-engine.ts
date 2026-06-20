// src/lib/shop/early-math-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO EARLY-MATH ENGINE  (M1 Early Counting · M2 Number Sense)
//
// These are student-platform levels (not shop skills), so this engine is keyed
// by LEVEL CODE rather than skill name. Same progression-first guarantees as the
// other engines: enumerate the space → score → select a unique, strictly
// ascending slice via a sliding window. All direct-math, short numeric answers.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample, ShopSkill } from "./progressive-generator";

interface EP { q: string; a: string; diff: number; key: string; }

// ── Enumerators (each returns a pool of ≥30 unique problems) ───────────────────
function numberAfter(lo: number, hi: number): EP[] {
  const out: EP[] = [];
  for (let n = lo; n <= hi; n++)
    out.push({ q: `What number comes after ${n}?`, a: String(n + 1), diff: n, key: `aft:${n}` });
  return out;
}
function numberBefore(lo: number, hi: number): EP[] {
  const out: EP[] = [];
  for (let n = lo; n <= hi; n++)
    out.push({ q: `What number comes before ${n}?`, a: String(n - 1), diff: n, key: `bef:${n}` });
  return out;
}
function missingMiddle(lo: number, hi: number): EP[] {
  const out: EP[] = [];
  for (let n = lo; n <= hi; n++)
    out.push({ q: `${n}, ___, ${n + 2}`, a: String(n + 1), diff: n, key: `mid:${n}` });
  return out;
}
function countOn(lo: number, hi: number): EP[] {
  const out: EP[] = [];
  for (let n = lo; n <= hi; n++)
    out.push({ q: `${n}, ${n + 1}, ${n + 2}, ___`, a: String(n + 3), diff: n + 2, key: `con:${n}` });
  return out;
}
function compare(lo: number, hi: number, which: "greater" | "less"): EP[] {
  const out: EP[] = [];
  for (let a = lo; a <= hi; a++) for (let b = lo; b <= hi; b++) {
    if (a >= b) continue;                                   // a<b, each unordered pair once
    const ans = which === "greater" ? b : a;
    out.push({ q: `Which is ${which}: ${a} or ${b}?`, a: String(ans), diff: b + (b - a) * 0.2, key: `cmp${which}:${a}_${b}` });
  }
  return out;
}
function placeValue(lo: number, hi: number, part: "tens" | "ones"): EP[] {
  const out: EP[] = [];
  for (let n = lo; n <= hi; n++)
    out.push({ q: `How many ${part} in ${n}?`, a: String(part === "tens" ? Math.floor(n / 10) : n % 10), diff: n, key: `pv${part}:${n}` });
  return out;
}
function skipCount(step: number, startLo: number, startHi: number): EP[] {
  const out: EP[] = [];
  for (let s = startLo; s <= startHi; s += step)
    out.push({ q: `${s}, ${s + step}, ${s + 2 * step}, ___`, a: String(s + 3 * step), diff: s + step * 3, key: `sk${step}:${s}` });
  return out;
}

// ── Curriculum units ──────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => EP[]; example: WorkedExample;
}

const CURRICULA: Record<string, Unit[]> = {
  M1: [
    { id:"after-20", label:"Counting on — what comes next", objective:"Student names the number that comes after a given number", grade:"Kindergarten", stars:1, range:[1,18], pool:()=>numberAfter(1,60), example:{ problem:"What number comes after 7?", steps:["Count on by one: 7 → 8"], answer:"8" } },
    { id:"before-20", label:"Counting back — what comes before", objective:"Student names the number that comes before a given number", grade:"Kindergarten", stars:1, range:[19,34], pool:()=>numberBefore(2,60), example:{ problem:"What number comes before 12?", steps:["Count back by one: 12 → 11"], answer:"11" } },
    { id:"missing", label:"Missing number in a sequence", objective:"Student fills the missing number between two numbers", grade:"Kindergarten", stars:2, range:[35,50], pool:()=>missingMiddle(1,58), example:{ problem:"6, ___, 8", steps:["The number between 6 and 8 is 7"], answer:"7" } },
    { id:"greater", label:"Which is greater?", objective:"Student identifies the greater of two numbers", grade:"Kindergarten", stars:2, range:[51,66], pool:()=>compare(1,30,"greater"), example:{ problem:"Which is greater: 4 or 7?", steps:["7 is further along when counting"], answer:"7" } },
    { id:"less", label:"Which is less?", objective:"Student identifies the smaller of two numbers", grade:"Kindergarten", stars:2, range:[67,80], pool:()=>compare(1,30,"less"), example:{ problem:"Which is less: 4 or 7?", steps:["4 comes first when counting"], answer:"4" } },
    { id:"count-on-3", label:"Continue the count", objective:"Student continues a counting sequence", grade:"Grade 1", stars:3, range:[81,92], pool:()=>countOn(1,57), example:{ problem:"5, 6, 7, ___", steps:["Keep counting on by one: 7 → 8"], answer:"8" } },
    { id:"review", label:"Counting — mixed review", objective:"Student counts on, counts back and compares fluently", grade:"Grade 1", stars:3, range:[93,100], pool:()=>[...numberAfter(1,60),...numberBefore(2,60),...compare(1,30,"greater")], example:{ problem:"What number comes after 28?", steps:["Count on by one: 28 → 29"], answer:"29" } },
  ],

  M2: [
    { id:"after-100", label:"Numbers after — to 100", objective:"Student names the number after, crossing tens", grade:"Grade 1", stars:2, range:[1,14], pool:()=>numberAfter(20,99), example:{ problem:"What number comes after 19?", steps:["19 → 20 (a new ten)"], answer:"20" } },
    { id:"before-100", label:"Numbers before — to 100", objective:"Student names the number before, crossing tens", grade:"Grade 1", stars:2, range:[15,28], pool:()=>numberBefore(21,100), example:{ problem:"What number comes before 40?", steps:["40 → 39"], answer:"39" } },
    { id:"tens", label:"Place value — tens", objective:"Student identifies the tens digit", grade:"Grade 1", stars:3, range:[29,42], pool:()=>placeValue(10,99,"tens"), example:{ problem:"How many tens in 47?", steps:["47 = 4 tens and 7 ones"], answer:"4" } },
    { id:"ones", label:"Place value — ones", objective:"Student identifies the ones digit", grade:"Grade 1", stars:3, range:[43,56], pool:()=>placeValue(10,99,"ones"), example:{ problem:"How many ones in 47?", steps:["47 = 4 tens and 7 ones"], answer:"7" } },
    { id:"skip-2", label:"Skip counting by 2", objective:"Student continues a count-by-2 pattern", grade:"Grade 1", stars:3, range:[57,68], pool:()=>skipCount(2,1,60), example:{ problem:"2, 4, 6, ___", steps:["Add 2 each time: 6 + 2 = 8"], answer:"8" } },
    { id:"skip-5", label:"Skip counting by 5", objective:"Student continues a count-by-5 pattern", grade:"Grade 1-2", stars:4, range:[69,80], pool:()=>skipCount(5,5,150), example:{ problem:"5, 10, 15, ___", steps:["Add 5 each time: 15 + 5 = 20"], answer:"20" } },
    { id:"skip-10", label:"Skip counting by 10", objective:"Student continues a count-by-10 pattern", grade:"Grade 1-2", stars:4, range:[81,90], pool:()=>skipCount(10,10,300), example:{ problem:"10, 20, 30, ___", steps:["Add 10 each time: 30 + 10 = 40"], answer:"40" } },
    { id:"compare-2d", label:"Compare two-digit numbers", objective:"Student compares two-digit numbers", grade:"Grade 2", stars:4, range:[91,100], pool:()=>compare(10,99,"greater"), example:{ problem:"Which is greater: 35 or 53?", steps:["Compare tens: 5 tens > 3 tens"], answer:"53" } },
  ],
};

const SKILL_CODE: Record<string, string> = { M1: "M1", M2: "M2" };

// ── Selection + GPI (identical guarantees to the other engines) ───────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(level: string, sheet: number): number {
  const units = CURRICULA[level];
  const idx = units.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? units.length - 1 : idx;
}
function buildScoredPool(level: string, unitIndex: number): EP[] {
  const raw = CURRICULA[level][unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}
function selectProblems(pool: EP[], t: number, count: number): EP[] {
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.key) ? false : (seen.add(p.key), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  if (N <= count) {
    const out: EP[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }
  const W = Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  const chosen: EP[] = [];
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
export function isEarlyMathLevel(levelCode: string): boolean {
  return levelCode in CURRICULA;
}

export function generateEarlyMathSheet(
  levelCode: string, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(levelCode, sheetNumber);
  const unit = CURRICULA[levelCode][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(levelCode, ui), t, problemCount);
  const problems = selected.map((p, i) => ({
    id: nanoid(8), type: "arithmetic" as const, question: p.q, answer: p.a, points: 1,
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill: ("ADDITION" as ShopSkill),                       // placeholder; renderer keys off skillCode
      skillCode: SKILL_CODE[levelCode] ?? levelCode,
      sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 8 + Math.round(t * 6),
    },
  };
}

// ── Self-validation (used by tests) ──────────────────────────────────────────
export function validateEarlyMathPack(level: string, totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(level, s);
    const unit = CURRICULA[level][ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(level, ui), t, 30);
    const qs = sel.map(p => p.q);
    const poolSize = new Set(unit.pool().map(p => p.key)).size;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`${level} sheet ${s}: ${dupes} dup(s) (pool=${poolSize})`);
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`${level} sheet ${s}: not ascending`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`${level} sheet ${s}: GPI dropped`);
    prevMean = Math.max(prevMean, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}
