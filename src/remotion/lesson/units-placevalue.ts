// src/remotion/lesson/units-placevalue.ts
// Units for the PLACE VALUE template (M2, Grade 1-2) — the foundation the
// whole base-ten system stands on.
//
// Two pictures, both already in the child's vocabulary from other lessons:
// BASE-TEN BLOCKS (a rod is ten ones, bundled) for place value and comparing,
// and a NUMBER LINE for skip counting and for what-comes-before. Comparing
// deliberately uses blocks rather than dots: at two digits the method is
// "tens decide it first", which a heap of dots cannot show.

export interface PlaceValueUnit {
  id: string;
  /** Must equal the curriculum skill label the dashboard looks up. */
  label: string;
  mode: "tens" | "ones" | "compare2d" | "skip" | "before";
  /** The number under study (tens/ones/before), or the first of a comparison. */
  n: number;
  /** compare2d: the second number. */
  n2?: number;
  /** skip: the step (2 or 10) and how many hops to show. */
  step?: number;
  hops?: number;
  tip: string;
}

export const PLACE_VALUE_UNITS: PlaceValueUnit[] = [
  {
    id: "cur-place-value-tens",
    label: "Place value — tens",
    mode: "tens",
    n: 47,
    tip: "The left digit counts the BUNDLES of ten",
  },
  {
    id: "cur-place-value-ones",
    label: "Place value — ones",
    mode: "ones",
    n: 47,
    tip: "The right digit counts the loose ones",
  },
  {
    id: "cur-compare-2digit",
    label: "Compare two-digit numbers",
    mode: "compare2d",
    n: 43,
    n2: 38,
    tip: "Tens decide it first - only check ones if the tens tie",
  },
  {
    id: "cur-skip-2",
    label: "Skip counting by 2",
    mode: "skip",
    n: 0,
    step: 2,
    hops: 8,
    tip: "Same size hop, every time",
  },
  {
    id: "cur-skip-10",
    label: "Skip counting by 10",
    mode: "skip",
    n: 0,
    step: 10,
    hops: 6,
    tip: "Only the tens digit changes",
  },
  {
    id: "cur-numbers-before",
    label: "Numbers before — to 100",
    mode: "before",
    n: 60,
    tip: "One step BACK is one less",
  },
];

export function placeValueUnitById(id: string): PlaceValueUnit {
  const u = PLACE_VALUE_UNITS.find((x) => x.id === id);
  if (!u) throw new Error(`No place-value unit "${id}"`);
  return u;
}

/** Values narration and visuals share. */
export function placeValueNumbers(u: PlaceValueUnit) {
  const tens = Math.floor(u.n / 10);
  const ones = u.n % 10;
  const n2 = u.n2 ?? 0;
  const step = u.step ?? 1;
  const hops = u.hops ?? 5;
  return {
    n: u.n,
    tens,
    ones,
    tensValue: tens * 10,
    n2,
    tens2: Math.floor(n2 / 10),
    ones2: n2 % 10,
    bigger: u.n > n2 ? u.n : n2,
    smaller: u.n > n2 ? n2 : u.n,
    step,
    hops,
    /** skip: the counted sequence, starting at the first hop. */
    sequence: Array.from({ length: hops }, (_, i) => step * (i + 1)),
    /** before: the neighbours either side. */
    prev: u.n - 1,
    next: u.n + 1,
  };
}
