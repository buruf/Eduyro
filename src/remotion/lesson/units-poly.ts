// src/remotion/lesson/units-poly.ts
// Units for the POLYNOMIAL template (M12). Two pictures carry the level:
// algebra TILES (big square = x², bar = x, dot = 1) for classifying and
// adding — like terms are literally tiles of the same shape — and the AREA
// rectangle for multiplying and factoring, which are the same puzzle run in
// opposite directions.

export interface PolyUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "classify" | "add" | "multiply" | "factor";
  /** First polynomial's coefficients [x², x, 1] (classify/add), or the two
   *  bracket constants p, q of (x + p)(x + q) (multiply/factor). */
  a: [number, number, number];
  /** Second polynomial (add mode only). */
  b?: [number, number, number];
  p?: number;
  q?: number;
  tip: string;
}

export function polyText(c: [number, number, number]): string {
  let s = c[0] ? (c[0] === 1 ? "x²" : `${c[0]}x²`) : "";
  if (c[1]) s += `${s ? (c[1] > 0 ? " + " : " − ") : ""}${Math.abs(c[1]) === 1 ? "x" : `${Math.abs(c[1])}x`}`;
  if (c[2]) s += `${s ? (c[2] > 0 ? " + " : " − ") : ""}${Math.abs(c[2])}`;
  return s || "0";
}

export const POLY_UNITS: PolyUnit[] = [
  {
    id: "cur-classify-poly",
    label: "Classify polynomials by terms",
    mode: "classify",
    a: [3, 2, -5],
    tip: "Count the terms for the name, take the biggest exponent for the degree",
  },
  {
    id: "cur-add-poly",
    label: "Adding polynomials",
    mode: "add",
    a: [3, 2, 1],
    b: [1, 4, 2],
    tip: "Only like terms combine — sort by shape, add what matches",
  },
  {
    id: "cur-multiply-poly",
    label: "Multiplying polynomials",
    mode: "multiply",
    a: [0, 0, 0],
    p: 2,
    q: 3,
    tip: "Every term multiplies every term — the rectangle can't miss one",
  },
  {
    id: "cur-factoring",
    label: "Factoring",
    mode: "factor",
    a: [0, 0, 0],
    p: 2,
    q: 3,
    tip: "Multiply to the last number, add to the middle one",
  },
];

export function polyUnitById(id: string): PolyUnit {
  const u = POLY_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No poly unit "${id}"`);
  return u;
}
