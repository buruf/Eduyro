// src/remotion/lesson/units-quad.ts
// Units for the QUADRATICS template (M13, Grade 9) — the road from "what is a
// square root" to "how many solutions does this equation have".
//
// The through-line is that a quadratic has TWO answers, and each unit is one
// more way of finding both of them:
//
//   perfect-squares  a square number is literally a square you can draw
//   solve-x2-k       x² = 9 has TWO answers, because squaring kills the sign
//   simplify-roots   pull the largest square out from under the root
//   zero-product     a product is zero only if one of its factors is
//   solve-factoring  factor first, then let zero-product finish it
//   discriminant     one number tells you how many answers exist at all

export interface QuadUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "perfect-squares" | "solve-x2-k" | "simplify-roots" | "zero-product" | "solve-factoring" | "discriminant";
  /** Primary number: the square, the k in x² = k, the number under the root. */
  a: number;
  /** Second number: the roots of the factored form, or b in ax² + bx + c. */
  b: number;
  c?: number;
  tip: string;
}

export const QUAD_UNITS: QuadUnit[] = [
  {
    id: "cur-perfect-squares",
    label: "Perfect squares & square roots",
    mode: "perfect-squares",
    a: 36,
    b: 6, // 6 × 6
    tip: "A perfect square really is a square you can build",
  },
  {
    id: "cur-solve-x2-k",
    label: "Solve x² = k (perfect squares)",
    mode: "solve-x2-k",
    a: 9,
    b: 3, // x = ±3
    tip: "Squaring hides the sign, so the answer comes back in a pair",
  },
  {
    id: "cur-simplify-roots",
    label: "Larger, estimate & simplify roots",
    mode: "simplify-roots",
    a: 8,
    b: 4, // 8 = 4 × 2, so √8 = 2√2
    tip: "Split off the biggest perfect square, then walk it out",
  },
  {
    id: "cur-zero-product",
    label: "Zero-product property",
    mode: "zero-product",
    a: 3,
    b: 5, // (x − 3)(x − 5) = 0
    tip: "Zero is the only number that forces a factor to be zero",
  },
  {
    id: "cur-solve-factoring",
    label: "Solve by factoring",
    mode: "solve-factoring",
    a: 3,
    b: 6, // x² − 9x + 18 = 0  →  (x − 3)(x − 6)
    tip: "Get zero on one side, factor, then read off the roots",
  },
  {
    // b² − 4ac = 16 − 24 = −8. Negative, so the parabola never reaches
    // the axis — chosen deliberately over a tidy positive discriminant,
    // because "no real solutions" is the case students refuse to believe.
    id: "cur-discriminant",
    label: "Discriminant & # of solutions",
    mode: "discriminant",
    a: 1,
    b: 4,
    c: 6,
    tip: "The discriminant counts the answers before you find them",
  },
];

export function quadUnitById(id: string): QuadUnit {
  const u = QUAD_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No quadratics unit "${id}"`);
  return u;
}

export function quadNumbers(u: QuadUnit) {
  const c = u.c ?? 0;
  return {
    a: u.a,
    b: u.b,
    c,
    /** perfect-squares: 6 × 6 = 36 */
    side: u.b,
    square: u.a,
    /** solve-x2-k: both answers */
    posRoot: u.b,
    negRoot: -u.b,
    /** simplify-roots: 8 = 4 × 2 → 2√2 */
    factor: u.b,
    outside: Math.round(Math.sqrt(u.b)),
    inside: u.a / u.b,
    /** zero-product / solve-factoring: the two roots and the expanded middle */
    root1: u.a,
    root2: u.b,
    sum: u.a + u.b,
    product: u.a * u.b,
    /** discriminant: b² − 4ac */
    bSquared: u.b * u.b,
    fourAC: 4 * u.a * c,
    discriminant: u.b * u.b - 4 * u.a * c,
  };
}
