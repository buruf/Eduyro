// src/remotion/lesson/script-lineq.ts
// Narration for the LINEAR EQUATIONS template (M11, Grade 8).
import { type LinEqUnit, linEqNumbers } from "./units-lineq";
import type { LessonLine } from "./script";

export const LIN_EQ_LINE_IDS = ["ask", "work", "twist", "record"] as const;

/** Speak a signed value: −1 is "negative 1", never "1". */
function signed(v: number): string {
  return v < 0 ? `negative ${Math.abs(v)}` : String(v);
}

/** Speak a coordinate pair the way a teacher reads it. */
function point(x: number, y: number): string {
  return `${signed(x)}, ${signed(y)}`;
}

export function linEqLines(u: LinEqUnit): LessonLine[] {
  const n = linEqNumbers(u);

  switch (u.mode) {
    case "two-step":
      return [
        {
          id: "ask",
          text: `${n.a} x minus ${n.b} equals ${n.c}. Two things have happened to x: it was multiplied by ${n.a}, and then ${n.b} was taken off. To get x back on its own, you undo both — but the ORDER matters.`,
        },
        {
          id: "work",
          text: `Think about getting dressed. Socks first, then shoes. To undo it you take the shoes off first — the LAST thing done is the FIRST thing undone. Here, the last thing done to x was taking ${n.b} away. So undo that first: add ${n.b}. To both sides, always. ${n.c} plus ${n.b} is ${n.afterAdd}, so now ${n.a} x equals ${n.afterAdd}.`,
        },
        {
          id: "twist",
          text: `One step left. x is multiplied by ${n.a}, so divide by ${n.a} — both sides again. ${n.afterAdd} divided by ${n.a} is ${n.twoStepX}. x equals ${n.twoStepX}. And check it, always: ${n.a} times ${n.twoStepX} is ${n.afterAdd}, take away ${n.b}... ${n.c}. That is what we were told.`,
        },
        {
          id: "record",
          text: `Undo the adding and subtracting first, then the multiplying and dividing. Reverse order, both sides, every time. ${u.tip}.`,
        },
      ];

    case "distribute-eq":
      return [
        {
          id: "ask",
          text: `${n.a}, bracket, x plus ${n.b}, equals ${n.c}. Most people reach straight for the distributive property here. You can — but there is something quicker sitting in front of you.`,
        },
        {
          id: "work",
          text: `Look at what the bracket IS: one lump, and it has been multiplied by ${n.a}. So divide both sides by ${n.a} and the bracket is free. ${n.c} divided by ${n.a} is ${n.afterDivide}. Now it reads: x plus ${n.b} equals ${n.afterDivide}. Take ${n.b} off both sides, and x equals ${n.distributeX}.`,
        },
        {
          id: "twist",
          text: `Now do it the other way, to prove they agree. Expand: ${n.a} times x is ${n.a} x, and ${n.a} times ${n.b} is ${n.expanded}. So ${n.a} x plus ${n.expanded} equals ${n.c}. Take ${n.expanded} off both sides: ${n.a} x equals ${n.c - n.expanded}. Divide by ${n.a}: x equals ${n.distributeX}. The same answer, by a longer road.`,
        },
        {
          id: "record",
          text: `If the number outside divides the number on the right neatly, divide FIRST — it is fewer steps and fewer mistakes. If it does not, expand instead. ${u.tip}.`,
        },
      ];

    case "both-sides":
      return [
        {
          id: "ask",
          text: `${n.a} x plus ${n.b} equals ${n.c} x plus ${n.d}. There are x's on both sides now, and that feels like a new kind of problem. It is not. It is the same balance.`,
        },
        {
          id: "work",
          text: `You have been moving numbers across for ages: take the same amount off both sides, and the balance holds. x's are no different. Take ${n.c} x off BOTH sides. On the left, ${n.a} x minus ${n.c} x leaves ${n.xDiff} x. On the right, the ${n.c} x is gone entirely — just ${n.d} left.`,
        },
        {
          id: "twist",
          text: `So ${n.xDiff} x plus ${n.b} equals ${n.d}. Now it is an ordinary two-step equation. Take ${n.b} off both sides: ${n.d} minus ${n.b} is ${n.constDiff}, so ${n.xDiff} x equals ${n.constDiff}. Divide by ${n.xDiff}: x equals ${n.bothSidesX}.`,
        },
        {
          id: "record",
          text: `Collect the x's on one side and the plain numbers on the other, then finish as normal. Check it: ${n.a} times ${n.bothSidesX} plus ${n.b}, and ${n.c} times ${n.bothSidesX} plus ${n.d} — both come to ${n.a * n.bothSidesX + n.b}. ${u.tip}.`,
        },
      ];

    case "fraction-eq":
      return [
        {
          id: "ask",
          text: `x over ${n.a} equals ${n.b}. A fraction in an equation looks like trouble, but read what it actually says: some number, cut into ${n.a} equal parts, and one of those parts is ${n.b}.`,
        },
        {
          id: "work",
          text: `Said that way you can almost answer it out loud. If one part out of ${n.a} is ${n.b}, then the whole thing is ${n.a} lots of ${n.b}. And that is exactly what the algebra does: x has been DIVIDED by ${n.a}, so undo it by MULTIPLYING by ${n.a}.`,
        },
        {
          id: "twist",
          text: `Multiply both sides by ${n.a}. On the left, the ${n.a} on the bottom and the ${n.a} you multiplied by cancel — leaving just x. On the right, ${n.b} times ${n.a} is ${n.fractionX}. So x equals ${n.fractionX}. Check: ${n.fractionX} divided by ${n.a} is ${n.b}. Correct.`,
        },
        {
          id: "record",
          text: `Dividing is undone by multiplying, on BOTH sides. x over ${n.a} equals ${n.b} means x equals ${n.fractionX}. ${u.tip}.`,
        },
      ];

    case "transform":
      return [
        {
          id: "ask",
          text: `The point ${point(n.px, n.py)}. A transformation moves it somewhere new — but never randomly. Each one is a rule you can apply to the two coordinates, and there are three worth knowing.`,
        },
        {
          id: "work",
          text: `First, reflect across the x axis. The x axis is a mirror lying flat. Across is a straight drop, so the across-value does not change — still ${signed(n.px)}. The up-value flips to the other side: ${signed(n.py)} becomes ${signed(n.reflectXy)}. The image is ${point(n.reflectXx, n.reflectXy)}. Reflect in the y axis instead and it is the other way round: ${point(n.reflectYx, n.reflectYy)}.`,
        },
        {
          id: "twist",
          text: `Second, translate — a slide, with no turning and no flipping. Slide by ${signed(n.tx)} across and ${signed(n.ty)} up: just add them on. ${signed(n.px)} plus ${signed(n.tx)} is ${signed(n.translatedX)}, and ${signed(n.py)} plus ${signed(n.ty)} is ${signed(n.translatedY)}. That is ${point(n.translatedX, n.translatedY)}. Third, rotate a quarter turn anticlockwise about the origin: the coordinates swap and the new first one changes sign. ${point(n.px, n.py)} becomes ${point(n.rotatedX, n.rotatedY)}.`,
        },
        {
          id: "record",
          text: `Reflect flips one coordinate. Translate adds to both. A quarter turn swaps them and changes a sign. ${u.tip}.`,
        },
      ];
  }
}

export function linEqLineIds(): string[] {
  return [...LIN_EQ_LINE_IDS];
}
