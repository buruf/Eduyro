// src/remotion/lesson/units-prealg.ts
// Units for the PRE-ALGEBRA template (M10, Grade 6-7).
//
// This is where a child meets a LETTER for the first time, and almost every
// later mistake in algebra is seeded here. So each unit is built around the
// one misconception that actually derails students at this stage:
//
//   evaluate-add   an expression is a RULE, not a number - change x and the
//                  answer changes
//   evaluate-mul   3x means 3 TIMES x. Not thirty-something, not 3 plus x
//   like-terms     x is a thing you can count; 3 of them plus 2 of them is 5
//                  of them - and 3x + 2 will not combine, ever
//   distribute     the 3 outside reaches EVERY term inside, shown as area so
//                  missing one is visibly impossible
//   solve-times    dividing both sides is sharing both sides equally
//   integers       + and - are DIRECTIONS on the number line, not moods
//
// Every number below is chosen to be small enough to hold in your head, so
// the arithmetic never distracts from the idea being taught.

export interface PreAlgUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "evaluate-add" | "evaluate-mul" | "like-terms" | "distribute" | "solve-times" | "integers";
  /** evaluate-add: the constant added; distribute: the number outside. */
  a: number;
  /** the second number in play (bracket constant, second coefficient, ...) */
  b: number;
  /** the value substituted for x, and a second one to show the rule moving */
  at?: number;
  at2?: number;
  tip: string;
}

export const PRE_ALG_UNITS: PreAlgUnit[] = [
  {
    id: "cur-evaluate-expr",
    label: "Expressions · Evaluate (+/−)",
    mode: "evaluate-add",
    a: 7,
    b: 7, // the same 7, used as the subtraction case in the recap
    at: 4,
    at2: 10,
    tip: "An expression is a rule - feed it a number, get a number back",
  },
  {
    id: "cur-evaluate-product",
    label: "Expressions · Evaluate (×)",
    mode: "evaluate-mul",
    a: 3, // 3x
    b: 0,
    at: 4,
    at2: 10,
    tip: "3x is 3 TIMES x - the multiply sign is just hiding",
  },
  {
    id: "cur-like-terms",
    label: "Simplify · Combine like terms",
    mode: "like-terms",
    a: 3, // 3x
    b: 2, // + 2x
    tip: "Count the x's. Plain numbers are a different thing entirely",
  },
  {
    id: "cur-distribute",
    label: "Simplify · Distributive property",
    mode: "distribute",
    a: 3, // 3( x + 4 )
    b: 4,
    // The check value is 5, not 2: with x = 2 the bracket total and the first
    // product are both 6, and two different 6s in one spoken check is exactly
    // the kind of coincidence a child mistakes for the method.
    at: 5,
    tip: "The number outside reaches every term inside",
  },
  {
    id: "cur-one-step-times",
    label: "Equations · One-step (×)",
    mode: "solve-times",
    a: 4, // 4x = 12
    b: 12,
    tip: "Whatever you do to one side, do to the other",
  },
  {
    id: "cur-integer-add-sub",
    label: "Equations · Integer add & subtract",
    mode: "integers",
    a: -1, // (-1) - 4
    b: 4,
    tip: "Plus walks right, minus walks left - start where the first number is",
  },
];

export function preAlgUnitById(id: string): PreAlgUnit {
  const u = PRE_ALG_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No pre-algebra unit "${id}"`);
  return u;
}

export function preAlgNumbers(u: PreAlgUnit) {
  const at = u.at ?? 0;
  const at2 = u.at2 ?? 0;
  return {
    a: u.a,
    b: u.b,
    at,
    at2,
    /** evaluate-add: x + a, and the same with a minus */
    sum: at + u.a,
    sum2: at2 + u.a,
    difference: at - u.b,
    /** evaluate-mul: a·x */
    product: u.a * at,
    product2: u.a * at2,
    /** like-terms: a·x + b·x */
    combined: u.a + u.b,
    /** distribute: a(x + b) = a·x + a·b, checked at x = at */
    outer: u.a * u.b,
    inner: at + u.b,
    checkLeft: u.a * (at + u.b),
    checkRight: u.a * at + u.a * u.b,
    /** solve-times: a·x = b  →  x = b/a */
    solution: u.b / u.a,
    /** integers: a − b */
    integerResult: u.a - u.b,
    startAbs: Math.abs(u.a),
  };
}
