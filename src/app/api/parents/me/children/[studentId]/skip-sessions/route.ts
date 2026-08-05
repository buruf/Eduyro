// src/app/api/parents/me/children/[studentId]/skip-sessions/route.ts
// PARENT-ONLY "skip sessions" (e.g. a vacation). The parent excuses a date range
// for a child: each day becomes EXCUSED (no missed-day / streak penalty) AND the
// curriculum advances (those sheets are consumed, not repeated). The child can
// NEVER skip their own sessions — this lives under /parents/me and requires a
// parent↔child link.
//   GET  → upcoming skipped days for this child (to show/manage).
//   POST { startDate, endDate } (yyyy-MM-dd) → excuse the inclusive range.
//   DELETE ?date=yyyy-MM-dd → un-skip a single excused day (only if still skipped).
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, forbidden, notFound, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { eachDayOfInterval, startOfDay } from "date-fns";
import { z } from "zod";

const MAX_RANGE_DAYS = 60;

async function assertParentOwns(userId: string, studentId: string): Promise<boolean> {
  const link = await db.parentStudent.findFirst({ where: { studentId, parent: { userId } }, select: { id: true } });
  return !!link;
}

function dateUTC(d: Date): Date {
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const owns = await assertParentOwns(ctx.userId, params.studentId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      if (!owns && !isAdmin) return forbidden();
      const skipped = await db.dailyPacket.findMany({
        where: { studentId: params.studentId, skipped: true, date: { gte: appDayStart(new Date(), (await db.student.findUnique({ where: { id: params.studentId }, select: { timezone: true } }))?.timezone) } },
        select: { id: true, date: true, levelCode: true },
        orderBy: { date: "asc" },
      });
      return ok({ skipped });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest, { params }: { params: { studentId: string } }) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    try {
      const owns = await assertParentOwns(ctx.userId, params.studentId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      if (!owns && !isAdmin) return forbidden();

      const start = dateUTC(new Date(`${parsed.data.startDate}T00:00:00.000Z`));
      const end = dateUTC(new Date(`${parsed.data.endDate}T00:00:00.000Z`));
      if (end < start) return err("End date must be on or after start date", 400);
      const todayUTC = dateUTC(new Date());
      const effectiveStart = start < todayUTC ? todayUTC : start; // can't skip the past
      const allDays = eachDayOfInterval({ start: effectiveStart, end });
      if (allDays.length === 0) return err("Nothing to skip in that range", 400);
      if (allDays.length > MAX_RANGE_DAYS) return err(`Please skip at most ${MAX_RANGE_DAYS} days at a time`, 400);

      // Resolve the child's active level (needed to record curriculum context).
      const student = await db.student.findUnique({
        where: { id: params.studentId },
        include: {
          progress: {
            where: { status: "IN_PROGRESS" },
            include: { level: { include: { subject: true, skills: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });
      if (!student) return notFound("Student");
      const prog = student.progress[0];
      if (!prog) return err("This child hasn't been placed yet, so there are no sessions to skip.", 400);
      const level = prog.level;
      const skill = level.skills[0];

      // Don't clobber days the child already worked (a real, non-skipped packet).
      const existing = await db.dailyPacket.findMany({
        where: { studentId: params.studentId, date: { in: allDays.map(dateUTC) } },
        select: { date: true },
      });
      const taken = new Set(existing.map((e) => e.date.toISOString().slice(0, 10)));
      const toCreate = allDays.filter((d) => !taken.has(d.toISOString().slice(0, 10)));

      if (toCreate.length > 0) {
        await db.dailyPacket.createMany({
          data: toCreate.map((d) => ({
            studentId: params.studentId,
            date: dateUTC(d),
            levelId: level.id,
            levelCode: level.code,
            levelName: level.name,
            skillName: skill?.name ?? "—",
            subjectSlug: level.subject.slug,
            sheets: [], // skipped — no work served
            problemsPerSheet: 30,
            timeLimitMinutes: level.timeLimitMinutes,
            printCount: 0,
            skipped: true,
            skippedByUserId: ctx.userId,
          })),
          skipDuplicates: true,
        });
      }

      return ok({ skippedDays: toCreate.length, alreadyHadWork: taken.size, from: parsed.data.startDate, to: parsed.data.endDate });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { studentId: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const owns = await assertParentOwns(ctx.userId, params.studentId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      if (!owns && !isAdmin) return forbidden();
      const dateStr = new URL(req.url).searchParams.get("date");
      if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return err("date query param (yyyy-MM-dd) required", 400);
      const d = dateUTC(new Date(`${dateStr}T00:00:00.000Z`));
      const packet = await db.dailyPacket.findUnique({ where: { studentId_date: { studentId: params.studentId, date: d } }, select: { id: true, skipped: true } });
      if (!packet || !packet.skipped) return notFound("Skipped session");
      await db.dailyPacket.delete({ where: { id: packet.id } });
      return ok({ unskipped: dateStr });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
