// scripts/reheal-stale-sheets.ts
//
// After a content deploy, sheets already minted for enrolled children still
// hold the questions they were minted with. The dashboard self-heals a row
// when it is served, but a parent asked that children get the benefit of a
// fix the moment it ships, not the next time each row happens to be served.
//
// This walks every NOT-YET-ATTEMPTED math sheet on every level, regenerates
// what the engine would mint for that row today (same ladder as the mint:
// the lesson's first content sheet + sheets already attempted in the lesson
// + position among the pending rows), and rewrites the row only when the
// stored content differs. Attempted rows are never touched: their stored
// problems and answer key are the record of work already done.
//
//   npx tsx scripts/reheal-stale-sheets.ts          # dry run
//   npx tsx scripts/reheal-stale-sheets.ts --apply
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

/** What a child sees and is graded on: question, options, answer — ids excluded. */
function fingerprint(problems: any[], answerKey: any[]): string {
  const keyById = new Map((answerKey ?? []).map((k: any) => [k.id, String(k.answer)]));
  return (problems ?? [])
    .map((p: any) => `${p.question}|${(p.options ?? []).join("/")}|${keyById.get(p.id) ?? p.answer}`)
    .join("\n");
}

async function main() {
  const levels = await db.level.findMany({ where: { subject: { slug: "MATH" } } });
  let pendingRows = 0, stale = 0, rewritten = 0;
  const perLesson: string[] = [];
  for (const level of levels) {
    const skills = getMathLevelSkills(level.code);
    for (const lesson of skills) {
      const rows = await db.worksheet.findMany({
        where: { levelId: level.id, title: { startsWith: `${lesson.label} — ` } },
        // Tie-break on id: rows can share a sheetNumber, and an unstable order
        // would hand the pair different ladder positions on different runs.
        orderBy: [{ sheetNumber: "asc" }, { id: "asc" }],
        select: { id: true, sheetNumber: true, problems: true, answerKey: true },
      });
      if (!rows.length) continue;
      const attempted = await db.completedSheet.findMany({
        where: { worksheetId: { in: rows.map((r) => r.id) } },
        select: { worksheetId: true },
      });
      const attemptedIds = new Set(attempted.map((a) => a.worksheetId));
      const pending = rows.filter((r) => !attemptedIds.has(r.id));
      if (!pending.length) continue;
      pendingRows += pending.length;
      const start = Math.min(lesson.range[1], lesson.range[0] + attemptedIds.size);
      let staleHere = 0;
      for (let i = 0; i < pending.length; i++) {
        const row = pending[i];
        const contentSheet = Math.min(lesson.range[1], start + i);
        const expected = generateProblems({
          subjectSlug: "MATH", levelCode: level.code, skillName: lesson.label,
          problemCount: 30, timeLimitMinutes: level.timeLimitMinutes ?? 10,
          sheetNumber: contentSheet, totalSheets: 100,
        });
        const before = fingerprint(row.problems as any[], row.answerKey as any[]);
        const after = fingerprint(expected.problems as any[], expected.answerKey as any[]);
        if (before === after) continue;
        stale++; staleHere++;
        if (!APPLY) continue;
        await db.worksheet.update({
          where: { id: row.id },
          data: { problems: expected.problems as any, answerKey: expected.answerKey as any, problemCount: expected.problems.length },
        });
        rewritten++;
      }
      if (staleHere) perLesson.push(`${level.code} "${lesson.label}": ${staleHere} of ${pending.length} pending sheet(s) stale`);
    }
  }
  for (const l of perLesson) console.log("  " + l);
  console.log(`\npending math sheets: ${pendingRows}; stale: ${stale}; ${APPLY ? `rewritten: ${rewritten}` : "dry run — pass --apply to rewrite"}`);
  await db.$disconnect();
}
main();
