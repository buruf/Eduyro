// src/remotion/lesson/units.ts
// Units covered by the EQUAL GROUPS template ("a × b means b groups of a").
//
// One template, many units: the numbers and narration come from the unit, not
// from the composition — the same mistake that made the old tutorials leak
// other units' digits into a lesson. Every number a video says or shows is
// derived from `a` and `b` here.
//
// This template only fits units whose idea genuinely IS equal groups. Column
// arithmetic (27 × 4), sharing (30 ÷ 5) and the fact-family units need their
// own templates — do not force them in here.
export interface LessonUnit {
  /** Engine unit id, from src/lib/shop/arithmetic-engine.ts. */
  id: string;
  /** The unit's label, shown as the video title. */
  label: string;
  a: number; // size of each group
  b: number; // number of groups
  /** Optional closing shortcut. Omitted units end on the equation. */
  trick?: {
    /** Spoken line; {a} {b} {product} are substituted. */
    text: string;
    /** Short on-screen caption for the same idea. */
    caption: string;
  };
}

export const EQUAL_GROUP_UNITS: LessonUnit[] = [
  {
    id: "mul-skip",
    label: "×2, ×5, ×10 (skip counting)",
    a: 5,
    b: 6,
    trick: {
      text: "So you don't have to count every one. Just skip count by {a}s, and the {b}th number you land on is the answer.",
      caption: "Skip count by 5s",
    },
  },
  {
    id: "mul-3-4",
    label: "×3 and ×4 (build from ×2)",
    a: 4,
    b: 7,
    trick: {
      text: "Here's a shortcut. Double it, then double again. {b} doubled is {double1}, and {double1} doubled is {product}.",
      caption: "Double, then double again",
    },
  },
  {
    id: "mul-tens",
    label: "Multiplying tens (20 × 3)",
    a: 20,
    b: 3,
    trick: {
      text: "But here's a faster way. Cover up the zero… {aNoZero} × {b} is {productNoZero}. Now put the zero back on… {product}. Same answer, much quicker.",
      caption: "Cover the zero, then put it back",
    },
  },
  {
    id: "mul-identity",
    label: "×1 and ×0",
    a: 1,
    b: 7,
    trick: {
      // Only claims what's on screen. The ×0 half of this unit is framed as an
      // absence you can picture, not asserted as something already shown.
      text: "Every group has just 1 in it, so you end up with exactly what you started with. That's why anything times 1 is itself. And if there were no groups at all? Nothing. That's times 0.",
      caption: "×1 keeps it as it is",
    },
  },
  {
    id: "mul-squares",
    label: "Square facts (n × n)",
    a: 6,
    b: 6,
    trick: {
      text: "When the two numbers match, the groups make a perfect square. That's why {a} × {a} is called {a} squared.",
      caption: "Same number twice = a square",
    },
  },
  {
    id: "mul-6-9",
    label: "×6, ×7, ×8, ×9 (the hard facts)",
    a: 6,
    b: 7,
    trick: {
      text: "Here's the trick for the hard ones. {b} × 5 is {half5}, and {b} more makes {product}. Break it into a five you know, plus the rest.",
      caption: "×5 you know, then add one more group",
    },
  },
  {
    id: "mul-10-12",
    label: "×10, ×11, ×12",
    a: 12,
    b: 4,
    trick: {
      text: "Split the 12. {b} × 10 is {times10}, and {b} × 2 is {times2}. Put them together… {product}.",
      caption: "12 = 10 + 2, do both and add",
    },
  },
];

export function unitById(id: string): LessonUnit {
  const u = EQUAL_GROUP_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No equal-groups unit "${id}"`);
  return u;
}

/** Values every narration line and caption is allowed to use. */
export function unitNumbers(u: LessonUnit) {
  return {
    a: u.a,
    b: u.b,
    product: u.a * u.b,
    // For the ×10-family "cover the zero" move.
    aNoZero: u.a / 10,
    productNoZero: (u.a / 10) * u.b,
    // For the double-and-double-again move.
    double1: u.b * 2,
    // For the "×5 you know, plus one more group" move on the hard facts.
    half5: u.b * 5,
    // For splitting 12 into 10 + 2.
    times10: u.b * 10,
    times2: u.b * 2,
    /** Running totals: a, 2a, 3a … used by the count scene and its narration. */
    running: Array.from({ length: u.b }, (_, i) => u.a * (i + 1)),
  };
}

export function fill(template: string, u: LessonUnit): string {
  const n = unitNumbers(u) as Record<string, unknown>;
  return template.replace(/\{(\w+)\}/g, (_m, key: string) =>
    n[key] === undefined ? `{${key}}` : String(n[key]),
  );
}

// ---------------------------------------------------------------------------
// BASE-TEN BLOCKS template ("what carrying and borrowing actually are").
// ---------------------------------------------------------------------------
// Two-digit units only for now: the scenes model a tens column and a ones
// column, so 3-digit units (248 + 167) need the template widened first.
export interface ColumnUnit {
  id: string;
  label: string;
  x: number;
  y: number;
  op: "+" | "−";
}

export const COLUMN_UNITS: ColumnUnit[] = [
  {
    id: "add-2d-noregroup",
    label: "2-digit addition (no regrouping)",
    x: 34,
    y: 25,
    op: "+",
  },
  {
    id: "add-2d-regroup",
    label: "2-digit addition (regrouping)",
    x: 37,
    y: 45,
    op: "+",
  },
  {
    id: "sub-2d-noborrow",
    label: "2-digit subtraction (no borrowing)",
    x: 58,
    y: 23,
    op: "−",
  },
  {
    id: "sub-2d-borrow",
    label: "2-digit subtraction (borrowing)",
    x: 52,
    y: 27,
    op: "−",
  },
  {
    id: "add-3d-three",
    label: "3-digit addition & three addends",
    x: 248,
    y: 167,
    op: "+",
  },
  {
    // The engine's own example borrows across a zero, which is the hardest
    // case in the unit and a poor FIRST sight of 3-digit regrouping. These
    // numbers borrow twice with no zero, which is the representative case.
    id: "sub-3d",
    label: "3-digit subtraction (regrouping)",
    x: 342,
    y: 158,
    op: "−",
  },
];

export function columnUnitById(id: string): ColumnUnit {
  const u = COLUMN_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No column unit "${id}"`);
  return u;
}

