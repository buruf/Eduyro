// src/remotion/lesson/units-factor.ts
// Units for the FACTORING template (M12, Grade 9) — the patterns beyond
// "find two numbers that multiply and add".
//
// Each unit is a pattern a student is supposed to RECOGNISE, so every video
// spends its time on the recognition, not the algebra:
//
//   trinomial-a    a ≠ 1, so the two-numbers trick needs the ac step first
//   diff-squares   two squares, a minus, and no middle term at all
//   perfect-square first and last are squares and the middle is twice their
//                  roots multiplied — that is the whole test
//   grouping       four terms, no common factor across all of them, so pair
//                  them up and factor twice
//   cubes          two cubes; the bracket that follows is not a guess
//
// The teaching numbers are deliberately NOT the tidiest ones the sheets can
// produce. x² + 2x + 1 is a perfect square, but 1 = 1² and 1 = 1 × 1 hides
// every moving part; x² + 6x + 9 shows them.

export interface FactorUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "trinomial-a" | "diff-squares" | "perfect-square" | "grouping" | "cubes";
  a: number;
  b: number;
  c: number;
  tip: string;
}

export const FACTOR_UNITS: FactorUnit[] = [
  {
    id: "cur-factor-trinomial-a",
    label: "Factor trinomials (a ≠ 1)",
    mode: "trinomial-a",
    a: 2,
    b: 7,
    c: 6, // 2x² + 7x + 6 = (2x + 3)(x + 2)
    tip: "Multiply a by c first - then the old trick works again",
  },
  {
    id: "cur-difference-squares",
    label: "Difference of squares",
    mode: "diff-squares",
    a: 1,
    b: 4, // x² − 16 = (x − 4)(x + 4)
    c: 16,
    tip: "Two squares with a minus between them - the middle always cancels",
  },
  {
    id: "cur-perfect-square-trinomial",
    label: "Perfect-square trinomials",
    mode: "perfect-square",
    a: 1,
    b: 3, // x² + 6x + 9 = (x + 3)²
    c: 9,
    tip: "Middle term is TWICE the roots multiplied - that is the test",
  },
  {
    id: "cur-factor-grouping",
    label: "Factor by grouping",
    mode: "grouping",
    a: 3,
    b: 2, // x³ + 3x² + 2x + 6 = (x + 3)(x² + 2)
    c: 6,
    tip: "Four terms, no common factor - so pair them and factor twice",
  },
  {
    id: "cur-cubes",
    label: "Sum & difference of cubes",
    mode: "cubes",
    a: 2, // x³ + 8 = (x + 2)(x² − 2x + 4)
    b: 8,
    c: 4,
    tip: "Same signs, opposite sign, always plus - and the middle never doubles",
  },
];

export function factorUnitById(id: string): FactorUnit {
  const u = FACTOR_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No factoring unit "${id}"`);
  return u;
}

export function factorNumbers(u: FactorUnit) {
  return {
    a: u.a,
    b: u.b,
    c: u.c,
    /** trinomial-a: 2x² + 7x + 6 — ac = 12, split 7 into 3 and 4 */
    ac: u.a * u.c,
    split1: 3,
    split2: 4,
    /** the two brackets: (2x + 3)(x + 2) */
    p: 3,
    q: 2,
    /** diff-squares: root of the constant */
    root: u.b,
    squared: u.c,
    /** perfect-square: (x + 3)², middle is 2 × 3 */
    half: u.b,
    middle: 2 * u.b,
    /** grouping: x³ + 3x² + 2x + 6 → (x + 3)(x² + 2) */
    g1: u.a,
    g2: u.b,
    /** cubes: x³ + 8 → (x + 2)(x² − 2x + 4) */
    cubeRoot: u.a,
    cube: u.b,
    cubeSquare: u.c,
  };
}
