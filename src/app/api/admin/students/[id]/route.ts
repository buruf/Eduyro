// src/app/api/admin/students/[id]/route.ts
// GET  — the student's per-subject progress + the full level list (for the
//        admin "assign to level" picker).
// POST — privileged action: reset-practice | assign-level. Audited. ADMIN only.
// `id` is the Student.id.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { getMathLevelSkills } from "@/lib/worksheet/generator";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const student = await db.student.findUnique({
        where: { id: params.id },
        select: {
          id: true, grade: true, user: { select: { name: true, email: true } },
          progress: {
            where: { status: { in: ["IN_PROGRESS", "REVIEWING"] } },
            select: { status: true, sheetsCompleted: true, lastAccuracyPct: true, dailySheetsOverride: true, currentSkillIndex: true, level: { select: { code: true, name: true, sheetsPerDay: true, subject: { select: { slug: true, name: true } } } } },
          },
        },
      });
      if (!student) return notFound("Student");
      const levels = await db.level.findMany({
        where: { isActive: true },
        orderBy: [{ subject: { name: "asc" } }, { sortOrder: "asc" }],
        select: { code: true, name: true, subject: { select: { slug: true, name: true } } },
      });
      // Skill map per active MATH level so the admin can unlock a specific
      // skill/lesson (currentSkillIndex jumps). Non-math levels advance by
      // per-skill mastery, not an index, so no map is sent for those.
      const skillMaps: Record<string, { index: number; label: string }[]> = {};
      for (const p of student.progress) {
        if (p.level.subject.slug === "MATH") {
          const units = getMathLevelSkills(p.level.code);
          if (units.length) skillMaps[p.level.code] = units.map((u) => ({ index: u.index, label: u.label }));
        }
      }
      return ok({ student, levels, skillMaps });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const ActionSchema = z.object({
  action: z.enum(["reset-practice", "assign-level", "set-daily-sheets", "set-skill", "reset-placement", "change-grade"]),
  grade: z.string().max(20).optional(), // change-grade
  levelCode: z.string().max(8).optional(), // omit on reset-practice / set-daily-sheets = ALL levels
  dailySheets: z.number().int().min(0).max(30).optional(), // set-daily-sheets: 0 = clear (use level default)
  skillIndex: z.number().int().min(0).max(50).optional(),  // set-skill: unlock/jump to this skill in the level's map
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, ActionSchema);
    if ("status" in parsed) return parsed;
    const { action, levelCode, dailySheets, skillIndex, grade } = parsed.data;
    try {
      const student = await db.student.findUnique({ where: { id: params.id }, select: { id: true, user: { select: { email: true } } } });
      if (!student) return notFound("Student");

      // ── Assign the student to a level (place them there and start fresh) ──
      if (action === "assign-level") {
        if (!levelCode) return err("levelCode is required to assign a level", 400);
        const level = await db.level.findFirst({ where: { code: levelCode }, select: { id: true, subjectId: true, code: true } });
        if (!level) return notFound("Level");
        // Only one active level per subject — demote any other IN_PROGRESS in the
        // same subject so the dashboard's "first IN_PROGRESS" picks the new one.
        const subjectLevels = await db.level.findMany({ where: { subjectId: level.subjectId }, select: { id: true } });
        await db.$transaction([
          db.studentProgress.updateMany({
            where: { studentId: student.id, levelId: { in: subjectLevels.map((l) => l.id) }, status: "IN_PROGRESS" },
            data: { status: "NOT_STARTED" },
          }),
          db.studentProgress.upsert({
            where: { studentId_levelId: { studentId: student.id, levelId: level.id } },
            update: { status: "IN_PROGRESS", startedAt: new Date(), sheetsCompleted: 0, correctAnswers: 0, totalAnswers: 0, currentSkillIndex: 0, consecutivePassDays: 0, lastAccuracyPct: 0, masteredAt: null },
            create: { studentId: student.id, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date() },
          }),
        ]);
        await logAdmin(ctx, "student.assign_level", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email, levelCode } });
        return ok({ assigned: levelCode });
      }

      // ── Reset the student's practice (fresh questions) — per level or ALL ──
      // Deletes only the STUDENT's own completed sheets + daily packets and
      // resets their progress counters. Worksheets are shared per skill, so we
      // never delete those — the student simply re-does fresh sheets.
      if (action === "reset-practice") {
        const level = levelCode ? await db.level.findFirst({ where: { code: levelCode }, select: { id: true } }) : null;
        if (levelCode && !level) return notFound("Level");
        const levelScope = level ? { levelId: level.id } : {};
        await db.$transaction([
          db.completedSheet.deleteMany({ where: { studentId: student.id, ...(level ? { worksheet: { levelId: level.id } } : {}) } }),
          db.dailyPacket.deleteMany({ where: { studentId: student.id, ...levelScope } }),
          // Reset the COUNTERS on every level in scope, but never resurrect a
          // finished level to IN_PROGRESS. Resetting ALL used to mark every row
          // IN_PROGRESS, which left a child with two active levels in one
          // subject — and the dashboard then served the OLD one, so "today's
          // lesson" was a lesson they had already completed (field report:
          // Radwa had M7 and M8 both IN_PROGRESS and was served M7).
          db.studentProgress.updateMany({
            where: { studentId: student.id, ...levelScope },
            data: { sheetsCompleted: 0, correctAnswers: 0, totalAnswers: 0, currentSkillIndex: 0, consecutivePassDays: 0, lastAccuracyPct: 0 },
          }),
          // Only a level explicitly named by the admin becomes active again.
          ...(level
            ? [db.studentProgress.updateMany({
                where: { studentId: student.id, levelId: level.id },
                data: { status: "IN_PROGRESS", masteredAt: null },
              })]
            : []),
        ]);
        await logAdmin(ctx, "student.reset_practice", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email, levelCode: levelCode ?? "ALL" } });
        return ok({ reset: true, scope: levelCode ?? "ALL" });
      }

      // ── Unlock / jump to a specific SKILL in a math level's skill map ──
      // Sets currentSkillIndex so the student's daily packet serves that lesson
      // immediately — no waiting a day per lesson. Requires a levelCode (the
      // index is meaningless without knowing which level's map it points into).
      if (action === "set-skill") {
        if (!levelCode) return err("levelCode is required to unlock a skill", 400);
        if (skillIndex === undefined) return err("skillIndex is required", 400);
        const level = await db.level.findFirst({ where: { code: levelCode }, select: { id: true, code: true } });
        if (!level) return notFound("Level");
        const units = getMathLevelSkills(level.code);
        if (!units.length) return err(`${level.code} has no skill map (only MATH levels support skill unlock)`, 400);
        if (skillIndex >= units.length) return err(`skillIndex out of range — ${level.code} has ${units.length} skills`, 400);
        const updated = await db.studentProgress.updateMany({
          where: { studentId: student.id, levelId: level.id },
          // skillUnlockedAt restarts the daily quota window so the unlocked
          // lesson is served IMMEDIATELY (even if today's packet was already
          // finished) and pre-unlock sheets can't count toward clearing it.
          data: { currentSkillIndex: skillIndex, skillUnlockedAt: new Date() },
        });
        if (updated.count === 0) return err(`Student has no progress on ${level.code} — assign the level first`, 400);
        await logAdmin(ctx, "student.set_skill", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email, levelCode, skillIndex, skillLabel: units[skillIndex]?.label } });
        return ok({ levelCode, skillIndex, skillLabel: units[skillIndex]?.label });
      }

      // ── Set the per-student daily practice-sheet limit (override) ──
      // Lets a student who knows the content do MORE sheets in one day without
      // waiting for the next. 0 clears the override → back to the level default.
      if (action === "set-daily-sheets") {
        const level = levelCode ? await db.level.findFirst({ where: { code: levelCode }, select: { id: true } }) : null;
        if (levelCode && !level) return notFound("Level");
        const val = dailySheets && dailySheets > 0 ? dailySheets : null;
        await db.studentProgress.updateMany({
          where: { studentId: student.id, ...(level ? { levelId: level.id } : {}) },
          data: { dailySheetsOverride: val },
        });
        await logAdmin(ctx, "student.set_daily_sheets", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email, levelCode: levelCode ?? "ALL", dailySheets: val ?? "default" } });
        return ok({ dailySheets: val, scope: levelCode ?? "ALL" });
      }

      // ── Reset the placement test so the child can retake it ──
      // Marks any in-flight tests ABANDONED and deletes completed results; the
      // student's next visit to /placement starts fresh. Existing practice
      // progress is untouched (use reset-practice for that).
      if (action === "reset-placement") {
        await db.placementTest.deleteMany({ where: { studentId: student.id } });
        await logAdmin(ctx, "student.reset_placement", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email } });
        return ok({ placementReset: true });
      }

      // ── Change the student's grade label ──
      if (action === "change-grade") {
        if (!grade) return err("grade is required", 400);
        await db.student.update({ where: { id: student.id }, data: { grade } });
        await logAdmin(ctx, "student.change_grade", { entityType: "Student", entityId: student.id, metadata: { email: student.user.email, grade } });
        return ok({ grade });
      }

      return err("Unknown action", 400);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
