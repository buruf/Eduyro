// src/lib/cron/jobs/streak-maintenance.ts
// Runs daily at 11:59pm — resets streaks for students who didn't complete
// any worksheets today, and awards streak milestone badges.

import { appDayStart } from "@/lib/time";
import { db } from "@/lib/db";
import { sendStreakMilestoneEmail } from "@/lib/email";
import { startOfDay, subDays } from "date-fns";

const STREAK_MILESTONES = [7, 14, 30, 50, 100];

export async function runStreakMaintenance(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  // Prefetch a 2-day window, then evaluate "today" PER STUDENT in their own
  // timezone (students are worldwide — one global UTC day mis-scores evening
  // workers and the far side of the date line).
  const windowStart = subDays(new Date(), 2);

  const allStudents = await db.student.findMany({
    include: {
      user: true,
      completedSheets: {
        where: { completedAt: { gte: windowStart } },
        select: { completedAt: true },
      },
      // Parent-excused day today → treat like a non-penalized day (streak holds).
      dailyPackets: {
        where: { skipped: true, date: { gte: windowStart } },
        select: { date: true },
      },
    },
  });

  let streaksMaintained = 0;
  let streaksBroken = 0;
  let milestonesAwarded = 0;

  // Resolve milestone badges once
  const milestoneBadges = await db.badge.findMany({
    where: { slug: { in: STREAK_MILESTONES.map((d) => `streak-${d}`) } },
  });

  for (const student of allStudents) {
    // "Today" in THIS student's timezone.
    const dayStart = appDayStart(new Date(), (student as any).timezone);
    const completedAnyToday = student.completedSheets.some((s: any) => s.completedAt >= dayStart);

    if (completedAnyToday) {
      // Streak continues — increment if this is a new day relative to lastActiveDate
      const lastActive = student.lastActiveDate;
      const wasYesterday = lastActive && lastActive >= subDays(dayStart, 1) && lastActive < dayStart;
      const wasToday = lastActive && lastActive >= dayStart;

      if (!wasToday) {
        // Increment streak
        const newStreak = wasYesterday ? student.currentStreak + 1 : 1;
        const newLongest = Math.max(student.longestStreak, newStreak);

        await db.student.update({
          where: { id: student.id },
          data: {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastActiveDate: new Date(),
          },
        });
        streaksMaintained++;

        // Award milestone badge if hit
        if (STREAK_MILESTONES.includes(newStreak)) {
          const badge = milestoneBadges.find((b) => b.slug === `streak-${newStreak}`);
          if (badge) {
            // Only award if not already earned
            const existing = await db.studentBadge.findFirst({
              where: { studentId: student.id, badgeId: badge.id },
            });
            if (!existing) {
              await db.studentBadge.create({
                data: { studentId: student.id, badgeId: badge.id },
              });
              await db.notification.create({
                data: {
                  userId: student.userId,
                  type: "STREAK_MILESTONE",
                  title: `Badge earned: ${badge.name}`,
                  message: `${newStreak}-day streak! ${badge.iconEmoji}`,
                },
              });
              // Send streak milestone email
              if (student.user.email) {
                sendStreakMilestoneEmail({
                  email: student.user.email,
                  firstName: student.user.firstName ?? "there",
                  streakDays: newStreak,
                }).catch(console.error);
              }
              milestonesAwarded++;
            }
          }
        }
      }
    } else {
      // No work today — check if streak should break
      // Allow weekends, and parent-excused ("skipped") days, to not break the streak
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isExcused = student.dailyPackets.some((p: any) => p.date >= dayStart);

      if (!isWeekend && !isExcused && student.currentStreak > 0) {
        await db.student.update({
          where: { id: student.id },
          data: { currentStreak: 0 },
        });
        streaksBroken++;
      }
    }
  }

  return {
    recordsProcessed: allStudents.length,
    metadata: { streaksMaintained, streaksBroken, milestonesAwarded },
  };
}
