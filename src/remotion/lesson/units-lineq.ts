// src/remotion/lesson/units-lineq.ts
// Units for the LINEAR EQUATIONS template (M11, Grade 8).
//
// M10 taught one-step equations. Everything here is the same single idea
// applied twice or in a different disguise: an equation is a BALANCE, and you
// may do anything you like to it provided you do it to both sides.
//
// The examples are taken from the MIDDLE of each unit's sheet range, not the
// first sheet. Sheet 1 of "variables on both sides" is 2x = x + 2, which a
// child can solve by staring at it — teaching on that example would teach
// staring, not the method.

export interface LinEqUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "two-step" | "distribute-eq" | "both-sides" | "fraction-eq" | "transform";
  /** two-step: ax − b = c · distribute: k(x + b) = c · both-sides: ax + b = cx + d */
  a: number;
  b: number;
  c: number;
  d?: number;
  /** transform: the point being moved, and the translation applied to it. */
  px?: number;
  py?: number;
  tx?: number;
  ty?: number;
  tip: string;
}

export const LIN_EQ_UNITS: LinEqUnit[] = [
  {
    id: "cur-two-step-minus",
    label: "Two-step equations (-)",
    mode: "two-step",
    a: 3,
    b: 4,
    c: 11, // 3x − 4 = 11  →  x = 5
    tip: "Undo in reverse order - the last thing done is the first thing undone",
  },
  {
    id: "cur-distribute-equation",
    label: "Equations with distribution",
    mode: "distribute-eq",
    a: 3,
    b: 4,
    c: 21, // 3(x + 4) = 21  →  x = 3
    tip: "A bracket times a number can be undone by dividing first",
  },
  {
    id: "cur-both-sides",
    label: "Variables on both sides",
    mode: "both-sides",
    a: 5,
    b: 2,
    c: 2,
    d: 11, // 5x + 2 = 2x + 11  →  x = 3
    tip: "Move the x's to one side the same way you move numbers",
  },
  {
    id: "cur-fraction-equation",
    label: "Equations with a fraction",
    mode: "fraction-eq",
    a: 4,
    b: 6,
    c: 0, // x / 4 = 6  →  x = 24
    tip: "Divided by 4 is undone by multiplying by 4",
  },
  {
    id: "cur-transformations",
    label: "Transformations on the plane",
    mode: "transform",
    a: 0,
    b: 0,
    c: 0,
    px: 3,
    py: 2,
    tx: 2,
    ty: -1,
    tip: "Every transformation is one rule applied to the coordinates",
  },
];

export function linEqUnitById(id: string): LinEqUnit {
  const u = LIN_EQ_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No linear-equation unit "${id}"`);
  return u;
}

export function linEqNumbers(u: LinEqUnit) {
  const d = u.d ?? 0;
  const px = u.px ?? 0;
  const py = u.py ?? 0;
  const tx = u.tx ?? 0;
  const ty = u.ty ?? 0;
  return {
    a: u.a,
    b: u.b,
    c: u.c,
    d,
    /** two-step: ax − b = c → ax = c + b → x = (c + b)/a */
    afterAdd: u.c + u.b,
    twoStepX: (u.c + u.b) / u.a,
    /** distribute-eq: k(x + b) = c → x + b = c/k → x = c/k − b */
    afterDivide: u.c / u.a,
    distributeX: u.c / u.a - u.b,
    /** the expand route, so the video can show both and they must agree */
    expanded: u.a * u.b,
    /** both-sides: ax + b = cx + d → (a−c)x = d−b → x = (d−b)/(a−c) */
    xDiff: u.a - u.c,
    constDiff: d - u.b,
    bothSidesX: u.a - u.c ? (d - u.b) / (u.a - u.c) : 0,
    /** fraction-eq: x/a = b → x = a·b */
    fractionX: u.a * u.b,
    /** transform: the three images */
    px,
    py,
    reflectXx: px,
    reflectXy: -py,
    reflectYx: -px,
    reflectYy: py,
    tx,
    ty,
    translatedX: px + tx,
    translatedY: py + ty,
    rotatedX: -py,
    rotatedY: px,
  };
}
