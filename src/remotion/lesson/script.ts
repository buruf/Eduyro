// src/remotion/lesson/script.ts
// Narration for the lesson templates, generated from each unit's own numbers.
//
// Written to be SPOKEN, not read: short beats, contractions, and "…" where a
// teacher would pause. Read-aloud prose is what made the earlier tutorials
// sound recited. Numerals rather than number-words, so the caption matches the
// digits on screen.
import {
  fill,
  unitNumbers,
  columnNumbers,
  tenFrameNumbers,
  type LessonUnit,
  type ColumnUnit,
  type TenFrameUnit,
} from "./units";

export const LINE_IDS = ["ask", "groups", "count", "trick"] as const;
export type LessonLineId = (typeof LINE_IDS)[number];

export interface LessonLine {
  id: string;
  text: string;
}

/** The written-out sum, e.g. "4 + 4 + 4 = 12". */
export function sumString(u: LessonUnit): string {
  const { a, b, product } = unitNumbers(u);
  return `${Array(b).fill(a).join(" + ")} = ${product}`;
}

// ---------------------------------------------------------------------------
// Equal groups ("a × b means b groups of a")
// ---------------------------------------------------------------------------
export function lessonLines(u: LessonUnit): LessonLine[] {
  const { a, b, product, running } = unitNumbers(u);

  // Past about six groups the written-out sum stops being readable and starts
  // being noise, so describe it instead of reciting every term.
  const additionSpoken =
    b <= 6
      ? `So that's ${Array(b).fill(a).join(" + ")}, which is ${product}.`
      : `So that's ${a}, added ${b} times, which is ${product}.`;

  return [
    { id: "ask", text: `So… what does ${a} × ${b} actually mean?` },
    {
      id: "groups",
      text: `It means ${b} groups of ${a}. Let's put them out… one group of ${a}. And another. Keep going.`,
    },
    {
      id: "count",
      text: `Now count them up… ${running.join(", ")}. ${additionSpoken} And ${a} × ${b} means exactly the same thing.`,
    },
    {
      id: "trick",
      text: u.trick
        ? fill(u.trick.text, u)
        : `So whenever you see ${a} × ${b}, you know it's ${product}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Base-ten blocks (what carrying and borrowing actually are)
// ---------------------------------------------------------------------------
export const COLUMN_LINE_IDS = ["ask", "build", "regroup", "written"] as const;

export function columnLines(u: ColumnUnit): LessonLine[] {
  const n = columnNumbers(u);

  if (u.op === "−") {
    const regroup = n.borrows
      ? `Now take away ${n.yOnes} ones. But look… there are only ${n.xOnes} up there. Not enough. So go next door and borrow a ten… and break it apart into ten ones. Now the ones column has ${n.xOnes + 10}. Take away ${n.yOnes}, and ${n.xOnes + 10 - n.yOnes} are left.`
      : `Now take away ${n.yOnes} ones. There are ${n.xOnes} up there, so that one's easy… ${n.xOnes - n.yOnes} left. Nothing has to be broken apart.`;
    return [
      { id: "ask", text: `${u.x} take away ${u.y}. Let's build it out of blocks.` },
      {
        id: "build",
        text: `${u.x} is ${n.xTens} tens and ${n.xOnes} ones. That's what we're taking from.`,
      },
      { id: "regroup", text: regroup },
      {
        id: "written",
        text: n.borrows
          ? `So when you write it down, that crossed-out ten is the one you broke apart. ${u.x} take away ${u.y} is ${n.answer}.`
          : `So when you write it down, each column just subtracts straight down. ${u.x} take away ${u.y} is ${n.answer}.`,
      },
    ];
  }

  const regroup = n.carries
    ? `Now put all the ones together… ${n.xOnes} and ${n.yOnes} is ${n.onesSum}. But you can't leave ${n.onesSum} ones in the ones column. So take ten of them… and snap them into one ten. Over it goes. That's the little 1 you carry — it was never magic, it's just ten ones that became one ten. And ${n.leftover} are left behind.`
    : `Now put all the ones together… ${n.xOnes} and ${n.yOnes} is ${n.onesSum}. That's under ten, so nothing has to move. And the tens… ${n.xTens} and ${n.yTens} is ${n.tensSum}.`;

  return [
    { id: "ask", text: `${u.x} plus ${u.y}. Let's build it out of blocks.` },
    {
      id: "build",
      text: `${u.x} is ${n.xTens} tens and ${n.xOnes} ones. And ${u.y} is ${n.yTens} tens and ${n.yOnes} ones.`,
    },
    { id: "regroup", text: regroup },
    {
      id: "written",
      text: n.carries
        ? `So when you write it down, that little 1 above the tens is the ten you just made. ${u.x} plus ${u.y} is ${n.answer}.`
        : `So when you write it down, the columns just add straight down. ${u.x} plus ${u.y} is ${n.answer}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Ten-frame (addition and subtraction facts)
// ---------------------------------------------------------------------------
export const TEN_FRAME_LINE_IDS = ["ask", "build", "strategy", "record"] as const;

export function tenFrameLines(u: TenFrameUnit): LessonLine[] {
  const n = tenFrameNumbers(u);

  if (u.op === "−") {
    const strategy = n.bridgesDown
      ? `${u.x} is a ten and ${n.extras} more. Take those ${n.firstOff} off first… and we're down to 10. Now ${n.thenOff} more to go… ${n.answer}.`
      : u.y === u.x
        ? `Take all ${u.y} of them off… and there's nothing left. Zero.`
        : `Take ${u.y} off, one at a time… ${n.answer} left.`;
    return [
      { id: "ask", text: `${u.x} take away ${u.y}. Let's use a ten-frame.` },
      { id: "build", text: `Here's ${u.x}… ${u.x > 10 ? "a full ten, and " + n.extras + " more." : "filling up the frame."}` },
      { id: "strategy", text: strategy },
      { id: "record", text: `So ${u.x} take away ${u.y} is ${n.answer}. ${u.tip}.` },
    ];
  }

  const strategy = n.makesTen
    ? `The frame has ${n.gap} empty spaces. So slide ${n.fillers} across… and the ten is full. That leaves ${n.rest}. 10 and ${n.rest} is ${n.answer}.`
    : u.x === u.y
      ? `Two rows the same — that's a double. ${u.x} and ${u.x}… ${n.answer}.`
      : `Now add the other ${u.y} on… ${n.answer}.`;

  return [
    { id: "ask", text: `${u.x} plus ${u.y}. Let's use a ten-frame.` },
    {
      id: "build",
      text: `Here's ${u.x} in the frame. And here are the other ${u.y}, waiting underneath.`,
    },
    { id: "strategy", text: strategy },
    { id: "record", text: `So ${u.x} plus ${u.y} is ${n.answer}. ${u.tip}.` },
  ];
}
