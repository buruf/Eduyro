// scripts/check-lesson-units.ts
// Guards the lesson units against incoherence between what a unit CLAIMS to
// teach and what its numbers actually do.
//
//   npx tsx scripts/check-lesson-units.ts
//
// Written after a real defect: add-doubles (6 + 6) declared the doubles
// strategy, the animation performed doubles, but the narration branched on the
// numbers instead and read the make-ten script — so the voice said "slide 4
// across" while nothing slid. Any unit whose declared strategy isn't true of
// its own numbers can produce that kind of contradiction, so it fails here.
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, tenFrameNumbers, dealingNumbers } from "../src/remotion/lesson/units";
import { lessonLines, columnLines, tenFrameLines, dealingLines } from "../src/remotion/lesson/script";

const problems: string[] = [];
const fail = (id: string, msg: string) => problems.push(`${id}: ${msg}`);

for (const u of TEN_FRAME_UNITS) {
  const n = tenFrameNumbers(u);
  switch (u.strategy) {
    case "make-ten":
      // The narration says "slide N across and the ten is full" — only true if
      // there IS a gap and the second number can fill it.
      if (!(n.gap > 0 && u.y >= n.gap)) {
        fail(u.id, `strategy "make-ten" but ${u.x} + ${u.y} cannot fill a ten (gap ${n.gap})`);
      }
      break;
    // NOTE: doubles and near-doubles use "make-ten" too. A ten-frame lesson
    // must actually FILL the frame — the doubles shortcut belongs in the
    // closing tip, not instead of the ten. Skipping the slide meant a lesson
    // that said "let's use a ten-frame" and never showed one filled.
    case "count-on":
      if (u.op !== "+") fail(u.id, `strategy "count-on" only applies to addition`);
      if (u.y > 3) fail(u.id, `strategy "count-on" but counting on ${u.y} is too many`);
      break;
    case "count-back":
      if (u.op !== "−") fail(u.id, `strategy "count-back" only applies to subtraction`);
      if (u.y > 3) fail(u.id, `strategy "count-back" but counting back ${u.y} is too many`);
      break;
    case "turnaround":
      if (u.op !== "+") fail(u.id, `strategy "turnaround" only applies to addition`);
      break;
    case "bridge-down":
      if (u.op !== "−") fail(u.id, `strategy "bridge-down" only applies to subtraction`);
      break;
    case "take-all":
      if (u.x !== u.y) fail(u.id, `strategy "take-all" but ${u.x} − ${u.y} does not take all`);
      break;
  }
  if (u.op === "−" && u.x - u.y < 0) fail(u.id, `${u.x} − ${u.y} is negative`);
}


// Dealing units: the plate/ring layouts and the spoken answer all come from
// these numbers, so a divisor that does not fit the stage — or a dividend too
// big to draw as dots — must fail here rather than render as a mess.
for (const u of DEALING_UNITS) {
  const n = dealingNumbers(u);
  if (u.divisor < 1) fail(u.id, `divisor ${u.divisor} is not usable`);
  if (u.total > 60) fail(u.id, `${u.total} dots is too many to draw individually`);
  if (n.each < 1) fail(u.id, `${u.total} ÷ ${u.divisor} gives less than one each`);
  if (u.divisor > 12) fail(u.id, `${u.divisor} plates will not fit the stage`);
  if (n.each > 12) fail(u.id, `${n.each} rings will not fit the stage`);
}

// Every unit must produce a full set of non-empty lines — an unhandled branch
// silently yielding undefined would ship a video with a missing narration.
const allUnits: { id: string; lines: () => { id: string; text: string }[] }[] = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, lines: () => lessonLines(u) })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, lines: () => columnLines(u) })),
  ...TEN_FRAME_UNITS.map((u) => ({ id: u.id, lines: () => tenFrameLines(u) })),
  ...DEALING_UNITS.map((u) => ({ id: u.id, lines: () => dealingLines(u) })),
];

for (const u of allUnits) {
  for (const line of u.lines()) {
    if (!line.text || !line.text.trim()) fail(u.id, `line "${line.id}" is empty`);
    if (line.text.includes("undefined") || line.text.includes("NaN")) {
      fail(u.id, `line "${line.id}" contains undefined/NaN: ${line.text.slice(0, 80)}`);
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`OK — ${allUnits.length} units coherent (${TEN_FRAME_UNITS.length + DEALING_UNITS.length} strategy-checked).`);
