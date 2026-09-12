// src/lib/shop/advanced-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO ADVANCED CURRICULUM ENGINE  (M8–M12)
//   Decimals · Ratios · Pre-Algebra · Linear Equations · Polynomials
//
// Same progression-first design as fraction-engine / arithmetic-engine:
//   • Each concept ENUMERATES its valid problem space.
//   • Each problem is scored by ONE deterministic difficulty function.
//   • Each sheet selects a UNIQUE, strictly-ASCENDING slice via a window that
//     slides upward sheet-to-sheet.
//   ⇒ No duplicates, rising within-sheet difficulty, monotonic GPI — by
//     construction. All questions are direct mathematical tasks (no word problems).
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample, ShopSkill } from "./progressive-generator";
import { addCarries, subBorrows } from "@/lib/math/regroup";

const BS = "\u005C";                         // single backslash → "rac…"
const F = (n: number, d: number) => `${BS}frac{${n}}{${d}}`;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(Math.abs(b), Math.abs(a % b)));
// Format a coefficient·variable term, suppressing a unit coefficient: 1·x → "x",
// -1·x → "-x", 3·x → "3x". Keeps algebra notation conventional (never "1x²").
const term = (c: number, v: string): string => (c === 1 ? v : c === -1 ? `-${v}` : `${c}${v}`);

interface XP {
  q: string; a: string; diff: number; key: string;
  // Set by reviewPool(): which of a mixed-review unit's source lessons this
  // item comes from. selectProblems draws round-robin across groups so every
  // review sheet carries every type the level taught.
  group?: number;
  // Optional interactive (graphing) item — e.g. "plot the point". Carries the
  // render spec to the client; the target stays in the answer key. Graded by the
  // standard value match on the canonical "x,y" string.
  type?: "arithmetic" | "short_answer" | "multiple_choice";
  options?: string[];
  interactive?: { kind: "vertex-drag" | "plot-point" | "plot-line" | "equation-builder" | "angle-drag" | "area-model" | "triangle-drag"; a?: number; curve?: { a: number; h: number; k: number }; line?: { m: number; b: number }; binomial?: { a: number; b: number }; xRange: [number, number]; yRange: [number, number]; snap: number };
}

// A mixed-review pool. Concatenating the source pools left the review to the
// luck of the difficulty window: each generator scores on its own scale, so the
// window on a review sheet was mostly whichever lesson scored lowest (M8's
// review served 17 additions and no division; M11's was a two-step drill with
// one bracket). Every source pool is rescaled to one common 0–100 band and
// tagged with its group, and selectProblems draws round-robin across groups —
// so a 30-item sheet over 5 lessons holds 6 of each, and over 9 holds at least 3.
function reviewPool(gens: (() => XP[])[]): XP[] {
  const out: XP[] = [];
  gens.forEach((gen, group) => {
    const items = gen();
    let lo = Infinity, hi = -Infinity;
    for (const p of items) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
    const span = hi - lo || 1;
    for (const p of items) out.push({ ...p, diff: ((p.diff - lo) / span) * 100, group });
  });
  return out;
}

// rounding helpers for decimals
const r1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
const r2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
// trim trailing zeros for clean answers (1.20 → 1.2, 3.00 → 3)
const trim = (s: string) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

// ── DECIMALS (M8) ─────────────────────────────────────────────────────────────
function enumDecAdd(places: 1 | 2): XP[] {
  const out: XP[] = []; const s = places === 1 ? 10 : 100; const cap = places === 1 ? 25 : 60;
  // One item per UNORDERED pair: "0.3 + 2.4" and "2.4 + 0.3" were both landing on
  // the same sheet. The shown order alternates so the smaller addend is not
  // always first.
  for (let ai = 1; ai <= cap; ai++) for (let bi = ai; bi <= cap; bi++) {
    const a = ai / s, b = bi / s; const fmt = places === 1 ? r1 : r2;
    const flip = (ai + bi) % 2 === 1;
    const q = flip ? `${fmt(b)} + ${fmt(a)}` : `${fmt(a)} + ${fmt(b)}`;
    out.push({ q, a: trim(fmt(a + b)), diff: (addCarries(ai, bi) ? 140 : 0) + ai + bi, key: `da${places}:${ai}+${bi}` });
  }
  return out;
}
function enumDecSub(places: 1 | 2): XP[] {
  const out: XP[] = []; const s = places === 1 ? 10 : 100; const cap = places === 1 ? 25 : 60;
  // No "a − a" items: four "1.3 − 1.3 → 0" on one sheet read as padding.
  for (let ai = 2; ai <= cap; ai++) for (let bi = 1; bi < ai; bi++) {
    const a = ai / s, b = bi / s; const fmt = places === 1 ? r1 : r2;
    out.push({ q: `${fmt(a)} - ${fmt(b)}`, a: trim(fmt(a - b)), diff: (subBorrows(ai, bi) ? 140 : 0) + ai + bi * 0.5, key: `ds${places}:${ai}-${bi}` });
  }
  return out;
}
function enumDecMulWhole(): XP[] {
  const out: XP[] = [];
  for (let ai = 1; ai <= 95; ai++) for (let b = 2; b <= 9; b++) {
    const a = ai / 10;
    // "1.0 × 4" was the opening item: a whole number dressed as a decimal, whose
    // answer (4, not 4.0) is the one shape the "put one place back" rule does
    // not produce. Those sit behind the genuine tenths.
    const whole = ai % 10 === 0 ? 40 : 0;
    out.push({ q: `${r1(a)} × ${b}`, a: trim(r2(a * b)), diff: whole + ai * 0.4 + b * 3, key: `dmw:${ai}x${b}` });
  }
  return out;
}
function enumDecMulDec(): XP[] {
  const out: XP[] = [];
  for (let ai = 1; ai <= 19; ai++) for (let bi = 1; bi <= 19; bi++) {
    const a = ai / 10, b = bi / 10;
    out.push({ q: `${r1(a)} × ${r1(b)}`, a: trim(r2(a * b)), diff: ai + bi + 30, key: `dmd:${ai}x${bi}` });
  }
  return out;
}
function enumDecDivWhole(): XP[] {
  const out: XP[] = [];
  for (let q = 1; q <= 30; q++) for (let b = 2; b <= 9; b++) {
    const a = (q * b) / 10;                 // exact one-place quotient
    out.push({ q: `${r1(a)} ÷ ${b}`, a: trim(r1(q / 10)), diff: q + b * 2 + 10, key: `ddw:${q}_${b}` });
  }
  return out;
}
function enumPercentOf(): XP[] {
  // No "100% of N" (copy the number — a third of the last sheet was that).
  // Later sheets grow into 35%/45%/65%/85%/95% (build from 10% and 5%) and
  // numbers above 100, so the unit gets harder, not easier, as it goes.
  const out: XP[] = []; const pcts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95];
  for (const p of pcts) for (let n = 2; n <= 200; n += 1) {
    const v = (p / 100) * n; if (!Number.isInteger(v)) continue;
    const odd = p % 10 === 5 && p !== 5 && p !== 25 && p !== 75 ? 12 : 0;   // 35%, 45% … need 10% + 5%
    out.push({ q: `${p}% of ${n}`, a: String(v), diff: p * 0.15 + n * 0.4 + 20 + odd, key: `pct:${p}of${n}` });
  }
  return out;
}
function enumConvert(): XP[] {
  const out: XP[] = [];
  const fd: [number, number, string][] = [
    [1,2,"0.5"],[1,4,"0.25"],[3,4,"0.75"],
    [1,5,"0.2"],[2,5,"0.4"],[3,5,"0.6"],[4,5,"0.8"],
    [1,8,"0.125"],[3,8,"0.375"],[5,8,"0.625"],[7,8,"0.875"],
    [1,10,"0.1"],[3,10,"0.3"],[7,10,"0.7"],[9,10,"0.9"],
    [1,20,"0.05"],[3,20,"0.15"],[7,20,"0.35"],[9,20,"0.45"],[11,20,"0.55"],[13,20,"0.65"],[17,20,"0.85"],[19,20,"0.95"],
    [1,25,"0.04"],[2,25,"0.08"],[3,25,"0.12"],[7,25,"0.28"],[9,25,"0.36"],[11,25,"0.44"],[13,25,"0.52"],[17,25,"0.68"],[21,25,"0.84"],
    [1,50,"0.02"],[3,50,"0.06"],[7,50,"0.14"],[9,50,"0.18"],
  ];
  const pctOf = (dec: string) => { const v = parseFloat(dec) * 100; return `${Number.isInteger(v) ? v : +v.toFixed(1)}%`; };
  // Bands by denominator, in the order a child can do them from the lesson:
  // halves/quarters/fifths/tenths (one or two places, read straight off the
  // place value) → twentieths (hundredths, simplify by 5) → eighths (three
  // places: 1 ÷ 8 = 0.125, a division to the thousandths no earlier sheet
  // practised) → 25ths and 50ths (hundredths, simplify by 4 or 2). Ranking by
  // the raw denominator put eighths BEFORE tenths, so day one served 7/8.
  const band: Record<number, number> = { 2: 0, 4: 0, 5: 0, 10: 0, 20: 1, 8: 2, 25: 3, 50: 4 };
  for (const [n,d,dec] of fd) {
    const pct = pctOf(dec);
    const base = band[d] * 10 + n * 0.1;
    out.push({ q: `Write ${F(n,d)} as a decimal.`, a: dec, diff: base + 0, key: `cfd:${n}/${d}` });
    out.push({ q: `Write ${dec} as a percent.`, a: pct, diff: base + 1, key: `cdp:${dec}` });
    out.push({ q: `Write ${pct} as a decimal.`, a: dec, diff: base + 2, key: `cpd:${pct}` });
    out.push({ q: `Write ${dec} as a fraction.`, a: F(n,d), diff: base + 3, key: `cdf:${dec}` });
    out.push({ q: `Write ${F(n,d)} as a percent.`, a: pct, diff: base + 4, key: `cfp:${n}/${d}` });
  }
  return out;
}

// ── RATIOS (M9) ───────────────────────────────────────────────────────────────
function enumRatioSimplify(): XP[] {
  const out: XP[] = [];
  // "a : a → 1 : 1" is kept to ONE item in the pool (6 : 6); they were piling
  // up on the later sheets as filler.
  for (let a = 2; a <= 24; a++) for (let b = 2; b <= 24; b++) {
    const g = gcd(a, b); if (g === 1) continue;
    if (a === b && a !== 6) continue;
    const key = `${a}:${b}`;
    out.push({ q: `Simplify the ratio ${a} : ${b}.`, a: `${a/g} : ${b/g}`, diff: a + b + g, key: `rs:${key}` });
  }
  return out;
}
// Equivalent ratios, banded so a 20-sheet unit is not one shape twenty times:
//   0. a : b = ka : ___ (the example)                      k 2–6, parts ≤ 9
//   1. the same with bigger scales and parts               k 7–12, parts ≤ 12
//   2. three-part ratios a : b : c = ka : ___ : kc         (find the scale from
//      either visible pair, apply it to the middle)
//   3. the blank on the LEFT: ___ : kb = a : b → scale from the pair you can see
//      (the shape the proportion lesson builds on)
function enumRatioEquiv(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
    if (gcd(a, b) !== 1) continue;          // start from a reduced ratio
    for (let k = 2; k <= 12; k++) {
      if (k <= 6 && a <= 9 && b <= 9)
        out.push({ q: `Find the missing number:  ${a} : ${b} = ${a*k} : ___`, a: String(b*k), diff: (a+b) + k * 4, key: `re:${a}:${b}x${k}` });
      else if (k >= 7 || a > 9 || b > 9)
        out.push({ q: `Find the missing number:  ${a} : ${b} = ${a*k} : ___`, a: String(b*k), diff: 60 + (a+b) + k * 2, key: `re:${a}:${b}x${k}` });
    }
  }
  for (let a = 1; a <= 5; a++) for (let b = a + 1; b <= 7; b++) for (const c of [b + 1, b + 2, b + 4]) for (let k = 2; k <= 5; k++) {
    if (c > 9 || gcd(gcd(a, b), c) !== 1) continue;
    out.push({ q: `Find the missing number:  ${a} : ${b} : ${c} = ${a*k} : ___ : ${c*k}`, a: String(b*k), diff: 100 + a + b + c + k * 3, key: `re3:${a}_${b}_${c}x${k}` });
  }
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (gcd(a, b) !== 1 || a === b) continue;
    for (let k = 2; k <= 6; k++)
      out.push({ q: `Find the missing number:  ___ : ${b*k} = ${a} : ${b}`, a: String(a*k), diff: 140 + (a+b) + k * 3, key: `rel:${a}:${b}x${k}` });
  }
  return out;
}
// Proportions, banded so a 24-sheet unit grows:
//   0. a : b = ___ : kb (the example: scale from the pair you can see)
//   1. the same proportion written as fractions a/b = ___/kb
//   2. the scale is NOT a whole number for the visible pair: 4 : 6 = ___ : 9.
//      Simplify first (4 : 6 = 2 : 3, then 3 → 9 is × 3, so 2 × 3 = 6) — or
//      cross-multiply: 4 × 9 ÷ 6 = 6. Both are on the lesson page.
function enumProportion(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (gcd(a, b) !== 1) continue;
    for (let k = 2; k <= 6; k++) {
      out.push({ q: `Find the missing number:  ${a} : ${b} = ___ : ${b*k}`, a: String(a*k), diff: (a + b) + k * 5 + 8, key: `pr:${a}_${b}_${k}` });
      if (a !== b && k <= 5) out.push({ q: `Find the missing number:  ${F(a, b)} = ${BS}frac{___}{${b*k}}`, a: String(a*k), diff: 60 + (a + b) + k * 4, key: `prf:${a}_${b}_${k}` });
    }
  }
  // a·g : b·g = ___ : b·h with g ∤ h (so the visible scale h/g is a fraction),
  // answer a·h. Base a : b reduced, g and h coprime, everything ≤ 36.
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 6; b++) {
    if (gcd(a, b) !== 1 || a === b) continue;
    for (const [g, h] of [[2, 3], [3, 2], [2, 5], [4, 6], [3, 4], [4, 3], [6, 4], [3, 5]] as [number, number][]) {
      if (b * h > 36 || a * g > 36) continue;
      out.push({ q: `Find the missing number:  ${a*g} : ${b*g} = ___ : ${b*h}`, a: String(a*h), diff: 110 + a + b + g + h, key: `prx:${a}_${b}_${g}_${h}` });
    }
  }
  return out;
}
// Scale up, banded so a 22-sheet unit is not two one-digit multiplications
// twenty-two times:
//   0. scale a : a+1 by k (the example)
//   1. any reduced a : b (parts ≤ 15) by k up to 12
//   2. three-part ratios 2 : 3 : 5 by 4
//   3. scale so a NAMED part reaches a target: "scale 3 : 4 so the first part
//      is 15" → find the factor (15 ÷ 3 = 5) first, then 15 : 20
function enumScale(): XP[] {
  const out: XP[] = [];
  for (let a = 2; a <= 12; a++) for (let k = 2; k <= 8; k++)
    out.push({ q: `Write an equivalent ratio: scale ${a} : ${a+1} by ${k}.`, a: `${a*k} : ${(a+1)*k}`, diff: a + k * 5 + 12, key: `sc:${a}x${k}` });
  for (let a = 1; a <= 15; a++) for (let b = 1; b <= 15; b++) {
    if (gcd(a, b) !== 1 || b === a + 1 || a === b) continue;
    for (let k = 2; k <= 12; k++) {
      if ((a + b) % 3 !== (k % 3)) continue;   // thin the grid: ~1/3 of the pairs per scale
      out.push({ q: `Write an equivalent ratio: scale ${a} : ${b} by ${k}.`, a: `${a*k} : ${b*k}`, diff: 70 + a + b + k * 3, key: `sc2:${a}_${b}x${k}` });
    }
  }
  for (const [a, b, c] of [[1, 2, 3], [2, 3, 5], [1, 3, 4], [3, 4, 5], [1, 2, 5], [2, 5, 7], [1, 4, 6], [3, 5, 8], [2, 3, 7], [1, 3, 7]] as [number, number, number][])
    for (let k = 2; k <= 9; k++)
      out.push({ q: `Write an equivalent ratio: scale ${a} : ${b} : ${c} by ${k}.`, a: `${a*k} : ${b*k} : ${c*k}`, diff: 130 + a + b + c + k * 2, key: `sc3:${a}_${b}_${c}x${k}` });
  for (let a = 2; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (gcd(a, b) !== 1 || a === b) continue;
    for (let k = 2; k <= 9; k++)
      out.push({ q: `Scale ${a} : ${b} so the first part becomes ${a*k}. Write the new ratio.`, a: `${a*k} : ${b*k}`, diff: 170 + a + b + k * 2, key: `sct:${a}_${b}x${k}` });
  }
  return out;
}

