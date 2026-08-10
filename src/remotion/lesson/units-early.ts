// src/remotion/lesson/units-early.ts
// Units for the three EARLY-NUMBER templates (M1–M2): counting, comparison,
// and number-line sequences. Split from units.ts only because the video index
// there has to spread these arrays — same rules apply: every number a video
// says or shows comes from the unit.
//
// All ids are "cur-" (curriculum-named): these skills exist only under the
// curriculum's names, never in the arithmetic engine.

// ---------------------------------------------------------------------------
// COUNTING template: things counted one at a time, then the rows-of-ten
// structure that makes big counting possible.
// ---------------------------------------------------------------------------
export interface CountUnit {
  id: string;
  label: string;
  /** Count target. 10, 50 or 100 — rows of ten are the whole story. */
  upTo: number;
  /** "count" counts to upTo; "recognise" pairs one numeral with its quantity. */
  mode: "count" | "recognise";
  tip: string;
}

export const COUNT_UNITS: CountUnit[] = [
  {
    id: "cur-counting-1-10",
    label: "Counting 1–10",
    upTo: 10,
    mode: "count",
    tip: "The last number you say is how many there are",
  },
  {
    id: "cur-counting-1-50",
    label: "Counting 1–50",
    upTo: 50,
    mode: "count",
    tip: "Count the rows of ten — 10, 20, 30, 40, 50",
  },
  {
    id: "cur-counting-100",
    label: "Counting to 100",
    upTo: 100,
    mode: "count",
    tip: "100 is just 10 rows of ten",
  },
  {
    // Recognition is numeral ↔ quantity, so the video shows BOTH at once:
    // the symbol 7, and seven counted things.
    id: "cur-number-recognition",
    label: "Number recognition",
    upTo: 7,
    mode: "recognise",
    tip: "When you see the numeral, think of that many things",
  },
];

export function countUnitById(id: string): CountUnit {
  const u = COUNT_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No count unit "${id}"`);
  return u;
}

// ---------------------------------------------------------------------------
// COMPARE template: two rows paired one against one — the row that sticks out
// past the other is the greater one. Comparison as MATCHING, not as a rule.
// ---------------------------------------------------------------------------
export interface CompareUnit {
  id: string;
  label: string;
  a: number; // top row
  b: number; // bottom row
  /** Which side of the comparison this unit's practice asks for. */
  focus: "greater" | "less" | "both";
  tip: string;
}

export const COMPARE_UNITS: CompareUnit[] = [
  {
    id: "cur-which-greater",
    label: "Which is greater?",
    a: 8,
    b: 5,
    focus: "greater",
    tip: "The row that sticks out past the other is greater",
  },
  {
    id: "cur-which-less",
    label: "Which is less?",
    a: 7,
    b: 4,
    focus: "less",
    tip: "The row that runs out first is less",
  },
  {
    id: "cur-more-less",
    label: "More/Less",
    a: 9,
    b: 6,
    focus: "both",
    tip: "Pair them up — the leftovers tell you which is more",
  },
];

export function compareUnitById(id: string): CompareUnit {
  const u = COMPARE_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No compare unit "${id}"`);
  return u;
}

export function compareNumbers(u: CompareUnit) {
  return {
    a: u.a,
    b: u.b,
    bigger: Math.max(u.a, u.b),
    smaller: Math.min(u.a, u.b),
    extra: Math.abs(u.a - u.b),
  };
}

// ---------------------------------------------------------------------------
// NUMBER LINE template: a sequence with a gap, and a dot that hops along the
// line until it lands in the gap. "What comes next" as a place you can SEE.
// ---------------------------------------------------------------------------
export interface NumberLineUnit {
  id: string;
  label: string;
  start: number;
  step: number;
  /** How many terms the sequence shows (including the gap). */
  count: number;
  /** Which term is the blank the hops must fill (0-based). */
  gapIndex: number;
  tip: string;
}

export const NUMBER_LINE_UNITS: NumberLineUnit[] = [
  {
    id: "cur-counting-on-next",
    label: "Counting on — what comes next",
    start: 6,
    step: 1,
    count: 4,
    gapIndex: 3,
    tip: "Say the number, then hop one more",
  },
  {
    // 58 → 59 → 60: the gap sits right on the decade boundary, because
    // "what comes after 59" is exactly where counting to 100 gets hard.
    id: "cur-numbers-after-100",
    label: "Numbers after — to 100",
    start: 57,
    step: 1,
    count: 4,
    gapIndex: 3,
    tip: "After 59, the tens tick over — 60",
  },
  {
    id: "cur-missing-number",
    label: "Missing number in a sequence",
    start: 4,
    step: 1,
    count: 4,
    gapIndex: 2,
    tip: "Hop through the gap and see what you land on",
  },
  {
    id: "cur-number-patterns",
    label: "Number patterns",
    start: 5,
    step: 5,
    count: 4,
    gapIndex: 3,
    tip: "Same-size hops every time — that's the pattern",
  },
];

export function numberLineUnitById(id: string): NumberLineUnit {
  const u = NUMBER_LINE_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No number-line unit "${id}"`);
  return u;
}

export function numberLineValues(u: NumberLineUnit) {
  const values = Array.from({ length: u.count }, (_, i) => u.start + i * u.step);
  return {
    values,
    gapValue: values[u.gapIndex],
    // The drawn window: one step of margin either side of the sequence.
    windowStart: u.start - u.step,
    windowEnd: values[values.length - 1] + u.step,
  };
}