export function columnNumbers(u: ColumnUnit) {
  const onesSum = (u.x % 10) + (u.y % 10);
  const tensSumRaw = Math.floor((u.x % 100) / 10) + Math.floor((u.y % 100) / 10);
  return {
    x: u.x,
    y: u.y,
    xTens: Math.floor(u.x / 10),
    xOnes: u.x % 10,
    yTens: Math.floor(u.y / 10),
    yOnes: u.y % 10,
    onesSum,
    // Addition only — this used to report true for subtraction too, since it
    // just summed the ones digits.
    carries: u.op === "+" && onesSum >= 10,
    // Subtraction needs a borrow when the top ones digit is too small.
    borrows: u.op === "−" && u.x % 10 < u.y % 10,
    leftover: onesSum % 10,
    tensSum: Math.floor(u.x / 10) + Math.floor(u.y / 10),
    answer: u.op === "+" ? u.x + u.y : u.x - u.y,
    // Hundreds support. Two-digit units simply have zero here, so the
    // hundreds column is hidden rather than drawn empty.
    xHundreds: Math.floor(u.x / 100),
    yHundreds: Math.floor(u.y / 100),
    hasHundreds: u.x >= 100 || u.y >= 100,
    // A second carry happens when the tens column itself overflows.
    tensCarry: u.op === "+" && tensSumRaw + (onesSum >= 10 ? 1 : 0) >= 10,
    // A second borrow when the tens digit cannot cover the subtraction.
    tensBorrow:
      u.op === "−" &&
      Math.floor((u.x % 100) / 10) - (u.x % 10 < u.y % 10 ? 1 : 0) < Math.floor((u.y % 100) / 10),
  };
}

// ---------------------------------------------------------------------------
// TEN-FRAME template (addition and subtraction facts).
// ---------------------------------------------------------------------------
// One example per unit, chosen so the unit's OWN strategy is the thing the
// animation performs — 8 + 5 shows make-ten because two dots visibly complete
// the frame; 6 + 7 shows near-doubles because it is 6 + 6 with one extra.
export interface TenFrameUnit {
  id: string;
  label: string;
  x: number;
  y: number;
  op: "+" | "−";
  /** Which strategy the animation should PERFORM. The unit teaches this, so
   *  the visual has to match it — showing make-ten for a doubles fact
   *  contradicts the unit and its own narration. */
  strategy:
    | "make-ten"
    | "count-on"
    | "count-back"
    | "turnaround"
    | "bridge-down"
    // Subtraction as DISTANCE rather than removal: count up from the smaller
    // number to the larger and the answer is how far you travelled. Most
    // teaching only ever shows take-away, which is why "count up to subtract"
    // later feels like an unrelated trick.
    | "count-up"
    | "take-all";
  /** The strategy line shown and spoken at the end. */
  tip: string;
}

export const TEN_FRAME_UNITS: TenFrameUnit[] = [
  {
    id: "add-count-on",
    label: "Adding by counting on (+1, +2, +3)",
    x: 7,
    y: 2,
    op: "+",
    strategy: "count-on",
    tip: "Start at the big number and count on",
  },
  {
    id: "add-doubles",
    label: "Doubles (1+1 … 9+9)",
    x: 6,
    y: 6,
    op: "+",
    strategy: "make-ten",
    tip: "Doubles are worth just knowing",
  },
  {
    id: "add-zero-comm",
    label: "Adding zero & turnarounds",
    x: 3,
    y: 8,
    op: "+",
    strategy: "turnaround",
    tip: "Swap them round — 3 + 8 is the same as 8 + 3",
  },
  {
    id: "add-near-doubles",
    label: "Near-doubles (use the double you know)",
    x: 6,
    y: 7,
    op: "+",
    strategy: "make-ten",
    tip: "6 + 6 is 12, so one more is 13",
  },
  {
    id: "add-make-ten",
    label: "Make ten & bridging through 10",
    x: 8,
    y: 5,
    op: "+",
    strategy: "make-ten",
    tip: "Fill the ten, then add what's left",
  },
  {
    id: "sub-count-back",
    label: "Subtracting by counting back (−1, −2, −3)",
    x: 9,
    y: 2,
    op: "−",
    strategy: "count-back",
    tip: "Small numbers off? Just count back",
  },
  {
    id: "sub-count-up",
    label: "Find the difference (count up)",
    x: 13,
    y: 8,
    op: "−",
    // 13 − 8: taking 8 away one at a time is laborious, but the gap from 8 up
    // to 13 is short — which is exactly when counting up wins.
    strategy: "count-up",
    tip: "When the numbers are close, count up instead",
  },
  {
    id: "sub-zero",
    label: "Subtract 0 and subtract all",
    x: 7,
    y: 7,
    op: "−",
    strategy: "take-all",
    tip: "Take away everything and nothing is left",
  },
  {
    id: "sub-halves",
    label: "Halving & near-halves (using doubles)",
    x: 12,
    y: 6,
    op: "−",
    strategy: "bridge-down",
    tip: "6 + 6 is 12, so 12 take away 6 is 6",
  },
  {
    id: "sub-bridge",
    label: "Bridging down through 10",
    x: 15,
    y: 7,
    op: "−",
    strategy: "bridge-down",
    tip: "Go down to 10 first, then take the rest",
  },
];

