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
