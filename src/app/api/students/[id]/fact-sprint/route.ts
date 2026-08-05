// src/app/api/students/[id]/fact-sprint/route.ts
// GET → the fact POOL for this student's daily sprint (single-fact drill on
// their current arithmetic-fact level). Not graded; the client runs the timed
// drill and handles adaptive re-queueing. Returns { op, levelCode, facts } or
// { available: false } when the student isn't on a fact level.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { getMathLevelSkills } from "@/lib/worksheet/generator";
import { buildFactPool, isFactLevel, FACT_LEVEL_OP, SPRINT_SECONDS } from "@/lib/mastery/fact-sprint";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const student = await db.student.findUnique({ where: { id: params.id } });
      if (!student) return notFound("Student");
      if (student.userId !== ctx.userId && ctx.role !== "ADMIN" && ctx.role !== "SUPER_ADMIN") {
        const linked = ctx.role === "TEACHER" && (await db.teacherStudent.findFirst({ where: { studentId: student.id, teacher: { userId: ctx.userId } }, select: { id: true } })) !== null;
        const isParent = ctx.role === "PARENT" && (await db.parentStudent.findFirst({ where: { studentId: student.id, parent: { userId: ctx.userId } }, select: { id: true } })) !== null;
        if (!linked && !isParent) return forbidden();
      }

      // The student's active MATH fact level, if any.
      const progress = await db.studentProgress.findFirst({
        where: { studentId: student.id, status: { in: ["IN_PROGRESS", "REVIEWING"] }, level: { subject: { slug: "MATH" } } },
        include: { level: { include: { subject: true } } },
        orderBy: { level: { sortOrder: "asc" } },
      });
      const code = progress?.level.code ?? "";
      if (!progress || !isFactLevel(code)) return ok({ available: false });

      const skills = getMathLevelSkills(code);
      const reach = skills.length ? Math.min(1, ((progress.currentSkillIndex ?? 0) + 1) / skills.length) : 1;
      const facts = buildFactPool(code, reach);

      return ok({
        available: true,
        levelCode: code,
        op: FACT_LEVEL_OP[code],
        seconds: SPRINT_SECONDS,
        facts,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
