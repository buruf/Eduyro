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
    // Randomize the DISPLAY order (deterministically) so the correct number
    // isn't always in the same slot — otherwise "greater" is always the 2nd
    // number and "less" always the 1st, and a child can win without comparing.
    const [x, y] = hashStr(`cmp:${which}:${a}_${b}`) % 2 === 0 ? [b, a] : [a, b];
    out.push({ q: `Which is ${which}: ${x} or ${y}?`, a: String(ans), diff: b + (b - a) * 0.2, key: `cmp${which}:${a}_${b}` });
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
// Seeded RNG + de-patterning so consecutive sheets DIFFER and questions aren't
// in a fill-in-the-blank sequence (was: no seed → identical sheets, sorted by
// value → "after 1, after 2, after 3…" trivially guessable).
function mulberry32(seed: number): () => number {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle<T>(a: T[], rng: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
// No two adjacent answers equal, and no run of 3 monotonic answers (kills the
// "count up in order" pattern the user saw).
function arrangeNoPattern(items: EP[]): EP[] {
  const remaining = [...items]; const out: EP[] = [];
  while (remaining.length) {
    let pick = -1;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i], prev = out[out.length - 1], prev2 = out[out.length - 2];
      const ca = Number(cand.a), pa = prev ? Number(prev.a) : NaN, p2a = prev2 ? Number(prev2.a) : NaN;
      if (prev && Number.isFinite(ca) && Number.isFinite(pa) && ca === pa) continue;
      if (prev2 && [ca, pa, p2a].every(Number.isFinite)) { if (pa - p2a > 0 && ca - pa > 0) continue; if (pa - p2a < 0 && ca - pa < 0) continue; }
      pick = i; break;
    }
    if (pick === -1) pick = 0;
    out.push(remaining.splice(pick, 1)[0]);
  }
  return out;
}
function selectProblems(pool: EP[], t: number, count: number, seed: number): EP[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.q) ? false : (seen.add(p.q), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  const W = Math.min(N, Math.max(count, Math.round(N * 0.7)));
  const start = N <= count ? 0 : Math.round(t * (N - W));
  const win = N <= count ? sorted : sorted.slice(start, start + W);
  const bag = shuffle(win.length ? win : sorted, rng);
  if (!bag.length) return [];
  const chosen: EP[] = [];
  for (let i = 0; i < count; i++) chosen.push(bag[i % bag.length]);
  return arrangeNoPattern(shuffle(chosen, rng));
}

// ── Public API ────────────────────────────────────────────────────────────────
/** Resolve an early-math micro-skill's lesson by its unit label (exact match),
 *  so M1/M2 lessons use their OWN objective + example instead of keyword-
 *  matched tutorial fallbacks (same fix as arithmetic's fact-family leak). */
export function getEarlyMathMicroLesson(label: string): { goal: string; bigIdea: string; example: { problem: string; steps: string[]; answer: string }; umbrella: string } | null {
  for (const [code, units] of Object.entries(CURRICULA)) {
    const u = units.find((x) => x.label === label);
    if (u) {
      const g = u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase());
      return { goal: g, bigIdea: g, example: u.example, umbrella: code === "M1" ? "Counting" : "Place value" };
    }
  }
  return null;
}

export function isEarlyMathLevel(levelCode: string): boolean {
  return levelCode in CURRICULA;
}

// The ordered SKILL MAP for a level — the engine's real content units (these are
// the "skills" the student advances through one lesson per day).
export interface LevelSkill { index: number; id: string; label: string; objective: string; grade: string; range: [number, number]; }
export function earlyMathUnits(levelCode: string): LevelSkill[] {
  return (CURRICULA[levelCode] ?? []).map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
}

export function generateEarlyMathSheet(
  levelCode: string, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(levelCode, sheetNumber);
  const unit = CURRICULA[levelCode][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(levelCode, ui), t, problemCount, hashStr(`${levelCode}:${sheetNumber}`));
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
    const sel = selectProblems(buildScoredPool(level, ui), t, 30, hashStr(`${level}:${s}`));
    const qs = sel.map(p => p.q);
    const poolSize = new Set(unit.pool().map(p => p.q)).size;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`${level} sheet ${s}: ${dupes} dup(s) (pool=${poolSize})`);
    // Order is intentionally de-patterned (not ascending) now.
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`${level} sheet ${s}: GPI dropped`);
    prevMean = Math.max(prevMean, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}
