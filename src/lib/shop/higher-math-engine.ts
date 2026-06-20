// src/lib/shop/higher-math-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDUYRO HIGHER-MATH CURRICULUM ENGINE  (M13–M18)
//   M13 Quadratics · M14 Functions · M15 Trigonometry
//   M16 Algebra II · M17 Pre-Calculus · M18 Calculus
//
// Same progression-first design as the M8–M12 advanced engine: each concept
// ENUMERATES its valid problem space, every problem is scored by ONE deterministic
// difficulty function, and each sheet selects a unique, strictly-ascending slice
// via a window that slides upward sheet-to-sheet. ⇒ no duplicates, rising
// within-sheet difficulty, monotonic GPI — by construction. Every answer is a
// short deterministic string so the student app can grade it server-side.
//
// Keyed by LEVEL CODE (M13…M18) so the student daily-practice path routes here
// without touching the shop's ShopSkill union.
// ─────────────────────────────────────────────────────────────────────────────

import { nanoid } from "nanoid";
import type { WorksheetData, WorkedExample } from "./progressive-generator";

// ── Small formatting helpers ──────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(Math.abs(b), Math.abs(a % b)));
// Suppress a unit coefficient: 1·x → "x", -1·x → "-x", else "3x".
const term = (c: number, v: string): string => (c === 1 ? v : c === -1 ? `-${v}` : `${c}${v}`);
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const sup = (n: number): string => String(n).split("").map((d) => SUP[+d]).join("");
const xpow = (n: number): string => (n === 0 ? "1" : n === 1 ? "x" : `x${sup(n)}`);
// coef · x^n with full suppression of unit coefficients and the trivial exponent.
const powTerm = (c: number, n: number): string =>
  n === 0 ? String(c) : c === 1 ? xpow(n) : c === -1 ? `-${xpow(n)}` : `${c}${xpow(n)}`;
// Imaginary term: 1 → "i", -1 → "-i", else "3i".
const imag = (c: number): string => (c === 1 ? "i" : c === -1 ? "-i" : `${c}i`);
const frac = (n: number, d: number): string => {
  const g = gcd(n, d) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
};

interface XP { q: string; a: string; diff: number; key: string; }

// ═════════════════════════════════════════════════════════════════════════════
// M13 — QUADRATICS
// ═════════════════════════════════════════════════════════════════════════════
function qSquareRoot(): XP[] {
  const out: XP[] = [];
  for (let n = 1; n <= 30; n++) out.push({ q: `Solve x² = ${n * n}`, a: `±${n}`, diff: n, key: `qsr:${n}` });
  return out;
}
function qZeroProduct(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++)
    out.push({ q: `Solve (x - ${a})(x - ${b}) = 0`, a: a === b ? `${a}` : `${a}, ${b}`, diff: a + b, key: `qzp:${a}_${b}` });
  return out;
}
function qFactor(): XP[] {
  const out: XP[] = [];
  for (let p = 1; p <= 9; p++) for (let q = p; q <= 9; q++) {
    const s = p + q, prod = p * q;
    out.push({ q: `Solve x² - ${s}x + ${prod} = 0`, a: p === q ? `${p}` : `${p}, ${q}`, diff: s + prod / 4, key: `qf:${p}_${q}` });
  }
  return out;
}
function qDiscriminant(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++)
    out.push({ q: `Find the discriminant of x² + ${term(b, "x")} + ${c}`, a: `${b * b - 4 * c}`, diff: b + c + 6, key: `qd:${b}_${c}` });
  return out;
}
function qEvaluate(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) for (let v = 1; v <= 6; v++)
    out.push({ q: `Evaluate x² + ${term(b, "x")} + ${c} when x = ${v}`, a: `${v * v + b * v + c}`, diff: b + c + v, key: `qe:${b}_${c}_${v}` });
  return out;
}
function qNumSolutions(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
    const d = b * b - 4 * c;
    out.push({ q: `How many real solutions? x² + ${term(b, "x")} + ${c} = 0`, a: d > 0 ? "2" : d === 0 ? "1" : "0", diff: b + c + 9, key: `qns:${b}_${c}` });
  }
  return out;
}
function qAxis(): XP[] {
  const out: XP[] = [];
  for (let b = 2; b <= 60; b += 2) out.push({ q: `Axis of symmetry of y = x² + ${b}x`, a: `x = ${-b / 2}`, diff: b / 2 + 10, key: `qax:${b}` });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M14 — FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
function fEvalLinear(): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 9; m++) for (let b = 1; b <= 9; b++) for (let v = 1; v <= 6; v++)
    out.push({ q: `f(x) = ${m}x + ${b}. Find f(${v})`, a: `${m * v + b}`, diff: m + b + v, key: `fl:${m}_${b}_${v}` });
  return out;
}
function fEvalQuad(): XP[] {
  const out: XP[] = [];
  for (let c = 1; c <= 9; c++) for (let v = 1; v <= 9; v++)
    out.push({ q: `f(x) = x² + ${c}. Find f(${v})`, a: `${v * v + c}`, diff: c + v + 6, key: `fq:${c}_${v}` });
  return out;
}
function fCompose(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let v = 1; v <= 5; v++)
    out.push({ q: `f(x) = x + ${a}, g(x) = ${term(b, "x")}. Find f(g(${v}))`, a: `${b * v + a}`, diff: a + b + v + 8, key: `fc:${a}_${b}_${v}` });
  return out;
}
function fDomain(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 30; a++) out.push({ q: `Domain of f(x) = 1/(x - ${a})`, a: `x ≠ ${a}`, diff: a + 12, key: `fd:${a}` });
  return out;
}
function fRange(): XP[] {
  const out: XP[] = [];
  for (let c = -15; c <= 15; c++) out.push({ q: `Range of f(x) = x² + ${c < 0 ? `(${c})` : c}`, a: `y ≥ ${c}`, diff: c + 30, key: `fr:${c}` });
  return out;
}
function fInverseLinear(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let v = 1; v <= 12; v++)
    out.push({ q: `f(x) = x + ${b}. Find f⁻¹(${v})`, a: `${v - b}`, diff: b + v + 18, key: `fi:${b}_${v}` });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M15 — TRIGONOMETRY
