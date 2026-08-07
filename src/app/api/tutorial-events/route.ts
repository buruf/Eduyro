// src/app/api/tutorial-events/route.ts
// Upserts one row per tutorial run; the client fires progressive updates
// (open → beat advances → end) keyed by a client-generated runId.
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, notFound, forbidden, handleRouteError, withAuth, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { canAccessStudent } from "@/lib/api/student-access";

const EventSchema = z.object({
  runId: z.string().min(8).max(64),
  studentId: z.string().min(1),
  skillId: z.string().min(1).max(64),
  variant: z.enum(["old", "pilot"]),
  endedAt: z.string().datetime().optional(),
  beatIndex: z.number().int().min(0).max(10).optional(),
  tapCount: z.number().int().min(0).max(500).optional(),
  skipTapped: z.boolean().optional(),
  skipAtMs: z.number().int().min(0).optional(),
  audioPlayedMs: z.number().int().min(0).optional(),
  predictionAnswer: z.string().max(16).optional(),
  predictionCorrect: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const limited = await withRateLimit(req, 60, 60_000); // beats arrive in bursts
    if (limited) return limited;

    const parsed = await parseRequest(req, EventSchema);
    if ("status" in parsed) return parsed;

    try {
      const { runId, studentId, skillId, variant, endedAt, ...rest } = parsed.data;

      // The student must belong to the signed-in account — same "may this
      // session act for this student" check used by
      // src/app/api/students/[id]/tutorials/route.ts (self / parent / linked
      // teacher / admin).
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

      // Forward-only semantics for beatIndex/tapCount: never let a stale/out-of-
      // order progressive update regress a further-along run. Read current
      // values and drop any incoming field that isn't actually greater.
      const existing = await db.tutorialEvent.findUnique({
        where: { runId },
        select: { beatIndex: true, tapCount: true },
      });
      const updateData: Record<string, unknown> = { ...rest };
      if (existing) {
        if (rest.beatIndex !== undefined && rest.beatIndex <= existing.beatIndex) {
          delete updateData.beatIndex;
        }
        if (rest.tapCount !== undefined && rest.tapCount <= existing.tapCount) {
          delete updateData.tapCount;
        }
      }
      if (endedAt) updateData.endedAt = new Date(endedAt);

      const row = await db.tutorialEvent.upsert({
        where: { runId },
        create: {
          runId,
          studentId,
          skillId,
          variant,
          ...rest,
          endedAt: endedAt ? new Date(endedAt) : undefined,
        },
        update: updateData,
      });
      return ok({ id: row.id });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
