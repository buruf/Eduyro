// src/remotion/lesson/units-advanced.ts
// Units for the ADVANCED template — the last M10/M16/M17/M18 stragglers, each
// on the simplest honest picture: integers ordered on a number line, order of
// operations as two competing paths, complex numbers and vectors as points
// and arrows on a plane, sequences as hops that pile into sums, and the power
// rule as a machine applied to concrete monomials. All numbers derive from
// the unit declaration.

export interface AdvancedUnit {
  id: string;
  label: string;
  mode:
    | "order-integers"
    | "order-ops"
    | "complex"
    | "sequence"
    | "vectors"
    | "power-rule"
    | "monomials"
    | "applications"
    // M16 polynomial behaviour, complex and exponential
    | "y-intercept"
    | "multiplicity"
    | "turning-points"
    | "fta"
    | "synthetic"
    | "rational-root"
    | "exponential"
    | "powers-of-i"
    // M17 / M18
    | "geometric"
    | "limit-poly"
    | "integrate-power";
  tip: string;
}

// Fixed teaching numbers per mode — small, clean, chosen once.
export const ADV = {
  integers: [-3, 5, -1, 2], // ordered: -3 < -1 < 2 < 5
  orderOps: { a: 3, b: 4, c: 2 }, // 3 + 4 × 2 → 11, not 14; (3+4)×2 = 14
  complex: { a: 3, b: 2, c: 1, d: 1 }, // (3+2i) + (1+1i) = 4+3i
  seq: { start: 3, step: 4, terms: 4 }, // 3, 7, 11, 15 → sums 3, 10, 21, 36
  vec: { v1: [3, 2] as [number, number], v2: [1, 3] as [number, number] }, // sum (4,5)
  power: { n1: 3, n2: 5 }, // x³ → 3x², x⁵ → 5x⁴
  mono: { k: 5, n: 3 }, // 5x³ → 15x²
  app: { t: 3 }, // s = t², v = 2t, at t=3 → 6
  // ── M16 / M17 / M18 ──────────────────────────────────────────────────────
  yInt: { a: 2, b: 2, c: -3 }, // f(x) = 2x² + 2x − 3, y-intercept −3
  mult: { r1: 2, m1: 2, r2: -3 }, // (x − 2)²(x + 3): bounce at 2, cross at −3
  turns: { degree: 4 }, // at most 3 turning points
  fta: { degree: 9 }, // exactly 9 roots counting multiplicity
  synth: { a: 2, b: 2, c: -3, r: 2 }, // (2x² + 2x − 3) ÷ (x − 2), remainder 9
  rational: { constant: 15, leading: 1, root: 3 }, // x² − x − 15
  expo: { base: 3, power: 3 }, // 3^x = 27 → x = 3
  imaginary: { cycle: 4 }, // i, −1, −i, 1
  geo: { first: 2, ratio: 3, term: 3 }, // 2, 6, 18 → term 3 is 18
  limit: { at: 4, c: 2 }, // lim x→4 (x² + x + 2) = 22
  integral: { n: 4 }, // ∫x⁴ dx = x⁵/5 + C
};

export const ADVANCED_UNITS: AdvancedUnit[] = [
  { id: "cur-order-integers", label: "Expressions · Order integers", mode: "order-integers", tip: "Further left on the line means smaller — minus signs and all" },
  { id: "cur-order-ops", label: "Simplify · Order of operations", mode: "order-ops", tip: "Multiply and divide before you add and subtract" },
  { id: "cur-complex", label: "Complex numbers", mode: "complex", tip: "a + bi is a point: a across, b up" },
  { id: "cur-sequences", label: "Sequences and series", mode: "sequence", tip: "A sequence lists the terms; a series adds them up" },
  { id: "cur-vectors", label: "Vectors", mode: "vectors", tip: "Add tip-to-tail — the components just add" },
  { id: "cur-power-rule", label: "Power rule", mode: "power-rule", tip: "Bring the exponent down, then drop it by one" },
  { id: "cur-diff-monomials", label: "Differentiate monomials", mode: "monomials", tip: "The coefficient rides along and multiplies" },
  { id: "cur-calc-applications", label: "Applications", mode: "applications", tip: "The derivative of position is speed" },
  { id: "cur-y-intercept", label: "y-intercept of a polynomial", mode: "y-intercept", tip: "The y-intercept is just f of zero" },
  { id: "cur-multiplicity", label: "Multiplicity — cross or bounce", mode: "multiplicity", tip: "Even multiplicity bounces; odd multiplicity crosses" },
  { id: "cur-turning-points", label: "Turning points", mode: "turning-points", tip: "At most one fewer turn than the degree" },
  { id: "cur-fta", label: "Fundamental Theorem of Algebra", mode: "fta", tip: "Degree n means exactly n roots, counting multiplicity" },
  { id: "cur-synthetic", label: "Synthetic division", mode: "synthetic", tip: "Bring down, multiply, add - and the last number is the remainder" },
  { id: "cur-rational-root", label: "Rational Root Theorem", mode: "rational-root", tip: "Possible roots are factors of the constant over factors of the leading coefficient" },
  { id: "cur-exponential-equations", label: "Solve exponential equations", mode: "exponential", tip: "Same base means the exponents must match" },
  { id: "cur-powers-of-i", label: "Powers of i", mode: "powers-of-i", tip: "The powers of i repeat every four" },
  { id: "cur-geometric", label: "Geometric sequences", mode: "geometric", tip: "Each term MULTIPLIES by the ratio" },
  { id: "cur-limit-poly", label: "Limits of polynomials", mode: "limit-poly", tip: "Polynomials have no gaps, so you can just substitute" },
  { id: "cur-integrate-powers", label: "Integrate powers", mode: "integrate-power", tip: "Add one to the power, divide by the new power, add C" },
];

export function advancedUnitById(id: string): AdvancedUnit {
  const u = ADVANCED_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No advanced unit "${id}"`);
  return u;
}
