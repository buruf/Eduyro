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
    | "applications";
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
];

export function advancedUnitById(id: string): AdvancedUnit {
  const u = ADVANCED_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No advanced unit "${id}"`);
  return u;
}
