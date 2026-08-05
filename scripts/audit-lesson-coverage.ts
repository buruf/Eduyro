// scripts/audit-lesson-coverage.ts
// Empirical answer to "does the new tutorial structure apply to EVERY
// level/skill?" — enumerates every math micro-skill (engine unit labels, the
// exact strings the modal keys on) plus every non-math skill in the prod DB,
// and reports which get a full family lesson (rule/mistakes/why) vs the
// generic fallback, and which have a predict interaction.
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills } from "../src/lib/worksheet/generator";
import { getLessonExtras, GENERIC, friendlyGoal } from "../src/lib/tutorials/lesson-extras";

const db = new PrismaClient();

async function main() {
  const rows: { level: string; subject: string; skill: string; family: boolean; predict: boolean }[] = [];

  // Math: the modal receives the ENGINE UNIT label (micro-skill), so audit those.
  const mathLevels = await db.level.findMany({
    where: { isActive: true, subject: { slug: "MATH" } },
    orderBy: { sortOrder: "asc" },
    select: { code: true },
  });
  for (const l of mathLevels) {
    for (const u of getMathLevelSkills(l.code)) {
      const e = getLessonExtras(u.label);
      rows.push({ level: l.code, subject: "MATH", skill: u.label, family: e !== GENERIC, predict: !!e.predict });
    }
  }

  // Non-math: modal keys on the Skill name.
  const nonMath = await db.skill.findMany({
    where: { level: { isActive: true, subject: { slug: { not: "MATH" } } } },
    select: { name: true, level: { select: { code: true, subject: { select: { slug: true } } } } },
    orderBy: [{ level: { code: "asc" } }, { sortOrder: "asc" }],
  });
  for (const s of nonMath) {
    const e = getLessonExtras(s.name);
    rows.push({ level: s.level.code, subject: s.level.subject.slug, skill: s.name, family: e !== GENERIC, predict: !!e.predict });
  }

  const bySubject = new Map<string, { total: number; family: number; predict: number }>();
  for (const r of rows) {
    const c = bySubject.get(r.subject) ?? { total: 0, family: 0, predict: 0 };
    c.total++; if (r.family) c.family++; if (r.predict) c.predict++;
    bySubject.set(r.subject, c);
  }
  console.log("=== Coverage by subject (family lesson = topic-specific why/rule/mistakes; else generic fallback) ===");
  for (const [s, c] of bySubject) console.log(`${s.padEnd(8)} skills:${String(c.total).padStart(4)}  family:${String(c.family).padStart(4)} (${Math.round((c.family / c.total) * 100)}%)  predict:${String(c.predict).padStart(4)}`);

  console.log("\n=== Skills falling back to GENERIC (no family match) ===");
  const misses = rows.filter((r) => !r.family);
  for (const m of misses) console.log(`  ${m.level.padEnd(4)} ${m.skill}`);
  if (!misses.length) console.log("  (none — every math micro-skill matched a family)");

  // Sanity: friendlyGoal never throws on odd labels.
  let goalErrors = 0;
  for (const r of rows) { try { friendlyGoal(r.skill, r.skill); } catch { goalErrors++; } }
  console.log(`\nfriendlyGoal errors: ${goalErrors}`);
  console.log(`TOTAL skills audited: ${rows.length}`);
}

main().finally(() => db.$disconnect());
