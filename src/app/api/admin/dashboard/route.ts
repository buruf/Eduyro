// src/app/api/admin/dashboard/route.ts
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, forbidden, notFound, handleRouteError, withRole,
} from "@/lib/api/helpers";
import { startOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import type { AdminDashboard, StudentSummary } from "@/types";

export async function GET(req: NextRequest) {
  return withRole(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"], async (ctx) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        include: {
          teacher: { include: { school: true } },
        },
      });

      if (!user?.teacher?.school) return notFound("School");
      const school = user.teacher.school;

      // ─── Counts ───
      const studentCount = await db.student.count({ where: { schoolId: school.id } });
      const teacherCount = await db.teacher.count({ where: { schoolId: school.id } });

      // ─── Weekly sheet count ───
      const weekStart = subDays(appDayStart(), 7);
      const sheetsThisWeek = await db.completedSheet.count({
        where: {
          student: { schoolId: school.id },
          completedAt: { gte: weekStart },
        },
      });

      // ─── Avg accuracy this month ───
      const monthStart = subDays(new Date(), 30);
      const recentSheets = await db.completedSheet.findMany({
        where: {
          student: { schoolId: school.id },
          completedAt: { gte: monthStart },
        },
        select: { accuracyPct: true },
      });
      const avgAccuracyPct =
        recentSheets.length > 0
          ? Math.round(
              recentSheets.reduce((sum, s) => sum + s.accuracyPct, 0) /
                recentSheets.length
            )
          : 0;

      // ─── Level advances this month ───
      const levelAdvancesThisMonth = await db.studentProgress.count({
        where: {
          student: { schoolId: school.id },
          status: "MASTERED",
          masteredAt: { gte: monthStart },
        },
      });

      // ─── Students needing support ───
      const allStudents = await db.student.findMany({
        where: { schoolId: school.id },
        include: {
          user: true,
          progress: {
            where: { status: "IN_PROGRESS" },
            include: { level: { include: { subject: true } } },
          },
          completedSheets: {
            orderBy: { completedAt: "desc" },
            take: 14,
          },
        },
      });

      const summaries: StudentSummary[] = allStudents.map((student) => {
        const recentSheets = student.completedSheets;
        const accuracyPct =
          recentSheets.length > 0
            ? Math.round(
                recentSheets.reduce((sum, s) => sum + s.accuracyPct, 0) /
                  recentSheets.length
              )
            : 0;
        const status: StudentSummary["status"] =
          accuracyPct >= 90
            ? "EXCELLENT"
            : accuracyPct >= 85
            ? "ON_TRACK"
            : accuracyPct >= 75
            ? "NEEDS_REVIEW"
            : "NEEDS_SUPPORT";

        return {
          student: { ...student, user: student.user },
          currentLevel: (student.progress[0]?.level ?? null) as any,
          accuracyPct,
          streakDays: student.currentStreak,
          sheetsCompleted: student.totalSheetsCompleted,
          status,
        };
      });

      const studentsNeedingSupport = summaries
        .filter((s) => s.status === "NEEDS_SUPPORT" || s.status === "NEEDS_REVIEW")
        .sort((a, b) => a.accuracyPct - b.accuracyPct)
        .slice(0, 10);

      // ─── Recent exports ───
      const recentExports = await db.pdfExport.findMany({
        where: { schoolId: school.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // ─── Weekly accuracy trend ───
      const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
      const weeklyAccuracyTrend = await Promise.all(
        days.map(async (day) => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 86400000);
          const daySheets = await db.completedSheet.findMany({
            where: {
              student: { schoolId: school.id },
              completedAt: { gte: dayStart, lt: dayEnd },
            },
            select: { accuracyPct: true },
          });
          return {
            date: format(day, "yyyy-MM-dd"),
            pct:
              daySheets.length > 0
                ? Math.round(
                    daySheets.reduce((sum, s) => sum + s.accuracyPct, 0) /
                      daySheets.length
                  )
                : 0,
          };
        })
      );

      // ─── Subject breakdown ───
      const subjects = await db.subject.findMany();
      const subjectBreakdown = await Promise.all(
        subjects.map(async (sub) => {
          const sheets = await db.completedSheet.findMany({
            where: {
              student: { schoolId: school.id },
              worksheet: { level: { subjectId: sub.id } },
              completedAt: { gte: monthStart },
            },
            select: { accuracyPct: true },
          });
          const pct =
            sheets.length > 0
              ? Math.round(
                  sheets.reduce((s, x) => s + x.accuracyPct, 0) / sheets.length
                )
              : 0;
          return { subject: sub.name, accuracyPct: pct };
        })
      );

      const dashboard: AdminDashboard = {
        school,
        studentCount,
        teacherCount,
        avgAccuracyPct,
        sheetsThisWeek,
        levelAdvancesThisMonth,
        studentsNeedingSupport,
        recentExports,
        weeklyAccuracyTrend,
        subjectBreakdown,
      };

      return ok(dashboard);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
