// src/remotion/lesson/script-fracops.ts
// Narration for the FRACTION OPERATIONS template. Fractions are written
// "n/d" so speakable() voices them as "n over d"; every number derives from
// the unit. Four beats per lesson: ask / parts / action / record.
import { type FracOpsUnit, fracOpsNumbers } from "./units-fracops";
import type { LessonLine } from "./script";

export const FRAC_OPS_LINE_IDS = ["ask", "parts", "action", "record"] as const;

export function fracOpsLines(u: FracOpsUnit): LessonLine[] {
  const x = fracOpsNumbers(u);

  switch (u.mode) {
    case "subtract":
      return [
        {
          id: "ask",
          text: `${u.n}/${u.d}, take away ${x.n2}/${u.d}. The pieces are the SAME size... so this is easier than it looks.`,
        },
        {
          id: "parts",
          text: `Here's ${u.n}/${u.d}: a bar cut into ${u.d} equal parts, with ${u.n} of them shaded.`,
        },
        {
          id: "action",
          text: `Now take ${x.n2} of those shaded pieces away... watch them go. Count what's left: ${x.diff} pieces. And they're still ${u.d}ths - taking pieces away never changes the size of a piece.`,
        },
        {
          id: "record",
          text: `${u.n}/${u.d} minus ${x.n2}/${u.d} is ${x.diff}/${u.d}. Same-size pieces: subtract the tops... and the bottom stays. ${u.tip}.`,
        },
      ];

    case "multiply":
      return [
        {
          id: "ask",
          text: `${u.n}/${u.d} times ${x.n2}/${x.d2}. Here's the secret: times means OF. This asks for half OF three quarters.`,
        },
        {
          id: "parts",
          text: `Start with the ${x.n2}/${x.d2}: a square cut into ${x.d2} columns, with ${x.n2} of them shaded.`,
        },
        {
          id: "action",
          text: `Now take ${u.n}/${u.d} of THAT. Cut everything into ${u.d} rows... and keep just ${u.n} row of the shading. Count: ${x.prodN} pieces survive, out of ${x.prodD} in the whole square.`,
        },
        {
          id: "record",
          text: `So ${u.n}/${u.d} times ${x.n2}/${x.d2} is ${x.prodN}/${x.prodD}. Tops multiply: ${u.n} times ${x.n2} is ${x.prodN}. Bottoms multiply: ${u.d} times ${x.d2} is ${x.prodD}. ${u.tip}.`,
        },
      ];

    case "divide":
      return [
        {
          id: "ask",
          text: `${u.n}/${u.d} divided by ${x.n2}/${x.d2}. Division asks a fitting question: how many ${x.n2}/${x.d2} pieces fit inside ${u.n}/${u.d}?`,
        },
        {
          id: "parts",
          text: `Here's ${u.n}/${u.d}: ${u.n} shaded quarters. And here's the measuring piece: a single ${x.n2}/${x.d2}.`,
        },
        {
          id: "action",
          text: `Lay the measuring piece onto the shading, and count the fits. One... two... three. It fits exactly ${x.quot} times.`,
        },
        {
          id: "record",
          text: `${u.n}/${u.d} divided by ${x.n2}/${x.d2} is ${x.quot}. And look: that's the same answer as ${u.n}/${u.d} times ${x.d2}/${x.n2} - flip the second fraction, then multiply. ${u.tip}.`,
        },
      ];

    case "mixed":
      return [
        {
          id: "ask",
          text: `One and ${u.n}/${u.d}. A whole number and a fraction, written together - that's called a MIXED number. How much is it, really?`,
        },
        {
          id: "parts",
          text: `Two bars, cut into ${u.d}ths. The first is completely full - that's the 1, a whole bar. The second has ${u.n} parts shaded - that's the ${u.n}/${u.d}.`,
        },
        {
          id: "action",
          text: `Now count EVERYTHING in ${u.d}ths. The full bar holds ${u.d} of them... plus the ${u.n} in the second bar... ${x.improperN} ${u.d}ths altogether.`,
        },
        {
          id: "record",
          text: `So one and ${u.n}/${u.d} is the same amount as ${x.improperN}/${u.d}. Mixed numbers are for reading; the fraction form is for calculating. ${u.tip}.`,
        },
      ];

    case "improper":
      return [
        {
          id: "ask",
          text: `${u.n}/${u.d}. Look at the top - it's BIGGER than the bottom. Can a fraction be more than a whole? ... It can.`,
        },
        {
          id: "parts",
          text: `Here are ${u.n} loose pieces, each one a ${u.d}th of a bar.`,
        },
        {
          id: "action",
          text: `Start filling. ${u.d} of them fill one whole bar, edge to edge... and the ${x.rem} left over fill ${x.rem} parts of the next bar.`,
        },
        {
          id: "record",
          text: `So ${u.n}/${u.d} is ${x.wholes} whole and ${x.rem}/${u.d}. A top bigger than the bottom isn't a mistake - it just means more than one whole. ${u.tip}.`,
        },
      ];

    case "order":
      return [
        {
          id: "ask",
          text: `Three fractions: ${u.n}/${u.d}, ${x.n2}/${x.d2}, and ${x.n3}/${x.d3}. Which is smallest... and which is biggest?`,
        },
        {
          id: "parts",
          text: `Give each one a bar - all three bars exactly the same length. Cut each bar by its own bottom number, and shade its top number of parts.`,
        },
        {
          id: "action",
          text: `Now just READ the shading. ${u.n}/${u.d} reaches the shortest distance... ${x.n2}/${x.d2} reaches further... and ${x.n3}/${x.d3} reaches the furthest of all.`,
        },
        {
          id: "record",
          text: `Smallest to biggest: ${u.n}/${u.d}, then ${x.n2}/${x.d2}, then ${x.n3}/${x.d3}. Never compare the numbers alone - compare how far the shading reaches. ${u.tip}.`,
        },
      ];
  }
}

export function fracOpsLineIds(): string[] {
  return [...FRAC_OPS_LINE_IDS];
}
