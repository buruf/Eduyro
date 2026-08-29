// src/remotion/lesson/script-prealg.ts
// Narration for the PRE-ALGEBRA template (M10). These are eleven- and
// twelve-year-olds meeting a letter for the first time, so the sentences are
// short and every step is said out loud rather than implied.
import { type PreAlgUnit, preAlgNumbers } from "./units-prealg";
import type { LessonLine } from "./script";

export const PRE_ALG_LINE_IDS = ["ask", "work", "twist", "record"] as const;

/** Speak a signed value: −5 is "negative 5", never "5". */
function signed(v: number): string {
  return v < 0 ? `negative ${Math.abs(v)}` : String(v);
}

export function preAlgLines(u: PreAlgUnit): LessonLine[] {
  const x = preAlgNumbers(u);

  switch (u.mode) {
    case "evaluate-add":
      return [
        {
          id: "ask",
          text: `x plus ${x.a}. That is not a puzzle with one answer — it is a RULE. It says: take a number, and add ${x.a} to it. Until someone tells you what x is, there is nothing to work out.`,
        },
        {
          id: "work",
          text: `So here it comes: x is ${x.at}. Now the letter has a value, and you can swap it in. Wherever you see x, write ${x.at} instead. x plus ${x.a} becomes ${x.at} plus ${x.a}... which is ${x.sum}.`,
        },
        {
          id: "twist",
          text: `Now watch what makes this different from ordinary sums. Change x. Say x is ${x.at2}. The rule has not changed at all — still add ${x.a} — but the answer has: ${x.at2} plus ${x.a} is ${x.sum2}. One expression, and a different answer for every x you feed it.`,
        },
        {
          id: "record",
          text: `Substitute, then work it out. A minus behaves exactly the same way: x minus ${x.b}, when x is ${x.at}, is ${signed(x.difference)}. ${u.tip}.`,
        },
      ];

    case "evaluate-mul":
      return [
        {
          id: "ask",
          text: `${x.a} x. Two symbols squashed together with no sign between them — and that is exactly what makes people read it wrong.`,
        },
        {
          id: "work",
          text: `It does not mean ${x.a} next to x, and it does not mean ${x.a} PLUS x. When a number sits against a letter, the multiply sign is simply hidden. ${x.a} x means ${x.a} TIMES x. Say it that way in your head every time.`,
        },
        {
          id: "twist",
          // The running count is generated from the coefficient, not written
          // out — a three-step count hardcoded into the sentence would go
          // silently wrong the moment the unit used a different one.
          text: `So let x be ${x.at}. That gives you ${x.a} groups, each holding ${x.at}. Count them: ${Array.from(
            { length: x.a },
            (_, i) => x.at * (i + 1),
          ).join("... ")}. And if x were ${x.at2}, you would have ${x.a} groups of ${x.at2} — that is ${x.product2}.`,
        },
        {
          id: "record",
          text: `A number touching a letter means multiply. ${x.a} x, when x is ${x.at}, is ${x.product}. ${u.tip}.`,
        },
      ];

    case "like-terms":
      return [
        {
          id: "ask",
          text: `Simplify ${x.a} x plus ${x.b} x. It looks like algebra, but you already know how to do it — you just have to see what x really is.`,
        },
        {
          id: "work",
          text: `Treat x as a THING. A box. ${x.a} x is ${x.a} boxes. ${x.b} x is ${x.b} boxes. Push them together and you are holding ${x.a} boxes plus ${x.b} boxes... ${x.combined} boxes. So ${x.a} x plus ${x.b} x is ${x.combined} x. The x never changes — only how many of them you have.`,
        },
        {
          id: "twist",
          text: `Now the part that catches people out. What about ${x.a} x plus ${x.b}? A plain ${x.b} is not ${x.b} boxes — it is just ${x.b}. Different things do not combine. ${x.a} x plus ${x.b} stays as ${x.a} x plus ${x.b}, and that IS the answer. It is not unfinished.`,
        },
        {
          id: "record",
          text: `Only terms with the same letter add together. Add the numbers in front, keep the x. ${u.tip}.`,
        },
      ];

    case "distribute":
      return [
        {
          id: "ask",
          text: `Expand ${x.a}, bracket, x plus ${x.b}. It means ${x.a} lots of everything inside — and the way to never forget the second bit is to draw it.`,
        },
        {
          id: "work",
          text: `Picture a rectangle ${x.a} tall. Its width is x plus ${x.b}, so cut the width into two pieces: a piece of length x, and a piece of length ${x.b}. Two rooms. The first room is ${x.a} times x, which is ${x.a} x. The second is ${x.a} times ${x.b}, which is ${x.outer}.`,
        },
        {
          id: "twist",
          text: `Add the rooms: ${x.a} x plus ${x.outer}. Now check it. Let x be ${x.at}. The original: ${x.at} plus ${x.b} is ${x.inner}, and ${x.a} times ${x.inner} is ${x.checkLeft}. The expansion: ${x.a} times ${x.at} is ${x.a * x.at}, plus ${x.outer}... ${x.checkRight}. Both ${x.checkLeft}. It really is the same rectangle, counted two ways.`,
        },
        {
          id: "record",
          text: `The number outside multiplies EVERY term inside. ${x.a}, bracket, x plus ${x.b}, is ${x.a} x plus ${x.outer}. ${u.tip}.`,
        },
      ];

    case "solve-times":
      return [
        {
          id: "ask",
          text: `Solve ${x.a} x equals ${x.b}. Read it as a sentence first: ${x.a} identical boxes weigh ${x.b} altogether. What is in one box?`,
        },
        {
          id: "work",
          text: `Picture a balance. On the left, ${x.a} boxes, all the same. On the right, ${x.b}. It is level, so the two sides really are equal — and they will stay equal as long as you treat both sides the same.`,
        },
        {
          id: "twist",
          text: `So share both sides into ${x.a} equal parts. The left becomes one box. The right, ${x.b} shared between ${x.a}, is ${x.solution}. One box holds ${x.solution}. x equals ${x.solution}. Check it: ${x.a} times ${x.solution} is ${x.b}. Balanced.`,
        },
        {
          id: "record",
          text: `x was multiplied by ${x.a}, so divide by ${x.a} to undo it — on BOTH sides. ${u.tip}.`,
        },
      ];

    case "integers":
      return [
        {
          id: "ask",
          text: `${signed(u.a)}, minus ${x.b}. Negative numbers feel strange on paper. On a number line they stop being strange, because plus and minus turn into directions.`,
        },
        {
          id: "work",
          text: `Here is the rule, and it is the whole topic. Plus means walk RIGHT. Minus means walk LEFT. And you always start standing on the first number. So find ${signed(u.a)} — ${x.startAbs} step left of zero — and stand there.`,
        },
        {
          id: "twist",
          text: `Now the minus tells you which way: left. And the ${x.b} tells you how far. Walk ${x.b} steps left. ${signed(u.a - 1)}... ${signed(u.a - 2)}... ${signed(u.a - 3)}... ${signed(x.integerResult)}. You land on ${signed(x.integerResult)}. Going left past zero is not a special case — it is just carrying on walking.`,
        },
        {
          id: "record",
          text: `${signed(u.a)} minus ${x.b} is ${signed(x.integerResult)}. Stand on the first number, let the sign point the way, and walk. ${u.tip}.`,
        },
      ];
  }
}

export function preAlgLineIds(): string[] {
  return [...PRE_ALG_LINE_IDS];
}
