// scripts/migrate-m5-bridge.ts
// One-time index migration for the M5 bridge unit insert.
//
// "Break apart to multiply" was inserted at unit index 7, so every M5 unit
// after it shifted +1. StudentProgress.currentSkillIndex points at an INDEX —
// done nothing, every mid-M5 child silently jumps one unit backwards (the
// Radwa class of bug, self-inflicted).
//
// Policy (curriculum-expert intent):
//   idx <= 6 (before the insert)        → unchanged
//   idx == 7 (was "2-digit × 1-digit")  → UNCHANGED on purpose: it now points
//     at the bridge. A child struggling on the algorithm is exactly who the
//     bridge is for (Ridwan). A child who was breezing loses nothing — the
//     bridge clears in a day at 90%.
//   idx >= 8 (already past 2d×1d)       → +2 to keep pointing at the same unit
//     (three units inserted total: multiplying-tens, break-apart, carrying —
//      old 8/9/10 = 2d1d/2d2d/review are now 10/11/12).
//
// Run with --apply to write; default is a dry run.
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const db = new PrismaClient();

(async () => {
  const rows = await db.studentProgress.findMany({
    where: { level: { code: "M5", subject: { slug: "MATH" } } },
    select: {
      id: true, currentSkillIndex: true, status: true,
      student: { select: { user: { select: { name: true, email: true } } } },
    },
  });

  console.log(`M5 progress rows: ${rows.length}${APPLY ? "  (APPLYING)" : "  (dry run — pass --apply to write)"}`);
  for (const r of rows) {
    const idx = r.currentSkillIndex ?? 0;
    const who = `${r.student?.user?.name ?? "?"} <${r.student?.user?.email ?? "?"}>`;
    if (idx >= 8) {
      console.log(`  ${who}  idx ${idx} → ${idx + 2}  (past the inserts, shifted to keep their unit)`);
      if (APPLY) await db.studentProgress.update({ where: { id: r.id }, data: { currentSkillIndex: idx + 2 } });
    } else if (idx === 7) {
      console.log(`  ${who}  idx 7 stays — now points at Multiplying tens, the start of the bridge sequence (intended)`);
    } else {
      console.log(`  ${who}  idx ${idx} — before the insert, unchanged`);
    }
  }
  await db.$disconnect();
})();
