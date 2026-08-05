// src/app/api/admin/students/route.ts
// GET — student/learning oversight for the platform owner. Lists students with
// activity & mastery signals and flags those who look stuck or struggling so the
// owner can spot learning problems platform-wide. ADMIN / SUPER_ADMIN only.
//   ?q= search (name/email)   ?filter=struggling|inactive|all
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const url = new URL(req.url);
      const q = url.searchParams.get("q")?.trim() ?? "";
      const filter = url.searchParams.get("filter") ?? "all";
      const inactiveCutoff = subDays(new Date(), 7);

      const students = await db.student.findMany({
        where: q
          ? { user: { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } }
          : undefined,
        select: {
          id: true, grade: true, currentStreak: true, longestStreak: true,
          lastActiveDate: true, totalSheetsCompleted: true,
          user: { select: { name: true, email: true } },
          progress: { select: { status: true, lastAccuracyPct: true, correctAnswers: true, totalAnswers: true } },
        },
        orderBy: { lastActiveDate: { sort: "desc", nulls: "last" } },
        take: 200,
      });

      const rows = students.map(s => {
        const mastered = s.progress.filter(p => p.status === "MASTERED").length;
        const inProgress = s.progress.filter(p => p.status === "IN_PROGRESS").length;
        const totals = s.progress.reduce((a, p) => ({ c: a.c + p.correctAnswers, t: a.t + p.totalAnswers }), { c: 0, t: 0 });
        const avgAccuracy = totals.t > 0 ? Math.round((totals.c / totals.t) * 100) : null;
        // "Struggling": has attempted real work but lifetime accuracy is weak.
        const struggling = totals.t >= 20 && avgAccuracy != null && avgAccuracy < 60;
        const inactive = !s.lastActiveDate || s.lastActiveDate < inactiveCutoff;
        return {
          id: s.id, name: s.user.name, email: s.user.email, grade: s.grade,
          currentStreak: s.currentStreak, longestStreak: s.longestStreak,
          lastActiveDate: s.lastActiveDate, totalSheets: s.totalSheetsCompleted,
          mastered, inProgress, avgAccuracy, struggling, inactive,
        };
      });

      const filtered = filter === "struggling" ? rows.filter(r => r.struggling)
        : filter === "inactive" ? rows.filter(r => r.inactive)
        : rows;

      return ok({
        students: filtered,
        summary: {
          total: rows.length,
          struggling: rows.filter(r => r.struggling).length,
          inactive: rows.filter(r => r.inactive).length,
          activeThisWeek: rows.filter(r => !r.inactive).length,
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
