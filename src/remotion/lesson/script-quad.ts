// src/remotion/lesson/script-quad.ts
// Narration for the QUADRATICS template (M13, Grade 9).
import { type QuadUnit, quadNumbers } from "./units-quad";
import type { LessonLine } from "./script";

export const QUAD_LINE_IDS = ["ask", "work", "twist", "record"] as const;

function signed(v: number): string {
  return v < 0 ? `negative ${Math.abs(v)}` : String(v);
}

export function quadLines(u: QuadUnit): LessonLine[] {
  const n = quadNumbers(u);

  switch (u.mode) {
    case "perfect-squares":
      return [
        {
          id: "ask",
          text: `Is ${n.square} a perfect square? The name gives the answer away, if you take it literally.`,
        },
        {
          id: "work",
          text: `A perfect square is a number of things you can arrange into an actual square — same number of rows as columns. Try it with ${n.square}. ${n.side} rows of ${n.side}... and it fills exactly. No gaps, nothing left over. So yes, ${n.square} is a perfect square.`,
        },
        {
          id: "twist",
          text: `And that is what a square ROOT asks: not "what is the area", but "how long is the side". The square root of ${n.square} is ${n.side}, because ${n.side} times ${n.side} is ${n.square}. Root undoes squaring, the way subtracting undoes adding.`,
        },
        {
          id: "record",
          text: `${n.side} squared is ${n.square}, so the square root of ${n.square} is ${n.side}. Squaring gives the area; rooting gives the side. ${u.tip}.`,
        },
      ];

    case "solve-x2-k":
      return [
        {
          id: "ask",
          text: `Solve x squared equals ${n.a}. Most people say ${n.b} straight away — and they are right, but they are only half right.`,
        },
        {
          id: "work",
          text: `Check ${n.b}: ${n.b} squared is ${n.a}. That works. Now check ${signed(n.negRoot)}. ${signed(n.negRoot)} times ${signed(n.negRoot)}... a negative times a negative is a positive, so that is ${n.a} as well. It works too.`,
        },
        {
          id: "twist",
          text: `Squaring throws the sign away. ${n.b} and ${signed(n.negRoot)} both land on ${n.a}, so when you undo it there is no way to tell which one you started from — and you have to keep both. x equals plus or minus ${n.b}. Missing the negative is the single most common lost mark in this topic.`,
        },
        {
          id: "record",
          text: `x squared equals ${n.a} gives x equals plus or minus ${n.b}. Take the square root of both sides, and write BOTH answers. ${u.tip}.`,
        },
      ];

    case "simplify-roots":
      return [
        {
          id: "ask",
          text: `Simplify the square root of ${n.a}. ${n.a} is not a perfect square, so this will not come out as a whole number — but it can still be tidied.`,
        },
        {
          id: "work",
          text: `Look for a perfect square hiding inside ${n.a}. Its factor pairs: 1 and ${n.a}, then ${n.inside} and ${n.factor}. And ${n.factor} IS a perfect square. So write the root of ${n.a} as the root of ${n.factor}, times the root of ${n.inside}.`,
        },
        {
          id: "twist",
          text: `Now the root of ${n.factor} is exactly ${n.outside}, so it walks out from under the root sign. The root of ${n.inside} has no square factors left, so it stays. The answer is ${n.outside} root ${n.inside}. Same value as before — the root of ${n.a} is about 2 point 8, and so is ${n.outside} root ${n.inside} — just written honestly.`,
        },
        {
          id: "record",
          text: `Split off the biggest perfect square, take its root outside, leave the rest under. Root ${n.a} is ${n.outside} root ${n.inside}. ${u.tip}.`,
        },
      ];

    case "zero-product":
      return [
        {
          id: "ask",
          text: `Solve, bracket, x minus ${n.root1}, bracket, x minus ${n.root2}, equals zero. Two things multiplied together give zero. What does that force?`,
        },
        {
          id: "work",
          text: `Think about ordinary numbers. If two numbers multiply to make 12, you know almost nothing — it could be 3 and 4, or 2 and 6. But if two numbers multiply to make ZERO, you know something enormous: at least one of them must BE zero. Nothing else works.`,
        },
        {
          id: "twist",
          text: `So one of the brackets is zero. Either x minus ${n.root1} is zero, which means x is ${n.root1}. Or x minus ${n.root2} is zero, which means x is ${n.root2}. Two brackets, two answers: ${n.root1} and ${n.root2}. And this only works because the other side is zero — if it said 12, none of this reasoning would hold.`,
        },
        {
          id: "record",
          text: `A product is zero only if a factor is zero. Set each bracket to zero in turn. x equals ${n.root1}, or ${n.root2}. ${u.tip}.`,
        },
      ];

    case "solve-factoring":
      return [
        {
          id: "ask",
          text: `Solve x squared minus ${n.sum} x plus ${n.product} equals zero. It is already set to zero, which is exactly the shape you need.`,
        },
        {
          id: "work",
          text: `Factor the left side. Hunt two numbers that MULTIPLY to ${n.product} and ADD to ${n.sum}. Both signs come out negative, since they multiply to a positive and add to a negative. Try ${n.root1} and ${n.root2}: ${n.root1} times ${n.root2} is ${n.product}, and ${n.root1} plus ${n.root2} is ${n.sum}. That is the pair.`,
        },
        {
          id: "twist",
          text: `So it factors to, bracket, x minus ${n.root1}, bracket, x minus ${n.root2}, equals zero. Now the zero-product property finishes it: x is ${n.root1}, or x is ${n.root2}. Check the first: ${n.root1} squared is ${n.root1 * n.root1}, minus ${n.sum} times ${n.root1} which is ${n.sum * n.root1}, plus ${n.product}. That comes to zero.`,
        },
        {
          id: "record",
          text: `Zero on one side, factor the other, then set each bracket to zero. x equals ${n.root1} or ${n.root2}. ${u.tip}.`,
        },
      ];

    case "discriminant":
      return [
        {
          id: "ask",
          text: `x squared plus ${n.b} x plus ${n.c} equals zero. Before you spend any time solving it, you can find out whether it HAS a solution at all.`,
        },
        {
          id: "work",
          text: `The discriminant is the part of the quadratic formula that lives under the square root: b squared minus 4 a c. Here a is ${n.a}, b is ${n.b}, c is ${n.c}. So b squared is ${n.bSquared}. And 4 a c is ${n.fourAC}. Take them: ${n.bSquared} minus ${n.fourAC} is ${signed(n.discriminant)}.`,
        },
        {
          id: "twist",
          text: `Negative. And that number sits under a square root — you cannot take the square root of a negative and get a real number. So there are NO real solutions. On a graph that means the parabola floats entirely above the x axis and never touches it. If the discriminant had been positive you would get two solutions; exactly zero would give one.`,
        },
        {
          id: "record",
          text: `b squared minus 4 a c: positive gives two solutions, zero gives one, negative gives none. Here it is ${signed(n.discriminant)}, so there are no real solutions. ${u.tip}.`,
        },
      ];
  }
}

export function quadLineIds(): string[] {
  return [...QUAD_LINE_IDS];
}
