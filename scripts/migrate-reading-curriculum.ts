// scripts/migrate-reading-curriculum.ts
// Replace the READING levels' skills with the realigned R1–R9 map. Reading is
// unused (no student progress to preserve), so we delete the old reading Skills
// (plus any reading Worksheets / CompletedSheets that FK-block them) and create
// the new Skills. Touches READING ONLY — Math/Writing/Science untouched.
//
//   Dry run:  npx tsx scripts/migrate-reading-curriculum.ts
//   Apply:    npx tsx scripts/migrate-reading-curriculum.ts --apply

import { db } from "../src/lib/db";

const APPLY = process.argv.includes("--apply");

const READING: { code: string; name: string; gradeMin: string; gradeMax: string; skills: string[] }[] = [
  { code: "R1", name: "Letter Recognition", gradeMin: "Pre-K", gradeMax: "K", skills: ["Letter ID", "Letter Sounds"] },
  { code: "R2", name: "Long Vowels & Phonics", gradeMin: "Grade 1", gradeMax: "Grade 2", skills: ["Short Vowels & Blending", "Consonant Blends", "Silent-e", "Vowel Teams & Diphthongs", "R-Controlled Vowels"] },
  { code: "R3", name: "Sight Words", gradeMin: "Grade 1", gradeMax: "Grade 2", skills: ["High-Frequency Sight Words"] },
  { code: "R4", name: "Vocabulary in Context", gradeMin: "Grade 2", gradeMax: "Grade 4", skills: ["Context Clues", "Word Relationships"] },
  { code: "R5", name: "Reading Comprehension", gradeMin: "Grade 3", gradeMax: "Grade 5", skills: ["WH- Questions", "Story Elements", "Paragraph Mechanics"] },
  { code: "R6", name: "Inference & Prediction", gradeMin: "Grade 4", gradeMax: "Grade 6", skills: ["Making Inferences", "Drawing Predictions"] },
  { code: "R7", name: "Author's Purpose", gradeMin: "Grade 5", gradeMax: "Grade 7", skills: ["Perspective & Purpose"] },
  { code: "R8", name: "Figurative Language", gradeMin: "Grade 6", gradeMax: "Grade 8", skills: ["Literary Devices"] },
  { code: "R9", name: "Literary Analysis", gradeMin: "Grade 7", gradeMax: "Grade 9", skills: ["Theme & Moral", "Point of View", "Comparative Text Analysis"] },
];

async function main() {
  const subject = await db.subject.findFirst({
    where: { slug: "READING" },
    include: { levels: { include: { skills: true } } },
  });
  if (!subject) { console.error("No READING subject found."); return; }

  const readingLevels = subject.levels.filter((l) => /^R\d/.test(l.code));
  const levelIds = readingLevels.map((l) => l.id);
  const oldSkills = readingLevels.flatMap((l) => l.skills);

  const wsCount = await db.worksheet.count({ where: { levelId: { in: levelIds } } });
  const csCount = await db.completedSheet.count({ where: { worksheet: { levelId: { in: levelIds } } } });
  const spCount = await db.studentProgress.count({ where: { levelId: { in: levelIds } } });

  console.log(`READING subject: ${readingLevels.length} levels, ${oldSkills.length} old skills.`);
  console.log(`Dependents to clear: worksheets=${wsCount}, completedSheets=${csCount}, studentProgress(reading)=${spCount}`);
  console.log(`\nOld → New per level:`);
  for (const def of READING) {
    const lvl = readingLevels.find((l) => l.code === def.code);
    console.log(`  ${def.code}: [${(lvl?.skills ?? []).map((s) => s.name).join(", ") || "—"}]  →  [${def.skills.join(", ")}]`);
  }
  if (spCount > 0) console.log(`\n⚠ ${spCount} student progress rows on reading levels — reported (user said reading is unused).`);

  if (!APPLY) { console.log(`\n(dry run — re-run with --apply to migrate)`); await db.$disconnect(); return; }

  await db.$transaction(async (tx) => {
    await tx.completedSheet.deleteMany({ where: { worksheet: { levelId: { in: levelIds } } } });
    await tx.worksheet.deleteMany({ where: { levelId: { in: levelIds } } });     // cascades ContentReview
    await tx.skill.deleteMany({ where: { levelId: { in: levelIds } } });
    for (const def of READING) {
      const lvl = readingLevels.find((l) => l.code === def.code);
      if (!lvl) { console.warn(`  (level ${def.code} missing — skipped)`); continue; }
      await tx.level.update({ where: { id: lvl.id }, data: { name: def.name, gradeMin: def.gradeMin, gradeMax: def.gradeMax } });
      await tx.skill.createMany({ data: def.skills.map((s, i) => ({ levelId: lvl.id, name: s, sortOrder: i, totalSheets: 40 })) });
    }
  }, { timeout: 60000 });

  console.log(`\n✅ Reading curriculum migrated to the R1–R9 map.`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
