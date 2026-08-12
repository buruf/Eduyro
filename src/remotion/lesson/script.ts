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
  type FractionBarUnit,
  type HundredGridUnit,
  type RatioUnit,
  type BalanceUnit,
  balanceSolution,
  type TenFrameUnit,
  dealingNumbers,
  type DealingUnit,
  factFamilyFacts,
  type FactFamilyUnit,
  areaRegions,
  type AreaUnit,
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
      strategy = `Instead of taking ${u.y} away one by one, ask how far it is from ${u.y} up to ${u.x}. Add one… ${Array.from({ length: n.answer }, (_, i) => u.y + i + 1).join("… ")}. Count what you added — ${n.answer}. That's the gap between them.`;
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

  // Block units share whole tens and then ones — long division's own method,
  // and the only way a dividend this size is teachable without counting.
  if (u.blocks) {
    const tens = Math.floor(u.total / 10);
    const ones = u.total % 10;
    return [
      {
        id: "ask",
        text: `${u.total} divided by ${u.divisor}. That's a lot of things to share… so don't count them one at a time. Use blocks.`,
      },
      {
        id: "deal",
        text: `${u.total} is ${tens} tens and ${ones} ones. Share the tens first — ${tens} tens between ${u.divisor}… that's ${tens / u.divisor} tens each. Now the ones. ${ones} between ${u.divisor}… ${ones / u.divisor} each.`,
      },
      {
        id: "group",
        text: `Written down it's just those two steps. ${tens} tens divided by ${u.divisor} is ${tens / u.divisor} tens. ${ones} ones divided by ${u.divisor} is ${ones / u.divisor}. Put them together… ${n.each}.`,
      },
      {
        id: "record",
        text: `So ${u.total} divided by ${u.divisor} is ${n.each}. ${u.tip}.`,
      },
    ];
  }

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

// ---------------------------------------------------------------------------
// Area model (why long multiplication has the steps it has)
// ---------------------------------------------------------------------------
export const AREA_LINE_IDS = ["ask", "build", "split", "record"] as const;

export function areaLines(u: AreaUnit): LessonLine[] {
  const regions = areaRegions(u);
  const answer = u.x * u.y;
  const pieces = regions.map((r) => `${r.w} times ${r.h} is ${r.product}`).join(". ");
  const sum = regions.map((r) => r.product).join(" plus ");
  const twoWay = regions.length === 4;

  return [
    {
      id: "ask",
      text: `${u.x} times ${u.y}. That's too big to just know… so let's draw it instead.`,
    },
    {
      id: "build",
      text: `Here's a rectangle. ${u.x} across… and ${u.y} down. The answer is how many little squares are inside it.`,
    },
    {
      id: "split",
      text: twoWay
        ? `Now cut it. Across, at the tens… and down, at the tens as well. That gives four pieces, and every one of them is a fact you already know. ${pieces}.`
        : `Now cut it at the tens. ${u.x} is ${regions[0].w} and ${regions[1].w}. And look — both pieces are easy. ${pieces}.`,
    },
    {
      id: "record",
      text: `Add the pieces up. ${sum}… ${answer}. ${u.tip}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Early-number templates (M1–M2): counting, comparison, number line.
// ---------------------------------------------------------------------------
import {
  compareNumbers,
  numberLineValues,
  type CountUnit,
  type CompareUnit,
  type NumberLineUnit,
} from "./units-early";

export const COUNT_LINE_IDS = ["ask", "count", "rows", "record"] as const;

export function countLines(u: CountUnit): LessonLine[] {
  if (u.mode === "recognise") {
    return [
      { id: "ask", text: `This is ${u.upTo}. But what does ${u.upTo} actually mean?` },
      {
        id: "count",
        text: `Count with me… ${Array.from({ length: u.upTo }, (_, i) => i + 1).join("… ")}.`,
      },
      {
        id: "rows",
        text: `The numeral ${u.upTo}… and ${u.upTo} things. Same idea, written two ways.`,
      },
      { id: "record", text: `So that's ${u.upTo}. ${u.tip}.` },
    ];
  }

  const decades = Array.from({ length: u.upTo / 10 }, (_, i) => (i + 1) * 10);
  if (u.upTo === 10) {
    return [
      { id: "ask", text: `Let's count to 10. One number for each one — no skipping, no counting anything twice.` },
      { id: "count", text: `Ready? ${Array.from({ length: 10 }, (_, i) => i + 1).join("… ")}.` },
      { id: "rows", text: `And look — 10 of them fill a whole row, exactly. That's why tens matter so much.` },
      { id: "record", text: `You counted to 10. ${u.tip}.` },
    ];
  }
  return [
    { id: "ask", text: `Counting to ${u.upTo} sounds like a lot. But there's a trick — you already know it.` },
    { id: "count", text: `The first row is just counting to 10. ${Array.from({ length: 10 }, (_, i) => i + 1).join("… ")}.` },
    {
      id: "rows",
      text: `Now watch the rows. Every full row is another ten… ${decades.slice(1).join("… ")}. Each new row starts the same way — 1, 2, 3 — just with a new ten in front.`,
    },
    { id: "record", text: `And that's ${u.upTo}. ${u.tip}.` },
  ];
}

