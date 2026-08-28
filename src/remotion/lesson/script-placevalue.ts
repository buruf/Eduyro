// src/remotion/lesson/script-placevalue.ts
// Narration for the PLACE VALUE template (Grade 1-2). Shorter sentences than
// the older levels — these are the youngest listeners on the platform — and
// every number derives from the unit.
import { type PlaceValueUnit, placeValueNumbers } from "./units-placevalue";
import type { LessonLine } from "./script";

export const PLACE_VALUE_LINE_IDS = ["ask", "build", "action", "record"] as const;

export function placeValueLines(u: PlaceValueUnit): LessonLine[] {
  const x = placeValueNumbers(u);

  switch (u.mode) {
    case "tens":
      return [
        {
          id: "ask",
          text: `${u.n}. Two digits... but they do not mean the same thing. What does the ${x.tens} really stand for?`,
        },
        {
          id: "build",
          text: `Here are ${u.n} ones, all loose. Far too many to count safely. So bundle them: every ten ones snap together into one rod.`,
        },
        {
          id: "action",
          text: `Count the rods. One... two... three... ${x.tens}. ${x.tens} rods, and ${x.ones} ones left over that could not make a full ten.`,
        },
        {
          id: "record",
          text: `So the ${x.tens} in ${u.n} is not ${x.tens} — it is ${x.tens} TENS, which is ${x.tensValue}. ${u.tip}.`,
        },
      ];

    case "ones":
      return [
        {
          id: "ask",
          text: `${u.n} again. This time look at the other digit — the ${x.ones} on the right. What is it counting?`,
        },
        {
          id: "build",
          text: `Here is ${u.n} in blocks: ${x.tens} rods of ten, and some loose ones beside them.`,
        },
        {
          id: "action",
          text: `Count only the loose ones. ${x.ones}. They are the leftovers — there were not enough of them to bundle into another ten.`,
        },
        {
          id: "record",
          text: `So ${u.n} is ${x.tensValue} plus ${x.ones}. The left digit counts bundles of ten; the right digit counts singles. ${u.tip}.`,
        },
      ];

    case "compare2d":
      return [
        {
          id: "ask",
          text: `Which is bigger: ${u.n}, or ${x.n2}?`,
        },
        {
          id: "build",
          text: `Build them both. ${u.n} is ${x.tens} rods and ${x.ones} ones. ${x.n2} is ${x.tens2} rods and ${x.ones2} ones.`,
        },
        {
          id: "action",
          text: `Now look at the RODS first, not the ones. ${x.tens} rods against ${x.tens2}. That is already ${(x.tens - x.tens2) * 10} more, and no pile of loose ones can catch up — you would need ten of them just to make one more rod.`,
        },
        {
          id: "record",
          text: `So ${x.bigger} is bigger than ${x.smaller}. Compare the tens first. Only if the tens are equal do you look at the ones. ${u.tip}.`,
        },
      ];

    case "skip": {
      const seq = x.sequence;
      const spoken = seq.slice(0, 5).join("... ");
      return [
        {
          id: "ask",
          text: `Counting by ${x.step}. Instead of every single number, we take bigger hops — and land on the same numbers every time.`,
        },
        {
          id: "build",
          text: `Here is a number line, starting at 0. Each hop is exactly ${x.step} long. Same size, every hop.`,
        },
        {
          id: "action",
          text: `Off we go. ${spoken}... keep hopping.`,
        },
        {
          id: "record",
          text: `${seq.join(", ")}. ${u.tip}. Counting by ${x.step} gets you there far faster than counting by one.`,
        },
      ];
    }

    case "before":
      return [
        {
          id: "ask",
          text: `What number comes just BEFORE ${u.n}?`,
        },
        {
          id: "build",
          text: `Find ${u.n} on the number line. Before means to the LEFT — the direction numbers get smaller.`,
        },
        {
          id: "action",
          text: `Take one step left... and you land on ${x.prev}. One step the other way, to the right, would be ${x.next} — that is the number AFTER.`,
        },
        {
          id: "record",
          text: `So ${x.prev} comes before ${u.n}, and ${x.next} comes after. ${u.tip}.`,
        },
      ];
  }
}

export function placeValueLineIds(): string[] {
  return [...PLACE_VALUE_LINE_IDS];
}