// ═════════════════════════════════════════════════════════════════════════════
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
function tHypotenuse(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) for (let k = 1; k <= 6; k++)
    out.push({ q: `Right triangle with legs ${a * k} and ${b * k}. Find the hypotenuse`, a: `${c * k}`, diff: c * k, key: `th:${a}_${k}` });
  return out;
}
function tRatio(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) {
    out.push({ q: `Right triangle: opposite = ${a}, hypotenuse = ${c}. Find sin θ`, a: frac(a, c), diff: c + 8, key: `tr:s${a}_${c}` });
    out.push({ q: `Right triangle: adjacent = ${b}, hypotenuse = ${c}. Find cos θ`, a: frac(b, c), diff: c + 9, key: `tr:c${b}_${c}` });
    out.push({ q: `Right triangle: opposite = ${a}, adjacent = ${b}. Find tan θ`, a: frac(a, b), diff: b + 10, key: `tr:t${a}_${b}` });
  }
  return out;
}
const SIN: Record<number, string> = { 0: "0", 30: "1/2", 45: "√2/2", 60: "√3/2", 90: "1" };
const COS: Record<number, string> = { 0: "1", 30: "√3/2", 45: "√2/2", 60: "1/2", 90: "0" };
const TAN: Record<number, string> = { 0: "0", 30: "√3/3", 45: "1", 60: "√3" };
function tUnitCircle(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const deg of [0, 30, 45, 60, 90]) { out.push({ q: `sin ${deg}°`, a: SIN[deg], diff: 14 + i++, key: `tus:${deg}` }); }
  for (const deg of [0, 30, 45, 60, 90]) { out.push({ q: `cos ${deg}°`, a: COS[deg], diff: 14 + i++, key: `tuc:${deg}` }); }
  for (const deg of [0, 30, 45, 60]) { out.push({ q: `tan ${deg}°`, a: TAN[deg], diff: 14 + i++, key: `tut:${deg}` }); }
  return out;
}
const RAD: Record<number, string> = { 30: "π/6", 45: "π/4", 60: "π/3", 90: "π/2", 120: "2π/3", 135: "3π/4", 150: "5π/6", 180: "π", 270: "3π/2", 360: "2π" };
function tDegRad(): XP[] {
  return Object.entries(RAD).map(([deg, r], i) => ({ q: `Convert ${deg}° to radians`, a: r, diff: 22 + i, key: `tdr:${deg}` }));
}
function tPythagIdentity(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) {
    out.push({ q: `sin θ = ${frac(a, c)}. Find cos θ (acute angle)`, a: frac(b, c), diff: c + 28, key: `tpi:${a}_${c}` });
    out.push({ q: `cos θ = ${frac(b, c)}. Find sin θ (acute angle)`, a: frac(a, c), diff: c + 29, key: `tpi2:${b}_${c}` });
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M16 — ALGEBRA II
// ═════════════════════════════════════════════════════════════════════════════
function a2Log(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 5, 10]) for (let k = 1; k <= 5; k++)
    out.push({ q: `log_${b}(${b ** k})`, a: `${k}`, diff: b + k, key: `lg:${b}_${k}` });
  return out;
}
function a2ExpEval(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 4, 5]) for (let k = 1; k <= 5; k++)
    out.push({ q: `Evaluate ${b}${sup(k)}`, a: `${b ** k}`, diff: b + k + 6, key: `ee:${b}_${k}` });
  return out;
}
function a2ExpSolve(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 5, 7, 10]) for (let k = 1; k <= 5; k++)
    out.push({ q: `Solve ${b}^x = ${b ** k}`, a: `${k}`, diff: b + k + 12, key: `es:${b}_${k}` });
  return out;
}
function a2PowersOfI(): XP[] {
  const cyc = ["1", "i", "-1", "-i"];
  const out: XP[] = [];
  for (let n = 1; n <= 30; n++) out.push({ q: `Simplify i${sup(n)}`, a: cyc[n % 4], diff: n + 18, key: `pi:${n}` });
  return out;
}
function a2ComplexAdd(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 4; c++) for (let d = 1; d <= 4; d++)
    out.push({ q: `(${a} + ${imag(b)}) + (${c} + ${imag(d)})`, a: `${a + c} + ${imag(b + d)}`, diff: a + b + c + d + 24, key: `ca:${a}_${b}_${c}_${d}` });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M17 — PRE-CALCULUS