export const COMPARE_LINE_IDS = ["ask", "build", "pair", "record"] as const;

export function compareLines(u: CompareUnit): LessonLine[] {
  const n = compareNumbers(u);
  const question =
    u.focus === "greater"
      ? `${u.a} or ${u.b} — which is greater?`
      : u.focus === "less"
        ? `${u.a} or ${u.b} — which is less?`
        : `${u.a} and ${u.b}. Which is more… and which is less?`;
  const answer =
    u.focus === "greater"
      ? `So ${n.bigger} is greater than ${n.smaller}.`
      : u.focus === "less"
        ? `So ${n.smaller} is less than ${n.bigger}.`
        : `So ${n.bigger} is more, and ${n.smaller} is less.`;
  return [
    { id: "ask", text: `${question} Don't guess — there's a way to see it.` },
    { id: "build", text: `Here's ${u.a}… and here's ${u.b}.` },
    {
      id: "pair",
      text: `Now pair them up, one against one… Every one of the ${n.smaller} has a partner. But ${n.bigger} still has ${n.extra} sticking out with no partner at all.`,
    },
    { id: "record", text: `${answer} ${u.tip}.` },
  ];
}

export const NUMBER_LINE_LINE_IDS = ["ask", "line", "hop", "record"] as const;

export function numberLineLines(u: NumberLineUnit): LessonLine[] {
  const n = numberLineValues(u);
  const shown = n.values.map((v, i) => (i === u.gapIndex ? "blank" : String(v)));
  const hops = n.values.slice(0, -1).map((_, i) => n.values[i + 1]);
  const crossesDecade =
    u.step === 1 && Math.floor(n.gapValue / 10) !== Math.floor((n.gapValue - 1) / 10);
  return [
    {
      id: "ask",
      text: `${shown.join("… ")}. What goes in the blank? The number line knows.`,
    },
    {
      id: "line",
      text: `Here's the line. The sequence starts at ${u.start}${u.step === 1 ? "" : `, and each hop is ${u.step}`}.`,
    },
    {
      id: "hop",
      text: crossesDecade
        ? `Hop along… ${hops.slice(0, -1).join("… ")}… and now the tens tick over… ${n.gapValue}!`
        : `Hop along… ${hops.join("… ")}. Landed — right in the blank.`,
    },
    { id: "record", text: `${n.values.join("… ")}. ${u.tip}.` },
  ];
}

// ---------------------------------------------------------------------------
// Fraction bar (M7)
// ---------------------------------------------------------------------------
export const FRACTION_BAR_LINE_IDS = ["ask", "parts", "action", "record"] as const;