// ── PRE-ALGEBRA (M10) ─────────────────────────────────────────────────────────
// Evaluate by substitution, banded so eleven sheets are not one substitution
// eleven times (no negative x: integers are lesson 9):
//   0. x ± k (the example)   1. k − x (x is the number taken away)
//   2. two letters: x + y and x − y
function enumEvaluate(opSym: "+" | "-", ): XP[] {
  const out: XP[] = [];
  for (let v = 1; v <= 12; v++) for (let b = 1; b <= 12; b++) {
    const ans = opSym === "+" ? v + b : v - b;
    if (ans < 0) continue; // a negative result is integer subtraction — lesson 9, not lesson 2
    out.push({ q: `Evaluate x ${opSym} ${b} when x = ${v}.`, a: String(ans), diff: v + b + 5, key: `ev${opSym}:${v}_${b}` });
  }
  if (opSym === "-") {
    for (let k = 5; k <= 20; k++) for (let v = 1; v < k; v++)
      if ((k + v) % 2 === 0) out.push({ q: `Evaluate ${k} - x when x = ${v}.`, a: String(k - v), diff: 40 + k + v * 0.5, key: `evr:${k}_${v}` });
  } else {
    for (let v = 1; v <= 12; v++) for (let w = 1; w <= 12; w++) {
      if ((v + w) % 2 === 1) out.push({ q: `Evaluate x + y when x = ${v}, y = ${w}.`, a: String(v + w), diff: 70 + v + w, key: `evxy:${v}_${w}` });
      else if (v > w) out.push({ q: `Evaluate x - y when x = ${v}, y = ${w}.`, a: String(v - w), diff: 72 + v + w, key: `evxy-:${v}_${w}` });
    }
  }
  return out;
}
// Evaluate a product, banded: ax (the example) → ax + b and ax − b (multiply
// first, then add or subtract — the substitution the lesson shows, one more step).
function enumEvaluateMul(): XP[] {
  const out: XP[] = [];
  for (let v = 1; v <= 12; v++) for (let m = 2; m <= 9; m++)
    out.push({ q: `Evaluate ${m}x when x = ${v}.`, a: String(m*v), diff: v + m * 2 + 10, key: `evm:${m}_${v}` });
  for (let v = 1; v <= 12; v++) for (let m = 2; m <= 9; m++) for (const b of [1, 2, 3, 4, 5, 7]) {
    if ((v + m + b) % 3 === 0) out.push({ q: `Evaluate ${m}x + ${b} when x = ${v}.`, a: String(m*v + b), diff: 60 + v + m * 2 + b, key: `evmb:${m}_${v}+${b}` });
    else if ((v + m + b) % 3 === 1 && m * v > b) out.push({ q: `Evaluate ${m}x - ${b} when x = ${v}.`, a: String(m*v - b), diff: 62 + v + m * 2 + b, key: `evmb:${m}_${v}-${b}` });
  }
  return out;
}
// Combine like terms, banded so twelve sheets are not "3 + 5 with an x after
// it" twelve times:
//   0. ax + bx (the example)   1. ax − bx   2. ax + c + bx + d (two kinds of
//   like terms: the x's together, the numbers together)   3. x's and y's mixed
function enumCombine(): XP[] {
  const out: XP[] = [];
  for (let m = 1; m <= 9; m++) for (let n = 1; n <= 9; n++) {
    out.push({ q: `Simplify ${term(m,"x")} + ${term(n,"x")}.`, a: term(m+n,"x"), diff: m + n + 8, key: `cl:${m}+${n}` });
    if (m > n) out.push({ q: `Simplify ${term(m,"x")} - ${term(n,"x")}.`, a: term(m-n,"x"), diff: 40 + m + n, key: `cls:${m}-${n}` });
  }
  for (let m = 1; m <= 8; m++) for (let n = 1; n <= 8; n++) for (const [c, d] of [[2, 3], [4, 1], [3, 5], [6, 2], [1, 7], [5, 4]] as [number, number][]) {
    if ((m + n + c) % 4 !== 0) continue;
    out.push({ q: `Simplify ${term(m,"x")} + ${c} + ${term(n,"x")} + ${d}.`, a: `${term(m+n,"x")} + ${c+d}`, diff: 80 + m + n + c + d, key: `clc:${m}_${c}_${n}_${d}` });
  }
  for (let m = 1; m <= 7; m++) for (let n = 1; n <= 7; n++) for (const [c, d] of [[2, 3], [4, 1], [3, 5], [1, 6]] as [number, number][]) {
    if ((m + n + c + d) % 3 !== 0) continue;
    out.push({ q: `Simplify ${term(m,"x")} + ${term(c,"y")} + ${term(n,"x")} + ${term(d,"y")}.`, a: `${term(m+n,"x")} + ${term(c+d,"y")}`, diff: 120 + m + n + c + d, key: `clxy:${m}_${c}_${n}_${d}` });
  }
  return out;
}
function enumOneStep(op: "+" | "-" | "×"): XP[] {
  const out: XP[] = [];
  if (op === "×") {
    for (let m = 2; m <= 9; m++) for (let x = 2; x <= 12; x++)
      out.push({ q: `Solve for x:  ${m}x = ${m*x}`, a: String(x), diff: m + x + 16, key: `os×:${m}_${x}` });
  } else {
    for (let x = 1; x <= 20; x++) for (let b = 1; b <= 15; b++) {
      const c = op === "+" ? x + b : x + b; // x + b = c → x=c-b ;  x - b = c → here present as x - b
      if (op === "+") out.push({ q: `Solve for x:  x + ${b} = ${x+b}`, a: String(x), diff: x + b + 12, key: `os+:${x}_${b}` });
      else out.push({ q: `Solve for x:  x - ${b} = ${x}`, a: String(x+b), diff: x + b + 13, key: `os-:${x}_${b}` });
    }
  }
  return out;
}
function enumInteger(op: "+" | "-"): XP[] {
  const out: XP[] = [];
  for (let a = -9; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (a === 0) continue;
    const ans = op === "+" ? a + b : a - b;
    // Positive + positive and positive − smaller positive are M1–M4 facts, not
    // integer arithmetic; they were a quarter of the opening sheet.
    if (a > 0 && (op === "+" || ans >= 0)) continue;
    const as = a < 0 ? `(${a})` : `${a}`;
    // Bands follow the three lines of the worked example: negative + positive
    // (move right) → positive − larger positive (move left past zero) →
    // negative − positive (move left from a negative start).
    const band = op === "+" ? (ans >= 0 ? 0 : 1) : a > 0 ? 2 : 3;
    out.push({ q: `${as} ${op} ${b}`, a: String(ans), diff: band * 20 + Math.abs(a) + b, key: `int${op}:${a}_${b}` });
  }
  return out;
}
// Order of operations, banded so the × is not always on the right (a child
// who always multiplied the last two numbers scored 100%):
//   0. a + b × c (the example)   1. a × b + c   2. a − b × c
//   3. (a + b) × c — brackets first   4. a + b ÷ c
function enumOrderOps(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let c = 2; c <= 9; c++) {
    out.push({ q: `${a} + ${b} × ${c}`, a: String(a + b * c), diff: a + b + c + 22, key: `oo:${a}_${b}_${c}` });
    if ((a + b + c) % 3 === 0) out.push({ q: `${b} × ${c} + ${a}`, a: String(b * c + a), diff: 60 + a + b + c, key: `oom:${a}_${b}_${c}` });
    if ((a + b + c) % 3 === 1 && b * c < 40) out.push({ q: `${b * c + a} - ${b} × ${c}`, a: String(a), diff: 90 + a + b + c, key: `oos:${a}_${b}_${c}` });
    if ((a + b + c) % 3 === 2) out.push({ q: `(${a} + ${b}) × ${c}`, a: String((a + b) * c), diff: 120 + a + b + c, key: `oob:${a}_${b}_${c}` });
    if ((a + c) % 4 === 0) out.push({ q: `${a} + ${b * c} ÷ ${c}`, a: String(a + b), diff: 150 + a + b + c, key: `ood:${a}_${b}_${c}` });
  }
  return out;
}

// ── LINEAR EQUATIONS (M11) ────────────────────────────────────────────────────
function enumTwoStep(sign: 1 | -1): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 9; m++) for (let x = 1; x <= 12; x++) for (let b = 1; b <= 12; b++) {
    const c = m * x + sign * b;
    if (c <= 0) continue;
    const op = sign === 1 ? "+" : "-";
    out.push({ q: `Solve for x:  ${m}x ${op} ${b} = ${c}`, a: String(x), diff: m + x + b + (sign === 1 ? 6 : 8), key: `ts${op}:${m}_${x}_${b}` });
  }
  return out;
}
// Equations with a bracket, banded so sixteen sheets are not one shape solved
// by one shortcut:
//   0. k(x + b) = c (the example: divide by k first)
//   1. k(x − b) = c (a minus inside — expand or divide, then ADD b)
//   2. k(x + b) + d = c (a number after the bracket: subtract it first, or
//      expand the bracket and solve the two-step equation)
function enumDistribute(): XP[] {
  const out: XP[] = [];
  for (let k = 2; k <= 6; k++) for (let b = 1; b <= 9; b++) for (let x = 1; x <= 9; x++) {
    out.push({ q: `Solve for x:  ${k}(x + ${b}) = ${k*(x+b)}`, a: String(x), diff: k + b + x + 18, key: `dist:${k}_${b}_${x}` });
    if (x > b) out.push({ q: `Solve for x:  ${k}(x - ${b}) = ${k*(x-b)}`, a: String(x), diff: 50 + k + b + x, key: `dists:${k}_${b}_${x}` });
    if ((k + b + x) % 3 === 0) for (const d of [1, 2, 3, 5])
      if ((d + x) % 2 === 0) out.push({ q: `Solve for x:  ${k}(x + ${b}) + ${d} = ${k*(x+b) + d}`, a: String(x), diff: 90 + k + b + x + d, key: `distd:${k}_${b}_${x}_${d}` });
  }
  return out;
}
function enumBothSides(): XP[] {
  const out: XP[] = [];
  // mx = x + b — the one-move form (gather x, divide). Lowest band so the
  // opening sheet leads with it.
  for (let m = 2; m <= 8; m++) for (let x = 1; x <= 20; x++) {
    const b = (m - 1) * x;
    out.push({ q: `Solve for x:  ${m}x = x + ${b}`, a: String(x), diff: m + x, key: `bs:${m}_${x}` });
  }
  // mx + a = nx + b  (n < m) — constants on both sides, the general case the
  // worked example teaches. Coefficient 1 renders as "x" (never "1x").
  for (let m = 3; m <= 7; m++) for (let n = 1; n < m; n++) for (let x = 1; x <= 12; x++) {
    const a = x, b = (m - n) * x + a;       // mx + a = nx + b → x = (b - a)/(m - n)
    out.push({ q: `Solve for x:  ${m}x + ${a} = ${term(n, "x")} + ${b}`, a: String(x), diff: 40 + m + n + x, key: `bs2:${m}_${n}_${x}` });
  }
  return out;
}
// Equations with a fraction, banded so fourteen sheets are not one-step
// x/d = q fourteen times:
//   0. x/d = q (the example)   1. x/d + b = c (subtract b first, then multiply)
//   2. (x + b)/d = c (the whole top is divided: multiply first, then subtract b)
function enumDivEq(): XP[] {
  const out: XP[] = [];
  for (let d = 2; d <= 9; d++) for (let q = 1; q <= 15; q++) {
    out.push({ q: `Solve for x:  ${BS}frac{x}{${d}} = ${q}`, a: String(d*q), diff: d + q + 14, key: `de:${d}_${q}` });
    if (q <= 9) for (const b of [1, 2, 3, 4, 5]) {
      if ((d + q + b) % 3 === 0) out.push({ q: `Solve for x:  ${BS}frac{x}{${d}} + ${b} = ${q + b}`, a: String(d*q), diff: 50 + d + q + b, key: `deb:${d}_${q}_${b}` });
      if ((d + q + b) % 3 === 1 && d * q > b) out.push({ q: `Solve for x:  ${BS}frac{x + ${b}}{${d}} = ${q}`, a: String(d*q - b), diff: 90 + d + q + b, key: `det:${d}_${q}_${b}` });
    }
  }
  return out;
}

