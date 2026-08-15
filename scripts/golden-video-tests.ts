// scripts/golden-video-tests.ts
// GOLDEN TEST SUITE for the lesson-video engine. Each case pins a canonical
// lesson to hardcoded expected teaching elements — independent of both the
// narration generators AND the contracts, so a regression in either fails
// here. Every future engine change must pass this suite.
//
// Case 1 is the incident that created this file: the screen showed 6, 7, 8
// and the narrator said only "6… 7". If that exact mistake ever recurs, this
// suite rejects the video.
import { ALL_LESSON_UNITS } from "../src/remotion/lesson/registry";
import { contractFor } from "../src/remotion/lesson/contracts";

interface Golden {
  unit: string;
  name: string;
  /** Every one of these must be narrated (digit or word). */
  mustSpeak: number[];
  /** And these must be in the unit's own contract (contract regression guard). */
  mustRequire: number[];
}

const GOLDENS: Golden[] = [
  {
    // THE original bug: counting on from 6 — every displayed value spoken.
    unit: "cur-counting-on-next",
    name: "Counting on (6 → 7 → 8 → 9)",
    mustSpeak: [6, 7, 8, 9],
    mustRequire: [6, 7, 8, 9],
  },
  {
    unit: "cur-add-within-5",
    name: "Addition within 5",
    mustSpeak: [3, 2, 5],
    mustRequire: [3, 2, 5],
  },
  {
    unit: "sub-count-back",
    name: "Subtraction by counting back",
    mustSpeak: [9, 2, 7],
    mustRequire: [9, 2, 7],
  },
  {
    unit: "cur-identify-fractions",
    name: "Identify fractions (3/4)",
    mustSpeak: [3, 4],
    mustRequire: [3, 4],
  },
  {
    unit: "cur-simplify-fractions",
    name: "Equivalent/simplify fractions (4/8 = 1/2)",
    mustSpeak: [4, 8, 1, 2],
    mustRequire: [4, 8],
  },
  {
    unit: "mul-skip",
    name: "Multiplication (5 × 6 = 30)",
    mustSpeak: [5, 6, 30],
    mustRequire: [5, 6, 30],
  },
  {
    unit: "cur-decimal-place-value",
    name: "Decimal place value",
    mustSpeak: [10, 100],
    mustRequire: [],
  },
  {
    unit: "cur-one-step",
    name: "Algebra: one-step equation (x + 3 = 8)",
    mustSpeak: [3, 8, 5],
    mustRequire: [3, 8, 5],
  },
];

const WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30,
  hundred: 100, squared: 2, cubed: 3,
};
function narratedNumbers(text: string): number[] {
  const digits = (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const words = (text.toLowerCase().match(/[a-z]+/g) ?? [])
    .map((w) => WORDS[w])
    .filter((v): v is number => v !== undefined);
  return [...digits, ...words];
}

let failed = 0;
for (const g of GOLDENS) {
  const unit = ALL_LESSON_UNITS.find((u) => u.id === g.unit);
  const problems: string[] = [];
  if (!unit) {
    problems.push(`unit "${g.unit}" no longer exists in the registry`);
  } else {
    const all = unit
      .lines()
      .flatMap((l) => narratedNumbers(l.text));
    for (const n of g.mustSpeak) {
      if (!all.some((x) => Math.abs(x - n) < 0.005)) {
        problems.push(`narration never says ${n}`);
      }
    }
    const contract = contractFor(unit.comp, unit.id);
    for (const n of g.mustRequire) {
      if (!contract.requiredSpoken.some((x) => Math.abs(Math.abs(x) - n) < 0.005)) {
        problems.push(`contract no longer REQUIRES ${n} — coverage regression`);
      }
    }
  }
  if (problems.length) {
    failed++;
    console.log(`FAIL  ${g.name}`);
    for (const p of problems) console.log(`      ✗ ${p}`);
  } else {
    console.log(`PASS  ${g.name}`);
  }
}

console.log(`\nGolden suite: ${GOLDENS.length - failed}/${GOLDENS.length} passing`);
if (failed) process.exit(1);
