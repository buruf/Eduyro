// scripts/preview-lesson-script.ts
// Prints the narration each unit will get, without calling ElevenLabs — so
// wording can be checked before any credits are spent.
//
//   npx tsx scripts/preview-lesson-script.ts              # every unit
//   npx tsx scripts/preview-lesson-script.ts div-skip     # named units
import {
  EQUAL_GROUP_UNITS,
  COLUMN_UNITS,
  TEN_FRAME_UNITS,
  DEALING_UNITS,
  FACT_FAMILY_UNITS,
  AREA_UNITS,
  CURRICULUM_TEN_FRAME_UNITS,
  CURRICULUM_FACT_FAMILY_UNITS,
  unitNumbers,
  columnNumbers,
  tenFrameNumbers,
  dealingNumbers,
  factFamilyFacts,
  areaRegions,
} from "../src/remotion/lesson/units";
import {
  lessonLines,
  columnLines,
  tenFrameLines,
  dealingLines,
  factFamilyLines,
  areaLines,
  sumString,
} from "../src/remotion/lesson/script";

interface Entry {
  id: string;
  label: string;
  head: string;
  lines: () => { id: string; text: string }[];
  extra?: string;
}

const ALL: Entry[] = [
  ...EQUAL_GROUP_UNITS.map((u) => ({
    id: u.id,
    label: u.label,
    head: `${u.a} × ${u.b} = ${unitNumbers(u).product}`,
    lines: () => lessonLines(u),
    extra: `on-screen sum: ${sumString(u)}`,
  })),
  ...COLUMN_UNITS.map((u) => ({
    id: u.id,
    label: u.label,
    head: `${u.x} ${u.op} ${u.y} = ${columnNumbers(u).answer}`,
    lines: () => columnLines(u),
  })),
  ...[...TEN_FRAME_UNITS, ...CURRICULUM_TEN_FRAME_UNITS].map((u) => ({
    id: u.id,
    label: u.label,
    head: `${u.x} ${u.op} ${u.y} = ${tenFrameNumbers(u).answer}  [${u.strategy}]`,
    lines: () => tenFrameLines(u),
  })),
  ...[...FACT_FAMILY_UNITS, ...CURRICULUM_FACT_FAMILY_UNITS].map((u) => ({
    id: u.id,
    label: u.label,
    head: u.kind === "additive" ? u.a + " + " + u.b + " = " + (u.a + u.b) : u.a + " x " + u.b + " = " + (u.a * u.b),
    lines: () => factFamilyLines(u),
    extra: "facts: " + factFamilyFacts(u).map((f) => f.text).join("   "),
  })),
  ...AREA_UNITS.map((u) => ({
    id: u.id,
    label: u.label,
    head: u.x + " x " + u.y + " = " + u.x * u.y,
    lines: () => areaLines(u),
    extra: "regions: " + areaRegions(u).map((r) => r.w + "x" + r.h + "=" + r.product).join("  "),
  })),
  ...DEALING_UNITS.map((u) => {
    const n = dealingNumbers(u);
    return {
      id: u.id,
      label: u.label,
      head: `${u.total} ÷ ${u.divisor} = ${n.each}${n.remainder ? ` r ${n.remainder}` : ""}`,
      lines: () => dealingLines(u),
    };
  }),
];

const only = process.argv.slice(2);
const units = only.length ? ALL.filter((u) => only.includes(u.id)) : ALL;
if (!units.length) {
  console.error(`No matching units. Known: ${ALL.map((u) => u.id).join(", ")}`);
  process.exit(1);
}

for (const u of units) {
  console.log(`\n=== ${u.id}   ${u.head}   — ${u.label}`);
  for (const l of u.lines()) console.log(`  ${l.id.padEnd(8)} ${l.text}`);
  if (u.extra) console.log(`  ${u.extra}`);
}