// ── POLYNOMIALS (M12) ─────────────────────────────────────────────────────────
function enumPolyCombine(): XP[] {
  const out: XP[] = [];
  // Sums are the low band (the example's first line); differences — including
  // the ones that land on a bare x² — sit above every sum, so the opening sheet
  // is sums and subtraction arrives from the second sheet on.
  for (let m = 1; m <= 12; m++) for (let n = 1; n <= 12; n++) {
    out.push({ q: `Simplify ${term(m,"x²")} + ${term(n,"x²")}.`, a: term(m+n,"x²"), diff: m + n, key: `pc:${m}+${n}` });
    if (m > n) out.push({ q: `Simplify ${term(m,"x²")} - ${term(n,"x²")}.`, a: term(m-n,"x²"), diff: 30 + m + n, key: `pcs:${m}-${n}` });
  }
  return out;
}
function enumPolyAdd(sub: boolean): XP[] {
  const out: XP[] = [];
  // Subtraction: differences that stay positive are the low band (the
  // example); a NEGATIVE coefficient or constant — the case the
  // distribute-the-minus lesson exists for — is the high band, from the third
  // sheet on. Nothing lands on a zero term.
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 6; c++) for (let d = 1; d <= 9; d++) {
    if (sub && (a === c || b === d)) continue;
    const xc = sub ? a - c : a + c, k = sub ? b - d : b + d;
    const op = sub ? "-" : "+";
    const neg = sub && (xc < 0 || k < 0);
    if (neg && (a + b + c + d) % 3 !== 0) continue;   // thin the negative band to the size of the positive one
    out.push({ q: `Simplify (${term(a,"x")} + ${b}) ${op} (${term(c,"x")} + ${d}).`, a: pStr([{ c: xc, p: 1 }, { c: k, p: 0 }]), diff: (neg ? 60 : 0) + a + b + c + d + (sub ? 16 : 12), key: `pa${op}:${a}_${b}_${c}_${d}` });
  }
  return out;
}
function enumMonomialMul(): XP[] {
  const out: XP[] = [];
  // One item per UNORDERED pair ("5x · 3x" and "3x · 5x" were side by side on
  // one sheet); the shown order alternates. Higher powers (add the exponents:
  // 3x² · 4x = 12x³) are the later band, shown on the lesson page.
  for (let m = 2; m <= 12; m++) for (let n = m; n <= 12; n++) {
    const flip = (m + n) % 2 === 1;
    out.push({ q: flip ? `Multiply ${n}x · ${m}x.` : `Multiply ${m}x · ${n}x.`, a: `${m*n}x²`, diff: m + n + 20, key: `mm:${m}_${n}` });
  }
  for (let m = 2; m <= 9; m++) for (let n = 2; n <= 9; n++) for (const [p, q] of [[2, 1], [1, 2], [2, 2], [3, 1]] as [number, number][]) {
    if ((m + n + p) % 3 !== 0) continue;
    out.push({ q: `Multiply ${pMono(m, p)} · ${pMono(n, q)}.`, a: pMono(m * n, p + q), diff: 60 + m + n + p + q, key: `mmp:${m}_${p}_${n}_${q}` });
  }
  return out;
}
function enumMonoDistribute(): XP[] {
  const out: XP[] = [];
  // Plus inside the bracket is the low band (the example); a minus inside is
  // the high band — "2x(x − 1)" was the very first item of the unit.
  for (let m = 2; m <= 9; m++) for (let b = 1; b <= 12; b++) {
    out.push({ q: `Expand ${m}x(x + ${b}).`, a: `${m}x² + ${m*b}x`, diff: m + b, key: `md:${m}_${b}` });
    if (b <= m + 3) out.push({ q: `Expand ${m}x(x - ${b}).`, a: `${m}x² - ${m*b}x`, diff: 40 + m + b, key: `mds:${m}_${b}` });
  }
  return out;
}
function enumFoil(): XP[] {
  const out: XP[] = [];
  // One item per UNORDERED pair — "(x + 3)(x + 1)" and "(x + 1)(x + 3)" were
  // next to each other on one sheet. The shown order alternates. A minus in
  // one bracket, (x + a)(x − b), is the high band (the example's last step).
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
    const flip = (a + b) % 2 === 1;
    out.push({ q: flip ? `Expand (x + ${b})(x + ${a}).` : `Expand (x + ${a})(x + ${b}).`, a: `x² + ${a+b}x + ${a*b}`, diff: a + b + 32, key: `foil:${a}_${b}` });
  }
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (a === b || (a + b) % 2 === 0) continue;
    out.push({ q: `Expand (x + ${a})(x - ${b}).`, a: pStr([{ c: 1, p: 2 }, { c: a - b, p: 1 }, { c: -a * b, p: 0 }]), diff: 70 + a + b, key: `foils:${a}_${b}` });
  }
  return out;
}
// INTERACTIVE AREA MODEL: fill the four regions of (x+a)(x+b). Answer is the four
// partial products in fixed order (x², ax, bx, ab); graded by value match.
function enumAreaModel(): XP[] {
  // Seventy-two products (constants to 12), ranked by size, so the four sheets
  // are different sets that grow — 33 items had the last sheet re-printing the
  // first in the same order.
  const out: XP[] = []; let i = 0;
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 12; b++)
    out.push({
      q: `Fill in the area model for (x + ${a})(x + ${b}).`,
      a: `x²,${a}x,${b}x,${a * b}`, diff: a + b + a * b * 0.1 + i++ * 0.01, key: `am:${a}_${b}`,
      type: "short_answer", interactive: { kind: "area-model", binomial: { a, b }, xRange: [0, 1], yRange: [0, 1], snap: 1 },
    });
  return out;
}
// MULTI-SELECT (the "factor model"): select ALL binomial factors of x²+Sx+P.
// Answer = the correct factors, sorted + comma-joined (order-independent).
// Distractors are interleaved so the two correct factors are never adjacent.
// The unit was select-only, so a child never TYPED a factorization before the
// a ≠ 1 lesson demanded one. The typed form "Factor x² + 5x + 6." (key with the
// smaller constant first, as the directive says) is the high band: the opening
// sheet is the select items, and the last two sheets are mostly typed.
function enumTypedFactors(): XP[] {
  const out: XP[] = [];
  for (let p = 1; p <= 8; p++) for (let q = p + 1; q <= 9; q++)
    out.push({ q: `Factor x² + ${p + q}x + ${p * q}.`, a: `(x + ${p})(x + ${q})`, diff: 50 + p * q + (p + q) * 0.1, key: `tyfac:${p}_${q}` });
  return out;
}
function enumSelectFactors(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let p = 2; p <= 7; p++) for (let q = p + 1; q <= 9; q++) {
    const s = p + q, prod = p * q;
    const c0 = `(x + ${p})`, c1 = `(x + ${q})`;
    const d0 = `(x + ${p - 1})`, d1 = `(x + ${q + 1})`;   // p-1≥1, q+1>q → never equal p or q
    const opts = [c0, d0, c1, d1];
    if (new Set(opts).size < 4) continue;
    out.push({
      q: `Select all the factors of x² + ${s}x + ${prod}.`,
      a: [c0, c1].sort().join(","), diff: 30 + i++ * 0.1, key: `selfac:${p}_${q}`,
      type: "multiple_choice", options: opts,
    });
  }
  return out;
}
function enumFactorGcf(): XP[] {
  const out: XP[] = [];
  // A number GCF (the example) is the low band; a GCF with x in it —
  // 3x² + 6x = 3x(x + 2), 2x³ + 8x² = 2x²(x + 4) — is the later band, so the
  // unit ramps back up to where the divide-by-a-monomial lesson left off.
  for (let g = 2; g <= 12; g++) for (let b = 1; b <= 12; b++)
    out.push({ q: `Factor ${g}x + ${g*b}.`, a: `${g}(x + ${b})`, diff: g + b + 30, key: `fg:${g}_${b}` });
  for (let g = 2; g <= 9; g++) for (let b = 1; b <= 9; b++) {
    if ((g + b) % 2 === 0) out.push({ q: `Factor ${pStr([{ c: g, p: 2 }, { c: g * b, p: 1 }])}.`, a: `${g}x(x + ${b})`, diff: 70 + g + b, key: `fgx:${g}_${b}` });
    else if (g <= 6) out.push({ q: `Factor ${pStr([{ c: g, p: 3 }, { c: g * b, p: 2 }])}.`, a: `${g}x²(x + ${b})`, diff: 100 + g + b, key: `fgx2:${g}_${b}` });
  }
  return out;
}