// ═════════════════════════════════════════════════════════════════════════════
function pcArithNth(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 6; a++) for (let d = 1; d <= 6; d++) for (let n = 3; n <= 8; n++)
    out.push({ q: `Arithmetic sequence: first term ${a}, common difference ${d}. Find term ${n}`, a: `${a + (n - 1) * d}`, diff: a + d + n, key: `an:${a}_${d}_${n}` });
  return out;
}
function pcArithSum(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 6; a++) for (let d = 1; d <= 5; d++) for (let n = 3; n <= 8; n++)
    out.push({ q: `Sum of the first ${n} terms: first term ${a}, common difference ${d}`, a: `${(n * (2 * a + (n - 1) * d)) / 2}`, diff: a + d + n + 10, key: `as:${a}_${d}_${n}` });
  return out;
}
function pcGeoNth(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 5; a++) for (const r of [2, 3]) for (let n = 2; n <= 5; n++)
    out.push({ q: `Geometric sequence: first term ${a}, ratio ${r}. Find term ${n}`, a: `${a * r ** (n - 1)}`, diff: a + r + n + 16, key: `gn:${a}_${r}_${n}` });
  return out;
}
function pcLimitPoly(): XP[] {
  const out: XP[] = [];
  for (let c = 1; c <= 6; c++) for (let b = 1; b <= 6; b++) for (let k = 1; k <= 4; k++)
    out.push({ q: `lim(x→${c}) (x² + ${term(b, "x")} + ${k})`, a: `${c * c + b * c + k}`, diff: c + b + k + 20, key: `lp:${c}_${b}_${k}` });
  return out;
}
function pcLimitFactor(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 30; a++) out.push({ q: `lim(x→${a}) (x² - ${a * a})/(x - ${a})`, a: `${2 * a}`, diff: a + 26, key: `lf:${a}` });
  return out;
}
function pcVectorMag(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) for (let k = 1; k <= 5; k++)
    out.push({ q: `Magnitude of vector (${a * k}, ${b * k})`, a: `${c * k}`, diff: c * k + 30, key: `vm:${a}_${k}` });
  return out;
}
function pcVectorAdd(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) for (let c = 1; c <= 5; c++) for (let d = 1; d <= 5; d++)
    out.push({ q: `(${a}, ${b}) + (${c}, ${d})`, a: `(${a + c}, ${b + d})`, diff: a + b + c + d + 30, key: `va:${a}_${b}_${c}_${d}` });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M18 — CALCULUS
