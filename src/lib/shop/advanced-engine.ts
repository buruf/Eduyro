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
  // Optional interactive (graphing) item — e.g. "plot the point". Carries the
  // render spec to the client; the target stays in the answer key. Graded by the
  // standard value match on the canonical "x,y" string.
  type?: "arithmetic" | "short_answer" | "multiple_choice";
  options?: string[];
  interactive?: { kind: "vertex-drag" | "plot-point" | "plot-line" | "equation-builder" | "angle-drag" | "area-model" | "triangle-drag"; a?: number; curve?: { a: number; h: number; k: number }; line?: { m: number; b: number }; binomial?: { a: number; b: number }; xRange: [number, number]; yRange: [number, number]; snap: number };
}

// rounding helpers for decimals
const r1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
const r2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
// trim trailing zeros for clean answers (1.20 → 1.2, 3.00 → 3)
const trim = (s: string) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

// ── DECIMALS (M8) ─────────────────────────────────────────────────────────────
function enumDecAdd(places: 1 | 2): XP[] {
  const out: XP[] = []; const s = places === 1 ? 10 : 100; const cap = places === 1 ? 25 : 60;
  for (let ai = 1; ai <= cap; ai++) for (let bi = 1; bi <= cap; bi++) {
    const a = ai / s, b = bi / s; const fmt = places === 1 ? r1 : r2;
    out.push({ q: `${fmt(a)} + ${fmt(b)}`, a: trim(fmt(a + b)), diff: (addCarries(ai, bi) ? 140 : 0) + ai + bi, key: `da${places}:${ai}+${bi}` });
  }
  return out;
}
function enumDecSub(places: 1 | 2): XP[] {
  const out: XP[] = []; const s = places === 1 ? 10 : 100; const cap = places === 1 ? 25 : 60;
  for (let ai = 1; ai <= cap; ai++) for (let bi = 1; bi <= ai; bi++) {
    const a = ai / s, b = bi / s; const fmt = places === 1 ? r1 : r2;
    out.push({ q: `${fmt(a)} - ${fmt(b)}`, a: trim(fmt(a - b)), diff: (subBorrows(ai, bi) ? 140 : 0) + ai + bi * 0.5, key: `ds${places}:${ai}-${bi}` });
  }
  return out;
}
function enumDecMulWhole(): XP[] {
  const out: XP[] = [];
  for (let ai = 1; ai <= 95; ai++) for (let b = 2; b <= 9; b++) {
    const a = ai / 10;
    out.push({ q: `${r1(a)} × ${b}`, a: trim(r2(a * b)), diff: ai * 0.4 + b * 3, key: `dmw:${ai}x${b}` });
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
  const out: XP[] = []; const pcts = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
  for (const p of pcts) for (let n = 2; n <= 100; n += 1) {
    const v = (p / 100) * n; if (!Number.isInteger(v)) continue;
    out.push({ q: `${p}% of ${n}`, a: String(v), diff: p * 0.15 + n * 0.4 + 20, key: `pct:${p}of${n}` });
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
  for (const [n,d,dec] of fd) {
    const pct = pctOf(dec);
    out.push({ q: `Write ${F(n,d)} as a decimal.`, a: dec, diff: d + 30, key: `cfd:${n}/${d}` });
    out.push({ q: `Write ${dec} as a fraction.`, a: F(n,d), diff: d + 31, key: `cdf:${dec}` });
    out.push({ q: `Write ${dec} as a percent.`, a: pct, diff: d + 32, key: `cdp:${dec}` });
    out.push({ q: `Write ${pct} as a decimal.`, a: dec, diff: d + 33, key: `cpd:${pct}` });
    out.push({ q: `Write ${F(n,d)} as a percent.`, a: pct, diff: d + 34, key: `cfp:${n}/${d}` });
  }
  return out;
}

// ── RATIOS (M9) ───────────────────────────────────────────────────────────────
function enumRatioSimplify(): XP[] {
  const out: XP[] = []; const seen = new Set<string>();
  for (let a = 2; a <= 24; a++) for (let b = 2; b <= 24; b++) {
    const g = gcd(a, b); if (g === 1) continue;
    const key = `${a}:${b}`;
    out.push({ q: `Simplify the ratio ${a} : ${b}.`, a: `${a/g} : ${b/g}`, diff: a + b + g, key: `rs:${key}` });
  }
  void seen; return out;
}
function enumRatioEquiv(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (gcd(a, b) !== 1) continue;          // start from a reduced ratio
    for (let k = 2; k <= 6; k++)
      out.push({ q: `Find the missing number:  ${a} : ${b} = ${a*k} : ___`, a: String(b*k), diff: (a+b) + k * 4, key: `re:${a}:${b}x${k}` });
  }
  return out;
}
function enumProportion(): XP[] {
  // Real proportion with the THIRD term missing (cross-multiply skill):
  //   a : b = ___ : (b·k)   →   answer a·k.  Base ratio a:b is reduced.
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) {
    if (gcd(a, b) !== 1) continue;
    for (let k = 2; k <= 6; k++)
      out.push({ q: `Find the missing number:  ${a} : ${b} = ___ : ${b*k}`, a: String(a*k), diff: (a + b) + k * 5 + 8, key: `pr:${a}_${b}_${k}` });
  }
  return out;
}
function enumScale(): XP[] {
  const out: XP[] = [];
  for (let a = 2; a <= 12; a++) for (let k = 2; k <= 8; k++)
    out.push({ q: `Write an equivalent ratio: scale ${a} : ${a+1} by ${k}.`, a: `${a*k} : ${(a+1)*k}`, diff: a + k * 5 + 12, key: `sc:${a}x${k}` });
  return out;
}

