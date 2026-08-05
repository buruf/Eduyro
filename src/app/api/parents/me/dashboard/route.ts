// src/app/api/parents/me/dashboard/route.ts
// FIX: Attendance calendar now only marks days as "MISSED" for days
// after the student account was created. New students no longer see
// a calendar full of red squares.
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, handleRouteError, withAuth,
} from "@/lib/api/helpers";
import { startOfDay, subDays, eachDayOfInterval, format, isSameDay } from "date-fns";
import { getMathLevelSkills } from "@/lib/worksheet/generator";
import { isSheetOnPace, skillLabelFromTitle } from "@/lib/mastery/fluency";
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
                  subjectEnrollments: true, // parent-enabled subjects (absence = all enabled)
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
                  badges: {
                    include: { badge: true },
                    orderBy: { earnedAt: "desc" },
                    take: 30,
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
  // Only PARENT-ENABLED subjects count (StudentSubject; no rows = all enabled).
  // The old `progress[0]` picked an arbitrary IN_PROGRESS row — a child whose
  // Writing was muted long ago still showed "Level W0" while their actual Math
  // work was invisible. Prefer the subject the child most recently practised.
  const enrollments: any[] = student.subjectEnrollments ?? [];
  const enabledSubjectIds: Set<string> | null = enrollments.length
    ? new Set(enrollments.filter((e) => e.enabled).map((e) => e.subjectId))
    : null; // legacy child with no rows → all subjects enabled
  const enabledProgress = (student.progress as any[]).filter(
    (p) => !enabledSubjectIds || enabledSubjectIds.has(p.level?.subjectId)
  );
  const lastSheetSubjectId = (student.completedSheets as any[])?.[0]?.worksheet?.level?.subjectId ?? null;
  const activeProgress =
    enabledProgress.find((p) => p.level?.subjectId === lastSheetSubjectId) ??
    enabledProgress[0] ??
    null;
  const currentLevel = activeProgress?.level ?? null;

  const todayStart = appDayStart(new Date(), student.timezone);
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
    recentAvgAccuracy >= 90
      ? "EXCELLENT"
      : recentAvgAccuracy >= 85 && weeklyCompletionRate >= 70
      ? "ON_TRACK"
      : recentAvgAccuracy >= 75 || weeklyCompletionRate < 50
      ? "NEEDS_REVIEW"
      : "NEEDS_SUPPORT";

  // ── "Today's story" — the plain-language outcome a parent actually wants:
  // did today clear the 90% bar (advance) or will the lesson repeat tomorrow?
  // Mirrors the student-side advancement rules (quota window from
  // skillUnlockedAt, per-level threshold, one-lesson-per-day skill map).
  const todayStory = (() => {
    if (!currentLevel || !activeProgress) return null;
    const bar = currentLevel.masteryThresholdPct ?? 90;
    const perDay = currentLevel.sheetsPerDay ?? 3;
    const unlockedAt = (activeProgress as any).skillUnlockedAt as Date | null;
    const quotaStart = unlockedAt && unlockedAt > todayStart ? unlockedAt : todayStart;
    const levelToday = (student.completedSheets as any[]).filter(
      (s) => s.completedAt >= quotaStart && s.worksheet?.level?.id === currentLevel.id
    );
    const doneToday = levelToday.length;
    const avgToday = doneToday
      ? Math.round(levelToday.reduce((sum: number, s: any) => sum + s.accuracyPct, 0) / doneToday)
      : null;
    let lessonLabel: string | null = null, lessonPos: number | null = null,
        lessonTotal: number | null = null, nextLessonLabel: string | null = null;
    if (currentLevel.subject?.slug === "MATH") {
      const units = getMathLevelSkills(currentLevel.code);
      if (units.length) {
        const idx = Math.min(activeProgress.currentSkillIndex ?? 0, units.length - 1);
        lessonLabel = units[idx]?.label ?? null;
        nextLessonLabel = units[idx + 1]?.label ?? "the next level";
        lessonPos = idx + 1;
        lessonTotal = units.length;
      }
    }
    // Speed counts too: an accurate-but-slow fact sheet repeats. Without this
    // the parent was told "advances tomorrow" while the child actually repeats.
    const allFluent = levelToday.every((s: any) =>
      isSheetOnPace({
        levelCode: currentLevel.code, skillLabel: skillLabelFromTitle(s.worksheet?.title),
        timeSeconds: s.timeSeconds, problemCount: s.totalProblems,
      }));
    const slowToday = doneToday > 0 && (avgToday ?? 0) >= bar && !allFluent;
    const outcome: "working" | "repeat" | "advance" =
      doneToday >= perDay ? ((avgToday ?? 0) >= bar && allFluent ? "advance" : "repeat") : "working";
    return { subjectName: currentLevel.subject?.name ?? null, doneToday, perDay, avgToday, bar, outcome, slowToday, lessonLabel, lessonPos, lessonTotal, nextLessonLabel };
  })();

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

  // Parent-excused ("skip session") days in the window — shown EXCUSED, never MISSED.
  const skippedRows = await db.dailyPacket.findMany({
    where: { studentId: student.id, skipped: true, date: { gte: startOfDay(subDays(new Date(), 29)) } },
    select: { date: true },
  });
  const excusedDates = new Set(skippedRows.map((r) => format(r.date, "yyyy-MM-dd")));

  const attendanceLastMonth: AttendanceDay[] = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { date: key, status: "WEEKEND" };
    }
    if (d > new Date()) {
      // A future day the parent has already excused shows as EXCUSED, else upcoming.
      return { date: key, status: excusedDates.has(key) ? "EXCUSED" : "UPCOMING" };
    }
    // Don't mark days before the student was created as missed
    if (startOfDay(d) < studentCreatedAt) {
      return { date: key, status: "UPCOMING" };
    }
    const sheetsOnDay = student.completedSheets.filter((s: any) =>
      isSameDay(s.completedAt, d)
    );
    if (sheetsOnDay.length > 0) return { date: key, status: "COMPLETE" };
    if (excusedDates.has(key)) return { date: key, status: "EXCUSED" };
    return { date: key, status: "MISSED" };
  });

  // ── Learning path: the active MATH level's lesson map + where the child is ──
  // (Non-math levels progress by per-skill mastery; we surface their level too.)
  let learningPath: any = null;
  if (currentLevel?.subject?.slug === "MATH") {
    const skills = getMathLevelSkills(currentLevel.code);
    learningPath = {
      levelCode: currentLevel.code,
      levelName: currentLevel.name,
      currentIndex: Math.min(Math.max(0, activeProgress?.currentSkillIndex ?? 0), Math.max(0, skills.length - 1)),
      lessons: skills.map((s) => s.label),
    };
  } else if (currentLevel) {
    learningPath = {
      levelCode: currentLevel.code,
      levelName: currentLevel.name,
      currentIndex: 0,
      lessons: [],
    };
  }

  return {
    student: { ...student, user: student.user },
    currentLevel,
    streakDays: student.currentStreak,
    todayAccuracyPct,
    weeklyCompletionRate: Math.round(weeklyCompletionRate),
    status,
    weakSkills,
    todayStory,
    recentPdfs: student.pdfExports,
    attendanceLastMonth,
    // ── New section data (10-section parent dashboard) ──
    recentSheets: (student.completedSheets as any[]).slice(0, 20).map((s) => ({
      completedAt: s.completedAt,
      title: s.worksheet?.title ?? "Sheet",
      skillName: s.worksheet?.skill?.name ?? "",
      levelCode: s.worksheet?.level?.code ?? "",
      accuracyPct: s.accuracyPct,
      timeSeconds: s.timeSeconds,
    })),
    badges: (student.badges as any[] | undefined)?.map((b) => ({
      earnedAt: b.earnedAt,
      name: b.badge?.name ?? "Badge",
      description: b.badge?.description ?? "",
      iconEmoji: b.badge?.iconEmoji ?? "🏅",
    })) ?? [],
    goals: {
      sheetsPerDay: activeProgress?.dailySheetsOverride ?? currentLevel?.sheetsPerDay ?? 3,
      masteryThresholdPct: currentLevel?.masteryThresholdPct ?? 90,
      streakDays: student.currentStreak,
      bestStreak: student.longestStreak ?? student.currentStreak,
    },
    learningPath,
  };
}
