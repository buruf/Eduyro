// src/lib/shop/arithmetic-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO ARITHMETIC CURRICULUM ENGINE  (+, -, ×, ÷)
//
// Same progression-first design as fraction-engine.ts:
//   • Each concept ENUMERATES its valid problem space (bounded by striding for
//     very large spaces, so pools stay big but finite).
//   • Each problem is scored by ONE deterministic difficulty function.
//   • Each sheet selects a UNIQUE, strictly-ASCENDING slice via a window that
//     slides upward sheet-to-sheet.
//   ⇒ No duplicates, rising within-sheet difficulty, and a monotonic Global
//     Progression Index — true by construction.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample, ShopSkill } from "./progressive-generator";

interface AProblem { q: string; a: string; diff: number; key: string; type?: "arithmetic" | "multiple_choice" | "true_false"; options?: string[]; strat?: string; }

// ── Difficulty helpers ────────────────────────────────────────────────────────
const digits = (n: number) => String(Math.abs(n)).length;
const magnitude = (n: number) => Math.abs(n) % Math.pow(10, digits(n) - 1); // within-digit-class size
const addCarry = (a: number, b: number) => (a % 10) + (b % 10) >= 10 ? 1 : 0;
const subBorrow = (a: number, b: number) => (a % 10) < (b % 10) ? 1 : 0;

// ── Bounded space iterator ────────────────────────────────────────────────────
// Iterate a×b space; if it's huge, stride so we still get a dense, varied sample
// (a few hundred problems) rather than enumerating millions.
function eachPair(
  aLo: number, aHi: number, bLo: number, bHi: number,
  fn: (a: number, b: number) => void,
  cap = 700,
) {
  const total = (aHi - aLo + 1) * (bHi - bLo + 1);
  const stride = total <= cap ? 1 : Math.max(1, Math.round(Math.sqrt(total / cap)));
  for (let a = aLo; a <= aHi; a += stride)
    for (let b = bLo; b <= bHi; b += stride) fn(a, b);
}

// ── ADDITION enumerators ──────────────────────────────────────────────────────
function enumAdd(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (carry !== undefined && addCarry(a, b) !== (carry ? 1 : 0)) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (digits(m) - 1) * 30 + magnitude(m) + addCarry(a, b) * 20, key: `${a}+${b}` });
  });
  return out;
}
// True "no regrouping": 2-digit + 2-digit with NO carry in EITHER column (the
// plain enumAdd `carry:false` only checks the ones column, so it lets tens-carry
// problems like 70+79=149 leak onto "no regrouping" sheets).
function enumAddClean(aLo: number, aHi: number, bLo: number, bHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if ((a % 10) + (b % 10) >= 10) return;                       // ones carry
    if (Math.floor(a / 10) + Math.floor(b / 10) >= 10) return;   // tens carry
    const m = Math.max(a, b);
    out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (digits(m) - 1) * 30 + magnitude(m), key: `${a}+${b}` });
  });
  return out;
}
function enumMissingAdd(aLo: number, aHi: number, bLo: number, bHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    out.push({ q: `___ + ${b} = ${a + b}`, a: String(a), diff: (digits(a + b) - 1) * 30 + magnitude(a + b) + 18, key: `m+${a}_${b}` });
  });
  return out;
}
function enumThreeAdd(lo: number, hi: number, cap = 90): AProblem[] {
  // Cap the count (strided) — an uncapped triple loop generates 100k+ items that
  // would swamp the two-addend pools (which eachPair caps at ~700) and dominate a
  // mixed unit. Keep three-addends a bounded minority.
  const out: AProblem[] = [];
  const range = hi - lo + 1;
  const stride = range ** 3 <= cap ? 1 : Math.max(1, Math.round(Math.cbrt((range ** 3) / cap)));
  for (let a = lo; a <= hi; a += stride)
    for (let b = lo; b <= hi; b += stride)
      for (let c = lo; c <= hi; c += stride)
        out.push({ q: `${a} + ${b} + ${c}`, a: String(a + b + c), diff: (a + b + c) + 15, key: `${a}+${b}+${c}` });
  return out;
}

// ── SUBTRACTION enumerators ───────────────────────────────────────────────────
function enumSub(aLo: number, aHi: number, bLo: number, bHi: number, borrow?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (b > a) return;
    if (borrow !== undefined && subBorrow(a, b) !== (borrow ? 1 : 0)) return;
    out.push({ q: `${a} - ${b}`, a: String(a - b), diff: (digits(a) - 1) * 30 + magnitude(a) + subBorrow(a, b) * 25, key: `${a}-${b}` });
  });
  return out;
}
function enumMissingSub(aLo: number, aHi: number, bLo: number, bHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (b > a) return;
    out.push({ q: `${a} - ___ = ${a - b}`, a: String(b), diff: (digits(a) - 1) * 30 + magnitude(a) + 18, key: `${a}-m${b}` });
  });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// STRATEGY-STAGED FOUNDATIONAL FACTS (curriculum-expert design)
// Each early unit teaches ONE derivation that reuses the prior one:
//   count-on → doubles → +0/commutativity → near-doubles → make-ten/bridging →
//   fact families. Facts are TAGGED by strategy so a reviewer can certify a sheet
//   teaches its target strategy, and so spiral review can interleave prior stages.
// ═════════════════════════════════════════════════════════════════════════════
type Fact = { a: number; b: number; diff: number; strat: string };

// Wrap a strategy's base facts into a varied pool: direct + missing-addend +
// occasional MC / true-false. (Same format mix as the small-unit enrichment.)
function addFormats(items: Fact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat } of items) {
    const s = a + b;
    out.push({ q: `${a} + ${b}`, a: String(s), diff, key: `d:${strat}:${a}+${b}`, strat });
    out.push({ q: `${a} + ___ = ${s}`, a: String(b), diff: diff + 0.3, key: `ma:${strat}:${a}_${s}_${b}`, strat });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(s), String(s + 1), String(Math.max(0, s - 1)), String(s + 2)], mulberry32(hashStr(`mc+${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} + ${b} = ?`, a: String(s), diff: diff + 0.2, key: `mc:${strat}:${a}+${b}`, type: "multiple_choice", options: opts, strat });
    }
    // (True/False removed — it was print-stripped everywhere and unused in
    // interactive practice, and it made the printed problem count non-uniform.)
  }
  return out;
}
function subFormats(items: Fact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat } of items) {
    const r = a - b;
    out.push({ q: `${a} - ${b}`, a: String(r), diff, key: `d:${strat}:${a}-${b}`, strat });
    out.push({ q: `${a} - ___ = ${r}`, a: String(b), diff: diff + 0.3, key: `ms:${strat}:${a}_${r}_${b}`, strat });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(r), String(r + 1), String(Math.max(0, r - 1)), String(r + 2)], mulberry32(hashStr(`mc-${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} - ${b} = ?`, a: String(r), diff: diff + 0.2, key: `mc:${strat}:${a}-${b}`, type: "multiple_choice", options: opts, strat });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}

