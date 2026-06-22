// src/app/api/parents/me/children/[studentId]/subjects/route.ts
// Parent-only subject enrollment control for one child.
//   GET   → list all subjects with the child's enabled status + placement state
//   PATCH → enable/disable one subject for the child
//
// The PARENT is the paying account holder and the ONLY actor who can change a
// child's subject access. The child can never self-enrol. A subject only appears
// on the child's dashboard when it is enrolled AND enabled here.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, forbidden, notFound, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { ensureDefaultEnrollments } from "@/lib/enrollment";
import { z } from "zod";

// Verify the authenticated user is a parent linked to this child.
async function assertParentOwns(userId: string, studentId: string): Promise<boolean> {
  const link = await db.parentStudent.findFirst({
    where: { studentId, parent: { userId } },
    select: { id: true },
  });
  return !!link;
}

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const owns = await assertParentOwns(ctx.userId, params.studentId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      if (!owns && !isAdmin) return forbidden();

      // Backfill default rows (all enabled) so the toggle UI is stable and every
      // subject has a concrete row to flip.
      await ensureDefaultEnrollments(params.studentId);

      const subjects = await db.subject.findMany({ orderBy: { sortOrder: "asc" } });
      // Degrade to all-enabled if the table isn't migrated yet (deploy before
      // db push) rather than 500-ing the parent dashboard.
      const enrollments = await db.studentSubject
        .findMany({ where: { studentId: params.studentId }, select: { subjectId: true, enabled: true } })
        .catch((e) => { if ((e as any)?.code === "P2021") return []; throw e; });
      const placements = await db.placementTest.findMany({
        where: { studentId: params.studentId },
        select: { subjectId: true, status: true, resultLevelCode: true },
        orderBy: { startedAt: "desc" },
      });
      const enabledBy = new Map(enrollments.map((e) => [e.subjectId, e.enabled]));
      const placementBy = new Map<string, { status: string; resultLevelCode: string | null }>();
      for (const p of placements) {
        if (!placementBy.has(p.subjectId)) placementBy.set(p.subjectId, { status: p.status, resultLevelCode: p.resultLevelCode });
      }

      return ok({
        studentId: params.studentId,
        subjects: subjects.map((s) => {
          const placement = placementBy.get(s.id) ?? null;
          return {
            subjectId: s.id,
            slug: s.slug,
            name: s.name,
            iconEmoji: s.iconEmoji,
            colorHex: s.colorHex,
            enabled: enabledBy.get(s.id) ?? true,
            placementStatus: placement?.status ?? null,            // null = not started
            placedLevelCode: placement?.resultLevelCode ?? null,
          };
        }),
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const PatchSchema = z.object({
  subjectId: z.string().min(1).optional(),
  slug: z.enum(["MATH", "READING", "WRITING", "SCIENCE"]).optional(),
  enabled: z.boolean(),
}).refine((d) => d.subjectId || d.slug, { message: "subjectId or slug is required" });

export async function PATCH(req: NextRequest, { params }: { params: { studentId: string } }) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, PatchSchema);
    if ("status" in parsed) return parsed;
    const { subjectId, slug, enabled } = parsed.data;

    try {
      const owns = await assertParentOwns(ctx.userId, params.studentId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      if (!owns && !isAdmin) return forbidden();

      const subject = subjectId
        ? await db.subject.findUnique({ where: { id: subjectId }, select: { id: true, slug: true, name: true } })
        : await db.subject.findUnique({ where: { slug: slug! }, select: { id: true, slug: true, name: true } });
      if (!subject) return notFound("Subject");

      let row;
      try {
        row = await db.studentSubject.upsert({
          where: { studentId_subjectId: { studentId: params.studentId, subjectId: subject.id } },
          update: { enabled },
          create: { studentId: params.studentId, subjectId: subject.id, enabled },
        });
      } catch (e) {
        // Table not migrated yet (deploy ran before `prisma db push`). Give a
        // clear, actionable message instead of a generic 500.
        if ((e as any)?.code === "P2021") {
          return err("Subject controls aren't live yet — the database update is still pending. Try again shortly.", 503);
        }
        throw e;
      }

      return ok({ subjectId: subject.id, slug: subject.slug, name: subject.name, enabled: row.enabled });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