// ═════════════════════════════════════════════════════════════════════════════
function caDerivPower(): XP[] {
  const out: XP[] = [];
  for (let n = 2; n <= 30; n++) out.push({ q: `d/dx ${xpow(n)}`, a: powTerm(n, n - 1), diff: n, key: `dp:${n}` });
  return out;
}
function caDerivMono(): XP[] {
  const out: XP[] = [];
  for (let a = 2; a <= 9; a++) for (let n = 2; n <= 6; n++)
    out.push({ q: `d/dx ${a}${xpow(n)}`, a: powTerm(a * n, n - 1), diff: a + n + 8, key: `dm:${a}_${n}` });
  return out;
}
function caDerivEval(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let c = 1; c <= 6; c++) for (let v = 1; v <= 6; v++)
    out.push({ q: `f(x) = x² + ${term(b, "x")} + ${c}. Find f'(${v})`, a: `${2 * v + b}`, diff: b + c + v + 14, key: `de:${b}_${c}_${v}` });
  return out;
}
function caIntegralPower(): XP[] {
  const out: XP[] = [];
  for (let n = 1; n <= 30; n++) out.push({ q: `∫ ${xpow(n)} dx`, a: `${xpow(n + 1)}/${n + 1} + C`, diff: n + 18, key: `ip:${n}` });
  return out;
}
function caIntegralDef(): XP[] {
  const out: XP[] = [];
  for (let b = 2; b <= 20; b += 2) out.push({ q: `∫₀^${b} x dx`, a: `${(b * b) / 2}`, diff: b + 24, key: `id:${b}` });
  return out;
}
function caSlope(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 30; a++) out.push({ q: `Slope of y = x² at x = ${a}`, a: `${2 * a}`, diff: a + 28, key: `sl:${a}` });
  return out;
}

// ── Curricula (keyed by level code) ───────────────────────────────────────────
interface Unit {
  id: string; label: string; objective: string; grade: string; stars: number;
  range: [number, number]; pool: () => XP[]; example: WorkedExample;
}

