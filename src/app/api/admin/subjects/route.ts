// src/app/api/admin/subjects/route.ts
// SUBJECT RELEASE SWITCH — the owner controls which subjects are offered to
// parents. Maths is polished; Reading/Writing/Science are being rebuilt, so
// they can be held back and released one at a time as each is ready.
//
// Turning a subject OFF hides it from parents (offering, placement, add-child)
// but never removes it from a child already enrolled — see the students'
// subjects route. Releasing is reversible and takes effect immediately.
// ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const subjects = await db.subject.findMany({ orderBy: { sortOrder: "asc" } });
      // Show the owner what turning a subject off would actually affect.
      const counts = await db.studentSubject.groupBy({
        by: ["subjectId"],
        _count: { _all: true },
      });
      const enrolled = new Map(counts.map((c) => [c.subjectId, c._count._all]));

      return ok({
        subjects: subjects.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          iconEmoji: s.iconEmoji,
          isPublic: s.isPublic,
          enrolledStudents: enrolled.get(s.id) ?? 0,
        })),
      });
    } catch (e) { return handleRouteError(e); }
  });
}

export async function PATCH(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (session) => {
    try {
      const body = await req.json().catch(() => null);
      const id = String(body?.id ?? "");
      const isPublic = body?.isPublic;
      if (!id || typeof isPublic !== "boolean") return err("id and isPublic are required", 400);

      const subject = await db.subject.findUnique({ where: { id } });
      if (!subject) return err("Subject not found", 404);

      // At least one subject must stay public, or new parents see an empty
      // product and the signup flow dead-ends.
      if (!isPublic) {
        const otherPublic = await db.subject.count({ where: { isPublic: true, NOT: { id } } });
        if (otherPublic === 0) {
          return err("At least one subject must stay available to parents", 400);
        }
      }

      const updated = await db.subject.update({ where: { id }, data: { isPublic } });
      await db.auditLog.create({
        data: {
          userId: (session as any)?.user?.id ?? null,
          action: isPublic ? "subject.released" : "subject.hidden",
          entityType: "subject",
          entityId: subject.id,
          metadata: { subject: subject.name, slug: subject.slug, isPublic } as any,
        },
      }).catch(() => { /* audit must never block the switch */ });

      return ok({ id: updated.id, isPublic: updated.isPublic });
    } catch (e) { return handleRouteError(e); }
  });
}