export const CURRICULUM_TEN_FRAME_UNITS: TenFrameUnit[] = [
  {
    // "Addition within 5" — aliasing this to a video showing 7 + 2 would put
    // numbers beyond the skill in front of a child practising sums to five.
    id: "cur-add-within-5",
    label: "Addition within 5",
    x: 3,
    y: 2,
    op: "+",
    strategy: "count-on",
    tip: "Start at the bigger number and count on",
  },
  {
    id: "cur-add-within-10",
    label: "Addition within 10",
    x: 6,
    y: 3,
    op: "+",
    strategy: "count-on",
    tip: "Start at the bigger number and count on",
  },
];

export function tenFrameUnitById(id: string): TenFrameUnit {
  const u = [...TEN_FRAME_UNITS, ...CURRICULUM_TEN_FRAME_UNITS].find((x) => x.id === id);
  if (!u) throw new Error(`No ten-frame unit "${id}"`);
  return u;
}

export function tenFrameNumbers(u: TenFrameUnit) {
  const answer = u.op === "+" ? u.x + u.y : u.x - u.y;
  const gap = Math.max(0, 10 - u.x);
  const extras = Math.max(0, u.x - 10);
  return {
    answer,
    gap,
    fillers: Math.min(gap, u.y),
    rest: Math.max(0, u.y - Math.min(gap, u.y)),
    extras,
    firstOff: Math.min(extras, u.y),
    thenOff: Math.max(0, u.y - Math.min(extras, u.y)),
    makesTen: u.op === "+" && gap > 0 && u.y >= gap,
    bridgesDown: u.op === "−" && extras > 0 && u.y > extras,
  };
}

// ---------------------------------------------------------------------------
// DEALING template (division, shown as sharing AND as grouping).
// ---------------------------------------------------------------------------
// `total` dots are dealt onto `divisor` plates, then re-formed into rings of
// `divisor`. Both readings land on the same answer, which is the point.
// Dividends stay small enough to show as individual dots — div-larger needs a
// base-ten treatment instead, not 84 dots on screen.
export interface DealingUnit {
  id: string;
  label: string;
  total: number;
  divisor: number;
  /** Closing line, usually tying the fact back to its multiplication twin. */
  tip: string;
  /** Share base-ten blocks (tens then ones) instead of individual dots. */
  blocks?: boolean;
}

export const DEALING_UNITS: DealingUnit[] = [
  { id: "div-skip", label: "÷2, ÷5, ÷10", total: 30, divisor: 5, tip: "5 × 6 = 30, so 30 ÷ 5 = 6" },
  { id: "div-identity", label: "÷1 and dividing a number by itself", total: 7, divisor: 1, tip: "÷1 changes nothing" },
  { id: "div-squares", label: "Square-root facts (n² ÷ n)", total: 36, divisor: 6, tip: "6 × 6 = 36, so 36 ÷ 6 = 6" },
  { id: "div-3-4", label: "÷3 and ÷4", total: 24, divisor: 4, tip: "4 × 6 = 24, so 24 ÷ 4 = 6" },
  { id: "div-6-9", label: "÷6, ÷7, ÷8, ÷9", total: 42, divisor: 7, tip: "7 × 6 = 42, so 42 ÷ 7 = 6" },
  { id: "div-10-12", label: "÷10, ÷11, ÷12", total: 48, divisor: 12, tip: "12 × 4 = 48, so 48 ÷ 12 = 4" },
  { id: "div-remainder", label: "Division with remainders", total: 29, divisor: 4, tip: "4 × 7 = 28, and 1 is left over" },
  {
    id: "div-larger",
    label: "2-digit & 3-digit ÷ 1-digit",
    total: 84,
    divisor: 4,
    tip: "Share the tens first, then the ones",
    // 84 loose dots is unreadable, and counting them one by one is not what
    // this unit teaches. As blocks it becomes: 8 tens shared 4 ways is 2 tens
    // each, 4 ones shared 4 ways is 1 each — which IS long division.
    blocks: true,
  },
];