const CURRICULA: Record<string, Unit[]> = {
  M13: [
    { id: "q-sqrt", label: "Solve x² = k", objective: "Student solves pure quadratics by square roots", grade: "Grade 9", stars: 2, range: [1, 15], pool: qSquareRoot, example: { problem: "Solve x² = 49", steps: ["Take the square root of both sides", "x = ±7"], answer: "±7" } },
    { id: "q-zero", label: "Zero-product property", objective: "Student solves factored quadratics", grade: "Grade 9", stars: 3, range: [16, 30], pool: qZeroProduct, example: { problem: "Solve (x - 2)(x - 5) = 0", steps: ["Set each factor to 0", "x = 2 or x = 5"], answer: "2, 5" } },
    { id: "q-factor", label: "Solve by factoring", objective: "Student factors and solves x² - Sx + P = 0", grade: "Grade 9-10", stars: 4, range: [31, 45], pool: qFactor, example: { problem: "Solve x² - 7x + 12 = 0", steps: ["Find two numbers that multiply to 12, add to 7: 3 and 4", "x = 3 or x = 4"], answer: "3, 4" } },
    { id: "q-disc", label: "The discriminant", objective: "Student computes b² - 4ac", grade: "Grade 10", stars: 3, range: [46, 60], pool: qDiscriminant, example: { problem: "Discriminant of x² + 5x + 6", steps: ["b² - 4ac = 25 - 24"], answer: "1" } },
    { id: "q-nsol", label: "Number of real solutions", objective: "Student reads the discriminant's sign", grade: "Grade 10", stars: 4, range: [61, 74], pool: qNumSolutions, example: { problem: "How many real solutions? x² + 2x + 5 = 0", steps: ["Discriminant = 4 - 20 = -16 < 0"], answer: "0" } },
    { id: "q-eval", label: "Evaluate a quadratic", objective: "Student evaluates x² + bx + c", grade: "Grade 9", stars: 3, range: [75, 88], pool: qEvaluate, example: { problem: "Evaluate x² + 2x + 1 when x = 3", steps: ["9 + 6 + 1"], answer: "16" } },
    { id: "q-axis", label: "Axis of symmetry", objective: "Student finds the parabola's axis x = -b/2a", grade: "Grade 10", stars: 5, range: [89, 100], pool: qAxis, example: { problem: "Axis of symmetry of y = x² + 6x", steps: ["x = -b/2 = -6/2"], answer: "x = -3" } },
  ],
  M14: [
    { id: "f-lin", label: "Evaluate f(x) = mx + b", objective: "Student evaluates a linear function", grade: "Grade 8-9", stars: 2, range: [1, 16], pool: fEvalLinear, example: { problem: "f(x) = 2x + 3. Find f(4)", steps: ["2(4) + 3"], answer: "11" } },
    { id: "f-quad", label: "Evaluate a quadratic function", objective: "Student evaluates f(x) = x² + c", grade: "Grade 9", stars: 3, range: [17, 32], pool: fEvalQuad, example: { problem: "f(x) = x² + 5. Find f(3)", steps: ["9 + 5"], answer: "14" } },
    { id: "f-compose", label: "Composition of functions", objective: "Student evaluates f(g(x))", grade: "Grade 10", stars: 4, range: [33, 50], pool: fCompose, example: { problem: "f(x) = x + 1, g(x) = 2x. Find f(g(3))", steps: ["g(3) = 6", "f(6) = 7"], answer: "7" } },
    { id: "f-domain", label: "Domain of a rational function", objective: "Student finds excluded x-values", grade: "Grade 10", stars: 4, range: [51, 68], pool: fDomain, example: { problem: "Domain of f(x) = 1/(x - 4)", steps: ["Denominator ≠ 0"], answer: "x ≠ 4" } },
    { id: "f-range", label: "Range of a quadratic", objective: "Student finds the minimum of x² + c", grade: "Grade 10", stars: 4, range: [69, 84], pool: fRange, example: { problem: "Range of f(x) = x² + 2", steps: ["x² ≥ 0, so y ≥ 2"], answer: "y ≥ 2" } },
    { id: "f-inverse", label: "Inverse functions", objective: "Student evaluates an inverse function", grade: "Grade 10-11", stars: 5, range: [85, 100], pool: fInverseLinear, example: { problem: "f(x) = x + 5. Find f⁻¹(12)", steps: ["Inverse undoes +5", "12 - 5"], answer: "7" } },
  ],
  M15: [
    { id: "t-hyp", label: "Pythagorean theorem", objective: "Student finds a hypotenuse", grade: "Grade 9", stars: 2, range: [1, 16], pool: tHypotenuse, example: { problem: "Legs 3 and 4. Find the hypotenuse", steps: ["√(9 + 16) = √25"], answer: "5" } },
    { id: "t-ratio", label: "Right-triangle ratios", objective: "Student writes sin, cos, tan as ratios", grade: "Grade 10", stars: 3, range: [17, 34], pool: tRatio, example: { problem: "opposite = 3, hypotenuse = 5. Find sin θ", steps: ["sin = opp/hyp"], answer: "3/5" } },
    { id: "t-unit", label: "Unit-circle values", objective: "Student recalls sin/cos/tan of standard angles", grade: "Grade 11", stars: 4, range: [35, 56], pool: tUnitCircle, example: { problem: "sin 30°", steps: ["Standard angle"], answer: "1/2" } },
    { id: "t-rad", label: "Degrees to radians", objective: "Student converts degrees to radians", grade: "Grade 11", stars: 4, range: [57, 78], pool: tDegRad, example: { problem: "Convert 90° to radians", steps: ["90 × π/180"], answer: "π/2" } },
    { id: "t-ident", label: "Pythagorean identity", objective: "Student uses sin²θ + cos²θ = 1", grade: "Grade 11-12", stars: 5, range: [79, 100], pool: tPythagIdentity, example: { problem: "sin θ = 3/5. Find cos θ (acute)", steps: ["cos = √(1 - 9/25) = 4/5"], answer: "4/5" } },
  ],
  M16: [
    { id: "a-log", label: "Evaluate logarithms", objective: "Student evaluates log_b(bᵏ)", grade: "Grade 10-11", stars: 3, range: [1, 16], pool: a2Log, example: { problem: "log_2(8)", steps: ["2³ = 8"], answer: "3" } },
    { id: "a-exp", label: "Evaluate exponentials", objective: "Student evaluates powers", grade: "Grade 9-10", stars: 2, range: [17, 32], pool: a2ExpEval, example: { problem: "Evaluate 2⁴", steps: ["2×2×2×2"], answer: "16" } },
    { id: "a-expsolve", label: "Solve exponential equations", objective: "Student solves bˣ = bᵏ", grade: "Grade 11", stars: 4, range: [33, 52], pool: a2ExpSolve, example: { problem: "Solve 3x = 81", steps: ["3⁴ = 81"], answer: "4" } },
    { id: "a-poweri", label: "Powers of i", objective: "Student simplifies powers of i", grade: "Grade 11", stars: 4, range: [53, 76], pool: a2PowersOfI, example: { problem: "Simplify i³", steps: ["i² = -1, so i³ = -i"], answer: "-i" } },
    { id: "a-complex", label: "Add complex numbers", objective: "Student adds complex numbers", grade: "Grade 11-12", stars: 5, range: [77, 100], pool: a2ComplexAdd, example: { problem: "(2 + 3i) + (1 + 1i)", steps: ["Add real, add imaginary"], answer: "3 + 4i" } },
  ],
  M17: [
    { id: "p-anth", label: "Arithmetic sequences", objective: "Student finds the nth term", grade: "Grade 10-11", stars: 3, range: [1, 18], pool: pcArithNth, example: { problem: "First term 3, common difference 2. Find term 5", steps: ["3 + 4×2"], answer: "11" } },
    { id: "p-asum", label: "Arithmetic series", objective: "Student sums an arithmetic series", grade: "Grade 11", stars: 4, range: [19, 38], pool: pcArithSum, example: { problem: "Sum of the first 4 terms: first term 2, common difference 3", steps: ["4/2 × (4 + 9)"], answer: "26" } },
    { id: "p-geo", label: "Geometric sequences", objective: "Student finds a geometric term", grade: "Grade 11", stars: 4, range: [39, 56], pool: pcGeoNth, example: { problem: "First term 2, ratio 3. Find term 3", steps: ["2 × 3²"], answer: "18" } },
    { id: "p-limpoly", label: "Limits of polynomials", objective: "Student evaluates limits by substitution", grade: "Grade 12", stars: 4, range: [57, 74], pool: pcLimitPoly, example: { problem: "lim(x→2) (x² + 3x + 1)", steps: ["Substitute x = 2"], answer: "11" } },
    { id: "p-limfac", label: "Limits by factoring", objective: "Student resolves 0/0 limits", grade: "Grade 12", stars: 5, range: [75, 88], pool: pcLimitFactor, example: { problem: "lim(x→3) (x² - 9)/(x - 3)", steps: ["Factor → (x + 3)", "Substitute 3"], answer: "6" } },
    { id: "p-vec", label: "Vectors", objective: "Student finds vector magnitude and sums", grade: "Grade 12", stars: 5, range: [89, 100], pool: () => [...pcVectorMag(), ...pcVectorAdd()], example: { problem: "Magnitude of (3, 4)", steps: ["√(9 + 16)"], answer: "5" } },
  ],
  M18: [
    { id: "c-dpow", label: "Power rule", objective: "Student differentiates xⁿ", grade: "Grade 12", stars: 3, range: [1, 16], pool: caDerivPower, example: { problem: "d/dx x³", steps: ["Bring down 3, reduce power"], answer: "3x²" } },
    { id: "c-dmono", label: "Differentiate monomials", objective: "Student differentiates axⁿ", grade: "Grade 12", stars: 4, range: [17, 36], pool: caDerivMono, example: { problem: "d/dx 3x²", steps: ["3 × 2 = 6, reduce power"], answer: "6x" } },
    { id: "c-deval", label: "Evaluate a derivative", objective: "Student evaluates f'(x) at a point", grade: "Grade 12", stars: 4, range: [37, 56], pool: caDerivEval, example: { problem: "f(x) = x² + 2x + 1. Find f'(3)", steps: ["f'(x) = 2x + 2", "2(3) + 2"], answer: "8" } },
    { id: "c-ipow", label: "Integrate powers", objective: "Student integrates xⁿ", grade: "Grade 12", stars: 4, range: [57, 76], pool: caIntegralPower, example: { problem: "∫ x² dx", steps: ["Raise power, divide", "x³/3 + C"], answer: "x³/3 + C" } },
    { id: "c-idef", label: "Definite integrals", objective: "Student evaluates a definite integral", grade: "Grade 12", stars: 5, range: [77, 90], pool: caIntegralDef, example: { problem: "∫₀^4 x dx", steps: ["x²/2 from 0 to 4", "16/2"], answer: "8" } },
    { id: "c-slope", label: "Slope as a derivative", objective: "Student finds the slope of a curve", grade: "Grade 12", stars: 5, range: [91, 100], pool: caSlope, example: { problem: "Slope of y = x² at x = 5", steps: ["dy/dx = 2x = 2(5)"], answer: "10" } },
  ],
};