export function fractionBarLines(u: FractionBarUnit): LessonLine[] {
  switch (u.mode) {
    case "identify":
      return [
        { id: "ask", text: `What does ${u.n}/${u.d} actually mean?` },
        {
          id: "parts",
          text: `Start with one whole bar. Cut it into ${u.d} parts — and they have to be EQUAL. Same size, every one. If the parts aren't equal… it's not quarters at all.`,
        },
        {
          id: "action",
          text: `Now shade ${u.n} of them. One… two… three. ${u.n} out of ${u.d}.`,
        },
        {
          id: "record",
          text: `And that's exactly what the fraction says. The bottom number is how many equal parts. The top is how many you took. ${u.tip}.`,
        },
      ];
    case "compare":
      return [
        { id: "ask", text: `Which is bigger… ${u.n}/${u.d}, or ${u.n2}/${u.d2}?` },
        {
          id: "parts",
          text: `Two bars, exactly the same length. Cut the first into ${u.d}… and shade ${u.n}. Cut the second into ${u.d2}… and shade ${u.n2}.`,
        },
        {
          id: "action",
          text: `Now line them up… and look at where the shading ends. The top bar reaches further. ${u.n}/${u.d} is bigger.`,
        },
        {
          id: "record",
          text: `So ${u.n}/${u.d} is greater than ${u.n2}/${u.d2}. ${u.tip}.`,
        },
      ];
    case "add":
      return [
        { id: "ask", text: `${u.n}/${u.d} plus ${u.n2}/${u.d} — how do you add fractions?` },
        {
          id: "parts",
          text: `Here's a bar cut into ${u.d} equal parts, with ${u.n} shaded.`,
        },
        {
          id: "action",
          text: `Now add ${u.n2} more parts… watch them slide in. Count the shading: ${u.n! + (u.n2 ?? 0)} parts.`,
        },
        {
          id: "record",
          text: `${u.n}/${u.d} plus ${u.n2}/${u.d} is ${u.n + (u.n2 ?? 0)}/${u.d}. The bottom number didn't change — the pieces are the same size, there are just more of them. ${u.tip}.`,
        },
      ];
    case "simplify":
      return [
        { id: "ask", text: `${u.n}/${u.d}… can we say that more simply?` },
        {
          id: "parts",
          text: `Here's ${u.n}/${u.d} — a bar in ${u.d} parts, ${u.n} shaded.`,
        },
        {
          id: "action",
          text: `Now watch the shading. Don't take your eyes off it. Erase every second cut… the parts get bigger, and now it's 2 out of 4. Erase again… 1 out of 2. And the shading? It never moved.`,
        },
        {
          id: "record",
          text: `${u.n}/${u.d}, 2/4 and 1/2 are the SAME amount — just cut differently. ${u.tip}.`,
        },
      ];
  }
}

// ---------------------------------------------------------------------------
// Hundred grid (M8)
// ---------------------------------------------------------------------------
export const HUNDRED_GRID_LINE_IDS = ["ask", "grid", "action", "record"] as const;

