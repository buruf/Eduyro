// src/app/api/students/[id]/upcoming-packets/route.ts
// Generates the NEXT N days of practice ("vacation pack") for a child so a parent
// can print ahead while the child is away from interactive practice. Continues the
// same curriculum from where the child currently is. Does NOT create locked
// DailyPacket rows — it's a print-ahead projection; the daily flow is untouched.
//   GET ?days=N  (1–14, default 5)   — parent or the student themselves only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems, stripTrueFalse } from "@/lib/worksheet/generator";

import { DEFAULT_SHEETS_PER_DAY as SHEETS_PER_DAY } from "@/lib/curriculum-constants";
const PROBLEMS_PER_SHEET = 30;
const MAX_DAYS = 14;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const studentId = params.id;
      const days = Math.min(MAX_DAYS, Math.max(1, parseInt(new URL(req.url).searchParams.get("days") ?? "5", 10) || 5));

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
      const isParent = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isStudent && !isParent) return forbidden();

      const activeProgress = student.progress[0] ?? null;
      if (!activeProgress) return ok({ packets: [], reason: "no_placement" });

      const level = activeProgress.level;
      const subject = level.subject;
      const skill = level.skills[0];
      if (!skill) return ok({ packets: [], reason: "no_skill" });

      // Continue from the child's current position: each daily packet so far
      // consumed SHEETS_PER_DAY sheets of this level's 100-sheet curriculum.
      const priorPackets = await db.dailyPacket.count({ where: { studentId, levelCode: level.code } });
      const baseConsumed = priorPackets * SHEETS_PER_DAY;

      const packets = [];
      for (let day = 1; day <= days; day++) {
        const sheets = [];
        for (let i = 1; i <= SHEETS_PER_DAY; i++) {
          const globalSheet = Math.min(100, baseConsumed + (day - 1) * SHEETS_PER_DAY + i);
          const { problems, answerKey } = generateProblems({
            subjectSlug: subject.slug as any,
            levelCode: level.code,
            skillName: skill.name,
            problemCount: PROBLEMS_PER_SHEET,
            timeLimitMinutes: level.timeLimitMinutes,
            difficulty: 1.0,
            sheetNumber: globalSheet,
            totalSheets: 100,
          });
          // Drop true/false items — they print poorly (see stripTrueFalse).
          const cleaned = stripTrueFalse(problems, answerKey);
          sheets.push({ sheetNumber: i, problems: cleaned.problems, answerKey: cleaned.answerKey });
        }
        packets.push({ day, sheets });
      }

      return ok({
        student: { id: student.id, name: student.user.name },
        levelCode: level.code, levelName: level.name, skillName: skill.name, subjectSlug: subject.slug,
        problemsPerSheet: PROBLEMS_PER_SHEET, timeLimitMinutes: level.timeLimitMinutes,
        days, packets,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
