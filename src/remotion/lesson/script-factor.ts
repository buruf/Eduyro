// src/remotion/lesson/script-factor.ts
// Narration for the FACTORING template (M12, Grade 9).
import { type FactorUnit, factorNumbers } from "./units-factor";
import type { LessonLine } from "./script";

export const FACTOR_LINE_IDS = ["ask", "work", "twist", "record"] as const;

export function factorLines(u: FactorUnit): LessonLine[] {
  const n = factorNumbers(u);

  switch (u.mode) {
    case "trinomial-a":
      return [
        {
          id: "ask",
          text: `Factor ${n.a} x squared, plus ${n.b} x, plus ${n.c}. The old method was: find two numbers that multiply to the last one and add to the middle one. Try it here and it fails — because there is a ${n.a} in front now.`,
        },
        {
          id: "work",
          text: `One extra step fixes it. Multiply a by c: ${n.a} times ${n.c} is ${n.ac}. NOW hunt two numbers that multiply to ${n.ac} and add to ${n.b}. Walk the pairs of ${n.ac}: 1 and ${n.ac} add to ${1 + n.ac}, no. 2 and 6 add to 8, no. ${n.split1} and ${n.split2} add to ${n.b}. Yes.`,
        },
        {
          id: "twist",
          text: `Use them to SPLIT the middle term. ${n.b} x becomes ${n.split1} x plus ${n.split2} x, so you have four terms: ${n.a} x squared, plus ${n.split1} x, plus ${n.split2} x, plus ${n.c}. Now group in pairs. From the first pair take out x: that leaves x, bracket, ${n.a} x plus ${n.split1}. From the second pair take out ${n.q}: that leaves ${n.q}, bracket, ${n.a} x plus ${n.split1}. The same bracket both times — that is how you know it worked.`,
        },
        {
          id: "record",
          text: `So it factors to, bracket, ${n.a} x plus ${n.split1}, bracket, x plus ${n.q}. Multiply a by c, split the middle, then group. ${u.tip}.`,
        },
      ];

    case "diff-squares":
      return [
        {
          id: "ask",
          text: `Factor x squared minus ${n.squared}. Something is missing — there is no x term at all. That absence is the clue.`,
        },
        {
          id: "work",
          text: `Check what you have: x squared is a square, and ${n.squared} is a square, because ${n.root} times ${n.root} is ${n.squared}. Two squares, with a MINUS between them. That pattern has its own answer: bracket, x minus ${n.root}, bracket, x plus ${n.root}.`,
        },
        {
          id: "twist",
          text: `Multiply it back and watch why the x term is missing. x times x is x squared. x times ${n.root} is ${n.root} x. Minus ${n.root} times x is minus ${n.root} x. And minus ${n.root} times ${n.root} is minus ${n.squared}. The two middle terms are equal and opposite — they cancel every single time. That is the whole trick.`,
        },
        {
          id: "record",
          text: `A square, minus a square, factors into the two roots subtracted and added. x squared minus ${n.squared} is x minus ${n.root}, times x plus ${n.root}. ${u.tip}.`,
        },
      ];

    case "perfect-square":
      return [
        {
          id: "ask",
          text: `Factor x squared, plus ${n.middle} x, plus ${n.c}. You could hunt for two numbers as usual — but this one has a shape worth spotting, because it saves you the hunt entirely.`,
        },
        {
          id: "work",
          text: `Two checks. Is the first term a square? x squared — yes, its root is x. Is the last term a square? ${n.c} — yes, its root is ${n.half}. So the candidate is x plus ${n.half}, all squared.`,
        },
        {
          id: "twist",
          text: `Now the check that actually decides it. In a perfect square the middle term must be TWICE the two roots multiplied. The roots are x and ${n.half}. Twice their product is 2 times ${n.half}, which is ${n.middle}. And the middle term IS ${n.middle} x. It matches, so it really is x plus ${n.half}, squared. If the middle had been anything else, it would just be an ordinary trinomial.`,
        },
        {
          id: "record",
          text: `Both ends square, and the middle twice the roots multiplied. Then it is a perfect square: x plus ${n.half}, squared. ${u.tip}.`,
        },
      ];

    case "grouping":
      return [
        {
          id: "ask",
          text: `Factor x cubed, plus ${n.g1} x squared, plus ${n.g2} x, plus ${n.c}. Four terms this time. And nothing divides into all four, so there is no common factor to pull out.`,
        },
        {
          id: "work",
          text: `So stop trying to factor all four at once, and split them into two pairs. First pair: x cubed plus ${n.g1} x squared. Second pair: ${n.g2} x plus ${n.c}. Factor each pair on its own. From the first, take out x squared: that leaves x squared, bracket, x plus ${n.g1}. From the second, take out ${n.g2}: that leaves ${n.g2}, bracket, x plus ${n.g1}.`,
        },
        {
          id: "twist",
          text: `Look at what appeared. Both pairs left behind the SAME bracket: x plus ${n.g1}. That is not luck — it is the signal that grouping has worked. So treat that bracket as one lump and factor it out of both: x plus ${n.g1}, times, bracket, x squared plus ${n.g2}. If the two brackets had come out different, you would try pairing the terms a different way.`,
        },
        {
          id: "record",
          text: `Four terms, no common factor: pair them, factor each pair, and the matching bracket comes out. ${u.tip}.`,
        },
      ];

    case "cubes":
      return [
        {
          id: "ask",
          text: `Factor x cubed plus ${n.cube}. Both parts are cubes: x cubed obviously, and ${n.cube} because ${n.cubeRoot} times ${n.cubeRoot} times ${n.cubeRoot} is ${n.cube}. A sum of cubes has its own formula.`,
        },
        {
          id: "work",
          text: `Take the cube roots: x, and ${n.cubeRoot}. The first bracket is simply those two added: x plus ${n.cubeRoot}. The second bracket is built from the same two numbers, in three terms: the first squared, then the two multiplied, then the second squared. That gives x squared, then ${n.cubeRoot} x, then ${n.cubeSquare}.`,
        },
        {
          id: "twist",
          text: `Now the signs, and there is a word for them: SOAP. Same, Opposite, Always Positive. The first bracket takes the SAME sign as the question — a plus. The middle term of the second bracket takes the OPPOSITE — a minus. And the last term is ALWAYS positive. So the answer is x plus ${n.cubeRoot}, times, bracket, x squared minus ${n.cubeRoot} x plus ${n.cubeSquare}. For a DIFFERENCE of cubes, only the first two signs swap over.`,
        },
        {
          id: "record",
          text: `Cube roots first, then Same, Opposite, Always Positive. And notice the middle term is never doubled — that is what separates this from a perfect square. ${u.tip}.`,
        },
      ];
  }
}

export function factorLineIds(): string[] {
  return [...FACTOR_LINE_IDS];
}