export function dealingUnitById(id: string): DealingUnit {
  const u = DEALING_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No dealing unit "${id}"`);
  return u;
}

export function dealingNumbers(u: DealingUnit) {
  const each = Math.floor(u.total / u.divisor);
  return {
    total: u.total,
    divisor: u.divisor,
    each,
    remainder: u.total % u.divisor,
    dealt: each * u.divisor,
  };
}

// ---------------------------------------------------------------------------
// FACT FAMILY template (one picture, four questions).
// ---------------------------------------------------------------------------
// `additive` units draw a part-part-whole bar from a + b; `multiplicative`
// units draw an a-by-b array. The four facts are DERIVED from those two
// numbers, so a family can never contain a fact its own picture contradicts.
export interface FactFamilyUnit {
  id: string;
  label: string;
  a: number;
  b: number;
  kind: "additive" | "multiplicative";
  tip: string;
}

export const FACT_FAMILY_UNITS: FactFamilyUnit[] = [
  {
    id: "add-fact-family",
    label: "Fact families to 18",
    a: 5,
    b: 8,
    kind: "additive",
    tip: "Know one, and you know all four",
  },
  {
    id: "sub-fact-family",
    label: "Fact families to 18",
    a: 6,
    b: 9,
    kind: "additive",
    tip: "Subtraction asks which part is missing",
  },
  {
    id: "mul-fact-family",
    label: "Fact families & missing factor",
    a: 3,
    b: 4,
    kind: "multiplicative",
    tip: "Division asks how big one row is",
  },
  {
    id: "div-fact-family",
    label: "Fact families & missing dividend",
    a: 4,
    b: 6,
    kind: "multiplicative",
    tip: "Every division has a multiplication twin",
  },
];

export const CURRICULUM_FACT_FAMILY_UNITS: FactFamilyUnit[] = [
  {
    // "Number bonds" IS part-part-whole, so the fact-family bar is exactly the
    // right picture — but bonds are to TEN, and the existing unit's 5 + 8 = 13
    // would show a child numbers past the ten they're bonding to.
    id: "cur-number-bonds",
    label: "Number bonds",
    a: 6,
    b: 4,
    kind: "additive",
    tip: "Two parts that make ten — know one, know the other",
  },
];

export function factFamilyUnitById(id: string): FactFamilyUnit {
  const u = [...FACT_FAMILY_UNITS, ...CURRICULUM_FACT_FAMILY_UNITS].find((x) => x.id === id);
  if (!u) throw new Error(`No fact-family unit "${id}"`);
  return u;
}

/** The four facts, each tagged with the piece of the picture it asks about. */
export function factFamilyFacts(u: FactFamilyUnit) {
  if (u.kind === "additive") {
    const whole = u.a + u.b;
    return [
      { text: `${u.a} + ${u.b} = ${whole}`, lit: "whole" },
      { text: `${u.b} + ${u.a} = ${whole}`, lit: "whole" },
      { text: `${whole} − ${u.b} = ${u.a}`, lit: "a" },
      { text: `${whole} − ${u.a} = ${u.b}`, lit: "b" },
    ];
  }
  const product = u.a * u.b;
  return [
    { text: `${u.a} × ${u.b} = ${product}`, lit: "rows" },
    { text: `${u.b} × ${u.a} = ${product}`, lit: "cols" },
    { text: `${product} ÷ ${u.a} = ${u.b}`, lit: "rows" },
    { text: `${product} ÷ ${u.b} = ${u.a}`, lit: "cols" },
  ];
}

// ---------------------------------------------------------------------------
// AREA template (why long multiplication has the steps it has).
// ---------------------------------------------------------------------------
// The rectangle is cut at the tens boundary of each side, so a 2-digit x
// 1-digit problem yields two regions and 2-digit x 2-digit yields four — which
// is exactly the number of partial products each written algorithm has.
export interface AreaUnit {
  id: string;
  label: string;
  x: number; // across
  y: number; // down
  tip: string;
}

export const AREA_UNITS: AreaUnit[] = [
  {
    id: "mul-break-apart",
    label: "Break apart to multiply (no carrying)",
    x: 23,
    y: 4,
    tip: "Split the big number, do the easy bits, add them",
  },
  {
    id: "mul-carry",
    label: "Carrying in multiplication",
    x: 27,
    y: 4,
    tip: "The carried digit is just the ones piece spilling over",
  },
  {
    id: "mul-2d1d",
    label: "2-digit × 1-digit",
    x: 34,
    y: 6,
    tip: "Tens piece, ones piece, add",
  },
  {
    id: "mul-2d2d",
    label: "2-digit × 2-digit",
    x: 23,
    y: 14,
    tip: "Cut both ways — that's why there are four partial products",
  },
];

export function areaUnitById(id: string): AreaUnit {
  const u = AREA_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No area unit "${id}"`);
  return u;
}

/** The regions of the cut rectangle, in reading order. */
export function areaRegions(u: AreaUnit) {
  const xTens = Math.floor(u.x / 10) * 10;
  const xOnes = u.x % 10;
  const yTens = Math.floor(u.y / 10) * 10;
  const yOnes = u.y % 10;
  const cols = xOnes ? [xTens, xOnes] : [xTens];
  const rows = yTens ? [yTens, yOnes] : [yOnes];
  const out: { w: number; h: number; product: number; col: number; row: number }[] = [];
  rows.forEach((h, row) =>
    cols.forEach((w, col) => out.push({ w, h, product: w * h, col, row })),
  );
  return out;
}

/** Convenience accessors used by the composition's geometry. */
export function areaSides(u: AreaUnit) {
  return {
    xTens: Math.floor(u.x / 10) * 10,
    xOnes: u.x % 10,
    yTens: Math.floor(u.y / 10) * 10,
    yOnes: u.y % 10,
  };
}

export {
  COUNT_UNITS,
  COMPARE_UNITS,
  NUMBER_LINE_UNITS,
  countUnitById,
  compareUnitById,
  compareNumbers,
  numberLineUnitById,
  numberLineValues,
} from "./units-early";
export type { CountUnit, CompareUnit, NumberLineUnit } from "./units-early";
import { COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS } from "./units-early";
import { FUNCTION_UNITS } from "./units-functions";
import { TRIG_UNITS } from "./units-trig";
import { POLY_UNITS } from "./units-poly";
import { FRAC_OPS_UNITS } from "./units-fracops";
import { DECIMAL_OPS_UNITS } from "./units-decimalops";
import { PLACE_VALUE_UNITS } from "./units-placevalue";
import { ADVANCED_UNITS } from "./units-advanced";

// ---------------------------------------------------------------------------
// FRACTION BAR template (M7).
// ---------------------------------------------------------------------------
// One bar, cut into equal parts. Equal parts is the load-bearing idea — the
// identify unit crosses out an unequal cut before anything else. Equivalence
// is a cut being added while THE SHADING NEVER MOVES, which is the whole proof
// of 4/8 = 1/2 in one motion.
export interface FractionBarUnit {
  id: string;
  label: string;
  mode: "identify" | "compare" | "add" | "simplify";
  /** Primary fraction num/den. */
  n: number;
  d: number;
  /** compare: the second fraction. add: the addend's numerator (same d). */
  n2?: number;
  d2?: number;
  tip: string;
}

export const FRACTION_BAR_UNITS: FractionBarUnit[] = [
  {
    id: "cur-identify-fractions",
    label: "Identifying fractions",
    mode: "identify",
    n: 3,
    d: 4,
    tip: "Bottom = equal parts, top = shaded parts",
  },
  {
    id: "cur-compare-fractions",
    label: "Comparing fractions",
    mode: "compare",
    n: 3,
    d: 4,
    n2: 2,
    d2: 3,
    tip: "Same-length bars — the longer shading wins",
  },
  {
    id: "cur-add-fractions",
    label: "Adding fractions",
    mode: "add",
    n: 3,
    d: 8,
    n2: 2,
    tip: "Same-size pieces just count up — the bottom stays",
  },
  {
    id: "cur-simplify-fractions",
    label: "Simplifying fractions",
    mode: "simplify",
    n: 4,
    d: 8,
    tip: "Fewer, bigger pieces — the shading never changed",
  },
];