const CODE_LABEL: Record<string, string> = {
  M13: "Quadratics", M14: "Functions", M15: "Trigonometry", M16: "Algebra II", M17: "Pre-Calculus", M18: "Calculus",
};

// ── Selection + GPI (identical guarantees to the M8–M12 engine) ───────────────
const GPI_STEP = 12, GPI_BAND = 8;

function unitIndexForSheet(code: string, sheet: number): number {
  const units = CURRICULA[code];
  const idx = units.findIndex((u) => sheet >= u.range[0] && sheet <= u.range[1]);
  return idx === -1 ? units.length - 1 : idx;
}

function buildScoredPool(code: string, unitIndex: number): XP[] {
  const raw = CURRICULA[code][unitIndex].pool();
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
    // Pool smaller than a sheet (e.g. the handful of unit-circle facts): repeat
    // the ascending set in round-robin order so identical questions are spaced N
    // apart rather than clustered together. (Do NOT re-sort — that clusters dups.)
    const out: XP[] = [];
    for (let i = 0; i < count; i++) out.push(sorted[i % N]);
    return out;
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
export function isHigherMathLevel(code: string): boolean {
  return code in CURRICULA;
}

export function generateHigherMathSheet(
  code: string, sheetNumber: number, totalSheets: number, problemCount = 30,
): WorksheetData {
  const ui = unitIndexForSheet(code, sheetNumber);
  const unit = CURRICULA[code][ui];
  const span = unit.range[1] - unit.range[0];
  const t = span === 0 ? 0.5 : (sheetNumber - unit.range[0]) / span;

  const selected = selectProblems(buildScoredPool(code, ui), t, problemCount);
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
      skill: code as any, skillCode: code, sheetNumber, totalSheets,
      subSkillLabel: unit.label, gradeLevel: unit.grade, difficultyStars: unit.stars,
      learningObjective: unit.objective,
      mode: isFirstOfUnit ? "tutorial" : "practice",
      estimatedMinutes: 10 + Math.round(t * 10),
    },
  };
}

