// src/remotion/lesson/units-trig.ts
// Units for the TRIG template (M15). Two shared pictures carry the level:
// the 3-4-5 right triangle (theorem, side names, ratios, identity) and the
// unit circle (definition, special values, radians, identities). Every number
// spoken or shown derives from the declared triangle or the circle's special
// angles — nothing is typed twice.

export interface TrigUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode:
    | "pythagorean"
    | "side-names"
    | "ratios"
    | "pyth-identity"
    | "unit-circle"
    | "circle-values"
    | "radians"
    | "identities";
  /** Legs of the right triangle (triangle modes). */
  a: number;
  b: number;
  tip: string;
}

/** The one triangle every triangle-mode video draws. */
export function triNumbers(u: TrigUnit) {
  const c = Math.sqrt(u.a * u.a + u.b * u.b);
  return {
    a: u.a, // vertical leg — opposite the marked angle
    b: u.b, // horizontal leg — adjacent
    c, // hypotenuse (integer for 3-4-5)
    a2: u.a * u.a,
    b2: u.b * u.b,
    c2: u.a * u.a + u.b * u.b,
    sin: u.a / c,
    cos: u.b / c,
    tan: u.a / u.b,
  };
}

export const TRIG_UNITS: TrigUnit[] = [
  { id: "cur-pythagorean", label: "Pythagorean theorem", mode: "pythagorean", a: 3, b: 4, tip: "Legs squared, added — that's the hypotenuse squared" },
  { id: "cur-triangle-sides", label: "Right-triangle ratios", mode: "side-names", a: 3, b: 4, tip: "Opposite, adjacent, hypotenuse — named from the angle" },
  { id: "cur-right-triangle-trig", label: "Right triangle trig", mode: "ratios", a: 3, b: 4, tip: "SOH CAH TOA — three ratios, straight from the sides" },
  { id: "cur-pyth-identity", label: "Pythagorean identity", mode: "pyth-identity", a: 3, b: 4, tip: "sin² + cos² = 1 — the theorem in disguise" },
  { id: "cur-unit-circle", label: "Unit circle", mode: "unit-circle", a: 3, b: 4, tip: "Radius 1: the point's coordinates ARE (cos, sin)" },
  { id: "cur-unit-circle-values", label: "Unit-circle values", mode: "circle-values", a: 3, b: 4, tip: "Read the values off the axes, not from memory" },
  { id: "cur-deg-radians", label: "Degrees to radians", mode: "radians", a: 3, b: 4, tip: "One fact does it all: 180° = π" },
  { id: "cur-trig-identities", label: "Trig identities", mode: "identities", a: 3, b: 4, tip: "Forget one? Go back to the circle" },
];

export function trigUnitById(id: string): TrigUnit {
  const u = TRIG_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No trig unit "${id}"`);
  return u;
}