export function hundredGridLines(u: HundredGridUnit): LessonLine[] {
  switch (u.mode) {
    case "place-value": {
      const t = u.tenths ?? 3;
      return [
        { id: "ask", text: `0.${t} and 0.0${t}. Same thing… or not?` },
        {
          id: "grid",
          text: `Here's a square cut into 100 little cells. One whole column is a tenth — ten cells. One little cell on its own is a hundredth.`,
        },
        {
          id: "action",
          text: `0.${t} is ${t} whole columns… ${t * 10} cells. But 0.0${t} is just ${t} little cells. Look at the difference. Not the same at all — one is ten times the other.`,
        },
        {
          id: "record",
          text: `First place after the dot counts columns. Second place counts cells. ${u.tip}.`,
        },
      ];
    }
    case "operations": {
      const a = u.aCells ?? 40;
      const b = u.bCells ?? 25;
      const sum = a + b;
      const aDec = (a / 100).toFixed(a % 10 === 0 ? 1 : 2);
      const bDec = (b / 100).toFixed(b % 10 === 0 ? 1 : 2);
      const sDec = (sum / 100).toFixed(sum % 10 === 0 ? 1 : 2);
      return [
        { id: "ask", text: `${aDec} plus ${bDec}. Decimals… but the grid makes it easy.` },
        {
          id: "grid",
          text: `${aDec} is ${a} cells out of 100 — shade them gold.`,
        },
        {
          id: "action",
          text: `And ${bDec} is ${b} cells — shade them blue, right after. Now count everything shaded… ${sum} cells.`,
        },
        {
          id: "record",
          text: `${sum} cells out of 100 is ${sDec}. So ${aDec} plus ${bDec} is ${sDec}. ${u.tip}.`,
        },
      ];
    }
    case "subtract": {
      const a = u.aCells ?? 65;
      const b = u.bCells ?? 25;
      const diff = a - b;
      const aDec = (a / 100).toFixed(a % 10 === 0 ? 1 : 2);
      const bDec = (b / 100).toFixed(b % 10 === 0 ? 1 : 2);
      const dDec = (diff / 100).toFixed(diff % 10 === 0 ? 1 : 2);
      return [
        { id: "ask", text: `${aDec} take away ${bDec}. Same grid… different direction.` },
        { id: "grid", text: `${aDec} is ${a} cells out of 100 — there they are, shaded.` },
        {
          id: "action",
          text: `Now take ${bDec} away — that's ${b} cells, coming off… watch the count fall. ${diff} cells left.`,
        },
        {
          id: "record",
          text: `${diff} cells is ${dDec}. So ${aDec} take away ${bDec} is ${dDec}. ${u.tip}.`,
        },
      ];
    }
    case "multiply": {
      const t = u.tenths ?? 3;
      const times = u.times ?? 3;
      const total = t * times;
      const totalDec = (total / 10).toFixed(1);
      const running = Array.from({ length: times }, (_, i) => (t * (i + 1)) / 10).join("… ");
      return [
        { id: "ask", text: `0.${t} × ${times}. Multiplying a decimal… by a whole number.` },
        { id: "grid", text: `0.${t} is ${t} columns. That's one group.` },
        {
          id: "action",
          text: `Now take ${times} groups of it… ${running}. ${total} tenths altogether.`,
        },
        {
          id: "record",
          text: `${total} tenths is ${totalDec}. So 0.${t} × ${times} is ${totalDec}. ${u.tip}.`,
        },
      ];
    }
    case "percent": {
      const p = u.pct ?? 37;
      return [
        { id: "ask", text: `${p} percent. What IS a percent, really?` },
        {
          id: "grid",
          text: `Per cent means per hundred. So here's a hundred — a square cut into 100 cells.`,
        },
        {
          id: "action",
          text: `Shade ${p} of them… that's ${p} percent. Nothing more to it.`,
        },
        {
          id: "record",
          text: `And the same shading has three names: ${p} out of 100… ${(p / 100).toFixed(2)}… and ${p}%. ${u.tip}.`,
        },
      ];
    }
  }
}

// ---------------------------------------------------------------------------
// Ratio table (M9)
// ---------------------------------------------------------------------------
export const RATIO_LINE_IDS = ["ask", "build", "scale", "record"] as const;

