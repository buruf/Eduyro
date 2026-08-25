// src/remotion/lesson/script-decimalops.ts
// Narration for the DECIMAL OPERATIONS template. Decimals are written as
// digits so speakable() voices them as "0 point 3"; every number derives
// from the unit. Four beats: ask / grid / action / record.
import { type DecimalOpsUnit, decimalOpsNumbers } from "./units-decimalops";
import type { LessonLine } from "./script";

export const DECIMAL_OPS_LINE_IDS = ["ask", "grid", "action", "record"] as const;

export function decimalOpsLines(u: DecimalOpsUnit): LessonLine[] {
  const x = decimalOpsNumbers(u);

  switch (u.mode) {
    case "compare":
      return [
        {
          id: "ask",
          text: `Which is bigger: ${u.a}, or ${x.b}? Careful - ${x.b} has MORE digits. Most people guess wrong here.`,
        },
        {
          id: "grid",
          text: `Put each one on a hundred square. ${u.a} is ${x.aCells} cells out of 100. ${x.b} is ${x.bCells} cells.`,
        },
        {
          id: "action",
          text: `Now look at them side by side. ${x.aCells} cells... against ${x.bCells}. The one with FEWER digits covers more of the square.`,
        },
        {
          id: "record",
          text: `So ${x.bigger} is bigger than ${x.smaller}. Extra digits mean smaller pieces, not a bigger number. ${u.tip}.`,
        },
      ];

    case "round":
      return [
        {
          id: "ask",
          text: `Round ${u.a} to the nearest tenth. Which tenth is it closest to?`,
        },
        {
          id: "grid",
          text: `Here's a number line from ${x.lower} to ${x.upper}. Those are the two tenths on either side of it. Now find ${u.a} - it sits between them.`,
        },
        {
          id: "action",
          text: `Look at the midpoint, halfway between. ${u.a} is PAST the middle... so it's nearer to ${x.upper} than to ${x.lower}.`,
        },
        {
          id: "record",
          text: `So ${u.a} rounds to ${x.rounded}. Forget the rules about digits - just ask which mark it's nearer to. ${u.tip}.`,
        },
      ];

    case "multiply2":
      return [
        {
          id: "ask",
          text: `${u.a} times ${x.b}. Here's the surprise: the answer is SMALLER than both of them. Watch why.`,
        },
        {
          id: "grid",
          text: `Take a whole square and shade ${u.a} of it - that's ${x.aTenths} columns out of 10.`,
        },
        {
          id: "action",
          text: `Now take ${x.b} OF that shading. Cut the square the other way into 10 rows, and keep ${x.bTenths} of them. Count where the two shadings overlap: ${x.aCells > 0 ? Math.round(x.product * 100) : 0} little squares out of 100.`,
        },
        {
          id: "record",
          text: `${Math.round(x.product * 100)} out of 100 is ${x.product}. So ${u.a} times ${x.b} is ${x.product}. Taking a PART of a part always leaves you less. ${u.tip}.`,
        },
      ];

    case "divide":
      return [
        {
          id: "ask",
          text: `${u.a} divided by ${x.b}. Same question as always: how many ${x.b}s fit inside ${u.a}?`,
        },
        {
          id: "grid",
          text: `${u.a} is ${x.aCells} cells of the hundred square. And ${x.b} is ${x.bCells} cells - that's the piece we're measuring with.`,
        },
        {
          id: "action",
          text: `Now cut the ${x.aCells} into groups of ${x.bCells}. One... two... three... four. It fits exactly ${x.quotient} times.`,
        },
        {
          id: "record",
          text: `So ${u.a} divided by ${x.b} is ${x.quotient}. Notice the answer is bigger than what you started with - that happens whenever you divide by less than one. ${u.tip}.`,
        },
      ];

    case "percent-of":
      return [
        {
          id: "ask",
          text: `What is ${x.pct} percent of ${u.a}? Percent means per hundred, so this asks for ${x.pct} hundredths of ${u.a}.`,
        },
        {
          id: "grid",
          text: `Split ${u.a} into 100 equal shares. Each share is worth ${Math.round((u.a / 100) * 100) / 100}.`,
        },
        {
          id: "action",
          text: `Now take ${x.pct} of those shares. ${x.pct} shares, each worth ${Math.round((u.a / 100) * 100) / 100}... that comes to ${x.part}.`,
        },
        {
          id: "record",
          text: `So ${x.pct} percent of ${u.a} is ${x.part}. The quick way: turn the percent into a decimal and multiply. ${x.pct} percent is ${x.pct / 100}, and ${x.pct / 100} times ${u.a} is ${x.part}. ${u.tip}.`,
        },
      ];

    case "percent-change":
      return [
        {
          id: "ask",
          text: `Something costs ${u.a}, and the price goes UP by ${x.pct} percent. What's the new price?`,
        },
        {
          id: "grid",
          text: `First find the change itself. ${x.pct} percent of ${u.a}... that's ${x.part}.`,
        },
        {
          id: "action",
          text: `Now add it on. ${u.a} plus ${x.part} is ${x.increased}. And if the price had DROPPED by ${x.pct} percent instead, you'd take the same ${x.part} off: ${u.a} minus ${x.part} is ${x.decreased}.`,
        },
        {
          id: "record",
          text: `Up ${x.pct} percent gives ${x.increased}. Down ${x.pct} percent gives ${x.decreased}. Always find the part first, then decide whether it goes on or comes off. ${u.tip}.`,
        },
      ];
  }
}

export function decimalOpsLineIds(): string[] {
  return [...DECIMAL_OPS_LINE_IDS];
}
