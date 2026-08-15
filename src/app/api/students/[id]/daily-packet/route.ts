// src/app/api/students/[id]/daily-packet/route.ts
// Returns (or generates) today's locked daily packet for a student.
// Timezone-aware: uses the user's local timezone from X-Timezone header.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { stripTrueFalse } from "@/lib/worksheet/generator";
import { buildTodayPacket } from "@/lib/worksheet/today-packet";

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
            include: { level: { include: { subject: true, skills: { orderBy: { sortOrder: "asc" } } } } },
            orderBy: { updatedAt: "desc" },
          },
        },
      });

      if (!student) return notFound("Student");

      const isStudent = student.userId === ctx.userId;
      const isParent  = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isStudent && !isParent) return forbidden();

      // The daily print is the pencil-and-paper MATH product. A multi-subject
      // child has several IN_PROGRESS rows, and "most recently updated" made
      // the printed subject an accident of activity order — reading practice
      // in the evening flipped the next print to sight words. Prefer Math
      // whenever it's active; other subjects print only when it isn't.
      const activeProgress =
        student.progress.find((p) => p.level.subject.slug === "MATH") ??
        student.progress[0] ??
        null;
      const preferredSlug = activeProgress?.level.subject.slug ?? null;

      const existing = await db.dailyPacket.findUnique({
        where: { studentId_date: { studentId, date: dateUTC } },
      });

      // Parent excused this day — serve a rest-day signal, not empty work.
      if (existing?.skipped) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "skipped" });
      }

      // A cached packet in the wrong subject (created before the Math
      // preference existed) is regenerated rather than served all day.
      const staleSubject = existing && preferredSlug && existing.subjectSlug !== preferredSlug;

      if (existing && !staleSubject) {
        await db.dailyPacket.update({
          where: { id: existing.id },
          data:  { printCount: { increment: 1 } },
        });
        return ok({ packet: existing, date: dateStr, fresh: false });
      }
      if (!activeProgress) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "no_placement" });
      }

      const level   = activeProgress.level;
      const subject = level.subject;
      const skill   = level.skills[0];

      if (!skill) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "no_skill" });
      }

      // Serve THE SAME worksheets as the on-screen packet — one shared source of
      // truth (buildTodayPacket): same skill-map lesson, same repeat-on-fail
      // retirement (failed sheets re-serve next day), same admin unlock/override.
      // The printed packet and the student's practice always match.
      const packetPlan = await buildTodayPacket(studentId, activeProgress);
      // Print the sheets still to do today; if the day is already finished,
      // print the whole day's set so the parent still gets a usable packet.
      const pending = packetPlan.sheets.filter((s) => s.status !== "COMPLETED");
      const toPrint = (pending.length > 0 ? pending : packetPlan.sheets).slice(0, 5);
      if (toPrint.length === 0) {
        return ok({ packet: null, date: dateStr, fresh: false, reason: "no_sheets" });
      }
      const rows = await db.worksheet.findMany({
        where: { id: { in: toPrint.map((s) => s.worksheetId) } },
        select: { id: true, problems: true, answerKey: true },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const sheets = toPrint.map((s, i) => {
        const row = byId.get(s.worksheetId);
        const problems = Array.isArray(row?.problems) ? (row!.problems as any[]) : [];
        const answerKey = Array.isArray(row?.answerKey) ? (row!.answerKey as any[]) : [];
        // Drop true/false items — they print poorly (see stripTrueFalse).
        const cleaned = stripTrueFalse(problems as any, answerKey as any);
        return { sheetNumber: i + 1, worksheetId: s.worksheetId, title: s.title, problems: cleaned.problems, answerKey: cleaned.answerKey };
      });

      const fields = {
        levelId:          level.id,
        levelCode:        level.code,
        levelName:        level.name,
        // Label the packet with the CURRENT lesson (matches what's printed),
        // falling back to the level's first skill for legacy rows.
        skillName:        toPrint[0]?.skillName ?? skill.name,
        subjectSlug:      subject.slug,
        sheets:           sheets as any,
        problemsPerSheet: sheets[0]?.problems?.length ?? 30,
        timeLimitMinutes: level.timeLimitMinutes,
      };
      // Upsert, not create: a stale wrong-subject row for today is replaced in
      // place, keeping its printCount history.
      const packet = await db.dailyPacket.upsert({
        where:  { studentId_date: { studentId, date: dateUTC } },
        create: { studentId, date: dateUTC, ...fields, printCount: 1 },
        update: { ...fields, printCount: { increment: 1 } },
      });

      return ok({ packet, date: dateStr, fresh: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
