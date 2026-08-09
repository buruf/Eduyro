// scripts/preview-lesson-script.ts
// Prints the narration each equal-groups unit will get, without calling
// ElevenLabs — so wording can be checked before any credits are spent.
//   npx tsx scripts/preview-lesson-script.ts
import { EQUAL_GROUP_UNITS, unitNumbers } from "../src/remotion/lesson/units";
import { lessonLines, sumString } from "../src/remotion/lesson/script";

for (const u of EQUAL_GROUP_UNITS) {
  const n = unitNumbers(u);
  console.log(`\n=== ${u.id}   ${u.a} × ${u.b} = ${n.product}   — ${u.label}`);
  for (const l of lessonLines(u)) console.log(`  ${l.id.padEnd(7)} ${l.text}`);
  console.log(`  on-screen sum: ${sumString(u)}`);
}