export function fractionBarUnitById(id: string): FractionBarUnit {
  const u = FRACTION_BAR_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No fraction-bar unit "${id}"`);
  return u;
}

// ---------------------------------------------------------------------------
// HUNDRED GRID template (M8).
// ---------------------------------------------------------------------------
// A 10×10 grid where tenths are columns and hundredths are cells. The
// place-value unit's move is showing 0.3 and 0.03 side by side; the percent
// unit's move is relabelling the SAME shading three ways (37/100, 0.37, 37%).
export interface HundredGridUnit {
  id: string;
  label: string;
  mode: "place-value" | "operations" | "subtract" | "multiply" | "percent";
  /** place-value: tenths count (and the same digit as hundredths). */
  tenths?: number;
  /** operations: two addends in hundredths (40 + 25 = 0.4 + 0.25). */
  aCells?: number;
  bCells?: number;
  /** multiply: how many groups of `tenths` columns. */
  times?: number;
  /** percent: the percentage. */
  pct?: number;
  tip: string;
}

export const HUNDRED_GRID_UNITS: HundredGridUnit[] = [
  {
    id: "cur-decimal-place-value",
    label: "Decimal place value",
    mode: "place-value",
    tenths: 3,
    tip: "0.3 is 3 whole columns — 0.03 is just 3 little cells",
  },
  {
    id: "cur-decimal-operations",
    label: "Decimal operations",
    mode: "operations",
    aCells: 40,
    bCells: 25,
    tip: "Line up the decimal points and add like always",
  },
  {
    // 0.65 − 0.25: starts in hundredths, lands on a clean 0.40 — one video
    // honestly serves both the tenths and hundredths subtraction labels.
    id: "cur-decimal-subtract",
    label: "Decimals — subtract",
    mode: "subtract",
    aCells: 65,
    bCells: 25,
    tip: "Same grid — shading comes OFF instead of going on",
  },
  {
    // 0.3 × 3 = three groups of three columns — equal groups, on the grid.
    id: "cur-decimal-multiply",
    label: "Decimals — multiply by a whole number",
    mode: "multiply",
    tenths: 3,
    times: 3,
    tip: "Groups of tenths, just like groups of anything",
  },
  {
    id: "cur-percentages",
    label: "Percentages",
    mode: "percent",
    pct: 37,
    tip: "Per cent means per hundred — same number, three coats",
  },
];

export function hundredGridUnitById(id: string): HundredGridUnit {
  const u = HUNDRED_GRID_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No hundred-grid unit "${id}"`);
  return u;
}

// ---------------------------------------------------------------------------
// RATIO TABLE template (M9).
// ---------------------------------------------------------------------------
// A ratio is a pair that keeps its shape when you scale it. The table makes
// that literal: both rows are multiplied by the SAME number, and the picture
// grows in step. Unit rate is the same table scaled DOWN until one column
// reads 1 — which is why "per one" is the useful form.
export interface RatioUnit {
  id: string;
  label: string;
  mode: "ratio" | "proportion" | "unit-rate";
  /** The base pair, e.g. 3 red : 2 blue, or 12 items : 3 pounds. */
  a: number;
  b: number;
  /** How far the table is scaled (ratio/proportion), e.g. ×3. */
  scale?: number;
  aName: string;
  bName: string;
  tip: string;
}

export const RATIO_UNITS: RatioUnit[] = [
  {
    id: "cur-ratios",
    label: "Ratios",
    mode: "ratio",
    a: 3,
    b: 2,
    scale: 3,
    aName: "red",
    bName: "blue",
    tip: "Scale both sides the same, and the ratio holds",
  },
  {
    id: "cur-proportions",
    label: "Proportions",
    mode: "proportion",
    a: 3,
    b: 4,
    scale: 3,
    aName: "top",
    bName: "bottom",
    tip: "Same multiplier top and bottom — that's what equal means here",
  },
  {
    id: "cur-unit-rates",
    label: "Unit rates",
    mode: "unit-rate",
    a: 12,
    b: 3,
    aName: "apples",
    bName: "pounds",
    tip: "Divide down to one — then you can compare anything",
  },
];

export function ratioUnitById(id: string): RatioUnit {
  const u = RATIO_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No ratio unit "${id}"`);
  return u;
}

// ---------------------------------------------------------------------------
// BALANCE SCALE template (M10).
// ---------------------------------------------------------------------------
// An equation is a balance that is level. Solving is not a ritual of moving
// symbols across an equals sign — it is removing the SAME weight from both
// pans so the beam stays level. An inequality is the same scale, tipped, and
// it stays tipped the same way for every legal move.
export interface BalanceUnit {
  id: string;
  label: string;
  /** left = coef·x + constL, right = constR. */
  coef: number;
  constL: number;
  constR: number;
  /** ">" makes it an inequality; "=" an equation. */
  rel: "=" | ">";
  tip: string;
}

export const BALANCE_UNITS: BalanceUnit[] = [
  {
    id: "cur-one-step",
    label: "Solving one-step equations",
    coef: 1,
    constL: 3,
    constR: 8,
    rel: "=",
    tip: "Take the same off both sides and it stays level",
  },
  {
    id: "cur-two-step",
    label: "Solving two-step equations",
    coef: 2,
    constL: 3,
    constR: 11,
    rel: "=",
    tip: "Undo the adding first, then the grouping",
  },
  {
    id: "cur-inequalities",
    label: "Inequalities",
    coef: 1,
    constL: 2,
    constR: 5,
    rel: ">",
    tip: "A tipped scale stays tipped — same move, both sides",
  },
];

export function balanceUnitById(id: string): BalanceUnit {
  const u = BALANCE_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No balance unit "${id}"`);
  return u;
}