// ── PRE-ALGEBRA (M10) ─────────────────────────────────────────────────────────
function enumEvaluate(opSym: "+" | "-", ): XP[] {
  const out: XP[] = [];
  for (let v = 1; v <= 12; v++) for (let b = 1; b <= 12; b++) {
    const ans = opSym === "+" ? v + b : v - b;
    out.push({ q: `Evaluate x ${opSym} ${b} when x = ${v}.`, a: String(ans), diff: v + b + 5, key: `ev${opSym}:${v}_${b}` });
  }
  return out;
}
function enumEvaluateMul(): XP[] {
  const out: XP[] = [];
  for (let v = 1; v <= 12; v++) for (let m = 2; m <= 9; m++)
    out.push({ q: `Evaluate ${m}x when x = ${v}.`, a: String(m*v), diff: v + m * 2 + 10, key: `evm:${m}_${v}` });
  return out;
}
function enumCombine(): XP[] {
  const out: XP[] = [];
  for (let m = 1; m <= 9; m++) for (let n = 1; n <= 9; n++)
    out.push({ q: `Simplify ${term(m,"x")} + ${term(n,"x")}.`, a: term(m+n,"x"), diff: m + n + 8, key: `cl:${m}+${n}` });
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
    const as = a < 0 ? `(${a})` : `${a}`;
    const ans = op === "+" ? a + b : a - b;
    out.push({ q: `${as} ${op} ${b}`, a: String(ans), diff: Math.abs(a) + b + 18, key: `int${op}:${a}_${b}` });
  }
  return out;
}
function enumOrderOps(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 2; b <= 9; b++) for (let c = 2; c <= 9; c++)
    out.push({ q: `${a} + ${b} × ${c}`, a: String(a + b * c), diff: a + b + c + 22, key: `oo:${a}_${b}_${c}` });
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
function enumDistribute(): XP[] {
  const out: XP[] = [];
  for (let k = 2; k <= 6; k++) for (let b = 1; b <= 9; b++) for (let x = 1; x <= 9; x++)
    out.push({ q: `Solve for x:  ${k}(x + ${b}) = ${k*(x+b)}`, a: String(x), diff: k + b + x + 18, key: `dist:${k}_${b}_${x}` });
  return out;
}
function enumBothSides(): XP[] {
  const out: XP[] = [];
  // mx = x + b
  for (let m = 2; m <= 8; m++) for (let x = 1; x <= 20; x++) {
    const b = (m - 1) * x;
    out.push({ q: `Solve for x:  ${m}x = x + ${b}`, a: String(x), diff: m + x + 22, key: `bs:${m}_${x}` });
  }
  // mx + a = nx + b  (n < m), second form for variety across the 18-sheet unit
  for (let m = 3; m <= 7; m++) for (let n = 1; n < m; n++) for (let x = 1; x <= 12; x++) {
    const a = x, b = (m - n) * x + a;       // mx + a = nx + b → x = (b - a)/(m - n)
    out.push({ q: `Solve for x:  ${m}x + ${a} = ${n}x + ${b}`, a: String(x), diff: m + n + x + 24, key: `bs2:${m}_${n}_${x}` });
  }
  return out;
}
function enumDivEq(): XP[] {
  const out: XP[] = [];
  for (let d = 2; d <= 9; d++) for (let q = 1; q <= 15; q++)
    out.push({ q: `Solve for x:  ${BS}frac{x}{${d}} = ${q}`, a: String(d*q), diff: d + q + 14, key: `de:${d}_${q}` });
  return out;
}

// ── POLYNOMIALS (M12) ─────────────────────────────────────────────────────────
function enumPolyCombine(): XP[] {
  const out: XP[] = [];
  for (let m = 1; m <= 12; m++) for (let n = 1; n <= 12; n++) {
    out.push({ q: `Simplify ${term(m,"x²")} + ${term(n,"x²")}.`, a: term(m+n,"x²"), diff: m + n + 6, key: `pc:${m}+${n}` });
    if (m > n) out.push({ q: `Simplify ${term(m,"x²")} - ${term(n,"x²")}.`, a: term(m-n,"x²"), diff: m + n + 7, key: `pcs:${m}-${n}` });
  }
  return out;
}
function enumPolyAdd(sub: boolean): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 9; b++) for (let c = 1; c <= 6; c++) for (let d = 1; d <= 9; d++) {
    if (sub && (a - c <= 0 || b - d <= 0)) continue;
    const xc = sub ? a - c : a + c, k = sub ? b - d : b + d;
    const op = sub ? "-" : "+";
    out.push({ q: `Simplify (${term(a,"x")} + ${b}) ${op} (${term(c,"x")} + ${d}).`, a: `${term(xc,"x")} + ${k}`, diff: a + b + c + d + (sub ? 16 : 12), key: `pa${op}:${a}_${b}_${c}_${d}` });
  }
  return out;
}
function enumMonomialMul(): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 12; m++) for (let n = 2; n <= 12; n++)
    out.push({ q: `Multiply ${m}x · ${n}x.`, a: `${m*n}x²`, diff: m + n + 20, key: `mm:${m}_${n}` });
  return out;
}
function enumMonoDistribute(): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 9; m++) for (let b = 1; b <= 12; b++) {
    out.push({ q: `Expand ${m}x(x + ${b}).`, a: `${m}x² + ${m*b}x`, diff: m + b + 26, key: `md:${m}_${b}` });
    if (b <= m + 3) out.push({ q: `Expand ${m}x(x - ${b}).`, a: `${m}x² - ${m*b}x`, diff: m + b + 27, key: `mds:${m}_${b}` });
  }
  return out;
}
function enumFoil(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++)
    out.push({ q: `Expand (x + ${a})(x + ${b}).`, a: `x² + ${a+b}x + ${a*b}`, diff: a + b + 32, key: `foil:${a}_${b}` });
  return out;
}
// INTERACTIVE AREA MODEL: fill the four regions of (x+a)(x+b). Answer is the four
// partial products in fixed order (x², ax, bx, ab); graded by value match.
function enumAreaModel(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let a = 2; a <= 7; a++) for (let b = a; b <= 9; b++)
    out.push({
      q: `Fill in the area model for (x + ${a})(x + ${b}).`,
      a: `x²,${a}x,${b}x,${a * b}`, diff: 28 + i++ * 0.1, key: `am:${a}_${b}`,
      type: "short_answer", interactive: { kind: "area-model", binomial: { a, b }, xRange: [0, 1], yRange: [0, 1], snap: 1 },
    });
  return out;
}
// MULTI-SELECT (the "factor model"): select ALL binomial factors of x²+Sx+P.
// Answer = the correct factors, sorted + comma-joined (order-independent).
// Distractors are interleaved so the two correct factors are never adjacent.
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
  for (let g = 2; g <= 12; g++) for (let b = 1; b <= 12; b++)
    out.push({ q: `Factor ${g}x + ${g*b}.`, a: `${g}(x + ${b})`, diff: g + b + 30, key: `fg:${g}_${b}` });
  return out;
}

