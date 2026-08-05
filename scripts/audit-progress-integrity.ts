// scripts/audit-progress-integrity.ts
//
// DATA-INTEGRITY GATE for student progression. Run against the live DB.
//
// Born from two field reports: Ridwan and then Radwa were both shown a "next
// lesson" they had already completed and submitted. Root cause for Radwa: she
// had TWO IN_PROGRESS levels in one subject (M7 and M8), and the dashboard
// served the older one. That is a data state no child should ever be in, and
// nothing was watching for it — a parent had to notice.
//
// Usage:  npx tsx scripts/audit-progress-integrity.ts        (report)
//         npx tsx scripts/audit-progress-integrity.ts --fix  (repair)
import { PrismaClient } from "@prisma/client";

const FIX = process.argv.includes("--fix");
const db = new PrismaClient();

type Issue = { check: string; who: string; detail: string; repair?: () => Promise<void> };

(async () => {
  const issues: Issue[] = [];

  const rows = await db.studentProgress.findMany({
    select: {
      id: true, studentId: true, status: true, currentSkillIndex: true, masteredAt: true,
      student: { select: { user: { select: { name: true, email: true } } } },
      level: { select: { id: true, code: true, sortOrder: true, subject: { select: { slug: true } } } },
    },
  });

  // 1. At most ONE in-progress level per (student, subject).
  const active = new Map<string, typeof rows>();
  for (const r of rows) {
    if (r.status !== "IN_PROGRESS") continue;
    const k = `${r.studentId}::${r.level.subject.slug}`;
    active.set(k, [...(active.get(k) ?? []), r] as typeof rows);
  }
  for (const [, group] of active) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => (b.level.sortOrder ?? 0) - (a.level.sortOrder ?? 0));
    const keep = sorted[0], stale = sorted.slice(1);
    issues.push({
      check: "multiple-active-levels",
      who: `${group[0].student?.user?.name ?? group[0].studentId} (${group[0].level.subject.slug})`,
      detail: `${group.map((g) => g.level.code).join(" + ")} — keep ${keep.level.code}, retire ${stale.map((s) => s.level.code).join(", ")}`,
      repair: async () => {
        // The child's real position is the furthest level. Earlier levels they
        // were already past are marked MASTERED, not deleted — their completed
        // sheets and history stay intact.
        await db.studentProgress.updateMany({
          where: { id: { in: stale.map((s) => s.id) } },
          data: { status: "MASTERED", masteredAt: new Date() },
        });
      },
    });
  }

  // 2. A MASTERED level should carry a masteredAt date (used by parent reports).
  for (const r of rows) {
    if (r.status === "MASTERED" && !r.masteredAt) {
      issues.push({
        check: "mastered-without-date",
        who: `${r.student?.user?.name ?? r.studentId}`,
        detail: `${r.level.subject.slug} ${r.level.code}`,
        repair: async () => { await db.studentProgress.update({ where: { id: r.id }, data: { masteredAt: new Date() } }); },
      });
    }
  }

  // 3. currentSkillIndex must never be negative.
  for (const r of rows) {
    if ((r.currentSkillIndex ?? 0) < 0) {
      issues.push({
        check: "negative-skill-index",
        who: `${r.student?.user?.name ?? r.studentId}`,
        detail: `${r.level.code} idx=${r.currentSkillIndex}`,
        repair: async () => { await db.studentProgress.update({ where: { id: r.id }, data: { currentSkillIndex: 0 } }); },
      });
    }
  }

  const byCheck = new Map<string, Issue[]>();
  for (const i of issues) byCheck.set(i.check, [...(byCheck.get(i.check) ?? []), i]);
  for (const [check, list] of byCheck) {
    console.log(`\n✗ ${check} — ${list.length}`);
    for (const i of list) console.log(`    ${i.who}: ${i.detail}`);
  }

  if (FIX && issues.length) {
    for (const i of issues) if (i.repair) await i.repair();
    console.log(`\n🔧 repaired ${issues.filter((i) => i.repair).length} issue(s)`);
  }

  console.log(`\nprogress rows checked: ${rows.length}`);
  console.log(`${issues.length === 0 ? "✅" : FIX ? "🔧" : "❌"} integrity issues: ${issues.length}`);
  await db.$disconnect();
  process.exit(issues.length && !FIX ? 1 : 0);
})();
