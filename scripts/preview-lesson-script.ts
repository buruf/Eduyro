// scripts/preview-lesson-script.ts
// Prints the narration each unit will get, without calling ElevenLabs — so
// wording can be checked before any credits are spent.
//
//   npx tsx scripts/preview-lesson-script.ts              # every unit
//   npx tsx scripts/preview-lesson-script.ts div-skip     # named units
//
// Units come from the shared registry, so a newly added template shows up here
// automatically. This file used to keep its OWN copy of the unit list, which
// drifted and left the M7+ units invisible to review.
import { ALL_LESSON_UNITS, selectUnits, type RegisteredUnit } from "../src/remotion/lesson/registry";

const only = process.argv.slice(2);

let units: RegisteredUnit[];
try {
  units = selectUnits(only);
} catch (e) {
  console.error(String((e as Error).message));
  console.error(`Known: ${ALL_LESSON_UNITS.map((u) => u.id).join(", ")}`);
  process.exit(1);
}

for (const u of units) {
  console.log(`\n=== ${u.id}   [${u.comp}]   — ${u.label}`);
  for (const l of u.lines()) console.log(`  ${l.id.padEnd(8)} ${l.text}`);
}
console.log(`\n${units.length} unit(s).`);
