// scripts/audit-reading-grade-fit.ts
// No Grade 1–2 reading unit may serve Grade 3+ passage text.
//
// A six-year-old on "Phrase Reading" was being asked "What causes coral
// bleaching?" — the unit's label named no phonics pattern, so it fell past
// the Track A guard into the Grade 5+ bank. This checks EVERY Track A unit,
// by level, so no unit's wording can slip through again.
import { generateProblems } from "../src/lib/worksheet/generator";
import { READING_CURRICULUM } from "../src/lib/reading/curriculum";

/** Words no decodable Grade 1–2 text should contain. */
const TOO_ADVANCED =
  /\b(climate|bleaching|temperatures?|ecosystems?|photosynthesis|algae|communicate|permanently|migration|pollination|Queensland|Australia|organisms?|habitats?)\b/i;

let checked = 0;
const offenders: string[] = [];

for (const mod of READING_CURRICULUM) {
  if (mod.grade > 2) continue; // Track A only
  for (const unit of mod.units) {
    for (let sheet = 1; sheet <= 3; sheet++) {
      let problems: { question?: string }[] = [];
      try {
        problems = generateProblems({
          subjectSlug: "READING",
          levelCode: mod.code,
          skillName: unit,
          problemCount: 20,
          timeLimitMinutes: 10,
          sheetNumber: sheet,
          totalSheets: 100,
        }).problems as { question?: string }[];
      } catch (e) {
        offenders.push(`${mod.code} "${unit}" sheet ${sheet}: generator threw — ${(e as Error).message}`);
        continue;
      }
      checked++;
      for (const p of problems) {
        const q = String(p.question ?? "");
        const hit = q.match(TOO_ADVANCED);
        if (hit) {
          offenders.push(
            `${mod.code} (Grade ${mod.grade}) "${unit}" sheet ${sheet}: serves "${hit[0]}" — ${q.slice(0, 90).replace(/\n/g, " ")}…`,
          );
          break;
        }
      }
    }
  }
}

console.log(`Checked ${checked} Grade 1–2 reading sheets.`);
if (offenders.length) {
  console.log(`\nGRADE MISMATCH (${offenders.length}):`);
  for (const o of offenders.slice(0, 20)) console.log(`  ✗ ${o}`);
  process.exit(1);
}
console.log("PASS — every Grade 1–2 unit serves grade-appropriate text.");