// ── TIER 2: advanced factoring (each is its own single-task unit) ─────────────
// Difference of squares: a² − b² = (a + b)(a − b).
function enumFactorDiffSquares(): XP[] {
  const out: XP[] = [];
  for (let k = 1; k <= 12; k++)
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: -(k * k), p: 0 }])}.`, a: `(x + ${k})(x - ${k})`, diff: k, key: `dsq:1_${k}` });
  for (const m of [2, 3, 4, 5]) for (let k = 1; k <= 6; k++)
    out.push({ q: `Factor ${m * m}x² - ${k * k}.`, a: `(${term(m, "x")} + ${k})(${term(m, "x")} - ${k})`, diff: 14 + m * 2 + k, key: `dsq:${m}_${k}` });
  return out;
}
// Perfect-square trinomial: x² ± 2bx + b² = (x ± b)².
function enumFactorPerfectSquare(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 15; b++) {
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: 2 * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(x + ${b})²`, diff: b, key: `psq:+${b}` });
    out.push({ q: `Factor ${pStr([{ c: 1, p: 2 }, { c: -2 * b, p: 1 }, { c: b * b, p: 0 }])}.`, a: `(x - ${b})²`, diff: b + 0.5, key: `psq:-${b}` });
  }
  return out;
}
// Trinomial with leading coefficient a ≠ 1: ax² + bx + c = (px + q)(rx + s).
function enumFactorTrinomialA(): XP[] {
  const out: XP[] = [];
  for (const p of [2, 3]) for (const r of [1, 2, 3]) for (let q = 1; q <= 4; q++) for (let s = 1; s <= 4; s++) {
    const a = p * r, b = p * s + q * r, c = q * s;
    if (a === 1) continue;                       // a=1 case belongs to the quadratic-trinomials unit
    if (p === r && q > s) continue;              // (2x+1)(2x+3) ≡ (2x+3)(2x+1) — keep one
    out.push({ q: `Factor ${pStr([{ c: a, p: 2 }, { c: b, p: 1 }, { c, p: 0 }])}.`, a: `(${term(p, "x")} + ${q})(${term(r, "x")} + ${s})`, diff: a + b + c, key: `trN:${p}_${q}_${r}_${s}` });
  }
  return out;
}
// Factor by grouping (four terms): x³ + bx² + ax + ab = (x² + a)(x + b).
function enumFactorGrouping(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 8; a++) for (let b = 1; b <= 7; b++)
    out.push({ q: `Factor ${pStr([{ c: 1, p: 3 }, { c: b, p: 2 }, { c: a, p: 1 }, { c: a * b, p: 0 }])}.`, a: `(x² + ${a})(x + ${b})`, diff: a + b, key: `grp:${a}_${b}` });
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
  // root no longer hiding: a³x³ ± k³ = (ax ± k)(a²x² ∓ akx + k²).
  for (const a of [2, 3, 4]) for (let k = 1; k <= 5; k++) {
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
  yes.forEach((e, i) => out.push({ q: `Is this a polynomial?   ${e}`, a: "Yes", diff: scatterDiff(`id:y:${i}`), type: "multiple_choice", options: ["Yes", "No"], key: `id:y:${i}` }));
  no.forEach((e, i) => out.push({ q: `Is this a polynomial?   ${e}`, a: "No", diff: scatterDiff(`id:n:${i}`), type: "multiple_choice", options: ["Yes", "No"], key: `id:n:${i}` }));
  return out;
}
// Degree of a polynomial (highest power present). Scattered so each sheet mixes
// "find the degree" with "write in standard form".
function enumPolyDegree(): XP[] {
  const out: XP[] = [];
  for (let D = 2; D <= 5; D++) for (let mid = 1; mid < D; mid++) for (const lead of [1, 2, 3])
    out.push({ q: `Find the degree of ${pStr([{ c: lead, p: D }, { c: 2, p: mid }, { c: 3, p: 0 }])}.`, a: String(D), diff: scatterDiff(`deg:${D}_${mid}_${lead}`), key: `deg:${D}_${mid}_${lead}` });
  return out;
}
// Rewrite a scrambled polynomial in standard form (descending powers).
function enumStandardForm(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 3; a++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 5; c++) {
    const ordered = [{ c: a, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }];
    const scrambled = [{ c: c, p: 0 }, { c: a, p: 2 }, { c: b, p: 1 }];
    out.push({ q: `Write in standard form: ${pStr(scrambled)}.`, a: pStr(ordered), diff: scatterDiff(`sf:${a}_${b}_${c}`), key: `sf:${a}_${b}_${c}` });
  }
  return out;
}
// Leading coefficient — its OWN single-task unit (never mixed with "constant
// term" on the same sheet, per the one-instruction-per-sheet rule).
function enumLeadingCoef(): XP[] {
  const out: XP[] = [];
  for (let D = 2; D <= 4; D++) for (const lead of [2, 3, 5, -2, -3, 4]) for (const k of [1, -3, 7, -5]) {
    const s = pStr([{ c: lead, p: D }, { c: 1, p: 1 }, { c: k, p: 0 }]);
    out.push({ q: `What is the leading coefficient of ${s}?`, a: String(lead), diff: scatterDiff(`lc:${D}_${lead}_${k}`), key: `lc:${D}_${lead}_${k}` });
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
// Evaluate a quadratic polynomial at a value of x.
function enumPolyEval(): XP[] {
  const out: XP[] = []; let i = 0;
  for (let a = 1; a <= 3; a++) for (let b = 1; b <= 4; b++) for (let c = 1; c <= 5; c++) for (const k of [2, 3, -1, 4])
    out.push({ q: `Evaluate ${pStr([{ c: a, p: 2 }, { c: b, p: 1 }, { c: c, p: 0 }])} at x = ${k}.`, a: String(a * k * k + b * k + c), diff: Math.abs(k) + a + b + i++ * 0.01, key: `ev:${a}_${b}_${c}_${k}` });
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
  const out: XP[] = []; let i = 0;
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 6; b++)
    out.push({ q: `Divide (${pStr([{ c: 1, p: 2 }, { c: a + b, p: 1 }, { c: a * b, p: 0 }])}) ÷ (x + ${a}).`, a: pStr([{ c: 1, p: 1 }, { c: b, p: 0 }]), diff: a + b + i++ * 0.02, key: `dl:${a}_${b}` });
  return out;
}

// Interactive coordinate-plane intro for Linear Equations: plot an ordered pair.
// Reuses the "plot-point" graphing interaction (answerType "point"); graded by
// the canonical "x,y" value match. Integer grid (snap 1) for clean plotting.
function enumPlotPoints(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const x of [-3, -2, -1, 1, 2, 3]) for (const y of [-3, -2, -1, 1, 2, 3])
    out.push({
      q: `Plot the point (${x}, ${y}) on the coordinate plane.`,
      a: `${x},${y}`, diff: 1 + i++ * 0.04, key: `pp:${x}_${y}`, type: "short_answer",
      interactive: { kind: "plot-point", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  // Read a linear equation → plot its y-intercept (0, b). Higher difficulty so
  // these appear after basic point-plotting within the intro unit.
  let j = 0;
  for (const m of [1, 2, -1, -2, 3]) for (const b of [-3, -2, -1, 1, 2, 3]) {
    const mTerm = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
    out.push({
      q: `Plot the y-intercept of the line y = ${mTerm} ${b < 0 ? `− ${-b}` : `+ ${b}`}.`,
      a: `0,${b}`, diff: 3 + j++ * 0.03, key: `li:${m}_${b}`, type: "short_answer",
      interactive: { kind: "plot-point", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  }
  return out;
}

// Interactive "graph a line": the student drags TWO points so the line through
// them matches y = mx + b. Graded by canonical slope+intercept ("m,b") computed
// from the snapped points — any two correct lattice points match.
function enumPlotLine(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const m of [1, 2, 3, -1, -2, -3]) for (const b of [-3, -2, -1, 0, 1, 2, 3]) {
    const mTerm = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
    const bTerm = b === 0 ? "" : b < 0 ? ` − ${-b}` : ` + ${b}`;
    out.push({
      q: `Plot the line y = ${mTerm}${bTerm}.`,
      a: `${m},${b}`, diff: 1 + i++ * 0.05, key: `gl:${m}_${b}`, type: "short_answer",
      interactive: { kind: "plot-line", xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  }
  return out;
}

// EQUATION BUILDER: a line y = mx + b is shown; the student builds its equation
// by selecting slope & intercept. Graded by canonical "m,b" (value match).
function enumEquationBuilder(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const m of [1, 2, -1, -2, 3]) for (const b of [-3, -2, -1, 0, 1, 2, 3])
    out.push({
      q: `What is the equation of the line shown? Build it with the slope and intercept.`,
      a: `${m},${b}`, diff: 2 + i++ * 0.04, key: `eqb:${m}_${b}`, type: "short_answer",
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

function enumOrderIntegers(): XP[] {
  // Generate many distinct 4-integer sets deterministically (was 14 hardcoded →
  // forced repeats across the unit). Vary the negative/positive mix + spread.
  const sets: number[][] = [];
  const seen = new Set<string>();
  for (let a = -9; a <= 6; a++) for (const d1 of [2, 3, 4, 5]) for (const d2 of [3, 5, 7]) {
    const s = [a, a + d1, -(a + d2), -a].map((n) => Math.max(-9, Math.min(9, n)));
    const uniq = [...new Set(s)];
    if (uniq.length < 4) continue;
    const key = [...uniq].sort((x, y) => x - y).join("_");
    if (seen.has(key)) continue;
    seen.add(key);
    sets.push(uniq);
    if (sets.length >= 70) break;
  }
  const out: XP[] = [];
  let i = 0;
  for (const s of sets) {
    const correct = [...s].sort((a, b) => a - b);
    // deterministic scramble so the shown order differs from the answer
    let shown = [...s].sort((a, b) => (((a * 31 + i * 7) % 11) - ((b * 31 + i * 7) % 11)) || a - b);
    if (shown.join(",") === correct.join(",")) shown = [...correct].reverse();
    out.push({
      q: `Order these from least to greatest:  ${shown.join(",  ")}`,
      a: correct.join(","), diff: 1 + i * 0.05, key: `ordint:${s.join("_")}`,
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
function enumInequality(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 12; b++) for (let r = 1; r <= 12; r++) {
    out.push({ q: `Solve for x:  x + ${b} < ${b + r}`, a: `x < ${r}`, diff: b + r + 14, key: `iqa:${b}_${r}` });
    out.push({ q: `Solve for x:  x - ${b} > ${r}`, a: `x > ${b + r}`, diff: b + r + 15, key: `iqb:${b}_${r}` });
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
  return out;
}

const CURRICULA: Record<string, Unit[]> = {
  DECIMALS: [
    { id:"dec-add1", label:"Decimals — add (tenths)", objective:"Student adds decimals to one place", directive:"Add.", grade:"Grade 4", stars:2, range:[1,10], pool:()=>enumDecAdd(1), example:{ problem:"0.4 + 0.3", steps:["Line up the decimal points","4 tenths + 3 tenths = 7 tenths"], answer:"0.7" } },
    { id:"dec-add2", label:"Decimals — add (hundredths)", objective:"Student adds decimals to two places", directive:"Add.", grade:"Grade 5", stars:2, range:[11,20], pool:()=>enumDecAdd(2), example:{ problem:"0.25 + 0.36", steps:["Line up decimal points","25 + 36 = 61 hundredths"], answer:"0.61" } },
    { id:"dec-sub1", label:"Decimals — subtract (tenths)", objective:"Student subtracts decimals to one place", directive:"Subtract.", grade:"Grade 4-5", stars:3, range:[21,30], pool:()=>enumDecSub(1), example:{ problem:"0.8 - 0.3", steps:["8 tenths - 3 tenths = 5 tenths"], answer:"0.5" } },
    { id:"dec-sub2", label:"Decimals — subtract (hundredths)", objective:"Student subtracts decimals to two places", directive:"Subtract.", grade:"Grade 5", stars:3, range:[31,40], pool:()=>enumDecSub(2), example:{ problem:"0.72 - 0.45", steps:["72 - 45 = 27 hundredths"], answer:"0.27" } },
    { id:"dec-mulw", label:"Decimals — multiply by a whole number", objective:"Student multiplies a decimal by a whole number", directive:"Multiply.", grade:"Grade 5", stars:4, range:[41,52], pool:()=>enumDecMulWhole(), example:{ problem:"0.6 × 4", steps:["6 × 4 = 24","One decimal place → 2.4"], answer:"2.4" } },
    { id:"dec-muld", label:"Decimals — multiply two decimals", objective:"Student multiplies two decimals", directive:"Multiply.", grade:"Grade 6", stars:5, range:[53,62], pool:()=>enumDecMulDec(), example:{ problem:"0.3 × 0.4", steps:["3 × 4 = 12","Two decimal places → 0.12"], answer:"0.12" } },
    { id:"dec-divw", label:"Decimals — divide by a whole number", objective:"Student divides a decimal by a whole number", directive:"Divide.", grade:"Grade 6", stars:4, range:[63,72], pool:()=>enumDecDivWhole(), example:{ problem:"1.2 ÷ 3", steps:["12 ÷ 3 = 4","One decimal place → 0.4"], answer:"0.4" } },
    { id:"dec-pct", label:"Percentages of a number", objective:"Student finds a percentage of a number", directive:"Find the percent of each number.", grade:"Grade 6", stars:4, range:[73,84], pool:()=>enumPercentOf(), example:{ problem:"25% of 40", steps:["25% = 1/4","40 ÷ 4 = 10"], answer:"10" } },
    { id:"dec-convert", label:"Convert fractions, decimals, percents", objective:"Student converts between fractions, decimals and percents", directive:"Convert each.", grade:"Grade 6", stars:5, range:[85,94], pool:()=>enumConvert(), example:{ problem:`${F(1,4)} → decimal`, steps:["1 ÷ 4 = 0.25"], answer:"0.25" } },
    { id:"dec-review", label:"Decimals — mixed review", objective:"Student works fluently across all decimal operations", directive:"Solve.", grade:"Grade 6", stars:5, range:[95,100], pool:()=>[...enumDecAdd(2),...enumDecMulDec(),...enumPercentOf()], example:{ problem:"0.5 × 0.6", steps:["5 × 6 = 30","Two places → 0.30 = 0.3"], answer:"0.3" } },
  ],

  RATIOS: [
    { id:"rat-simplify", label:"Ratios — simplify", objective:"Student writes a ratio in simplest form", directive:"Write each ratio in simplest form.", grade:"Grade 6", stars:2, range:[1,16], pool:()=>enumRatioSimplify(), example:{ problem:"6 : 9", steps:["GCF of 6 and 9 = 3","6÷3 : 9÷3"], answer:"2 : 3" } },
    { id:"rat-equiv", label:"Ratios — equivalent ratios", objective:"Student finds an equivalent ratio", directive:"Find the missing term.", grade:"Grade 6", stars:3, range:[17,36], pool:()=>enumRatioEquiv(), example:{ problem:"2 : 3 = 8 : ___", steps:["8 ÷ 2 = 4 (scale)","3 × 4 = 12"], answer:"12" } },
    { id:"rat-proportion", label:"Ratios — solve a proportion", objective:"Student solves for the missing term in a proportion", directive:"Find the missing term.", grade:"Grade 6-7", stars:4, range:[37,60], pool:()=>enumProportion(), example:{ problem:"2 : 5 = ___ : 15", steps:["15 ÷ 5 = 3 (scale)","2 × 3 = 6"], answer:"6" } },
    { id:"rat-scale", label:"Ratios — scale up", objective:"Student scales a ratio by a factor", directive:"Scale each ratio by the given factor.", grade:"Grade 7", stars:4, range:[61,82], pool:()=>enumScale(), example:{ problem:"2 : 3  × 4", steps:["2 × 4 = 8","3 × 4 = 12"], answer:"8 : 12" } },
    { id:"rat-review", label:"Ratios — mixed review", objective:"Student works fluently across ratio tasks", directive:"Find the missing term.", grade:"Grade 7", stars:5, range:[83,100], pool:()=>[...enumRatioEquiv(),...enumProportion(),...enumScale()], example:{ problem:"4 : 5 = 12 : ___", steps:["12 ÷ 4 = 3","5 × 3 = 15"], answer:"15" } },
  ],

  PRE_ALGEBRA: [
    // ── Phase 1 · Expressions & Variables (sheets 1–25) ──
    { id:"pa-order-int", label:"Expressions · Order integers", objective:"Student orders integers from least to greatest on the number line", directive:"Order from least to greatest.", grade:"Grade 6", stars:2, range:[1,4], pool:()=>enumOrderIntegers(), example:{ problem:"Order from least to greatest:  2,  −3,  1", steps:["Negatives are smallest; the further left on the number line, the smaller","−3, then 1, then 2"], answer:"-3,1,2" } },
    { id:"pa-eval-add", label:"Expressions · Evaluate (+/−)", objective:"Student evaluates an expression by substituting a value for x", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[5,15], pool:()=>[...enumEvaluate("+"),...enumEvaluate("-")], example:{ problem:"x + 5,  x = 3", steps:["Replace x with 3","3 + 5 = 8"], answer:"8" } },
    { id:"pa-eval-mul", label:"Expressions · Evaluate (×)", objective:"Student evaluates a product expression", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[16,25], pool:()=>enumEvaluateMul(), example:{ problem:"3x,  x = 4", steps:["3x means 3 × x","3 × 4 = 12"], answer:"12" } },
    // ── Phase 2 · Properties & Simplifying (sheets 26–50) ──
    { id:"pa-combine", label:"Simplify · Combine like terms", objective:"Student combines like terms by adding coefficients", directive:"Combine like terms.", grade:"Grade 6-7", stars:3, range:[26,37], pool:()=>enumCombine(), example:{ problem:"2x + 3x", steps:["Add coefficients: 2 + 3 = 5"], answer:"5x" } },
    { id:"pa-expand", label:"Simplify · Distributive property", objective:"Student expands using the distributive property", directive:"Expand each expression.", grade:"Grade 7", stars:3, range:[38,44], pool:()=>enumExpand(), example:{ problem:"3(x + 4)", steps:["3 · x = 3x","3 · 4 = 12"], answer:"3x + 12" } },
    { id:"pa-order-ops", label:"Simplify · Order of operations", objective:"Student applies the order of operations", directive:"Solve using order of operations.", grade:"Grade 7", stars:4, range:[45,50], pool:()=>enumOrderOps(), example:{ problem:"3 + 4 × 2", steps:["Multiply first: 4 × 2 = 8","3 + 8 = 11"], answer:"11" } },
    // ── Phase 3 · Equations (sheets 51–80) ──
    { id:"pa-onestep-add", label:"Equations · One-step (+/−)", objective:"Student solves one-step add/subtract equations", directive:"Solve for x.", grade:"Grade 7", stars:3, range:[51,62], pool:()=>[...enumOneStep("+"),...enumOneStep("-")], example:{ problem:"x + 5 = 12", steps:["Subtract 5 on BOTH sides — that eliminates the +5","x = 12 − 5 = 7","Check: 7 + 5 = 12 ✓"], answer:"7" } },
    { id:"pa-onestep-mul", label:"Equations · One-step (×)", objective:"Student solves one-step multiplication equations", directive:"Solve for x.", grade:"Grade 7", stars:4, range:[63,70], pool:()=>enumOneStep("×"), example:{ problem:"3x = 21", steps:["x is multiplied by 3 — divide BOTH sides by 3 to undo it","x = 21 ÷ 3 = 7","Check: 3 × 7 = 21 ✓"], answer:"7" } },
    { id:"pa-integers", label:"Equations · Integer add & subtract", objective:"Student adds and subtracts integers", directive:"Add or subtract.", grade:"Grade 7", stars:4, range:[71,76], pool:()=>[...enumInteger("+"),...enumInteger("-")], example:{ problem:"(-5) + 8", steps:["8 - 5 = 3"], answer:"3" } },
    { id:"pa-inequal", label:"Equations · One-step inequalities", objective:"Student solves one-step inequalities", directive:"Solve for x.", grade:"Grade 7-8", stars:5, range:[77,80], pool:()=>enumInequality(), example:{ problem:"x + 3 < 8", steps:["Subtract 3 from both sides","x < 5"], answer:"x < 5" } },
    // ── Phase 4 · Coordinate Plane (sheets 81–100) ──
    { id:"pa-plot", label:"Coordinate Plane · Plot points", objective:"Student plots ordered pairs on the coordinate plane", directive:"Plot each point.", grade:"Grade 7", stars:3, range:[81,92], pool:()=>enumPlotPoints(), example:{ problem:"Plot the point (3, 2).", steps:["Right 3 along the x-axis","Up 2 along the y-axis"], answer:"3,2" } },
    { id:"pa-pattern", label:"Coordinate Plane · Patterns & intro to slope", objective:"Student extends number patterns, identifying the constant step (slope)", directive:"Find the pattern.", grade:"Grade 7-8", stars:4, range:[93,100], pool:()=>enumPattern(), example:{ problem:"Find the next number:  2, 5, 8, 11, ___", steps:["Each step adds 3","11 + 3 = 14"], answer:"14" } },
  ],

  LINEAR_EQUATIONS: [
    { id:"le-plot", label:"Plot points on the coordinate plane", objective:"Student plots an ordered pair (x, y) on a coordinate plane", directive:"Plot each point.", grade:"Grade 6", stars:1, range:[1,4], pool:()=>enumPlotPoints(), example:{ problem:"Plot the point (3, 2).", steps:["From the origin, move right 3 along the x-axis","Then move up 2 along the y-axis"], answer:"3,2" } },
    { id:"le-graphline", label:"Graph a line", objective:"Student graphs a line y = mx + b by plotting two points on it", directive:"Plot the line.", grade:"Grade 8", stars:3, range:[5,8], pool:()=>[...enumPlotLine(), ...enumEquationBuilder()], example:{ problem:"Plot the line y = 2x − 1.", steps:["y-intercept (0, −1)","Slope 2 → up 2, right 1 → (1, 1)","Draw the line through both points"], answer:"2,-1" } },
    { id:"le-transform", label:"Transformations on the plane", objective:"Student reflects, translates and rotates points on the coordinate plane", directive:"Plot the image after the transformation.", grade:"Grade 8", stars:3, range:[9,12], pool:()=>[...enumTransformPoint(), ...enumTriangle()], example:{ problem:"Reflect the point (3, 2) across the x-axis. Plot the image.", steps:["Reflecting across the x-axis negates the y-coordinate","(3, 2) → (3, −2)"], answer:"3,-2" } },
    { id:"le-two-add", label:"Two-step equations (+)", objective:"Student solves ax + b = c", directive:"Solve for x.", grade:"Grade 7", stars:3, range:[13,24], pool:()=>enumTwoStep(1), example:{ problem:"2x + 3 = 11", steps:["Subtract 3 on BOTH sides — that eliminates the +3: 2x = 11 − 3 = 8","Divide BOTH sides by 2 to isolate x: x = 8 ÷ 2 = 4","Check: 2×4 + 3 = 11 ✓"], answer:"4" } },
    { id:"le-two-sub", label:"Two-step equations (-)", objective:"Student solves ax - b = c", directive:"Solve for x.", grade:"Grade 7-8", stars:4, range:[25,38], pool:()=>enumTwoStep(-1), example:{ problem:"3x - 5 = 16", steps:["Add 5 on BOTH sides — that eliminates the −5: 3x = 16 + 5 = 21","Divide BOTH sides by 3 to isolate x: x = 21 ÷ 3 = 7","Check: 3×7 − 5 = 16 ✓"], answer:"7" } },
    { id:"le-distribute", label:"Equations with distribution", objective:"Student solves k(x + b) = c", directive:"Solve for x.", grade:"Grade 8", stars:4, range:[39,54], pool:()=>enumDistribute(), example:{ problem:"2(x + 3) = 14", steps:["The bracket is multiplied by 2 — divide BOTH sides by 2: x + 3 = 7","Subtract 3 on BOTH sides: x = 7 − 3 = 4","Check: 2(4 + 3) = 14 ✓"], answer:"4" } },
    { id:"le-both-sides", label:"Variables on both sides", objective:"Student solves equations with variables on both sides", directive:"Solve for x.", grade:"Grade 8", stars:5, range:[55,72], pool:()=>enumBothSides(), example:{ problem:"3x = x + 8", steps:["Subtract x from BOTH sides to gather x on one side: 2x = 8","Divide BOTH sides by 2: x = 8 ÷ 2 = 4","Check: 3×4 = 4 + 8 ✓"], answer:"4" } },
    { id:"le-fraction", label:"Equations with a fraction", objective:"Student solves x/d = q", directive:"Solve for x.", grade:"Grade 8", stars:4, range:[73,86], pool:()=>enumDivEq(), example:{ problem:`${BS}frac{x}{3} = 4`, steps:["x is divided by 3 — multiply BOTH sides by 3 to undo it","x = 4 × 3 = 12","Check: 12 ÷ 3 = 4 ✓"], answer:"12" } },
    { id:"le-review", label:"Linear equations — mixed review", objective:"Student solves linear equations of every type", directive:"Solve for x.", grade:"Grade 8", stars:5, range:[87,100], pool:()=>[...enumTwoStep(1),...enumTwoStep(-1),...enumDistribute()], example:{ problem:"4x - 6 = 10", steps:["Add 6 on BOTH sides — that eliminates the −6: 4x = 10 + 6 = 16","Divide BOTH sides by 4 to isolate x: x = 16 ÷ 4 = 4","Check: 4×4 − 6 = 10 ✓"], answer:"4" } },
  ],

  POLYNOMIALS: [
    // ── Foundations & vocabulary (taught before any operations) ──
    // ── Foundations & vocabulary — ONE instruction per unit/sheet (never mixed).
    // Each sheet states its single task once in the directive; every line is a
    // bare expression (the instruction is stripped at print time).
    { id:"poly-classify", label:"Classify polynomials by terms", objective:"Student classifies a polynomial as a monomial, binomial, or trinomial", directive:"Classify each by its number of terms: monomial (1), binomial (2), or trinomial (3).", grade:"Grade 8", stars:1, range:[1,4], pool:()=>enumPolyClassify(), example:{ problem:"Classify by the number of terms: x² + 3x + 2", steps:["Count the terms separated by + or −: x², 3x, 2 — three terms","Three terms → trinomial"], answer:"trinomial" } },
    { id:"poly-identify", label:"Identify polynomials", objective:"Student decides whether an expression is a polynomial", directive:"Is each expression a polynomial? Write Yes or No.", grade:"Grade 8", stars:1, range:[5,7], pool:()=>enumPolyIdentify(), example:{ problem:"Is this a polynomial? 1/x + 5", steps:["1/x has x in the denominator — not allowed","→ No"], answer:"No" } },
    { id:"poly-degree", label:"Degree of a polynomial", objective:"Student finds the degree of a polynomial", directive:"Find the degree of each polynomial (the highest power of x).", grade:"Grade 8", stars:2, range:[8,10], pool:()=>enumPolyDegree(), example:{ problem:"Find the degree of 3x⁴ + 2x + 3", steps:["The degree is the highest power of x present","The highest power is 4"], answer:"4" } },
    { id:"poly-stdform", label:"Write in standard form", objective:"Student writes a polynomial in standard form", directive:"Write each polynomial in standard form (highest power first).", grade:"Grade 8", stars:2, range:[11,13], pool:()=>enumStandardForm(), example:{ problem:"Write in standard form: 5 + x² + x", steps:["Order the terms by power: x² (2), x (1), 5 (0)","x² + x + 5"], answer:"x² + x + 5" } },
    { id:"poly-leadcoef", label:"Leading coefficient", objective:"Student identifies the leading coefficient", directive:"Write the leading coefficient of each polynomial (the number on the highest-power term).", grade:"Grade 8", stars:2, range:[14,16], pool:()=>enumLeadingCoef(), example:{ problem:"What is the leading coefficient of 4x³ + x - 7?", steps:["Highest-power term is 4x³","Its coefficient is 4"], answer:"4" } },
    { id:"poly-constant", label:"Constant term", objective:"Student identifies the constant term", directive:"Write the constant term of each polynomial (the number with no x).", grade:"Grade 8", stars:2, range:[17,19], pool:()=>enumConstantTerm(), example:{ problem:"What is the constant term of 4x³ + x - 7?", steps:["The term with no x is -7"], answer:"-7" } },
    { id:"poly-eval", label:"Evaluate polynomials", objective:"Student evaluates a polynomial for a given value of x", directive:"Evaluate each polynomial for the given value of x.", grade:"Grade 8", stars:3, range:[20,23], pool:()=>enumPolyEval(), example:{ problem:"Evaluate x² + 3x + 2 at x = 4", steps:["Substitute 4 for x: 4² + 3·4 + 2","16 + 12 + 2 = 30"], answer:"30" } },
    // ── Operations ──
    { id:"poly-combine", label:"Combine like terms (x²)", objective:"Student combines quadratic like terms", directive:"Combine like terms.", grade:"Grade 8", stars:3, range:[24,28], pool:()=>enumPolyCombine(), example:{ problem:"3x² + 2x²", steps:["Add coefficients: 3 + 2 = 5"], answer:"5x²" } },
    { id:"poly-add", label:"Add polynomials", objective:"Student adds two binomials", directive:"Add.", grade:"Grade 8", stars:3, range:[29,33], pool:()=>enumPolyAdd(false), example:{ problem:"(2x + 3) + (4x + 1)", steps:["2x + 4x = 6x","3 + 1 = 4"], answer:"6x + 4" } },
    { id:"poly-sub", label:"Subtract polynomials", objective:"Student subtracts two binomials", directive:"Subtract.", grade:"Grade 8", stars:4, range:[34,38], pool:()=>enumPolyAdd(true), example:{ problem:"(5x + 6) - (2x + 1)", steps:["5x - 2x = 3x","6 - 1 = 5"], answer:"3x + 5" } },
    { id:"poly-mono", label:"Multiply monomials", objective:"Student multiplies monomials", directive:"Multiply.", grade:"Grade 8-9", stars:4, range:[39,42], pool:()=>enumMonomialMul(), example:{ problem:"3x · 4x", steps:["3 × 4 = 12","x · x = x²"], answer:"12x²" } },
    { id:"poly-distribute", label:"Distribute a monomial", objective:"Student distributes a monomial over a binomial", directive:"Expand.", grade:"Grade 9", stars:5, range:[43,47], pool:()=>enumMonoDistribute(), example:{ problem:"2x(x + 3)", steps:["2x · x = 2x²","2x · 3 = 6x"], answer:"2x² + 6x" } },
    { id:"poly-foil", label:"Multiply binomials (FOIL)", objective:"Student expands (x + a)(x + b)", directive:"Expand each product.", grade:"Grade 9", stars:5, range:[48,52], pool:()=>enumFoil(), example:{ problem:"(x + 2)(x + 3)", steps:["First x·x = x²","Outer+Inner = 5x","Last 2·3 = 6"], answer:"x² + 5x + 6" } },
    { id:"poly-boxmodel", label:"Partial products (box method)", objective:"Student writes the four partial products of a binomial product", directive:"Write the four partial products of each (x², the two x-terms, the constant).", grade:"Grade 9", stars:5, range:[53,56], pool:()=>enumAreaModel(), example:{ problem:"(x + 2)(x + 3)", steps:["x · x = x²","x · 3 = 3x","2 · x = 2x","2 · 3 = 6"], answer:"x²,2x,3x,6" } },
    { id:"poly-trinomial", label:"Multiply by a trinomial", objective:"Student multiplies a monomial or binomial by a trinomial", directive:"Expand.", grade:"Grade 9", stars:5, range:[57,61], pool:()=>enumPolyTrinomialMul(), example:{ problem:"Expand 2x(x² + 3x + 1)", steps:["2x · x² = 2x³","2x · 3x = 6x²","2x · 1 = 2x"], answer:"2x³ + 6x² + 2x" } },
    // ── Division ──
    { id:"poly-div-mono", label:"Divide by a monomial", objective:"Student divides a polynomial by a monomial", directive:"Divide.", grade:"Grade 9", stars:5, range:[62,66], pool:()=>enumPolyDivMono(), example:{ problem:"Divide (6x² + 4x) ÷ 2x", steps:["Factor 2x out of the top: 6x² + 4x = 2x(3x + 2)","Cancel the 2x top and bottom: 2x(3x + 2) ÷ 2x","= 3x + 2"], answer:"3x + 2" } },
    { id:"poly-div-long", label:"Polynomial long division", objective:"Student divides a quadratic by a binomial exactly", directive:"Divide.", grade:"Grade 9-10", stars:5, range:[67,70], pool:()=>enumPolyDivLong(), example:{ problem:"Divide (x² + 5x + 6) ÷ (x + 2)", steps:["Factor the top: x² + 5x + 6 = (x + 2)(x + 3)","Cancel the common (x + 2) top and bottom","= x + 3"], answer:"x + 3" } },
    // ── Factoring — grouped as a coherent finale (GCF → quadratics → advanced) ──
    { id:"poly-factor", label:"Factor out the GCF", objective:"Student factors the GCF from a binomial", directive:"Factor out the GCF.", grade:"Grade 9", stars:5, range:[71,74], pool:()=>enumFactorGcf(), example:{ problem:"Factor 3x + 12", steps:["GCF of 3 and 12 = 3","3(x + 4)"], answer:"3(x + 4)" } },
    { id:"poly-factor-tri", label:"Factor quadratic trinomials", objective:"Student factors x² + bx + c into two binomials", directive:"Factor each quadratic into two binomials.", grade:"Grade 9", stars:5, range:[75,78], pool:()=>enumSelectFactors(), example:{ problem:"Factor x² + 5x + 6", steps:["Two numbers that multiply to 6 and add to 5: 2 and 3","(x + 2)(x + 3)"], answer:"(x + 2)(x + 3)" } },
    { id:"poly-factor-aN", label:"Factor trinomials (a ≠ 1)", objective:"Student factors ax² + bx + c with a leading coefficient", directive:"Factor each trinomial into two binomials.", grade:"Grade 9-10", stars:5, range:[79,83], pool:()=>enumFactorTrinomialA(), example:{ problem:"Factor 2x² + 7x + 3", steps:["a·c = 2·3 = 6; two numbers multiply to 6 and add to 7: 6 and 1","Split & group: 2x² + 6x + x + 3 = 2x(x + 3) + 1(x + 3)","(2x + 1)(x + 3)"], answer:"(2x + 1)(x + 3)" } },
    { id:"poly-diff-squares", label:"Difference of squares", objective:"Student factors a² − b² as (a + b)(a − b)", directive:"Factor each difference of squares:  a² − b² = (a + b)(a − b).", grade:"Grade 9", stars:5, range:[84,88], pool:()=>enumFactorDiffSquares(), example:{ problem:"Factor x² - 9", steps:["x² - 9 = x² - 3²","a² - b² = (a + b)(a - b)","(x + 3)(x - 3)"], answer:"(x + 3)(x - 3)" } },
    { id:"poly-perfect-square", label:"Perfect-square trinomials", objective:"Student factors a perfect-square trinomial as (a ± b)²", directive:"Factor each perfect-square trinomial:  a² ± 2ab + b² = (a ± b)².", grade:"Grade 9-10", stars:5, range:[89,92], pool:()=>enumFactorPerfectSquare(), example:{ problem:"Factor x² + 6x + 9", steps:["9 = 3² and 6x = 2·3·x → perfect square","x² + 6x + 9 = (x + 3)²"], answer:"(x + 3)²" } },
    { id:"poly-grouping", label:"Factor by grouping", objective:"Student factors a four-term polynomial by grouping", directive:"Factor each four-term polynomial by grouping.", grade:"Grade 10", stars:5, range:[93,96], pool:()=>enumFactorGrouping(), example:{ problem:"Factor x³ + 2x² + 3x + 6", steps:["Group: (x³ + 2x²) + (3x + 6)","Factor each: x²(x + 2) + 3(x + 2)","(x² + 3)(x + 2)"], answer:"(x² + 3)(x + 2)" } },
    { id:"poly-cubes", label:"Sum & difference of cubes", objective:"Student factors a³ ± b³", directive:"Factor each sum or difference of cubes.", grade:"Grade 10", stars:5, range:[97,100], pool:()=>enumFactorCubes(), example:{ problem:"Factor x³ + 8", steps:["8 = 2³ → sum of cubes a³ + b³","a³ + b³ = (a + b)(a² - ab + b²)","(x + 2)(x² - 2x + 4)"], answer:"(x + 2)(x² - 2x + 4)" } },
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

function selectProblems(pool: XP[], t: number, count: number, seed = 0): XP[] {
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
  const W = Math.min(N, Math.max(count, Math.round(N * 0.6)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  // Seeded sample: shuffle the difficulty window, take `count`, restore order.
  return shuffleSeeded(win, rng).slice(0, count).sort((a, b) => a.diff - b.diff);
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
      bigIdea: u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase()),
      example: u.example,
      umbrella: SKILL_UMBRELLA[skill] ?? skill,
    };
  }
  return null;
}

export function generateAdvancedSheet(
  skill: ShopSkill, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(skill, sheetNumber);
  const unit = CURRICULA[skill][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(skill, ui), t, problemCount, hashStr(`${skill}:${sheetNumber}`));
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
    const sel = selectProblems(buildScoredPool(skill, ui), t, 30);
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
