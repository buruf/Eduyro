// scripts/migrate-writing-curriculum.ts
// Replace the WRITING levels/skills with the realigned W0–W9 map. Writing is
// unused (no student progress to preserve), so delete the old writing Skills
// (plus any writing Worksheets / CompletedSheets that FK-block them) and create
// the new ones. Adds W0 (new level) and W9. Touches WRITING ONLY.
//
//   Dry run:  npx tsx scripts/migrate-writing-curriculum.ts
//   Apply:    npx tsx scripts/migrate-writing-curriculum.ts --apply

import { db } from "../src/lib/db";

const APPLY = process.argv.includes("--apply");

const WRITING: { code: string; name: string; gradeMin: string; gradeMax: string; skills: string[] }[] = [
  { code: "W0", name: "Handwriting & Mechanics", gradeMin: "Pre-K", gradeMax: "K", skills: ["Letter Formation", "Spatial Awareness", "Basic Copying"] },
  { code: "W1", name: "Sentence Completion & Building", gradeMin: "Grade 1", gradeMax: "Grade 2", skills: ["Complete vs. Incomplete Sentences", "Expanding Sentences", "Combining Sentences"] },
  { code: "W2", name: "Parts of Speech & Word Choice", gradeMin: "Grade 2", gradeMax: "Grade 4", skills: ["Core Grammar", "Advanced Parts of Speech", "Precision Vocabulary"] },
  { code: "W3", name: "Sentence Structure & Variety", gradeMin: "Grade 3", gradeMax: "Grade 5", skills: ["Simple, Compound & Complex Sentences", "Subject-Verb Agreement & Tense", "Sentence Editing"] },
  { code: "W4", name: "Punctuation & Mechanics", gradeMin: "Grade 4", gradeMax: "Grade 6", skills: ["Terminal Punctuation", "Internal Punctuation", "Advanced Mechanics"] },
  { code: "W5", name: "Paragraph Structure", gradeMin: "Grade 5", gradeMax: "Grade 7", skills: ["Structural Components", "Paragraph Organization", "Editing & Revising"] },
  { code: "W6", name: "Essay Structure & Research", gradeMin: "Grade 6", gradeMax: "Grade 8", skills: ["Five-Paragraph Framework", "Thesis Statements", "Research & Citing"] },
  { code: "W7", name: "Narrative Writing", gradeMin: "Grade 7", gradeMax: "Grade 9", skills: ["Character & Setting Development", "Plot Arc Architecture"] },
  { code: "W8", name: "Informational & Expository Writing", gradeMin: "Grade 8", gradeMax: "Grade 9", skills: ["Informational Formatting", "Process & Comparison Writing"] },
  { code: "W9", name: "Persuasive & Argumentative Writing", gradeMin: "Grade 8", gradeMax: "Grade 10", skills: ["Fact-Based Claims", "Structural Persuasion"] },
];

async function main() {
  const subject = await db.subject.findFirst({ where: { slug: "WRITING" }, include: { levels: { include: { skills: true } } } });
  if (!subject) { console.error("No WRITING subject found."); return; }

  const writingLevels = subject.levels.filter((l) => /^W\d/.test(l.code));
  const levelIds = writingLevels.map((l) => l.id);
  const oldSkills = writingLevels.flatMap((l) => l.skills);

  const wsCount = await db.worksheet.count({ where: { levelId: { in: levelIds } } });
  const csCount = await db.completedSheet.count({ where: { worksheet: { levelId: { in: levelIds } } } });
  const spCount = await db.studentProgress.count({ where: { levelId: { in: levelIds } } });

  console.log(`WRITING subject: ${writingLevels.length} levels, ${oldSkills.length} old skills.`);
  console.log(`Dependents: worksheets=${wsCount}, completedSheets=${csCount}, studentProgress(writing)=${spCount}`);
  for (const def of WRITING) {
    const lvl = writingLevels.find((l) => l.code === def.code);
    console.log(`  ${def.code}: [${(lvl?.skills ?? []).map((s) => s.name).join(", ") || "— (NEW LEVEL)"}]  →  [${def.skills.join(", ")}]`);
  }

  if (!APPLY) { console.log(`\n(dry run — re-run with --apply to migrate)`); await db.$disconnect(); return; }

  const maxSort = Math.max(0, ...subject.levels.map((l) => l.sortOrder));
  await db.$transaction(async (tx) => {
    await tx.completedSheet.deleteMany({ where: { worksheet: { levelId: { in: levelIds } } } });
    await tx.worksheet.deleteMany({ where: { levelId: { in: levelIds } } });
    await tx.skill.deleteMany({ where: { levelId: { in: levelIds } } });
    let extraSort = maxSort;
    for (const def of WRITING) {
      let lvl = writingLevels.find((l) => l.code === def.code);
      if (!lvl) {
        // New level (W0, W9) — create it.
        lvl = await tx.level.create({ data: { subjectId: subject.id, code: def.code, name: def.name, gradeMin: def.gradeMin, gradeMax: def.gradeMax, sortOrder: def.code === "W0" ? -1 : ++extraSort } }) as any;
      } else {
        await tx.level.update({ where: { id: lvl!.id }, data: { name: def.name, gradeMin: def.gradeMin, gradeMax: def.gradeMax } });
      }
      await tx.skill.createMany({ data: def.skills.map((s, i) => ({ levelId: lvl!.id, name: s, sortOrder: i, totalSheets: 40 })) });
    }
  }, { timeout: 60000 });

  console.log(`\n✅ Writing curriculum migrated to the W0–W9 map.`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