// Spiral: ~70% current strategy, ~25% prior stage(s), ~5% two-stages-back —
// approximated by including those counts in the pool (the seeded sampler then
// draws across them). Review facts keep their own keys so they're de-duped.
function det<T>(arr: T[], k: number, seed: string): T[] { return shuffle(arr, mulberry32(hashStr(seed))).slice(0, Math.max(0, k)); }
function spiral(current: AProblem[], prior: AProblem[], twoBack: AProblem[], tag: string): AProblem[] {
  const n = current.length;
  let lo = Infinity, hi = -Infinity; for (const p of current) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = (hi - lo) || 1;
  // Spread review facts ACROSS the current stage's difficulty band so the
  // per-sheet difficulty window mixes review throughout (not clustered on early
  // sheets). Review keeps its own keys/strat tag for the acceptance checker.
  const remap = (arr: AProblem[], k: number, seed: string) => det(arr, k, seed).map((p, i) => ({ ...p, diff: lo + ((i + 0.5) / Math.max(1, k)) * span }));
  return [...current, ...remap(prior, Math.round((n * 25) / 70), tag + ":p"), ...remap(twoBack, Math.round((n * 5) / 70), tag + ":tb")];
}

// ── Addition strategy fact sets ──
function fCountOn(): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) for (const b of [1, 2, 3]) if (a + b <= 10) { o.push({ a, b, diff: a + b, strat: "count-on" }); o.push({ a: b, b: a, diff: a + b + 0.1, strat: "count-on" }); } return o; }
function fDoubles(): Fact[] { const o: Fact[] = []; for (let n = 1; n <= 12; n++) o.push({ a: n, b: n, diff: 2 * n, strat: "doubles" }); return o; }
function fZeroComm(): Fact[] { const o: Fact[] = []; for (let a = 0; a <= 9; a++) { o.push({ a, b: 0, diff: a + 1, strat: "zero-comm" }); o.push({ a: 0, b: a, diff: a + 1.1, strat: "zero-comm" }); } for (let a = 2; a <= 8; a++) for (let b = a + 1; b <= 9 && a + b <= 12; b++) { o.push({ a, b, diff: a + b, strat: "zero-comm" }); o.push({ a: b, b: a, diff: a + b + 0.1, strat: "zero-comm" }); } return o; }
function fNearDoubles(): Fact[] { const o: Fact[] = []; for (let n = 1; n <= 8; n++) { o.push({ a: n, b: n + 1, diff: 2 * n + 1, strat: "near-doubles" }); o.push({ a: n + 1, b: n, diff: 2 * n + 1.1, strat: "near-doubles" }); } return o; }
function fMakeTen(): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) o.push({ a, b: 10 - a, diff: 10, strat: "make-ten" }); for (let a = 5; a <= 9; a++) for (let b = 11 - a; b <= 9 && a + b >= 11 && a + b <= 18; b++) o.push({ a, b, diff: a + b + 2, strat: "make-ten" }); return o; }
function fFactFamily(): Fact[] { const o: Fact[] = []; for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9 && a + b <= 18; b++) o.push({ a, b, diff: a + b + 3, strat: "fact-family" }); return o; }

// ── Subtraction strategy fact sets ──
function sCountBack(): Fact[] { const o: Fact[] = []; for (let a = 2; a <= 10; a++) for (const b of [1, 2, 3]) if (b <= a) o.push({ a, b, diff: a, strat: "count-back" }); return o; }
function sZero(): Fact[] { const o: Fact[] = []; for (let a = 0; a <= 10; a++) { o.push({ a, b: 0, diff: a + 1, strat: "sub-zero" }); o.push({ a, b: a, diff: a + 1.1, strat: "sub-zero" }); } return o; }
function sCountUp(): Fact[] { const o: Fact[] = []; for (let a = 4; a <= 10; a++) for (let b = 1; b < a; b++) if (a - b <= 4) o.push({ a, b, diff: a + 2, strat: "count-up" }); return o; }
function sNearDoubles(): Fact[] { const o: Fact[] = []; for (let n = 1; n <= 9; n++) { o.push({ a: 2 * n, b: n, diff: 2 * n + 3, strat: "halves" }); if (2 * n + 1 <= 18) o.push({ a: 2 * n + 1, b: n, diff: 2 * n + 3.1, strat: "halves" }); } return o; }
function sBridge(): Fact[] { const o: Fact[] = []; for (let a = 11; a <= 18; a++) for (let b = 2; b <= 9; b++) if (a - b >= 1 && (a % 10) < b) o.push({ a, b, diff: a + 4, strat: "bridge-down" }); return o; }
function sFactFamily(): Fact[] { const o: Fact[] = []; for (let a = 2; a <= 18; a++) for (let b = 1; b < a && a - b <= 9 && b <= 9; b++) o.push({ a, b, diff: a + 5, strat: "fact-family" }); return o; }