export function ratioLines(u: RatioUnit): LessonLine[] {
  if (u.mode === "unit-rate") {
    const per = u.a / u.b;
    return [
      { id: "ask", text: `${u.a} ${u.aName} for ${u.b} ${u.bName}. What's that each?` },
      {
        id: "build",
        text: `Put it in a table. ${u.a} ${u.aName} on the top… ${u.b} ${u.bName} underneath. That's the pair we're given.`,
      },
      {
        id: "scale",
        text: `Now scale it DOWN, until the bottom says just 1. Divide both by ${u.b}… ${u.a} divided by ${u.b} is ${per}. And ${u.b} divided by ${u.b} is 1.`,
      },
      {
        id: "record",
        text: `So that's ${per} ${u.aName} per ${u.bName.replace(/s$/, "")}. That's the unit rate. ${u.tip}.`,
      },
    ];
  }

  const s = u.scale ?? 2;
  const isProp = u.mode === "proportion";
  return [
    {
      id: "ask",
      text: isProp
        ? `${u.a} over ${u.b}… equals what over ${u.b * s}?`
        : `${u.a} ${u.aName} to ${u.b} ${u.bName}. What IS a ratio?`,
    },
    {
      id: "build",
      text: isProp
        ? `Here's ${u.a} over ${u.b}, as a table. Top row ${u.a}… bottom row ${u.b}.`
        : `Here's the pair. ${u.a} ${u.aName} on the top row, ${u.b} ${u.bName} on the bottom.`,
    },
    {
      id: "scale",
      text: `Now multiply BOTH rows by the same number. Times 2… ${u.a * 2} and ${u.b * 2}. Times ${s}… ${u.a * s} and ${u.b * s}. The numbers get bigger, but the shape of the pair never changes.`,
    },
    {
      id: "record",
      text: isProp
        ? `So ${u.a} over ${u.b} equals ${u.a * s} over ${u.b * s}. ${u.tip}.`
        : `${u.a} to ${u.b} is the same ratio as ${u.a * s} to ${u.b * s}. ${u.tip}.`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Balance scale (M10)
// ---------------------------------------------------------------------------
export const BALANCE_LINE_IDS = ["ask", "build", "solve", "record"] as const;

export function balanceLines(u: BalanceUnit): LessonLine[] {
  const n = balanceSolution(u);
  const lhs = `${u.coef === 1 ? "" : u.coef}x + ${u.constL}`;
  const relWord = u.rel === "=" ? "equals" : "is more than";

  if (u.rel === ">") {
    return [
      { id: "ask", text: `x + ${u.constL} ${relWord} ${u.constR}. What can x be?` },
      {
        id: "build",
        text: `Picture a scale — but this one isn't level. The left side is HEAVIER. On the left: a box holding x, and ${u.constL} weights. On the right: ${u.constR}.`,
      },
      {
        id: "solve",
        text: `Take ${u.constL} off both sides… and it's still tipped the same way. That's the thing about a tipped scale — take the same off each side and it stays tipped. Left is just the box now. Right is ${n.afterConst}.`,
      },
      {
        id: "record",
        text: `So x is more than ${n.afterConst}. Not one answer — a whole range of them. ${u.tip}.`,
      },
    ];
  }

  const twoStep = u.coef > 1;
  return [
    { id: "ask", text: `${lhs} ${relWord} ${u.constR}. What is x?` },
    {
      id: "build",
      text: twoStep
        ? `Picture a scale, sitting level. On the left: ${u.coef} boxes, each holding the same x… and ${u.constL} weights. On the right: ${u.constR} weights.`
        : `Picture a scale, sitting level. On the left: a box holding x, and ${u.constL} weights. On the right: ${u.constR} weights.`,
    },
    {
      id: "solve",
      text: twoStep
        ? `First take ${u.constL} off BOTH sides… still level. Left is ${u.coef} boxes, right is ${n.afterConst}. Now split both sides into ${u.coef}… one box on the left, ${n.x} on the right.`
        : `Take ${u.constL} off the left… but if you only do that, it tips. So take ${u.constL} off the RIGHT as well. Still level. Now the left is just the box, and the right is ${n.afterConst}.`,
    },
    {
      id: "record",
      text: `So x is ${n.x}. And you can check it — put ${n.x} back in the box${twoStep ? "es" : ""} and the scale is level again. ${u.tip}.`,
    },
  ];
}
