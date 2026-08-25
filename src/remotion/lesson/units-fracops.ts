// src/remotion/lesson/units-fracops.ts
// Units for the FRACTION OPERATIONS template (M7's second half): subtract,
// multiply and divide fractions, mixed and improper numbers, and ordering.
// One visual language, inherited from the fraction-bar template: a bar cut
// into EQUAL parts. Multiplication adds the one picture a bar cannot draw -
// a fraction OF a fraction needs a grid cut both ways.
//
// Same contract as every unit file: any number a video says or shows derives
// from the declared fractions here, never typed twice.

export interface FracOpsUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "subtract" | "multiply" | "divide" | "mixed" | "improper" | "order";
  /** Primary fraction n/d. */
  n: number;
  d: number;
  /** Second fraction (subtract: same-d subtrahend numerator; multiply/divide:
   *  the second factor/divisor; order: the second of three). */
  n2?: number;
  d2?: number;
  /** order only: the third fraction. */
  n3?: number;
  d3?: number;
  tip: string;
}

export const FRAC_OPS_UNITS: FracOpsUnit[] = [
  {
    id: "cur-subtract-fractions",
    label: "Subtract fractions",
    mode: "subtract",
    n: 5, d: 8, n2: 2,
    tip: "Same-size pieces: subtract the tops, the bottom stays",
  },
  {
    id: "cur-multiply-fractions",
    label: "Multiply fractions",
    mode: "multiply",
    n: 1, d: 2, n2: 3, d2: 4, // 1/2 x 3/4 = 3/8
    tip: "Times means OF - tops multiply, bottoms multiply",
  },
  {
    id: "cur-divide-fractions",
    label: "Divide fractions",
    mode: "divide",
    n: 3, d: 4, n2: 1, d2: 4, // 3/4 / 1/4 = 3
    tip: "Division asks: how many of these fit in that?",
  },
  {
    id: "cur-mixed-numbers",
    label: "Mixed numbers",
    mode: "mixed",
    n: 3, d: 4, // 1 and 3/4
    tip: "A whole and a fraction, living together",
  },
  {
    id: "cur-improper-fractions",
    label: "Improper fractions",
    mode: "improper",
    n: 7, d: 4, // 7/4 = 1 whole + 3/4
    tip: "Top bigger than bottom just means more than one whole",
  },
  {
    id: "cur-order-fractions",
    label: "Order fractions",
    mode: "order",
    n: 3, d: 8, n2: 1, d2: 2, n3: 3, d3: 4, // 3/8 < 1/2 < 3/4
    tip: "Same-length bars turn ordering into looking",
  },
];

export function fracOpsUnitById(id: string): FracOpsUnit {
  const u = FRAC_OPS_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No fraction-ops unit "${id}"`);
  return u;
}

/** Derived values narration and visuals share. */
export function fracOpsNumbers(u: FracOpsUnit) {
  const wholeParts = u.d; // one whole bar, in d-size pieces
  return {
    n: u.n, d: u.d, n2: u.n2 ?? 0, d2: u.d2 ?? u.d, n3: u.n3 ?? 0, d3: u.d3 ?? u.d,
    diff: u.n - (u.n2 ?? 0), // subtract result numerator
    prodN: u.n * (u.n2 ?? 1), // multiply: tops
    prodD: u.d * (u.d2 ?? 1), // multiply: bottoms
    quot: u.d2 === u.d ? u.n / (u.n2 || 1) : NaN, // same-d division count
    wholes: Math.floor(u.n / u.d), // improper -> mixed
    rem: u.n % u.d,
    improperN: wholeParts + u.n, // mixed (1 n/d) -> improper top
  };
}
