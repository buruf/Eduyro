// scripts/check-lesson-coverage.ts
// Measures the only coverage number that matters: of the unit labels a REAL
// M1–M8 sheet can report as its skillName, how many resolve to a video?
//
//   npx tsx scripts/check-lesson-coverage.ts
//
// Written after "39/39 units have videos" turned out to be the wrong metric.
// M1–M8 holds two families of worksheet — skill-map sheets titled with the
// arithmetic engine's fine-grained unit labels, and the rest titled with the
// coarser curriculum skill names. Only the first family was matching, so about
// half of real practice silently fell through to the old tutorial while every
// unit-level check reported success.
import { PrismaClient } from "@prisma/client";
import { videoForSkillLabel } from "../src/remotion/lesson/units";

const db = new PrismaClient();
const LEVELS = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"];

async function main() {
  const rows = await db.worksheet.findMany({
    where: { skill: { level: { code: { in: LEVELS } } } },
    select: { title: true, skill: { select: { name: true, level: { select: { code: true } } } } },
  });

  // A sheet reports the title prefix before " — Sheet N"; see unitOf() in
  // src/lib/worksheet/today-packet.ts.
  const byLabel = new Map<string, { level: string; sheets: number }>();
  for (const r of rows) {
    const label = r.title.split(" — Sheet")[0].trim() || r.skill.name;
    const cur = byLabel.get(label);
    if (cur) cur.sheets++;
    else byLabel.set(label, { level: r.skill.level.code, sheets: 1 });
  }

  const missing: { label: string; level: string; sheets: number }[] = [];
  let coveredSheets = 0;
  for (const [label, info] of byLabel) {
    if (videoForSkillLabel(label)) coveredSheets += info.sheets;
    else missing.push({ label, ...info });
  }

  const covered = byLabel.size - missing.length;
  const pct = ((coveredSheets / rows.length) * 100).toFixed(0);
  console.log(`M1–M8: ${rows.length} worksheets, ${byLabel.size} distinct unit labels`);
  console.log(`  labels with a video: ${covered}/${byLabel.size}`);
  console.log(`  sheets with a video: ${coveredSheets}/${rows.length}  (${pct}%)`);

  if (missing.length) {
    console.log(`\nStill uncovered:`);
    missing.sort((a, b) => a.level.localeCompare(b.level) || b.sheets - a.sheets);
    for (const m of missing) {
      console.log(`  ${m.level}  ${String(m.sheets).padStart(3)} sheets  ${m.label}`);
    }
  }
}

main().finally(() => db.$disconnect());