export function balanceSolution(u: BalanceUnit) {
  const afterConst = u.constR - u.constL;
  return { afterConst, x: afterConst / u.coef };
}

// ---------------------------------------------------------------------------
// COORDINATE GRAPH template (M11, M13, M16, M17, M18).
// ---------------------------------------------------------------------------
// The workhorse of the upper levels. One set of axes, one plotted curve, and a
// mode-specific MOVE performed on it:
//
//   line        plot from a table of points — the graph IS the equation's
//               solutions, not a decoration of it
//   slope       the rise-over-run triangle, drawn on the line
//   system      two lines; the crossing point is the pair that satisfies both
//   parabola    a curve, and where it crosses zero
//   roots       the same crossings, named as the equation's solutions
//   exponential doubling — the shape that outruns any line
//   log         the exponential reflected in y = x, which is what "inverse" is
//   limit       a hole in a curve, approached from both sides
//   derivative  secants collapsing onto a tangent — slope AT a point
//   integral    rectangles filling the area under a curve
//
// Functions are declared by KIND with coefficients rather than parsed from
// strings: a lesson must never plot something its narration didn't describe.
export type CurveKind = "linear" | "quadratic" | "exponential" | "log" | "hole";

export interface Curve {
  kind: CurveKind;
  /** linear: y = m·x + c. quadratic: y = a·x² + b·x + c. */
  m?: number;
  c?: number;
  a?: number;
  b?: number;
  /** exponential/log base. */
  base?: number;
  /** hole: y = (x² − h²)/(x − h), i.e. x + h with a gap at x = h. */
  h?: number;
}

export interface GraphUnit {
  id: string;
  label: string;
  mode:
    | "line"
    | "slope"
    | "system"
    | "parabola"
    | "roots"
    | "exponential"
    | "log"
    | "limit"
    | "derivative"
    | "integral"
    | "range"
    | "endbehavior";
  curve: Curve;
  /** system mode: the second line. */
  curve2?: Curve;
  /** derivative/limit: the x the lesson happens at. */
  at?: number;
  /** integral: the interval being filled. */
  from?: number;
  to?: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  tip: string;
}

export const GRAPH_UNITS: GraphUnit[] = [
  {
    id: "cur-graphing-lines",
    label: "Graphing lines",
    mode: "line",
    curve: { kind: "linear", m: 2, c: 1 },
    xMin: -2, xMax: 4, yMin: -4, yMax: 10,
    tip: "Every point on the line is a pair that works",
  },
  {
    id: "cur-slope-intercept",
    label: "Slope and intercept",
    mode: "slope",
    curve: { kind: "linear", m: 2, c: 1 },
    xMin: -2, xMax: 4, yMin: -4, yMax: 10,
    tip: "m is the slope, b is the y-intercept",
  },
  {
    id: "cur-systems",
    label: "Systems of equations",
    mode: "system",
    curve: { kind: "linear", m: 2, c: 1 },
    curve2: { kind: "linear", m: -1, c: 7 },
    xMin: -1, xMax: 6, yMin: -2, yMax: 12,
    tip: "One point on BOTH lines — that's the solution",
  },
  {
    id: "cur-graphing-parabolas",
    label: "Graphing parabolas",
    mode: "parabola",
    curve: { kind: "quadratic", a: 1, b: 0, c: -4 },
    xMin: -3.5, xMax: 3.5, yMin: -6, yMax: 8,
    tip: "Squaring makes it curve — and symmetric",
  },
  {
    id: "cur-quadratic-range",
    label: "Range of a quadratic",
    mode: "range",
    curve: { kind: "quadratic", a: 1, b: 0, c: -4 },
    xMin: -3.5, xMax: 3.5, yMin: -6, yMax: 8,
    tip: "Range: every height the curve actually reaches",
  },
  {
    id: "cur-end-behavior",
    label: "End behavior",
    mode: "endbehavior",
    curve: { kind: "quadratic", a: 1, b: 0, c: -4 },
    xMin: -3.5, xMax: 3.5, yMin: -6, yMax: 8,
    tip: "Ends point where the leading term sends them",
  },
  {
    id: "cur-quadratic-equations",
    label: "Quadratic equations",
    mode: "roots",
    curve: { kind: "quadratic", a: 1, b: -5, c: 6 },
    xMin: -0.5, xMax: 5.5, yMin: -2.5, yMax: 7,
    tip: "Solving means finding where it crosses zero",
  },
  {
    id: "cur-quadratic-formula",
    label: "Quadratic formula",
    mode: "roots",
    curve: { kind: "quadratic", a: 1, b: -5, c: 6 },
    xMin: -0.5, xMax: 5.5, yMin: -2.5, yMax: 7,
    tip: "The formula finds those crossings every time",
  },
  {
    id: "cur-exponential",
    label: "Exponential functions",
    mode: "exponential",
    curve: { kind: "exponential", base: 2 },
    xMin: -1, xMax: 4, yMin: -1, yMax: 17,
    tip: "Doubling beats any straight line, eventually",
  },
  {
    id: "cur-logarithms",
    label: "Logarithms",
    mode: "log",
    curve: { kind: "exponential", base: 2 },
    curve2: { kind: "log", base: 2 },
    xMin: -1, xMax: 9, yMin: -1, yMax: 9,
    tip: "A log just asks the exponent question backwards",
  },
  {
    id: "cur-limits",
    label: "Limits",
    mode: "limit",
    // y = (x² − 4)/(x − 2): the line x + 2, with a hole exactly at x = 2.
    curve: { kind: "hole", h: 2 },
    at: 2,
    xMin: -1, xMax: 5, yMin: -1, yMax: 8,
    tip: "The value it heads for — even where it isn't defined",
  },
  {
    id: "cur-derivatives",
    label: "Derivatives",
    mode: "derivative",
    curve: { kind: "quadratic", a: 1, b: 0, c: 0 },
    at: 1,
    xMin: -0.5, xMax: 3.5, yMin: -1, yMax: 9,
    tip: "Slope at a single point — the tangent's steepness",
  },
  {
    id: "cur-integrals",
    label: "Integrals",
    mode: "integral",
    curve: { kind: "linear", m: 1, c: 0 },
    from: 0,
    to: 4,
    xMin: -0.5, xMax: 5, yMin: -1, yMax: 6,
    tip: "Add up the strips — that's the area underneath",
  },
];

