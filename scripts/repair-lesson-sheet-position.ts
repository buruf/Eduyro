// scripts/repair-lesson-sheet-position.ts
//
// One-off repair for the mis-positioned-content bug: today-packet used a
// running per-level counter to pick which sheet of a lesson's range to
// generate, and that counter never reset when the skill map advanced. A child
// on day one of "2-digit addition (regrouping)" was served content sheet 62 of
// the 45-64 range.
//
// The code is fixed, but sheets already minted keep their stored problems.
// This regenerates every NOT-YET-ATTEMPTED sheet so each lesson's rows form an
// ascending ladder again. Rows anyone has completed are never touched - their
// stored problems and answer key are the record of work already done.
//
//   npx tsx scripts/repair-lesson-sheet-position.ts        # dry run
//   npx tsx scripts/repair-lesson-sheet-position.ts --apply
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const levels = await db.level.findMany({
    where: { subject: { slug: "MATH" } },
    include: { subject: true },
  });
  let planned = 0;
  for (const level of levels) {
    const skills = getMathLevelSkills(level.code);
    if (!skills.length) continue;
    for (const lesson of skills) {
      const rows = await db.worksheet.findMany({
        where: { levelId: level.id, title: { startsWith: `${lesson.label} — ` } },
        orderBy: { sheetNumber: "asc" },
        select: { id: true, sheetNumber: true, problemCount: true },
      });
      if (!rows.length) continue;
      const attempted = await db.completedSheet.findMany({
        where: { worksheetId: { in: rows.map((r) => r.id) } },
        select: { worksheetId: true },
      });
      const attemptedIds = new Set(attempted.map((a) => a.worksheetId));
      const pending = rows.filter((r) => !attemptedIds.has(r.id));
      if (!pending.length) continue;
      // Continue the ladder from wherever the lesson has actually been worked.
      const start = Math.min(lesson.range[1], lesson.range[0] + attemptedIds.size);
      for (let i = 0; i < pending.length; i++) {
        const row = pending[i];
        const content = Math.min(lesson.range[1], start + i);
        const was = lesson.range[0] + ((row.sheetNumber - 1) % (lesson.range[1] - lesson.range[0] + 1));
        if (was === content) continue;
        planned++;
        console.log(`${level.code} "${lesson.label}" sheet ${row.sheetNumber}: content ${was} -> ${content}`);
        if (!APPLY) continue;
        const { problems, answerKey } = generateProblems({
          subjectSlug: "MATH",
          levelCode: level.code,
          skillName: lesson.label,
          problemCount: 30,
          timeLimitMinutes: level.timeLimitMinutes ?? 10,
          sheetNumber: content,
          totalSheets: 100,
        });
        await db.worksheet.update({
          where: { id: row.id },
          data: { problems: problems as any, answerKey: answerKey as any, problemCount: problems.length },
        });
      }
    }
  }
  console.log(`\n${APPLY ? "REGENERATED" : "would regenerate"} ${planned} un-attempted sheet(s).`);
  await db.$disconnect();
}
main();
