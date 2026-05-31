// src/app/api/students/[id]/dashboard/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, handleRouteError, withAuth,
} from "@/lib/api/helpers";
import { startOfDay, subDays, format } from "date-fns";
import type { StudentDashboard, TodaySheet, SkillTreeNode } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      // Fetch student, verify ownership or admin
      const student = await db.student.findUnique({
        where: { id: params.id },
        include: {
          user: true,
          parentLinks: { include: { parent: { include: { user: true } } } },
          progress: {
            include: {
              level: {
                include: {
                  subject: true,
                  skills: { orderBy: { sortOrder: "asc" } },
                },
              },
              dailyAccuracy: {
                orderBy: { date: "desc" },
                take: 7,
              },
            },
          },
          completedSheets: {
            include: { worksheet: { include: { level: true, skill: true } } },
            orderBy: { completedAt: "desc" },
            take: 30,
          },
          badges: {
            include: { badge: true },
            orderBy: { earnedAt: "desc" },
            take: 8,
          },
        },
      });

      if (!student) return notFound("Student");

      // Authorization: student can view own data, parent can view their child, admin can view all
      const isOwn = student.userId === ctx.userId;
      const isParent = student.parentLinks.some(
        (l) => l.parent.userId === ctx.userId
      );
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      const isTeacher = ctx.role === "TEACHER";

      if (!isOwn && !isParent && !isAdmin && !isTeacher) return forbidden();

      // ── Find current active level (first IN_PROGRESS, or highest MASTERED) ──
      const activeProgress = student.progress.find(
        (p) => p.status === "IN_PROGRESS"
      );

      // ── Build today's packet ──
      const todayPacket = await buildTodayPacket(student.id, activeProgress);

      // ── Weekly accuracy ──
      const weeklyAccuracy = buildWeeklyAccuracy(student.completedSheets);

      // ── Today accuracy ──
      const todayStart = startOfDay(new Date());
      const todaySheets = student.completedSheets.filter(
        (s) => s.completedAt >= todayStart
      );
      const todayAccuracyPct =
        todaySheets.length > 0
          ? todaySheets.reduce((sum, s) => sum + s.accuracyPct, 0) /
            todaySheets.length
          : null;

      // ── Skill tree for active level ──
      const skillTree = activeProgress
        ? await buildSkillTree(student.id, activeProgress.level)
        : [];

      // ── Level progress summary ──
      const levelProgress = activeProgress
        ? {
            levelCode: activeProgress.level.code,
            levelName: activeProgress.level.name,
            subjectName: activeProgress.level.subject.slug,
            sheetsCompleted: activeProgress.sheetsCompleted,
            totalSheets:
              activeProgress.level.problemsPerSheet *
              activeProgress.level.skills.reduce(
                (sum, s) => sum + (s as any).totalSheets,
                0
              ),
            progressPct: Math.min(
              Math.round(
                (activeProgress.sheetsCompleted /
                  Math.max(
                    activeProgress.level.skills.reduce(
                      (sum, s) => sum + (s as any).totalSheets,
                      0
                    ),
                    1
                  )) *
                  100
              ),
              100
            ),
            consecutivePassDays: activeProgress.consecutivePassDays,
            daysUntilAdvance: Math.max(
              0,
              activeProgress.level.masteryConsecutiveDays -
                activeProgress.consecutivePassDays
            ),
            status: activeProgress.status,
          }
        : null;

      const dashboard: StudentDashboard = {
        student: { ...student, user: student.user },
        streakDays: student.currentStreak,
        longestStreak: student.longestStreak,
        todayAccuracyPct,
        weeklyAccuracy,
        levelProgress: levelProgress as any,
        todayPacket,
        recentBadges: student.badges as any,
        skillTree,
      };

      return ok(dashboard);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function buildTodayPacket(
  studentId: string,
  progress: any
): Promise<{ sheets: TodaySheet[]; allComplete: boolean; canPrint: boolean }> {
  if (!progress) {
    return { sheets: [], allComplete: false, canPrint: false };
  }

  const todayStart = startOfDay(new Date());
  const sheetsPerDay = progress.level.sheetsPerDay ?? 3;

  // Get today's completed sheets for this student + level
  const completedToday = await db.completedSheet.findMany({
    where: {
      studentId,
      completedAt: { gte: todayStart },
      worksheet: { levelId: progress.levelId },
    },
    include: { worksheet: { include: { skill: true } } },
    orderBy: { completedAt: "asc" },
  });

  // Get the next worksheets to do (skip already completed ones today)
  const completedWorksheetIds = completedToday.map((c) => c.worksheetId);

  const nextWorksheets = await db.worksheet.findMany({
    where: {
      levelId: progress.levelId,
      id: { notIn: completedWorksheetIds },
      isActive: true,
    },
    include: { skill: true },
    orderBy: [{ skill: { sortOrder: "asc" } }, { sheetNumber: "asc" }],
    take: Math.max(0, sheetsPerDay - completedToday.length),
  });

  const sheets: TodaySheet[] = [];

  // Add completed sheets
  completedToday.forEach((cs, i) => {
    sheets.push({
      index: i + 1,
      worksheetId: cs.worksheetId,
      title: cs.worksheet.title,
      skillName: cs.worksheet.skill.name,
      problemCount: cs.totalProblems,
      status: "COMPLETED",
      score: cs.score,
      accuracyPct: cs.accuracyPct,
      timeSeconds: cs.timeSeconds,
      completedAt: cs.completedAt.toISOString(),
    });
  });

  // Add pending sheets
  nextWorksheets.forEach((ws, i) => {
    sheets.push({
      index: completedToday.length + i + 1,
      worksheetId: ws.id,
      title: ws.title,
      skillName: ws.skill.name,
      problemCount: ws.problemCount,
      status: i === 0 ? "IN_PROGRESS" : "NOT_STARTED",
    });
  });

  const allComplete = sheets.length > 0 && sheets.every((s) => s.status === "COMPLETED");

  return { sheets, allComplete, canPrint: true };
}

