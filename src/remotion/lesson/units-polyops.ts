// src/remotion/lesson/units-polyops.ts
// Units for the POLYNOMIAL OPERATIONS template (M12) — the technique drills
// that sit between "what is a polynomial" and factoring.
//
// The earlier Poly template owns the two conceptual pictures (algebra tiles
// for like terms, the area rectangle for products). These units are about
// what you DO to a polynomial, so the visuals are symbolic: terms that sort
// themselves, a substitution that resolves one step at a time, an area strip
// for distributing, and the GCF being physically pulled out front.

export interface PolyOpsUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "anatomy" | "evaluate" | "subtract" | "monomial-mult" | "divide-mono" | "gcf";
  /** Coefficients [x², x, 1] for the polynomial under study. */
  a: [number, number, number];
  /** Second polynomial (subtract). */
  b?: [number, number, number];
  /** evaluate: the value substituted for x. */
  at?: number;
  /** monomial-mult / divide-mono / gcf: coefficient + exponent of the monomial. */
  k?: number;
  p?: number;
  tip: string;
}

export const POLY_OPS_UNITS: PolyOpsUnit[] = [
  {
    id: "cur-poly-anatomy",
    label: "Write in standard form",
    mode: "anatomy",
    a: [3, 5, -2],
    tip: "Highest power first - then every part has a name",
  },
  {
    id: "cur-evaluate-poly",
    label: "Evaluate polynomials",
    mode: "evaluate",
    a: [3, 5, -2],
    at: 2, // 3(4) + 5(2) - 2 = 20
    tip: "A polynomial is a recipe: put the number in, work it out",
  },
  {
    id: "cur-subtract-poly",
    label: "Subtract polynomials",
    mode: "subtract",
    a: [5, 3, 7],
    b: [2, 4, 1], // 3x^2 - x + 6
    tip: "The minus applies to EVERY term in the second bracket",
  },
  {
    id: "cur-monomial-multiply",
    label: "Multiply monomials",
    mode: "monomial-mult",
    a: [0, 3, 0], // 3x
    k: 4,
    p: 2, // 4x^2  ->  12x^3
    tip: "Coefficients multiply; exponents ADD",
  },
  {
    id: "cur-divide-monomial",
    label: "Divide by a monomial",
    mode: "divide-mono",
    a: [6, 4, 0], // 6x^2 + 4x
    k: 2,
    p: 1, // divide by 2x -> 3x + 2
    tip: "Split the fraction term by term, then subtract exponents",
  },
  {
    id: "cur-factor-gcf",
    label: "Factor out the GCF",
    mode: "gcf",
    a: [6, 9, 0], // 6x^2 + 9x
    k: 3,
    p: 1, // GCF 3x -> 3x(2x + 3)
    tip: "Factoring out is distributing, run backwards",
  },
];

export function polyOpsUnitById(id: string): PolyOpsUnit {
  const u = POLY_OPS_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No poly-ops unit "${id}"`);
  return u;
}

/** Render a [x², x, 1] triple as readable algebra ("3x² + 5x − 2"). */
export function polyOpsText(c: [number, number, number]): string {
  let s = "";
  if (c[0]) s += c[0] === 1 ? "x²" : c[0] === -1 ? "−x²" : `${c[0]}x²`;
  if (c[1]) {
    const mag = Math.abs(c[1]) === 1 ? "x" : `${Math.abs(c[1])}x`;
    s += s ? `${c[1] > 0 ? " + " : " − "}${mag}` : c[1] < 0 ? `−${mag}` : mag;
  }
  if (c[2]) {
    const mag = String(Math.abs(c[2]));
    s += s ? `${c[2] > 0 ? " + " : " − "}${mag}` : c[2] < 0 ? `−${mag}` : mag;
  }
  return s || "0";
}

/** One monomial, e.g. k·x^p. */
export function monoText(k: number, p: number): string {
  const coef = k === 1 && p > 0 ? "" : String(k);
  if (p === 0) return String(k);
  if (p === 1) return `${coef}x`;
  return `${coef}x${p === 2 ? "²" : p === 3 ? "³" : `^${p}`}`;
}

export function polyOpsNumbers(u: PolyOpsUnit) {
  const [c2, c1, c0] = u.a;
  const b = u.b ?? [0, 0, 0];
  const at = u.at ?? 0;
  const k = u.k ?? 1;
  const p = u.p ?? 0;
  return {
    c2, c1, c0,
    b2: b[0], b1: b[1], b0: b[2],
    /** the monomial operand itself */
    k, p,
    /** anatomy */
    degree: c2 ? 2 : c1 ? 1 : 0,
    leading: c2 || c1 || c0,
    constant: c0,
    /** evaluate: the pieces and the total */
    at,
    sq: at * at,
    termSq: c2 * at * at,
    termX: c1 * at,
    value: c2 * at * at + c1 * at + c0,
    /** subtract: term-by-term difference */
    diff: [c2 - b[0], c1 - b[1], c0 - b[2]] as [number, number, number],
    /** monomial-mult: 3x · 4x² = 12x³ (coefficients multiply, exponents add) */
    monoCoef: c1 * k,
    monoExp: 1 + p,
    /** divide-mono: (6x² + 4x) / 2x = 3x + 2 */
    divA: c2 / k,
    divAExp: 2 - p,
    divB: c1 / k,
    divBExp: 1 - p,
    /** gcf: 6x² + 9x = 3x(2x + 3) */
    gcfA: c2 / k,
    gcfAExp: 2 - p,
    gcfB: c1 / k,
    gcfBExp: 1 - p,
  };
}
