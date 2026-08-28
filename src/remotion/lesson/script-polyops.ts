// src/remotion/lesson/script-polyops.ts
// Narration for the POLYNOMIAL OPERATIONS template. Exponents are spoken
// ("x squared", "x cubed") while the screen shows x² and x³, and every
// number is derived from the unit rather than written into the sentence.
import { type PolyOpsUnit, polyOpsNumbers } from "./units-polyops";
import type { LessonLine } from "./script";

export const POLY_OPS_LINE_IDS = ["ask", "work", "twist", "record"] as const;

/** Speak a signed value. A constant term of −2 must never be read out as
 *  "2" — that is the value of the thing the lesson is naming. */
function signed(v: number): string {
  return v < 0 ? `negative ${Math.abs(v)}` : String(v);
}

/** Speak a power of x the way a teacher says it aloud. */
function power(exp: number): string {
  if (exp === 0) return "";
  if (exp === 1) return "x";
  if (exp === 2) return "x squared";
  if (exp === 3) return "x cubed";
  return `x to the ${exp}`;
}

/** Speak k·x^p, e.g. "3 x squared", "4", "x". */
function mono(k: number, p: number): string {
  const m = Math.abs(k);
  if (p === 0) return String(m);
  if (m === 1) return power(p);
  return `${m} ${power(p)}`;
}

/** Speak a [x², x, 1] polynomial: "3 x squared, plus 5 x, minus 2". */
function spoken(c: [number, number, number]): string {
  const parts: string[] = [];
  const push = (v: number, p: number) => {
    if (!v) return;
    if (!parts.length) parts.push(v < 0 ? `minus ${mono(v, p)}` : mono(v, p));
    else parts.push(`${v > 0 ? "plus" : "minus"} ${mono(v, p)}`);
  };
  push(c[0], 2);
  push(c[1], 1);
  push(c[2], 0);
  return parts.join(", ") || "0";
}

