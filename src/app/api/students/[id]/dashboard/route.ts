// src/app/api/students/[id]/dashboard/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, handleRouteError, withAuth,
} from "@/lib/api/helpers";
import { startOfDay, subDays, format } from "date-fns";
import { generateProblems, getMathSheetMeta, nonMathDistinctSheets, nonMathBankQuestions } from "@/lib/worksheet/generator";
import { computeItemMastery, type ItemMastery } from "@/lib/worksheet/item-mastery";
import { masteryTarget, isSkillMastered } from "@/lib/mastery";
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
      const isTeacher = ctx.role === "TEACHER";

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
      const activeProgress =
        (requestedSubject
          ? inProgressEnabled.find((p) => p.level.subject.slug === requestedSubject)
          : undefined) ?? inProgressEnabled[0];

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

  // Skip worksheets the student has EVER completed in this level — not just
  // today's. (Excluding only today's meant every new day re-served the same
  // first sheets of the level, so students never saw new material.)
  const completedEver = await db.completedSheet.findMany({
    where: { studentId, worksheet: { levelId: progress.levelId } },
    select: { worksheetId: true },
  });
  const completedWorksheetIds = [...new Set(completedEver.map((c) => c.worksheetId))];

  const needed = Math.max(0, sheetsPerDay - completedToday.length);

  // Which skill is the packet currently working on?
  //  • MATH levels are sheet-number-driven (the engine raises difficulty by sheet
  //    number; the named "skills" are cosmetic) → always the first skill.
  //  • Reading/Writing/Science have DISTINCT content per skill, so the packet must
  //    stay on the first not-yet-mastered skill until it's mastered, then advance —
  //    otherwise the student spreads thin across skills and never unlocks the next.
  const isMath = progress.level?.subject?.slug === "MATH";
  const skills = progress.level?.skills ?? [];
  let activeSkill = skills[0];
  if (!isMath && skills.length > 1) {
    const subjectSlug = progress.level?.subject?.slug ?? "";
    const levelCode = progress.level?.code ?? "";
    const stats = await skillCompletionStats(studentId, progress.levelId);
    const itemStats = await itemMasteryBySkill(studentId, progress.level);
    activeSkill = skills.find((sk: any) => {
      const st = stats[sk.id];
      const n = st?.sheetsCompleted ?? 0;
      const avg = n > 0 ? st.totalAccuracy / n : 0;
      return !isSkillMastered({
        isMath: false,
        sheetsCompleted: n,
        avgAccuracy: avg,
        distinctSheets: nonMathDistinctSheets(subjectSlug, levelCode, sk.name),
        item: itemStats[sk.id],
      });
    }) ?? skills[skills.length - 1];
  }

  let nextWorksheets = await db.worksheet.findMany({
    where: {
      levelId: progress.levelId,
      id: { notIn: completedWorksheetIds },
      isActive: true,
      ...(isMath || !activeSkill ? {} : { skillId: activeSkill.id }),
    },
    include: { skill: true },
    orderBy: [{ skill: { sortOrder: "asc" } }, { sheetNumber: "asc" }],
    take: needed,
  });

  // AUTO-MINT: the seeded bank is small (a handful of sheets per skill). When
  // a student works past it, mint the next sheets on the fly from the clean
  // curriculum engine — sheetNumber keeps advancing, so difficulty rises
  // day over day exactly like the shop packs (Kumon pacing). Problems AND the
  // answer key are stored on the row, so grading stays consistent.
  const deficit = needed - nextWorksheets.length;
  const skill = activeSkill;
  if (deficit > 0 && skill) {
    // Worksheets are shared per-skill content, so two concurrent requests (two
    // tabs, or two students on the same skill) could otherwise create duplicate
    // (skillId, sheetNumber) rows. Serialize minting per (level, skill) with a
    // Postgres advisory lock and re-read the max sheet number INSIDE the lock so
    // numbers can never collide. The lock auto-releases at transaction end.
    const minted = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${progress.levelId}), hashtext(${skill.id}))`;
      const maxSheet = await tx.worksheet.aggregate({
        where: { levelId: progress.levelId, skillId: skill.id },
        _max: { sheetNumber: true },
      });
      let nextNum = (maxSheet._max.sheetNumber ?? 0) + 1;
      const created: typeof nextWorksheets = [];
      for (let i = 0; i < deficit; i++) {
        const { problems, answerKey } = generateProblems({
          subjectSlug: progress.level?.subject?.slug ?? "MATH",
          levelCode: progress.level?.code ?? "M3",
          skillName: skill.name,
          problemCount: 30,
          timeLimitMinutes: progress.level?.timeLimitMinutes ?? 10,
          // The engine's curriculum is 100 sheets; clamp so extreme long-running
          // students keep getting the hardest material rather than crashing.
          sheetNumber: Math.min(100, nextNum),
          totalSheets: 100,
        });
        created.push(await tx.worksheet.create({
          data: {
            levelId: progress.levelId,
            skillId: skill.id,
            sheetNumber: nextNum,
            title: `${skill.name} — Sheet ${nextNum}`,
            problems: problems as any,
            answerKey: answerKey as any,
            problemCount: problems.length,
            estimatedMinutes: progress.level?.timeLimitMinutes ?? 10,
          },
          include: { skill: true },
        }));
        nextNum++;
      }
      return created;
    }, { timeout: 20_000 });
    nextWorksheets.push(...minted);
  }

  const sheets: TodaySheet[] = [];

  // The clean engines teach a multi-unit progression inside one level, so a
  // sheet's honest title is its current unit (e.g. "Arithmetic sequences"),
  // not the parent skill ("Limits"). Resolve it server-side per sheet number.
  const unitOf = (sheetNumber: number, fallback: string) =>
    getMathSheetMeta(progress.level.code, sheetNumber)?.subSkillLabel ?? fallback;

  // Add completed sheets
  completedToday.forEach((cs, i) => {
    sheets.push({
      index: i + 1,
      worksheetId: cs.worksheetId,
      title: cs.worksheet.title,
      skillName: unitOf(cs.worksheet.sheetNumber, cs.worksheet.skill.name),
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
      skillName: unitOf(ws.sheetNumber, ws.skill.name),
      // Use the actual stored content length — the cached `problemCount` field can
      // be stale (e.g. a seeded "10" when the sheet really has 7), which showed a
      // wrong count on the card before the sheet was opened.
      problemCount: Array.isArray(ws.problems) ? (ws.problems as any[]).length : ws.problemCount,
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

// Mastery rules (MASTERY_ACCURACY, masteryTarget, isSkillMastered) live in
// @/lib/mastery so every route shares one source of truth.

/** Per-skill { sheetsCompleted, totalAccuracy } for a student in a level. */
async function skillCompletionStats(
  studentId: string,
  levelId: string
): Promise<Record<string, { sheetsCompleted: number; totalAccuracy: number }>> {
  const grouped = await db.completedSheet.groupBy({
    by: ["worksheetId"],
    where: { studentId, worksheet: { levelId } },
    _avg: { accuracyPct: true },
    _count: true,
  });
  const ws = await db.worksheet.findMany({
    where: { id: { in: grouped.map((g) => g.worksheetId) } },
    select: { id: true, skillId: true },
  });
  const out: Record<string, { sheetsCompleted: number; totalAccuracy: number }> = {};
  for (const g of grouped) {
    const w = ws.find((x) => x.id === g.worksheetId);
    if (!w) continue;
    const b = (out[w.skillId] ??= { sheetsCompleted: 0, totalAccuracy: 0 });
    b.sheetsCompleted += g._count;
    b.totalAccuracy += (g._avg.accuracyPct ?? 0) * g._count;
  }
  return out;
}

/**
 * Per-skill item-level mastery for a NON-MATH level. Loads each completed sheet
 * with its stored problems so answers (which carry only per-generation problem
 * ids) can be resolved back to question text, then dedupes across sheets by
 * question. Returns {} for MATH (engine = unbounded items, item coverage N/A).
 */
async function itemMasteryBySkill(
  studentId: string,
  level: any,
): Promise<Record<string, ItemMastery>> {
  const subjectSlug = level?.subject?.slug ?? "";
  const levelCode = level?.code ?? "";
  if (subjectSlug === "MATH") return {};

  const sheets = await db.completedSheet.findMany({
    where: { studentId, worksheet: { levelId: level.id } },
    select: {
      completedAt: true,
      answers: true,
      worksheet: { select: { skillId: true, problems: true } },
    },
  });

  const bySkill: Record<string, { completedAt: Date; answers: unknown; problems: unknown }[]> = {};
  for (const s of sheets) {
    const sid = s.worksheet?.skillId;
    if (!sid) continue;
    (bySkill[sid] ??= []).push({ completedAt: s.completedAt, answers: s.answers, problems: s.worksheet?.problems });
  }

  const out: Record<string, ItemMastery> = {};
  for (const skill of level.skills ?? []) {
    const bank = nonMathBankQuestions(subjectSlug, levelCode, skill.name);
    out[skill.id] = computeItemMastery(bySkill[skill.id] ?? [], bank);
  }
  return out;
}

async function buildSkillTree(
  studentId: string,
  level: any
): Promise<SkillTreeNode[]> {
  // Shared with buildTodayPacket — one grouping helper, not a copy.
  const skillStats = await skillCompletionStats(studentId, level.id);

  const isMathSubj = level.subject?.slug === "MATH";
  const itemStats = isMathSubj ? {} : await itemMasteryBySkill(studentId, level);

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
