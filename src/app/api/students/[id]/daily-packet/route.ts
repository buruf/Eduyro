// src/app/api/students/[id]/daily-packet/route.ts
// Returns (or generates) today's locked daily packet for a student.
// GET  — fetch today's packet (creates it if it doesn't exist)
// The packet is locked once generated: same problems on every reprint today.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems } from "@/lib/worksheet/generator";
import { startOfDay, format } from "date-fns";

const SHEETS_PER_DAY   = 3;
const PROBLEMS_PER_SHEET = 30;
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      const studentId = params.id;

      // Verify caller owns this student (parent or the student themselves)
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

      // Auth check: must be the student themselves, or their parent
      const isStudent = student.userId === ctx.userId;
      const isParent  = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isStudent && !isParent) return forbidden();

      // Today's date — use server's local date (Vercel runs UTC, so offset by -4/-5)
      // Simple approach: use UTC date which is close enough for daily packet purposes
      const todayDate    = startOfDay(new Date());
      const todayStr     = format(todayDate, "yyyy-MM-dd"); // for display

      // Check if today's packet already exists
      const existing = await db.dailyPacket.findUnique({
        where: { studentId_date: { studentId, date: todayDate } },
      });

      if (existing) {
        // Increment print count on each fetch (proxy for "parent opened print page")
        await db.dailyPacket.update({
          where: { id: existing.id },
          data:  { printCount: { increment: 1 } },
        });
        return ok({ packet: existing, date: todayStr, fresh: false });
      }

      // No packet yet — generate it now
      const activeProgress = student.progress[0] ?? null;
      if (!activeProgress) {
        return ok({
          packet:  null,
          date:    todayStr,
          fresh:   false,
          reason:  "no_placement", // parent dashboard should show "Take placement test first"
        });
      }

      const level   = activeProgress.level;
      const subject = level.subject;
      const skill   = level.skills[0];

      if (!skill) {
        return ok({ packet: null, date: todayStr, fresh: false, reason: "no_skill" });
      }

      // Generate 3 sheets
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

      // Lock it to DB
      const packet = await db.dailyPacket.create({
        data: {
          studentId,
          date:            todayDate,
          levelId:         level.id,
          levelCode:       level.code,
          levelName:       level.name,
          skillName:       skill.name,
          subjectSlug:     subject.slug,
          sheets:          sheets as any,
          problemsPerSheet: PROBLEMS_PER_SHEET,
          timeLimitMinutes: level.timeLimitMinutes,
          printCount:      1,
        },
      });

      return ok({ packet, date: todayStr, fresh: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
