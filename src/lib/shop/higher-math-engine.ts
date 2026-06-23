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

interface XP {
  q: string; a: string; diff: number; key: string;
  // Multi-format authoring (M13). Older units omit these → plain short-answer.
  type?: "short_answer" | "multiple_choice" | "true_false";
  options?: string[];
  fmt?: string; // human label for the format (variety accounting / debugging)
}

// ── Seeded RNG + deterministic shuffle (per sheet, so regeneration is stable) ──
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Order options deterministically per key so the correct answer isn't always in
// the same position, but a re-fetch of the same problem is stable.
function shuffleByKey<T>(arr: T[], key: string): T[] {
  const rng = mulberry32(hashStr(key));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Build a multiple-choice XP. Distractors are de-duplicated against the correct
// answer AND each other (collision guard — no "A. x²=1  B. x²=1"); extras are
// dropped and we keep up to 4 distinct options. Returns null if we cannot field
// at least 3 distinct options, so callers can skip a degenerate item.
function mcXP(
  key: string, fmt: string, q: string, correct: string, rawDistractors: string[], diff: number,
): XP | null {
  const opts: string[] = [correct];
  for (const d of rawDistractors) {
    if (opts.length >= 4) break;
    if (!opts.includes(d)) opts.push(d);
  }
  if (opts.length < 3) return null;
  return { q, a: correct, diff, key, type: "multiple_choice", fmt, options: shuffleByKey(opts, key) };
}
function tfXP(key: string, q: string, correct: "True" | "False", diff: number): XP {
  return { q, a: correct, diff, key, type: "true_false", fmt: "true/false", options: ["True", "False"] };
}

// ═════════════════════════════════════════════════════════════════════════════
// M13 — QUADRATICS  (multi-format, hundreds of variants per micro-skill)
// Each micro-skill teaches ONE idea through many representations: direct solve,
// missing-value, multiple choice, true/false, find-the-mistake, find-the-equation,
// complete-the-pattern, match-as-MC. Difficulty rises by reasoning, not by number
// size. All MC options are VALUES (graded by a plain match); distractors are
// collision-guarded.
// ═════════════════════════════════════════════════════════════════════════════
const isPerfectSquare = (n: number): boolean => Number.isInteger(Math.sqrt(n));

// ── Micro-skill 1: recognize perfect squares & square roots ──
function qRecognize(): XP[] {
  const out: XP[] = [];
  for (let n = 1; n <= 20; n++) {
    const k = n * n;
    out.push(tfXP(`rec:tf:${k}`, `Is ${k} a perfect square?`, "True", 1 + n * 0.05));
    const near = k + (n % 2 === 0 ? 1 : -1);
    if (near > 0 && !isPerfectSquare(near))
      out.push(tfXP(`rec:tfn:${near}`, `Is ${near} a perfect square?`, "False", 1 + n * 0.05));
    out.push({ q: `What is the square root of ${k}?`, a: `${n}`, diff: 1 + n * 0.05, key: `rec:sqrt:${n}`, type: "short_answer", fmt: "square-root" });
  }
  // "which is a perfect square?" MC
  for (let n = 2; n <= 12; n++) {
    const k = n * n;
    const mc = mcXP(`rec:mc:${n}`, "which-is-square", "Which of these is a perfect square?",
      `${k}`, [`${k + 1}`, `${k - 1}`, `${k + 2}`], 1.5 + n * 0.05);
    if (mc) out.push(mc);
  }
  return out;
}

// ── Micro-skill 2: solve x² = k for perfect squares (the user's spec) ──
function qSolvePerfect(): XP[] {
  const out: XP[] = [];
  for (let n = 1; n <= 12; n++) {
    const k = n * n;
    const d = 2 + n * 0.12;
    out.push({ q: `Solve x² = ${k}`, a: `±${n}`, diff: d, key: `sp:dir:${n}`, type: "short_answer", fmt: "direct" });
    out.push({ q: `Solve x² = ${k}. Fill in the missing value:  x = ±___`, a: `${n}`, diff: d, key: `sp:miss:${n}`, type: "short_answer", fmt: "missing-value" });
    const mc = mcXP(`sp:mc:${n}`, "multiple-choice", `Solve x² = ${k}. Which is correct?`,
      `±${n}`, [`${n}`, `-${n}`, `±${2 * n}`], d + 0.4);
    if (mc) out.push(mc);
    out.push(tfXP(`sp:tf:${n}`, `If x² = ${k}, then x = ${n} is the ONLY solution. True or False?`, "False", d + 0.4));
    const mis = mcXP(`sp:mis:${n}`, "find-the-mistake",
      `A student solved x² = ${k} and wrote x = ${n}. What is the mistake?`,
      "Forgot the negative solution", ["Multiplied incorrectly", "Used the wrong square root", "No mistake"], d + 0.6);
    if (mis) out.push(mis);
    // find-the-equation (collision-guarded: skip the n=1 degenerate where k≈n)
    const fe = mcXP(`sp:fe:${n}`, "find-the-equation", `Which equation has the solution x = ±${n}?`,
      `x² = ${k}`, [`x² = ${n}`, `x² = ${k + 1}`, `x² = ${2 * k}`], d + 0.6);
    if (fe) out.push(fe);
    // match-as-MC
    const ma = mcXP(`sp:ma:${n}`, "match→MC", `Match x² = ${k} to its solution.`,
      `±${n}`, [`±${n - 1}`, `±${n + 1}`, `${n}`], d + 0.5);
    if (ma) out.push(ma);
  }
  // complete-the-pattern
  for (let n = 3; n <= 12; n++)
    out.push({ q: `Complete the pattern:  x²=${(n - 2) ** 2} → x=±${n - 2};  x²=${(n - 1) ** 2} → x=±${n - 1};  x²=${n * n} → x=±___`, a: `${n}`, diff: 3 + n * 0.1, key: `sp:pat:${n}`, type: "short_answer", fmt: "pattern" });
  return out;
}

// ── Micro-skill 3: larger & non-perfect squares — estimate, compare, simplify ──
const SIMPLIFY: [number, string][] = [
  [8, "2√2"], [12, "2√3"], [18, "3√2"], [20, "2√5"], [27, "3√3"], [32, "4√2"],
  [45, "3√5"], [48, "4√3"], [50, "5√2"], [72, "6√2"], [75, "5√3"], [98, "7√2"], [200, "10√2"],
];
function qLargerNonPerfect(): XP[] {
  const out: XP[] = [];
  for (let n = 13; n <= 20; n++) {
    const k = n * n, d = 4 + (n - 13) * 0.1;
    out.push({ q: `Solve x² = ${k}`, a: `±${n}`, diff: d, key: `ln:dir:${n}`, type: "short_answer", fmt: "direct" });
    out.push({ q: `Solve x² = ${k}. Fill in the missing value:  x = ±___`, a: `${n}`, diff: d, key: `ln:miss:${n}`, type: "short_answer", fmt: "missing-value" });
  }
  for (const [k, a] of SIMPLIFY)
    out.push({ q: `Simplify the square root of ${k}.`, a, diff: 5 + k * 0.002, key: `ln:simp:${k}`, type: "short_answer", fmt: "simplify" });
  for (const k of [5, 7, 10, 11, 13, 17, 19, 23, 29, 31, 37, 43]) {
    const lo = Math.floor(Math.sqrt(k));
    const near = (k - lo * lo) < ((lo + 1) ** 2 - k) ? lo : lo + 1;
    const mc = mcXP(`ln:est:${k}`, "estimate", `Estimate the square root of ${k} to the nearest whole number.`,
      `${near}`, [`${lo}`, `${lo + 1}`, `${lo + 2}`].filter((x) => x !== `${near}`), 5.5 + k * 0.003);
    if (mc) out.push(mc);
  }
  for (const [a, b] of [[10, 17], [26, 37], [50, 65], [82, 101], [40, 55]]) {
    const mc = mcXP(`ln:cmp:${a}_${b}`, "compare", `Which is larger: the square root of ${a} or the square root of ${b}?`,
      `the square root of ${b}`, [`the square root of ${a}`, "They are equal"], 5.5);
    if (mc) out.push(mc);
  }
  return out;
}

// ── Micro-skill 4: zero-product property ──
function qZeroProduct(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) {
    const ans = a === b ? `${a}` : `${a}, ${b}`, d = 6 + (a + b) * 0.1;
    out.push({ q: `Solve (x - ${a})(x - ${b}) = 0`, a: ans, diff: d, key: `zp:dir:${a}_${b}`, type: "short_answer", fmt: "direct" });
    if (a !== b) {
      const mc = mcXP(`zp:mc:${a}_${b}`, "multiple-choice", `Solve (x - ${a})(x - ${b}) = 0. Which is correct?`,
        `${a}, ${b}`, [`${-a}, ${-b}`, `${a}, ${-b}`, `${a + b}`], d + 0.3);
      if (mc) out.push(mc);
    }
  }
  for (let a = 1; a <= 9; a++) {
    out.push(tfXP(`zp:tf:${a}`, `Is x = ${a} a solution of (x - ${a})(x + 2) = 0?  True or False?`, "True", 6.2 + a * 0.05));
  }
  return out;
}

