// prisma/content/generate-full-library.ts
// Generates the full BrightSteps worksheet library.
//
// Default sheet counts per level (from CurriculumTables) total ~12,400 worksheets:
//   Math:    5,060 (18 levels × ~240 sheets)
//   Reading: 3,260 (9 levels × ~220 sheets)
//   Writing: 2,400 (8 levels × ~220 sheets)
//   Science: 1,900 (7 levels × ~220 sheets)
//
// Generation is idempotent — re-running fills in any missing sheets but
// doesn't duplicate existing ones (keyed on levelId + skillId + sheetNumber).
//
// Run: npx tsx prisma/content/generate-full-library.ts
// Flags:
//   --target=300     Generate only 300 per level (for dev/sample)
//   --subject=MATH   Only generate one subject
//   --review=true    Auto-create ContentReview entries (default: true)

import { PrismaClient } from "@prisma/client";
import { generateProblems } from "../../src/lib/worksheet/generator";

const db = new PrismaClient();

// Parse CLI args
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  })
);

const TARGET_PER_LEVEL = args.target ? parseInt(args.target, 10) : null; // null = use level default
const SUBJECT_FILTER = args.subject ?? null;
const AUTO_REVIEW = args.review !== "false";

async function main() {
  console.log("🏗  Starting full library generation…\n");
  if (TARGET_PER_LEVEL) console.log(`   Target per level: ${TARGET_PER_LEVEL}`);
  if (SUBJECT_FILTER) console.log(`   Subject filter: ${SUBJECT_FILTER}`);
  console.log(`   Auto-review entries: ${AUTO_REVIEW}\n`);

  const levels = await db.level.findMany({
    where: SUBJECT_FILTER ? { subject: { slug: SUBJECT_FILTER as any } } : {},
    include: { subject: true, skills: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ subject: { name: "asc" } }, { sortOrder: "asc" }],
  });

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalReviewsCreated = 0;

  for (const level of levels) {
    const totalForLevel = level.skills.reduce((sum, s) => sum + (s.totalSheets ?? 40), 0);
    const target = TARGET_PER_LEVEL ?? totalForLevel;
    const sheetsPerSkill = Math.max(1, Math.floor(target / Math.max(level.skills.length, 1)));

    console.log(`📚 ${level.subject.name} · ${level.code} — ${level.name}`);
    console.log(`   Target: ${target} sheets across ${level.skills.length} skills`);

    let levelCreated = 0;
    let levelSkipped = 0;

    for (const skill of level.skills) {
      for (let sheetNum = 1; sheetNum <= sheetsPerSkill; sheetNum++) {
        // Check if already exists
        const existing = await db.worksheet.findFirst({
          where: { levelId: level.id, skillId: skill.id, sheetNumber: sheetNum },
          select: { id: true },
        });

        if (existing) {
          levelSkipped++;
          continue;
        }

        try {
          const { problems, answerKey } = generateProblems({
            subjectSlug: level.subject.slug,
            levelCode: level.code,
            skillName: skill.name,
            problemCount: level.problemsPerSheet ?? 20,
            timeLimitMinutes: level.timeLimitMinutes ?? 10,
            sheetNumber: sheetNum,
          });

          const title = `${skill.name} — Sheet ${sheetNum}`;

          const worksheet = await db.worksheet.create({
            data: {
              levelId: level.id,
              skillId: skill.id,
              type: "DAILY_PRACTICE",
              sheetNumber: sheetNum,
              title,
              problems: problems as any,
              answerKey: answerKey as any,
              problemCount: problems.length,
              estimatedMinutes: level.timeLimitMinutes ?? 10,
              difficultyScore: 1.0,
              isActive: false, // off until reviewed
            },
          });

          if (AUTO_REVIEW) {
            await db.contentReview.create({
              data: {
                worksheetId: worksheet.id,
                status: "PENDING_REVIEW",
              },
            });
            totalReviewsCreated++;
          }

          levelCreated++;
        } catch (err: any) {
          console.error(`   ⚠ ${skill.name} sheet ${sheetNum}: ${err.message}`);
        }
      }
    }

    console.log(`   ✓ Created ${levelCreated} sheets, skipped ${levelSkipped} existing\n`);
    totalCreated += levelCreated;
    totalSkipped += levelSkipped;
  }

  console.log("\n✅ Library generation complete:");
  console.log(`   Worksheets created:       ${totalCreated}`);
  console.log(`   Existing skipped:         ${totalSkipped}`);
  console.log(`   ContentReview entries:    ${totalReviewsCreated}`);
  console.log(`\n📋 Review at /admin/content-review`);
  console.log(`   Note: new worksheets are isActive=false until approved.\n`);
}

main()
  .catch((e) => {
    console.error("Generation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
