// prisma/content/backfill-reviews.ts
// One-time script: create a ContentReview record for every existing worksheet
// that doesn't have one yet. Idempotent — safe to re-run.
//
// Run: npx tsx prisma/content/backfill-reviews.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🔍 Finding worksheets without ContentReview entries…\n");

  const worksheets = await db.worksheet.findMany({
    where: { contentReview: null },
    select: { id: true, title: true },
  });

  console.log(`Found ${worksheets.length} worksheets needing review records.`);
  if (worksheets.length === 0) {
    console.log("✅ Nothing to do — everything already has a review entry.");
    return;
  }

  let created = 0;
  // Batch insert in chunks of 100
  for (let i = 0; i < worksheets.length; i += 100) {
    const batch = worksheets.slice(i, i + 100);
    await db.contentReview.createMany({
      data: batch.map((w) => ({
        worksheetId: w.id,
        status: "PENDING_REVIEW" as const,
      })),
      skipDuplicates: true,
    });
    created += batch.length;
    process.stdout.write(`  Created ${created}/${worksheets.length}\r`);
  }

  console.log(`\n\n✅ Created ${created} ContentReview entries.`);
  console.log(`📋 Curriculum specialist can now view at: /admin/content-review`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