// ── Micro-skill 5: solve by factoring ──
function qFactor(): XP[] {
  const out: XP[] = [];
  for (let p = 1; p <= 9; p++) for (let q = p; q <= 9; q++) {
    const s = p + q, prod = p * q, ans = p === q ? `${p}` : `${p}, ${q}`, d = 7 + (s + prod / 4) * 0.05;
    out.push({ q: `Solve x² - ${s}x + ${prod} = 0`, a: ans, diff: d, key: `fac:dir:${p}_${q}`, type: "short_answer", fmt: "direct" });
    if (p !== q) {
      const mc = mcXP(`fac:fe:${p}_${q}`, "find-the-equation",
        `For which value of k can x² + kx + ${prod} be factored as (x + ${p})(x + ${q})?`,
        `k = ${s}`, [`k = ${prod}`, `k = ${-s}`, `k = ${Math.abs(p - q) || prod}`], d + 0.4);
      if (mc) out.push(mc);
    }
  }
  return out;
}

// ── Micro-skill 6: the discriminant & number of real solutions ──
function qDiscriminant(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let c = 1; c <= 9; c++) {
    const disc = b * b - 4 * c, d = 8 + (b + c) * 0.05;
    out.push({ q: `Find the discriminant of x² + ${term(b, "x")} + ${c}`, a: `${disc}`, diff: d, key: `disc:dir:${b}_${c}`, type: "short_answer", fmt: "direct" });
    const ns = disc > 0 ? "2" : disc === 0 ? "1" : "0";
    const mc = mcXP(`disc:ns:${b}_${c}`, "multiple-choice",
      `How many real solutions does x² + ${term(b, "x")} + ${c} = 0 have?`,
      ns, ["0", "1", "2"].filter((x) => x !== ns), d + 0.3);
    if (mc) out.push(mc);
  }
  return out;
}

