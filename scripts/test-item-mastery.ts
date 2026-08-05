// scripts/test-item-mastery.ts
// The guess-through regression test. Old rule (latest attempt wins) let a
// guessing child converge every 4-option item to "mastered" by repetition
// (~68% per item within 4 exposures). New rule: an item is mastered only when
// its two most recent attempts are both correct and >=24h apart.
import { computeItemMastery } from "../src/lib/worksheet/item-mastery";

let pass = 0, fail = 0;
const check = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log(`  ✗ ${name}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`); }
};

const Q = "Which word means the same as happy?";
const sheet = (daysAgo: number, correct: boolean, q = Q) => ({
  completedAt: new Date(Date.now() - daysAgo * 864e5),
  problems: [{ id: "p1", question: q }],
  answers: [{ problemId: "p1", answer: "x", isCorrect: correct }],
});
const bank = [Q];

// 1. One correct attempt is PROVISIONAL, not mastered — this is the fix.
check("single correct != mastered", computeItemMastery([sheet(0, true)], bank).distinctCorrect, 0);

// 2. Wrong then correct (the guess-through pattern) — still not mastered.
check("miss then hit != mastered", computeItemMastery([sheet(2, false), sheet(0, true)], bank).distinctCorrect, 0);

// 3. Two corrects on the SAME day (retake) — no retention shown, not mastered.
check("same-day double hit != mastered",
  computeItemMastery([sheet(0.01, true), sheet(0, true)], bank).distinctCorrect, 0);

// 4. Two corrects >=24h apart — CONFIRMED.
check("two hits across days = mastered",
  computeItemMastery([sheet(2, true), sheet(0, true)], bank).distinctCorrect, 1);

// 5. A later miss downgrades immediately, even after confirmation.
check("later miss downgrades",
  computeItemMastery([sheet(4, true), sheet(2, true), sheet(0, false)], bank).distinctCorrect, 0);

// 6. Miss between two spaced corrects breaks the pair (last two = miss, hit).
check("hit-miss-hit != mastered",
  computeItemMastery([sheet(4, true), sheet(2, false), sheet(0, true)], bank).distinctCorrect, 0);

// 7. Recovery: fail, then two spaced corrects — mastered again.
check("fail then two spaced hits = mastered",
  computeItemMastery([sheet(5, false), sheet(3, true), sheet(0, true)], bank).distinctCorrect, 1);

// 8. Seen/coverage counting unaffected by the rule change.
const im = computeItemMastery([sheet(0, true)], bank);
check("seen still counts provisional items", im.distinctSeen, 1);
check("coverage unaffected", im.coveragePct, 100);

console.log(`\n${fail === 0 ? "✅" : "❌"} item-mastery: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
