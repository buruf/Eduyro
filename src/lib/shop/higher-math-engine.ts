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
  // Interactive graphing items (answerType "point"): the answer is the snapped
  // "x,y" string; `interactive` tells the client what plane/curve to render.
  answerType?: string;
  interactive?: { kind: "vertex-drag" | "plot-point" | "plot-line" | "equation-builder" | "angle-drag" | "area-model" | "triangle-drag"; a?: number; curve?: { a: number; h: number; k: number }; line?: { m: number; b: number }; binomial?: { a: number; b: number }; xRange: [number, number]; yRange: [number, number]; snap: number };
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

// Turn a single-format pool (plain "direct" short-answer items) into a
// multi-format one: keeps every direct item AND adds a multiple-choice variant
// for ~half of them, using NEARBY answers as plausible same-shape distractors
// (collision-guarded). One generic mechanism so every M14–M18 micro-skill mixes
// representations — direct entry + reasoning-style MC — instead of one repeated
// format. (M13 authors its own richer formats and does NOT use this.)
function diversify(base: XP[]): XP[] {
  return base.map((b, i) => {
    // CONVERT every other item to multiple choice (don't add a twin — that would
    // duplicate the question text and could put both on one sheet). MC keeps the
    // SAME difficulty so the unit's difficulty curve is unchanged.
    if (i % 2 === 0) {
      const near: string[] = [];
      for (const d of [1, -1, 2, -2, 3, -3, 4]) {
        const j = i + d;
        if (j >= 0 && j < base.length) { const a = base[j].a; if (a !== b.a && !near.includes(a)) near.push(a); }
        if (near.length >= 3) break;
      }
      const mc = mcXP(`${b.key}:mc`, "multiple-choice", b.q, b.a, near, b.diff);
      if (mc) return mc;
    }
    return { ...b, type: b.type ?? "short_answer", fmt: b.fmt ?? "direct" };
  });
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

// ── Micro-skill 0: Meet the parabola — an interactive hands-on intro. Students
// DRAG the vertex to a target point on a live coordinate plane, so M13 opens
// with a visual, exploratory hook before any symbolic work. Graded by value
// ("x,y"); the matching lesson is a free-explore demo of the same plane. ──
function qMeetParabola(): XP[] {
  const out: XP[] = [];
  let i = 0;
  // (a) Plot a point on the coordinate plane — read/place coordinates.
  for (const [x, y] of [[3, 2], [-2, 1], [1, -3], [-3, -1], [2, 4], [-1, -2]] as [number, number][])
    out.push({
      q: `Plot the point (${x}, ${y}) on the coordinate plane.`,
      a: `${x},${y}`, diff: 0.6 + i++ * 0.02, key: `mp:pt:${x}_${y}`, type: "short_answer", fmt: "plot-point",
      answerType: "point",
      interactive: { kind: "plot-point", xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  // (b) Drag the parabola's vertex to a target (the curve follows the point).
  for (const h of [-3, -2, -1, 0, 1, 2, 3]) for (const k of [-2, -1, 0, 1, 2])
    out.push({
      q: `Drag the orange vertex of the parabola to the point (${h}, ${k}).`,
      a: `${h},${k}`, diff: 1 + i++ * 0.02, key: `mp:${h}_${k}`, type: "short_answer", fmt: "vertex-drag",
      answerType: "point",
      interactive: { kind: "vertex-drag", a: 1, xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  // (c) Read a graph: plot the y-intercept of a shown parabola y = x² + c → (0, c).
  for (const c of [-3, -2, -1, 1, 2, 3])
    out.push({
      q: `The parabola y = x² ${c < 0 ? `− ${-c}` : `+ ${c}`} is shown. Plot its y-intercept.`,
      a: `0,${c}`, diff: 2 + i++ * 0.02, key: `mp:yint:${c}`, type: "short_answer", fmt: "plot-intercept",
      answerType: "point",
      interactive: { kind: "plot-point", curve: { a: 1, h: 0, k: c }, xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  return out;
}

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

// MULTI-SELECT: pick ALL the quadratic equations from a mixed list. Answer = the
// quadratics, sorted + comma-joined (order-independent); options mix quadratics
// with linears, so the answer is a proper subset (→ multiSelect at serve time).
function qSelectQuadratics(): XP[] {
  const quads = ["x² + 1 = 0", "x² − 4 = 0", "x² + 5x = 0", "2x² − 8 = 0", "x² − 9 = 0", "3x² + x = 0"];
  const lins = ["2x + 3 = 0", "5x = 10", "x − 7 = 0", "4x + 1 = 0", "3x = 12", "x + 6 = 0"];
  const out: XP[] = [];
  for (let j = 0; j < 6; j++) {
    const correct = Array.from(new Set([quads[j % quads.length], quads[(j + 2) % quads.length]]));
    if (correct.length < 2) continue;
    const opts = [...correct, lins[j % lins.length], lins[(j + 3) % lins.length]];
    out.push({
      q: `Select all the quadratic equations.`,
      a: [...correct].sort().join(","), diff: 9.7 + j * 0.02, key: `selq:${j}`,
      type: "multiple_choice", options: shuffleByKey(opts, `selq:${j}`), fmt: "multi-select",
    });
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
  // INTERACTIVE: drag the parabola's vertex to a target point. The answer is the
  // snapped "x,y" string; grading reuses the standard value match. Shape a = 1.
  const VERTS: [number, number][] = [
    [2, -3], [-1, 4], [3, 1], [-2, -5], [0, 2], [1, -4], [-3, 2], [4, -1], [-4, -2], [2, 5], [-2, 3], [3, -4],
  ];
  for (const [h, k] of VERTS)
    out.push({
      q: `Drag the vertex of the parabola to the point (${h}, ${k}).`,
      a: `${h},${k}`, diff: 9.3, key: `vd:${h}_${k}`, type: "short_answer", fmt: "vertex-drag",
      answerType: "point",
      interactive: { kind: "vertex-drag", a: 1, xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  // MATCH GRAPH ↔ EQUATION: options are graph descriptors ("parab:a,h,k") shown
  // as thumbnails; the answer is the correct descriptor (plain value match). The
  // distractors are sibling vertices, so every option is a visibly distinct curve.
  const MG: [number, number][] = [[0, 2], [0, -2], [2, 0], [-2, 0], [1, -3], [-1, 3], [2, 1], [-2, -1]];
  for (let mi = 0; mi < MG.length; mi++) {
    const [h, k] = MG[mi];
    const base = h === 0 ? "x" : `(x ${h > 0 ? `− ${h}` : `+ ${-h}`})`;
    const kterm = k === 0 ? "" : k > 0 ? ` + ${k}` : ` − ${-k}`;
    const correct = `parab:1,${h},${k}`;
    const others = MG.filter(([vh, vk]) => !(vh === h && vk === k));
    const dist = [others[mi % others.length], others[(mi + 2) % others.length], others[(mi + 4) % others.length]]
      .map(([vh, vk]) => `parab:1,${vh},${vk}`);
    const opts = Array.from(new Set([correct, ...dist])).slice(0, 4);
    if (opts.length >= 3)
      out.push({ q: `Which graph matches y = ${base}²${kterm}?`, a: correct, diff: 9.8 + mi * 0.02, key: `mg:${h}_${k}`, type: "multiple_choice", options: shuffleByKey(opts, `mg:${h}_${k}`), fmt: "match-graph" });
  }
  // GRAPH TRANSFORMATIONS: apply a transformation to a parabola and pick the
  // resulting graph. Options are graph descriptors (reuses GraphChoice). Reflect
  // across x-axis → (−a, h, −k); translate up n → k+n; translate left n → h−n.
  const desc = (a: number, h: number, k: number) => `parab:${a},${h},${k}`;
  const vf = (h: number, k: number) => `${h === 0 ? "x" : `(x ${h > 0 ? `− ${h}` : `+ ${-h}`})`}²${k === 0 ? "" : k > 0 ? ` + ${k}` : ` − ${-k}`}`;
  const pushT = (key: string, q: string, correct: string, raw: string[], diff: number) => {
    const opts = Array.from(new Set([correct, ...raw])).slice(0, 4);
    if (opts.length >= 3) out.push({ q, a: correct, diff, key, type: "multiple_choice", options: shuffleByKey(opts, key), fmt: "transform" });
  };
  const BASES: [number, number, number][] = [[1, 0, 2], [1, 1, 0], [1, -2, 1], [1, 2, -1], [1, 0, -2], [1, -1, 3]];
  let ti = 0;
  for (const [a, h, k] of BASES) {
    pushT(`tf:rx:${h}_${k}`, `Reflect y = ${vf(h, k)} across the x-axis. Which graph is the result?`, desc(-a, h, -k), [desc(a, h, -k), desc(-a, h, k), desc(a, -h, k)], 9.9 + ti++ * 0.01);
    pushT(`tf:up:${h}_${k}`, `Translate y = ${vf(h, k)} up 3 units. Which graph is the result?`, desc(a, h, k + 3), [desc(a, h, k - 3), desc(a, h + 3, k), desc(a, h - 3, k)], 9.9 + ti++ * 0.01);
    pushT(`tf:lf:${h}_${k}`, `Translate y = ${vf(h, k)} left 2 units. Which graph is the result?`, desc(a, h - 2, k), [desc(a, h + 2, k), desc(a, h, k + 2), desc(a, h, k - 2)], 9.9 + ti++ * 0.01);
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M14 — FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════
// M14/M15 pools carry the M18 multi-angle treatment: every unit mixes direct,
// reverse, find-the-mistake, true/false and real-world forms (fmt-tagged so
// selectMultiFormat's cap forces the mix), plus withReview spiral in CURRICULA.
const M14_NAMES = ["Liam", "Noor", "Ava", "Theo", "Mia", "Zane"];
function fEvalLinear(): XP[] {
  const out: XP[] = [];
  for (let m = 2; m <= 9; m++) for (let b = 1; b <= 9; b++) for (let v = 1; v <= 6; v++)
    out.push({ q: `f(x) = ${m}x + ${b}. Find f(${v})`, a: `${m * v + b}`, diff: m + b + v, key: `fl:${m}_${b}_${v}`, fmt: "evaluate" });
  // Reverse: which INPUT produced this output? (undo the machine)
  for (let m = 2; m <= 7; m++) for (let b = 1; b <= 6; b++) for (let v = 2; v <= 5; v++)
    out.push({ q: `f(x) = ${m}x + ${b}. For which x is f(x) = ${m * v + b}?`, a: `${v}`, diff: m + b + v + 3, key: `fl:r${m}_${b}_${v}`, fmt: "reverse" });
  // Real-world rate: fixed charge + per-unit rate IS f(x) = mx + b.
  for (let m = 2; m <= 6; m++) for (let b = 2; b <= 5; b++) for (const v of [3, 5])
    out.push({ q: `A taxi charges $${b} to start plus $${m} per km. How much is a ${v} km ride?`, a: `${m * v + b}`, diff: m + b + v + 2, key: `fl:w${m}_${b}_${v}`, fmt: "word" });
  // Find the mistake — the classic "added before multiplying" error.
  for (let m = 2; m <= 7; m++) for (const v of [2, 3]) {
    const who = M14_NAMES[(m + v) % M14_NAMES.length];
    const mc = mcXP(`fl:e${m}_${v}`, "find-the-mistake",
      `${who} computes f(${v}) for f(x) = ${m}x + 4 as ${m} × (${v} + 4) = ${m * (v + 4)}. What went wrong?`,
      `${who} added 4 before multiplying — multiply ${m}·${v} first, then add 4`, [
        `Nothing — ${m * (v + 4)} is correct`,
        `${who} should have subtracted 4`,
        `${who} used the wrong value of x`,
      ], scatterDiff(`fl:e${m}_${v}`));
    if (mc) out.push(mc);
  }
  // f(0) = b — the intercept idea as true/false.
  for (let b = 1; b <= 8; b++) {
    const truth = b % 2 === 1;
    out.push(tfXP(`fl:t${b}`, `True or false: for f(x) = 3x + ${b}, f(0) = ${truth ? b : b + 3}`, truth ? "True" : "False", scatterDiff(`fl:t${b}`)));
  }
  return out;
}
function fEvalQuad(): XP[] {
  const out: XP[] = [];
  for (let c = 1; c <= 9; c++) for (let v = 1; v <= 9; v++)
    out.push({ q: `f(x) = x² + ${c}. Find f(${v})`, a: `${v * v + c}`, diff: c + v + 6, key: `fq:${c}_${v}`, fmt: "evaluate" });
  // Symmetry insight as true/false: f(−v) = f(v) because squaring kills the sign.
  for (let c = 1; c <= 6; c++) for (const v of [2, 3]) {
    const truth = (c + v) % 2 === 0;
    out.push(tfXP(`fq:t${c}_${v}`, `True or false: for f(x) = x² + ${c}, f(−${v}) ${truth ? "=" : ">"} f(${v})`, truth ? "True" : "False", scatterDiff(`fq:t${c}_${v}`) + 6));
  }
  // Reverse: which positive input gives this output?
  for (let c = 1; c <= 6; c++) for (let v = 2; v <= 6; v++)
    out.push({ q: `f(x) = x² + ${c}. For which positive x is f(x) = ${v * v + c}?`, a: `${v}`, diff: c + v + 8, key: `fq:r${c}_${v}`, fmt: "reverse" });
  return out;
}
// INTERACTIVE (M14): build the equation of a shown linear function f(x)=mx+b.
function fGraphLinear(): XP[] {
  const out: XP[] = []; let i = 0;
  for (const m of [1, 2, -1, -2, 3]) for (const b of [-2, -1, 0, 1, 2])
    out.push({
      q: `The graph of a linear function f(x) = mx + b is shown. Build its equation.`,
      a: `${m},${b}`, diff: 2 + i++ * 0.05, key: `fgl:${m}_${b}`, type: "short_answer", answerType: "point",
      interactive: { kind: "equation-builder", line: { m, b }, xRange: [-6, 6], yRange: [-6, 6], snap: 1 },
    });
  return out;
}
// INTERACTIVE (M14): drag the vertex of a quadratic function to a target point.
function fVertexDrag(): XP[] {
  const out: XP[] = []; let i = 0;
  for (const h of [-3, -2, -1, 0, 1, 2, 3]) for (const k of [-2, -1, 0, 1, 2])
    out.push({
      q: `Drag the vertex of the parabola to the point (${h}, ${k}).`,
      a: `${h},${k}`, diff: 6 + i++ * 0.02, key: `fvd:${h}_${k}`, type: "short_answer", answerType: "point",
      interactive: { kind: "vertex-drag", a: 1, xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  return out;
}
function fCompose(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) for (let v = 1; v <= 5; v++)
    out.push({ q: `f(x) = x + ${a}, g(x) = ${term(b, "x")}. Find f(g(${v}))`, a: `${b * v + a}`, diff: a + b + v + 8, key: `fc:${a}_${b}_${v}`, fmt: "compose" });
  // Order matters: g(f(v)) = b(v + a) is a DIFFERENT machine chain.
  for (let a = 1; a <= 6; a++) for (let b = 2; b <= 6; b++) for (const v of [1, 2, 3])
    out.push({ q: `f(x) = x + ${a}, g(x) = ${term(b, "x")}. Find g(f(${v}))`, a: `${b * (v + a)}`, diff: a + b + v + 10, key: `fc:o${a}_${b}_${v}`, fmt: "order" });
  // The insight itself as true/false.
  for (let a = 1; a <= 5; a++) {
    const truth = a % 2 === 1;
    out.push(tfXP(`fc:t${a}`, truth
      ? `True or false: for f(x) = x + ${a} and g(x) = 2x, f(g(x)) and g(f(x)) are usually DIFFERENT`
      : `True or false: f(g(x)) = g(f(x)) for every pair of functions`, truth ? "True" : "False", scatterDiff(`fc:t${a}`) + 8));
  }
  return out;
}
function fDomain(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 30; a++) out.push({ q: `Domain of f(x) = 1/(x - ${a})`, a: `x ≠ ${a}`, diff: a + 12, key: `fd:${a}`, fmt: "domain" });
  // Reverse: spot the excluded value directly.
  for (let a = 2; a <= 16; a += 2) {
    const mc = mcXP(`fd:r${a}`, "reverse", `Which x is NOT allowed for f(x) = 1/(x - ${a})?`, `${a}`, [`${a + 1}`, `0`, `-${a}`], scatterDiff(`fd:r${a}`) + 12);
    if (mc) out.push(mc);
  }
  // The rule as true/false.
  for (let a = 1; a <= 8; a++) {
    const truth = a % 2 === 0;
    out.push(tfXP(`fd:t${a}`, `True or false: x = ${truth ? a + 1 : a} is in the domain of f(x) = 1/(x - ${a})`, truth ? "True" : "False", scatterDiff(`fd:t${a}`) + 12));
  }
  return out;
}
function fRange(): XP[] {
  const out: XP[] = [];
  for (let c = -15; c <= 15; c++) out.push({ q: `Range of f(x) = x² + ${c < 0 ? `(${c})` : c}`, a: `y ≥ ${c}`, diff: c + 30, key: `fr:${c}`, fmt: "range" });
  // Reverse: recover the function from its range.
  for (let c = 1; c <= 9; c++) {
    const mc = mcXP(`fr:r${c}`, "reverse", `Which function has range y ≥ ${c}?`, `x² + ${c}`, [`x² − ${c}`, `x + ${c}`, `${c}x`], scatterDiff(`fr:r${c}`) + 30);
    if (mc) out.push(mc);
  }
  // Why: the minimum lives at x = 0.
  for (let c = 1; c <= 6; c++)
    out.push({ q: `f(x) = x² + ${c}. What is the SMALLEST value f(x) can be?`, a: `${c}`, diff: c + 32, key: `fr:m${c}`, fmt: "minimum" });
  return out;
}
function fInverseLinear(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let v = 1; v <= 12; v++)
    out.push({ q: `f(x) = x + ${b}. Find f⁻¹(${v})`, a: `${v - b}`, diff: b + v + 18, key: `fi:${b}_${v}`, fmt: "inverse" });
  // Concept: the inverse UNDOES.
  for (let b = 2; b <= 9; b++) {
    const mc = mcXP(`fi:c${b}`, "concept", `f adds ${b} to every number. What does f⁻¹ do?`, `Subtracts ${b}`, [`Adds ${b}`, `Multiplies by ${b}`, `Nothing`], scatterDiff(`fi:c${b}`) + 18);
    if (mc) out.push(mc);
  }
  // Word: decode the secret code.
  for (let b = 2; b <= 7; b++) for (const v of [9, 12])
    out.push({ q: `A secret code adds ${b} to every number. A message arrived as ${v}. What was the original number?`, a: `${v - b}`, diff: b + v + 16, key: `fi:w${b}_${v}`, fmt: "word" });
  // Round-trip identity as true/false.
  for (let b = 1; b <= 6; b++) {
    const truth = b % 2 === 1;
    out.push(tfXP(`fi:t${b}`, `True or false: f⁻¹(f(${b + 3})) = ${truth ? b + 3 : b + 4} for f(x) = x + ${b}`, truth ? "True" : "False", scatterDiff(`fi:t${b}`) + 18));
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M15 — TRIGONOMETRY
// ═════════════════════════════════════════════════════════════════════════════
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
function tHypotenuse(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) for (let k = 1; k <= 6; k++)
    out.push({ q: `Right triangle with legs ${a * k} and ${b * k}. Find the hypotenuse`, a: `${c * k}`, diff: c * k, key: `th:${a}_${k}`, fmt: "hypotenuse" });
  // Missing LEG — the theorem run backwards.
  for (const [a, b, c] of TRIPLES) for (const k of [1, 2, 3])
    out.push({ q: `Right triangle: hypotenuse ${c * k}, one leg ${a * k}. Find the other leg`, a: `${b * k}`, diff: c * k + 2, key: `th:l${a}_${k}`, fmt: "leg" });
  // Real-world: the ladder against the wall.
  for (const [a, b, c] of TRIPLES) for (const k of [1, 2])
    out.push({ q: `A ladder's foot stands ${a * k} m from a wall and its top reaches ${b * k} m up the wall. How long is the ladder (m)?`, a: `${c * k}`, diff: c * k + 3, key: `th:w${a}_${k}`, fmt: "word" });
  // The rule as true/false.
  for (let i = 1; i <= 8; i++) {
    const truth = i % 2 === 1;
    out.push(tfXP(`th:t${i}`, truth
      ? `True or false: the hypotenuse is always the LONGEST side of a right triangle`
      : `True or false: in a² + b² = c², c can be any of the three sides`, truth ? "True" : "False", scatterDiff(`th:t${i}`)));
  }
  return out;
}
function tRatio(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) {
    out.push({ q: `Right triangle: opposite = ${a}, hypotenuse = ${c}. Find sin θ`, a: frac(a, c), diff: c + 8, key: `tr:s${a}_${c}`, fmt: "ratio" });
    out.push({ q: `Right triangle: adjacent = ${b}, hypotenuse = ${c}. Find cos θ`, a: frac(b, c), diff: c + 9, key: `tr:c${b}_${c}`, fmt: "ratio" });
    out.push({ q: `Right triangle: opposite = ${a}, adjacent = ${b}. Find tan θ`, a: frac(a, b), diff: b + 10, key: `tr:t${a}_${b}`, fmt: "ratio" });
    // Reverse: which ratio NAME matches this fraction?
    const mc = mcXP(`tr:r${a}_${c}`, "reverse", `In a right triangle with opposite ${a}, adjacent ${b}, hypotenuse ${c}, which ratio equals ${frac(a, c)}?`, "sin θ", ["cos θ", "tan θ", "none of them"], c + 10);
    if (mc) out.push(mc);
    // Real-world: the ramp.
    out.push({ q: `A ramp rises ${a} m over a horizontal base of ${b} m. Find tan θ for the ramp's angle`, a: frac(a, b), diff: b + 11, key: `tr:w${a}_${b}`, fmt: "word" });
  }
  // Find the mistake — the #1 trig error is grabbing the wrong side.
  for (const who of ["Nora", "Eli", "Faye", "Omar"]) {
    const mc = mcXP(`tr:e${who}`, "find-the-mistake",
      `${who} writes sin θ = adjacent/hypotenuse. What's wrong?`,
      `sin uses the OPPOSITE side: sin θ = opposite/hypotenuse`, [
        `Nothing — that's the definition`,
        `sin θ = adjacent/opposite`,
        `The hypotenuse is never used for sin`,
      ], scatterDiff(`tr:e${who}`) + 9);
    if (mc) out.push(mc);
  }
  return out;
}
const SIN: Record<number, string> = { 0: "0", 30: "1/2", 45: "√2/2", 60: "√3/2", 90: "1" };
const COS: Record<number, string> = { 0: "1", 30: "√3/2", 45: "√2/2", 60: "1/2", 90: "0" };
const TAN: Record<number, string> = { 0: "0", 30: "√3/3", 45: "1", 60: "√3" };
function tUnitCircle(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const deg of [0, 30, 45, 60, 90]) { out.push({ q: `Evaluate sin ${deg}°.`, a: SIN[deg], diff: 14 + i++, key: `tus:${deg}`, fmt: "evaluate" }); }
  for (const deg of [0, 30, 45, 60, 90]) { out.push({ q: `Evaluate cos ${deg}°.`, a: COS[deg], diff: 14 + i++, key: `tuc:${deg}`, fmt: "evaluate" }); }
  for (const deg of [0, 30, 45, 60]) { out.push({ q: `Evaluate tan ${deg}°.`, a: TAN[deg], diff: 14 + i++, key: `tut:${deg}`, fmt: "evaluate" }); }
  // Reverse: which ANGLE has this value? (unique values only)
  for (const [deg, val] of [[30, "1/2"], [45, "√2/2"], [60, "√3/2"], [90, "1"], [0, "0"]] as [number, string][]) {
    const mc = mcXP(`tus:r${deg}`, "reverse", `For which angle is sin θ = ${val}?`, `${deg}°`, ["0°", "30°", "45°", "60°", "90°"].filter((d) => d !== `${deg}°`).slice(0, 3), 14 + i++);
    if (mc) out.push(mc);
  }
  // Coordinates: the point ON the circle is (cos θ, sin θ).
  for (const deg of [0, 30, 45, 60, 90]) {
    out.push({ q: `On the unit circle, the point at ${deg}° is (cos ${deg}°, sin ${deg}°). What is its x-coordinate?`, a: COS[deg], diff: 15 + i++, key: `tux:${deg}`, fmt: "coordinates" });
    out.push({ q: `On the unit circle, what is the y-coordinate of the point at ${deg}°?`, a: SIN[deg], diff: 15 + i++, key: `tuy:${deg}`, fmt: "coordinates" });
  }
  // Co-function pattern as true/false: sin θ = cos (90° − θ). Truth is computed
  // straight from the value tables so it can never drift from the content.
  for (const [d1, d2] of [[30, 60], [45, 45], [60, 30], [60, 60], [30, 45], [90, 0]] as [number, number][]) {
    out.push(tfXP(`tuf:${d1}_${d2}`, `True or false: sin ${d1}° = cos ${d2}°`, SIN[d1] === COS[d2] ? "True" : "False", 16 + i++));
  }
  return out;
}
// INTERACTIVE GEOMETRY (graded): drag the point around the unit circle to a
// target angle. Snaps to standard angles; answer is the degree value.
function tAngleDrag(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const deg of [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 330])
    out.push({
      q: `Drag the point around the circle so the angle θ = ${deg}°.`,
      a: `${deg}`, diff: 14 + i++ * 0.1, key: `tad:${deg}`, type: "short_answer", answerType: "point",
      interactive: { kind: "angle-drag", xRange: [-1.4, 1.4], yRange: [-1.4, 1.4], snap: 1 },
    });
  return out;
}
const RAD: Record<number, string> = { 30: "π/6", 45: "π/4", 60: "π/3", 90: "π/2", 120: "2π/3", 135: "3π/4", 150: "5π/6", 180: "π", 270: "3π/2", 360: "2π" };
function tDegRad(): XP[] {
  const out: XP[] = Object.entries(RAD).map(([deg, r], i) => ({ q: `Convert ${deg}° to radians`, a: r, diff: 22 + i, key: `tdr:${deg}`, fmt: "to-radians" }));
  // Reverse direction as MC (degree answers typed free-form invite format
  // fights; options keep grading unambiguous).
  let i = 0;
  for (const [deg, r] of Object.entries(RAD)) {
    const others = Object.keys(RAD).filter((d) => d !== deg).slice(0, 3).map((d) => `${d}°`);
    const mc = mcXP(`tdr:r${deg}`, "to-degrees", `Convert ${r} radians to degrees`, `${deg}°`, others, 23 + i++);
    if (mc) out.push(mc);
  }
  // The anchor fact as true/false.
  for (const [q2, truth] of [["180° = π radians", true], ["360° = 2π radians", true], ["90° = π radians", false], ["π radians is a QUARTER turn", false], ["π/2 radians = 90°", true], ["60° = π/3 radians", true]] as [string, boolean][]) {
    out.push(tfXP(`tdr:t${i}`, `True or false: ${q2}`, truth ? "True" : "False", 24 + i++));
  }
  return out;
}
// INTERACTIVE: drag the unit-circle point to an angle given IN RADIANS (graded by
// the equivalent degree value). Reuses the angle-drag input.
function tAngleDragRad(): XP[] {
  const RD: [string, number][] = [["π/6", 30], ["π/4", 45], ["π/3", 60], ["π/2", 90], ["2π/3", 120], ["3π/4", 135], ["5π/6", 150], ["π", 180], ["3π/2", 270]];
  return RD.map(([r, deg], i) => ({
    q: `Drag the point around the circle to the angle ${r} radians.`,
    a: `${deg}`, diff: 22 + i * 0.1, key: `tadr:${deg}`, type: "short_answer", answerType: "point",
    interactive: { kind: "angle-drag", xRange: [-1.4, 1.4], yRange: [-1.4, 1.4], snap: 1 },
  }));
}
// Two forms over six triples is twelve problems, and a sheet holds thirty — so
// this unit used to round-robin and show a child the same question up to five
// times. Every form below is the SAME identity asked a different way, which is
// what the unit is for: sin²θ + cos²θ = 1 is not a lookup, it is a relation you
// can enter from any side.
function tPythagIdentity(): XP[] {
  const out: XP[] = [];
  for (const [a, b, c] of TRIPLES) {
    out.push({ q: `sin θ = ${frac(a, c)}. Find cos θ (acute angle)`, a: frac(b, c), diff: c + 28, key: `tpi:${a}_${c}` });
    out.push({ q: `cos θ = ${frac(b, c)}. Find sin θ (acute angle)`, a: frac(a, c), diff: c + 29, key: `tpi2:${b}_${c}` });
    // Square first, root second — the step students skip.
    out.push({ q: `sin θ = ${frac(a, c)}. Find cos²θ`, a: frac(b * b, c * c), diff: c + 30, key: `tpi3:${a}_${c}` });
    // The identity holds whatever θ is: the answer is always 1, and seeing that
    // six times with six different givens is the lesson, not padding.
    out.push({ q: `sin θ = ${frac(a, c)}. Evaluate sin²θ + cos²θ`, a: "1", diff: c + 31, key: `tpi4:${a}_${c}` });
    // Enter from tangent — needs cos via the identity first.
    out.push({ q: `sin θ = ${frac(a, c)}. Find tan θ (acute angle)`, a: frac(a, b), diff: c + 33, key: `tpi5:${a}_${c}` });
  }
  // Rearranged forms, stated symbolically.
  out.push({ q: `Complete the identity: sin²θ + ___ = 1`, a: "cos²θ", diff: 30, key: "tpi:comp1" });
  out.push({ q: `Complete the identity: ___ + cos²θ = 1`, a: "sin²θ", diff: 31, key: "tpi:comp2" });
  out.push({ q: `Simplify: 1 − sin²θ`, a: "cos²θ", diff: 32, key: "tpi:simp1" });
  out.push({ q: `Simplify: 1 − cos²θ`, a: "sin²θ", diff: 33, key: "tpi:simp2" });
  out.push({ q: `Simplify: sin²θ + cos²θ`, a: "1", diff: 34, key: "tpi:simp3" });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M16 — ALGEBRA II
// ═════════════════════════════════════════════════════════════════════════════
function a2Log(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 4, 5, 10]) for (let k = 1; k <= 5; k++)
    out.push({ q: `Evaluate log_${b}(${b ** k}).`, a: `${k}`, diff: b + k, key: `lg:${b}_${k}` });
  // The two special cases students most often get backwards, and the reverse
  // reading of the same definition. Twenty problems could not fill a sheet.
  for (const b of [2, 3, 4, 5, 10]) {
    out.push({ q: `Evaluate log_${b}(1).`, a: "0", diff: b + 0.5, key: `lg1:${b}` });
    out.push({ q: `Evaluate log_${b}(${b}).`, a: "1", diff: b + 0.6, key: `lgb:${b}` });
  }
  // Definition form: a log IS the question "what power?".
  for (const b of [2, 3, 5, 10]) for (const k of [2, 3, 4])
    out.push({ q: `log_${b}(x) = ${k}. Find x.`, a: `${b ** k}`, diff: b + k + 0.7, key: `lgr:${b}_${k}` });
  return out;
}
function a2ExpEval(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 4, 5]) for (let k = 1; k <= 5; k++)
    out.push({ q: `Evaluate ${b}${sup(k)}`, a: `${b ** k}`, diff: b + k + 6, key: `ee:${b}_${k}`, fmt: "evaluate" });
  // Reverse: which power produces this value?
  for (const b of [2, 3, 5]) for (let k = 2; k <= 4; k++)
    out.push({ q: `${b} raised to what power gives ${b ** k}?`, a: `${k}`, diff: b + k + 7, key: `ee:r${b}_${k}`, fmt: "reverse" });
  // The classic error (power ≠ multiply) as true/false.
  for (const b of [3, 4, 5, 6]) for (const k of [2, 3]) {
    const truth = (b + k) % 2 === 0;
    out.push(tfXP(`ee:t${b}_${k}`, `True or false: ${b}${sup(k)} = ${truth ? b ** k : b * k}`, truth ? "True" : "False", b + k + 6));
  }
  return out;
}
function a2ExpSolve(): XP[] {
  const out: XP[] = [];
  for (const b of [2, 3, 5, 7, 10]) for (let k = 1; k <= 5; k++)
    out.push({ q: `Solve ${b}^x = ${b ** k}`, a: `${k}`, diff: b + k + 12, key: `es:${b}_${k}`, fmt: "solve" });
  // Real-world: repeated doubling/tripling.
  for (const b of [2, 3]) for (let k = 2; k <= 5; k++)
    out.push({ q: `A rumor ${b === 2 ? "doubles" : "triples"} its audience every day, starting from 1 person. After how many days does it reach ${b ** k} people?`, a: `${k}`, diff: b + k + 13, key: `es:w${b}_${k}`, fmt: "word" });
  // Same-base principle as true/false.
  for (const b of [2, 3, 5]) for (const k of [2, 3]) {
    const truth = (b + k) % 2 === 0;
    out.push(tfXP(`es:t${b}_${k}`, `True or false: if ${b}^x = ${b}^${k}, then x = ${truth ? k : k + 1}`, truth ? "True" : "False", b + k + 12));
  }
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
    out.push({ q: `Add: (${a} + ${imag(b)}) + (${c} + ${imag(d)})`, a: `${a + c} + ${imag(b + d)}`, diff: a + b + c + d + 24, key: `ca:${a}_${b}_${c}_${d}` });
  return out;
}

// ── TIER 3: polynomial graph analysis + advanced solving (Algebra II, M16) ────
// Signed polynomial builder: [{c,n}] (highest degree first) → "3x² - 2x + 5".
function jPoly(terms: { c: number; n: number }[]): string {
  const parts = terms.filter((t) => t.c !== 0);
  if (!parts.length) return "0";
  return parts.map((t, i) => {
    const s = powTerm(Math.abs(t.c), t.n);
    return i === 0 ? (t.c < 0 ? `-${s}` : s) : (t.c < 0 ? ` - ${s}` : ` + ${s}`);
  }).join("");
}
// End behavior: as x → −∞, f(x) → +∞ or −∞. Even degree keeps the leading sign;
// odd degree flips it. (Right end x → +∞ is just the sign of the lead, so we ask
// the harder left end to test the parity idea.)
function a2EndBehavior(): XP[] {
  const out: XP[] = [];
  for (const c of [1, 2, 3, -1, -2, -3]) for (const n of [2, 3, 4, 5]) {
    const leftPos = n % 2 === 0 ? c > 0 : c < 0;
    const poly = jPoly([{ c, n }, { c: 2, n: 1 }, { c: -1, n: 0 }]);
    const key = `eb:${c}_${n}`;
    out.push({ q: `As x → −∞, the end behavior of f(x) = ${poly} is f(x) → ?`, a: leftPos ? "+∞" : "−∞", diff: Math.abs(c) + n, key, type: "multiple_choice", options: shuffleByKey(["+∞", "−∞"], key) });
  }
  return out;
}
// y-intercept = f(0) = the constant term.
function a2YIntercept(): XP[] {
  const out: XP[] = [];
  for (const a of [1, 2, 3]) for (const b of [2, -3, 4, -5]) for (const c of [1, -3, 5, -7, 6, -8])
    out.push({ q: `Find the y-intercept of f(x) = ${jPoly([{ c: a, n: 2 }, { c: b, n: 1 }, { c, n: 0 }])}. Give the y-value.`, a: `${c}`, diff: Math.abs(c) + a, key: `yi:${a}_${b}_${c}` });
  return out;
}
// x-intercepts from factored form: (x − r1)(x + r2) → roots r1 and −r2.
function a2XIntercepts(): XP[] {
  const out: XP[] = [];
  for (const r1 of [1, 2, 3, 4, 5]) for (const r2 of [1, 2, 3, 4, 6]) {
    if (r1 === r2) continue;
    out.push({ q: `f(x) = (x − ${r1})(x + ${r2}) crosses the x-axis at x = ${r1} and x = ?`, a: `-${r2}`, diff: r1 + r2, key: `xi:${r1}_${r2}`, fmt: "find-root" });
    // Reverse: recover the function from its crossings.
    const mc = mcXP(`xi:r${r1}_${r2}`, "reverse", `Which function crosses the x-axis at x = ${r1} and x = −${r2}?`, `(x − ${r1})(x + ${r2})`, [
      `(x + ${r1})(x − ${r2})`, `(x − ${r1})(x − ${r2})`, `(x + ${r1})(x + ${r2})`,
    ], r1 + r2 + 1);
    if (mc) out.push(mc);
  }
  // The zero-product idea as true/false.
  for (const r of [1, 2, 3, 4, 5, 6]) {
    const truth = r % 2 === 1;
    out.push(tfXP(`xi:t${r}`, `True or false: x = ${truth ? r : -r} is an x-intercept of f(x) = (x − ${r})(x + ${r + 1})`, truth ? "True" : "False", r + 3));
  }
  return out;
}
// Multiplicity: even → the graph bounces (is tangent); odd → it crosses.
function a2Multiplicity(): XP[] {
  const out: XP[] = [];
  for (const r of [1, 2, 3, 4]) for (const m of [2, 3, 4]) for (const other of [1, 2, 3]) {
    const factor = `(x − ${r})${sup(m)}`;
    const behav = m % 2 === 0 ? "bounces (touches)" : "crosses";
    const key = `mult:${r}_${m}_${other}`;
    out.push({ q: `For f(x) = ${factor}(x + ${other}), at x = ${r} the graph ___ the x-axis.`, a: behav, diff: r + m, key, type: "multiple_choice", options: shuffleByKey(["crosses", "bounces (touches)"], key) });
  }
  return out;
}
// Turning points: a degree-n polynomial has at most n − 1.
function a2TurningPoints(): XP[] {
  const out: XP[] = [];
  for (let n = 2; n <= 9; n++) {
    out.push({ q: `A polynomial of degree ${n} has at most how many turning points?`, a: `${n - 1}`, diff: n, key: `tp:${n}` });
    out.push({ q: `f(x) = ${jPoly([{ c: 2, n }, { c: -3, n: 1 }, { c: 1, n: 0 }])} has at most how many turning points?`, a: `${n - 1}`, diff: n + 0.4, key: `tpp:${n}` });
    // Read the relation backwards, and test the word that carries it: "at
    // most" is a ceiling, not a count — the misconception this unit exists for.
    out.push({ q: `A graph turns ${n - 1} times. What is the smallest degree its polynomial could have?`, a: `${n}`, diff: n + 0.6, key: `tpr:${n}` });
    out.push(tfXP(`tpt:${n}`, `True or false: every polynomial of degree ${n} has exactly ${n - 1} turning points.`, "False", n + 0.8));
  }
  return out;
}
// Fundamental Theorem of Algebra: a degree-n polynomial has exactly n roots
// (counting multiplicity).
function a2FTA(): XP[] {
  const out: XP[] = [];
  for (let n = 2; n <= 9; n++) {
    out.push({ q: `By the Fundamental Theorem of Algebra, a degree-${n} polynomial has exactly how many roots (counting multiplicity)?`, a: `${n}`, diff: n, key: `fta:${n}` });
    out.push({ q: `How many roots (with multiplicity) does ${jPoly([{ c: 1, n }, { c: 2, n: 1 }, { c: -3, n: 0 }])} = 0 have?`, a: `${n}`, diff: n + 0.4, key: `ftap:${n}` });
    // The small print IS the theorem: the missing roots are complex, and the
    // count is exact rather than a maximum.
    const real = Math.max(0, n - 2);
    out.push({ q: `A degree-${n} polynomial has ${real} real roots. How many of its roots are complex?`, a: `${n - real}`, diff: n + 0.6, key: `ftac:${n}` });
    out.push({ q: `A polynomial has exactly ${n} roots, counting multiplicity. What is its degree?`, a: `${n}`, diff: n + 0.7, key: `ftar:${n}` });
  }
  return out;
}
// Synthetic division remainder = f(k) (Remainder Theorem) when dividing by (x−k).
function a2SyntheticDiv(): XP[] {
  const out: XP[] = [];
  for (const a of [1, 2]) for (const b of [2, 3, -4, 5]) for (const c of [1, -6, 4, -3]) for (const k of [1, 2, -1, 3]) {
    const divisor = k >= 0 ? `(x − ${k})` : `(x + ${-k})`;
    const f = a * k * k + b * k + c;
    out.push({ q: `Use synthetic division to find the remainder when ${jPoly([{ c: a, n: 2 }, { c: b, n: 1 }, { c, n: 0 }])} is divided by ${divisor}.`, a: `${f}`, diff: Math.abs(k) + a + Math.abs(b), key: `sd:${a}_${b}_${c}_${k}` });
  }
  return out;
}
// Rational Root Theorem (monic): possible rational roots are ± divisors of the
// constant. Ask which candidate IS possible (a divisor); distractors are non-
// divisors, so exactly one option is a possible root.
function a2RRT(): XP[] {
  const out: XP[] = [];
  for (const c of [6, 8, 10, 12, 15, 18, 20, 24]) {
    const divs: number[] = []; for (let d = 2; d <= c - 1; d++) if (c % d === 0) divs.push(d);
    if (!divs.length) continue;
    const nonDivs: string[] = []; for (let d = 2; d <= c + 1; d++) if (c % d !== 0) nonDivs.push(String(d));
    const q = `By the Rational Root Theorem, which of these is a POSSIBLE rational root of x² − x − ${c}?  (leading coefficient 1)`;
    const mc = mcXP(`rrt:${c}`, "multiple-choice", q, `${divs[0]}`, nonDivs, c * 0.4);
    if (mc) out.push(mc);
    // Eight multiple-choice items could not fill a sheet. The theorem is a
    // recipe with two halves — the constant on top, the leading coefficient
    // underneath — so ask for each half directly as well.
    out.push({ q: `For x² − x − ${c} (leading coefficient 1), the possible rational roots are ± the divisors of which number?`, a: `${c}`, diff: c * 0.4 + 0.1, key: `rrtc:${c}` });
    out.push({ q: `How many POSITIVE divisors does ${c} have? (the count of possible positive rational roots of x² − x − ${c})`, a: `${divs.length + 2}`, diff: c * 0.4 + 0.2, key: `rrtn:${c}` });
    const mc2 = mcXP(`rrtx:${c}`, "multiple-choice", `Which of these could NOT be a rational root of x² − x − ${c}?`, nonDivs[0], [`${divs[0]}`, `${c}`, "1"], c * 0.4 + 0.3);
    if (mc2) out.push(mc2);
  }
  // With a leading coefficient above 1 the denominator finally does something.
  for (const [lead, konst] of [[2, 3], [3, 4], [2, 5], [4, 3], [3, 8], [2, 9]] as [number, number][])
    out.push({ q: `For ${lead}x² + x − ${konst}, the possible rational roots are ± (divisors of ${konst}) over (divisors of which number?)`, a: `${lead}`, diff: lead + konst * 0.3, key: `rrtl:${lead}_${konst}` });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M17 — PRE-CALCULUS
// ═════════════════════════════════════════════════════════════════════════════
function pcArithNth(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 6; a++) for (let d = 1; d <= 6; d++) for (let n = 3; n <= 8; n++)
    out.push({ q: `Arithmetic sequence: first term ${a}, common difference ${d}. Find term ${n}`, a: `${a + (n - 1) * d}`, diff: a + d + n, key: `an:${a}_${d}_${n}`, fmt: "nth-term" });
  // Real-world: steady saving IS an arithmetic sequence.
  for (let a = 2; a <= 6; a++) for (let d = 2; d <= 5; d++) for (const n of [4, 6])
    out.push({ q: `Ana starts with $${a} and saves $${d} more each week. How much does she have in week ${n}?`, a: `${a + (n - 1) * d}`, diff: a + d + n + 1, key: `an:w${a}_${d}_${n}`, fmt: "word" });
  // Reverse: recover the common difference from the terms.
  for (let a = 1; a <= 5; a++) for (let d = 2; d <= 6; d++)
    out.push({ q: `Arithmetic sequence: ${a}, ${a + d}, ${a + 2 * d}, … What is the common difference?`, a: `${d}`, diff: a + d + 2, key: `an:r${a}_${d}`, fmt: "reverse" });
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
    out.push({ q: `Geometric sequence: first term ${a}, ratio ${r}. Find term ${n}`, a: `${a * r ** (n - 1)}`, diff: a + r + n + 16, key: `gn:${a}_${r}_${n}`, fmt: "nth-term" });
  // Real-world: doubling/tripling growth.
  for (let a = 1; a <= 4; a++) for (const r of [2, 3]) for (const n of [3, 4])
    out.push({ q: `A colony starts with ${a} cell${a > 1 ? "s" : ""} and ${r === 2 ? "doubles" : "triples"} every hour. How many cells after ${n - 1} hours?`, a: `${a * r ** (n - 1)}`, diff: a + r + n + 17, key: `gn:w${a}_${r}_${n}`, fmt: "word" });
  // Reverse: recover the ratio from the terms.
  for (let a = 1; a <= 5; a++) for (const r of [2, 3, 4])
    out.push({ q: `Geometric sequence: ${a}, ${a * r}, ${a * r * r}, … What is the ratio?`, a: `${r}`, diff: a + r + 18, key: `gn:r${a}_${r}`, fmt: "reverse" });
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
    out.push({ q: `Magnitude of vector (${a * k}, ${b * k})`, a: `${c * k}`, diff: c * k + 30, key: `vm:${a}_${k}`, fmt: "magnitude" });
  // Axis-aligned insight: |(a, 0)| is just a.
  for (const a of [3, 5, 7, 9, 12])
    out.push({ q: `Magnitude of vector (${a}, 0)`, a: `${a}`, diff: a + 28, key: `vm:x${a}`, fmt: "axis" });
  // Word: displacement — east then north is a right triangle.
  for (const [a, b, c] of TRIPLES) for (const k of [1, 2])
    out.push({ q: `A drone flies ${a * k} m east then ${b * k} m north. How far is it from the start (m)?`, a: `${c * k}`, diff: c * k + 31, key: `vm:w${a}_${k}`, fmt: "word" });
  return out;
}
function pcVectorAdd(): XP[] {
  const out: XP[] = [];
  // c,d sampled sparsely — the full 5⁴ grid (625 same-shape items) swamped
  // every selection window and produced 16-in-a-row sheets.
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) for (const c of [1, 3, 5]) for (const d of [2, 4])
    out.push({ q: `Add the vectors: (${a}, ${b}) + (${c}, ${d})`, a: `(${a + c}, ${b + d})`, diff: a + b + c + d + 30, key: `va:${a}_${b}_${c}_${d}`, fmt: "add" });
  // Single-component focus — where the "add matching parts" rule lives.
  for (let a = 1; a <= 6; a++) for (let c = 2; c <= 7; c++)
    out.push({ q: `For (${a}, 3) + (${c}, 2), what is the x-component of the sum?`, a: `${a + c}`, diff: a + c + 31, key: `va:x${a}_${c}`, fmt: "component" });
  // Word: two walks, one displacement.
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++)
    out.push({ q: `A robot moves (${a}, ${b}) then (${b}, ${a}). Where does it end up, as a vector from the start?`, a: `(${a + b}, ${a + b})`, diff: a * 2 + b + 30, key: `va:w${a}_${b}`, fmt: "word" });
  // The definition as true/false.
  for (const k of [1, 2, 3, 4, 5, 6]) {
    const truth = k % 2 === 1;
    out.push(tfXP(`va:t${k}`, `True or false: (2, ${k}) + (3, 1) = (5, ${truth ? k + 1 : k + 2})`, truth ? "True" : "False", k + 35));
  }
  return out;
}
// INTERACTIVE (M17 Pre-Calc conics): drag a parabola's vertex, and match a
// parabola's equation to its graph. Reuses vertex-drag + match-graph (GraphChoice).
function pcConics(): XP[] {
  const out: XP[] = [];
  let i = 0;
  for (const [h, k] of [[2, 1], [-1, 3], [3, -2], [-2, -1], [0, 2], [1, -3], [-3, 1], [2, -4]] as [number, number][])
    out.push({
      q: `Drag the vertex of the parabola to the point (${h}, ${k}).`,
      a: `${h},${k}`, diff: 1 + i++ * 0.05, key: `pcv:${h}_${k}`, type: "short_answer", answerType: "point",
      interactive: { kind: "vertex-drag", a: 1, xRange: [-8, 8], yRange: [-8, 8], snap: 0.5 },
    });
  const MG: [number, number][] = [[0, 2], [2, 0], [-2, 0], [1, -3], [-1, 3], [2, 1]];
  for (let mi = 0; mi < MG.length; mi++) {
    const [h, k] = MG[mi];
    const base = h === 0 ? "x" : `(x ${h > 0 ? `− ${h}` : `+ ${-h}`})`;
    const kterm = k === 0 ? "" : k > 0 ? ` + ${k}` : ` − ${-k}`;
    const correct = `parab:1,${h},${k}`;
    const others = MG.filter(([vh, vk]) => !(vh === h && vk === k));
    const dist = [others[mi % others.length], others[(mi + 2) % others.length], others[(mi + 3) % others.length]].map(([vh, vk]) => `parab:1,${vh},${vk}`);
    const opts = Array.from(new Set([correct, ...dist])).slice(0, 4);
    if (opts.length >= 3) out.push({ q: `Which graph matches y = ${base}²${kterm}?`, a: correct, diff: 3 + mi * 0.1, key: `pcmg:${h}_${k}`, type: "multiple_choice", options: shuffleByKey(opts, `pcmg:${h}_${k}`), fmt: "match-graph" });
  }
  // Fourteen problems could not fill a thirty-problem sheet, so the selector
  // round-robined and a child saw the same parabola five times. These read the
  // SAME vertex form the unit is built on, from the other three directions:
  // equation → vertex, vertex → equation, and the axis of symmetry that falls
  // straight out of h.
  const VK: [number, number][] = [[2, 1], [-1, 3], [3, -2], [-2, -1], [0, 2], [1, -3], [-3, 1], [2, -4], [4, 0], [-4, 2]];
  VK.forEach(([h, k], i) => {
    const base = h === 0 ? "x" : `(x ${h > 0 ? `− ${h}` : `+ ${-h}`})`;
    const kterm = k === 0 ? "" : k > 0 ? ` + ${k}` : ` − ${-k}`;
    out.push({ q: `What is the vertex of y = ${base}²${kterm}?`, a: `${h},${k}`, diff: 2 + i * 0.05, key: `pcve:${h}_${k}`, type: "short_answer", answerType: "point" });
    // The sign trap: the bracket says (x − h), so the vertex x is +h.
    out.push({ q: `What is the axis of symmetry of y = ${base}²${kterm}?`, a: `x = ${h}`, diff: 2.6 + i * 0.05, key: `pcas:${h}_${k}` });
  });
  VK.slice(0, 6).forEach(([h, k], i) => {
    const base = h === 0 ? "x" : `(x ${h > 0 ? `− ${h}` : `+ ${-h}`})`;
    const kterm = k === 0 ? "" : k > 0 ? ` + ${k}` : ` − ${-k}`;
    out.push({ q: `Write the equation of the parabola with vertex (${h}, ${k}) and a = 1.`, a: `y = ${base}²${kterm}`, diff: 4 + i * 0.1, key: `pceq:${h}_${k}` });
  });
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
// M18 — CALCULUS
// ═════════════════════════════════════════════════════════════════════════════
// Author the derivative items as MULTIPLE CHOICE with pedagogical distractors
// (forgot the coefficient, forgot to reduce the power, off-by-one). Previously
// these were plain short-answers, so the practice layer built MC options from
// OTHER answers on the sheet — leaving the correct one trivially identifiable
// (it was the only one whose coefficient matched the question's exponent).
// Differentiating xⁿ is one uniform rule, so difficulty isn't meaningfully
// ordered by n. Scatter the diff by a hash of the key so a sheet does NOT serve
// x², x³, x⁴, … in a predictable sequence (which let students pattern-guess).
const scatterDiff = (key: string): number => (hashStr(key) % 1000) / 1000 * 8;

// Spiral review (Kumon-style): blend ~25% of EARLIER units' questions into a
// later unit's pool, tagged fmt "review" so selectMultiFormat's per-format cap
// keeps them a seasoning, never a flood. Deterministic pick (every k-th item)
// so regeneration stays stable; review diffs are re-scattered so the items land
// throughout the sheet instead of clumping at one end.
function withReview(main: XP[], ...priors: (() => XP[])[]): XP[] {
  const pool = priors.flatMap((p) => p());
  if (!pool.length) return main;
  const want = Math.max(4, Math.round(main.length * 0.25));
  const k = Math.max(1, Math.floor(pool.length / want));
  // Spread review diffs across the MAIN pool's whole difficulty range — scoring
  // normalizes against the combined min/max, so review scattered in its own low
  // band would only ever appear on the unit's first sheets.
  let lo = Infinity, hi = -Infinity;
  for (const p of main) { lo = Math.min(lo, p.diff); hi = Math.max(hi, p.diff); }
  const span = hi - lo || 1;
  const picked: XP[] = [];
  for (let i = 0; i < pool.length && picked.length < want; i += k) {
    const p = pool[i];
    picked.push({ ...p, key: `rv:${p.key}`, fmt: "review", diff: lo + (scatterDiff(`rv:${p.key}`) / 8) * span });
  }
  return [...main, ...picked];
}

// M18 pools — each mixes FIVE angles on the same idea (direct, reverse,
// find-the-mistake, true/false, real-world rate) so a sheet never reads as the
// same stem 36 times. selectMultiFormat's fmt cap (≤⅓/sheet) enforces the mix.
function caDerivPower(): XP[] {
  const out: XP[] = [];
  for (let n = 2; n <= 30; n++) {
    const mc = mcXP(`dp:${n}`, "derivative", `d/dx ${xpow(n)}`, powTerm(n, n - 1), [
      powTerm(1, n - 1),     // forgot the coefficient
      powTerm(n, n),         // forgot to reduce the power
      powTerm(n - 1, n - 1), // coefficient off by one
      powTerm(n + 1, n - 1),
    ], scatterDiff(`dp:${n}`));
    if (mc) out.push(mc);
  }
  // The two ground rules, as their own items: d/dx x = 1, d/dx c = 0.
  const one = mcXP("dp:x", "basics", "d/dx x", "1", ["x", "0", "2x"], scatterDiff("dp:x"));
  if (one) out.push(one);
  for (const c of [3, 7, 12, 25]) {
    const mc = mcXP(`dp:c${c}`, "basics", `d/dx ${c}`, "0", [`${c}`, "1", `${c}x`], scatterDiff(`dp:c${c}`));
    if (mc) out.push(mc);
  }
  // Reverse: which function HAS this derivative? (undoes the rule mentally)
  for (let n = 2; n <= 12; n++) {
    const mc = mcXP(`dp:r${n}`, "reverse", `Which function has derivative ${powTerm(n, n - 1)}?`, xpow(n), [
      xpow(n - 1), xpow(n + 1), powTerm(n, n),
    ], scatterDiff(`dp:r${n}`));
    if (mc) out.push(mc);
  }
  // True/false — half true, half seeded with the classic error.
  for (let n = 2; n <= 9; n++) {
    const truth = n % 2 === 0;
    out.push(tfXP(`dp:t${n}`, `True or false: d/dx ${xpow(n)} = ${truth ? powTerm(n, n - 1) : powTerm(n, n)}`, truth ? "True" : "False", scatterDiff(`dp:t${n}`)));
  }
  return out;
}
function caDerivMono(): XP[] {
  const out: XP[] = [];
  for (let a = 2; a <= 9; a++) for (let n = 2; n <= 6; n++) {
    const mc = mcXP(`dm:${a}_${n}`, "derivative", `d/dx ${a}${xpow(n)}`, powTerm(a * n, n - 1), [
      powTerm(a, n - 1),     // forgot to multiply by the power
      powTerm(a * n, n),     // forgot to reduce the power
      powTerm(a, n),         // forgot both steps
      powTerm(a * (n - 1), n - 1),
    ], scatterDiff(`dm:${a}_${n}`));
    if (mc) out.push(mc);
  }
  // Linear + constant terms — the edge cases students meet immediately after.
  for (let a = 2; a <= 12; a++)
    out.push({ q: `d/dx ${a}x`, a: `${a}`, diff: scatterDiff(`dm:l${a}`), key: `dm:l${a}`, fmt: "basics", type: "short_answer" });
  // Reverse: recover the function from its derivative.
  for (let a = 2; a <= 6; a++) for (const n of [2, 3, 4]) {
    const mc = mcXP(`dm:r${a}_${n}`, "reverse", `Which function has derivative ${powTerm(a * n, n - 1)}?`, `${a}${xpow(n)}`, [
      `${a * n}${xpow(n)}`, `${a}${xpow(n - 1)}`, `${a * n}${xpow(n - 1)}`,
    ], scatterDiff(`dm:r${a}_${n}`));
    if (mc) out.push(mc);
  }
  // Find the mistake — error analysis locks the two-step rule in.
  const NAMES = ["Maya", "Omar", "Lena", "Sam", "Ava", "Yusuf"];
  for (let a = 2; a <= 7; a++) for (const n of [2, 3]) {
    const who = NAMES[(a + n) % NAMES.length];
    const mc = mcXP(`dm:e${a}_${n}`, "find-the-mistake",
      `${who} says d/dx ${a}${xpow(n)} = ${powTerm(a, n - 1)}. What did ${who} forget?`,
      "To multiply by the exponent", [
        "To subtract 1 from the exponent",
        "Nothing — that's correct",
        "To divide by the coefficient",
      ], scatterDiff(`dm:e${a}_${n}`));
    if (mc) out.push(mc);
  }
  // Real-world rate: height → speed (the reason derivatives exist).
  for (let a = 2; a <= 6; a++) for (let v = 2; v <= 5; v++)
    out.push({
      q: `A ball's height after t seconds is h(t) = ${a}t². Its speed is h′(t) = ${2 * a}t. How fast is it moving at t = ${v}?`,
      a: `${2 * a * v}`, diff: scatterDiff(`dm:w${a}_${v}`) + 6, key: `dm:w${a}_${v}`, fmt: "word", type: "short_answer",
    });
  return out;
}
function caDerivEval(): XP[] {
  const out: XP[] = [];
  for (let b = 1; b <= 9; b++) for (let c = 1; c <= 6; c++) for (let v = 1; v <= 6; v++)
    out.push({ q: `f(x) = x² + ${term(b, "x")} + ${c}. Find f'(${v})`, a: `${2 * v + b}`, diff: b + c + v + 14, key: `de:${b}_${c}_${v}`, fmt: "evaluate" });
  // Same skill, tangent-line phrasing (the geometric meaning).
  for (let b = 1; b <= 8; b++) for (let v = 1; v <= 5; v++)
    out.push({ q: `Find the slope of the tangent line to y = x² + ${term(b, "x")} at x = ${v}`, a: `${2 * v + b}`, diff: b + v + 16, key: `de:t${b}_${v}`, fmt: "tangent" });
  // Cubic stretch goal — lives at the TOP difficulties so the unit's hardest
  // sheets still mix shapes instead of flooding one stem.
  for (let b = 1; b <= 8; b++) for (let v = 1; v <= 4; v++)
    out.push({ q: `f(x) = x³ + ${term(b, "x")}. Using f'(x) = 3x² + ${b}, find f'(${v})`, a: `${3 * v * v + b}`, diff: b + 3 * v + 22, key: `de:c${b}_${v}`, fmt: "cubic" });
  return out;
}
function caIntegralPower(): XP[] {
  const out: XP[] = [];
  for (let n = 1; n <= 30; n++) out.push({ q: `∫ ${xpow(n)} dx`, a: `${xpow(n + 1)}/${n + 1} + C`, diff: n + 18, key: `ip:${n}`, fmt: "integrate" });
  // Reverse (antiderivative recognition) + the +C idea as true/false.
  for (let n = 1; n <= 10; n++) {
    const mc = mcXP(`ip:r${n}`, "reverse", `Which is an antiderivative of ${powTerm(n + 1, n)}?`, xpow(n + 1), [
      xpow(n), powTerm(n + 1, n + 1), powTerm(n, n + 1),
    ], scatterDiff(`ip:r${n}`) + 18);
    if (mc) out.push(mc);
  }
  for (let n = 1; n <= 8; n++) {
    const truth = n % 2 === 1;
    out.push(tfXP(`ip:t${n}`, `True or false: ∫ ${xpow(n)} dx = ${truth ? `${xpow(n + 1)}/${n + 1} + C` : `${xpow(n + 1)} + C`}`, truth ? "True" : "False", scatterDiff(`ip:t${n}`) + 18));
  }
  return out;
}
function caIntegralDef(): XP[] {
  const out: XP[] = [];
  for (let b = 2; b <= 20; b += 2) out.push({ q: `∫₀^${b} x dx`, a: `${(b * b) / 2}`, diff: b + 24, key: `id:${b}`, fmt: "definite" });
  // ∫ 2x dx = b² and ∫ 3x² dx = b³ — clean integers, new shapes.
  for (let b = 2; b <= 12; b++) out.push({ q: `∫₀^${b} 2x dx`, a: `${b * b}`, diff: b + 26, key: `id:2x${b}`, fmt: "definite" });
  for (let b = 1; b <= 6; b++) out.push({ q: `∫₀^${b} 3x² dx`, a: `${b * b * b}`, diff: b + 30, key: `id:3x${b}`, fmt: "definite" });
  // The MEANING: a definite integral is an area.
  for (let b = 2; b <= 10; b++)
    out.push({ q: `Find the area under y = 2x from x = 0 to x = ${b}`, a: `${b * b}`, diff: b + 28, key: `id:a${b}`, fmt: "area" });
  return out;
}
function caSlope(): XP[] {
  const out: XP[] = [];
  for (let a = 1; a <= 30; a++) out.push({ q: `Slope of y = x² at x = ${a}`, a: `${2 * a}`, diff: a + 28, key: `sl:${a}`, fmt: "slope" });
  // Reverse: WHERE does the curve have a given slope?
  for (let m = 2; m <= 20; m += 2)
    out.push({ q: `At which x does y = x² have slope ${m}?`, a: `${m / 2}`, diff: m + 30, key: `sl:r${m}`, fmt: "reverse" });
  // Physics phrasing — position → velocity.
  for (let t = 2; t <= 12; t++)
    out.push({ q: `A car's position after t seconds is s(t) = t² metres. Its velocity is s′(t) = 2t. Find the velocity at t = ${t}`, a: `${2 * t}`, diff: t + 30, key: `sl:v${t}`, fmt: "word" });
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
    { id: "q-meet", label: "Meet the parabola", objective: "Student explores a parabola by dragging its vertex on a coordinate plane", grade: "Grade 9", stars: 1, range: [1, 4], multiFormat: true, pool: qMeetParabola, example: { problem: "Drag the vertex to the point (2, 1).", steps: ["The vertex is the turning point of the parabola", "Move it to x = 2, y = 1"], answer: "2,1" } },
    { id: "q-recognize", label: "Perfect squares & square roots", objective: "Student recognizes perfect squares and their square roots", grade: "Grade 9", stars: 1, range: [5, 16], multiFormat: true, pool: qRecognize, example: { problem: "Is 49 a perfect square?", steps: ["7 × 7 = 49, so yes", "√49 = 7"], answer: "True" } },
    { id: "q-solve-perfect", label: "Solve x² = k (perfect squares)", objective: "Student solves x² = k, finding BOTH the positive and negative root", grade: "Grade 9", stars: 2, range: [17, 32], multiFormat: true, pool: qSolvePerfect, example: { problem: "Solve x² = 49", steps: ["Take the square root of both sides", "Remember both signs", "x = ±7"], answer: "±7" } },
    { id: "q-larger", label: "Larger, estimate & simplify roots", objective: "Student solves larger squares and estimates/simplifies non-perfect roots", grade: "Grade 9-10", stars: 3, range: [33, 48], multiFormat: true, pool: qLargerNonPerfect, example: { problem: "Simplify the square root of 50.", steps: ["50 = 25 × 2", "√25 × √2 = 5√2"], answer: "5√2" } },
    { id: "q-zero", label: "Zero-product property", objective: "Student solves factored quadratics", grade: "Grade 9", stars: 3, range: [49, 62], multiFormat: true, pool: qZeroProduct, example: { problem: "Solve (x - 2)(x - 5) = 0", steps: ["Set each factor to 0", "x = 2 or x = 5"], answer: "2, 5" } },
    { id: "q-factor", label: "Solve by factoring", objective: "Student solves x² - Sx + P = 0 by factoring", grade: "Grade 9-10", stars: 4, range: [63, 76], multiFormat: true, pool: qFactor, example: { problem: "Solve x² - 7x + 12 = 0", steps: ["Find two numbers that multiply to 12, add to 7: 3 and 4", "x = 3 or x = 4"], answer: "3, 4" } },
    { id: "q-disc", label: "Discriminant & # of solutions", objective: "Student computes b² - 4ac and reads its sign", grade: "Grade 10", stars: 4, range: [77, 90], multiFormat: true, pool: qDiscriminant, example: { problem: "How many real solutions? x² + 2x + 5 = 0", steps: ["b² - 4ac = 4 - 20 = -16", "Negative → no real solutions"], answer: "0" } },
    { id: "q-evalaxis", label: "Evaluate & axis of symmetry", objective: "Student evaluates quadratics, finding the axis x = -b/2a", grade: "Grade 10", stars: 5, range: [91, 100], multiFormat: true, pool: () => [...qEvaluateAxis(), ...qSelectQuadratics()], example: { problem: "Axis of symmetry of y = x² + 6x", steps: ["A parabola is symmetric — the axis runs through its vertex", "For y = x² + bx the axis is x = -b/2", "Here b = 6: x = -6/2 = -3"], answer: "x = -3" } },
  ],
  M14: [
    { id: "f-lin", label: "Evaluate f(x) = mx + b", objective: "Student evaluates a linear function", grade: "Grade 8-9", stars: 2, range: [1, 16], multiFormat: true, pool: () => [...diversify(fEvalLinear()), ...fGraphLinear()], example: { problem: "f(x) = 2x + 3. Find f(4)", steps: ["f(4) means: replace every x with 4", "f(4) = 2(4) + 3", "Multiply first: 8, then add 3"], answer: "11" } },
    { id: "f-quad", label: "Evaluate a quadratic function", objective: "Student evaluates f(x) = x² + c", grade: "Grade 9", stars: 3, range: [17, 32], multiFormat: true, pool: () => withReview([...diversify(fEvalQuad()), ...fVertexDrag()], fEvalLinear), example: { problem: "f(x) = x² + 5. Find f(3)", steps: ["f(3) means: replace x with 3", "f(3) = (3)² + 5", "Square first: 9, then add 5"], answer: "14" } },
    { id: "f-compose", label: "Composition of functions", objective: "Student evaluates f(g(x))", grade: "Grade 10", stars: 4, range: [33, 50], multiFormat: true, pool: () => withReview(diversify(fCompose()), fEvalQuad), example: { problem: "f(x) = x + 1, g(x) = 2x. Find f(g(3))", steps: ["g(3) = 6", "f(6) = 7"], answer: "7" } },
    { id: "f-domain", label: "Domain of a rational function", objective: "Student finds excluded x-values", grade: "Grade 10", stars: 4, range: [51, 68], multiFormat: true, pool: () => withReview(diversify(fDomain()), fCompose), example: { problem: "Domain of f(x) = 1/(x - 4)", steps: ["Ask: what x would BREAK this function?", "Dividing by zero is impossible, so the denominator can't be 0", "x - 4 ≠ 0 → x ≠ 4; every other x is allowed"], answer: "x ≠ 4" } },
    { id: "f-range", label: "Range of a quadratic", objective: "Student finds the minimum of x² + c", grade: "Grade 10", stars: 4, range: [69, 84], multiFormat: true, pool: () => withReview(diversify(fRange()), fDomain), example: { problem: "Range of f(x) = x² + 2", steps: ["x² is never negative — its smallest value is 0 (at x = 0)", "So the smallest output is 0 + 2 = 2", "Every larger output happens too: y ≥ 2"], answer: "y ≥ 2" } },
    { id: "f-inverse", label: "Inverse functions", objective: "Student evaluates an inverse function", grade: "Grade 10-11", stars: 5, range: [85, 100], multiFormat: true, pool: () => withReview(diversify(fInverseLinear()), fRange), example: { problem: "f(x) = x + 5. Find f⁻¹(12)", steps: ["Inverse undoes +5", "12 - 5"], answer: "7" } },
  ],
  M15: [
    { id: "t-hyp", label: "Pythagorean theorem", objective: "Student finds a hypotenuse", grade: "Grade 9", stars: 2, range: [1, 16], multiFormat: true, pool: () => diversify(tHypotenuse()), example: { problem: "Legs 3 and 4. Find the hypotenuse", steps: ["The hypotenuse is the longest side: a² + b² = c²", "3² + 4² = 9 + 16 = 25, so c² = 25", "Square root at the end: c = √25 = 5"], answer: "5" } },
    { id: "t-ratio", label: "Right-triangle ratios", objective: "Student writes sin, cos, tan as ratios", grade: "Grade 10", stars: 3, range: [17, 34], multiFormat: true, pool: () => withReview([...diversify(tRatio()), ...tAngleDrag()], tHypotenuse), example: { problem: "opposite = 3, hypotenuse = 5. Find sin θ", steps: ["Label the sides FROM the angle first", "SOH: Sine = Opposite over Hypotenuse", "sin θ = 3/5"], answer: "3/5" } },
    { id: "t-unit", label: "Unit-circle values", objective: "Student recalls sin/cos/tan of standard angles", grade: "Grade 11", stars: 4, range: [35, 56], multiFormat: true, pool: () => withReview([...diversify(tUnitCircle()), ...tAngleDrag()], tRatio), example: { problem: "Evaluate sin 30°.", steps: ["30° is a special angle — its values come from the 30-60-90 triangle (sides 1, √3, 2)", "sin = opposite/hypotenuse = 1/2", "On the unit circle: sin 30° is the y-coordinate at 30°"], answer: "1/2" } },
    { id: "t-rad", label: "Degrees to radians", objective: "Student converts degrees to radians", grade: "Grade 11", stars: 4, range: [57, 78], multiFormat: true, pool: () => withReview([...diversify(tDegRad()), ...tAngleDragRad()], tUnitCircle), example: { problem: "Convert 90° to radians", steps: ["π radians = 180°, so degrees → radians is × π/180", "90 × π/180 = 90π/180", "Simplify the fraction: 90/180 = 1/2 → π/2"], answer: "π/2" } },
    { id: "t-ident", label: "Pythagorean identity", objective: "Student uses sin²θ + cos²θ = 1", grade: "Grade 11-12", stars: 5, range: [79, 100], multiFormat: true, pool: () => withReview(diversify(tPythagIdentity()), tDegRad), example: { problem: "sin θ = 3/5. Find cos θ (acute)", steps: ["The identity: sin²θ + cos²θ = 1", "cos²θ = 1 - (3/5)² = 1 - 9/25 = 16/25", "cos θ = √(16/25) = 4/5 (positive — the angle is acute)"], answer: "4/5" } },
  ],
  M16: [
    // ── Polynomial graph analysis + advanced solving (Tier 3) — each a
    // single-task unit so a sheet states its instruction once. ──
    { id: "a-endbehav", label: "End behavior", objective: "Student determines end behavior from degree and leading coefficient", grade: "Grade 10", stars: 3, range: [1, 8], multiFormat: true, pool: () => a2EndBehavior(), example: { problem: "As x → −∞, f(x) = -x³ + 2x - 1 → ?", steps: ["Odd degree, negative lead: the left end rises", "As x → −∞, f(x) → +∞"], answer: "+∞" } },
    { id: "a-yint", label: "y-intercept of a polynomial", objective: "Student finds the y-intercept (the constant term)", grade: "Grade 10", stars: 2, range: [9, 15], multiFormat: true, pool: () => withReview(diversify(a2YIntercept()), a2EndBehavior), example: { problem: "y-intercept of f(x) = 2x² + 3x - 5", steps: ["Set x = 0 → f(0) = the constant term", "y = -5"], answer: "-5" } },
    { id: "a-xint", label: "x-intercepts (roots)", objective: "Student finds x-intercepts from factored form", grade: "Grade 10", stars: 3, range: [16, 23], multiFormat: true, pool: () => withReview(diversify(a2XIntercepts()), a2YIntercept), example: { problem: "f(x) = (x − 2)(x + 3) crosses the x-axis at x = 2 and x = ?", steps: ["Set each factor to 0: x + 3 = 0", "x = -3"], answer: "-3" } },
    { id: "a-mult", label: "Multiplicity — cross or bounce", objective: "Student uses root multiplicity to decide cross vs. bounce", grade: "Grade 10-11", stars: 4, range: [24, 31], multiFormat: true, pool: () => withReview(a2Multiplicity(), a2XIntercepts), example: { problem: "For f(x) = (x − 2)²(x + 1), at x = 2 the graph ___ the x-axis.", steps: ["Multiplicity 2 is even → the graph is tangent", "It bounces (touches)"], answer: "bounces (touches)" } },
    { id: "a-turning", label: "Turning points", objective: "Student finds the maximum number of turning points", grade: "Grade 10-11", stars: 4, range: [32, 38], multiFormat: true, pool: () => withReview(diversify(a2TurningPoints()), a2Multiplicity), example: { problem: "A polynomial of degree 5 has at most how many turning points?", steps: ["A degree-n polynomial has at most n − 1 turning points", "5 − 1 = 4"], answer: "4" } },
    { id: "a-fta", label: "Fundamental Theorem of Algebra", objective: "Student applies the Fundamental Theorem of Algebra", grade: "Grade 11", stars: 4, range: [39, 45], multiFormat: true, pool: () => withReview(diversify(a2FTA()), a2TurningPoints), example: { problem: "A degree-4 polynomial has exactly how many roots (with multiplicity)?", steps: ["The Fundamental Theorem of Algebra: a degree-n polynomial has exactly n roots", "4"], answer: "4" } },
    { id: "a-synthetic", label: "Synthetic division", objective: "Student finds a remainder by synthetic division (Remainder Theorem)", grade: "Grade 11", stars: 5, range: [46, 54], multiFormat: true, pool: () => withReview(diversify(a2SyntheticDiv()), a2FTA), example: { problem: "Remainder when x² + 5x + 6 is divided by (x − 2)", steps: ["Remainder Theorem: remainder = f(2)", "2² + 5·2 + 6 = 20"], answer: "20" } },
    { id: "a-rrt", label: "Rational Root Theorem", objective: "Student lists possible rational roots", grade: "Grade 11", stars: 5, range: [55, 60], multiFormat: true, pool: () => withReview(a2RRT(), a2SyntheticDiv), example: { problem: "A possible rational root of x² − x − 6 (leading coefficient 1) is one of the ± divisors of 6.", steps: ["Possible rational roots = ± divisors of the constant: ±1, ±2, ±3, ±6", "3 is one of them"], answer: "3" } },
    // ── Logs, exponentials & complex numbers ──
    { id: "a-log", label: "Evaluate logarithms", objective: "Student evaluates log_b(bᵏ)", grade: "Grade 10-11", stars: 3, range: [61, 68], multiFormat: true, pool: () => withReview(diversify(a2Log()), a2RRT), example: { problem: "Evaluate log_2(8)", steps: ["log_2(8) asks: 2 to WHAT power gives 8?", "Try powers of 2: 2¹=2, 2²=4, 2³=8", "The power is 3"], answer: "3" } },
    { id: "a-exp", label: "Evaluate exponentials", objective: "Student evaluates powers", grade: "Grade 9-10", stars: 2, range: [69, 76], multiFormat: true, pool: () => withReview(diversify(a2ExpEval()), a2Log), example: { problem: "Evaluate 2⁴", steps: ["2⁴ means 2 multiplied by itself 4 times", "2×2 = 4, ×2 = 8, ×2 = 16", "Not 2×4 — a power is repeated multiplication"], answer: "16" } },
    { id: "a-expsolve", label: "Solve exponential equations", objective: "Student solves bˣ = bᵏ", grade: "Grade 11", stars: 4, range: [77, 84], multiFormat: true, pool: () => withReview(diversify(a2ExpSolve()), a2ExpEval), example: { problem: "Solve 3ˣ = 81", steps: ["Make both sides a power of the SAME base", "81 = 3⁴, so the equation is 3ˣ = 3⁴", "Same base → the exponents must match: x = 4"], answer: "4" } },
    { id: "a-poweri", label: "Powers of i", objective: "Student simplifies powers of i", grade: "Grade 11", stars: 4, range: [85, 92], multiFormat: true, pool: () => withReview(diversify(a2PowersOfI()), a2ExpSolve), example: { problem: "Simplify i³", steps: ["The definition: i² = -1", "i³ = i² × i = (-1) × i", "So i³ = -i (the powers cycle: i, -1, -i, 1)"], answer: "-i" } },
    { id: "a-complex", label: "Add complex numbers", objective: "Student adds complex numbers", grade: "Grade 11-12", stars: 5, range: [93, 100], multiFormat: true, pool: () => withReview(diversify(a2ComplexAdd()), a2PowersOfI), example: { problem: "Add: (2 + 3i) + (1 + i)", steps: ["Keep the parts separate — real with real, imaginary with imaginary", "Real: 2 + 1 = 3 · Imaginary: 3i + i = 4i", "Combine: 3 + 4i"], answer: "3 + 4i" } },
  ],
  M17: [
    { id: "p-conics", label: "Parabolas & conics", objective: "Student graphs parabolas by vertex and matches equations to graphs", grade: "Grade 11", stars: 3, range: [1, 12], multiFormat: true, pool: () => pcConics(), example: { problem: "Drag the vertex of the parabola to the point (2, 1).", steps: ["The vertex of y = (x − 2)² + 1 is (2, 1)", "Move the vertex there"], answer: "2,1" } },
    { id: "p-anth", label: "Arithmetic sequences", objective: "Student finds the nth term", grade: "Grade 10-11", stars: 3, range: [13, 28], multiFormat: true, pool: () => diversify(pcArithNth()), example: { problem: "First term 3, common difference 2. Find term 5", steps: ["Term 5 is 4 JUMPS after term 1", "Each jump adds the common difference 2: 4 × 2 = 8", "Term 5 = 3 + 8 = 11"], answer: "11" } },
    { id: "p-asum", label: "Arithmetic series", objective: "Student sums an arithmetic series", grade: "Grade 11", stars: 4, range: [29, 44], multiFormat: true, pool: () => withReview(diversify(pcArithSum()), pcArithNth), example: { problem: "Sum of the first 4 terms: first term 2, common difference 3", steps: ["Sum formula: (number of terms ÷ 2) × (first + last)", "Last term = 2 + 3×3 = 11, so first + last = 2 + 11 = 13", "Sum = 4/2 × 13 = 26"], answer: "26" } },
    { id: "p-geo", label: "Geometric sequences", objective: "Student finds a geometric term", grade: "Grade 11", stars: 4, range: [45, 58], multiFormat: true, pool: () => withReview(diversify(pcGeoNth()), pcArithSum), example: { problem: "First term 2, ratio 3. Find term 3", steps: ["Geometric: each term MULTIPLIES by the ratio", "Term 3 is 2 jumps after term 1: multiply by 3 twice → 3² = 9", "Term 3 = 2 × 9 = 18"], answer: "18" } },
    { id: "p-limpoly", label: "Limits of polynomials", objective: "Student evaluates limits by substitution", grade: "Grade 12", stars: 4, range: [59, 72], multiFormat: true, pool: () => withReview(diversify(pcLimitPoly()), pcGeoNth), example: { problem: "lim(x→2) (x² + 3x + 1)", steps: ["Polynomials are smooth — the limit is just the value", "Substitute x = 2: (2)² + 3(2) + 1", "4 + 6 + 1 = 11"], answer: "11" } },
    { id: "p-limfac", label: "Limits by factoring", objective: "Student resolves 0/0 limits", grade: "Grade 12", stars: 5, range: [73, 86], multiFormat: true, pool: () => withReview(diversify(pcLimitFactor()), pcLimitPoly), example: { problem: "lim(x→3) (x² - 9)/(x - 3)", steps: ["Factor → (x + 3)", "Substitute 3"], answer: "6" } },
    { id: "p-vec", label: "Vectors", objective: "Student finds vector magnitude and sums", grade: "Grade 12", stars: 5, range: [87, 100], multiFormat: true, pool: () => withReview(diversify([...pcVectorMag(), ...pcVectorAdd()]), pcLimitFactor), example: { problem: "Magnitude of (3, 4)", steps: ["Magnitude = the vector's length (Pythagorean theorem)", "|v| = √(3² + 4²) = √(9 + 16) = √25", "|v| = 5"], answer: "5" } },
  ],
  M18: [
    { id: "c-dpow", label: "Power rule", objective: "Student differentiates xⁿ", grade: "Grade 12", stars: 3, range: [1, 16], multiFormat: true, pool: () => caDerivPower(), example: { problem: "d/dx x³", steps: ["Power rule: the exponent comes DOWN in front as a multiplier", "Then the exponent drops by 1: 3 → 2", "d/dx x³ = 3x²"], answer: "3x²" } },
    { id: "c-dmono", label: "Differentiate monomials", objective: "Student differentiates axⁿ", grade: "Grade 12", stars: 4, range: [17, 36], multiFormat: true, pool: () => withReview(caDerivMono(), caDerivPower), example: { problem: "d/dx 3x²", steps: ["Multiply the coefficient by the exponent: 3 × 2 = 6", "Reduce the exponent by 1: x² → x¹", "d/dx 3x² = 6x"], answer: "6x" } },
    { id: "c-deval", label: "Evaluate a derivative", objective: "Student evaluates f'(x) at a point", grade: "Grade 12", stars: 4, range: [37, 56], multiFormat: true, pool: () => withReview(diversify(caDerivEval()), caDerivMono), example: { problem: "f(x) = x² + 2x + 1. Find f'(3)", steps: ["f'(x) = 2x + 2", "2(3) + 2"], answer: "8" } },
    { id: "c-ipow", label: "Integrate powers", objective: "Student integrates xⁿ", grade: "Grade 12", stars: 4, range: [57, 76], multiFormat: true, pool: () => withReview(caIntegralPower(), caDerivMono), example: { problem: "∫ x² dx", steps: ["Raise power, divide", "x³/3 + C"], answer: "x³/3 + C" } },
    { id: "c-idef", label: "Definite integrals", objective: "Student evaluates a definite integral", grade: "Grade 12", stars: 5, range: [77, 90], multiFormat: true, pool: () => withReview(diversify(caIntegralDef()), caIntegralPower), example: { problem: "∫₀^4 x dx", steps: ["x²/2 from 0 to 4", "16/2"], answer: "8" } },
    { id: "c-slope", label: "Slope as a derivative", objective: "Student finds the slope of a curve", grade: "Grade 12", stars: 5, range: [91, 100], multiFormat: true, pool: () => withReview(diversify(caSlope()), caDerivEval), example: { problem: "Slope of y = x² at x = 5", steps: ["The slope of a curve at a point IS its derivative there", "Differentiate: dy/dx of x² is 2x", "At x = 5: slope = 2 × 5 = 10"], answer: "10" } },
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
    // At most TWICE, and a SHORTER sheet rather than a third pass: seeing the
    // same question a third time reads as a bug, not as practice. Small pools
    // (M16 synthetic division, M17 graph-match) were serving 30-problem sheets
    // built from 10 questions asked three times each.
    const MAX_REPEATS = 2;
    for (let i = 0; i < Math.min(count, N * MAX_REPEATS); i++) out.push(sorted[i % N]);
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
  if (N <= count) {
    // Small pool that must repeat → SHUFFLE per sheet (seeded) so consecutive
    // sheets show a DIFFERENT order instead of the identical list every time
    // (the "power rule looks the same every sheet" report).
    const bag = [...sorted];
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    // Cap at TWO passes and return a SHORTER sheet rather than a third: the
    // windowed path below already forbids a repeated stem, and a small pool
    // is a reason for fewer questions, not for asking one three times.
    const MAX_REPEATS = 2;
    const out: XP[] = [];
    for (let i = 0; i < Math.min(count, N * MAX_REPEATS); i++) out.push(bag[i % N]);
    return out;
  }
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
  // Round-robin MERGE by format instead of a pure difficulty sort: a diff sort
  // put same-shaped items (adjacent diffs) back to back — students saw runs of
  // 9 near-identical stems. Each format keeps its internal easy→hard order, so
  // the sheet still ramps, but consecutive questions change shape.
  out.sort((a, b) => a.diff - b.diff);
  const groups = new Map<string, XP[]>();
  for (const v of out) { const f = v.fmt ?? "_"; const g = groups.get(f); if (g) g.push(v); else groups.set(f, [v]); }
  if (groups.size <= 1) return out;
  // Spread each format EVENLY across the sheet by fractional position (a plain
  // round-robin dumps the dominant format's leftovers in one block at the end).
  // Each format keeps its internal easy→hard order so the sheet still ramps.
  const placed: { v: XP; pos: number }[] = [];
  for (const [f, list] of groups)
    list.forEach((v, j) => placed.push({ v, pos: (j + 0.5) / list.length + hashStr(f) / 4294967296 * 0.001 }));
  placed.sort((a, b) => a.pos - b.pos);
  return placed.map((p) => p.v);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function isHigherMathLevel(code: string): boolean {
  return code in CURRICULA;
}
// Ordered skill map (real content units) for a higher-math level (M13–M18).
export function higherMathUnits(code: string): { index: number; id: string; label: string; objective: string; grade: string; range: [number, number] }[] {
  return (CURRICULA[code] ?? []).map((u, i) => ({ index: i, id: u.id, label: u.label, objective: u.objective, grade: u.grade, range: u.range }));
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
    ...(p.answerType ? { answerType: p.answerType } : {}),
    ...(p.interactive ? { interactive: p.interactive } : {}),
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
    // Formats are interleaved within a sheet (anti-monotony), so compare the
    // second half's average difficulty to the first half's rather than the
    // literal first/last items.
    const half = Math.floor(sel.length / 2);
    const avg = (xs: typeof sel) => xs.reduce((a, p) => a + p.diff, 0) / xs.length;
    if (avg(sel.slice(half)) < avg(sel.slice(0, half)) - 2) issues.push(`${code} sheet ${s}: not ascending`);
    const mean = avg(sel);
    gpi.push(Math.round(mean * 10) / 10);
    // Small jitter between neighbouring sheets is fine (spiral-review items are
    // diff-scattered across the unit band, which wobbles small-pool means by
    // well under a point on the 100-point GPI scale); flag real regressions.
    if (mean < prevMean - 1.0) issues.push(`${code} sheet ${s}: GPI dropped ${prevMean.toFixed(1)}→${mean.toFixed(1)}`);
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
