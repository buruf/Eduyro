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
];

export function columnUnitById(id: string): ColumnUnit {
  const u = COLUMN_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No column unit "${id}"`);
  return u;
}

export function columnNumbers(u: ColumnUnit) {
  const onesSum = (u.x % 10) + (u.y % 10);
  return {
    x: u.x,
    y: u.y,
    xTens: Math.floor(u.x / 10),
    xOnes: u.x % 10,
    yTens: Math.floor(u.y / 10),
    yOnes: u.y % 10,
    onesSum,
    carries: onesSum >= 10,
    // Subtraction needs a borrow when the top ones digit is too small.
    borrows: u.op === "−" && u.x % 10 < u.y % 10,
    leftover: onesSum % 10,
    tensSum: Math.floor(u.x / 10) + Math.floor(u.y / 10),
    answer: u.op === "+" ? u.x + u.y : u.x - u.y,
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
    | "doubles"
    | "count-on"
    | "count-back"
    | "turnaround"
    | "bridge-down"
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
    strategy: "doubles",
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
    strategy: "doubles",
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

export function tenFrameUnitById(id: string): TenFrameUnit {
  const u = TEN_FRAME_UNITS.find((x) => x.id === id);
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