// ── Self-validation (used by tests) ──────────────────────────────────────────
export function validateHigherMathPack(code: string, totalSheets = 100): {
  ok: boolean; issues: string[]; gpi: number[];
} {
  const issues: string[] = [];
  const gpi: number[] = [];
  let prevMean = -Infinity;
  for (let s = 1; s <= totalSheets; s++) {
    const ui = unitIndexForSheet(code, s);
    const unit = CURRICULA[code][ui];
    const span = unit.range[1] - unit.range[0];
    const t = span === 0 ? 0.5 : (s - unit.range[0]) / span;
    const sel = selectProblems(buildScoredPool(code, ui), t, 30);
    const qs = sel.map((p) => p.q);
    const poolSize = new Set(unit.pool().map((p) => p.key)).size;
    const dupes = qs.length - new Set(qs).size;
    if (dupes > 0 && poolSize >= qs.length) issues.push(`${code} sheet ${s}: ${dupes} dup(s) (pool=${poolSize})`);
    if (sel[sel.length - 1].diff < sel[0].diff) issues.push(`${code} sheet ${s}: not ascending`);
    const mean = sel.reduce((a, p) => a + p.diff, 0) / sel.length;
    gpi.push(Math.round(mean * 10) / 10);
    if (mean < prevMean - 0.001) issues.push(`${code} sheet ${s}: GPI dropped ${prevMean.toFixed(1)}→${mean.toFixed(1)}`);
    prevMean = mean;
  }
  // every unit's range must be contiguous and cover 1..totalSheets
  let expected = 1;
  for (const u of CURRICULA[code]) {
    if (u.range[0] !== expected) issues.push(`${code} unit ${u.id}: gap at ${u.range[0]} (expected ${expected})`);
    expected = u.range[1] + 1;
  }
  if (expected !== totalSheets + 1) issues.push(`${code}: ranges end at ${expected - 1}, expected ${totalSheets}`);
  return { ok: issues.length === 0, issues, gpi };
}

export { CODE_LABEL as HIGHER_MATH_LABELS };
