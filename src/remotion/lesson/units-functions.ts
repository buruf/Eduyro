// src/remotion/lesson/units-functions.ts
// Units for the FUNCTION MACHINE template (M14). One metaphor carries every
// mode: a function is a machine — input drops in the top, the rule transforms
// it, the output slides out the bottom. Notation, evaluation, composition,
// inverses and domain are all just questions about that machine.
//
// Same contract as every other unit file: any number a video says or shows is
// computed from the unit's declared rule, never typed twice.

export interface FnRule {
  /** Linear a·x + b, or "square" (x²), or "reciprocal" 1/(x − k). */
  kind: "linear" | "square" | "reciprocal";
  a?: number;
  b?: number;
  k?: number;
}

export interface FunctionUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "notation" | "evaluate" | "composition" | "inverse" | "domain-range" | "domain-rational";
  /** The machine's rule (first machine, for composition). */
  rule: FnRule;
  /** Second machine, composition only. */
  rule2?: FnRule;
  /** Inputs fed through on screen, in order. */
  inputs: number[];
  tip: string;
}

export function applyRule(r: FnRule, x: number): number {
  switch (r.kind) {
    case "linear":
      return (r.a ?? 1) * x + (r.b ?? 0);
    case "square":
      return x * x;
    case "reciprocal":
      return 1 / (x - (r.k ?? 0));
  }
}

export function ruleText(r: FnRule, name = "f"): string {
  switch (r.kind) {
    case "linear": {
      const a = r.a ?? 1;
      const b = r.b ?? 0;
      const ax = a === 1 ? "x" : `${a}x`;
      return b === 0 ? `${name}(x) = ${ax}` : `${name}(x) = ${ax} ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
    }
    case "square":
      return `${name}(x) = x²`;
    case "reciprocal":
      return `${name}(x) = 1 / (x − ${r.k ?? 0})`;
  }
}

export const FUNCTION_UNITS: FunctionUnit[] = [
  {
    id: "cur-function-notation",
    label: "Function notation",
    mode: "notation",
    rule: { kind: "linear", a: 2, b: 3 },
    inputs: [4],
    tip: "f(4) means: feed 4 into the machine named f",
  },
  {
    id: "cur-evaluate-linear",
    label: "Evaluate f(x) = mx + b",
    mode: "evaluate",
    rule: { kind: "linear", a: 3, b: 2 },
    inputs: [0, 1, 2],
    tip: "Swap the x for the input, then just do the arithmetic",
  },
  {
    id: "cur-composition",
    label: "Composition of functions",
    mode: "composition",
    rule: { kind: "linear", a: 1, b: 2 }, // f(x) = x + 2
    rule2: { kind: "linear", a: 3, b: 0 }, // g(x) = 3x
    inputs: [2],
    tip: "The inside machine runs first — order matters",
  },
  {
    id: "cur-inverse-functions",
    label: "Inverse functions",
    mode: "inverse",
    rule: { kind: "linear", a: 2, b: 1 },
    inputs: [3],
    tip: "The inverse undoes each step, in reverse order",
  },
  {
    id: "cur-domain-range",
    label: "Domain and range",
    mode: "domain-range",
    rule: { kind: "square" },
    inputs: [-3, 0, 3],
    tip: "Domain: what can go in. Range: what can come out",
  },
  {
    id: "cur-domain-rational",
    label: "Domain of a rational function",
    mode: "domain-rational",
    rule: { kind: "reciprocal", k: 2 },
    inputs: [3, 4, 2],
    tip: "The domain is every input that doesn't break the machine",
  },
];

export function functionUnitById(id: string): FunctionUnit {
  const u = FUNCTION_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No function unit "${id}"`);
  return u;
}
