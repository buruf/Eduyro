// src/app/api/parents/me/dashboard/route.ts
// FIX: Attendance calendar now only marks days as "MISSED" for days
// after the student account was created. New students no longer see
// a calendar full of red squares.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, handleRouteError, withAuth,
} from "@/lib/api/helpers";
import { startOfDay, subDays, eachDayOfInterval, format, isSameDay } from "date-fns";
import type {
  ParentDashboard, ChildSummary, AttendanceDay,
} from "@/types";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const parent = await db.parent.findUnique({
        where: { userId: ctx.userId },
        include: {
          user: true,
          children: {
            include: {
              student: {
                include: {
                  user: true,
                  progress: {
                    where: { status: "IN_PROGRESS" },
                    include: { level: { include: { subject: true } } },
                  },
                  completedSheets: {
                    include: {
                      worksheet: { include: { skill: true, level: true } },
                    },
                    orderBy: { completedAt: "desc" },
                    take: 50,
                  },
                  pdfExports: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                  },
                },
              },
            },
          },
        },
      });

      if (!parent) return notFound("Parent profile");

      const children: ChildSummary[] = await Promise.all(
        parent.children.map(async (link) => buildChildSummary(link.student))
      );

      const subscription = await db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      const notifications = await db.notification.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const recentPdfs = await db.pdfExport.findMany({
        where: {
          studentId: {
            in: parent.children.map((l) => l.studentId),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const dashboard: ParentDashboard = {
        parent: parent as any,
        children,
        recentPdfs,
        notifications,
        subscription,
      };

      return ok(dashboard);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

async function buildChildSummary(student: any): Promise<ChildSummary> {
  const activeProgress = student.progress[0] ?? null;
  const currentLevel = activeProgress?.level ?? null;

  const todayStart = startOfDay(new Date());
  const todaySheets = student.completedSheets.filter(
    (s: any) => s.completedAt >= todayStart
  );
  const todayAccuracyPct =
    todaySheets.length > 0
      ? Math.round(
          todaySheets.reduce((sum: number, s: any) => sum + s.accuracyPct, 0) /
            todaySheets.length
        )
      : null;

  const lastWeek = subDays(new Date(), 7);
  const weekSheets = student.completedSheets.filter(
    (s: any) => s.completedAt >= lastWeek
  );
  const weeklyCompletionRate = Math.min(weekSheets.length / 21, 1) * 100;

  const recentAvgAccuracy =
    student.completedSheets.length > 0
      ? student.completedSheets
          .slice(0, 14)
          .reduce((sum: number, s: any) => sum + s.accuracyPct, 0) /
        Math.min(student.completedSheets.length, 14)
      : 0;

  const status: ChildSummary["status"] =
    recentAvgAccuracy >= 95
      ? "EXCELLENT"
      : recentAvgAccuracy >= 85 && weeklyCompletionRate >= 70
      ? "ON_TRACK"
      : recentAvgAccuracy >= 75 || weeklyCompletionRate < 50
      ? "NEEDS_REVIEW"
      : "NEEDS_SUPPORT";

  const skillScores: Record<string, { skillName: string; sum: number; count: number }> = {};
  student.completedSheets.forEach((s: any) => {
    const k = s.worksheet.skillId;
    if (!skillScores[k]) {
      skillScores[k] = { skillName: s.worksheet.skill.name, sum: 0, count: 0 };
    }
    skillScores[k].sum += s.accuracyPct;
    skillScores[k].count++;
  });
  const weakSkills = Object.values(skillScores)
    .map((s) => ({ skillName: s.skillName, accuracyPct: Math.round(s.sum / s.count) }))
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 3);

  // FIX: Only mark days as MISSED after the student was created.
  // Days before createdAt show as "UPCOMING" (neutral/empty).
  const studentCreatedAt = startOfDay(new Date(student.createdAt));
  const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });

  const attendanceLastMonth: AttendanceDay[] = days.map((d) => {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { date: format(d, "yyyy-MM-dd"), status: "WEEKEND" };
    }
    if (d > new Date()) {
      return { date: format(d, "yyyy-MM-dd"), status: "UPCOMING" };
    }
    // Don't mark days before the student was created as missed
    if (startOfDay(d) < studentCreatedAt) {
      return { date: format(d, "yyyy-MM-dd"), status: "UPCOMING" };
    }
    const sheetsOnDay = student.completedSheets.filter((s: any) =>
      isSameDay(s.completedAt, d)
    );
    return {
      date: format(d, "yyyy-MM-dd"),
      status: sheetsOnDay.length > 0 ? "COMPLETE" : "MISSED",
    };
  });

  return {
    student: { ...student, user: student.user },
    currentLevel,
    streakDays: student.currentStreak,
    todayAccuracyPct,
    weeklyCompletionRate: Math.round(weeklyCompletionRate),
    status,
    weakSkills,
    recentPdfs: student.pdfExports,
    attendanceLastMonth,
  };
}
