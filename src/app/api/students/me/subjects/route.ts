// src/app/api/students/me/subjects/route.ts
// GET → the subjects the SIGNED-IN child may access (enabled by their parent),
// each with its placement state and whether the child has an active level.
//
// Enrollment is parent-controlled: this only ever returns subjects the parent
// has enabled. The child can never self-enrol; a disabled subject simply does
// not appear here (and the placement/start guard rejects it server-side too).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleRouteError, withAuth } from "@/lib/api/helpers";
import { enabledSubjectSlugs } from "@/lib/enrollment";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const student = await db.student.findUnique({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      if (!student) return notFound("Student profile");

      const enabled = await enabledSubjectSlugs(student.id);

      // Unreleased subjects (Subject.isPublic = false) are hidden — EXCEPT for a
      // child already enrolled in one. Flipping the owner's release switch must
      // never delete a child's work-in-progress from their own dashboard.
      const subjects = (await db.subject.findMany({ orderBy: { sortOrder: "asc" } }))
        .filter((s) => s.isPublic || enabled.has(s.slug));
      const placements = await db.placementTest.findMany({
        where: { studentId: student.id },
        select: { subjectId: true, status: true, resultLevelCode: true, resultLevelId: true },
        orderBy: { startedAt: "desc" },
      });
      const progress = await db.studentProgress.findMany({
        where: { studentId: student.id },
        select: { status: true, level: { select: { code: true, name: true, subjectId: true } } },
      });

      const latestPlacement = new Map<string, { status: string; resultLevelCode: string | null }>();
      for (const p of placements) {
        if (!latestPlacement.has(p.subjectId)) latestPlacement.set(p.subjectId, { status: p.status, resultLevelCode: p.resultLevelCode });
      }
      const activeBySubject = new Map<string, { code: string; name: string }>();
      for (const pr of progress) {
        if (!pr.level) continue;
        if ((pr.status === "IN_PROGRESS" || pr.status === "REVIEWING") && !activeBySubject.has(pr.level.subjectId)) {
          activeBySubject.set(pr.level.subjectId, { code: pr.level.code, name: pr.level.name });
        }
      }

      const out = subjects
        .filter((s) => enabled.has(s.slug))
        .map((s) => {
          const placement = latestPlacement.get(s.id) ?? null;
          const active = activeBySubject.get(s.id) ?? null;
          return {
            subjectId: s.id,
            slug: s.slug,
            name: s.name,
            iconEmoji: s.iconEmoji,
            colorHex: s.colorHex,
            placed: !!active,
            activeLevelCode: active?.code ?? placement?.resultLevelCode ?? null,
            activeLevelName: active?.name ?? null,
            placementStatus: placement?.status ?? null, // null = never placed → needs placement
          };
        });

      return ok({ subjects: out });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
