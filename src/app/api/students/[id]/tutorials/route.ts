// src/app/api/students/[id]/tutorials/route.ts
// Per-student tutorial completion tracking.
//   GET  → list of completed concept ids (drives "auto-open on first visit")
//   POST → mark a concept tutorial completed ({ conceptId })
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { canAccessStudent } from "@/lib/api/student-access";

const MarkCompleteSchema = z.object({
  conceptId: z.string().min(1).max(64),
});

/** Returns an error response if the caller may not act for this student, else null. */
async function guard(studentId: string, ctx: { userId: string; role: string }) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { parentLinks: { include: { parent: true } } },
  });
  if (!student) return notFound("Student");
  const isSelf = student.userId === ctx.userId;
  const isParent = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
  if (!isSelf && !isParent) {
    const allowed = await canAccessStudent(ctx, student, { checkParent: false });
    if (!allowed) return forbidden();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      const denied = await guard(params.id, ctx);
      if (denied) return denied;

      const rows = await db.tutorialCompletion.findMany({
        where: { studentId: params.id },
        select: { conceptId: true, completedAt: true },
      });
      return ok({ completed: rows.map((r) => r.conceptId) });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, MarkCompleteSchema);
    if ("status" in parsed) return parsed;

    try {
      const denied = await guard(params.id, ctx);
      if (denied) return denied;

      await db.tutorialCompletion.upsert({
        where: {
          studentId_conceptId: {
            studentId: params.id,
            conceptId: parsed.data.conceptId,
          },
        },
        create: { studentId: params.id, conceptId: parsed.data.conceptId },
        update: {}, // already completed — idempotent
      });
      return ok({ completed: true });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
