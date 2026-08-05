// src/app/api/students/[id]/dashboard/route.ts
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, handleRouteError, withAuth,
} from "@/lib/api/helpers";
import { startOfDay, subDays, format } from "date-fns";
import { generateProblems, getMathSheetMeta, nonMathDistinctSheets, nonMathBankQuestions, getMathLevelSkills } from "@/lib/worksheet/generator";
import { computeItemMastery, type ItemMastery } from "@/lib/worksheet/item-mastery";
import { masteryTarget, isSkillMastered } from "@/lib/mastery";
import { isSheetOnPace, skillLabelFromTitle, factPaceTargetSec } from "@/lib/mastery/fluency";
import { buildTodayPacket, skillCompletionStats, itemMasteryBySkill } from "@/lib/worksheet/today-packet";
import { enabledSubjectSlugs } from "@/lib/enrollment";
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
      // TEACHER must be LINKED to this student (blanket teacher access let any
      // self-registered teacher read any child's data — security audit).
      const isTeacher =
        ctx.role === "TEACHER" &&
        (await db.teacherStudent.findFirst({
          where: { studentId: student.id, teacher: { userId: ctx.userId } },
          select: { id: true },
        })) !== null;

      if (!isOwn && !isParent && !isAdmin && !isTeacher) return forbidden();

      // ── Find current active level ──
      // Subjects are parent-controlled: never surface a level for a subject the
      // parent has DISABLED, even if progress exists. Among the enabled subjects,
      // honour an optional ?subject= switch (the child's "My subjects" picker);
      // otherwise default to the first IN_PROGRESS enabled level.
      const enabled = await enabledSubjectSlugs(student.id);
      const requestedSubject = req.nextUrl.searchParams.get("subject")?.toUpperCase();
      const inProgressEnabled = student.progress.filter(
        (p) => p.status === "IN_PROGRESS" && enabled.has(p.level.subject.slug)
      );
      // DEFENSIVE: if a subject somehow has more than one IN_PROGRESS level,
      // always serve the FURTHEST one (highest sortOrder). Taking [0] served the
      // child their OLD level, so "today's lesson" was one they had already
      // completed and submitted (field reports: Ridwan, then Radwa). The stale
      // row is repaired separately, but the reader must never regress a child.
      const furthestIn = (slug: string) =>
        inProgressEnabled
          .filter((p) => p.level.subject.slug === slug)
          .sort((a, b) => (b.level.sortOrder ?? 0) - (a.level.sortOrder ?? 0))[0];

      const defaultSlug = inProgressEnabled[0]?.level.subject.slug;
      const activeProgress =
        (requestedSubject ? furthestIn(requestedSubject) : undefined) ??
        (defaultSlug ? furthestIn(defaultSlug) : undefined);

      // ── Build today's packet ──
      const todayPacket = await buildTodayPacket(student.id, activeProgress);

      // ── Weekly accuracy ──
      const weeklyAccuracy = buildWeeklyAccuracy(student.completedSheets);

      // ── Today accuracy ──
      const todayStart = appDayStart(new Date(), (student as any).timezone);
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
        ? await buildSkillTree(student.id, activeProgress.level, activeProgress.currentSkillIndex ?? 0)
        : [];

      // ── Level progress summary (SKILL-MAP: one lesson per day, ≥95% to advance) ──
      let levelProgress: any = null;
      if (activeProgress) {
        const isMath = activeProgress.level.subject.slug === "MATH";
        const mathSkills = isMath ? getMathLevelSkills(activeProgress.level.code) : [];
        const skillIdx = Math.min(Math.max(0, activeProgress.currentSkillIndex ?? 0), Math.max(0, mathSkills.length - 1));
        const curSkill = mathSkills[skillIdx];
        // Effective daily quota: raise-only override; window restarts at an
        // admin skill-unlock (must MATCH buildTodayPacket + submit-sheet).
        const lvlPerDay = activeProgress.level.sheetsPerDay ?? 3;
        const sheetsPerDay = (activeProgress as any).dailySheetsOverride
          ? Math.max((activeProgress as any).dailySheetsOverride, lvlPerDay)
          : lvlPerDay;
        const unlkAt = (activeProgress as any).skillUnlockedAt as Date | null;
        const qStart = unlkAt && unlkAt > todayStart ? unlkAt : todayStart;
        const threshold = activeProgress.level.masteryThresholdPct ?? 90;
        // Today's completed sheets for THIS level (quota window).
        const todayLevelSheets = await db.completedSheet.findMany({
          where: { studentId: student.id, worksheet: { levelId: activeProgress.level.id }, completedAt: { gte: qStart } },
          select: { accuracyPct: true, timeSeconds: true, totalProblems: true, worksheet: { select: { title: true } } },
        });
        const todayDone = todayLevelSheets.length;
        const todayAvg = todayDone ? Math.round(todayLevelSheets.reduce((a, s) => a + s.accuracyPct, 0) / todayDone) : 0;
        // Fluency gate (fact levels): a fact sheet done accurately but too slowly
        // does not clear the day (must MATCH submit-sheet).
        const todayAllFluent = todayLevelSheets.every((s) =>
          isSheetOnPace({
            levelCode: activeProgress.level.code, skillLabel: skillLabelFromTitle(s.worksheet?.title),
            timeSeconds: s.timeSeconds, problemCount: s.totalProblems,
          }));
        const slowToday = todayDone > 0 && todayAvg >= threshold && !todayAllFluent;
        // Advancement clears at the LEVEL quota (lvlPerDay) — a raised practice
        // cap only adds extra sheets, it doesn't move the advancement bar.
        const dayCleared = todayDone >= lvlPerDay && todayAvg >= threshold && todayAllFluent;
        levelProgress = {
          levelCode: activeProgress.level.code,
          levelName: activeProgress.level.name,
          subjectName: activeProgress.level.subject.slug,
          status: activeProgress.status,
          // Skill-map fields:
          currentSkillIndex: skillIdx,
          currentSkillName: curSkill?.label ?? (skillTree as any[]).find((s) => s.status === "IN_PROGRESS")?.skillName ?? activeProgress.level.name,
          totalSkills: mathSkills.length,
          skillsMastered: skillIdx,
          todayDone,
          todayNeeded: sheetsPerDay,
          todayAvgPct: todayAvg,
          // The REAL bar (levels can differ) — the UI used to hard-code "90%",
          // which contradicted itself whenever the bar or the blocker differed.
          thresholdPct: threshold,
          paceTargetSec: factPaceTargetSec(activeProgress.level.code, curSkill?.label ?? ""),
          dayCleared,
          // True when today's fact sheets were accurate but too slow — the UI
          // shows "great accuracy, now build speed" and the sheets repeat.
          slowToday,
          progressPct: mathSkills.length ? Math.round((skillIdx / mathSkills.length) * 100) : 0,
          // Back-compat with older UI (advancement bar = level quota):
          masterySheetsPassed: todayDone,
          masterySheetsNeeded: lvlPerDay,
          sheetsToAdvance: Math.max(0, lvlPerDay - todayDone),
          isReadyToAdvance: dayCleared,
          currentSkill: curSkill?.label ?? activeProgress.level.name,
        };
      }

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

