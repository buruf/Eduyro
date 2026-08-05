// scripts/heal-math-sheets.ts
// Proactively heal stale math worksheet rows whose stored CONTENT doesn't match
// their TITLE's lesson (e.g. a "Missing number in a sequence — Sheet 1" row that
// actually holds "What number comes after 19?"). Content is deterministic from
// (level, contentSheet), so we regenerate the expected problems for the title's
// lesson and, on a question-TYPE mismatch, rewrite problems+answerKey in place.
// Never deletes (worksheet rows are shared per-skill → FK-safe update only).
//
//   Dry run (default):  npx tsx scripts/heal-math-sheets.ts
//   Apply:              npx tsx scripts/heal-math-sheets.ts --apply

import { db } from "../src/lib/db";
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";

const APPLY = process.argv.includes("--apply");
const formOf = (probs: any[]) =>
  (Array.isArray(probs) ? probs : []).slice(0, 3).map((p) => String(p?.question ?? "").replace(/-?\d+/g, "#")).join(" | ");

async function main() {
  const levels = await db.level.findMany({
    where: { subject: { slug: "MATH" } },
    select: { id: true, code: true, timeLimitMinutes: true, subject: { select: { slug: true } } },
  });

  let scanned = 0, mismatched = 0, healed = 0, skipped = 0;
  const samples: string[] = [];

  for (const level of levels) {
    const skills = getMathLevelSkills(level.code);
    if (!skills.length) continue;
    const byLabel = new Map(skills.map((s) => [s.label, s]));

    const worksheets = await db.worksheet.findMany({
      where: { levelId: level.id, title: { contains: " — Sheet " } },
      select: { id: true, title: true, sheetNumber: true, problems: true, skill: { select: { name: true } } },
    });

    for (const ws of worksheets) {
      const label = ws.title?.split(" — Sheet")[0]?.trim();
      const unit = label ? byLabel.get(label) : undefined;
      if (!unit) continue; // not a skill-map titled row we can map → leave alone
      scanned++;
      const rangeSize = unit.range[1] - unit.range[0] + 1;
      const contentSheet = unit.range[0] + ((ws.sheetNumber - 1) % rangeSize);
      const expected = generateProblems({
        subjectSlug: level.subject?.slug ?? "MATH",
        levelCode: level.code,
        skillName: ws.skill?.name ?? "x",
        problemCount: 30,
        timeLimitMinutes: level.timeLimitMinutes ?? 10,
        sheetNumber: contentSheet,
        totalSheets: 100,
      });
      if (formOf(ws.problems as any[]) === formOf(expected.problems)) continue; // matches → fine
      mismatched++;
      if (samples.length < 12)
        samples.push(`  ${level.code} "${ws.title}"  stored:[${formOf(ws.problems as any[])}]  →  expected:[${formOf(expected.problems)}]`);
      if (APPLY) {
        await db.worksheet.update({
          where: { id: ws.id },
          data: { problems: expected.problems as any, answerKey: expected.answerKey as any, problemCount: expected.problems.length },
        });
        healed++;
      } else skipped++;
    }
  }

  console.log(`\nScanned ${scanned} skill-map-titled math worksheets across ${levels.length} math levels.`);
  console.log(`Mismatched (title↔content): ${mismatched}`);
  if (samples.length) { console.log(`\nExamples:`); samples.forEach((s) => console.log(s)); }
  console.log(APPLY ? `\n✅ HEALED ${healed} rows in place.` : `\n(dry run — re-run with --apply to heal ${mismatched} rows)`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
