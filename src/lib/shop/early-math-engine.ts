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
// One question shape — blank on the end — gave a pool too small to fill a
// sheet, so children saw the same sequence twice on a page. The three added
// shapes are the SAME skill (spot the constant step) entered from elsewhere,
// and a blank in the middle is the one that proves a child sees the step
// rather than just adding to whatever number came last.
//
// The shapes are BANDED (transition audit, Sep 2026): the lesson shows one
// forward sequence with the blank at the end, and the opening sheet used to
// open with "___, 37, 39, 41" — a leading blank on an odd run, read backwards,
// before the child had continued a single forward one. So:
//   forward, blank last  →  blank in the middle  →  leading blank  →  counting
//   down — each band exhausted before the next arrives, on-pattern starts
//   (even numbers for the 2s, as the lesson shows) before off-pattern ones,
//   and any sequence that passes `cap` waits for the late sheets: numbers
//   past 100 have not been named yet when the 5s begin.
// `startBy` lets the 2s start on every number (even AND odd runs); the 5s and
// 10s start on their own multiples.
function skipCount(step: number, startLo: number, startHi: number, opts: { startBy?: number; cap?: number } = {}): EP[] {
  const startBy = opts.startBy ?? step;
  const cap = opts.cap ?? Infinity;
  const out: EP[] = [];
  for (let s = startLo; s <= startHi; s += startBy) {
    const a = s, b = s + step, c = s + 2 * step, d = s + 3 * step;
    const base = (d > cap ? 900 : 0) + (s % step !== 0 ? 100 : 0) + d;
    out.push({ q: `${a}, ${b}, ${c}, ___`, a: String(d), diff: base, key: `sk${step}:${s}` });
    out.push({ q: `${a}, ___, ${c}, ${d}`, a: String(b), diff: base + 200, key: `skm${step}:${s}` });
    out.push({ q: `___, ${b}, ${c}, ${d}`, a: String(a), diff: base + 400, key: `skf${step}:${s}` });
    // Counting DOWN by the same step — the pattern read right to left.
    out.push({ q: `${d}, ${c}, ${b}, ___`, a: String(a), diff: base + 600, key: `skb${step}:${s}` });
  }
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
    { id:"missing", label:"Missing number in a sequence", objective:"Student fills the missing number between two numbers", grade:"Kindergarten", stars:2, range:[35,50], pool:()=>missingMiddle(1,58), example:{ problem:"6, ___, 8", steps:["Count on one from 6: 7","Check: 7 is one before 8"], answer:"7" } },
    { id:"greater", label:"Which is greater?", objective:"Student identifies the greater of two numbers", grade:"Kindergarten", stars:2, range:[51,66], pool:()=>compare(1,30,"greater"), example:{ problem:"Which is greater: 4 or 7?", steps:["7 is further along when counting"], answer:"7" } },
    { id:"less", label:"Which is less?", objective:"Student identifies the smaller of two numbers", grade:"Kindergarten", stars:2, range:[67,80], pool:()=>compare(1,30,"less"), example:{ problem:"Which is less: 4 or 7?", steps:["4 comes first when counting"], answer:"4" } },
    { id:"count-on-3", label:"Continue the count", objective:"Student continues a counting sequence", grade:"Grade 1", stars:3, range:[81,92], pool:()=>countOn(1,57), example:{ problem:"5, 6, 7, ___", steps:["Keep counting on by one: 7 → 8"], answer:"8" } },
    // A review of the whole level: all five shapes, in roughly equal shares.
    // The "greater" pairs alone are 435 items against 60 "after" and 59
    // "before", so unsampled they were 32 of 36 questions on the first review
    // sheet — a second "Which is greater" lesson, not a review. Each compare
    // set is thinned to ~70 pairs (deterministic hash, so sheets stay stable).
    { id:"review", label:"Counting — mixed review", objective:"Student counts on, counts back and compares fluently", grade:"Grade 1", stars:3, range:[93,100], pool:()=>[...numberAfter(1,60),...numberBefore(2,60),...missingMiddle(1,58),...countOn(1,57),...compare(1,30,"greater").filter(p=>hashStr(p.key)%6===0),...compare(1,30,"less").filter(p=>hashStr(p.key)%6===0)], example:{ problem:"What number comes after 28?", steps:["Count on by one: 28 → 29","Before is the other way — count back by one: before 28 is 27","Missing number (27, ___, 29): count on one from 27: 28","Which is greater, 28 or 31? 31 is further along when counting, so 31 is greater and 28 is less"], answer:"29" } },
  ],

  M2: [
    { id:"after-100", label:"Numbers after — to 100", objective:"Student names the number after, crossing tens", grade:"Grade 1", stars:2, range:[1,14], pool:()=>numberAfter(20,99), example:{ problem:"What number comes after 19?", steps:["19 → 20 (a new ten)"], answer:"20" } },
    { id:"before-100", label:"Numbers before — to 100", objective:"Student names the number before, crossing tens", grade:"Grade 1", stars:2, range:[15,28], pool:()=>numberBefore(21,100), example:{ problem:"What number comes before 40?", steps:["40 is 4 tens; one less is 3 tens and 9 ones: 39","A round ten goes back to the previous ten's 9: before 70 is 69"], answer:"39" } },
    { id:"tens", label:"Place value — tens", objective:"Student identifies the tens digit", grade:"Grade 1", stars:3, range:[29,42], pool:()=>placeValue(10,99,"tens"), example:{ problem:"How many tens in 47?", steps:["47 = 4 tens and 7 ones"], answer:"4" } },
    { id:"ones", label:"Place value — ones", objective:"Student identifies the ones digit", grade:"Grade 1", stars:3, range:[43,56], pool:()=>placeValue(10,99,"ones"), example:{ problem:"How many ones in 47?", steps:["47 = 4 tens and 7 ones"], answer:"7" } },
    // Addition is not taught until M3, so the steps count on / count back (M1)
    // rather than "6 + 2 = 8". Even runs first (as the lesson shows), the
    // odd runs and the other shapes arrive over the unit; the counting-down
    // shape is modelled here because it needs "count back", not "count on".
    { id:"skip-2", label:"Skip counting by 2", objective:"Student continues a count-by-2 pattern", grade:"Grade 1", stars:3, range:[57,68], pool:()=>skipCount(2,1,60,{ startBy:1 }), example:{ problem:"2, 4, 6, ___", steps:["Count on two from 6: 7, 8 — so the next number is 8","Every number is 2 more than the one before: 2, 4, 6, 8","Counting down by 2 (20, 18, 16, ___): count back two from 16: 15, 14 — so 14"], answer:"8" } },
    // Numbers past 100 have not been named or written yet (place value was
    // tens and ones only), so runs that pass 100 wait for the late sheets.
    { id:"skip-5", label:"Skip counting by 5", objective:"Student continues a count-by-5 pattern", grade:"Grade 1-2", stars:4, range:[69,80], pool:()=>skipCount(5,5,150,{ cap:100 }), example:{ problem:"5, 10, 15, ___", steps:["Count on five from 15: 16, 17, 18, 19, 20 — so the next number is 20","Counting by 5, every number ends in 5 or 0: 5, 10, 15, 20","Counting down by 5 (30, 25, 20, ___): count back five from 20: 19, 18, 17, 16, 15 — so 15"], answer:"20" } },
    { id:"skip-10", label:"Skip counting by 10", objective:"Student continues a count-by-10 pattern", grade:"Grade 1-2", stars:4, range:[81,90], pool:()=>skipCount(10,10,300,{ cap:150 }), example:{ problem:"10, 20, 30, ___", steps:["Counting by 10, the tens digit goes up by one each time: 1 ten, 2 tens, 3 tens, so 4 tens = 40","Crossing 100 (80, 90, 100, ___): after 10 tens comes 11 tens, which is 110"], answer:"40" } },
    { id:"compare-2d", label:"Compare two-digit numbers", objective:"Student compares two-digit numbers", grade:"Grade 2", stars:4, range:[91,100], pool:()=>compare(10,99,"greater"), example:{ problem:"Which is greater: 35 or 53?", steps:["Compare tens first: 5 tens > 3 tens, so 53 is greater","If the tens are the same (66 or 62), compare the ones: 6 ones > 2 ones, so 66"], answer:"53" } },
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
  // The window OPENS as the unit progresses (20% of the pool on day one, 70%
  // by the last sheet — the same ramp as the arithmetic engine). A flat 70%
  // let the first skip-counting sheet draw leading-blank and counting-down
  // runs the lesson had not shown; the banded pools above only hold if the
  // opening sheet stays inside the easiest band.
  const tc = Math.min(1, Math.max(0, t));
  const W = Math.min(N, Math.max(count, Math.round(N * (0.2 + 0.5 * tc))));
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
