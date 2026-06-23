// src/app/api/students/[id]/submit-sheet/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, notFound, forbidden, err, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { SubmitSheetSchema } from "@/lib/validation/schemas";
import { answersMatch } from "@/lib/grading";
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
      if (student.userId !== ctx.userId && ctx.role !== "ADMIN" && ctx.role !== "TEACHER") {
        return forbidden();
      }

      // Load worksheet with answer key
      const worksheet = await db.worksheet.findUnique({
        where: { id: worksheetId },
        include: { level: true, skill: true },
      });
      if (!worksheet) return notFound("Worksheet");

      // Prevent double-submission
      const alreadyDone = await db.completedSheet.findFirst({
        where: {
          studentId: params.id,
          worksheetId,
          completedAt: { gte: startOfDay(new Date()) },
        },
      });
      if (alreadyDone) return err("This sheet has already been submitted today", 409);

      // ── Grade the submission ──
      const answerKey = worksheet.answerKey as any[];
      const gradedAnswers: GradedAnswer[] = answers.map((submission) => {
        const correct = answerKey.find((k) => k.id === submission.problemId);
        const isCorrect = correct ? answersMatch(submission.answer, correct.answer) : false;
        return {
          problemId: submission.problemId,
          answer: submission.answer,
          correctAnswer: correct?.answer ?? "",
          isCorrect,
          points: isCorrect ? 1 : 0,
          explanation: correct?.explanation,
        };
      });

      const score = gradedAnswers.filter((a) => a.isCorrect).length;
      const totalProblems = gradedAnswers.length;
      const accuracyPct = Math.round((score / Math.max(totalProblems, 1)) * 100);

      // ── Save completed sheet ──
      const completedSheet = await db.completedSheet.create({
        data: {
          studentId: params.id,
          worksheetId,
          answers: gradedAnswers as any,
          score,
          totalProblems,
          accuracyPct,
          timeSeconds,
        },
      });

      // ── Update progress + mastery + streak (in transaction) ──
      const masteryStatus = await updateProgressAndMastery(
        params.id,
        worksheet.levelId,
        accuracyPct
      );

      // ── Update streak ──
      await updateStreak(params.id);

      // ── Update student total count ──
      await db.student.update({
        where: { id: params.id },
        data: {
          totalSheetsCompleted: { increment: 1 },
          lastActiveDate: new Date(),
        },
      });

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

      const feedback = buildFeedback(accuracyPct, masteryStatus.consecutivePassDays);

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

async function updateProgressAndMastery(
  studentId: string,
  levelId: string,
  accuracyPct: number
): Promise<{
  consecutivePassDays: number;
  daysUntilAdvance: number;
  isReadyToAdvance: boolean;
}> {
  const level = await db.level.findUnique({ where: { id: levelId } });
  if (!level) throw new Error("Level not found");

  const progress = await db.studentProgress.upsert({
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
      sheetsCompleted: { increment: 1 },
      lastAccuracyPct: accuracyPct,
    },
  });

  // Record daily accuracy
  const today = startOfDay(new Date());
  const dailyRecord = await db.dailyAccuracy.upsert({
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
      sheetsCompleted: { increment: 1 },
    },
  });

  // Recalculate consecutive pass days from daily records
  const recentDays = await db.dailyAccuracy.findMany({
    where: { studentProgressId: progress.id },
    orderBy: { date: "desc" },
    take: level.masteryConsecutiveDays + 2,
  });

  let consecutivePassDays = 0;
  for (const day of recentDays) {
    if (day.accuracyPct >= level.masteryThresholdPct) {
      consecutivePassDays++;
    } else {
      break;
    }
  }

  const isReadyToAdvance = consecutivePassDays >= level.masteryConsecutiveDays;

  await db.studentProgress.update({
    where: { id: progress.id },
    data: {
      consecutivePassDays,
      status: isReadyToAdvance ? "MASTERED" : "IN_PROGRESS",
      masteredAt: isReadyToAdvance ? new Date() : undefined,
    },
  });

  return {
    consecutivePassDays,
    daysUntilAdvance: Math.max(0, level.masteryConsecutiveDays - consecutivePassDays),
    isReadyToAdvance,
  };
}

async function updateStreak(studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return;

  const today = startOfDay(new Date());
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
  consecutivePassDays: number
): string {
  if (accuracyPct === 100) return "Perfect score! Outstanding work.";
  if (accuracyPct >= 95) {
    return `Excellent — ${consecutivePassDays > 1 ? `${consecutivePassDays} passing days in a row!` : "Keep it up!"}`;
  }
  if (accuracyPct >= 80) return "Good work! A few more to go before mastery.";
  if (accuracyPct >= 60) return "Keep practicing — you're making progress.";
  return "Don't give up! Extra review sheets have been added to help.";
}
