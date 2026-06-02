// src/lib/cron/jobs/weekly-progress.ts
import { db } from "@/lib/db";
import { sendWeeklyProgressEmail } from "@/lib/email";
import { startOfDay, subDays, format } from "date-fns";
import { batchProcess } from "@/lib/cron";

export async function runWeeklyProgressJob(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  const weekStart = startOfDay(subDays(new Date(), 7));

  // User -> parent -> children (ParentStudent[]) -> student
  // dailyAccuracy lives on StudentProgress, not Student
  const parents = await db.user.findMany({
    where: {
      role: "PARENT",
      parent: {
        children: {
          some: {
            student: {
              progress: { some: { status: "IN_PROGRESS" } },
            },
          },
        },
      },
    },
    include: {
      parent: {
        include: {
          children: {
            include: {
              student: {
                include: {
                  progress: {
                    where:   { status: "IN_PROGRESS" },
                    include: {
                      level: { include: { subject: true } },
                      dailyAccuracy: {
                        where:   { date: { gte: weekStart } },
                        orderBy: { date: "desc" },
                      },
                    },
                    take: 1,
                  },
                  completedSheets: {
                    where:  { completedAt: { gte: weekStart } },
                    select: { id: true, accuracyPct: true },
                  },
                  badges: {
                    where:  { earnedAt: { gte: weekStart } },
                    select: { badgeId: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  let emailsSent = 0;

  const { failures } = await batchProcess(
    parents,
    5,
    async (user) => {
      if (!user.parent?.children?.length) return;

      const children = user.parent.children.map((link: any) => {
        const student  = link.student;
        const progress = student.progress[0];
        const sheets   = student.completedSheets;

        // dailyAccuracy is on progress, not student
        const accuracy = progress?.dailyAccuracy ?? [];
        const avgAccuracy = accuracy.length > 0
          ? Math.round(accuracy.reduce((s: number, d: any) => s + d.accuracyPct, 0) / accuracy.length)
          : null;

        return {
          name:             student.firstName ?? "Student",
          levelCode:        progress?.level?.code ?? "—",
          levelName:        progress?.level?.name ?? "—",
          subjectName:      progress?.level?.subject?.name ?? "—",
          sheetsThisWeek:   sheets.length,
          avgAccuracy,
          streak:           student.currentStreak ?? 0,
          newBadges:        student.badges.map((b: any) => b.badgeId),
          daysUntilAdvance: progress?.consecutivePassDays != null
            ? Math.max(0, 5 - progress.consecutivePassDays)
            : null,
        };
      }).filter((c: any) => c.sheetsThisWeek > 0);

      if (children.length === 0) return;

      await sendWeeklyProgressEmail({
        email:     user.email,
        firstName: user.firstName ?? "there",
        weekOf:    format(weekStart, "MMMM d, yyyy"),
        children,
      });

      emailsSent++;
    }
  );

  return {
    recordsProcessed: emailsSent,
    metadata: { emailsSent, failures: failures.length },
  };
}
