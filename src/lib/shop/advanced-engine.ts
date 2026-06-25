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
  interactive?: { kind: "vertex-drag" | "plot-point"; a?: number; curve?: { a: number; h: number; k: number }; xRange: [number, number]; yRange: [number, number]; snap: number };
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
  const out: XP[] = []; const pcts = [5, 10, 20, 25, 50, 75];
  for (const p of pcts) for (let n = 4; n <= 40; n += 2) {
    const v = (p / 100) * n; if (!Number.isInteger(v)) continue;
    out.push({ q: `${p}% of ${n}`, a: String(v), diff: p * 0.3 + n + 20, key: `pct:${p}of${n}` });
  }
  return out;
}
function enumConvert(): XP[] {
  const out: XP[] = [];
  const fd: [number, number, string][] = [[1,2,"0.5"],[1,4,"0.25"],[3,4,"0.75"],[1,5,"0.2"],[2,5,"0.4"],[3,5,"0.6"],[4,5,"0.8"],[1,10,"0.1"],[3,10,"0.3"],[7,10,"0.7"],[1,20,"0.05"]];
  for (const [n,d,dec] of fd) {
    out.push({ q: `Write ${F(n,d)} as a decimal.`, a: dec, diff: d + 30, key: `cfd:${n}/${d}` });
    out.push({ q: `Write ${dec} as a fraction.`, a: F(n,d), diff: d + 32, key: `cdf:${dec}` });
    out.push({ q: `Write ${dec} as a percent.`, a: `${Math.round(parseFloat(dec)*100)}%`, diff: d + 34, key: `cdp:${dec}` });
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
  for (let m = 2; m <= 6; m++) for (let x = 1; x <= 12; x++) {
    const b = (m - 1) * x;                  // mx = x + b  → x = b/(m-1)
    out.push({ q: `Solve for x:  ${m}x = x + ${b}`, a: String(x), diff: m + x + 22, key: `bs:${m}_${x}` });
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
  for (let m = 1; m <= 9; m++) for (let n = 1; n <= 9; n++)
    out.push({ q: `Simplify ${term(m,"x²")} + ${term(n,"x²")}.`, a: term(m+n,"x²"), diff: m + n + 6, key: `pc:${m}+${n}` });
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
  for (let m = 2; m <= 9; m++) for (let n = 2; n <= 9; n++)
    out.push({ q: `Multiply ${m}x · ${n}x.`, a: `${m*n}x²`, diff: m + n + 20, key: `mm:${m}_${n}` });
  return out;
}
function enumMonoDistribute(): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 6; m++) for (let b = 1; b <= 9; b++)
    out.push({ q: `Expand ${m}x(x + ${b}).`, a: `${m}x² + ${m*b}x`, diff: m + b + 26, key: `md:${m}_${b}` });
  return out;
}
function enumFoil(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++)
    out.push({ q: `Expand (x + ${a})(x + ${b}).`, a: `x² + ${a+b}x + ${a*b}`, diff: a + b + 32, key: `foil:${a}_${b}` });
  return out;
}
function enumFactorGcf(): XP[] {
  const out: XP[] = [];
  for (let g = 2; g <= 9; g++) for (let b = 1; b <= 9; b++)
    out.push({ q: `Factor ${g}x + ${g*b}.`, a: `${g}(x + ${b})`, diff: g + b + 30, key: `fg:${g}_${b}` });
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

// ── Curricula ─────────────────────────────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => XP[]; example: WorkedExample;
  // Shown ONCE at the top of the sheet so the instruction isn't repeated per problem.
  directive?: string;
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
    { id:"pa-eval-add", label:"Evaluate expressions (+/-)", objective:"Student evaluates an expression by substitution", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[1,12], pool:()=>[...enumEvaluate("+"),...enumEvaluate("-")], example:{ problem:"x + 5,  x = 3", steps:["3 + 5 = 8"], answer:"8" } },
    { id:"pa-eval-mul", label:"Evaluate expressions (×)", objective:"Student evaluates a product expression", directive:"Evaluate each for the given value of x.", grade:"Grade 6", stars:2, range:[13,24], pool:()=>enumEvaluateMul(), example:{ problem:"3x,  x = 4", steps:["3 × 4 = 12"], answer:"12" } },
    { id:"pa-combine", label:"Combine like terms", objective:"Student combines like terms", directive:"Combine like terms.", grade:"Grade 6-7", stars:3, range:[25,36], pool:()=>enumCombine(), example:{ problem:"2x + 3x", steps:["Add coefficients: 2 + 3 = 5"], answer:"5x" } },
    { id:"pa-onestep-add", label:"One-step equations (+/-)", objective:"Student solves one-step add/subtract equations", directive:"Solve for x.", grade:"Grade 7", stars:3, range:[37,50], pool:()=>[...enumOneStep("+"),...enumOneStep("-")], example:{ problem:"x + 5 = 12", steps:["12 - 5 = 7"], answer:"7" } },
    { id:"pa-onestep-mul", label:"One-step equations (×)", objective:"Student solves one-step multiplication equations", directive:"Solve for x.", grade:"Grade 7", stars:4, range:[51,62], pool:()=>enumOneStep("×"), example:{ problem:"3x = 21", steps:["21 ÷ 3 = 7"], answer:"7" } },
    { id:"pa-integers", label:"Integer addition & subtraction", objective:"Student adds and subtracts integers", directive:"Add or subtract.", grade:"Grade 7", stars:4, range:[63,78], pool:()=>[...enumInteger("+"),...enumInteger("-")], example:{ problem:"(-5) + 8", steps:["8 - 5 = 3"], answer:"3" } },
    { id:"pa-order", label:"Order of operations", objective:"Student applies order of operations", directive:"Solve using order of operations.", grade:"Grade 7", stars:5, range:[79,90], pool:()=>enumOrderOps(), example:{ problem:"3 + 4 × 2", steps:["Multiply first: 4 × 2 = 8","3 + 8 = 11"], answer:"11" } },
    { id:"pa-review", label:"Pre-algebra — mixed review", objective:"Student works fluently across pre-algebra skills", directive:"Solve.", grade:"Grade 7", stars:5, range:[91,100], pool:()=>[...enumCombine(),...enumOneStep("+"),...enumOrderOps()], example:{ problem:"4x + 2x", steps:["4 + 2 = 6"], answer:"6x" } },
  ],

  LINEAR_EQUATIONS: [
    { id:"le-plot", label:"Plot points on the coordinate plane", objective:"Student plots an ordered pair (x, y) on a coordinate plane", directive:"Plot each point.", grade:"Grade 6", stars:1, range:[1,4], pool:()=>enumPlotPoints(), example:{ problem:"Plot the point (3, 2).", steps:["From the origin, move right 3 along the x-axis","Then move up 2 along the y-axis"], answer:"3,2" } },
    { id:"le-two-add", label:"Two-step equations (+)", objective:"Student solves ax + b = c", directive:"Solve for x.", grade:"Grade 7", stars:3, range:[5,18], pool:()=>enumTwoStep(1), example:{ problem:"2x + 3 = 11", steps:["11 - 3 = 8","8 ÷ 2 = 4"], answer:"4" } },
    { id:"le-two-sub", label:"Two-step equations (-)", objective:"Student solves ax - b = c", directive:"Solve for x.", grade:"Grade 7-8", stars:4, range:[19,34], pool:()=>enumTwoStep(-1), example:{ problem:"3x - 5 = 16", steps:["16 + 5 = 21","21 ÷ 3 = 7"], answer:"7" } },
    { id:"le-distribute", label:"Equations with distribution", objective:"Student solves k(x + b) = c", directive:"Solve for x.", grade:"Grade 8", stars:4, range:[35,52], pool:()=>enumDistribute(), example:{ problem:"2(x + 3) = 14", steps:["14 ÷ 2 = 7","7 - 3 = 4"], answer:"4" } },
    { id:"le-both-sides", label:"Variables on both sides", objective:"Student solves equations with variables on both sides", directive:"Solve for x.", grade:"Grade 8", stars:5, range:[53,72], pool:()=>enumBothSides(), example:{ problem:"3x = x + 8", steps:["3x - x = 8 → 2x = 8","x = 4"], answer:"4" } },
    { id:"le-fraction", label:"Equations with a fraction", objective:"Student solves x/d = q", directive:"Solve for x.", grade:"Grade 8", stars:4, range:[73,88], pool:()=>enumDivEq(), example:{ problem:`${BS}frac{x}{3} = 4`, steps:["Multiply both sides by 3","x = 12"], answer:"12" } },
    { id:"le-review", label:"Linear equations — mixed review", objective:"Student solves linear equations of every type", directive:"Solve for x.", grade:"Grade 8", stars:5, range:[89,100], pool:()=>[...enumTwoStep(1),...enumTwoStep(-1),...enumDistribute()], example:{ problem:"4x - 6 = 10", steps:["10 + 6 = 16","16 ÷ 4 = 4"], answer:"4" } },
  ],

  POLYNOMIALS: [
    { id:"poly-combine", label:"Combine like terms (x²)", objective:"Student combines quadratic like terms", directive:"Combine like terms.", grade:"Grade 8", stars:3, range:[1,14], pool:()=>enumPolyCombine(), example:{ problem:"3x² + 2x²", steps:["Add coefficients: 3 + 2 = 5"], answer:"5x²" } },
    { id:"poly-add", label:"Add polynomials", objective:"Student adds two binomials", directive:"Add.", grade:"Grade 8", stars:3, range:[15,30], pool:()=>enumPolyAdd(false), example:{ problem:"(2x + 3) + (4x + 1)", steps:["2x + 4x = 6x","3 + 1 = 4"], answer:"6x + 4" } },
    { id:"poly-sub", label:"Subtract polynomials", objective:"Student subtracts two binomials", directive:"Subtract.", grade:"Grade 8", stars:4, range:[31,46], pool:()=>enumPolyAdd(true), example:{ problem:"(5x + 6) - (2x + 1)", steps:["5x - 2x = 3x","6 - 1 = 5"], answer:"3x + 5" } },
    { id:"poly-mono", label:"Multiply monomials", objective:"Student multiplies monomials", directive:"Multiply.", grade:"Grade 8-9", stars:4, range:[47,60], pool:()=>enumMonomialMul(), example:{ problem:"3x · 4x", steps:["3 × 4 = 12","x · x = x²"], answer:"12x²" } },
    { id:"poly-distribute", label:"Distribute a monomial", objective:"Student distributes a monomial over a binomial", directive:"Expand.", grade:"Grade 9", stars:5, range:[61,74], pool:()=>enumMonoDistribute(), example:{ problem:"2x(x + 3)", steps:["2x · x = 2x²","2x · 3 = 6x"], answer:"2x² + 6x" } },
    { id:"poly-foil", label:"Multiply binomials (FOIL)", objective:"Student expands (x + a)(x + b)", directive:"Expand.", grade:"Grade 9", stars:5, range:[75,88], pool:()=>enumFoil(), example:{ problem:"(x + 2)(x + 3)", steps:["First x·x = x²","Outer+Inner = 5x","Last 2·3 = 6"], answer:"x² + 5x + 6" } },
    { id:"poly-factor", label:"Factor out the GCF", objective:"Student factors the GCF from a binomial", directive:"Factor out the GCF.", grade:"Grade 9", stars:5, range:[89,100], pool:()=>enumFactorGcf(), example:{ problem:"3x + 12", steps:["GCF = 3","3(x + 4)"], answer:"3(x + 4)" } },
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

function selectProblems(pool: XP[], t: number, count: number): XP[] {
  const seen = new Set<string>();
  const uniq = pool.filter(p => (seen.has(p.key) ? false : (seen.add(p.key), true)));
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

  const selected = selectProblems(buildScoredPool(skill, ui), t, problemCount);
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