// ── TIER 2: advanced factoring (each is its own single-task unit) ─────────────
// Difference of squares: a² − b² = (a + b)(a − b).
// Only gcd(m, k) = 1 pairs: 4x² − 4 keyed as (2x + 2)(2x − 2) is not fully
// factored, and a child who pulls the GCF first (taught three lessons earlier)
// writes 4(x + 1)(x − 1) — correct, and marked wrong. Every key here is the
// complete factorization. Banded: x² − k² (the example) → m²x² − k² by m.
function enumFactorDiffSquares(): XP[] {
  const out: XP[] = [];
  for (let k = 1; k <= 15; k++)
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: -(k * k), p: 0 }])}.`, a: `(x + ${k})(x - ${k})`, diff: k, key: `dsq:1_${k}` });
  for (const m of [2, 3, 4, 5, 6, 7]) for (let k = 1; k <= 10; k++) {
    if (gcd(m, k) !== 1) continue;
    out.push({ q: `Factor ${m * m}x² - ${k * k}.`, a: `(${term(m, "x")} + ${k})(${term(m, "x")} - ${k})`, diff: 20 + m * 12 + k, key: `dsq:${m}_${k}` });
  }
  return out;
}
// Perfect-square trinomial: x² ± 2bx + b² = (x ± b)².
// Banded: plus (the example) → minus middle term → a leading square, the same
// pattern with the first root no longer hiding: a²x² ± 2abx + b² = (ax ± b)²
// (only gcd(a, b) = 1, so every key is fully factored — 4x² + 8x + 4 is
// 4(x + 1)²). Thirty items was exactly one sheet, so every sheet of the unit
// was the whole pool and no band could hold anything back.
function enumFactorPerfectSquare(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 15; b++) {
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: 2 * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(x + ${b})²`, diff: b, key: `psq:+${b}` });
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: -2 * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(x - ${b})²`, diff: 20 + b, key: `psq:-${b}` });
  }
  for (const a of [2, 3]) for (let b = 1; b <= 7; b++) {
    if (gcd(a, b) !== 1) continue;
    out.push({ q: `Factor ${pStr([{ c: a * a, p: 2 }, { c: 2 * a * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(${term(a, "x")} + ${b})²`, diff: 40 + a * 10 + b, key: `psqa:+${a}_${b}` });
    out.push({ q: `Factor ${pStr([{ c: a * a, p: 2 }, { c: -2 * a * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(${term(a, "x")} - ${b})²`, diff: 40 + a * 10 + b + 0.5, key: `psqa:-${a}_${b}` });
  }
  return out;
}
// Trinomial with leading coefficient a ≠ 1: ax² + bx + c = (px + q)(rx + s).
// Only gcd(a, b, c) = 1 triples: 2x² + 6x + 4 keyed as (2x + 2)(x + 2) is not
// fully factored, and a child who pulls the GCF first (taught two lessons
// earlier) writes 2(x + 1)(x + 2) — correct, and marked wrong. The grader is an
// exact string match, so the key fixes ONE order — the factor with the larger
// x-coefficient first, then the smaller constant first — and the directive
// says so. Banded: a = 2 with c prime or 1 (the example's shape: one way to
// split c) → a = 2 → a = 3 → a = 4, 6, 9.
const isPrime = (n: number): boolean => n >= 2 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
function enumFactorTrinomialA(): XP[] {
  const out: XP[] = [];
  const seen = new Set<string>();
  for (const [p, r] of [[2, 1], [3, 1], [2, 2], [3, 2], [2, 3], [3, 3]] as [number, number][])
    for (let q = 1; q <= 9; q++) for (let s = 1; s <= 9; s++) {
      if (p === 3 && s > 6) continue;              // keep the a = 3 band a similar size to a = 2
      if (r !== 1 && (q > 5 || s > 5)) continue;   // both factors carry a coefficient: keep constants small
      const a = p * r, b = p * s + q * r, c = q * s;
      if (gcd(gcd(a, b), c) !== 1) continue;
      const key = `trN:${a}_${b}_${c}`;
      if (seen.has(key)) continue;                 // (2x+1)(2x+3) ≡ (2x+3)(2x+1) — keep one
      seen.add(key);
      const factors = [[p, q], [r, s]].sort((u, v) => v[0] - u[0] || u[1] - v[1]);
      const band = a === 2 ? (c === 1 || isPrime(c) ? 0 : 1) : a === 3 ? 2 : 3;
      out.push({
        q: `Factor ${pStr([{ c: a, p: 2 }, { c: b, p: 1 }, { c, p: 0 }])}.`,
        a: factors.map(([m, k]) => `(${term(m, "x")} + ${k})`).join(""),
        diff: band * 100 + c + b * 0.1, key,
      });
    }
  return out;
}
// Factor by grouping (four terms): x³ + bx² + ax + ab = (x² + a)(x + b).
function enumFactorGrouping(): XP[] {
  const out: XP[] = [];
  // Banded: all-plus (the example) → a minus in both groups, x³ − bx² + ax − ab
  // = x²(x − b) + a(x − b) = (x² + a)(x − b) → a leading coefficient,
  // 2x³ + 2bx² + ax + ab = (2x² + a)(x + b). Keys always put the x² bracket
  // first (the directive says so).
  for (let a = 1; a <= 8; a++) for (let b = 1; b <= 7; b++) {
    out.push({ q: `Factor ${pStr([{ c: 1, p: 3 }, { c: b, p: 2 }, { c: a, p: 1 }, { c: a * b, p: 0 }])}.`, a: `(x² + ${a})(x + ${b})`, diff: a + b, key: `grp:${a}_${b}` });
    if ((a + b) % 2 === 0) out.push({ q: `Factor ${pStr([{ c: 1, p: 3 }, { c: -b, p: 2 }, { c: a, p: 1 }, { c: -a * b, p: 0 }])}.`, a: `(x² + ${a})(x - ${b})`, diff: 30 + a + b, key: `grpm:${a}_${b}` });
    if ((a + b) % 3 === 0 && a % 2 === 1) out.push({ q: `Factor ${pStr([{ c: 2, p: 3 }, { c: 2 * b, p: 2 }, { c: a, p: 1 }, { c: a * b, p: 0 }])}.`, a: `(2x² + ${a})(x + ${b})`, diff: 60 + a + b, key: `grp2:${a}_${b}` });
  }
  return out;
}
// Sum / difference of cubes: x³ ± k³ = (x ± k)(x² ∓ kx + k²).
function enumFactorCubes(): XP[] {
  const out: XP[] = [];
  for (let k = 1; k <= 10; k++) {
    out.push({ q: `Factor x³ + ${k * k * k}.`, a: `(x + ${k})(x² - ${term(k, "x")} + ${k * k})`, diff: k, key: `cub:+${k}` });
    out.push({ q: `Factor x³ - ${k * k * k}.`, a: `(x - ${k})(x² + ${term(k, "x")} + ${k * k})`, diff: k + 0.5, key: `cub:-${k}` });
  }
  // Twenty problems across four sheets meant a child saw the same cube twice
  // on one page. A leading coefficient is the same pattern with the first cube
  // root no longer hiding: a³x³ ± k³ = (ax ± k)(a²x² ∓ akx + k²). Only
  // gcd(a, k) = 1: 8x³ + 8 keyed as (2x + 2)(4x² − 4x + 4) is not fully
  // factored (it is 8(x + 1)(x² − x + 1)).
  for (const a of [2, 3, 4]) for (let k = 1; k <= 5; k++) {
    if (gcd(a, k) !== 1) continue;
    const a3 = a * a * a, k3 = k * k * k;
    out.push({
      q: `Factor ${term(a3, "x³")} + ${k3}.`,
      a: `(${term(a, "x")} + ${k})(${term(a * a, "x²")} - ${term(a * k, "x")} + ${k * k})`,
      diff: a * 2 + k + 10, key: `cuba:+${a}_${k}`,
    });
    out.push({
      q: `Factor ${term(a3, "x³")} - ${k3}.`,
      a: `(${term(a, "x")} - ${k})(${term(a * a, "x²")} + ${term(a * k, "x")} + ${k * k})`,
      diff: a * 2 + k + 10.5, key: `cuba:-${a}_${k}`,
    });
  }
  return out;
}

// ── POLYNOMIALS Tier-1 additions: foundations, more operations, division ──────
// Shared polynomial formatting: unicode superscripts + signed term joining, so a
// list of {c (coefficient), p (power)} renders as conventional algebra, e.g.
// [{c:1,p:2},{c:-3,p:1},{c:5,p:0}] → "x² - 3x + 5".
const PSUP: Record<number, string> = { 0: "", 1: "", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶" };
const pMono = (c: number, p: number): string => (p === 0 ? `${c}` : term(c, p === 1 ? "x" : `x${PSUP[p]}`));
function pStr(terms: { c: number; p: number }[]): string {
  const parts = terms.filter((t) => t.c !== 0);
  if (parts.length === 0) return "0";
  return parts.map((t, i) => {
    const m = pMono(Math.abs(t.c), t.p);
    if (i === 0) return t.c < 0 ? `-${m}` : m;
    return t.c < 0 ? ` - ${m}` : ` + ${m}`;
  }).join("");
}

// Fundamentals: classify a polynomial by its number of terms (+ identify whether
// an expression is a polynomial at all). Multiple-choice, value-graded.
// Difficulty for the foundation units is not meaningfully ordered (classifying a
// monomial isn't "easier" than a trinomial in a way that should segregate onto
// separate sheets). Scatter each item across the band by a hash of its key so
// every sheet draws a MIX of the sub-types instead of one homogeneous block.
const scatterDiff = (key: string): number => (hashStr(key) % 1000) / 1000 * 8;
function enumPolyClassify(): XP[] {
  const out: XP[] = [];
  const OPTS = ["monomial", "binomial", "trinomial"];
  const push = (e: string, label: string, key: string) =>
    out.push({ q: `Classify by the number of terms: ${e}`, a: label, diff: scatterDiff(key), type: "multiple_choice", options: OPTS, key });
  // Generated to keep the pool large enough (> one sheet's worth) that a single
  // sheet never has to cycle and repeat a question.
  for (let p = 0; p <= 4; p++) for (const c of [2, 3, 5, 7])          // monomials: c·xᵖ
    push(pMono(c, p), "monomial", `clm:${c}_${p}`);
  for (let p = 1; p <= 3; p++) for (const c of [1, 3, 5, -2, -4])      // binomials: xᵖ + c
    push(pStr([{ c: 1, p }, { c, p: 0 }]), "binomial", `clb:${p}_${c}`);
  for (const b of [3, 5, -1, 2, 4, -3]) for (const c of [2, -4, 6, 10]) // trinomials: x² + bx + c
    push(pStr([{ c: 1, p: 2 }, { c: b, p: 1 }, { c, p: 0 }]), "trinomial", `clt:${b}_${c}`);
  return out;
}
function enumPolyIdentify(): XP[] {
  const out: XP[] = [];
  // Twenty-eight examples across three sheets left no room to spare, so a
  // sheet could repeat. Each addition is a DIFFERENT reason to say yes or no —
  // a constant and a bare variable are polynomials; roots, negative powers,
  // variable exponents and variables in a denominator are the four ways out.
  const yes = ["x² + 3x + 1", "5x - 2", "7x³", "x + 9", "4x² - x", "2x⁴ + 1", "x³ - 5", "6x² + 2x", "x + 1", "3x⁵", "8x² + 3x - 2", "x⁴ - x²", "9 - x", "x² + 10",
    "12", "x", "x⁶ + x³ + 1", "0.5x² + 2", "-4x³ + x", "x² - 7x + 12", "2x", "5x⁴ - 3x² + 6"];
  const no = ["1/x + 5", "√x - 3", "x⁻² + 1", "3ˣ + 2", "2/x²", "1/x²", "√x + 4", "5/x", "x⁻¹ + 7", "2ˣ - 1", "4/x + x", "6x⁻³", "√x - x", "1/(x + 2)",
    "x^(1/2) + 1", "7/x³", "∛x + 2", "5ˣ", "x² + 1/x", "2x⁻⁴", "√(x + 1)", "1/(3x)"];
  // Banded by the reason for "No": the Yes cases and x-in-a-denominator (the
  // worked example) fill the opening sheet; roots, fraction/negative powers and
  // x as an exponent are the later sheets' cases (the example names them, but
  // day one is what it worked through).
  const noBand = (e: string): number => (/ˣ/.test(e) ? 12 : /√|∛|\^\(1\/2\)/.test(e) ? 10 : /⁻/.test(e) ? 11 : 0);
  yes.forEach((e, i) => out.push({ q: `Is this a polynomial?   ${e}`, a: "Yes", diff: scatterDiff(`id:y:${i}`), type: "multiple_choice", options: ["Yes", "No"], key: `id:y:${i}` }));
  no.forEach((e, i) => out.push({ q: `Is this a polynomial?   ${e}`, a: "No", diff: noBand(e) + scatterDiff(`id:n:${i}`), type: "multiple_choice", options: ["Yes", "No"], key: `id:n:${i}` }));
  return out;
}
// Degree of a polynomial (highest power present). Scattered so each sheet mixes
// "find the degree" with "write in standard form".
function enumPolyDegree(): XP[] {
  const out: XP[] = [];
  // Thirty items was exactly one sheet, so sheets 8–10 were the same page three
  // times. Banded: standard form (the highest power is the first term — the
  // example) → NOT in standard form (2x + x³ + 5: the highest power is not
  // first, which the example's last step warns about) → monomials and
  // constants (a bare number has degree 0).
  for (let D = 2; D <= 5; D++) for (let mid = 1; mid < D; mid++) for (const lead of [1, 2, 3]) for (const k of [1, 4, 7]) {
    if ((mid + lead + k) % 2 === 0) continue;
    out.push({ q: `Find the degree of ${pStr([{ c: lead, p: D }, { c: 2, p: mid }, { c: k, p: 0 }])}.`, a: String(D), diff: scatterDiff(`deg:${D}_${mid}_${lead}_${k}`), key: `deg:${D}_${mid}_${lead}_${k}` });
  }
  for (let D = 2; D <= 5; D++) for (let mid = 1; mid < D; mid++) for (const lead of [1, 2, 4]) for (const k of [3, 5]) {
    const scrambled = (mid + lead + k) % 2 === 0
      ? [{ c: 2, p: mid }, { c: lead, p: D }, { c: k, p: 0 }]
      : [{ c: k, p: 0 }, { c: 2, p: mid }, { c: lead, p: D }];
    out.push({ q: `Find the degree of ${pStr(scrambled)}.`, a: String(D), diff: 10 + scatterDiff(`degu:${D}_${mid}_${lead}_${k}`), key: `degu:${D}_${mid}_${lead}_${k}` });
  }
  for (const c of [2, 3, 5, 7, 9]) for (let p = 0; p <= 6; p++)
    if ((c + p) % 2 === 1) out.push({ q: `Find the degree of ${pMono(c, p)}.`, a: String(p), diff: 20 + scatterDiff(`degm:${c}_${p}`), key: `degm:${c}_${p}` });
  return out;
}
// Rewrite a scrambled polynomial in standard form (descending powers).
function enumStandardForm(): XP[] {
  const out: XP[] = [];
  // Three scrambles, not one ("constant first" for 72 items taught "move the
  // middle term to the front"); minus signs and cubics are the later bands.
  const perms = [
    (t: { c: number; p: number }[]) => [t[2], t[0], t[1]],
    (t: { c: number; p: number }[]) => [t[1], t[2], t[0]],
    (t: { c: number; p: number }[]) => [t[2], t[1], t[0]],
  ];
  for (let a = 1; a <= 3; a++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 5; c++) {
    const ordered = [{ c: a, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }];
    const scrambled = perms[(a + b + c) % 3](ordered);
    out.push({ q: `Write in standard form: ${pStr(scrambled)}.`, a: pStr(ordered), diff: scatterDiff(`sf:${a}_${b}_${c}`), key: `sf:${a}_${b}_${c}` });
    if ((a + b) % 2 === 1) {
      const neg = [{ c: a, p: 2 }, { c: -b, p: 1 }, { c: (c % 2 === 0 ? -1 : 1) * c, p: 0 }];
      out.push({ q: `Write in standard form: ${pStr(perms[(a + c) % 3](neg))}.`, a: pStr(neg), diff: 10 + scatterDiff(`sfn:${a}_${b}_${c}`), key: `sfn:${a}_${b}_${c}` });
    }
  }
  for (let a = 1; a <= 2; a++) for (let b = 1; b <= 3; b++) for (const c of [1, 2, 4]) for (const d of [3, 5, 7]) {
    if ((b + c + d) % 2 === 0) continue;
    const ordered = [{ c: a, p: 3 }, { c: b, p: 2 }, { c: -c, p: 1 }, { c: d, p: 0 }];
    const scrambled = (a + d) % 2 === 0
      ? [ordered[2], ordered[0], ordered[3], ordered[1]]
      : [ordered[1], ordered[3], ordered[0], ordered[2]];
    out.push({ q: `Write in standard form: ${pStr(scrambled)}.`, a: pStr(ordered), diff: 20 + scatterDiff(`sf3:${a}_${b}_${c}_${d}`), key: `sf3:${a}_${b}_${c}_${d}` });
  }
  return out;
}
// Leading coefficient — its OWN single-task unit (never mixed with "constant
// term" on the same sheet, per the one-instruction-per-sheet rule).
function enumLeadingCoef(): XP[] {
  const out: XP[] = [];
  // A negative leading term is its own band: the example's first case is a
  // positive one, and "−3x² + x + 7 → −3" opened the sheet with nine of them.
  for (let D = 2; D <= 4; D++) for (const lead of [2, 3, 5, -2, -3, 4]) for (const k of [1, -3, 7, -5]) {
    const s = pStr([{ c: lead, p: D }, { c: 1, p: 1 }, { c: k, p: 0 }]);
    out.push({ q: `What is the leading coefficient of ${s}?`, a: String(lead), diff: (lead < 0 ? 10 : 0) + scatterDiff(`lc:${D}_${lead}_${k}`), key: `lc:${D}_${lead}_${k}` });
  }
  return out;
}
// Constant term — its OWN single-task unit.
function enumConstantTerm(): XP[] {
  const out: XP[] = [];
  for (let D = 2; D <= 4; D++) for (const lead of [2, 3, 5, -2, -3, 4]) for (const k of [1, -3, 7, -5, 9, -8]) {
    const s = pStr([{ c: lead, p: D }, { c: 1, p: 1 }, { c: k, p: 0 }]);
    out.push({ q: `What is the constant term of ${s}?`, a: String(k), diff: scatterDiff(`ct:${D}_${lead}_${k}`), key: `ct:${D}_${lead}_${k}` });
  }
  return out;
}
// Evaluate a quadratic polynomial at a value of x. Every negative x sits above
// every positive x: |k| was ranking x = −1 as the EASIEST item, so the opening
// sheet led with (−1)² = +1 while the lesson had only shown a positive x.
function enumPolyEval(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let a = 1; a <= 3; a++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 5; c++) for (const k of [2, 3, -1, 4])
    out.push({ q: `Evaluate ${pStr([{ c: a, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }])} at x = ${k}.`, a: String(a * k * k + b * k + c), diff: (k < 0 ? 100 : 0) + Math.abs(k) + a + b + i++ * 0.01, key: `ev:${a}_${b}_${c}_${k}` });
  return out;
}
// Multiply a polynomial by more than two terms: monomial × trinomial and
// binomial × trinomial.
function enumPolyTrinomialMul(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let m = 2; m <= 5; m++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 5; c++)
    out.push({ q: `Expand ${m}x(${pStr([{ c: 1, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }])}).`, a: pStr([{ c: m, p: 3 }, { c: m * b, p: 2 }, { c: m * c, p: 1 }]), diff: m + b + c + i++ * 0.01, key: `mt:${m}_${b}_${c}` });
  for (let a = 1; a <= 3; a++) for (let b = 1; b <= 3; b++) for (let c = 1; c <= 4; c++)
    out.push({ q: `Expand (x + ${a})(${pStr([{ c: 1, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }])}).`, a: pStr([{ c: 1, p: 3 }, { c: a + b, p: 2 }, { c: a * b + c, p: 1 }, { c: a * c, p: 0 }]), diff: 12 + a + b + c + i++ * 0.01, key: `bt:${a}_${b}_${c}` });
  return out;
}
// Divide a polynomial by a monomial: (d·a x² + d·b x) ÷ d x = a x + b.
function enumPolyDivMono(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let d = 2; d <= 4; d++) for (let a = 1; a <= 5; a++) for (let b = 1; b <= 6; b++)
    out.push({ q: `Divide (${pStr([{ c: d * a, p: 2 }, { c: d * b, p: 1 }])}) ÷ ${d}x.`, a: pStr([{ c: a, p: 1 }, { c: b, p: 0 }]), diff: d + a + b + i++ * 0.01, key: `dm:${d}_${a}_${b}` });
  return out;
}
// Polynomial long division (exact): (x + a)(x + b) ÷ (x + a) = x + b.
function enumPolyDivLong(): XP[] {
  // Thirty items was exactly one sheet, so sheets 67–70 were the same page four
  // times. Banded: all-plus (the example) → a minus in the divisor or the
  // quotient — (x − a)(x + b) ÷ (x − a) and (x + a)(x − b) ÷ (x + a) — the
  // example's last step. Every division is exact (no remainder), as the
  // objective says.
  const out: XP[] = []; let i = 0;
  for (let a = 1; a <= 7; a++) for (let b = 1; b <= 9; b++) {
    out.push({ q: `Divide (${pStr([{ c: 1, p: 2 }, { c: a + b, p: 1 }, { c: a * b, p: 0 }])}) ÷ (x + ${a}).`, a: pStr([{ c: 1, p: 1 }, { c: b, p: 0 }]), diff: a + b + i++ * 0.02, key: `dl:${a}_${b}` });
    if (a === b) continue;
    if ((a + b) % 2 === 0) out.push({ q: `Divide (${pStr([{ c: 1, p: 2 }, { c: b - a, p: 1 }, { c: -a * b, p: 0 }])}) ÷ (x - ${a}).`, a: pStr([{ c: 1, p: 1 }, { c: b, p: 0 }]), diff: 40 + a + b + i++ * 0.02, key: `dlm:${a}_${b}` });
    else out.push({ q: `Divide (${pStr([{ c: 1, p: 2 }, { c: a - b, p: 1 }, { c: -a * b, p: 0 }])}) ÷ (x + ${a}).`, a: pStr([{ c: 1, p: 1 }, { c: -b, p: 0 }]), diff: 42 + a + b + i++ * 0.02, key: `dlq:${a}_${b}` });
  }
  return out;
}

// Interactive coordinate-plane intro for Linear Equations: plot an ordered pair.
// Reuses the "plot-point" graphing interaction (answerType "point"); graded by
// the canonical "x,y" value match. Integer grid (snap 1) for clean plotting.
// Banded by quadrant: both coordinates positive (the "right, then up" of the
// example) → one negative (left OR down) → both negative. Day one of M10 was
// opening in the third quadrant.
function enumPlotPoints(withIntercepts = true): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const x of [-4, -3, -2, -1, 1, 2, 3, 4]) for (const y of [-4, -3, -2, -1, 1, 2, 3, 4]) {
    const negs = (x < 0 ? 1 : 0) + (y < 0 ? 1 : 0);
    out.push({
      q: `Plot the point (${x}, ${y}) on the coordinate plane.`,
      a: `${x},${y}`, diff: negs * 3 + (Math.abs(x) + Math.abs(y)) * 0.1 + i++ * 0.001, key: `pp:${x}_${y}`, type: "short_answer",
      interactive: { kind: "plot-point", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  }
  if (!withIntercepts) return out;
  // Read a linear equation → plot its y-intercept (0, b). Only for the M11
  // intro unit, whose lesson explains the y-intercept; M10 never mentions lines.
  let j = 0;
  for (const m of [1, 2, -1, -2, 3]) for (const b of [-3, -2, -1, 1, 2, 3]) {
    const mTerm = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
    out.push({
      // Worded as the lesson words it ("where the line crosses the y-axis"): the
      // term "y-intercept" is first defined on the Graph-a-line lesson page.
      q: `Plot the point where the line y = ${mTerm} ${b < 0 ? `− ${-b}` : `+ ${b}`} crosses the y-axis.`,
      a: `0,${b}`, diff: 10 + j++ * 0.03, key: `li:${m}_${b}`, type: "short_answer",
      interactive: { kind: "plot-point", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  }
  return out;
}

// Interactive "graph a line": the student drags TWO points so the line through
// them matches y = mx + b. Graded by canonical slope+intercept ("m,b") computed
// from the snapped points — any two correct lattice points match.
// Positive slopes ("up m, right 1", the example's move) fill the low band so
// the opening sheet is all of them; negative slopes (down m, right 1) are the
// high band. Intercepts run −5..5 for slopes 1–2 so the positive band alone
// fills a 30-item sheet. Every line keeps two lattice points inside ±6.
function enumPlotLine(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const m of [1, 2, 3, -1, -2, -3]) {
    const bs = Math.abs(m) === 3 ? [-3, -2, -1, 0, 1, 2, 3] : [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    for (const b of bs) {
      const mTerm = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
      const bTerm = b === 0 ? "" : b < 0 ? ` − ${-b}` : ` + ${b}`;
      out.push({
        q: `Plot the line y = ${mTerm}${bTerm}.`,
        a: `${m},${b}`, diff: (m < 0 ? 20 : 0) + Math.abs(m) + Math.abs(b) * 0.1 + i++ * 0.001, key: `gl:${m}_${b}`, type: "short_answer",
        interactive: { kind: "plot-line", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
      });
    }
  }
  return out;
}

// EQUATION BUILDER: a line y = mx + b is shown; the student builds its equation
// by selecting slope & intercept. Graded by canonical "m,b" (value match).
function enumEquationBuilder(): XP[] {
  const out: XP[] = [];
  let i = 0;
  // (Every builder shares one prompt, and sheets dedupe by prompt text — so a
  // sheet carries at most one. It sits after the positive-slope lines, and the
  // lesson's last step shows how to read a line.)
  for (const m of [1, 2, -1, -2, 3]) for (const b of [-3, -2, -1, 0, 1, 2, 3])
    out.push({
      q: `What is the equation of the line shown? Build it with the slope and intercept.`,
      a: `${m},${b}`, diff: (m < 0 ? 30 : 10) + i++ * 0.04, key: `eqb:${m}_${b}`, type: "short_answer",
      interactive: { kind: "equation-builder", line: { m, b }, xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  return out;
}

// Drag-and-drop ORDERING: arrange integers from least to greatest. Options are
// the scrambled items; the answer is the correct order joined by commas. Served
// & graded through the standard options/value pipeline (by-id detects that the
// answer is a permutation of the options → ordering input).
// INTERACTIVE GEOMETRY: apply a transformation to a point and PLOT the image.
// Reflect across an axis, translate, or rotate 90° about the origin. Reuses the
// plot-point interaction; graded by the image coordinates "x,y".
function enumTransformPoint(): XP[] {
  const out: XP[] = []; let i = 0;
  const I = { kind: "plot-point" as const, xRange: [-6, 6] as [number, number], yRange: [-6, 6] as [number, number], snap: 1 };
  for (const [x, y] of [[3, 2], [-2, 3], [1, -4], [-3, -1], [2, 1], [-1, 2], [4, -2], [-2, -3]] as [number, number][]) {
    out.push({ q: `Reflect the point (${x}, ${y}) across the x-axis. Plot the image.`, a: `${x},${-y}`, diff: 1 + i++ * 0.04, key: `trx:${x}_${y}`, type: "short_answer", interactive: I });
    out.push({ q: `Reflect the point (${x}, ${y}) across the y-axis. Plot the image.`, a: `${-x},${y}`, diff: 1 + i++ * 0.04, key: `try:${x}_${y}`, type: "short_answer", interactive: I });
    out.push({ q: `Translate the point (${x}, ${y}) by (2, −1). Plot the image.`, a: `${x + 2},${y - 1}`, diff: 1.4 + i++ * 0.04, key: `trt:${x}_${y}`, type: "short_answer", interactive: I });
    out.push({ q: `Rotate the point (${x}, ${y}) 90° counterclockwise about the origin. Plot the image.`, a: `${-y},${x}`, diff: 2 + i++ * 0.04, key: `trr:${x}_${y}`, type: "short_answer", interactive: I });
  }
  return out;
}

// DRAGGABLE-FIGURE GEOMETRY: drag a triangle's three vertices to plot a given
// figure, or its image after a reflection. Answer = the vertices sorted + joined
// by ";" (vertex order doesn't matter). Reuses the triangle-drag interaction.
function enumTriangle(): XP[] {
  const out: XP[] = []; let i = 0;
  const I = { kind: "triangle-drag" as const, xRange: [-7, 7] as [number, number], yRange: [-7, 7] as [number, number], snap: 1 };
  const canon = (v: [number, number][]) => v.map(([x, y]) => `${x},${y}`).sort().join(";");
  const show = (v: [number, number][]) => v.map(([x, y]) => `(${x}, ${y})`).join(", ");
  const tris: [number, number][][] = [
    [[1, 1], [4, 1], [1, 5]], [[-2, 1], [2, 1], [0, 4]], [[0, 0], [3, 0], [3, 4]],
    [[-3, -1], [1, -1], [-1, 3]], [[2, 2], [5, 2], [2, 6]], [[-1, -2], [3, -2], [1, 2]],
  ];
  for (const t of tris) {
    out.push({ q: `Plot a triangle with vertices ${show(t)}.`, a: canon(t), diff: 2 + i++ * 0.05, key: `tri:${t.flat().join("_")}`, type: "short_answer", interactive: I });
    const img = t.map(([x, y]) => [x, -y]) as [number, number][];
    out.push({ q: `Triangle ${show(t)} is reflected across the x-axis. Plot the image triangle.`, a: canon(img), diff: 3 + i++ * 0.05, key: `trif:${t.flat().join("_")}`, type: "short_answer", interactive: I });
  }
  return out;
}

// Served as a DRAG-TO-ORDER input: the options are the four integers to arrange
// and the answer is their correct order joined by commas. The serving layer
// (worksheet/by-id) detects "answer is a permutation of all options" and renders
// OrderingInput — it is not a radio-button multiple choice, even though the
// stored type says so. A test pins that invariant for every item here.
//
// Banded by how many negatives a set holds: this is the child's first meeting
// with negative numbers (nothing in M1–M9 has one), so day one is sets with ONE
// negative (it simply goes first), then two (which of −7 and −9 is smaller — the
// worked example's case), then three.
function enumOrderIntegers(): XP[] {
  const sets: number[][] = [];
  const seen = new Set<string>();
  const push = (s: number[]) => {
    const uniq = [...new Set(s)];
    if (uniq.length < 4 || uniq.some((n) => n < -9 || n > 9)) return;
    const key = [...uniq].sort((x, y) => x - y).join("_");
    if (seen.has(key)) return;
    seen.add(key);
    sets.push(uniq);
  };
  const posTriples = [[1, 4, 7], [2, 5, 8], [3, 6, 9], [0, 3, 8], [2, 4, 9], [1, 5, 6], [0, 2, 7]];
  for (let n = -9; n <= -1; n++) for (const t of posTriples) push([n, ...t]);                       // one negative
  for (let n = -9; n <= -2; n++) for (const d of [1, 2, 4]) for (const [p, q] of [[2, 7], [1, 5], [4, 9], [0, 6], [3, 8]])
    push([n, n + d, p, q]);                                                                            // two negatives
  for (let n = -9; n <= -4; n++) for (const [d1, d2] of [[1, 3], [2, 5], [1, 4]]) for (const p of [2, 5, 8])
    push([n, n + d1, n + d2, p]);                                                                      // three negatives
  const out: XP[] = [];
  let i = 0;
  for (const s of sets) {
    const correct = [...s].sort((a, b) => a - b);
    const negs = s.filter((n) => n < 0).length;
    const spread = correct[3] - correct[0];
    // deterministic scramble so the shown order differs from the answer
    let shown = [...s].sort((a, b) => (((a * 31 + i * 7) % 11) - ((b * 31 + i * 7) % 11)) || a - b);
    if (shown.join(",") === correct.join(",")) shown = [...correct].reverse();
    out.push({
      q: `Order these from least to greatest:  ${shown.join(",  ")}`,
      a: correct.join(","), diff: negs * 10 + spread * 0.1 + i * 0.001, key: `ordint:${s.join("_")}`,
      type: "multiple_choice", options: shown.map(String),
    });
    i++;
  }
  return out;
}

// ── Curricula ─────────────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => XP[]; example: WorkedExample;
  // Shown ONCE at the top of the sheet so the instruction isn't repeated per problem.
  directive?: string;
  // The one-sentence rule the micro-lesson states (its "big idea"). Without it
  // the lesson repeats the objective, and the child gets the method only from
  // the worked example.
  idea?: string;
  // Opening difficulty window as a fraction of the pool (default 0.6). The
  // window widens to 0.6 by the unit's last sheet. Set it low where the pool's
  // low band is exactly what the lesson taught and the rest must wait — e.g.
  // Convert (eighths), Plot points (negative coordinates), Graph a line
  // (negative slopes), Order integers (two or three negatives).
  open?: number;
}

// ── M10 Pre-Algebra: three small generators for the 4-phase split ──
// Distributive expansion a(x ± b) → ax ± ab (Properties & Simplifying phase).
function enumExpand(): XP[] {
  const out: XP[] = [];
  for (let a = 2; a <= 9; a++) for (let b = 1; b <= 12; b++) {
    out.push({ q: `Expand ${a}(x + ${b}).`, a: `${a}x + ${a * b}`, diff: a + b + 8, key: `exp:${a}_${b}` });
    if (b <= a + 3) out.push({ q: `Expand ${a}(x - ${b}).`, a: `${a}x - ${a * b}`, diff: a + b + 9, key: `exps:${a}_${b}` });
  }
  return out;
}
// One-step inequalities x ± b (rel) c (Equations phase). Answers stay positive.
// All four sign/operation pairings. "+" only ever came with "<" and "−" only
// with ">", so the sign was copied from the operation without a thought. The
// opening band still leads with the example's two cases; the other two arrive
// from the second sheet. (No ≤/≥: a child cannot type them on screen, and the
// same pool serves the daily practice.)
function enumInequality(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 12; b++) for (let r = 1; r <= 12; r++) {
    out.push({ q: `Solve for x:  x + ${b} < ${b + r}`, a: `x < ${r}`, diff: b + r + 14, key: `iqa:${b}_${r}` });
    out.push({ q: `Solve for x:  x - ${b} > ${r}`, a: `x > ${b + r}`, diff: b + r + 15, key: `iqb:${b}_${r}` });
    out.push({ q: `Solve for x:  x + ${b} > ${b + r}`, a: `x > ${r}`, diff: b + r + 34, key: `iqc:${b}_${r}` });
    out.push({ q: `Solve for x:  x - ${b} < ${r}`, a: `x < ${b + r}`, diff: b + r + 35, key: `iqd:${b}_${r}` });
  }
  return out;
}
// Number patterns → intro to slope as a constant step (Coordinate-Plane phase).
function enumPattern(): XP[] {
  const out: XP[] = [];
  for (let start = 1; start <= 10; start++) for (let step = 2; step <= 9; step++) {
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    out.push({ q: `Find the next number:  ${seq.join(", ")}, ___`, a: String(start + 4 * step), diff: start + step + 4, key: `pat:${start}_${step}` });
    out.push({ q: `Each step grows by the same amount (the "slope"). What is the step for:  ${seq.join(", ")}?`, a: String(step), diff: start + step + 6, key: `pats:${start}_${step}` });
  }
  // Decreasing patterns (a negative step — integers were lesson 9) and "the
  // 10th number" (start + 9 steps) are the later bands: eight sheets of
  // next-number spotting had nothing new after the first.
  for (let start = 20; start <= 40; start += 2) for (let step = 2; step <= 7; step++) {
    const seq = [start, start - step, start - 2 * step, start - 3 * step];
    out.push({ q: `Find the next number:  ${seq.join(", ")}, ___`, a: String(start - 4 * step), diff: 40 + step + start * 0.2, key: `patd:${start}_${step}` });
    if (start % 4 === 0) out.push({ q: `Each step changes by the same amount (the "slope"). What is the step for:  ${seq.join(", ")}?`, a: String(-step), diff: 44 + step + start * 0.2, key: `patds:${start}_${step}` });
  }
  for (let start = 1; start <= 9; start++) for (let step = 2; step <= 9; step++) {
    if ((start + step) % 2 === 1) continue;
    const seq = [start, start + step, start + 2 * step, start + 3 * step];
    out.push({ q: `What is the 10th number in the pattern:  ${seq.join(", ")}, …?`, a: String(start + 9 * step), diff: 70 + start + step, key: `pat10:${start}_${step}` });
  }
  return out;
}

const CURRICULA: Record<string, Unit[]> = {
  DECIMALS: [
    { id:"dec-add1", label:"Decimals — add (tenths)", objective:"Student adds decimals to one place", idea:"Tenths add like whole numbers as long as the decimal points are lined up.", directive:"Add.", grade:"Grade 4", stars:2, range:[1,10], pool:()=>enumDecAdd(1), example:{ problem:"0.4 + 0.3", steps:["Line up the decimal points","4 tenths + 3 tenths = 7 tenths"], answer:"0.7" } },
    { id:"dec-add2", label:"Decimals — add (hundredths)", objective:"Student adds decimals to two places", idea:"Line up the decimal points and add the hundredths like whole numbers; a trailing zero can be dropped (0.30 = 0.3).", directive:"Add.", grade:"Grade 5", stars:2, range:[11,20], pool:()=>enumDecAdd(2), example:{ problem:"0.25 + 0.36", steps:["Line up decimal points","25 + 36 = 61 hundredths","If the sum ends in 0, the zero can be dropped: 0.03 + 0.27 = 0.30 = 0.3"], answer:"0.61" } },
    { id:"dec-sub1", label:"Decimals — subtract (tenths)", objective:"Student subtracts decimals to one place", idea:"Line up the decimal points and subtract the tenths like whole numbers.", directive:"Subtract.", grade:"Grade 4-5", stars:3, range:[21,30], pool:()=>enumDecSub(1), example:{ problem:"0.8 - 0.3", steps:["8 tenths - 3 tenths = 5 tenths"], answer:"0.5" } },
    { id:"dec-sub2", label:"Decimals — subtract (hundredths)", objective:"Student subtracts decimals to two places", idea:"Line up the decimal points and subtract the hundredths like whole numbers; a trailing zero can be dropped (0.10 = 0.1).", directive:"Subtract.", grade:"Grade 5", stars:3, range:[31,40], pool:()=>enumDecSub(2), example:{ problem:"0.72 - 0.45", steps:["72 - 45 = 27 hundredths","If the answer ends in 0, the zero can be dropped: 0.18 - 0.08 = 0.10 = 0.1"], answer:"0.27" } },
    { id:"dec-mulw", label:"Decimals — multiply by a whole number", objective:"Student multiplies a decimal by a whole number", idea:"Multiply as if there were no decimal point, then put one decimal place back.", directive:"Multiply.", grade:"Grade 5", stars:4, range:[41,52], pool:()=>enumDecMulWhole(), example:{ problem:"2.8 × 3", steps:["Ignore the point: 28 × 3 = 84","One decimal place in 2.8 → one place in the answer: 8.4","If it ends in 0, drop the zero: 1.5 × 4 = 60 → 6.0 = 6"], answer:"8.4" } },
    { id:"dec-muld", label:"Decimals — multiply two decimals", objective:"Student multiplies two decimals", idea:"Multiply the digits, then count the decimal places in BOTH numbers — that many places in the answer.", directive:"Multiply.", grade:"Grade 6", stars:5, range:[53,62], pool:()=>enumDecMulDec(), example:{ problem:"0.3 × 0.4", steps:["3 × 4 = 12","One place + one place = two decimal places → 0.12","If it ends in 0, drop the zero: 0.5 × 0.2 = 0.10 = 0.1"], answer:"0.12" } },
    { id:"dec-divw", label:"Decimals — divide by a whole number", objective:"Student divides a decimal by a whole number", idea:"Divide the digits, then put the decimal place back.", directive:"Divide.", grade:"Grade 6", stars:4, range:[63,72], pool:()=>enumDecDivWhole(), example:{ problem:"1.2 ÷ 3", steps:["12 ÷ 3 = 4","One decimal place → 0.4"], answer:"0.4" } },
    { id:"dec-pct", label:"Percentages of a number", objective:"Student finds a percentage of a number", idea:"Find 10% by dividing by 10, then build the percent you need from it (or use a fraction: 25% = 1/4, 50% = 1/2).", directive:"Find the percent of each number.", grade:"Grade 6", stars:4, range:[73,84], pool:()=>enumPercentOf(), example:{ problem:"40% of 35", steps:["10% of 35 = 35 ÷ 10 = 3.5","40% is 4 tens: 4 × 3.5 = 14","5% is HALF of 10%: 5% of 40 = 4 ÷ 2 = 2.  Build the odd ones from both: 35% of 40 = 3 × 4 + 2 = 14","Shortcut fractions: 25% = 1/4, 50% = 1/2, 75% = 3/4 — so 25% of 40 = 40 ÷ 4 = 10"], answer:"14" } },
    { id:"dec-convert", label:"Convert fractions, decimals, percents", objective:"Student converts between fractions, decimals and percents", idea:"A fraction, a decimal and a percent are three names for one number: divide to get the decimal, move the point two places for the percent, read the place value for the fraction.", directive:"Convert each. Write fractions in simplest form (0.6 = 6/10 = 3/5).", grade:"Grade 6", stars:5, range:[85,94], pool:()=>enumConvert(), example:{ problem:`Write ${F(3,4)} as a decimal.`, steps:["Fraction → decimal: divide top by bottom. 3 ÷ 4 = 0.75 (write 3 as 3.00 and divide: 30 ÷ 4 = 7 remainder 2, 20 ÷ 4 = 5)","Decimal → percent: move the decimal point 2 places RIGHT. 0.75 → 75%.  Percent → decimal goes 2 places LEFT: 75% → 0.75, 5% → 0.05","Decimal → fraction: read the place value, then SIMPLIFY — divide top and bottom by the same number until nothing divides both. 0.75 = 75/100 → divide both by 25 → 3/4.  0.6 = 6/10 → divide both by 2 → 3/5","Fraction → percent: decimal first, then percent. 3/4 = 0.75 = 75%","Write a fraction answer as top/bottom in simplest form, e.g. 3/4 (not 75/100)"], answer:"0.75" }, open:0.25 },
    { id:"dec-review", label:"Decimals — mixed review", objective:"Student works fluently across all decimal operations", idea:"Every decimal operation comes back to the same rule: work with the digits, then place the decimal point.", directive:"Solve.", grade:"Grade 6", stars:5, range:[95,100], pool:()=>reviewPool([()=>enumDecAdd(1),()=>enumDecAdd(2),()=>enumDecSub(1),()=>enumDecSub(2),enumDecMulWhole,enumDecMulDec,enumDecDivWhole,enumPercentOf,enumConvert]), example:{ problem:"0.5 × 0.6", steps:["5 × 6 = 30","Two places → 0.30 = 0.3","This sheet mixes every lesson of the level: adding and subtracting (line up the points), multiplying (count the places), dividing by a whole number (divide the digits, put the place back), percent of a number (10% first) and converting (divide for the decimal, move the point two places for the percent)"], answer:"0.3" } },
  ],

  RATIOS: [
    { id:"rat-simplify", label:"Ratios — simplify", objective:"Student writes a ratio in simplest form", idea:"Divide both parts of a ratio by the same number and it still means the same thing.", directive:"Write each ratio in simplest form, as a ratio (e.g. 2 : 3).", grade:"Grade 6", stars:2, range:[1,16], pool:()=>enumRatioSimplify(), example:{ problem:"6 : 9", steps:["Find the biggest number that divides evenly into BOTH parts (the GCF): 3 goes into 6 and into 9","Divide both parts by it: 6 ÷ 3 = 2 and 9 ÷ 3 = 3","Write the answer as a ratio: 2 : 3.  Check: nothing but 1 divides both 2 and 3, so it is in simplest form"], answer:"2 : 3" } },
    { id:"rat-equiv", label:"Ratios — equivalent ratios", objective:"Student finds an equivalent ratio", idea:"Find what the first part was multiplied by, then multiply the second part by the same number.", directive:"Find the missing term.", grade:"Grade 6", stars:3, range:[17,36], pool:()=>enumRatioEquiv(), example:{ problem:"2 : 3 = 8 : ___", steps:["An equivalent ratio is the same ratio scaled up: multiply BOTH parts by one number. 2 : 3 scaled by 4 is 8 : 12","Here the first part is already scaled — find the scale: 8 ÷ 2 = 4","Scale the second part by the same number: 3 × 4 = 12","Three parts work the same way: 1 : 2 : 5 = 3 : ___ : 15 — the scale is 3 (1 → 3, and 5 → 15 agrees), so the middle is 2 × 3 = 6","If the blank is on the LEFT, scale from the pair you can see: ___ : 12 = 2 : 3 — the 3 became 12 (× 4), so the blank is 2 × 4 = 8"], answer:"12" } },
    { id:"rat-proportion", label:"Ratios — solve a proportion", objective:"Student solves for the missing term in a proportion", idea:"Find the scale from the pair you can see, then apply it to the pair with the blank.", directive:"Find the missing term.", grade:"Grade 6-7", stars:4, range:[37,60], pool:()=>enumProportion(), example:{ problem:"2 : 5 = ___ : 15", steps:["The pair you can see is 5 → 15. Find the scale: 15 ÷ 5 = 3","Apply the same scale to the other part: 2 × 3 = 6","Written as fractions it is the same question: 2/5 = ___/15 → the blank is 6","If the visible scale is NOT a whole number — 4 : 6 = ___ : 9 — simplify first: 4 : 6 = 2 : 3, and 3 → 9 is × 3, so the blank is 2 × 3 = 6.  (Or cross-multiply: 4 × 9 ÷ 6 = 6)"], answer:"6" } },
    { id:"rat-scale", label:"Ratios — scale up", objective:"Student scales a ratio by a factor", idea:"Multiply BOTH parts by the factor — the ratio stays the same size relative to itself.", directive:"Scale each ratio by the given factor. Write the answer as a ratio (e.g. 8 : 12).", grade:"Grade 7", stars:4, range:[61,82], pool:()=>enumScale(), example:{ problem:"Scale 2 : 3 by 4", steps:["Scale means multiply BOTH parts by the factor","First part: 2 × 4 = 8","Second part: 3 × 4 = 12, so 2 : 3 scaled by 4 is 8 : 12","Three parts: scale 1 : 2 : 5 by 3 → 3 : 6 : 15 (every part × 3)","If you are told what one part must BECOME, find the factor first: scale 3 : 4 so the first part is 15 → 15 ÷ 3 = 5, so × 5 → 15 : 20"], answer:"8 : 12" } },
    { id:"rat-review", label:"Ratios — mixed review", objective:"Student works fluently across ratio tasks", idea:"Whatever you do to one part of a ratio, do to the other.", directive:"Solve each ratio problem. Write ratios as 2 : 3.", grade:"Grade 7", stars:5, range:[83,100], pool:()=>reviewPool([enumRatioSimplify,enumRatioEquiv,enumProportion,enumScale]), example:{ problem:"4 : 5 = 12 : ___", steps:["The first part is already scaled: find the scale, 12 ÷ 4 = 3","Apply it to the second part: 5 × 3 = 15","Simplify (6 : 9): divide both parts by the biggest number that divides both → 2 : 3.  Scale up (scale 3 : 4 by 2): multiply both parts → 6 : 8","A blank in the FIRST ratio (___ : 12 = 2 : 3, or 2 : 5 = ___ : 15): find the scale from the pair you can see, then apply it to the other part"], answer:"15" } },
  ],

  PRE_ALGEBRA: [
    // ── Phase 1 · Expressions & Variables (sheets 1–25) ──
    { id:"pa-order-int", label:"Expressions · Order integers", objective:"Student orders integers from least to greatest on the number line", idea:"On the number line, numbers get bigger to the right; every negative sits left of 0, and the negative with the bigger digit is further left, so it is smaller (−9 < −7).", directive:"Order from least to greatest.", grade:"Grade 6", stars:2, range:[1,4], pool:()=>enumOrderIntegers(), example:{ problem:"Order from least to greatest:  2,  -3,  -1", steps:["Number line:  -4  -3  -2  -1  0  1  2  3  4 — numbers get BIGGER as you go right","Negatives are left of 0, so they come before the positives. -3 is further left than -1, so -3 is the smaller one (a bigger digit after the minus sign means a smaller number)","Least to greatest: -3, then -1, then 2. On the sheet, drag the cards (or use the arrows) into that order"], answer:"-3,-1,2" }, open:0.3 },
    { id:"pa-eval-add", label:"Expressions · Evaluate (+/−)", objective:"Student evaluates an expression by substituting a value for x", idea:"A letter stands for a number: replace x with its value and work it out.", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[5,15], pool:()=>[...enumEvaluate("+"),...enumEvaluate("-")], example:{ problem:"x + 5,  x = 3", steps:["Replace x with 3","3 + 5 = 8","The letter can be the number taken away: 10 − x when x = 4 → 10 − 4 = 6","Two letters: replace each with its own number. x + y when x = 3, y = 5 → 3 + 5 = 8;  x − y when x = 9, y = 2 → 9 − 2 = 7"], answer:"8" } },
    { id:"pa-eval-mul", label:"Expressions · Evaluate (×)", objective:"Student evaluates a product expression", idea:"A number written next to x means multiply: 3x is 3 × x.", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[16,25], pool:()=>enumEvaluateMul(), example:{ problem:"3x,  x = 4", steps:["3x means 3 × x","3 × 4 = 12","With a number added or taken away, multiply FIRST: 3x + 2 when x = 4 → 3 × 4 = 12, then 12 + 2 = 14;  3x − 2 → 12 − 2 = 10"], answer:"12" } },
    // ── Phase 2 · Properties & Simplifying (sheets 26–50) ──
    { id:"pa-combine", label:"Simplify · Combine like terms", objective:"Student combines like terms by adding coefficients", idea:"Terms with the same letter can be added by adding the numbers in front; a bare x means 1x.", directive:"Combine like terms.", grade:"Grade 6-7", stars:3, range:[26,37], pool:()=>enumCombine(), example:{ problem:"2x + 3x", steps:["Add the coefficients (the numbers in front of x): 2 + 3 = 5, so 5x","A bare x means 1x: x + 4x = 1x + 4x = 5x","Subtracting works the same way: 7x − 3x = 4x (7 − 3 = 4, keep the x)","Only LIKE terms combine — x's with x's, plain numbers with plain numbers: 3x + 4 + 2x + 1 = 5x + 5.  With two letters, x's together and y's together: 2x + 3y + 4x + y = 6x + 4y"], answer:"5x" } },
    { id:"pa-expand", label:"Simplify · Distributive property", objective:"Student expands using the distributive property", idea:"The number outside the bracket multiplies EVERY term inside, and the sign inside stays with its number.", directive:"Expand each expression.", grade:"Grade 7", stars:3, range:[38,44], pool:()=>enumExpand(), example:{ problem:"3(x + 4)", steps:["The 3 multiplies EACH term inside the bracket. First: 3 × x = 3x","Then: 3 × 4 = 12, so 3x + 12","With a minus inside, the minus stays with its number: 2(x − 5) = 2x − 10 (2 × 5 = 10, keep the minus)"], answer:"3x + 12" } },
    { id:"pa-order-ops", label:"Simplify · Order of operations", objective:"Student applies the order of operations", idea:"Brackets first, then multiply or divide, then add or subtract — wherever the × or ÷ sits.", directive:"Solve using order of operations.", grade:"Grade 7", stars:4, range:[45,50], pool:()=>enumOrderOps(), example:{ problem:"3 + 4 × 2", steps:["Multiply first: 4 × 2 = 8","3 + 8 = 11","The × can come first and it still goes first: 4 × 2 + 3 = 8 + 3 = 11.  With a minus: 20 − 4 × 2 = 20 − 8 = 12 (not 16 × 2)","Brackets beat everything: (3 + 4) × 2 = 7 × 2 = 14.  Dividing is like multiplying — do it before adding: 3 + 8 ÷ 2 = 3 + 4 = 7"], answer:"11" } },
    // ── Phase 3 · Equations (sheets 51–80) ──
    { id:"pa-onestep-add", label:"Equations · One-step (+/−)", objective:"Student solves one-step add/subtract equations", idea:"Undo what was done to x by doing the opposite to BOTH sides: undo + with −, undo − with +.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 7", stars:3, range:[51,62], pool:()=>[...enumOneStep("+"),...enumOneStep("-")], example:{ problem:"x + 5 = 12", steps:["Subtract 5 on BOTH sides — that eliminates the +5","x = 12 − 5 = 7.  Check: 7 + 5 = 12 ✓","If x has something SUBTRACTED, add it to both sides: x − 3 = 2 → x = 2 + 3 = 5.  Check: 5 − 3 = 2 ✓"], answer:"7" } },
    { id:"pa-onestep-mul", label:"Equations · One-step (×)", objective:"Student solves one-step multiplication equations", idea:"Undo a multiplication by dividing BOTH sides by that number.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 7", stars:4, range:[63,70], pool:()=>enumOneStep("×"), example:{ problem:"3x = 21", steps:["x is multiplied by 3 — divide BOTH sides by 3 to undo it","x = 21 ÷ 3 = 7","Check: 3 × 7 = 21 ✓"], answer:"7" } },
    { id:"pa-integers", label:"Equations · Integer add & subtract", objective:"Student adds and subtracts integers", idea:"On the number line, adding moves you RIGHT and subtracting moves you LEFT — start where the first number is.", directive:"Add or subtract.", grade:"Grade 7", stars:4, range:[71,76], pool:()=>[...enumInteger("+"),...enumInteger("-")], example:{ problem:"(-5) + 8", steps:["On the number line, adding moves RIGHT and subtracting moves LEFT","(-5) + 8: start at -5, move 8 to the right: -4, -3, -2, -1, 0, 1, 2, 3 → 3","2 − 5: start at 2, move 5 to the left: 1, 0, -1, -2, -3 → -3 (going past 0 makes it negative)","(-3) − 5: start at -3, move 5 to the left: -4, -5, -6, -7, -8 → -8"], answer:"3" } },
    { id:"pa-inequal", label:"Equations · One-step inequalities", objective:"Student solves one-step inequalities", idea:"Solve it like an equation — do the same to both sides — and copy the < or > sign through to the answer.", directive:"Solve for x. Write the whole inequality as the answer (e.g. x < 5, not 5).", grade:"Grade 7-8", stars:5, range:[77,80], pool:()=>enumInequality(), example:{ problem:"x + 3 < 8", steps:["Subtract 3 from BOTH sides, keeping the < sign: x < 8 − 3","x < 5 — write the answer as an inequality, x < 5","With a minus, add to both sides — and the sign stays whatever it was: x − 2 > 6 → x > 6 + 2 → x > 8","The sign does NOT depend on the operation: x + 3 > 8 → x > 5, and x − 2 < 6 → x < 8. Copy the sign you were given"], answer:"x < 5" } },
    // ── Phase 4 · Coordinate Plane (sheets 81–100) ──
    { id:"pa-plot", label:"Coordinate Plane · Plot points", objective:"Student plots ordered pairs on the coordinate plane", idea:"(x, y) means go across first, then up or down: positive x is right, negative x is left, positive y is up, negative y is down.", directive:"Plot each point.", grade:"Grade 7", stars:3, range:[81,92], pool:()=>enumPlotPoints(false), example:{ problem:"Plot the point (3, 2), then the point (-2, 3).", steps:["(3, 2): the first number is x — from the origin (0, 0) move RIGHT 3 along the x-axis","The second number is y — then move UP 2 along the y-axis. Mark that grid point","(-2, 3): a negative x means LEFT — move left 2, then up 3","A negative y means DOWN: (1, -3) is right 1, then down 3"], answer:"3,2" }, open:0.25 },
    { id:"pa-pattern", label:"Coordinate Plane · Patterns & intro to slope", objective:"Student extends number patterns, identifying the constant step (slope)", idea:"When a pattern grows by the same amount each time, that amount is its step — later called the slope of its graph.", directive:"Find the pattern.", grade:"Grade 7-8", stars:4, range:[93,100], pool:()=>enumPattern(), example:{ problem:"Find the next number:  2, 5, 8, 11, ___", steps:["Find the step: 5 − 2 = 3, 8 − 5 = 3 — each step adds 3","11 + 3 = 14","When asked for the STEP itself, answer the amount added each time: for 1, 3, 5, 7 the step is 2","A pattern can go DOWN: 20, 17, 14, 11 takes away 3 each time — the next number is 8 and the step is −3 (a negative step)","For the 10th number, count the steps: the 10th number is the start plus 9 steps. For 2, 5, 8, 11, … it is 2 + 9 × 3 = 29","Plotted as points (1, 2), (2, 5), (3, 8) the pattern climbs 3 for every 1 across — that steady climb is the slope"], answer:"14" } },
  ],

  LINEAR_EQUATIONS: [
    { id:"le-plot", label:"Plot points on the coordinate plane", objective:"Student plots an ordered pair (x, y) on a coordinate plane", idea:"(x, y) is across then up: negative x goes left, negative y goes down — and a line's y-intercept is the point (0, b) where it crosses the y-axis.", directive:"Plot each point.", grade:"Grade 6", stars:1, range:[1,4], pool:()=>enumPlotPoints(), example:{ problem:"Plot the point (3, 2). Then find where the line y = x − 2 crosses the y-axis.", steps:["(3, 2): from the origin, move RIGHT 3 along the x-axis, then UP 2 along the y-axis","Negative x means LEFT and negative y means DOWN: (-2, -3) is left 2, down 3","A line crosses the y-axis where x = 0. In y = x − 2, put x = 0: y = 0 − 2 = -2","So the line crosses the y-axis at the point (0, -2): stay on the y-axis and go down 2. The number after the x-term always tells you this crossing point"], answer:"3,2" } },
    { id:"le-graphline", label:"Graph a line", objective:"Student graphs a line y = mx + b by plotting two points on it", idea:"In y = mx + b, start at the y-intercept (0, b) and use the slope m as a move: up m and right 1 — or DOWN m and right 1 when m is negative.", directive:"Plot the line.", grade:"Grade 8", stars:3, range:[5,8], pool:()=>[...enumPlotLine(), ...enumEquationBuilder()], example:{ problem:"Plot the line y = 2x − 1.", steps:["The number on its own is the y-intercept: −1 → first point (0, −1)","The number in front of x is the slope: 2 → from (0, −1) go UP 2 and RIGHT 1 → second point (1, 1). Place both points and the line is drawn through them","y = x means 1x + 0: slope 1, intercept 0 → points (0, 0) and (1, 1)","A NEGATIVE slope goes DOWN: y = −x + 2 → start (0, 2), slope −1 → down 1, right 1 → (1, 1)","Reading a line that is already drawn: where it crosses the y-axis is b; from there count how far up (or down) it goes for 1 step right — that is m"], answer:"2,-1" }, open:0.5 },
    { id:"le-transform", label:"Transformations on the plane", objective:"Student reflects, translates and rotates points on the coordinate plane", idea:"Each transformation is a rule on the coordinates: reflecting flips one sign, translating adds, rotating 90° swaps them with one sign flipped.", directive:"Plot the image after the transformation.", grade:"Grade 8", stars:3, range:[9,12], pool:()=>[...enumTransformPoint(), ...enumTriangle()], example:{ problem:"Reflect the point (3, 2) across the x-axis. Plot the image.", steps:["Across the x-axis: flip the sign of y → (3, 2) becomes (3, −2)","Across the y-axis: flip the sign of x → (3, 2) becomes (−3, 2)","Translate by (a, b): add a to x and b to y → (3, 2) by (2, −1) is (5, 1)","Rotate 90° counterclockwise about the origin: (x, y) → (−y, x), so (3, 2) becomes (−2, 3)"], answer:"3,-2" } },
    { id:"le-two-add", label:"Two-step equations (+)", objective:"Student solves ax + b = c", idea:"Undo the adding first, then undo the multiplying — always to BOTH sides.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 7", stars:3, range:[13,24], pool:()=>enumTwoStep(1), example:{ problem:"2x + 3 = 11", steps:["Subtract 3 on BOTH sides — that eliminates the +3: 2x = 11 − 3 = 8","Divide BOTH sides by 2 to isolate x: x = 8 ÷ 2 = 4","Check: 2×4 + 3 = 11 ✓","One-step first, if it is new: x + 3 = 11 has no number on x, so one move is enough — subtract 3 from both sides: x = 11 − 3 = 8"], answer:"4" } },
    { id:"le-two-sub", label:"Two-step equations (-)", objective:"Student solves ax - b = c", idea:"Undo the subtracting by adding to both sides, then divide by the number on x.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 7-8", stars:4, range:[25,38], pool:()=>enumTwoStep(-1), example:{ problem:"3x - 5 = 16", steps:["Add 5 on BOTH sides — that eliminates the −5: 3x = 16 + 5 = 21","Divide BOTH sides by 3 to isolate x: x = 21 ÷ 3 = 7","Check: 3×7 − 5 = 16 ✓"], answer:"7" } },
    { id:"le-distribute", label:"Equations with distribution", objective:"Student solves k(x + b) = c", idea:"A bracket multiplied by a number: divide both sides by that number first (or expand the bracket), then solve the equation that is left.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 8", stars:4, range:[39,54], pool:()=>enumDistribute(), example:{ problem:"2(x + 3) = 14", steps:["The bracket is multiplied by 2 — divide BOTH sides by 2: x + 3 = 7","Subtract 3 on BOTH sides: x = 7 − 3 = 4","Check: 2(4 + 3) = 14 ✓","The other way is to EXPAND the bracket first (distributive property): 2(x + 3) = 2x + 6, so 2x + 6 = 14 → 2x = 8 → x = 4. Both ways give 4","A minus inside: 3(x − 2) = 12 → divide by 3: x − 2 = 4 → ADD 2 to both sides: x = 6.  A number after the bracket: 2(x + 3) + 4 = 18 → subtract the 4 first: 2(x + 3) = 14, then carry on as above"], answer:"4" } },
    { id:"le-both-sides", label:"Variables on both sides", objective:"Student solves equations with variables on both sides", idea:"Gather the x-terms on one side by subtracting the smaller one from both sides, then finish it like a two-step equation.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 8", stars:5, range:[55,72], pool:()=>enumBothSides(), example:{ problem:"4x + 2 = 2x + 6", steps:["x is on both sides. Subtract the smaller x-term (2x) from BOTH sides so x is on one side only: 2x + 2 = 6","Now it is a two-step equation. Subtract 2 from BOTH sides: 2x = 4","Divide BOTH sides by 2: x = 2.  Check: 4×2 + 2 = 10 and 2×2 + 6 = 10 ✓","With no number on the left, only the first move is needed: 3x = x + 8 → subtract x → 2x = 8 → x = 4"], answer:"2" } },
    { id:"le-fraction", label:"Equations with a fraction", objective:"Student solves x/d = q", idea:"Undo a division by multiplying BOTH sides by the divisor.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 8", stars:4, range:[73,86], pool:()=>enumDivEq(), example:{ problem:`${BS}frac{x}{3} = 4`, steps:["x over 3 means x ÷ 3: x is divided by 3 — multiply BOTH sides by 3 to undo it","x = 4 × 3 = 12","Check: 12 ÷ 3 = 4 ✓","With a number added: x/3 + 2 = 6 → subtract 2 from both sides first: x/3 = 4 → x = 12","When the WHOLE top is divided — (x + 2)/3 = 4 — multiply first: x + 2 = 12 → then subtract 2: x = 10"], answer:"12" } },
    { id:"le-review", label:"Linear equations — mixed review", objective:"Student solves linear equations of every type", idea:"Every equation is solved the same way: undo what was done to x, one operation at a time, on both sides.", directive:"Solve for x. Write the value of x (e.g. 4).",grade:"Grade 8", stars:5, range:[87,100], pool:()=>reviewPool([()=>enumTwoStep(1),()=>enumTwoStep(-1),enumDistribute,enumBothSides,enumDivEq]), example:{ problem:"4x - 6 = 10", steps:["Add 6 on BOTH sides — that eliminates the −6: 4x = 10 + 6 = 16","Divide BOTH sides by 4 to isolate x: x = 16 ÷ 4 = 4","Check: 4×4 − 6 = 10 ✓","The other shapes on this sheet: a bracket → divide by the number outside first; x on both sides → subtract the smaller x-term first; x over a number → multiply both sides by that number"], answer:"4" } },
  ],

  POLYNOMIALS: [
    // ── Foundations & vocabulary (taught before any operations) ──
    // ── Foundations & vocabulary — ONE instruction per unit/sheet (never mixed).
    // Each sheet states its single task once in the directive; every line is a
    // bare expression (the instruction is stripped at print time).
    { id:"poly-classify", label:"Classify polynomials by terms", objective:"Student classifies a polynomial as a monomial, binomial, or trinomial", directive:"Classify each by its number of terms: monomial (1), binomial (2), or trinomial (3).", grade:"Grade 8", stars:1, range:[1,4], pool:()=>enumPolyClassify(), example:{ problem:"Classify by the number of terms: x² + 3x + 2", steps:["Count the terms separated by + or −: x², 3x, 2 — three terms","Three terms → trinomial"], answer:"trinomial" } },
    { id:"poly-identify", label:"Identify polynomials", objective:"Student decides whether an expression is a polynomial", idea:"A polynomial uses only whole-number powers of x (x, x², x³ …) and plain numbers — no roots, no x in a denominator, no negative or fraction powers, and no x as an exponent.", directive:"Is each expression a polynomial? Write Yes or No.", grade:"Grade 8", stars:1, range:[5,7], open:0.2, pool:()=>enumPolyIdentify(), example:{ problem:"Is this a polynomial? 1/x + 5", steps:["The rule: only whole-number powers of x — x, x², x³ … — and plain numbers","Yes: 3x² + 5x − 2 uses only x² and x → Yes","No: 1/x + 5 has x in the denominator (underneath) — not allowed → No","No: √x − 3 has a root of x, x⁻¹ + 7 has a negative power, and 2ˣ − 1 has x as an EXPONENT — none of these is allowed → No"], answer:"No" } },
    { id:"poly-degree", label:"Degree of a polynomial", objective:"Student finds the degree of a polynomial", directive:"Find the degree of each polynomial (the highest power of x).", grade:"Grade 8", stars:2, range:[8,10], pool:()=>enumPolyDegree(), example:{ problem:"Find the degree of 3x⁴ + 2x + 3", steps:["The degree is the highest power of x present — look at every term","The powers here are 4, 1 and 0 (a plain number has no x): the highest is 4","The highest power is not always written first: in 2x + x³ + 5 the degree is 3","A single term has the power it shows: 7x² has degree 2, and a plain number like 9 has degree 0"], answer:"4" } },
    { id:"poly-stdform", label:"Write in standard form", objective:"Student writes a polynomial in standard form", directive:"Write each polynomial in standard form (highest power first).", grade:"Grade 8", stars:2, range:[11,13], pool:()=>enumStandardForm(), example:{ problem:"Write in standard form: 5 + x² + x", steps:["Order the terms by power: x² (2), x (1), 5 (0)","x² + x + 5"], answer:"x² + x + 5" } },
    { id:"poly-leadcoef", label:"Leading coefficient", objective:"Student identifies the leading coefficient", idea:"The leading coefficient is the number in front of the highest-power term — sign included, so a minus in front of it makes the leading coefficient negative.", directive:"Write the leading coefficient of each polynomial (the number on the highest-power term, with its sign).", grade:"Grade 8", stars:2, range:[14,16], open:0.5, pool:()=>enumLeadingCoef(), example:{ problem:"What is the leading coefficient of 4x³ + x - 7?", steps:["Find the highest-power term: 4x³ (power 3 beats the x and the -7)","Its coefficient — the number in front — is 4","The sign comes with it: in -3x² + x + 7 the highest-power term is -3x², so the leading coefficient is -3 (not 3)"], answer:"4" } },
    { id:"poly-constant", label:"Constant term", objective:"Student identifies the constant term", directive:"Write the constant term of each polynomial (the number with no x).", grade:"Grade 8", stars:2, range:[17,19], pool:()=>enumConstantTerm(), example:{ problem:"What is the constant term of 4x³ + x - 7?", steps:["The term with no x is -7"], answer:"-7" } },
    { id:"poly-eval", label:"Evaluate polynomials", objective:"Student evaluates a polynomial for a given value of x", idea:"Replace every x with the given number, then work it out: powers first, then multiply, then add.", directive:"Evaluate each polynomial for the given value of x.", grade:"Grade 8", stars:3, range:[20,23], open:0.5, pool:()=>enumPolyEval(), example:{ problem:"Evaluate x² + 3x + 2 at x = 4", steps:["Substitute 4 for x: 4² + 3·4 + 2","16 + 12 + 2 = 30","Later this week x can be negative — keep the sign: at x = −1, (−1)² = +1 but 3·(−1) = −3, so 1 − 3 + 2 = 0"], answer:"30" } },
    // ── Operations ──
    { id:"poly-combine", label:"Combine like terms (x²)", objective:"Student combines quadratic like terms", idea:"Terms with the same power of x combine: add or subtract the numbers in front and keep the x² — a bare x² means 1x².", directive:"Combine like terms. Write a coefficient of 1 as x² (not 1x²).", grade:"Grade 8", stars:3, range:[24,28], pool:()=>enumPolyCombine(), example:{ problem:"3x² + 2x²", steps:["Both terms are x² terms, so they combine. Add the coefficients (the numbers in front): 3 + 2 = 5, so 5x²","A bare x² means 1x²: x² + 5x² = 1x² + 5x² = 6x²","Subtracting works the same way: 3x² − 2x² = 1x², which is written x² (write x², not 1x²)"], answer:"5x²" } },
    { id:"poly-add", label:"Add polynomials", objective:"Student adds two binomials", directive:"Add.", grade:"Grade 8", stars:3, range:[29,33], pool:()=>enumPolyAdd(false), example:{ problem:"(2x + 3) + (4x + 1)", steps:["2x + 4x = 6x","3 + 1 = 4"], answer:"6x + 4" } },
    { id:"poly-sub", label:"Subtract polynomials", objective:"Student subtracts two binomials", directive:"Subtract.", grade:"Grade 8", stars:4, range:[34,38], pool:()=>enumPolyAdd(true), example:{ problem:"(5x + 6) - (2x + 1)", steps:["The minus applies to EVERY term in the second bracket: subtract 2x and subtract 1","5x - 2x = 3x","6 - 1 = 5, so 3x + 5","The answer can go negative — keep the sign: (2x + 3) - (5x + 7) → 2x - 5x = -3x and 3 - 7 = -4, so -3x - 4"], answer:"3x + 5" } },
    { id:"poly-mono", label:"Multiply monomials", objective:"Student multiplies monomials", directive:"Multiply.", grade:"Grade 8-9", stars:4, range:[39,42], pool:()=>enumMonomialMul(), example:{ problem:"3x · 4x", steps:["The dot means multiply. Numbers with numbers: 3 × 4 = 12","x with x: x · x = x², so 12x²","With higher powers, ADD the exponents: 3x² · 4x = 12x³ (x² · x = x · x · x = x³), and 2x² · 5x² = 10x⁴"], answer:"12x²" } },
    { id:"poly-distribute", label:"Distribute a monomial", objective:"Student distributes a monomial over a binomial", idea:"The monomial multiplies EACH term inside the bracket — numbers with numbers, x with x — and the sign inside stays with its term.", directive:"Expand.", grade:"Grade 9", stars:5, range:[43,47], open:0.55, pool:()=>enumMonoDistribute(), example:{ problem:"2x(x + 3)", steps:["2x multiplies each term inside. First: 2x · x = 2x² (2 × 1 = 2, x · x = x²)","Second: 2x · 3 = 6x","So 2x² + 6x","With a minus inside, the minus stays with its term: 2x(x − 1) = 2x² − 2x"], answer:"2x² + 6x" } },
    { id:"poly-foil", label:"Multiply binomials (FOIL)", objective:"Student expands (x + a)(x + b)", idea:"Every term in the first bracket multiplies every term in the second — First, Outer, Inner, Last — and the two x-terms from Outer and Inner add into one.", directive:"Expand each product.", grade:"Grade 9", stars:5, range:[48,52], pool:()=>enumFoil(), example:{ problem:"(x + 2)(x + 3)", steps:["First: x · x = x²","Outer: x · 3 = 3x.  Inner: 2 · x = 2x","Outer + Inner are like terms, so add them: 3x + 2x = 5x — this is the new step; yesterday's 2x(x + 3) had only one x-term","Last: 2 · 3 = 6","x² + 5x + 6","A minus in a bracket comes along with its number: (x + 3)(x − 2) → x² − 2x + 3x − 6 = x² + x − 6"], answer:"x² + 5x + 6" } },
    { id:"poly-boxmodel", label:"Partial products (box method)", objective:"Student writes the four partial products of a binomial product", idea:"A 2 × 2 box with one bracket across the top and the other down the side: each cell is its row times its column, and the four cells are the four partial products FOIL adds up.", directive:"Fill the box: each cell is its row times its column. Write the four cells in order — top-left, top-right, bottom-left, bottom-right (x², the top-row x-term, the bottom-row x-term, the constant), e.g. x², 2x, 3x, 6.", grade:"Grade 9", stars:5, range:[53,56], pool:()=>enumAreaModel(), example:{ problem:"(x + 2)(x + 3)", steps:["Draw a 2 × 2 box. Write the first bracket across the top — a column for x and a column for 2 — and the second bracket down the side — a row for x and a row for 3","Top row (row x): x · x = x² in the first cell, x · 2 = 2x in the second","Bottom row (row 3): 3 · x = 3x in the first cell, 3 · 2 = 6 in the second","The four cells, read top row then bottom row, are the four partial products: x², 2x, 3x, 6 — the same four pieces FOIL gave yesterday, and they add to x² + 5x + 6"], answer:"x²,2x,3x,6" } },
    { id:"poly-trinomial", label:"Multiply by a trinomial", objective:"Student multiplies a monomial or binomial by a trinomial", directive:"Expand.", grade:"Grade 9", stars:5, range:[57,61], pool:()=>enumPolyTrinomialMul(), example:{ problem:"Expand 2x(x² + 3x + 1)", steps:["2x multiplies EACH of the three terms. 2x · x² = 2x³","2x · 3x = 6x²","2x · 1 = 2x, so 2x³ + 6x² + 2x","A BINOMIAL times a trinomial (later this week): (x + 2)(x² + 3x + 1). Multiply the trinomial by x: x³ + 3x² + x. Then by 2: 2x² + 6x + 2","Stack and add the like terms: x³ + (3x² + 2x²) + (x + 6x) + 2 = x³ + 5x² + 7x + 2 — six products, collected into four terms"], answer:"2x³ + 6x² + 2x" } },
    // ── Division ──
    { id:"poly-div-mono", label:"Divide by a monomial", objective:"Student divides a polynomial by a monomial", idea:"Divide EACH term on top by the monomial — numbers divide numbers, x's divide x's — then check by multiplying back.", directive:"Divide.", grade:"Grade 9", stars:5, range:[62,66], pool:()=>enumPolyDivMono(), example:{ problem:"Divide (6x² + 4x) ÷ 2x", steps:["Divide term by term. First: 6x² ÷ 2x = 3x (6 ÷ 2 = 3, x² ÷ x = x)","Second: 4x ÷ 2x = 2 (4 ÷ 2 = 2, x ÷ x = 1)","So 3x + 2","Check by multiplying back: 2x(3x + 2) = 6x² + 4x ✓"], answer:"3x + 2" } },
    { id:"poly-div-long", label:"Polynomial long division", objective:"Student divides a quadratic by a binomial exactly", directive:"Divide.", grade:"Grade 9-10", stars:5, range:[67,70], pool:()=>enumPolyDivLong(), example:{ problem:"Divide (x² + 5x + 6) ÷ (x + 2)", steps:["Ask: (x + 2) × what = x² + 5x + 6? Start with x, because x · x = x²","x · (x + 2) = x² + 2x. Left over: 5x − 2x = 3x, and the 6","3 · (x + 2) = 3x + 6 — exactly what is left, so the answer is x + 3","Check with FOIL: (x + 2)(x + 3) = x² + 5x + 6 ✓","A minus works the same way: (x² + 2x − 15) ÷ (x + 5). x · (x + 5) = x² + 5x; left over 2x − 5x = −3x, and the −15. −3 · (x + 5) = −3x − 15 ✓ so the answer is x − 3"], answer:"x + 3" } },
    // ── Factoring — grouped as a coherent finale (GCF → quadratics → advanced) ──
    { id:"poly-factor", label:"Factor out the GCF", objective:"Student factors the GCF from a binomial", directive:"Factor out the GCF.", grade:"Grade 9", stars:5, range:[71,74], pool:()=>enumFactorGcf(), example:{ problem:"Factor 3x + 12", steps:["The GCF is the biggest thing that divides EVERY term: 3 divides 3x and 12","Take it out and write what is left of each term inside: 3x ÷ 3 = x, 12 ÷ 3 = 4 → 3(x + 4)","Check by expanding: 3(x + 4) = 3x + 12 ✓","The GCF can have x in it: 3x² + 6x — both terms have a 3 AND an x, so the GCF is 3x: 3x(x + 2).  For 2x³ + 8x² the GCF is 2x²: 2x²(x + 4)"], answer:"3(x + 4)" } },
    { id:"poly-factor-tri", label:"Factor quadratic trinomials", objective:"Student factors x² + bx + c into two binomials", idea:"Find two numbers that multiply to the constant and add to the middle coefficient — they are the numbers in the two brackets.", directive:"Factor each quadratic into two binomials. Where a list is shown, select exactly the two factors; otherwise write them as (x + 2)(x + 3), smaller number first.", grade:"Grade 9", stars:5, range:[75,78], open:0.43, pool:()=>[...enumSelectFactors(), ...enumTypedFactors()], example:{ problem:"Factor x² + 5x + 6", steps:["Two numbers that MULTIPLY to 6 and ADD to 5: try 1 and 6 (adds to 7 ✗), then 2 and 3 (adds to 5 ✓)","(x + 2)(x + 3).  Check with FOIL: x² + 3x + 2x + 6 = x² + 5x + 6 ✓","On the sheet you may be shown a list of brackets: pick exactly the two that are factors — here (x + 2) and (x + 3) — and leave the rest","When asked to write the answer, write both brackets with the smaller number first: (x + 2)(x + 3)"], answer:"(x + 2)(x + 3)" } },
    { id:"poly-factor-aN", label:"Factor trinomials (a ≠ 1)", objective:"Student factors ax² + bx + c with a leading coefficient", idea:"The first terms multiply to ax² and the last terms multiply to c — try the pairs until outer + inner gives the middle term.", directive:"Factor each trinomial into two binomials. Write the factor with the larger x-coefficient first, e.g. (2x + 1)(x + 3).", grade:"Grade 9-10", stars:5, range:[79,83], open:0.2, pool:()=>enumFactorTrinomialA(), example:{ problem:"Factor 2x² + 7x + 3", steps:["First terms must multiply to 2x²: (2x    )(x    )","Last terms must multiply to 3: 1 and 3","Try (2x + 1)(x + 3): outer 2x·3 = 6x, inner 1·x = x, 6x + x = 7x ✓ (if it fails, swap: (2x + 3)(x + 1) gives 2x + 3x = 5x ✗)","Write the factor with the larger x-coefficient first: (2x + 1)(x + 3)"], answer:"(2x + 1)(x + 3)" } },
    { id:"poly-diff-squares", label:"Difference of squares", objective:"Student factors a² − b² as (a + b)(a − b)", idea:"Two squares with a minus between them split into (a + b)(a − b) — take the square root of each part.", directive:"Factor each difference of squares:  a² − b² = (a + b)(a − b). Write the plus bracket first, e.g. (x + 3)(x − 3).", grade:"Grade 9", stars:5, range:[84,88], pool:()=>enumFactorDiffSquares(), example:{ problem:"Factor x² - 9", steps:["x² - 9 = x² - 3²","a² - b² = (a + b)(a - b)","(x + 3)(x - 3)","If x² has a number in front, take its square root too: 4x² = (2x)², so 4x² − 9 = (2x + 3)(2x − 3)"], answer:"(x + 3)(x - 3)" } },
    { id:"poly-perfect-square", label:"Perfect-square trinomials", objective:"Student factors a perfect-square trinomial as (a ± b)²", idea:"When the first and last terms are squares and the middle term is twice the product of their roots, the trinomial is one bracket squared — and the sign of the middle term is the sign inside the bracket.", directive:"Factor each perfect-square trinomial:  a² ± 2ab + b² = (a ± b)². Write the answer as one squared bracket, e.g. (x + 3)² or (x − 3)².", grade:"Grade 9-10", stars:5, range:[89,92], pool:()=>enumFactorPerfectSquare(), example:{ problem:"Factor x² + 6x + 9", steps:["First term x² = (x)², last term 9 = 3², and the middle 6x = 2 · x · 3 — twice the product of the roots → a perfect square","So x² + 6x + 9 = (x + 3)². Write it as one bracket squared: (x + 3)², not (x + 3)(x + 3)","A minus in the middle means a minus in the bracket: x² − 2x + 1 has roots x and 1, middle −2x = −2 · x · 1, so it is (x − 1)²","If x² has a number in front, take its square root too: 4x² = (2x)², so 4x² + 12x + 9 = (2x + 3)² (check the middle: 2 · 2x · 3 = 12x ✓)"], answer:"(x + 3)²" } },
    { id:"poly-grouping", label:"Factor by grouping", objective:"Student factors a four-term polynomial by grouping", directive:"Factor each four-term polynomial by grouping. Write the x² bracket first, e.g. (x² + 3)(x + 2).", grade:"Grade 10", stars:5, range:[93,96], pool:()=>enumFactorGrouping(), example:{ problem:"Factor x³ + 2x² + 3x + 6", steps:["Group the first two terms and the last two: (x³ + 2x²) + (3x + 6)","Factor each group: x²(x + 2) + 3(x + 2) — both groups now share the bracket (x + 2)","Take the shared bracket out; what is left of each group goes in the other bracket: x² and 3 → (x² + 3)(x + 2). Write the x² bracket first","With minus signs, the shared bracket carries the minus: x³ − 2x² + 3x − 6 = x²(x − 2) + 3(x − 2) = (x² + 3)(x − 2)","A number in front works the same: 2x³ + 4x² + 3x + 6 = 2x²(x + 2) + 3(x + 2) = (2x² + 3)(x + 2)"], answer:"(x² + 3)(x + 2)" } },
    { id:"poly-cubes", label:"Sum & difference of cubes", objective:"Student factors a³ ± b³", idea:"a³ + b³ = (a + b)(a² − ab + b²) and a³ − b³ = (a − b)(a² + ab + b²) — the signs go SOAP: Same, Opposite, Always Positive.", directive:"Factor each sum or difference of cubes:  a³ ± b³ = (a ± b)(a² ∓ ab + b²).", grade:"Grade 10", stars:5, range:[97,100], pool:()=>enumFactorCubes(), example:{ problem:"Factor x³ + 8", steps:["8 = 2³ → a sum of cubes with a = x, b = 2","Sum: a³ + b³ = (a + b)(a² − ab + b²).  Difference: a³ − b³ = (a − b)(a² + ab + b²)","SOAP for the signs: Same as the problem, then Opposite, then Always Positive","(x + 2)(x² − 2x + 4)","Difference case: x³ − 27 = x³ − 3³ → Same (−), Opposite (+), Always Positive (+): (x − 3)(x² + 3x + 9)"], answer:"(x + 2)(x² - 2x + 4)" } },
  ],
};

const SKILL_CODE: Record<string, string> = {
  DECIMALS: "M8", RATIOS: "M9", PRE_ALGEBRA: "M10", LINEAR_EQUATIONS: "M11", POLYNOMIALS: "M12",
};

// ── Selection + GPI (identical guarantees to the other engines) ───────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(skill: string, sheet: number): number {
  const units = CURRICULA[skill];
  const idx = units.findIndex(u => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? units.length - 1 : idx;
}

function buildScoredPool(skill: string, unitIndex: number): XP[] {
  const raw = CURRICULA[skill][unitIndex].pool();
  let lo = Infinity, hi = -Infinity;
  for (const p of raw) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const base = unitIndex * GPI_STEP;
  return raw.map(p => ({ ...p, diff: base + ((p.diff - lo) / span) * GPI_BAND }));
}

// Per-sheet seeded RNG so consecutive sheets in a unit draw DIFFERENT subsets of
// the pool (was fully deterministic by t → adjacent sheets near-identical).
function mulberry32(seed: number): () => number {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffleSeeded<T>(a: T[], rng: () => number): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

// `exclude` (review pools only) holds the previous sheet's question texts:
// adjacent review sheets are fresh sets. The stride-and-jitter pick inside a
// group can land on the same item two sheets running when the window has
// barely moved, so the previous sheet's picks are taken out of the window
// before the shares are dealt (the group still has hundreds of items left).
function selectProblems(pool: XP[], t: number, count: number, seed = 0, open = 0.6, exclude?: Set<string>): XP[] {
  // Dedup by QUESTION TEXT so no two items show identical text on a sheet. (On
  // the PRINT PDF the renderer doesn't draw the interactive graphs, so items that
  // share a prompt — e.g. "What is the equation of the line shown?" — really are
  // visual duplicates on paper and must collapse.)
  const seen = new Set<string>();
  const uniq = pool.filter((p) => (seen.has(p.q) ? false : (seen.add(p.q), true)));
  const sorted = uniq.sort((a, b) => a.diff - b.diff || (a.key < b.key ? -1 : 1));
  const N = sorted.length;
  const rng = mulberry32(seed >>> 0);
  if (N <= count) {
    const bag = shuffleSeeded(sorted, rng);
    const out: XP[] = [];
    for (let i = 0; i < count; i++) out.push(bag[i % bag.length]);
    return out.sort((a, b) => a.diff - b.diff);
  }
  // The window opens from the unit's `open` fraction on sheet one to 60% of the
  // pool by its last sheet (same idea as arithmetic-engine's opening window).
  const tc = Math.min(1, Math.max(0, t));
  const frac = open + (0.6 - open) * tc;
  const W = Math.min(N, Math.max(count, Math.round(N * frac)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  if (!win.some((p) => p.group !== undefined)) {
    // Seeded sample: shuffle the difficulty window, take `count`, restore order.
    return shuffleSeeded(win, rng).slice(0, count).sort((a, b) => a.diff - b.diff);
  }
  // Review pool (reviewPool): every source lesson gets an equal share of the
  // sheet, the shares dealt round-robin so the remainder rotates with the seed.
  // Within a group the picks are spread evenly across its slice of the window
  // (one from each equal bin, jittered inside the bin), so a sheet's mean
  // difficulty tracks the window's — which rises with t — and the GPI stays
  // monotonic even though each sheet is a fresh set of items.
  const byGroup = new Map<number, XP[]>();
  for (const p of win) { if (exclude?.has(p.q)) continue; const g = p.group ?? -1; if (!byGroup.has(g)) byGroup.set(g, []); byGroup.get(g)!.push(p); }
  const groups = [...byGroup.keys()].sort((a, b) => a - b).map((g) => byGroup.get(g)!);
  const quota = groups.map(() => 0);
  let dealt = 0;
  for (let i = Math.floor(rng() * groups.length); dealt < count && quota.some((q, gi) => q < groups[gi].length); i++) {
    const gi = i % groups.length;
    if (quota[gi] < groups[gi].length) { quota[gi]++; dealt++; }
  }
  const picked: XP[] = [];
  groups.forEach((items, gi) => {
    const n = quota[gi];
    if (n === items.length) { picked.push(...items); return; }
    const stride = items.length / n;
    for (let j = 0; j < n; j++) picked.push(items[Math.min(items.length - 1, Math.floor((j + 0.25 + rng() * 0.5) * stride))]);
  });
  return picked.sort((a, b) => a.diff - b.diff);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function advancedUnits(skill: string): { index: number; id: string; label: string; objective: string; grade: string; range: [number, number] }[] {
  return (CURRICULA[skill] ?? []).map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
}
export function isAdvancedSkill(skill: string): boolean {
  return skill in CURRICULA;
}

// Friendly parent-level name for the lesson's one-line orientation.
const SKILL_UMBRELLA: Record<string, string> = {
  DECIMALS: "Decimals & Percentages", RATIOS: "Ratios & Proportions",
  PRE_ALGEBRA: "Pre-Algebra", LINEAR_EQUATIONS: "Linear Equations", POLYNOMIALS: "Polynomials",
};

export interface AdvancedMicroLesson {
  goal: string; bigIdea: string; example: WorkedExample; umbrella: string;
}

/** Resolve a micro-skill's lesson by its practice label (e.g. "Ratios — solve a
 *  proportion"), so the pre-practice lesson's worked example MATCHES the upcoming
 *  questions. Scans every advanced curriculum (labels are unit-unique). */
export function getAdvancedMicroLesson(label: string): AdvancedMicroLesson | null {
  for (const [skill, units] of Object.entries(CURRICULA)) {
    const u = units.find((x) => x.label === label) ?? units.find((x) => label.includes(x.label));
    if (u) return {
      goal: u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase()),
      bigIdea: u.idea ?? u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase()),
      example: u.example,
      umbrella: SKILL_UMBRELLA[skill] ?? skill,
    };
  }
  return null;
}

// The items a sheet serves. A review unit (grouped pool) never repeats an item
// from the sheet before it, and "the sheet before it" means what that sheet
// ACTUALLY served — which itself excluded ITS predecessor — so the chain runs
// back to the unit's first sheet (at most 17 cheap picks from one pool).
function pickForSheet(skill: string, ui: number, pool: XP[], sheetNumber: number, count: number): XP[] {
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;
  let exclude: Set<string> | undefined;
  if (sheetNumber > unit.range[0] && pool.some((p) => p.group !== undefined)) {
    exclude = new Set(pickForSheet(skill, ui, pool, sheetNumber - 1, count).map((p) => p.q));
  }
  return selectProblems(pool, t, count, hashStr(`${skill}:${sheetNumber}`), unit.open, exclude);
}

export function generateAdvancedSheet(
  skill: ShopSkill, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(skill, sheetNumber);
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = pickForSheet(skill, ui, buildScoredPool(skill, ui), sheetNumber, problemCount);
  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: (p.type ?? "arithmetic") as "arithmetic" | "short_answer" | "multiple_choice",
    question: p.q, answer: p.a, points: 1,
    ...(p.options ? { options: p.options } : {}),
    ...(p.interactive ? { interactive: p.interactive } : {}),
    zone: (Math.floor(i / Math.ceil(problemCount / 5)) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
  const answerKey = problems.map(p => ({ id: p.id, answer: p.answer }));
  const isFirstOfUnit = sheetNumber === unit.range[0];

  return {
    problems, answerKey,
    workedExample: isFirstOfUnit ? unit.example : undefined,
    meta: {
      skill, skillCode: SKILL_CODE[skill] ?? "M8", sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective, directive: unit.directive,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 10),
    },
  };
}

// ── Self-validation (used by tests) ──────────────────────────────────────────
export function validateAdvancedPack(skill: string, totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(skill, s);
    const unit = CURRICULA[skill][ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(skill, ui), t, 30, 0, unit.open);
    const qs = sel.map(p => p.q);
    const poolSize = new Set(unit.pool().map(p => p.key)).size;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`${skill} sheet ${s}: ${dupes} dup(s) (pool=${poolSize})`);
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`${skill} sheet ${s}: not ascending`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`${skill} sheet ${s}: GPI dropped`);
    prevMean = Math.max(prevMean, mean);
  }
  return { ok: issues.length === 0, issues, gpi };
}
