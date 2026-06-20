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

interface AProblem { q: string; a: string; diff: number; key: string; }

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
function enumAddSum(maxSum: number): AProblem[] {
  const out: AProblem[] = [];
  for (let a = 1; a < maxSum; a++)
    for (let b = 1; a + b <= maxSum; b++)
      out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (a + b) + Math.max(a, b) * 0.5, key: `${a}+${b}` });
  return out;
}
function enumAdd(aLo: number, aHi: number, bLo: number, bHi: number, carry?: boolean): AProblem[] {
  const out: AProblem[] = [];
  eachPair(aLo, aHi, bLo, bHi, (a, b) => {
    if (carry !== undefined && addCarry(a, b) !== (carry ? 1 : 0)) return;
    const m = Math.max(a, b);
    out.push({ q: `${a} + ${b}`, a: String(a + b), diff: (digits(m) - 1) * 30 + magnitude(m) + addCarry(a, b) * 20, key: `${a}+${b}` });
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
function enumThreeAdd(lo: number, hi: number): AProblem[] {
  const out: AProblem[] = [];
  for (let a = lo; a <= hi; a++)
    for (let b = lo; b <= hi; b++)
      for (let c = lo; c <= hi; c++) {
        if ((a + b + c) % 1 !== 0) continue;
        out.push({ q: `${a} + ${b} + ${c}`, a: String(a + b + c), diff: (a + b + c) + 15, key: `${a}+${b}+${c}` });
      }
  return out;
}

// ── SUBTRACTION enumerators ───────────────────────────────────────────────────
function enumSubWithin(maxA: number): AProblem[] {
  const out: AProblem[] = [];
  for (let a = 1; a <= maxA; a++)
    for (let b = 0; b <= a; b++)
      out.push({ q: `${a} - ${b}`, a: String(a - b), diff: a + b * 0.5, key: `${a}-${b}` });
  return out;
}
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

// ── MULTIPLICATION enumerators ────────────────────────────────────────────────
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
  ADDITION: [
    { id:"add-10", label:"Addition — sums to 10", objective:"Student adds single digits with sums up to 10", grade:"Grade 1", stars:1, range:[1,6], pool:()=>enumAddSum(10), example:{ problem:"3 + 4 =", steps:["Start at 3","Count up 4: 4, 5, 6, 7"], answer:"7" } },
    { id:"add-18", label:"Addition — sums to 18", objective:"Student adds single digits with sums up to 18", grade:"Grade 1", stars:1, range:[7,13], pool:()=>enumAdd(1,9,1,9), example:{ problem:"8 + 6 =", steps:["8 + 2 = 10","10 + 4 = 14"], answer:"14" } },
    { id:"add-2d1d-nc", label:"Addition — 2-digit + 1-digit (no carry)", objective:"Student adds a 1-digit number to a 2-digit number without carrying", grade:"Grade 2", stars:2, range:[14,22], pool:()=>enumAdd(10,99,1,9,false), example:{ problem:"23 + 5 =", steps:["Ones: 3 + 5 = 8","Tens stay: 2","Answer: 28"], answer:"28" } },
    { id:"add-2d1d-c", label:"Addition — 2-digit + 1-digit (carry)", objective:"Student adds with carrying into the tens", grade:"Grade 2", stars:2, range:[23,31], pool:()=>enumAdd(10,99,1,9,true), example:{ problem:"27 + 5 =", steps:["Ones: 7 + 5 = 12 → write 2, carry 1","Tens: 2 + 1 = 3","Answer: 32"], answer:"32" } },
    { id:"add-2d2d-nc", label:"Addition — 2-digit + 2-digit (no carry)", objective:"Student adds two 2-digit numbers without carrying", grade:"Grade 2-3", stars:3, range:[32,42], pool:()=>enumAdd(10,99,10,99,false), example:{ problem:"34 + 25 =", steps:["Ones: 4 + 5 = 9","Tens: 3 + 2 = 5","Answer: 59"], answer:"59" } },
    { id:"add-2d2d-c", label:"Addition — 2-digit + 2-digit (carry)", objective:"Student adds two 2-digit numbers with carrying", grade:"Grade 3", stars:3, range:[43,55], pool:()=>enumAdd(10,99,10,99,true), example:{ problem:"37 + 45 =", steps:["Ones: 7 + 5 = 12 → write 2, carry 1","Tens: 3 + 4 + 1 = 8","Answer: 82"], answer:"82" } },
    { id:"add-3d", label:"Addition — 3-digit", objective:"Student adds 3-digit numbers with regrouping", grade:"Grade 3-4", stars:4, range:[56,68], pool:()=>enumAdd(100,999,100,999), example:{ problem:"248 + 167 =", steps:["Ones: 8+7=15 → 5 carry 1","Tens: 4+6+1=11 → 1 carry 1","Hundreds: 2+1+1=4","Answer: 415"], answer:"415" } },
    { id:"add-missing", label:"Addition — missing number", objective:"Student finds the missing addend", grade:"Grade 3", stars:4, range:[69,80], pool:()=>enumMissingAdd(10,99,10,99), example:{ problem:"___ + 25 = 61", steps:["61 - 25 = 36"], answer:"36" } },
    { id:"add-three", label:"Addition — three numbers", objective:"Student adds three numbers", grade:"Grade 3", stars:4, range:[81,92], pool:()=>enumThreeAdd(5,40), example:{ problem:"12 + 9 + 14 =", steps:["12 + 9 = 21","21 + 14 = 35"], answer:"35" } },
    { id:"add-review", label:"Addition — mixed review", objective:"Student adds fluently across all addition types", grade:"Grade 4", stars:5, range:[93,100], pool:()=>[...enumAdd(10,99,10,99,true),...enumAdd(100,999,100,999),...enumMissingAdd(10,99,10,99)], example:{ problem:"156 + 78 =", steps:["Ones: 6+8=14","Tens: 5+7+1=13","Hundreds: 1+1=2","Answer: 234"], answer:"234" } },
  ],

  SUBTRACTION: [
    { id:"sub-10", label:"Subtraction — within 10", objective:"Student subtracts within 10", grade:"Grade 1", stars:1, range:[1,6], pool:()=>enumSubWithin(10), example:{ problem:"9 - 4 =", steps:["Count back 4 from 9: 8, 7, 6, 5"], answer:"5" } },
    { id:"sub-18", label:"Subtraction — within 18", objective:"Student subtracts within 18", grade:"Grade 1-2", stars:1, range:[7,13], pool:()=>enumSubWithin(18), example:{ problem:"15 - 7 =", steps:["15 - 5 = 10","10 - 2 = 8"], answer:"8" } },
    { id:"sub-2d1d-nb", label:"Subtraction — 2-digit - 1-digit (no borrow)", objective:"Student subtracts a 1-digit number without borrowing", grade:"Grade 2", stars:2, range:[14,22], pool:()=>enumSub(10,99,1,9,false), example:{ problem:"38 - 5 =", steps:["Ones: 8 - 5 = 3","Tens stay: 3","Answer: 33"], answer:"33" } },
    { id:"sub-2d1d-b", label:"Subtraction — 2-digit - 1-digit (borrow)", objective:"Student subtracts with borrowing", grade:"Grade 2", stars:3, range:[23,31], pool:()=>enumSub(10,99,1,9,true), example:{ problem:"32 - 7 =", steps:["Ones: 2 - 7 needs borrow → 12 - 7 = 5","Tens: 3 - 1 = 2","Answer: 25"], answer:"25" } },
    { id:"sub-2d2d-nb", label:"Subtraction — 2-digit - 2-digit (no borrow)", objective:"Student subtracts two 2-digit numbers without borrowing", grade:"Grade 2-3", stars:3, range:[32,42], pool:()=>enumSub(10,99,10,99,false), example:{ problem:"58 - 23 =", steps:["Ones: 8 - 3 = 5","Tens: 5 - 2 = 3","Answer: 35"], answer:"35" } },
    { id:"sub-2d2d-b", label:"Subtraction — 2-digit - 2-digit (borrow)", objective:"Student subtracts two 2-digit numbers with borrowing", grade:"Grade 3", stars:4, range:[43,55], pool:()=>enumSub(10,99,10,99,true), example:{ problem:"52 - 27 =", steps:["Ones: 2 - 7 borrow → 12 - 7 = 5","Tens: 4 - 2 = 2","Answer: 25"], answer:"25" } },
    { id:"sub-3d", label:"Subtraction — 3-digit", objective:"Student subtracts 3-digit numbers with regrouping", grade:"Grade 3-4", stars:4, range:[56,68], pool:()=>enumSub(100,999,100,999), example:{ problem:"403 - 158 =", steps:["Borrow across to subtract ones and tens","Answer: 245"], answer:"245" } },
    { id:"sub-missing", label:"Subtraction — missing number", objective:"Student finds the missing number in a subtraction", grade:"Grade 3", stars:4, range:[69,80], pool:()=>enumMissingSub(20,99,1,40), example:{ problem:"45 - ___ = 18", steps:["45 - 18 = 27"], answer:"27" } },
    { id:"sub-3d2", label:"Subtraction — 3-digit (challenge)", objective:"Student subtracts larger 3-digit numbers", grade:"Grade 4", stars:5, range:[81,92], pool:()=>enumSub(200,999,100,800,true), example:{ problem:"612 - 389 =", steps:["Regroup ones and tens","Answer: 223"], answer:"223" } },
    { id:"sub-review", label:"Subtraction — mixed review", objective:"Student subtracts fluently across all types", grade:"Grade 4", stars:5, range:[93,100], pool:()=>[...enumSub(10,99,10,99,true),...enumSub(100,999,100,999),...enumMissingSub(20,99,1,40)], example:{ problem:"304 - 176 =", steps:["Regroup as needed","Answer: 128"], answer:"128" } },
  ],

  MULTIPLICATION: [
    { id:"mul-2-5", label:"Multiplication — ×2 to ×5", objective:"Student recalls the 2, 3, 4 and 5 times tables", grade:"Grade 3", stars:2, range:[1,12], pool:()=>enumMul(2,5,1,12), example:{ problem:"4 × 6 =", steps:["4 sixes: 6, 12, 18, 24"], answer:"24" } },
    { id:"mul-6-9", label:"Multiplication — ×6 to ×9", objective:"Student recalls the 6, 7, 8 and 9 times tables", grade:"Grade 3-4", stars:3, range:[13,24], pool:()=>enumMul(6,9,1,12), example:{ problem:"7 × 8 =", steps:["7 × 8 = 56"], answer:"56" } },
    { id:"mul-10-12", label:"Multiplication — ×10, ×11, ×12", objective:"Student recalls the 10, 11 and 12 times tables", grade:"Grade 4", stars:3, range:[25,34], pool:()=>enumMul(10,12,1,12), example:{ problem:"12 × 7 =", steps:["12 × 7 = 84"], answer:"84" } },
    { id:"mul-all", label:"Multiplication — all tables mixed", objective:"Student recalls all times tables fluently", grade:"Grade 4", stars:4, range:[35,46], pool:()=>enumMul(2,12,2,12), example:{ problem:"9 × 6 =", steps:["9 × 6 = 54"], answer:"54" } },
    { id:"mul-2d1d-nc", label:"Multiplication — 2-digit × 1-digit (no carry)", objective:"Student multiplies a 2-digit number by 1 digit without carrying", grade:"Grade 4", stars:4, range:[47,58], pool:()=>enumMul(11,41,2,4,false), example:{ problem:"23 × 3 =", steps:["3 × 3 = 9","3 × 20 = 60","Answer: 69"], answer:"69" } },
    { id:"mul-2d1d-c", label:"Multiplication — 2-digit × 1-digit (carry)", objective:"Student multiplies 2-digit × 1-digit with carrying", grade:"Grade 4-5", stars:5, range:[59,70], pool:()=>enumMul(12,99,2,9,true), example:{ problem:"47 × 6 =", steps:["6 × 7 = 42 → write 2 carry 4","6 × 4 = 24 + 4 = 28","Answer: 282"], answer:"282" } },
    { id:"mul-missing", label:"Multiplication — missing factor", objective:"Student finds the missing factor", grade:"Grade 4", stars:4, range:[71,80], pool:()=>enumMissingFactor(2,12,2,12), example:{ problem:"6 × ___ = 48", steps:["48 ÷ 6 = 8"], answer:"8" } },
    { id:"mul-2d2d", label:"Multiplication — 2-digit × 2-digit", objective:"Student multiplies two 2-digit numbers", grade:"Grade 5", stars:5, range:[81,94], pool:()=>enumMul(11,99,11,99), example:{ problem:"23 × 14 =", steps:["23 × 4 = 92","23 × 10 = 230","92 + 230 = 322"], answer:"322" } },
    { id:"mul-review", label:"Multiplication — mixed review", objective:"Student multiplies fluently across all types", grade:"Grade 5", stars:5, range:[95,100], pool:()=>[...enumMul(2,12,2,12),...enumMul(12,99,2,9)], example:{ problem:"38 × 7 =", steps:["7 × 8 = 56 → 6 carry 5","7 × 3 = 21 + 5 = 26","Answer: 266"], answer:"266" } },
  ],

  DIVISION: [
    { id:"div-2-5", label:"Division — ÷2 to ÷5", objective:"Student divides by 2, 3, 4 and 5 (exact)", grade:"Grade 3", stars:2, range:[1,12], pool:()=>enumDivExact(2,5,1,12), example:{ problem:"24 ÷ 4 =", steps:["4 × 6 = 24","So 24 ÷ 4 = 6"], answer:"6" } },
    { id:"div-6-9", label:"Division — ÷6 to ÷9", objective:"Student divides by 6, 7, 8 and 9 (exact)", grade:"Grade 3-4", stars:3, range:[13,24], pool:()=>enumDivExact(6,9,1,12), example:{ problem:"56 ÷ 7 =", steps:["7 × 8 = 56","So 56 ÷ 7 = 8"], answer:"8" } },
    { id:"div-10-12", label:"Division — ÷10, ÷11, ÷12", objective:"Student divides by 10, 11 and 12 (exact)", grade:"Grade 4", stars:3, range:[25,34], pool:()=>enumDivExact(10,12,1,12), example:{ problem:"84 ÷ 12 =", steps:["12 × 7 = 84","So 84 ÷ 12 = 7"], answer:"7" } },
    { id:"div-all", label:"Division — all facts mixed", objective:"Student divides fluently using all facts", grade:"Grade 4", stars:4, range:[35,46], pool:()=>enumDivExact(2,12,2,12), example:{ problem:"63 ÷ 9 =", steps:["9 × 7 = 63","So 63 ÷ 9 = 7"], answer:"7" } },
    { id:"div-2d1d", label:"Division — 2-digit ÷ 1-digit (exact)", objective:"Student divides a 2-digit number by 1 digit", grade:"Grade 4", stars:4, range:[47,60], pool:()=>enumDivExact(3,9,5,15), example:{ problem:"96 ÷ 6 =", steps:["6 × 16 = 96","So 96 ÷ 6 = 16"], answer:"16" } },
    { id:"div-remainder", label:"Division — with remainders", objective:"Student divides with remainders", grade:"Grade 4-5", stars:5, range:[61,76], pool:()=>enumDivRemainder(2,9,10,99), example:{ problem:"29 ÷ 4 =", steps:["4 × 7 = 28","29 - 28 = 1","Answer: 7 r 1"], answer:"7 r 1" } },
    { id:"div-missing", label:"Division — missing dividend", objective:"Student finds the missing dividend", grade:"Grade 4", stars:4, range:[77,86], pool:()=>enumMissingDividend(2,12,2,12), example:{ problem:"___ ÷ 6 = 7", steps:["6 × 7 = 42"], answer:"42" } },
    { id:"div-3d1d", label:"Division — 3-digit ÷ 1-digit", objective:"Student divides a 3-digit number by 1 digit", grade:"Grade 5", stars:5, range:[87,100], pool:()=>enumDivExact(3,9,15,99), example:{ problem:"175 ÷ 7 =", steps:["7 × 25 = 175","So 175 ÷ 7 = 25"], answer:"25" } },
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

function selectProblems(pool: AProblem[], t: number, count: number): AProblem[] {
  // de-duplicate the pool by key first (striding can't produce dupes, but
  // mixed-review pools concatenate spaces that could overlap)
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.key) ? false : (seen.add(p.key), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  if (N <= count) {
    const out: AProblem[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out.sort((a, b) => a.diff - b.diff);
  }
  const W = Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  const chosen: AProblem[] = [];
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
export function isArithmeticSkill(skill: string): boolean {
  return skill in CURRICULA;
}

export function generateArithmeticSheet(
  skill: ShopSkill, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(skill, sheetNumber);
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(skill, ui), t, problemCount);
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
    const sel = selectProblems(buildScoredPool(skill, ui), t, 30);
    const dup = 30 - new Set(sel.map(p => p.key)).size;
    if (dup > 0) issues.push(`${skill} sheet ${s}: ${dup} duplicate(s)`);
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`${skill} sheet ${s}: not ascending`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prev - 0.001) issues.push(`${skill} sheet ${s}: GPI dropped (${mean.toFixed(1)} < ${prev.toFixed(1)})`);
    prev = Math.max(prev, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}