export function graphUnitById(id: string): GraphUnit {
  const u = GRAPH_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No graph unit "${id}"`);
  return u;
}

/** Evaluate a declared curve. Returns null where the curve has no value. */
export function evalCurve(c: Curve, x: number): number | null {
  switch (c.kind) {
    case "linear":
      return (c.m ?? 1) * x + (c.c ?? 0);
    case "quadratic":
      return (c.a ?? 1) * x * x + (c.b ?? 0) * x + (c.c ?? 0);
    case "exponential":
      return Math.pow(c.base ?? 2, x);
    case "log":
      return x > 0 ? Math.log(x) / Math.log(c.base ?? 2) : null;
    case "hole": {
      const h = c.h ?? 2;
      // Undefined exactly at the hole; elsewhere it simplifies to x + h.
      return Math.abs(x - h) < 1e-9 ? null : x + h;
    }
  }
}

/** Real roots of a quadratic, in order. */
export function quadraticRoots(c: Curve): number[] {
  const a = c.a ?? 1;
  const b = c.b ?? 0;
  const cc = c.c ?? 0;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return [];
  const r = Math.sqrt(disc);
  return [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort((p, q) => p - q);
}

/** Intersection of two lines, or null if parallel. */
export function lineIntersection(p: Curve, q: Curve): { x: number; y: number } | null {
  const m1 = p.m ?? 0;
  const c1 = p.c ?? 0;
  const m2 = q.m ?? 0;
  const c2 = q.c ?? 0;
  if (Math.abs(m1 - m2) < 1e-9) return null;
  const x = (c2 - c1) / (m1 - m2);
  return { x, y: m1 * x + c1 };
}

// ---------------------------------------------------------------------------
// The lesson-video index, used by the student dashboard.
// ---------------------------------------------------------------------------
// Client-safe: plain data, no Remotion imports, so the player UI can import it.
//
// Sheets identify their unit by LABEL, so that is the lookup key. The labels
// here must match src/lib/shop/arithmetic-engine.ts exactly — a drifted label
// silently means "no video" rather than an error, so scripts/check-lesson-units
// asserts the match.
export interface VideoUnitRef {
  id: string;
  label: string;
  /** Remotion composition that renders it. */
  composition: "EqualGroups" | "Column" | "TenFrame" | "Dealing" | "FactFamily" | "Area" | "Count" | "Compare" | "NumberLine" | "FractionBar" | "HundredGrid" | "RatioTable" | "Balance" | "Graph" | "FunctionMachine" | "Trig" | "Poly" | "FractionOps" | "DecimalOps" | "PlaceValue" | "Advanced";
}

export const ALL_VIDEO_UNITS: VideoUnitRef[] = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "EqualGroups" as const })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Column" as const })),
  ...TEN_FRAME_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "TenFrame" as const })),
  ...DEALING_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Dealing" as const })),
  ...FACT_FAMILY_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "FactFamily" as const })),
  ...AREA_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Area" as const })),
  // Curriculum-named units: same templates, numbers inside the skill's range.
  ...CURRICULUM_TEN_FRAME_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "TenFrame" as const })),
  ...CURRICULUM_FACT_FAMILY_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "FactFamily" as const })),
  ...FRACTION_BAR_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "FractionBar" as const })),
  ...HUNDRED_GRID_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "HundredGrid" as const })),
  ...RATIO_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "RatioTable" as const })),
  ...BALANCE_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Balance" as const })),
  ...GRAPH_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Graph" as const })),
  ...FUNCTION_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "FunctionMachine" as const })),
  ...TRIG_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Trig" as const })),
  ...POLY_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Poly" as const })),
  ...FRAC_OPS_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "FractionOps" as const })),
  ...DECIMAL_OPS_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "DecimalOps" as const })),
  ...PLACE_VALUE_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "PlaceValue" as const })),
  ...ADVANCED_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Advanced" as const })),
  ...COUNT_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Count" as const })),
  ...COMPARE_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "Compare" as const })),
  ...NUMBER_LINE_UNITS.map((u) => ({ id: u.id, label: u.label, composition: "NumberLine" as const })),
];

const BY_LABEL = new Map(ALL_VIDEO_UNITS.map((u) => [u.label, u]));

/** The lesson video for a sheet's skill label, or null if that unit has none
 *  (the mixed-review units deliberately don't — every skill they revise
 *  already has its own video). */
export function videoForSkillLabel(label: string | null | undefined): VideoUnitRef | null {
  if (!label) return null;
  return BY_LABEL.get(label) ?? aliasFor(label);
}

// ---------------------------------------------------------------------------
// Curriculum-name aliases.
// ---------------------------------------------------------------------------
// M1–M6 contains two families of worksheet. Skill-map sheets are titled with
// the arithmetic engine's fine-grained unit labels ("×6, ×7, ×8, ×9 (the hard
// facts)"), which the video index already matches. The rest are titled with the
// coarser curriculum skill names ("×6, ×7, ×8 tables"), which matched nothing —
// so roughly half of real M1–M6 practice fell through to the old tutorial.
//
// Each alias below points a curriculum name at a video that genuinely teaches
// that skill AND whose numbers sit inside the skill's own range. Where no
// existing video's numbers fit (the within-5 and number-bond units), a proper
// unit was added rather than aliasing to something that would show a child
// numbers beyond what they're practising.
const LABEL_ALIASES: Record<string, string> = {
  // M1/M2 early-number labels. "Counting back" IS what-comes-before, the
  // same number-line step, so it maps to that video honestly.
  "Counting back — what comes before": "cur-numbers-before",
  // M7/M8 decimal + percent labels -> the new decimal-ops videos.
  "Decimals — multiply two decimals": "cur-multiply-decimals",
  "Percentages of a number": "cur-percent-of",
  // Skill-map labels served on sheets (audit-video-coverage). Rule unchanged:
  // alias ONLY when the video genuinely teaches that label's skill - a video
  // that says "plus" never fronts a "subtract" unit.
  "Continue the count": "cur-counting-on-next",
  "Skip counting by 5": "mul-skip",
  "Understanding the denominator": "cur-identify-fractions",
  "Writing fractions from pictures": "cur-identify-fractions",
  "Comparing fractions with pictures": "cur-compare-fractions",
  "Compare fractions": "cur-compare-fractions",
  "Equivalent fractions": "cur-simplify-fractions",
  "Understand percent": "cur-percentages",
  "Fractions ↔ percents": "cur-percentages",
  "Decimals ↔ percents": "cur-percentages",
  "Convert fractions, decimals & percents": "cur-percentages",
  "Convert fractions, decimals, percents": "cur-percentages",
  "Decimals — add (hundredths)": "cur-decimal-operations",
  "Ratios — equivalent ratios": "cur-ratios",
  "Ratios — solve a proportion": "cur-proportions",
  "Ratios — scale up": "cur-ratios",
  "Equations · One-step (+/−)": "cur-one-step",
  "Equations · One-step inequalities": "cur-inequalities",
  "Coordinate Plane · Plot points": "cur-graphing-lines",
  "Coordinate Plane · Patterns & intro to slope": "cur-slope-intercept",
  "Two-step equations (+)": "cur-two-step",
  "Identify polynomials": "cur-classify-poly",
  "Degree of a polynomial": "cur-classify-poly",
  "Combine like terms (x²)": "cur-add-poly",
  "Add polynomials": "cur-add-poly",
  "Multiply binomials (FOIL)": "cur-multiply-poly",
  "Partial products (box method)": "cur-multiply-poly",
  "Factor quadratic trinomials": "cur-factoring",
  "Evaluate & axis of symmetry": "cur-graphing-parabolas",
  "x-intercepts (roots)": "cur-quadratic-equations",
  "Evaluate logarithms": "cur-logarithms",
  "Evaluate exponentials": "cur-exponential",
  "Add complex numbers": "cur-complex",
  "Arithmetic sequences": "cur-sequences",
  "Arithmetic series": "cur-sequences",
  "Limits by factoring": "cur-limits",
  "Evaluate a derivative": "cur-calc-applications",
  "Definite integrals": "cur-integrals",
  "Slope as a derivative": "cur-derivatives",

  // M4 — the base-ten and fact-family templates fit these directly.
  "2-digit addition": "add-2d-noregroup",
  "Subtraction within 20": "sub-bridge",
  "Missing numbers": "add-fact-family",

  // M5 — "tables" practice is exactly what the equal-groups videos teach.
  "×2–×5 tables": "mul-skip",
  "×6, ×7, ×8 tables": "mul-6-9",
  "×9 tables": "mul-6-9",
  "Mixed ×6–×9": "mul-6-9",

  // M6 — the dealing video for the same divisor family.
  "Division by 6, 7, 8": "div-6-9",

  // M7 — skill-map sheet titles; each alias is the lesson that skill IS.
  "Part of a whole": "cur-identify-fractions",
  "Identify fractions": "cur-identify-fractions",
  "Understanding the numerator": "cur-identify-fractions",
  "Add fractions": "cur-add-fractions",
  "Simplify fractions": "cur-simplify-fractions",

  // M8 — the add video teaches the grid method the subtract/multiply videos
  // reuse, but subtraction and multiplication get their OWN videos: aliasing
  // 'subtract' to a lesson that says 'plus' is the caption/voice mismatch bug.
  "Decimals — add (tenths)": "cur-decimal-operations",
  "Decimals — subtract (tenths)": "cur-decimal-subtract",
  "Decimals — subtract (hundredths)": "cur-decimal-subtract",
  "Decimals — multiply by a whole number": "cur-decimal-multiply",

  // M10 — word problems are one-step equations dressed in a sentence; the
  // balance lesson is exactly the move they need once the equation is written.
  "Word problems": "cur-one-step",
  "Division by 9": "div-6-9",
  "Mixed division": "div-6-9",

  // M9 — the ratio-table video teaches equivalent ratios; simplifying is
  // reading the same table toward the base column.
  "Ratios — simplify": "cur-ratios",

  // M11 — the rebuilt graphing-lines lesson IS plotting: table rows fire
  // points onto the grid, then the line joins them.
  "Plot points on the coordinate plane": "cur-graphing-lines",
  "Graph a line": "cur-graphing-lines",

  // M13/M14/M17 — the parabola lesson evaluates the function at five inputs,
  // names the shape, and shows the symmetry; these labels are that content.
  // NOT aliased: "Range of a quadratic" and "End behavior" — the video never
  // says those words, and a lesson must speak the skill it is standing in for.
  "Meet the parabola": "cur-graphing-parabolas",
  "Evaluate a quadratic function": "cur-graphing-parabolas",
  "Parabolas & conics": "cur-graphing-parabolas",
};

const BY_ID = new Map(ALL_VIDEO_UNITS.map((u) => [u.id, u]));

/** Alias target for a curriculum skill name, or null. */
export function aliasFor(label: string): VideoUnitRef | null {
  const id = LABEL_ALIASES[label];
  return id ? (BY_ID.get(id) ?? null) : null;
}

export const ALL_LABEL_ALIASES = LABEL_ALIASES;