export function polyOpsLines(u: PolyOpsUnit): LessonLine[] {
  const x = polyOpsNumbers(u);
  const A = spoken(u.a);

  switch (u.mode) {
    case "anatomy":
      return [
        {
          id: "ask",
          text: `${A}. Before you can DO anything to a polynomial, you have to be able to read it — and reading it starts with putting it in order.`,
        },
        {
          id: "work",
          text: `Every term carries a power of x. ${mono(x.c2, 2)} carries exponent 2. ${mono(x.c1, 1)} carries exponent 1. And the last term, ${signed(x.c0)}? Exponent 0 — it has no x at all. Standard form means: line them up with the biggest exponent FIRST, then down. 2... then 1... then 0.`,
        },
        {
          id: "twist",
          text: `Now every part has a name. The biggest exponent, 2, is the DEGREE. The number sitting in front of that leading term, ${x.c2}, is the LEADING COEFFICIENT. And the term with no x, ${signed(x.c0)}, is the CONSTANT TERM — constant because it never changes when x does.`,
        },
        {
          id: "record",
          text: `Sort by exponent, biggest first. Then the front number is the leading coefficient, the top exponent is the degree, and the lonely number on the end is the constant. ${u.tip}.`,
        },
      ];

    case "evaluate":
      return [
        {
          id: "ask",
          text: `${A}. Right now x is a question mark. Evaluating means someone finally tells you: x is ${x.at}. So what is the polynomial worth?`,
        },
        {
          id: "work",
          text: `Swap every x for ${x.at} — every single one. ${x.c2} times ${x.at} squared... plus ${x.c1} times ${x.at}... minus ${Math.abs(x.c0)}. Powers go first: ${x.at} squared is ${x.sq}. So that first term is ${x.c2} times ${x.sq}, which is ${x.termSq}.`,
        },
        {
          id: "twist",
          text: `The middle term: ${x.c1} times ${x.at} is ${x.termX}. Now add them up. ${x.termSq}, plus ${x.termX}, minus ${Math.abs(x.c0)}... ${x.value}. Careful here — ${x.c2} times ${x.at} squared does NOT mean square the ${x.c2}. The exponent belongs to the x, and nothing else.`,
        },
        {
          id: "record",
          text: `Substitute the number in for x, do the powers first, then the multiplying, then the adding. At x equals ${x.at}, this polynomial is worth ${x.value}. ${u.tip}.`,
        },
      ];

    case "subtract": {
      const b: [number, number, number] = [x.b2, x.b1, x.b0];
      return [
        {
          id: "ask",
          text: `Take ${A}... and subtract ${spoken(b)}. This is where more marks are lost than anywhere else in the topic — and it is all down to one sign.`,
        },
        {
          id: "work",
          text: `The minus is not just in front of the ${x.b2} ${power(2)}. It is in front of the whole BRACKET, so it hits every term inside. Flip them all: minus ${mono(x.b2, 2)}, minus ${mono(x.b1, 1)}, minus ${Math.abs(x.b0)}. That plus ${x.b1} ${power(1)} became a minus.`,
        },
        {
          id: "twist",
          text: `Now it is just adding, and adding is sorting by shape. Squared terms: ${x.c2} take away ${x.b2} is ${x.diff[0]}. The x terms: ${x.c1} take away ${x.b1}... ${signed(x.diff[1])}. Yes, negative — that is allowed. And the plain numbers: ${x.c0} take away ${x.b0} is ${x.diff[2]}.`,
        },
        {
          id: "record",
          text: `The answer: ${spoken(x.diff)}. Give the minus to EVERY term in the second bracket, then combine like terms as usual. ${u.tip}.`,
        },
      ];
    }

    case "monomial-mult":
      return [
        {
          id: "ask",
          text: `${mono(x.c1, 1)} times ${mono(x.k ?? 0, x.p ?? 0)}. Two single terms — monomials. They multiply, but the coefficients and the exponents behave completely differently.`,
        },
        {
          id: "work",
          text: `Split the job in two. The plain numbers out front: ${x.c1} times ${x.k}, which is ${x.monoCoef}. Then the x parts. And here is the thing people get wrong — you do NOT multiply the exponents.`,
        },
        {
          id: "twist",
          text: `Write out what the letters actually mean. An x on its own is a single x. ${power(x.p ?? 0)} is x times x. Push them together and you are multiplying ${x.monoExp} x's in a row — that is ${power(x.monoExp)}. So exponents ADD: 1 plus ${x.p} is ${x.monoExp}. The answer: ${mono(x.monoCoef, x.monoExp)}.`,
        },
        {
          id: "record",
          text: `Multiply the coefficients, ADD the exponents. ${x.c1} times ${x.k} is ${x.monoCoef}; 1 plus ${x.p} is ${x.monoExp}. ${u.tip}.`,
        },
      ];

    case "divide-mono":
      return [
        {
          id: "ask",
          text: `${A}, all divided by ${mono(x.k ?? 0, x.p ?? 0)}. One long fraction. The trick is to stop seeing it as one.`,
        },
        {
          id: "work",
          text: `A sum on top can be split up. ${mono(x.c2, 2)} over ${mono(x.k ?? 0, x.p ?? 0)}... PLUS ${mono(x.c1, 1)} over ${mono(x.k ?? 0, x.p ?? 0)}. Two small easy divisions instead of one frightening one.`,
        },
        {
          id: "twist",
          text: `Take the first. Numbers: ${x.c2} divided by ${x.k} is ${x.divA}. Letters: ${power(2)} divided by ${power(x.p ?? 0)} — cancel one x from the top against one on the bottom, and ${x.divAExp === 1 ? "a single x is" : `${power(x.divAExp)} is`} left. So ${mono(x.divA, x.divAExp)}. The second: ${x.c1} divided by ${x.k} is ${x.divB}, and the x cancels away completely, leaving just ${x.divB}.`,
        },
        {
          id: "record",
          text: `The answer: ${mono(x.divA, x.divAExp)} plus ${x.divB}. Split the fraction term by term, divide the numbers, and SUBTRACT the exponents. ${u.tip}.`,
        },
      ];

    case "gcf":
      return [
        {
          id: "ask",
          text: `${A}. Factoring out the greatest common factor asks a simple question: what does every term here have in common?`,
        },
        {
          id: "work",
          text: `Check the numbers first. What divides both ${x.c2} and ${x.c1}? ${x.k}. Now the letters: ${mono(x.c2, 2)} has an x in it, and ${mono(x.c1, 1)} has an x in it, so both share at least one x. Put those together and the greatest common factor is ${mono(x.k ?? 0, x.p ?? 0)}.`,
        },
        {
          id: "twist",
          text: `Pull it out to the front and ask what is left behind. From ${mono(x.c2, 2)}, taking ${mono(x.k ?? 0, x.p ?? 0)} leaves ${mono(x.gcfA, x.gcfAExp)}. From ${mono(x.c1, 1)}, it leaves ${x.gcfB}. So the answer is ${mono(x.k ?? 0, x.p ?? 0)}, bracket, ${mono(x.gcfA, x.gcfAExp)} plus ${x.gcfB}. Check it by multiplying back out: ${mono(x.c2, 2)} plus ${mono(x.c1, 1)}. It rebuilds.`,
        },
        {
          id: "record",
          text: `Find what every term shares — numbers and letters — put it out front, and write what is left in the bracket. Multiply back to check. ${u.tip}.`,
        },
      ];
  }
}

export function polyOpsLineIds(): string[] {
  return [...POLY_OPS_LINE_IDS];
}