// ── Micro-skill 7: evaluate quadratics & axis of symmetry (mixed mastery) ──
function qEvaluateAxis(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) for (let v = 1; v <= 6; v++)
    out.push({ q: `Evaluate x² + ${term(b, "x")} + ${c} when x = ${v}`, a: `${v * v + b * v + c}`, diff: 9 + (b + c + v) * 0.03, key: `ev:${b}_${c}_${v}`, type: "short_answer", fmt: "evaluate" });
  for (let b = 2; b <= 40; b += 2)
    out.push({ q: `Find the axis of symmetry of y = x² + ${b}x.`, a: `x = ${-b / 2}`, diff: 9.5 + b * 0.02, key: `ax:${b}`, type: "short_answer", fmt: "axis" });
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
  /** Multi-format micro-skill (M13): use format-aware, seeded selection so a
   *  sheet mixes representations and never floods one format. */
  multiFormat?: boolean;
}

const CURRICULA: Record<string, Unit[]> = {
  M13: [
    { id: "q-recognize", label: "Perfect squares & square roots", objective: "Student recognizes perfect squares and finds square roots", grade: "Grade 9", stars: 1, range: [1, 12], multiFormat: true, pool: qRecognize, example: { problem: "Is 49 a perfect square?", steps: ["7 × 7 = 49, so yes", "√49 = 7"], answer: "True" } },
    { id: "q-solve-perfect", label: "Solve x² = k (perfect squares)", objective: "Student solves x² = k and finds BOTH the positive and negative root", grade: "Grade 9", stars: 2, range: [13, 30], multiFormat: true, pool: qSolvePerfect, example: { problem: "Solve x² = 49", steps: ["Take the square root of both sides", "Remember both signs", "x = ±7"], answer: "±7" } },
    { id: "q-larger", label: "Larger, estimate & simplify roots", objective: "Student solves larger squares and estimates/simplifies non-perfect roots", grade: "Grade 9-10", stars: 3, range: [31, 48], multiFormat: true, pool: qLargerNonPerfect, example: { problem: "Simplify the square root of 50.", steps: ["50 = 25 × 2", "√25 × √2 = 5√2"], answer: "5√2" } },
    { id: "q-zero", label: "Zero-product property", objective: "Student solves factored quadratics", grade: "Grade 9", stars: 3, range: [49, 62], multiFormat: true, pool: qZeroProduct, example: { problem: "Solve (x - 2)(x - 5) = 0", steps: ["Set each factor to 0", "x = 2 or x = 5"], answer: "2, 5" } },
    { id: "q-factor", label: "Solve by factoring", objective: "Student factors and solves x² - Sx + P = 0", grade: "Grade 9-10", stars: 4, range: [63, 76], multiFormat: true, pool: qFactor, example: { problem: "Solve x² - 7x + 12 = 0", steps: ["Find two numbers that multiply to 12, add to 7: 3 and 4", "x = 3 or x = 4"], answer: "3, 4" } },
    { id: "q-disc", label: "Discriminant & # of solutions", objective: "Student computes b² - 4ac and reads its sign", grade: "Grade 10", stars: 4, range: [77, 90], multiFormat: true, pool: qDiscriminant, example: { problem: "How many real solutions? x² + 2x + 5 = 0", steps: ["b² - 4ac = 4 - 20 = -16", "Negative → no real solutions"], answer: "0" } },
    { id: "q-evalaxis", label: "Evaluate & axis of symmetry", objective: "Student evaluates quadratics and finds the axis x = -b/2a", grade: "Grade 10", stars: 5, range: [91, 100], multiFormat: true, pool: qEvaluateAxis, example: { problem: "Axis of symmetry of y = x² + 6x", steps: ["x = -b/2 = -6/2"], answer: "x = -3" } },
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

// Format-aware selection for multi-format micro-skills (M13). Picks an ascending
// difficulty window (so the unit's reasoning progresses), shuffles within equal
// difficulty (seeded → unpredictable order but stable per sheet), and caps any
// single format so a sheet always MIXES representations instead of flooding one.
function selectMultiFormat(pool: XP[], t: number, count: number, seed: number): XP[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  const uniq = pool.filter((p) => (seen.has(p.key) ? false : (seen.add(p.key), true)));
  // shuffle, then stable-sort by difficulty → random order within equal-diff ties
  for (let i = uniq.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [uniq[i], uniq[j]] = [uniq[j], uniq[i]]; }
  const sorted = uniq.sort((a, b) => a.diff - b.diff);
  const N = sorted.length;
  if (N <= count) { const out: XP[] = []; for (let i = 0; i < count; i++) out.push(sorted[i % N]); return out; }
  // Keep the window only modestly larger than a sheet so it SLIDES a long way as
  // t grows → consecutive sheets in the same micro-skill draw largely different
  // questions (high cross-sheet variety) while difficulty still rises with t.
  const W = Math.min(N, Math.max(count + 6, Math.round(N * 0.45)));
  const start = Math.round(t * (N - W));
  const win = sorted.slice(start, start + W);
  const cap = Math.max(3, Math.ceil(count / 3)); // ≤ ~1/3 of a sheet per format
  const counts: Record<string, number> = {};
  const usedText = new Set<string>();           // never repeat a STEM within a sheet
  const out: XP[] = [];
  for (const v of win) {
    const f = v.fmt ?? "_";
    if (usedText.has(v.q)) continue;            // same stem (e.g. MC with new options) → skip
    if ((counts[f] ?? 0) >= cap) continue;
    counts[f] = (counts[f] ?? 0) + 1;
    usedText.add(v.q);
    out.push(v);
    if (out.length >= count) break;
  }
  // If caps left us short (narrow window), backfill ignoring the cap (still no
  // repeated stems).
  if (out.length < count) {
    for (const v of win) { if (usedText.has(v.q)) continue; usedText.add(v.q); out.push(v); if (out.length >= count) break; }
  }
  return out.sort((a, b) => a.diff - b.diff);
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

  const scored = buildScoredPool(code, ui);
  // Multi-format micro-skills use seeded, format-aware selection (deterministic
  // per sheet so self-heal/regeneration stays stable). Single-format units keep
  // the original spread selection.
  const selected = unit.multiFormat
    ? selectMultiFormat(scored, t, problemCount, hashStr(`${code}:${sheetNumber}`))
    : selectProblems(scored, t, problemCount);
  const problems = selected.map((p, i) => ({
    id: nanoid(8),
    type: (p.type ?? "short_answer") as "short_answer" | "multiple_choice" | "true_false",
    question: p.q, answer: p.a, points: 1,
    ...(p.options ? { options: p.options } : {}),
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
    // Validate the SAME selection path the engine actually uses for this unit.
    const scored = buildScoredPool(code, ui);
    const sel = unit.multiFormat
      ? selectMultiFormat(scored, t, 30, hashStr(`${code}:${s}`))
      : selectProblems(scored, t, 30);
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

// ── Per-micro-skill lesson (for the pre-practice tutorial) ────────────────────
// The tutorial a student sees must teach the micro-skill they're about to
// practice (council rule: the worked example must match the first question's
// type). These big ideas pair with each M13 unit's objective + worked example.
const M13_BIGIDEA: Record<string, string> = {
  "q-recognize": "A perfect square is a whole number times itself; its square root is that number.",
  "q-solve-perfect": "If x² = k, then x = ±√k — every positive number has TWO square roots, one positive and one negative.",
  "q-larger": "Pull out the largest perfect-square factor to simplify a root; estimate by finding the nearest perfect squares.",
  "q-zero": "If two factors multiply to zero, at least one of them must be zero.",
  "q-factor": "Factor the quadratic into two binomials, then set each factor equal to zero.",
  "q-disc": "The discriminant b² − 4ac reveals the number of real solutions: positive → 2, zero → 1, negative → 0.",
  "q-evalaxis": "A parabola is symmetric about the vertical line x = −b/2a.",
};

export interface MicroLesson {
  goal: string;
  bigIdea: string;
  example: WorkedExample;
  umbrella: string; // one-line orientation to the parent level
}

/** Resolve a micro-skill's lesson by its practice label (e.g. "Solve x² = k
 *  (perfect squares)"). Returns null if the code/label isn't a higher-math unit. */
export function getHigherMathMicroLesson(code: string, label: string): MicroLesson | null {
  const units = CURRICULA[code];
  if (!units) return null;
  const u = units.find((x) => x.label === label) ?? units.find((x) => label.includes(x.label));
  if (!u) return null;
  return {
    goal: u.objective.replace(/^Student /, "").replace(/^./, (c) => c.toUpperCase()),
    bigIdea: M13_BIGIDEA[u.id] ?? u.objective,
    example: u.example,
    umbrella: CODE_LABEL[code] ?? code,
  };
}