// Mastery rules (MASTERY_ACCURACY, masteryTarget, isSkillMastered) live in
// @/lib/mastery so every route shares one source of truth.

/** Per-skill { sheetsCompleted, totalAccuracy } for a student in a level. */
async function buildSkillTree(
  studentId: string,
  level: any,
  currentSkillIndex: number = 0
): Promise<SkillTreeNode[]> {
  // Shared with buildTodayPacket — one grouping helper, not a copy.
  const skillStats = await skillCompletionStats(studentId, level.id);

  const isMathSubj = level.subject?.slug === "MATH";

  // MATH skill map = the engine's REAL content lessons, ticked by the student's
  // currentSkillIndex (one lesson per day). Lessons before the index are done,
  // the index one is in progress, later ones are locked.
  if (isMathSubj) {
    const skills = getMathLevelSkills(level.code ?? "");
    return skills.map((u, i): SkillTreeNode => ({
      skillId: u.id,
      skillName: u.label,
      sortOrder: i,
      status: i < currentSkillIndex ? "MASTERED" : i === currentSkillIndex ? "IN_PROGRESS" : "LOCKED",
      progressPct: i < currentSkillIndex ? 100 : i === currentSkillIndex ? 20 : 0,
      sheetsCompleted: 0,
      totalSheets: u.range[1] - u.range[0] + 1,
    }));
  }

  const itemStats = await itemMasteryBySkill(studentId, level);

  let foundInProgress = false;

  return level.skills.map((skill: any): SkillTreeNode => {
    const stats = skillStats[skill.id];
    const sheetsCompleted = stats?.sheetsCompleted ?? 0;
    const avgAccuracy =
      stats && sheetsCompleted > 0
        ? stats.totalAccuracy / sheetsCompleted
        : 0;

    const im = itemStats[skill.id];
    const distinctSheets = isMathSubj
      ? 8
      : nonMathDistinctSheets(level.subject?.slug ?? "", level.code ?? "", skill.name);
    const target = masteryTarget(isMathSubj, distinctSheets);
    const isMastered = isSkillMastered({
      isMath: isMathSubj,
      sheetsCompleted,
      avgAccuracy,
      distinctSheets,
      item: im,
    });
    // The first not-yet-mastered skill is the ACTIVE one (unlocked) — even with 0
    // sheets done yet — so the next skill opens as soon as the prior is mastered.
    const isInProgress = !isMastered && !foundInProgress;
    const isLocked = !isMastered && !isInProgress;

    if (isInProgress) foundInProgress = true;

    const status = isMastered
      ? "MASTERED"
      : isInProgress
      ? "IN_PROGRESS"
      : "LOCKED";
    // Progress toward UNLOCKING the next skill. For non-math, blend sheet progress
    // with distinct-item coverage so the bar reflects how much of the bank the
    // student has actually worked through (whichever is further along).
    const sheetPct = Math.min(Math.round((sheetsCompleted / target) * 100), 100);
    const progressPct =
      !isMathSubj && im && im.bankSize > 0
        ? Math.max(sheetPct, Math.round(im.coveragePct))
        : sheetPct;

    return {
      skillId: skill.id,
      skillName: skill.name,
      sortOrder: skill.sortOrder,
      status,
      progressPct,
      sheetsCompleted,
      ...(!isMathSubj && im && im.bankSize > 0
        ? {
            itemsSeen: im.distinctSeen,
            itemsTotal: im.bankSize,
            itemsMastered: im.distinctCorrect,
            itemAccuracyPct: Math.round(im.itemAccuracyPct),
          }
        : {}),
      totalSheets: skill.totalSheets,
    };
  });
}
