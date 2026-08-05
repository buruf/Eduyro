// scripts/migrate-reading-r60.ts — replace the R1–R9 reading ladder with the
// user's R1–R60 / Grade 1–10 curriculum (src/lib/reading/curriculum.ts).
// Reading is unused in production (verified before running), so this is a
// clean rebuild: delete reading worksheets/packets/progress/placements, delete
// the old levels+skills, create the 60 new levels with their 238 unit-skills.
//
//   npx tsx scripts/migrate-reading-r60.ts           (dry run — reports only)
//   npx tsx scripts/migrate-reading-r60.ts --apply   (writes to the database)
import { PrismaClient } from "@prisma/client";
import { READING_CURRICULUM, validateReadingCurriculum } from "../src/lib/reading/curriculum";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const issues = validateReadingCurriculum();
  if (issues.length) { console.log("curriculum invalid:", issues); process.exit(1); }

  const subject = await db.subject.findFirst({ where: { slug: "READING" }, select: { id: true } });
  if (!subject) { console.log("READING subject missing"); process.exit(1); }

  const oldLevels = await db.level.findMany({ where: { subjectId: subject.id }, select: { id: true, code: true, name: true } });
  const oldIds = oldLevels.map((l) => l.id);

  // Usage census — abort if reading has REAL usage (this migration resets it).
  const [progress, completed, packets, placements, worksheets] = await Promise.all([
    db.studentProgress.count({ where: { levelId: { in: oldIds } } }),
    db.completedSheet.count({ where: { worksheet: { levelId: { in: oldIds } } } }),
    db.dailyPacket.count({ where: { levelId: { in: oldIds } } }),
    db.placementTest.count({ where: { resultLevelId: { in: oldIds } } }),
    db.worksheet.count({ where: { levelId: { in: oldIds } } }),
  ]);
  console.log(`old levels: ${oldLevels.length} (${oldLevels.map((l) => l.code).join(",")})`);
  console.log(`usage: progress=${progress} completedSheets=${completed} packets=${packets} placements=${placements} worksheets=${worksheets}`);
  console.log(`target: 60 levels / ${READING_CURRICULUM.reduce((a, m) => a + m.units.length, 0)} skills`);

  if (completed > 20) {
    console.log("⚠ completedSheets > 20 — reading looks USED. Refusing to proceed without manual review.");
    process.exit(1);
  }
  if (!APPLY) { console.log("\nDRY RUN — nothing written. Re-run with --apply."); return; }

  await db.$transaction(async (tx) => {
    // Children first (FK order), scoped to reading levels only.
    await tx.completedSheet.deleteMany({ where: { worksheet: { levelId: { in: oldIds } } } });
    await tx.dailyPacket.deleteMany({ where: { levelId: { in: oldIds } } });
    await tx.worksheet.deleteMany({ where: { levelId: { in: oldIds } } });
    // Placement rows keep their history but must not point at deleted levels.
    await tx.placementTest.updateMany({ where: { resultLevelId: { in: oldIds } }, data: { resultLevelId: null } });
    await tx.studentProgress.deleteMany({ where: { levelId: { in: oldIds } } });
    await tx.levelPrerequisite.deleteMany({ where: { OR: [{ levelId: { in: oldIds } }, { prerequisiteId: { in: oldIds } }] } });
    await tx.skill.deleteMany({ where: { levelId: { in: oldIds } } });
    await tx.level.deleteMany({ where: { id: { in: oldIds } } });

    for (let i = 0; i < READING_CURRICULUM.length; i++) {
      const m = READING_CURRICULUM[i];
      await tx.level.create({
        data: {
          subjectId: subject.id,
          code: m.code,
          name: m.topic,
          description: `${m.topic} — Grade ${m.grade}`,
          gradeMin: String(m.grade),
          gradeMax: String(m.grade),
          sortOrder: i + 1,
          isActive: true,
          skills: {
            create: m.units.map((u, j) => ({ name: u, sortOrder: j + 1, totalSheets: 30 })),
          },
        },
      });
    }
  }, { timeout: 120_000 });

  const check = await db.level.count({ where: { subjectId: subject.id, isActive: true } });
  const skills = await db.skill.count({ where: { level: { subjectId: subject.id } } });
  console.log(`APPLIED ✓  levels=${check} skills=${skills}`);
}

main().finally(() => db.$disconnect());
