// src/app/api/students/[id]/submit-sheet/route.ts
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, err, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { SubmitSheetSchema } from "@/lib/validation/schemas";
import { answersMatch } from "@/lib/grading";
import { getMathLevelSkills } from "@/lib/worksheet/generator";
import { isSheetFluent, isSheetOnPace, isAccurateButSlow, skillLabelFromTitle } from "@/lib/mastery/fluency";
import { isAlgorithmUnit } from "@/lib/shop/arithmetic-engine";
import { startOfDay, isSameDay, subDays } from "date-fns";
import type { GradedAnswer, SheetResult } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, SubmitSheetSchema);
    if ("status" in parsed) return parsed;
    const { worksheetId, answers } = parsed.data;
    // Clamp wall-clock time to a 2h cap (a student may leave the modal open for
    // hours); never reject a valid submission over elapsed time.
    const timeSeconds = Math.min(Math.max(0, Math.round(parsed.data.timeSeconds)), 7200);

    try {
      // Verify student ownership
      const student = await db.student.findUnique({
        where: { id: params.id },
      });
      if (!student) return notFound("Student");
      // AuthZ: the student themselves, an ADMIN, or a TEACHER actually linked to
      // this student. (A blanket TEACHER allowance let ANY self-registered
      // teacher account write grades/mastery for ANY child — cross-tenant IDOR.)
      if (student.userId !== ctx.userId && ctx.role !== "ADMIN" && ctx.role !== "SUPER_ADMIN") {
        const isLinkedTeacher =
          ctx.role === "TEACHER" &&
          (await db.teacherStudent.findFirst({
            where: { studentId: student.id, teacher: { userId: ctx.userId } },
            select: { id: true },
          })) !== null;
        if (!isLinkedTeacher) return forbidden();
      }

      // Load worksheet with answer key
      const worksheet = await db.worksheet.findUnique({
        where: { id: worksheetId },
        include: { level: true, skill: true },
      });
      if (!worksheet) return notFound("Worksheet");

      // ── Grade the submission (pure — done before the transaction) ──
      const answerKey = worksheet.answerKey as any[];
      // Options come from the PROBLEM, not the key: grading a capitalization
      // item ("july" vs "July") case-insensitively marks every option correct.
      const problems = (worksheet.problems as any[]) ?? [];
      const gradedAnswers: GradedAnswer[] = answers.map((submission) => {
        const correct = answerKey.find((k) => k.id === submission.problemId);
        const options = problems.find((p) => p?.id === submission.problemId)?.options as
          | string[]
          | undefined;
        const isCorrect = correct
          ? answersMatch(submission.answer, correct.answer, options)
          : false;
        return {
          problemId: submission.problemId,
          answer: submission.answer,
          correctAnswer: correct?.answer ?? "",
          isCorrect,
          points: isCorrect ? 1 : 0,
          explanation: correct?.explanation,
          // Per-problem first-try correctness, passed through as-is from the
          // client for the tutorial-pilot report's primary metric. Not used
          // for scoring/mastery — those already use firstTryAccuracyPct.
          ...(submission.firstTry !== undefined ? { firstTry: submission.firstTry } : {}),
        };
      });

      const gradedScore = gradedAnswers.filter((a) => a.isCorrect).length;
      const totalProblems = gradedAnswers.length;
      // Interactive practice retries till right, so grading the FINAL answers
      // always yields ~100%. Prefer the client's honest first-try accuracy for
      // the recorded score + mastery; paper submissions omit it (final == first try).
      // Server-side bound: first-try accuracy can never EXCEED the final graded
      // accuracy (retries only improve answers). Clamp so a tampered client
      // can't claim 100% mastery while submitting wrong final answers.
      const finalPct = Math.round((gradedScore / Math.max(totalProblems, 1)) * 100);
      const ftRaw = parsed.data.firstTryAccuracyPct;
      const ft = ftRaw != null ? Math.min(Math.max(0, Math.round(ftRaw)), finalPct) : null;
      const accuracyPct = ft != null ? ft : finalPct;
      const score = ft != null ? Math.round((accuracyPct / 100) * totalProblems) : gradedScore;

      // ── Persist atomically. An advisory lock on (student, level) serializes
      // concurrent submissions for this student+level so the daily count is
      // reliable — double-taps / two sheets landing at once can neither skip the
      // quota trigger nor double-advance the skill, and the double-submit guard
      // is race-safe. All writes commit together or not at all. ──
      let completedSheet;
      let masteryStatus;
      try {
        const out = await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.id}), hashtext(${worksheet.levelId}))`;

          // Double-submit guard (safe under the lock) — but a FAILED sheet is
          // re-served by the repeat-on-fail packet, so it must be RETAKEABLE.
          // Field report (Ridwan): failed sheet showed "Up next" but retrying
          // hit "already submitted" — a deadlock. Passed sheets stay locked;
          // failed ones update IN PLACE (latest attempt wins, counted once).
          const bar = (worksheet as any).level?.masteryThresholdPct ?? 90;
          const dup = await tx.completedSheet.findFirst({
            where: { studentId: params.id, worksheetId, completedAt: { gte: appDayStart(new Date(), (student as any).timezone) } },
            select: { id: true, accuracyPct: true },
          });
          if (dup && dup.accuracyPct >= bar) throw new DuplicateSubmitError();

          let cs;
          if (dup) {
            // Retake of a failed sheet: replace the attempt, don't add a row —
            // quota/mastery counts stay one-per-worksheet.
            cs = await tx.completedSheet.update({
              where: { id: dup.id },
              data: { answers: gradedAnswers as any, score, totalProblems, accuracyPct, timeSeconds, completedAt: new Date() },
            });
            const ms = await updateProgressAndMastery(tx, params.id, worksheet.levelId, accuracyPct, (student as any).timezone, true);
            await tx.student.update({ where: { id: params.id }, data: { lastActiveDate: new Date() } });
            return { cs, ms };
          }

          cs = await tx.completedSheet.create({
            data: { studentId: params.id, worksheetId, answers: gradedAnswers as any, score, totalProblems, accuracyPct, timeSeconds },
          });
          const ms = await updateProgressAndMastery(tx, params.id, worksheet.levelId, accuracyPct, (student as any).timezone);
          await tx.student.update({
            where: { id: params.id },
            data: { totalSheetsCompleted: { increment: 1 }, lastActiveDate: new Date() },
          });
          return { cs, ms };
        });
        completedSheet = out.cs;
        masteryStatus = out.ms;
      } catch (e) {
        if (e instanceof DuplicateSubmitError) return err("This sheet has already been submitted today", 409);
        throw e;
      }

      // ── Post-commit, non-critical side effects (self-healing; never block or
      // fail the submission). ──
      await updateStreak(params.id).catch(console.error);

      // ── Check and award badges ──
      const newBadges = await checkAndAwardBadges(params.id, {
        accuracyPct,
        score,
        totalProblems,
      }).catch((e) => { console.error(e); return [] as any[]; });

      // ── Notify parent if level advanced ──
      if (masteryStatus.isReadyToAdvance) {
        triggerLevelAdvance(params.id, worksheet.levelId).catch(console.error);
      }

      // ── Realtime broadcast ──
      const { broadcast, studentChannel } = await import("@/lib/realtime/server");
      broadcast([studentChannel(params.id)], "sheet_completed", {
        worksheetId,
        accuracyPct,
        score,
        totalProblems,
      }).catch(console.error);
      if (masteryStatus.isReadyToAdvance) {
        broadcast([studentChannel(params.id)], "level_advanced", {
          oldLevelCode: worksheet.level.code,
        }).catch(console.error);
      }
      if (newBadges && newBadges.length > 0) {
        broadcast([studentChannel(params.id)], "badge_earned", {
          badges: newBadges,
        }).catch(console.error);
      }

      // Accurate but too slow on a fact sheet → the sheet will repeat; tell the
      // child warmly that the answers were great and the goal now is speed.
      const accurateButSlow = isAccurateButSlow({
        levelCode: worksheet.level.code, skillLabel: skillLabelFromTitle(worksheet.title),
        accuracyPct, thresholdPct: worksheet.level.masteryThresholdPct,
        timeSeconds, problemCount: totalProblems,
      });
      const feedback = buildFeedback(accuracyPct, masteryStatus.consecutivePassDays, accurateButSlow);

      const result: SheetResult = {
        completedSheetId: completedSheet.id,
        score,
        totalProblems,
        accuracyPct,
        timeSeconds,
        gradedAnswers,
        feedback,
        masteryStatus,
      };

      return ok(result);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

// ─────────────────────────────────────────────
// Grading helpers
// ─────────────────────────────────────────────

// Thrown inside the transaction to abort + surface a 409 for a duplicate submit.
class DuplicateSubmitError extends Error {}

// Runs on the transaction client (`tx`) so all mastery/advancement writes commit
// atomically with the completed-sheet row.
async function updateProgressAndMastery(
  tx: Prisma.TransactionClient,
  studentId: string,
  levelId: string,
  accuracyPct: number,
  timezone?: string | null,
  // Retake of a failed sheet: the attempt row was UPDATED in place, so the
  // per-sheet counters must not increment again — only accuracy/advancement.
  isRetake = false
): Promise<{
  consecutivePassDays: number;
  daysUntilAdvance: number;
  isReadyToAdvance: boolean;
}> {
  const level = await tx.level.findUnique({ where: { id: levelId }, include: { subject: true } });
  if (!level) throw new Error("Level not found");

  const progress = await tx.studentProgress.upsert({
    where: { studentId_levelId: { studentId, levelId } },
    create: {
      studentId,
      levelId,
      status: "IN_PROGRESS",
      sheetsCompleted: 1,
      correctAnswers: 0,
      totalAnswers: 0,
      consecutivePassDays: accuracyPct >= level.masteryThresholdPct ? 1 : 0,
      lastAccuracyPct: accuracyPct,
    },
    update: {
      ...(isRetake ? {} : { sheetsCompleted: { increment: 1 } }),
      lastAccuracyPct: accuracyPct,
    },
  });

  // Record daily accuracy
  const today = appDayStart(new Date(), timezone);
  const dailyRecord = await tx.dailyAccuracy.upsert({
    where: {
      studentProgressId_date: {
        studentProgressId: progress.id,
        date: today,
      },
    },
    create: {
      studentProgressId: progress.id,
      date: today,
      accuracyPct,
      sheetsCompleted: 1,
      totalProblems: 1,
      correctProblems: accuracyPct >= level.masteryThresholdPct ? 1 : 0,
    },
    update: {
      // A retake replaces its sheet's row rather than adding one, so counting
      // it here would drift this record away from the real sheet count. The
      // true count and average are written below, once today's sheets are read.
      ...(isRetake ? {} : { sheetsCompleted: { increment: 1 } }),
    },
  });

  // ── Skill-map advancement (one lesson per day) ──
  // The student progresses through the level's SKILL MAP one lesson at a time.
  // When they complete a day's packet (sheetsPerDay sheets) with an AVERAGE ≥
  // threshold, the NEXT skill unlocks for tomorrow. Clearing the LAST skill
  // masters the level → the next level activates.
  const isMath = level.subject?.slug === "MATH";
  // MUST match buildTodayPacket's formula exactly. When an admin raises a
  // child's daily load, the packet serves the higher count — if the gate kept
  // using the level default it would clear the day early (or, with the count
  // check, never clear at all).
  const levelPerDay = level.sheetsPerDay ?? 3;
  const override = (progress as any).dailySheetsOverride as number | null;
  const sheetsPerDay = override ? Math.max(override, levelPerDay) : levelPerDay;
  // Quota window: from midnight, OR from an admin skill-unlock today
  // (set-skill stamps skillUnlockedAt). This keeps pre-unlock sheets from a
  // DIFFERENT lesson counting toward clearing the just-unlocked one — without
  // it, 2 sheets of lesson A + 1 sheet of freshly-unlocked lesson C would hit
  // `=== sheetsPerDay` and silently advance PAST C. Must match buildTodayPacket.
  const unlockedAt = (progress as any).skillUnlockedAt as Date | null;
  const quotaStart = unlockedAt && unlockedAt > today ? unlockedAt : today;
  const todaySheets = await tx.completedSheet.findMany({
    where: { studentId, worksheet: { levelId }, completedAt: { gte: quotaStart } },
    select: { accuracyPct: true, timeSeconds: true, totalProblems: true, worksheet: { select: { title: true } } },
  });
  const todayCount = todaySheets.length;
  const todayAvg = todayCount ? todaySheets.reduce((a, s) => a + s.accuracyPct, 0) / todayCount : 0;
  // FLUENCY GATE (fact levels M3–M6): the day clears only when every fact sheet
  // was on pace too — accurate-but-slow means the facts aren't automatic yet, so
  // the student repeats rather than advances (the slow sheet is re-served by
  // today-packet's retirement rule). Non-fact skills have no pace target → this
  // is always true, so their behaviour is unchanged.
  const allFluent = todaySheets.every((s) =>
    isSheetOnPace({
      levelCode: level.code, skillLabel: skillLabelFromTitle(s.worksheet?.title),
      timeSeconds: s.timeSeconds, problemCount: s.totalProblems,
    }));
  // LEARNING DAY (expert rule): the FIRST day a child meets an algorithm unit
  // (a multi-step written procedure, not fact recall), the day clears on
  // COMPLETION, not accuracy — grading day 1 of an algorithm at >=90% evaluates
  // the child on the acquisition day. Applies only when no sheet of this unit
  // was completed on any earlier day. MUST match the dashboard's computation.
  const todayLabel = skillLabelFromTitle(todaySheets[todaySheets.length - 1]?.worksheet?.title);
  let learningDay = false;
  if (isAlgorithmUnit(todayLabel)) {
    const earlier = await tx.completedSheet.findFirst({
      where: {
        studentId,
        worksheet: { levelId, title: { contains: todayLabel! } },
        completedAt: { lt: today },
      },
      select: { id: true },
    });
    learningDay = !earlier;
  }
  // The day's record must reflect the day as it actually stands: a retake
  // replaces a sheet's score, so the average has to be recomputed rather than
  // left at whatever the first sheet scored. The streak below reads this.
  await tx.dailyAccuracy.update({
    where: { id: dailyRecord.id },
    data: { accuracyPct: todayAvg, sheetsCompleted: todayCount },
  });

  // Trigger exactly once — on the sheet that COMPLETES the day's quota at ≥
  // threshold AND on pace. `clearedAt` makes it once per DAY, not once per
  // qualifying submission: retakes keep the sheet count at quota, so without
  // this every further retake would advance the skill map again.
  const alreadyCleared = dailyRecord.clearedAt !== null;
  const dayCleared =
    !alreadyCleared &&
    // AT LEAST the quota, not EXACTLY it. A child who does extra practice
    // pushed todayCount past sheetsPerDay and the day could then never clear
    // - keen work was punished. Safe now that clearedAt makes clearing
    // once-per-day; before that guard, ">=" would have re-fired on every
    // further sheet.
    todayCount >= sheetsPerDay &&
    (learningDay || (todayAvg >= level.masteryThresholdPct && allFluent));
  if (dayCleared) {
    await tx.dailyAccuracy.update({
      where: { id: dailyRecord.id },
      data: { clearedAt: new Date() },
    });
  }

  // Streak display: days-in-a-row at ≥ threshold.
  const recentDays = await tx.dailyAccuracy.findMany({
    where: { studentProgressId: progress.id }, orderBy: { date: "desc" }, take: 30,
  });
  let consecutivePassDays = 0;
  for (const day of recentDays) { if (day.accuracyPct >= level.masteryThresholdPct) consecutivePassDays++; else break; }

  let isReadyToAdvance = false;   // whole level mastered (→ next level)
  if (isMath) {
    const skills = getMathLevelSkills(level.code);
    const curIdx = progress.currentSkillIndex ?? 0;
    if (dayCleared) {
      if (skills.length > 0 && curIdx < skills.length - 1) {
        // Advance to the next lesson (starts tomorrow).
        await tx.studentProgress.update({ where: { id: progress.id }, data: { currentSkillIndex: curIdx + 1, consecutivePassDays } });
      } else {
        isReadyToAdvance = true; // last lesson cleared → master the level
      }
    }
    if (!dayCleared || isReadyToAdvance) {
      await tx.studentProgress.update({
        where: { id: progress.id },
        data: { consecutivePassDays, status: isReadyToAdvance ? "MASTERED" : "IN_PROGRESS", masteredAt: isReadyToAdvance ? new Date() : undefined },
      });
    }
  } else {
    // Non-math (Reading/Writing/Science) keeps the prior sheet-based level mastery
    // (≥5 sheets at threshold over ≥3 distinct days) — unchanged this pass.
    const passing = await tx.completedSheet.findMany({
      where: { studentId, worksheet: { levelId }, accuracyPct: { gte: level.masteryThresholdPct } },
      select: { completedAt: true }, take: 60,
    });
    const distinctDays = new Set(passing.map((s) => startOfDay(s.completedAt).toISOString().slice(0, 10))).size;
    isReadyToAdvance = passing.length >= 5 && distinctDays >= 3;
    await tx.studentProgress.update({
      where: { id: progress.id },
      data: { consecutivePassDays, status: isReadyToAdvance ? "MASTERED" : "IN_PROGRESS", masteredAt: isReadyToAdvance ? new Date() : undefined },
    });
  }

  // ── Activate the NEXT level on mastery (was missing — the student otherwise
  // dead-ended with no IN_PROGRESS level). Flip the next level (by sortOrder)
  // to IN_PROGRESS so the dashboard immediately serves new content. ──
  if (isReadyToAdvance) {
    const nextLevel = await tx.level.findFirst({
      where: { subjectId: level.subjectId, sortOrder: { gt: level.sortOrder } },
      orderBy: { sortOrder: "asc" },
    });
    if (nextLevel) {
      await tx.studentProgress.upsert({
        where: { studentId_levelId: { studentId, levelId: nextLevel.id } },
        create: { studentId, levelId: nextLevel.id, status: "IN_PROGRESS", lastAccuracyPct: 0 },
        update: { status: "IN_PROGRESS" },
      });
    }
  }

  return {
    consecutivePassDays,
    daysUntilAdvance: Math.max(0, sheetsPerDay - todayCount), // sheets left in today's packet
    isReadyToAdvance,
  };
}

async function updateStreak(studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;

  const today = appDayStart(new Date(), (student as any).timezone);
  const yesterday = subDays(today, 1);
  const lastActive = student.lastActiveDate
    ? startOfDay(student.lastActiveDate)
    : null;

  let newStreak = student.currentStreak;

  if (!lastActive) {
    newStreak = 1;
  } else if (isSameDay(lastActive, today)) {
    // Already counted today, no change
    return;
  } else if (isSameDay(lastActive, yesterday)) {
    // Consecutive day — increment
    newStreak = student.currentStreak + 1;
  } else {
    // Streak broken
    newStreak = 1;
  }

  await db.student.update({
    where: { id: studentId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, student.longestStreak),
      lastActiveDate: new Date(),
    },
  });
}

async function checkAndAwardBadges(
  studentId: string,
  context: { accuracyPct: number; score: number; totalProblems: number }
) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { badges: true },
  });
  if (!student) return;

  const allBadges = await db.badge.findMany({ where: { isActive: true } });
  const earnedSlugs = new Set(student.badges.map((b: any) => b.badgeId));

  const toAward: string[] = [];

  for (const badge of allBadges) {
    if (earnedSlugs.has(badge.id)) continue;
    const criteria = badge.criteria as any;

    let earned = false;
    switch (criteria.type) {
      case "perfect_score":
        earned = context.accuracyPct === 100;
        break;
      case "streak":
        earned = student.currentStreak >= criteria.threshold;
        break;
      case "sheets_completed":
        earned = student.totalSheetsCompleted >= criteria.threshold;
        break;
    }

    if (earned) toAward.push(badge.id);
  }

  if (toAward.length > 0) {
    await db.studentBadge.createMany({
      data: toAward.map((badgeId) => ({ studentId, badgeId })),
      skipDuplicates: true,
    });
  }
}

async function triggerLevelAdvance(studentId: string, levelId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { user: true, parentLinks: { include: { parent: { include: { user: true } } } } },
  });
  const level = await db.level.findUnique({
    where: { id: levelId },
    include: { subject: true },
  });
  if (!student || !level) return;

  // Create notification for student
  await db.notification.create({
    data: {
      userId: student.userId,
      type: "LEVEL_ADVANCED",
      title: `You advanced to the next level! 🎉`,
      message: `You've mastered ${level.name}. Your next level is now unlocked.`,
    },
  });

  // Notify parents
  for (const link of student.parentLinks) {
    await db.notification.create({
      data: {
        userId: link.parent.userId,
        type: "LEVEL_ADVANCED",
        title: `${student.user.firstName} advanced a level!`,
        message: `${student.user.firstName} mastered ${level.name} in ${level.subject.name}.`,
      },
    });
  }
}

function buildFeedback(
  accuracyPct: number,
  consecutivePassDays: number,
  accurateButSlow = false
): string {
  // Accurate but slow: celebrate the accuracy, reframe the goal as speed. The
  // sheet repeats tomorrow so the facts become automatic.
  if (accurateButSlow) return "Great — all your answers are strong! Now let's build speed: you'll get this same sheet next time. Try to beat your time. ⏱️";
  if (accuracyPct === 100) return "Perfect score! Outstanding work.";
  if (accuracyPct >= 90) {
    return `Excellent — ${consecutivePassDays > 1 ? `${consecutivePassDays} passing days in a row!` : "Keep it up!"}`;
  }
  if (accuracyPct >= 80) return "Good work! A few more to go before mastery.";
  if (accuracyPct >= 60) return "Keep practicing — you're making progress.";
  return "Don't give up! Extra review sheets have been added to help.";
}
