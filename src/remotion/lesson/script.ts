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
  dealingNumbers,
  type DealingUnit,
  factFamilyFacts,
  type FactFamilyUnit,
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
  const opWord = u.op === "+" ? "plus" : "take away";

  // Branch on the unit's DECLARED strategy — the same field the animation
  // branches on. Deriving the spoken strategy from the numbers instead let the
  // voice describe make-ten while the picture performed doubles.
  let strategy: string;
  switch (u.strategy) {
    case "make-ten":
      strategy = n.makesTen
        ? `The frame has ${n.gap} empty spaces. So slide ${n.fillers} across… and the ten is full. That leaves ${n.rest}. 10 and ${n.rest} is ${n.answer}.`
        : `Now add the other ${u.y} on… ${n.answer}.`;
      break;
    case "count-on":
      strategy = `Start at ${u.x}… and just count on. ${Array.from({ length: u.y }, (_, i) => u.x + i + 1).join("… ")}.`;
      break;
    case "count-back":
      strategy = `Start at ${u.x}… and count back. ${Array.from({ length: u.y }, (_, i) => u.x - i - 1).join("… ")}.`;
      break;
    case "turnaround":
      strategy = `${u.x} and ${u.y}. Now watch — swap them round. ${u.y} and ${u.x}. Same dots, just the other way about… still ${n.answer}. So if you know one, you know the other.`;
      break;
    case "bridge-down":
      strategy = n.bridgesDown
        ? `${u.x} is a ten and ${n.extras} more. Take those ${n.firstOff} off first… and we're down to 10. Now ${n.thenOff} more to go… ${n.answer}.`
        : `Take ${u.y} off, one at a time… ${n.answer} left.`;
      break;
    case "count-up":
      // Difference-as-distance: the dots you ADD are the answer.
      strategy = `Instead of taking 8 away one by one, ask how far it is from ${u.y} up to ${u.x}. Add one… ${Array.from({ length: n.answer }, (_, i) => u.y + i + 1).join("… ")}. Count what you added — ${n.answer}. That's the gap between them.`;
      break;
    case "take-all":
      strategy = `Take all ${u.y} of them off… and there's nothing left. Zero.`;
      break;
  }

  return [
    { id: "ask", text: `${u.x} ${opWord} ${u.y}. Let's use a ten-frame.` },
    {
      id: "build",
      text:
        u.op === "+"
          ? `Here's ${u.x} in the frame. And here are the other ${u.y}, waiting underneath.`
          : u.strategy === "count-up"
            ? `This time, start with the smaller number. Here's ${u.y} in the frame.`
            : `Here's ${u.x}… ${u.x > 10 ? `a full ten, and ${n.extras} more.` : "filling up the frame."}`,
    },
    { id: "strategy", text: strategy },
    { id: "record", text: `So ${u.x} ${opWord} ${u.y} is ${n.answer}. ${u.tip}.` },
  ];
}

// ---------------------------------------------------------------------------
// Dealing (division as sharing AND as grouping)
// ---------------------------------------------------------------------------
export const DEALING_LINE_IDS = ["ask", "deal", "group", "record"] as const;

export function dealingLines(u: DealingUnit): LessonLine[] {
  const n = dealingNumbers(u);
  const leftover =
    n.remainder > 0
      ? ` And ${n.remainder} won't go — there just isn't enough for another one each. That's the remainder.`
      : "";
  return [
    { id: "ask", text: `${u.total} divided by ${u.divisor}. There are two ways to picture this, and they both give the same answer.` },
    {
      id: "deal",
      text: `First way — sharing. Deal them out, one at a time, like cards… ${u.divisor === 1 ? "onto one plate" : `onto ${u.divisor} plates`}. Keep going… and everyone ends up with ${n.each}.${leftover}`,
    },
    {
      id: "group",
      // The leftover is on screen in this scene too, so it has to be spoken
      // here — not only in the sharing scene.
      text: `Now the other way. Instead of sharing, ask how many ${u.divisor}s actually fit inside ${u.total}. Make a group of ${u.divisor}… and another… and count the groups. ${n.each}.${
        n.remainder > 0
          ? ` And the same ${n.remainder} is still stranded — not enough for a whole group.`
          : " Same answer."
      }`,
    },
    {
      id: "record",
      text: `So ${u.total} divided by ${u.divisor} is ${n.each}${n.remainder > 0 ? `, remainder ${n.remainder}` : ""}. ${u.tip}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Fact families (one picture, four questions)
// ---------------------------------------------------------------------------
export const FACT_FAMILY_LINE_IDS = ["ask", "build", "facts", "record"] as const;

export function factFamilyLines(u: FactFamilyUnit): LessonLine[] {
  const whole = u.kind === "additive" ? u.a + u.b : u.a * u.b;
  const facts = factFamilyFacts(u);
  const say = (i: number) =>
    facts[i].text.replace(/×/g, "times").replace(/÷/g, "divided by").replace(/−/g, "take away").replace(/\+/g, "plus").replace(/=/g, "is");

  if (u.kind === "additive") {
    return [
      {
        id: "ask",
        text: `${u.a}, ${u.b} and ${whole}. These three belong together — and once you know how, they give you four facts for the price of one.`,
      },
      {
        id: "build",
        text: `Here's the whole thing… ${whole}. And it's made of two parts. ${u.a}… and ${u.b}.`,
      },
      {
        id: "facts",
        text: `Now ask the picture four different questions. Put the parts together — ${say(0)}. Swap them round — ${say(1)}. Or start from the whole and take a part away. ${say(2)}. And ${say(3)}. Same picture every time.`,
      },
      {
        id: "record",
        text: `That's the family. ${u.tip}.`,
      },
    ];
  }

  return [
    {
      id: "ask",
      text: `${u.a}, ${u.b} and ${whole}. These three belong together — and they give you four facts for the price of one.`,
    },
    {
      id: "build",
      text: `Here it is as an array. ${u.a} rows… with ${u.b} in each row. That's ${whole} altogether.`,
    },
    {
      id: "facts",
      text: `Now ask it four questions. Count it as rows — ${say(0)}. Turn it and count columns — ${say(1)}. Or start from ${whole} and ask how many are in each row. ${say(2)}. And ${say(3)}. One array, four facts.`,
    },
    {
      id: "record",
      text: `That's the family. ${u.tip}.`,
    },
  ];
}
