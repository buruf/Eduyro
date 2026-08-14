// src/remotion/lesson/script-poly.ts
// Narration for the POLYNOMIAL template. "x squared" is written out for the
// voice; the screen shows x². All coefficients come from the unit.
import { type PolyUnit, polyText } from "./units-poly";
import type { LessonLine } from "./script";

const spoken = (c: [number, number, number]) => {
  const parts: string[] = [];
  if (c[0]) parts.push(`${c[0] === 1 ? "" : c[0] + " "}x squared`);
  if (c[1]) parts.push(`${c[1] > 0 ? "plus" : "minus"} ${Math.abs(c[1]) === 1 ? "" : Math.abs(c[1]) + " "}x`);
  if (c[2]) parts.push(`${c[2] > 0 ? "plus" : "minus"} ${Math.abs(c[2])}`);
  return parts.join(", ");
};

export function polyLines(u: PolyUnit): LessonLine[] {
  switch (u.mode) {
    case "classify": {
      const terms = [u.a[0], u.a[1], u.a[2]].filter(Boolean).length;
      const name = terms === 1 ? "monomial" : terms === 2 ? "binomial" : "trinomial";
      return [
        {
          id: "ask",
          text: `${spoken(u.a)}. This is a polynomial — a sum of building blocks called TERMS. Classifying it takes two moves: count… and rank.`,
        },
        {
          id: "work",
          text: `First, count. Split it at the plus and minus signs. Term one: ${u.a[0]} x squared. Term two: ${Math.abs(u.a[1])} x. Term three: ${Math.abs(u.a[2])}. Three terms — that makes it a ${name.toUpperCase()}. One term would be a monomial. Two… a binomial.`,
        },
        {
          id: "twist",
          text: `Now rank. Look at each term's exponent on x: 2… then 1… then 0. The BIGGEST exponent is the DEGREE. Here, degree 2 — a quadratic. The degree tells you the shape of its graph before you ever draw it.`,
        },
        {
          id: "record",
          text: `Count the terms for its name. Take the biggest exponent for its degree. ${spoken(u.a)}: a ${name} of degree 2. ${u.tip}.`,
        },
      ];
    }

    case "add": {
      const b = u.b ?? u.a;
      const s: [number, number, number] = [u.a[0] + b[0], u.a[1] + b[1], u.a[2] + b[2]];
      return [
        {
          id: "ask",
          text: `Add two polynomials: ${spoken(u.a)}… and ${spoken(b)}. Looks heavy. It's actually just sorting.`,
        },
        {
          id: "work",
          text: `Picture every term as a tile. Big squares for x squared… bars for x… dots for plain numbers. Pour both polynomials onto the table, and sort by SHAPE. Squares: ${u.a[0]} and ${b[0]} make ${s[0]}. Bars: ${u.a[1]} and ${b[1]} make ${s[1]}. Dots: ${u.a[2]} and ${b[2]} make ${s[2]}.`,
        },
        {
          id: "twist",
          text: `And that's the one rule of the whole topic: only LIKE terms combine. A square can never merge with a bar — x squared and x are different shapes. So ${s[0]} x squared and ${s[1]} x sit side by side… and stay there.`,
        },
        {
          id: "record",
          text: `The sum: ${spoken(s)}. Sort by shape, add what matches, leave the rest alone. ${u.tip}.`,
        },
      ];
    }

    case "multiply": {
      const p = u.p ?? 2, q = u.q ?? 3;
      return [
        {
          id: "ask",
          text: `Multiply x plus ${p}… by x plus ${q}. Here's the picture that keeps it honest: a rectangle whose sides are exactly those lengths.`,
        },
        {
          id: "work",
          text: `Split the sides. Along the top: x, then ${p}. Down the side: x, then ${q}. That cuts the rectangle into four rooms. x times x… x squared. x times ${q}… ${q} x. ${p} times x… ${p} x. And ${p} times ${q}… ${p * q}.`,
        },
        {
          id: "twist",
          text: `Collect the rooms. The x squared. Then ${q} x and ${p} x — like terms — together ${p + q} x. And the ${p * q}. The product: x squared, plus ${p + q} x, plus ${p * q}. Every term met every term. The rectangle makes missing one impossible.`,
        },
        {
          id: "record",
          text: `Multiply every term by every term… then combine the like ones. ${u.tip}.`,
        },
      ];
    }

    case "factor": {
      const p = u.p ?? 2, q = u.q ?? 3;
      const m = p + q, k = p * q;
      return [
        {
          id: "ask",
          text: `x squared, plus ${m} x, plus ${k}. Factoring asks: which two brackets MULTIPLY to make this? It's the rectangle puzzle… run backwards.`,
        },
        {
          id: "work",
          text: `You're hunting two numbers that MULTIPLY to ${k}, and ADD to ${m}. Walk the factor pairs of ${k}. 1 and ${k}: they add to ${1 + k}… no. ${p} and ${q}: they add to ${m}. Yes.`,
        },
        {
          id: "twist",
          text: `So the brackets are x plus ${p}… and x plus ${q}. Don't trust it — CHECK it. Rebuild the rectangle: x squared… ${q} x… ${p} x… ${k}. Collect: x squared plus ${m} x plus ${k}. It rebuilds perfectly.`,
        },
        {
          id: "record",
          text: `Multiply to the last number… add to the middle one. Find that pair, and the brackets write themselves. ${u.tip}.`,
        },
      ];
    }
  }
}

export function polyLineIds(u: PolyUnit): string[] {
  return polyLines(u).map((l) => l.id);
}
