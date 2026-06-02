// src/app/api/students/[id]/daily-packet/route.ts
// Returns (or generates) today's locked daily packet for a student.
// Timezone-aware: uses the user's local timezone from X-Timezone header.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems } from "@/lib/worksheet/generator";

const SHEETS_PER_DAY     = 3;
const PROBLEMS_PER_SHEET = 30;

// Get today's date string (yyyy-MM-dd) in a given timezone using native Intl
function getTodayInTimezone(tz: string): { dateStr: string; dateUTC: Date } {
  let timezone = tz;
  // Validate timezone
  try { Intl.DateTimeFormat(undefined, { timeZone: tz }); }
  catch { timezone = "UTC"; }

  // Get today's date parts in user's timezone
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).formatToParts(now);

  const year  = parts.find(p => p.type === "year")!.value;
  const month = parts.find(p => p.type === "month")!.value;
  const day   = parts.find(p => p.type === "day")!.value;
  const dateStr = `${year}-${month}-${day}`;

  // Create UTC midnight date for DB storage
  const dateUTC = new Date(`${dateStr}T00:00:00.000Z`);

  return { dateStr, dateUTC };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      const studentId  = params.id;
      const userTz     = req.headers.get("X-Timezone") ?? "UTC";
      const { dateStr, dateUTC } = getTodayInTimezone(userTz);

      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          parentLinks: { include: { parent: true } },
          progress: {
            where: { status: "IN_PROGRESS" },
            include: { level: { include: { subject: true, skills: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });

      if (!student) return notFound("Student");

      const isStudent = student.userId === ctx.userId;
      const isParent  = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isStudent && !isParent) return forbidden();

      const existing = await db.dailyPacket.findUnique({
        where: { studentId_date: { studentId, date: dateUTC } },
      });

      if (existing) {
        await db.dailyPacket.update({
          where: { id: existing.id },
          data:  { printCount: { increment: 1 } },
        });
        return ok({ packet: existing, date: dateStr, fresh: false });
      }

      const activeProgress = student.progress[0] ?? null;
      if (!activeProgress) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "no_placement" });
      }

      const level   = activeProgress.level;
      const subject = level.subject;
      const skill   = level.skills[0];

      if (!skill) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "no_skill" });
      }

      const sheets = [];
      for (let i = 1; i <= SHEETS_PER_DAY; i++) {
        const { problems, answerKey } = generateProblems({
          subjectSlug:      subject.slug as any,
          levelCode:        level.code,
          skillName:        skill.name,
          problemCount:     PROBLEMS_PER_SHEET,
          timeLimitMinutes: level.timeLimitMinutes,
          difficulty:       1.0,
          sheetNumber:      i,
          totalSheets:      SHEETS_PER_DAY,
        });
        sheets.push({ sheetNumber: i, problems, answerKey });
      }

      const packet = await db.dailyPacket.create({
        data: {
          studentId,
          date:             dateUTC,
          levelId:          level.id,
          levelCode:        level.code,
          levelName:        level.name,
          skillName:        skill.name,
          subjectSlug:      subject.slug,
          sheets:           sheets as any,
          problemsPerSheet: PROBLEMS_PER_SHEET,
          timeLimitMinutes: level.timeLimitMinutes,
          printCount:       1,
        },
      });

      return ok({ packet, date: dateStr, fresh: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
