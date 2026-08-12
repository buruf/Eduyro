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
import { readFileSync, existsSync } from "node:fs";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, ALL_VIDEO_UNITS, CURRICULUM_TEN_FRAME_UNITS, CURRICULUM_FACT_FAMILY_UNITS, FRACTION_BAR_UNITS, HUNDRED_GRID_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS, tenFrameNumbers, dealingNumbers } from "../src/remotion/lesson/units";
import { DEFAULT_VOICE_KEY } from "../src/remotion/lesson/voices";
import { lessonLines, columnLines, tenFrameLines, dealingLines, factFamilyLines, areaLines, fractionBarLines, hundredGridLines, countLines, compareLines, numberLineLines } from "../src/remotion/lesson/script";

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
    case "count-up":
      if (u.op !== "−") fail(u.id, `strategy "count-up" only applies to subtraction`);
      if (u.x - u.y > 6) fail(u.id, `strategy "count-up" but the gap of ${u.x - u.y} is too far to count`);
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
  if (n.each < 1) fail(u.id, `${u.total} ÷ ${u.divisor} gives less than one each`);
  if (u.divisor > 12) fail(u.id, `${u.divisor} plates will not fit the stage`);

  if (u.blocks) {
    // Block sharing deals whole tens and then ones. If either place doesn't
    // divide evenly the animation would need a regroup step it doesn't have —
    // that's a different lesson, not this one.
    const tens = Math.floor(u.total / 10);
    const ones = u.total % 10;
    if (tens % u.divisor !== 0) {
      fail(u.id, `${tens} tens don't share evenly between ${u.divisor} — needs a regroup step`);
    }
    if (ones % u.divisor !== 0) {
      fail(u.id, `${ones} ones don't share evenly between ${u.divisor} — needs a remainder step`);
    }
  } else {
    if (u.total > 60) fail(u.id, `${u.total} dots is too many to draw individually`);
    if (n.each > 12) fail(u.id, `${n.each} rings will not fit the stage`);
  }
}

// Early-number templates: the stages have hard drawing limits.
for (const u of COUNT_UNITS) {
  if (u.mode === "count" && u.upTo % 10 !== 0) {
    fail(u.id, `count target ${u.upTo} is not a multiple of ten — the rows scene needs full rows`);
  }
  if (u.mode === "count" && u.upTo > 100) fail(u.id, `${u.upTo} rows off the stage`);
  if (u.mode === "recognise" && u.upTo > 10) {
    fail(u.id, `recognition of ${u.upTo} can't be counted dot by dot`);
  }
}
for (const u of COMPARE_UNITS) {
  if (u.a === u.b) fail(u.id, `${u.a} vs ${u.b} — nothing to compare`);
  if (Math.max(u.a, u.b) > 10) fail(u.id, `rows of ${Math.max(u.a, u.b)} overflow the stage`);
}
for (const u of NUMBER_LINE_UNITS) {
  if (u.gapIndex < 1 || u.gapIndex >= u.count) {
    fail(u.id, `gap at ${u.gapIndex} — the hops start at the first term, so it can't be the gap`);
  }
  const ticks = u.count + 2; // window adds a step each side
  if (ticks > 12) fail(u.id, `${ticks} ticks won't fit the line legibly`);
}

// Every unit must produce a full set of non-empty lines — an unhandled branch
// silently yielding undefined would ship a video with a missing narration.
const allUnits: { id: string; lines: () => { id: string; text: string }[] }[] = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, lines: () => lessonLines(u) })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, lines: () => columnLines(u) })),
  ...[...TEN_FRAME_UNITS, ...CURRICULUM_TEN_FRAME_UNITS].map((u) => ({ id: u.id, lines: () => tenFrameLines(u) })),
  ...DEALING_UNITS.map((u) => ({ id: u.id, lines: () => dealingLines(u) })),
  ...[...FACT_FAMILY_UNITS, ...CURRICULUM_FACT_FAMILY_UNITS].map((u) => ({ id: u.id, lines: () => factFamilyLines(u) })),
  ...AREA_UNITS.map((u) => ({ id: u.id, lines: () => areaLines(u) })),
  ...FRACTION_BAR_UNITS.map((u) => ({ id: u.id, lines: () => fractionBarLines(u) })),
  ...HUNDRED_GRID_UNITS.map((u) => ({ id: u.id, lines: () => hundredGridLines(u) })),
  ...COUNT_UNITS.map((u) => ({ id: u.id, lines: () => countLines(u) })),
  ...COMPARE_UNITS.map((u) => ({ id: u.id, lines: () => compareLines(u) })),
  ...NUMBER_LINE_UNITS.map((u) => ({ id: u.id, lines: () => numberLineLines(u) })),
];

for (const u of allUnits) {
  for (const line of u.lines()) {
    if (!line.text || !line.text.trim()) fail(u.id, `line "${line.id}" is empty`);
    if (line.text.includes("undefined") || line.text.includes("NaN")) {
      fail(u.id, `line "${line.id}" contains undefined/NaN: ${line.text.slice(0, 80)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Labels must match the engine EXACTLY. The dashboard looks a lesson video up
// by the sheet's skill label, so drift here silently means "this unit has no
// video" — a failure that looks like nothing at all.
// ---------------------------------------------------------------------------
const engineSrc = readFileSync("src/lib/shop/arithmetic-engine.ts", "utf8");
const engineLabels = new Map<string, string>();
for (const m of engineSrc.matchAll(/id:"([a-z0-9-]+)", label:"([^"]+)"/g)) {
  engineLabels.set(m[1], m[2]);
}
for (const u of ALL_VIDEO_UNITS) {
  // "cur-" units are named after a CURRICULUM skill rather than an engine
  // unit — they exist precisely because no engine unit carries that name.
  if (u.id.startsWith("cur-")) continue;
  const expected = engineLabels.get(u.id);
  if (!expected) {
    fail(u.id, "no unit with this id exists in the engine");
  } else if (expected !== u.label) {
    fail(u.id, `label drift — engine "${expected}" vs video "${u.label}"`);
  }
}

// Every indexed unit must actually have a rendered file for the default voice.
// The dashboard trusts the index, so a missing file shows a broken player to a
// child rather than failing anywhere a developer would notice.
for (const u of ALL_VIDEO_UNITS) {
  const file = `public/lesson-video/${u.id}.${DEFAULT_VOICE_KEY}.mp4`;
  if (!existsSync(file)) fail(u.id, `indexed for the dashboard but ${file} is missing`);
}

if (problems.length) {
  console.error(`${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`OK — ${allUnits.length} units coherent, ${ALL_VIDEO_UNITS.length} labels match the engine (${TEN_FRAME_UNITS.length + DEALING_UNITS.length} strategy-checked).`);
