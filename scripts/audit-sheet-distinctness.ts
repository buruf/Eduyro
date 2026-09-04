// scripts/audit-sheet-distinctness.ts
// A child must never answer the same question twice on one sheet.
//
// The math journey test (tests/unit/child-journey.test.ts) already enforces
// this for every math lesson. This is the reading / writing / science half,
// run over what the database can actually serve. It became a gate on
// 2026-09-04 after a hand sweep found 144 sheets across 21 skills repeating a
// question - some at 50% distinct - none of which any existing audit caught,
// because none of them asked the question.
//
// Two ways a sheet ends up repeating, both of which this catches:
//   - the bank is smaller than three sheets' worth, so tiling wraps;
//   - the bank has several items with IDENTICAL stems ("Which is correct?"),
//     which the generator's text sort then lands on the same sheet.
import { PrismaClient } from "@prisma/client";
import { generateProblems } from "../src/lib/worksheet/generator";

const db = new PrismaClient();
const SHEETS_PER_SKILL = 12;

async function main() {
  const levels = await db.level.findMany({
    where: { isActive: true },
    include: { subject: true, skills: true },
    orderBy: [{ sortOrder: "asc" }],
  });
  await db.$disconnect();

  const bad: { where: string; worst: number; sheets: number }[] = [];
  let sheets = 0;
  for (const lvl of levels) {
    const subj = lvl.subject.slug;
    if (subj === "MATH") continue; // covered by the journey test
    for (const sk of lvl.skills) {
      let worst = 1, n = 0;
      for (let s = 1; s <= SHEETS_PER_SKILL; s++) {
        let out: any;
        try {
          out = generateProblems({ subjectSlug: subj, levelCode: lvl.code, skillName: sk.name, problemCount: 30, timeLimitMinutes: 10, sheetNumber: s, totalSheets: 100 });
        } catch { continue; }
        const qs = (out?.problems ?? []).map((p: any) => String(p.question));
        if (qs.length < 2) continue;
        sheets++;
        const distinct = new Set(qs).size;
        if (distinct < qs.length) { n++; worst = Math.min(worst, distinct / qs.length); }
      }
      if (n) bad.push({ where: `${lvl.code} ${sk.name}`, worst, sheets: n });
    }
  }

  bad.sort((a, b) => a.worst - b.worst);
  for (const b of bad) console.log(`  worst ${String(Math.round(b.worst * 100)).padStart(3)}% distinct · ${String(b.sheets).padStart(2)} sheets · ${b.where}`);
  const total = bad.reduce((n, b) => n + b.sheets, 0);
  console.log(`${total === 0 ? "✅" : "❌"} sheet-distinctness: ${total} of ${sheets} non-math sheets repeat a question (${bad.length} skills)`);
  process.exit(total ? 1 : 0);
}
main();