function buildWeeklyAccuracy(
  completedSheets: any[]
): { date: string; pct: number }[] {
  const result: { date: string; pct: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const daySheets = completedSheets.filter(
      (s) => s.completedAt >= dayStart && s.completedAt < dayEnd
    );

    const pct =
      daySheets.length > 0
        ? Math.round(
            daySheets.reduce((sum, s) => sum + s.accuracyPct, 0) /
              daySheets.length
          )
        : 0;

    result.push({ date: dateStr, pct });
  }

  return result;
}

async function buildSkillTree(
  studentId: string,
  level: any
): Promise<SkillTreeNode[]> {
  const completedBySkill = await db.completedSheet.groupBy({
    by: ["worksheetId"],
    where: {
      studentId,
      worksheet: { levelId: level.id },
    },
    _avg: { accuracyPct: true },
    _count: true,
  });

  // Build a map of skillId → { count, avgAccuracy }
  const worksheetIds = completedBySkill.map((c) => c.worksheetId);
  const worksheets = await db.worksheet.findMany({
    where: { id: { in: worksheetIds } },
    select: { id: true, skillId: true },
  });

  const skillStats: Record<
    string,
    { sheetsCompleted: number; totalAccuracy: number }
  > = {};

  completedBySkill.forEach((c) => {
    const ws = worksheets.find((w) => w.id === c.worksheetId);
    if (!ws) return;
    if (!skillStats[ws.skillId]) {
      skillStats[ws.skillId] = { sheetsCompleted: 0, totalAccuracy: 0 };
    }
    skillStats[ws.skillId].sheetsCompleted += c._count;
    skillStats[ws.skillId].totalAccuracy +=
      (c._avg.accuracyPct ?? 0) * c._count;
  });

  let foundInProgress = false;

  return level.skills.map((skill: any): SkillTreeNode => {
    const stats = skillStats[skill.id];
    const sheetsCompleted = stats?.sheetsCompleted ?? 0;
    const avgAccuracy =
      stats && sheetsCompleted > 0
        ? stats.totalAccuracy / sheetsCompleted
        : 0;

    const isMastered = avgAccuracy >= 95 && sheetsCompleted >= skill.totalSheets * 0.8;
    const isInProgress = !isMastered && sheetsCompleted > 0 && !foundInProgress;
    const isLocked = !isMastered && !isInProgress;

    if (isInProgress) foundInProgress = true;

    const status = isMastered
      ? "MASTERED"
      : isInProgress
      ? "IN_PROGRESS"
      : "LOCKED";
    const progressPct = Math.min(
      Math.round((sheetsCompleted / Math.max(skill.totalSheets, 1)) * 100),
      100
    );

    return {
      skillId: skill.id,
      skillName: skill.name,
      sortOrder: skill.sortOrder,
      status,
      progressPct,
      sheetsCompleted,
      totalSheets: skill.totalSheets,
    };
  });
}