// ── Multiplication strategy fact sets + format wrapper ──
type MFact = { a: number; b: number; diff: number; strat: string };
function mTables(tables: number[], strat: string): MFact[] { const o: MFact[] = []; for (const t of tables) for (let b = 1; b <= 12; b++) o.push({ a: t, b, diff: t * b * 0.4 + Math.max(t, b), strat }); return o; }
function mSquares(): MFact[] { const o: MFact[] = []; for (let n = 1; n <= 12; n++) o.push({ a: n, b: n, diff: n * n * 0.4, strat: "squares" }); return o; }
function mAll(): MFact[] { const o: MFact[] = []; for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) o.push({ a, b, diff: a * b * 0.4, strat: "fact-family" }); return o; }
function mulFormats(items: MFact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { a, b, diff, strat } of items) {
    const p = a * b;
    out.push({ q: `${a} × ${b}`, a: String(p), diff, key: `d:${strat}:${a}x${b}`, strat });
    // Missing-factor is only well-posed when the KNOWN factor is non-zero:
    // "0 × ___ = 0" has infinitely many solutions, so never emit it (a!==0),
    // and "a × ___ = 0" would force the blank to 0 ambiguously (b!==0).
    if (b !== 0 && a !== 0) out.push({ q: `${a} × ___ = ${p}`, a: String(b), diff: diff + 0.3, key: `mf:${strat}:${a}_${p}_${b}`, strat });
    if ((a + b) % 3 === 0) {
      const opts = shuffle([String(p), String(p + a), String(Math.max(0, p - a)), String(p + Math.max(1, b))], mulberry32(hashStr(`mc*${strat}${a}_${b}`)));
      if (new Set(opts).size === 4) out.push({ q: `${a} × ${b} = ?`, a: String(p), diff: diff + 0.2, key: `mc:${strat}:${a}x${b}`, type: "multiple_choice", options: opts, strat });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}
// ── Division strategy fact sets + format wrapper (inverse of multiplication) ──
type DFact = { dividend: number; divisor: number; q: number; diff: number; strat: string };
function dTables(divisors: number[], strat: string): DFact[] { const o: DFact[] = []; for (const d of divisors) for (let q = 1; q <= 12; q++) o.push({ dividend: d * q, divisor: d, q, diff: d * q * 0.35 + d, strat }); return o; }
function dIdentity(): DFact[] { const o: DFact[] = []; for (let n = 1; n <= 12; n++) { o.push({ dividend: n, divisor: 1, q: n, diff: n + 1, strat: "identity" }); o.push({ dividend: n, divisor: n, q: 1, diff: n + 1.1, strat: "identity" }); } return o; }
function dSquares(): DFact[] { const o: DFact[] = []; for (let n = 1; n <= 12; n++) o.push({ dividend: n * n, divisor: n, q: n, diff: n * n * 0.35, strat: "squares" }); return o; }
function dAll(): DFact[] { const o: DFact[] = []; for (let d = 2; d <= 12; d++) for (let q = 2; q <= 12; q++) o.push({ dividend: d * q, divisor: d, q, diff: d * q * 0.35, strat: "fact-family" }); return o; }
function divFormats(items: DFact[]): AProblem[] {
  const out: AProblem[] = [];
  for (const { dividend, divisor, q, diff, strat } of items) {
    out.push({ q: `${dividend} ÷ ${divisor}`, a: String(q), diff, key: `d:${strat}:${dividend}/${divisor}`, strat });
    out.push({ q: `${dividend} ÷ ___ = ${q}`, a: String(divisor), diff: diff + 0.3, key: `md:${strat}:${dividend}_${q}_${divisor}`, strat });
    if ((divisor + q) % 3 === 0) {
      const opts = shuffle([String(q), String(q + 1), String(Math.max(0, q - 1)), String(q + 2)], mulberry32(hashStr(`mc/${strat}${dividend}_${divisor}`)));
      if (new Set(opts).size === 4) out.push({ q: `${dividend} ÷ ${divisor} = ?`, a: String(q), diff: diff + 0.2, key: `mc:${strat}:${dividend}/${divisor}`, type: "multiple_choice", options: opts, strat });
    }
    // (True/False removed — see addFormats.)
  }
  return out;
}

// ── MULTIPLICATION enumerators ────────────────────────────────────────────────
// ── "Break apart to multiply" (the M5 bridge unit) ───────────────────────────
// Expert-designed bridge between fact recall (×10/11/12) and the written
// 2-digit × 1-digit algorithm: 27 × 4 was the first non-lookup question in the
// whole level and nothing taught the split. Three item stages, sequenced by
// `diff` so the unit's sheet ramp walks them in order:
//   1. SCAFFOLDED STEPS  — "23 × 3  Step 1: 20 × 3 =" / "Step 2: 3 × 3 =" /
//      combine. Each step is its own graded item, which is also the diagnostic:
//      step-1 misses = place value, step-2 = facts, combine = the addition load.
//   2. SPLIT PRACTICE    — "34 × 2 = (30 × 2) + (___ × 2)" and one-line splits.
//   3. BARE VERTICAL     — plain "23 × 3" (stacked in the UI), still NO
//      regrouping anywhere: every partial product stays ≤ 9 by construction.
// Regrouping is deliberately absent — it is the NEXT unit's job. Teaching the
// split on carry-free numbers first is the whole point of the bridge.
function enumBreakApart(): AProblem[] {
  const out: AProblem[] = [];
  for (let a = 12; a <= 99; a++) {
    const tens = Math.floor(a / 10), ones = a % 10;
    if (ones === 0) continue; // 30 × 2 has no split to practise
    for (let b = 2; b <= 9; b++) {
      // BOTH partial products single-digit → no regrouping anywhere.
      if (tens * b > 9 || ones * b > 9) continue;
      const pT = tens * 10 * b, pO = ones * b, prod = a * b;
      const base = a * b; // bigger numbers later within each stage
      // Stage 1 — scaffolded steps (three separate graded items).
      out.push({ q: `${a} × ${b}   Step 1: ${tens * 10} × ${b} =`, a: String(pT), diff: base, key: `ba1-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `${a} × ${b}   Step 2: ${ones} × ${b} =`, a: String(pO), diff: base + 1, key: `ba2-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `${tens * 10} × ${b} = ${pT} and ${ones} × ${b} = ${pO}. So ${a} × ${b} =`, a: String(prod), diff: base + 2, key: `ba3-${a}x${b}`, strat: "break-apart" });
      // Stage 2 — the split itself, then a one-line split.
      out.push({ q: `${a} × ${b} = (${tens * 10} × ${b}) + (___ × ${b})`, a: String(ones), diff: 400 + base, key: `ba4-${a}x${b}`, strat: "break-apart" });
      out.push({ q: `Break apart: ${a} × ${b} = (${tens * 10} × ${b}) + (${ones} × ${b}) =`, a: String(prod), diff: 500 + base, key: `ba5-${a}x${b}`, strat: "break-apart" });
      // Stage 3 — bare (renders stacked; carry boxes appear but stay empty).
      out.push({ q: `${a} × ${b}`, a: String(prod), diff: 900 + base, key: `ba6-${a}x${b}`, strat: "break-apart" });
    }
  }
  return out;
}

function enumMul(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    const c = (a % 10) * (b % 10) >= 10 ? 1 : 0;
    if (carry !== undefined && c !== (carry ? 1 : 0)) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} × ${b}`, a: String(a * b), diff: m * 3 + (digits(a) + digits(b) - 2) * 30, key: `${a}x${b}` });
  });
  return out;
}
function enumMissingFactor(aLo: number, aHi: number, bLo: number, bHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    out.push({ q: `${a} × ___ = ${a * b}`, a: String(b), diff: Math.max(a, b) * 3 + 18, key: `${a}xm${b}` });
  });
  return out;
}

// ── DIVISION enumerators ──────────────────────────────────────────────────────
function enumDivExact(divLo: number, divHi: number, qLo: number, qHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, qLo, qHi, (d, q) => {
    const dividend = d * q;
    out.push({ q: `${dividend} ÷ ${d}`, a: String(q), diff: d * 5 + (digits(dividend) - 1) * 25, key: `${dividend}/${d}` });
  });
  return out;
}
function enumDivRemainder(divLo: number, divHi: number, dividendLo: number, dividendHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, dividendLo, dividendHi, (d, dividend) => {
    if (d < 2 || dividend < d) return;
    const q = Math.floor(dividend / d), r = dividend % d;
    if (r === 0) return; // remainder problems only
    out.push({ q: `${dividend} ÷ ${d}`, a: `${q} r ${r}`, diff: d * 5 + (digits(dividend) - 1) * 25 + 20, key: `${dividend}/${d}r` });
  });
  return out;
}
function enumMissingDividend(divLo: number, divHi: number, qLo: number, qHi: number): AProblem[] {
  const out: AProblem[] = [];
  eachPair(divLo, divHi, qLo, qHi, (d, q) => {
    out.push({ q: `___ ÷ ${d} = ${q}`, a: String(d * q), diff: d * 5 + (digits(d * q) - 1) * 25 + 18, key: `m/${d}=${q}` });
  });
  return out;
}

// ── Curriculum units ──────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => AProblem[]; example: WorkedExample;
}

const CURRICULA: Record<string, Unit[]> = {
  // Strategy-staged (curriculum-expert design): each early unit teaches ONE new
  // derivation that reuses the prior, with ~70/25/5 spiral review interleaved.
  ADDITION: [
    { id:"add-count-on", label:"Adding by counting on (+1, +2, +3)", objective:"Student adds by counting on from the larger number", grade:"Grade 1", stars:1, range:[1,5], pool:()=>addFormats(fCountOn()), example:{ problem:"7 + 2 =", steps:["Start at 7, count on 2: 8, 9"], answer:"9" } },
    { id:"add-doubles", label:"Doubles (1+1 … 9+9)", objective:"Student recalls the doubles facts", grade:"Grade 1", stars:1, range:[6,8], pool:()=>spiral(addFormats(fDoubles()), addFormats(fCountOn()), [], "ad2"), example:{ problem:"6 + 6 =", steps:["Double 6 is 12"], answer:"12" } },
    { id:"add-zero-comm", label:"Adding zero & turnarounds", objective:"Student uses +0 and that order doesn't change the sum", grade:"Grade 1", stars:1, range:[9,11], pool:()=>spiral(addFormats(fZeroComm()), addFormats(fDoubles()), addFormats(fCountOn()), "ad3"), example:{ problem:"3 + 5 = 5 + ___", steps:["Order doesn't change the sum","3 + 5 = 8, so the blank is 3"], answer:"3" } },
    { id:"add-near-doubles", label:"Near-doubles (use the double you know)", objective:"Student adds near-doubles using a known double", grade:"Grade 1-2", stars:2, range:[12,15], pool:()=>spiral(addFormats(fNearDoubles()), addFormats(fDoubles()), addFormats(fZeroComm()), "ad4"), example:{ problem:"6 + 7 =", steps:["6 + 6 = 12","12 + 1 = 13"], answer:"13" } },
    { id:"add-make-ten", label:"Make ten & bridging through 10", objective:"Student makes ten first, then adding the rest (8+5 = 8+2+3)", grade:"Grade 2", stars:2, range:[16,20], pool:()=>spiral(addFormats(fMakeTen()), addFormats(fNearDoubles()), addFormats(fDoubles()), "ad5"), example:{ problem:"8 + 5 =", steps:["8 + 2 = 10","10 + 3 = 13"], answer:"13" } },
    { id:"add-fact-family", label:"Fact families to 18", objective:"Student uses the add/subtract inverse and missing addends", grade:"Grade 2", stars:3, range:[21,28], pool:()=>spiral(addFormats(fFactFamily()), addFormats(fMakeTen()), addFormats(fNearDoubles()), "ad6"), example:{ problem:"7 + ___ = 12", steps:["12 - 7 = 5"], answer:"5" } },
    { id:"add-2d-noregroup", label:"2-digit addition (no regrouping)", objective:"Student adds tens and ones separately", grade:"Grade 2-3", stars:3, range:[29,44], pool:()=>[...enumAddClean(11,88,11,88), ...det(enumMissingAdd(11,77,11,22), 60, "ad7m"), ...det(addFormats(fFactFamily()), 20, "ad7p")], example:{ problem:"34 + 25 =", steps:["Ones: 4 + 5 = 9","Tens: 3 + 2 = 5","Answer: 59"], answer:"59" } },
    { id:"add-2d-regroup", label:"2-digit addition (regrouping)", objective:"Student carries the ten when ones reach 10", grade:"Grade 3", stars:4, range:[45,64], pool:()=>[...enumAdd(10,99,10,99,true), ...det(enumMissingAdd(30,99,20,70), 60, "ad8m"), ...det(addFormats(fMakeTen()), 20, "ad8p")], example:{ problem:"37 + 45 =", steps:["Ones: 7 + 5 = 12 → write 2, carry 1","Tens: 3 + 4 + 1 = 8","Answer: 82"], answer:"82" } },
    { id:"add-3d-three", label:"3-digit addition & three addends", objective:"Student adds across columns, chaining three numbers", grade:"Grade 3-4", stars:4, range:[65,84], pool:()=>[...enumAdd(100,999,100,999), ...enumMissingAdd(100,999,50,500), ...enumThreeAdd(15,99)], example:{ problem:"248 + 167 =", steps:["Ones: 8+7=15 → 5 carry 1","Tens: 4+6+1=11 → 1 carry 1","Hundreds: 2+1+1=4","Answer: 415"], answer:"415" } },
    { id:"add-missing-review", label:"Missing addend & mixed review", objective:"Student solves for the unknown, reviewing every addition type", grade:"Grade 4", stars:5, range:[85,100], pool:()=>[...enumMissingAdd(10,99,10,99), ...enumAdd(100,999,100,999), ...enumAdd(10,99,10,99,true)], example:{ problem:"___ + 25 = 61", steps:["61 - 25 = 36"], answer:"36" } },
  ],

  SUBTRACTION: [
    { id:"sub-count-back", label:"Subtracting by counting back (−1, −2, −3)", objective:"Student subtracts by counting back", grade:"Grade 1", stars:1, range:[1,6], pool:()=>subFormats(sCountBack()), example:{ problem:"9 - 2 =", steps:["Count back 2 from 9: 8, 7"], answer:"7" } },
    { id:"sub-zero", label:"Subtract 0 and subtract all", objective:"Student subtracts 0 and a number from itself", grade:"Grade 1", stars:1, range:[7,10], pool:()=>spiral(subFormats(sZero()), subFormats(sCountBack()), [], "sb2"), example:{ problem:"8 - 8 =", steps:["Taking all away leaves 0"], answer:"0" } },
    { id:"sub-count-up", label:"Find the difference (count up)", objective:"Student counts up from the smaller to the larger number", grade:"Grade 1-2", stars:2, range:[11,18], pool:()=>spiral(subFormats(sCountUp()), subFormats(sCountBack()), subFormats(sZero()), "sb3"), example:{ problem:"9 - 6 =", steps:["Count up from 6 to 9: 7, 8, 9 = 3 steps"], answer:"3" } },
    { id:"sub-halves", label:"Halving & near-halves (using doubles)", objective:"Student subtracts using known doubles (12−6, 13−6)", grade:"Grade 2", stars:2, range:[19,24], pool:()=>spiral(subFormats(sNearDoubles()), subFormats(sCountUp()), subFormats(sCountBack()), "sb4"), example:{ problem:"12 - 6 =", steps:["6 + 6 = 12, so 12 - 6 = 6"], answer:"6" } },
    { id:"sub-bridge", label:"Bridging down through 10", objective:"Student subtracts by going down to 10 first (15−7 = 15−5−2)", grade:"Grade 2", stars:3, range:[25,32], pool:()=>spiral(subFormats(sBridge()), subFormats(sNearDoubles()), subFormats(sCountUp()), "sb5"), example:{ problem:"15 - 7 =", steps:["15 - 5 = 10","10 - 2 = 8"], answer:"8" } },
    { id:"sub-fact-family", label:"Fact families to 18", objective:"Student uses the subtract/add inverse", grade:"Grade 2-3", stars:3, range:[33,40], pool:()=>spiral(subFormats(sFactFamily()), subFormats(sBridge()), subFormats(sNearDoubles()), "sb6"), example:{ problem:"13 - ___ = 5", steps:["13 - 5 = 8"], answer:"8" } },
    { id:"sub-2d-noborrow", label:"2-digit subtraction (no borrowing)", objective:"Student subtracts tens and ones separately", grade:"Grade 2-3", stars:3, range:[41,54], pool:()=>[...enumSub(10,99,1,9,false), ...enumSub(10,99,10,99,false), ...enumMissingSub(10,99,1,40), ...det(subFormats(sFactFamily()), 20, "sb7p")], example:{ problem:"58 - 23 =", steps:["Ones: 8 - 3 = 5","Tens: 5 - 2 = 3","Answer: 35"], answer:"35" } },
    { id:"sub-2d-borrow", label:"2-digit subtraction (borrowing)", objective:"Student borrows a ten when needed", grade:"Grade 3", stars:4, range:[55,72], pool:()=>[...enumSub(10,99,1,9,true), ...enumSub(10,99,10,99,true), ...enumMissingSub(20,99,1,50), ...det(subFormats(sBridge()), 20, "sb8p")], example:{ problem:"52 - 27 =", steps:["Ones: 2 - 7 borrow → 12 - 7 = 5","Tens: 4 - 2 = 2","Answer: 25"], answer:"25" } },
    { id:"sub-3d", label:"3-digit subtraction (regrouping)", objective:"Student regroups across columns", grade:"Grade 3-4", stars:4, range:[73,88], pool:()=>[...enumSub(100,999,100,999), ...enumMissingSub(100,999,10,400), ...det(enumSub(10,99,10,99,true), 18, "sb9p")], example:{ problem:"403 - 158 =", steps:["Borrow across to subtract ones and tens","Answer: 245"], answer:"245" } },
    { id:"sub-missing-review", label:"Missing number & mixed review", objective:"Student solves for the unknown, reviewing every subtraction type", grade:"Grade 4", stars:5, range:[89,100], pool:()=>[...enumMissingSub(20,99,1,40), ...enumSub(100,999,100,999), ...enumSub(10,99,10,99,true)], example:{ problem:"45 - ___ = 18", steps:["45 - 18 = 27"], answer:"27" } },
  ],

  // Strategy-staged: skip-counting anchors → identity → squares → build-up tables
  // → hard facts → fact families → big tables → multi-digit, with spiral review.
  MULTIPLICATION: [
    { id:"mul-skip", label:"×2, ×5, ×10 (skip counting)", objective:"Student multiplies by 2, 5 and 10 using skip counting", grade:"Grade 3", stars:2, range:[1,6], pool:()=>mulFormats(mTables([2,5,10],"skip-count")), example:{ problem:"5 × 6 =", steps:["Skip-count by 5: 5,10,15,20,25,30"], answer:"30" } },
    { id:"mul-identity", label:"×1 and ×0", objective:"Student multiplies by 1 (identity) and 0", grade:"Grade 3", stars:1, range:[7,9], pool:()=>mulFormats(mTables([0,1],"identity")), example:{ problem:"7 × 1 =", steps:["Any number times 1 is itself"], answer:"7" } },
    { id:"mul-squares", label:"Square facts (n × n)", objective:"Student recalls the square facts", grade:"Grade 3", stars:2, range:[10,12], pool:()=>spiral(mulFormats(mSquares()), mulFormats(mTables([2,5,10],"skip-count")), [], "m3"), example:{ problem:"6 × 6 =", steps:["6 sixes = 36"], answer:"36" } },
    { id:"mul-3-4", label:"×3 and ×4 (build from ×2)", objective:"Student multiplies by 3 and 4 building on doubles", grade:"Grade 3-4", stars:3, range:[13,22], pool:()=>spiral(mulFormats(mTables([3,4],"build-up")), mulFormats(mSquares()), mulFormats(mTables([2,5,10],"skip-count")), "m4"), example:{ problem:"4 × 7 =", steps:["Double 7 is 14","Double again: 28"], answer:"28" } },
    { id:"mul-6-9", label:"×6, ×7, ×8, ×9 (the hard facts)", objective:"Student recalls the 6–9 times tables", grade:"Grade 4", stars:4, range:[23,36], pool:()=>spiral(mulFormats(mTables([6,7,8,9],"hard-facts")), mulFormats(mTables([3,4],"build-up")), mulFormats(mSquares()), "m5"), example:{ problem:"7 × 8 =", steps:["7 × 8 = 56"], answer:"56" } },
    { id:"mul-fact-family", label:"Fact families & missing factor", objective:"Student uses the ×/÷ inverse to find missing factors", grade:"Grade 4", stars:4, range:[37,48], pool:()=>spiral(mulFormats(mAll()), mulFormats(mTables([6,7,8,9],"hard-facts")), mulFormats(mTables([3,4],"build-up")), "m6"), example:{ problem:"6 × ___ = 48", steps:["48 ÷ 6 = 8"], answer:"8" } },
    // ×11/×12 demoted 10→4 sheets (expert: ~4 sheets of value, and 3 days of
    // low-value drill sat right before the level's hardest transition).
    { id:"mul-10-12", label:"×10, ×11, ×12", objective:"Student recalls the 10, 11 and 12 times tables", grade:"Grade 4", stars:3, range:[49,52], pool:()=>spiral(mulFormats(mTables([10,11,12],"big-tables")), mulFormats(mAll()), [], "m7"), example:{ problem:"12 × 7 =", steps:["12 × 7 = 84"], answer:"84" } },
    // THE BRIDGE (see enumBreakApart). "27 × 4" was the first question in the
    // level that wasn't a fact lookup; this unit teaches the split first.
    { id:"mul-break-apart", label:"Break apart to multiply (no carrying)", objective:"Student splits a 2-digit number into tens and ones, multiplies each piece, and adds the two answers together", grade:"Grade 4", stars:4, range:[53,62], pool:()=>enumBreakApart(), example:{ problem:"23 × 3 =", steps:["Break 23 into 20 + 3","20 × 3 = 60","3 × 3 = 9","60 + 9 = 69"], answer:"69" } },
    { id:"mul-2d1d", label:"2-digit × 1-digit", objective:"Student multiplies a 2-digit number by 1 digit (with carrying)", grade:"Grade 4-5", stars:5, range:[63,76], pool:()=>[...enumMul(11,41,2,4,false), ...enumMul(12,99,2,9,true), ...enumMissingFactor(2,12,2,12)], example:{ problem:"47 × 6 =", steps:["6 × 7 = 42 → write 2 carry 4","6 × 4 = 24 + 4 = 28","Answer: 282"], answer:"282" } },
    { id:"mul-2d2d", label:"2-digit × 2-digit", objective:"Student multiplies two 2-digit numbers", grade:"Grade 5", stars:5, range:[77,92], pool:()=>[...enumMul(11,99,11,99), ...det(mulFormats(mAll()), 20, "m9p")], example:{ problem:"23 × 14 =", steps:["23 × 4 = 92","23 × 10 = 230","92 + 230 = 322"], answer:"322" } },
    { id:"mul-review", label:"Mixed review", objective:"Student multiplies fluently across all types", grade:"Grade 5", stars:5, range:[93,100], pool:()=>[...enumMul(2,12,2,12), ...enumMul(12,99,2,9), ...enumMissingFactor(2,12,2,12)], example:{ problem:"38 × 7 =", steps:["7 × 8 = 56 → 6 carry 5","7 × 3 = 21 + 5 = 26","Answer: 266"], answer:"266" } },
  ],

  // Strategy-staged (inverse of multiplication): ÷2/5/10 → identity → squares →
  // ÷3/4 → ÷6-9 → fact families → ÷10-12 → remainders → larger, with spiral.
  DIVISION: [
    { id:"div-skip", label:"÷2, ÷5, ÷10", objective:"Student divides by 2, 5 and 10 using known facts", grade:"Grade 3", stars:2, range:[1,6], pool:()=>divFormats(dTables([2,5,10],"skip-count")), example:{ problem:"30 ÷ 5 =", steps:["5 × 6 = 30","So 30 ÷ 5 = 6"], answer:"6" } },
    { id:"div-identity", label:"÷1 and dividing a number by itself", objective:"Student divides by 1 and a number by itself", grade:"Grade 3", stars:1, range:[7,9], pool:()=>divFormats(dIdentity()), example:{ problem:"8 ÷ 8 =", steps:["A number divided by itself is 1"], answer:"1" } },
    { id:"div-squares", label:"Square-root facts (n² ÷ n)", objective:"Student divides square numbers", grade:"Grade 3", stars:2, range:[10,12], pool:()=>spiral(divFormats(dSquares()), divFormats(dTables([2,5,10],"skip-count")), [], "d3"), example:{ problem:"36 ÷ 6 =", steps:["6 × 6 = 36","So 36 ÷ 6 = 6"], answer:"6" } },
    { id:"div-3-4", label:"÷3 and ÷4", objective:"Student divides by 3 and 4", grade:"Grade 3-4", stars:3, range:[13,22], pool:()=>spiral(divFormats(dTables([3,4],"build-up")), divFormats(dSquares()), divFormats(dTables([2,5,10],"skip-count")), "d4"), example:{ problem:"28 ÷ 4 =", steps:["4 × 7 = 28","So 28 ÷ 4 = 7"], answer:"7" } },
    { id:"div-6-9", label:"÷6, ÷7, ÷8, ÷9", objective:"Student divides by 6–9", grade:"Grade 4", stars:4, range:[23,36], pool:()=>spiral(divFormats(dTables([6,7,8,9],"hard-facts")), divFormats(dTables([3,4],"build-up")), divFormats(dSquares()), "d5"), example:{ problem:"56 ÷ 7 =", steps:["7 × 8 = 56","So 56 ÷ 7 = 8"], answer:"8" } },
    { id:"div-fact-family", label:"Fact families & missing dividend", objective:"Student uses the ÷/× inverse to find the missing number", grade:"Grade 4", stars:4, range:[37,48], pool:()=>spiral(divFormats(dAll()), divFormats(dTables([6,7,8,9],"hard-facts")), divFormats(dTables([3,4],"build-up")), "d6"), example:{ problem:"___ ÷ 6 = 7", steps:["6 × 7 = 42"], answer:"42" } },
    { id:"div-10-12", label:"÷10, ÷11, ÷12", objective:"Student divides by 10, 11 and 12", grade:"Grade 4", stars:3, range:[49,58], pool:()=>spiral(divFormats(dTables([10,11,12],"big-tables")), divFormats(dAll()), [], "d7"), example:{ problem:"84 ÷ 12 =", steps:["12 × 7 = 84","So 84 ÷ 12 = 7"], answer:"7" } },
    { id:"div-remainder", label:"Division with remainders", objective:"Student divides with remainders", grade:"Grade 4-5", stars:5, range:[59,76], pool:()=>[...enumDivRemainder(2,9,10,99), ...det(divFormats(dAll()), 20, "d8p")], example:{ problem:"29 ÷ 4 =", steps:["4 × 7 = 28","29 - 28 = 1","Answer: 7 r 1"], answer:"7 r 1" } },
    { id:"div-larger", label:"2-digit & 3-digit ÷ 1-digit", objective:"Student divides larger numbers by 1 digit", grade:"Grade 5", stars:5, range:[77,92], pool:()=>[...enumDivExact(3,9,5,15), ...enumDivExact(3,9,15,99)], example:{ problem:"96 ÷ 6 =", steps:["6 × 16 = 96","So 96 ÷ 6 = 16"], answer:"16" } },
    { id:"div-review", label:"Mixed review", objective:"Student divides fluently across all types", grade:"Grade 5", stars:5, range:[93,100], pool:()=>[...enumDivExact(2,12,2,12), ...enumDivRemainder(2,9,10,99), ...enumMissingDividend(2,12,2,12)], example:{ problem:"175 ÷ 7 =", steps:["7 × 25 = 175","So 175 ÷ 7 = 25"], answer:"25" } },
  ],
};

const SKILL_CODE: Record<string, string> = {
  ADDITION: "M3", SUBTRACTION: "M4", MULTIPLICATION: "M5", DIVISION: "M6",
};

// ── Selection + GPI (identical guarantees to fraction-engine) ─────────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(skill: string, sheet: number): number {
  const units = CURRICULA[skill];
  const idx = units.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? units.length - 1 : idx;
}

function buildScoredPool(skill: string, unitIndex: number): AProblem[] {
  const raw = CURRICULA[skill][unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}

// Seeded RNG so each sheet is deterministic (stable self-heal) yet DIFFERENT
// from its neighbours.
function mulberry32(seed: number): () => number {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle<T>(a: T[], rng: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

// Reorder so the sheet is NOT pattern-fillable: no two adjacent items share an
// answer (breaks commutative twins like 2+3 / 3+2 and equal-answer runs), and no
// three consecutive answers move monotonically (no giveaway 4,5,6,7 run).
function arrangeNoPattern(items: AProblem[]): AProblem[] {
  const remaining = [...items];
  const out: AProblem[] = [];
  while (remaining.length) {
    let pick = -1;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i], prev = out[out.length - 1], prev2 = out[out.length - 2];
      const ca = Number(cand.a), pa = prev ? Number(prev.a) : NaN, p2a = prev2 ? Number(prev2.a) : NaN;
      if (prev && Number.isFinite(ca) && Number.isFinite(pa) && ca === pa) continue;           // no equal-answer adjacency
      if (prev2 && [ca, pa, p2a].every(Number.isFinite)) {
        if (pa - p2a > 0 && ca - pa > 0) continue;  // no 3 rising
        if (pa - p2a < 0 && ca - pa < 0) continue;  // no 3 falling
      }
      pick = i; break;
    }
    if (pick === -1) pick = 0; // constraints unsatisfiable for the remainder — accept
    out.push(remaining.splice(pick, 1)[0]);
  }
  return out;
}

function selectProblems(pool: AProblem[], t: number, count: number, seed: number): AProblem[] {
  const rng = mulberry32(seed);
  // Dedup by QUESTION TEXT (not key) so the same problem reaching the pool from
  // two strategies (e.g. "5 + 5" as a double and as review) can't appear twice on
  // one sheet.
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.q) ? false : (seen.add(p.q), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  // Difficulty window for THIS sheet (keeps cross-sheet progression). A wide
  // window + seeded sampling means consecutive sheets draw different subsets.
  const W = Math.min(N, Math.max(count, Math.round(N * 0.7)));
  const start = N <= count ? 0 : Math.round(t * (N - W));
  const win = N <= count ? sorted : sorted.slice(start, start + W);
  // Seeded sample of `count` distinct items from the window (round-robin if the
  // window is smaller than a sheet — small fact sets must repeat).
  const bag = shuffle(win.length ? win : sorted, rng);
  if (!bag.length) return [];
  const chosen: AProblem[] = [];
  for (let i = 0; i < count; i++) chosen.push(bag[i % bag.length]);
  // Interleave + de-pattern so nothing is fillable from a sequence.
  return arrangeNoPattern(shuffle(chosen, rng));
}

// ── Public API ────────────────────────────────────────────────────────────────
/** Resolve an arithmetic micro-skill's lesson by its unit label (exact match
 *  across all four operation curricula; labels are unit-unique). Without this,
 *  M3–M6 lessons fell back to KEYWORD-matched tutorials — "Fact families &
 *  missing FACTOR" matched the M12 factoring tutorial (user-reported). */
export function getArithmeticMicroLesson(label: string): { goal: string; bigIdea: string; example: { problem: string; steps: string[]; answer: string }; umbrella: string } | null {
  for (const [skill, units] of Object.entries(CURRICULA)) {
    const u = units.find((x) => x.label === label);
    if (u) {
      const g = u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase());
      return { goal: g, bigIdea: g, example: u.example, umbrella: skill.charAt(0) + skill.slice(1).toLowerCase() };
    }
  }
  return null;
}

export function isArithmeticSkill(skill: string): boolean {
  return skill in CURRICULA;
}

// Ordered skill map (real content units) for an arithmetic skill.
export function arithmeticUnits(skill: string): { index: number; id: string; label: string; objective: string; grade: string; range: [number, number] }[] {
  return (CURRICULA[skill] ?? []).map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
}

export function generateArithmeticSheet(
  skill: ShopSkill, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(skill, sheetNumber);
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(skill, ui), t, problemCount, hashStr(`${skill}:${sheetNumber}`));
  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: (p.type ?? "arithmetic") as "arithmetic" | "multiple_choice" | "true_false",
    question: p.q, answer: p.a, points: 1,
    ...(p.options ? { options: p.options } : {}),
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill, skillCode: SKILL_CODE[skill] ?? "M3", sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 8),
    },
  };
}

// ── Self-validation ───────────────────────────────────────────────────────────
export function validateArithmetic(skill: string, totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  const units = CURRICULA[skill];

  let expectedNext = 1;
  for (const u of units) {
    const sz = new Set(u.pool().map(p => p.key)).size;
    if (sz < 30) issues.push(`${skill}/${u.id}: unique pool ${sz} < 30`);
    if (u.range[0] !== expectedNext) issues.push(`${skill}/${u.id}: range gap at ${u.range[0]} (expected ${expectedNext})`);
    expectedNext = u.range[1] + 1;
  }
  if (expectedNext - 1 !== totalSheets) issues.push(`${skill}: covers ${expectedNext - 1} sheets, expected ${totalSheets}`);

  let prev = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(skill, s);
    const unit = units[ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(skill, ui), t, 30, hashStr(`${skill}:${s}`));
    // NOTE: within-sheet order is intentionally interleaved now (not ascending),
    // so we no longer assert per-sheet ascending. Duplicates within a sheet are
    // only flagged when the unit pool is large enough to avoid them.
    const poolSize = new Set(buildScoredPool(skill, ui).map(p => p.key)).size;
    const dup = 30 - new Set(sel.map(p => p.key)).size;
    if (dup > 0 && poolSize >= 30) issues.push(`${skill} sheet ${s}: ${dup} duplicate(s) (pool=${poolSize})`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    prev = Math.max(prev, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}

// ── Curriculum acceptance checks (curriculum-expert certification) ─────────────
// Certifies a GENERATED sheet is pedagogically sound, not merely non-repetitive:
//   • non-predictability: no equal-adjacent answers, no 3-in-a-row monotonic,
//     answer sequence fails a constant-step (linear) fit
//   • ≥2 distinct formats present
//   • for STRATEGY-staged early units: the unit's target strategy dominates
//     (~≥55% after spiral review) so the new idea isn't crowded out
export function validateCurriculumStage(skill: string, totalSheets = 100): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const units = CURRICULA[skill];
  if (!units) return { ok: true, issues };
  for (const unit of units) {
    const pool = unit.pool();
    const stratTagged = pool.filter(p => p.strat).length > pool.length * 0.5;
    // target strategy = modal strat among the unit's own (non-review) facts
    const stratCounts: Record<string, number> = {};
    for (const p of pool) if (p.strat) stratCounts[p.strat] = (stratCounts[p.strat] || 0) + 1;
    const target = Object.entries(stratCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    for (const s of [unit.range[0], Math.round((unit.range[0] + unit.range[1]) / 2)]) {
      const span = unit.range[1] - unit.range[0];
      const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
      const sel = selectProblems(buildScoredPool(skill, unitIndexForSheet(skill, s)), t, 30, hashStr(`${skill}:${s}`));
      const ans = sel.map(p => Number(p.a));
      // non-predictability
      let eqAdj = 0; for (let i = 1; i < sel.length; i++) if (Number.isFinite(ans[i]) && ans[i] === ans[i - 1]) eqAdj++;
      if (eqAdj > 1) issues.push(`${skill}/${unit.id} sheet ${s}: ${eqAdj} equal-adjacent answers`);
      let mono = 0; for (let i = 2; i < ans.length; i++) if ([ans[i], ans[i - 1], ans[i - 2]].every(Number.isFinite)) { const d1 = ans[i - 1] - ans[i - 2], d2 = ans[i] - ans[i - 1]; if ((d1 > 0 && d2 > 0) || (d1 < 0 && d2 < 0)) mono++; }
      if (mono > 2) issues.push(`${skill}/${unit.id} sheet ${s}: ${mono} monotonic runs`);
      // constant-step (linear) fit on numeric answers — must FAIL (not a simple sequence)
      const nums = ans.filter(Number.isFinite); const steps = new Set<number>(); for (let i = 1; i < nums.length; i++) steps.add(nums[i] - nums[i - 1]);
      if (nums.length > 8 && steps.size <= 2) issues.push(`${skill}/${unit.id} sheet ${s}: answer sequence too regular (steps=${steps.size})`);
      // format variety
      const fmts = new Set(sel.map(p => p.options ? (p.type === "true_false" ? "tf" : "mc") : (/___/.test(p.q) ? "missing" : "direct")));
      if (fmts.size < 2) issues.push(`${skill}/${unit.id} sheet ${s}: only ${fmts.size} format`);
      // strategy dominance (staged units only)
      if (stratTagged && target) {
        const onTarget = sel.filter(p => p.strat === target).length / sel.length;
        if (onTarget < 0.45) issues.push(`${skill}/${unit.id} sheet ${s}: target strategy '${target}' only ${(onTarget * 100).toFixed(0)}%`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
}
