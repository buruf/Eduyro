// src/remotion/lesson/units-decimalops.ts
// Units for the DECIMAL OPERATIONS template (M7/M8's second half): comparing,
// rounding, multiplying two decimals, dividing, and the two percent skills
// that are really decimal skills wearing a % sign.
//
// The hundred grid is the shared picture, inherited from the earlier decimal
// videos. Two additions it cannot make: rounding needs a NUMBER LINE (nearer
// to which mark?), and multiplying two decimals needs the grid cut BOTH ways
// — the same move the fraction-multiply video makes, which is exactly why
// 0.3 × 0.4 comes out SMALLER than either factor.

export interface DecimalOpsUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "compare" | "round" | "multiply2" | "divide" | "percent-of" | "percent-change";
  /** Primary decimal. */
  a: number;
  /** Second decimal (compare/multiply2/divide), or the whole for percent modes. */
  b?: number;
  /** percent modes: the percentage. round: the place, 1 = tenths. */
  pct?: number;
  place?: number;
  tip: string;
}

export const DECIMAL_OPS_UNITS: DecimalOpsUnit[] = [
  {
    id: "cur-compare-decimals",
    label: "Compare decimals",
    mode: "compare",
    a: 0.3,
    b: 0.25,
    tip: "More digits does not mean bigger - line them up and look",
  },
  {
    id: "cur-round-decimals",
    label: "Round decimals",
    mode: "round",
    a: 0.67,
    place: 1, // to the nearest tenth
    tip: "Which mark is it nearer? That is the whole rule",
  },
  {
    id: "cur-multiply-decimals",
    label: "Multiply decimals",
    mode: "multiply2",
    a: 0.3,
    b: 0.4, // 0.12
    tip: "Multiplying by less than one makes it smaller",
  },
  {
    id: "cur-divide-decimals",
    label: "Divide decimals",
    mode: "divide",
    a: 0.8,
    b: 0.2, // 4
    tip: "Division asks how many fit - decimals are no different",
  },
  {
    id: "cur-percent-of",
    label: "Percent of a number",
    mode: "percent-of",
    a: 60, // the whole
    pct: 20, // 20% of 60 = 12
    tip: "Percent means per hundred, so 20% is 20 hundredths of it",
  },
  {
    id: "cur-percent-change",
    label: "Percent increase & decrease",
    mode: "percent-change",
    a: 40, // start
    pct: 25, // +25% -> 50
    tip: "Find the part first, then add it on or take it off",
  },
];

export function decimalOpsUnitById(id: string): DecimalOpsUnit {
  const u = DECIMAL_OPS_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No decimal-ops unit "${id}"`);
  return u;
}

/** Values narration and visuals share. Rounded to kill float noise
 *  (0.3 * 0.4 is 0.12000000000000001 in binary floating point). */
export function decimalOpsNumbers(u: DecimalOpsUnit) {
  const round2 = (v: number) => Math.round(v * 100) / 100;
  const a = u.a;
  const b = u.b ?? 0;
  const pct = u.pct ?? 0;
  return {
    a,
    b,
    pct,
    /** compare: cells out of 100 for each. */
    aCells: Math.round(a * 100),
    bCells: Math.round(b * 100),
    bigger: a > b ? a : b,
    smaller: a > b ? b : a,
    /** multiply2 */
    product: round2(a * b),
    aTenths: Math.round(a * 10),
    bTenths: Math.round(b * 10),
    /** divide */
    quotient: b ? round2(a / b) : 0,
    /** round: the two neighbouring marks and the answer. */
    lower: Math.floor(a * 10) / 10,
    upper: Math.round((Math.floor(a * 10) / 10 + 0.1) * 10) / 10,
    rounded: Math.round(a * 10) / 10,
    /** percent-of: 20% of 60 = 12 */
    part: round2((a * pct) / 100),
    /** percent-change */
    increased: round2(a + (a * pct) / 100),
    decreased: round2(a - (a * pct) / 100),
  };
}
