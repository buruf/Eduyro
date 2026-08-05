// src/app/api/admin/insights/route.ts
// The "Insights" admin page: Progress Engine + Curriculum Heat Map + subject
// analytics in one payload. Everything derives from CompletedSheet — no new
// tracking. ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const today = startOfDay(new Date());
      const last30 = subDays(new Date(), 30);
      const last7 = subDays(new Date(), 7);

      // Sheets in the last 30 days with skill/level/subject context.
      const sheets = await db.completedSheet.findMany({
        where: { completedAt: { gte: last30 } },
        select: {
          studentId: true,
          accuracyPct: true,
          timeSeconds: true,
          completedAt: true,
          worksheet: {
            select: {
              title: true,
              skill: { select: { name: true } },
              level: { select: { code: true, masteryThresholdPct: true, sheetsPerDay: true, subject: { select: { slug: true, name: true } } } },
            },
          },
        },
      });

      // ── Progress engine ──
      const byStudentToday = new Map<string, { count: number; sum: number; bar: number; perDay: number }>();
      for (const s of sheets) {
        if (s.completedAt < today) continue;
        const cur = byStudentToday.get(s.studentId) ?? { count: 0, sum: 0, bar: s.worksheet.level.masteryThresholdPct ?? 90, perDay: s.worksheet.level.sheetsPerDay ?? 3 };
        cur.count++; cur.sum += s.accuracyPct;
        byStudentToday.set(s.studentId, cur);
      }
      let passedToday = 0, activeToday = 0;
      for (const v of byStudentToday.values()) {
        activeToday++;
        if (v.count >= v.perDay && v.sum / v.count >= v.bar) passedToday++;
      }
      // "Repeating": students who failed at least one sheet below its level's bar
      // in the last 7 days (those sheets are re-served by repeat-on-fail).
      const repeating = new Set<string>();
      for (const s of sheets) {
        if (s.completedAt >= last7 && s.accuracyPct < (s.worksheet.level.masteryThresholdPct ?? 90)) repeating.add(s.studentId);
      }

      // ── Skill heat map (last 30 days, min 5 attempts to rank) ──
      const bySkill = new Map<string, { skill: string; subject: string; level: string; sum: number; n: number; fails: number }>();
      for (const s of sheets) {
        const key = `${s.worksheet.level.code}·${s.worksheet.skill.name}`;
        const cur = bySkill.get(key) ?? { skill: s.worksheet.skill.name, subject: s.worksheet.level.subject.slug, level: s.worksheet.level.code, sum: 0, n: 0, fails: 0 };
        cur.sum += s.accuracyPct; cur.n++;
        if (s.accuracyPct < (s.worksheet.level.masteryThresholdPct ?? 90)) cur.fails++;
        bySkill.set(key, cur);
      }
      const heatmap = [...bySkill.values()]
        .map((v) => ({ skill: v.skill, subject: v.subject, level: v.level, attempts: v.n, avgAccuracy: Math.round(v.sum / v.n), failRatePct: Math.round((v.fails / v.n) * 100) }))
        .sort((a, b) => a.avgAccuracy - b.avgAccuracy);
      const ranked = heatmap.filter((h) => h.attempts >= 5);
      const lowestMastery = ranked[0] ?? heatmap[0] ?? null;
      const highestFailure = [...ranked].sort((a, b) => b.failRatePct - a.failRatePct)[0] ?? null;

      // ── Subject analytics ──
      const bySubject = new Map<string, { name: string; sum: number; n: number; time: number; timeN: number; pass: number }>();
      for (const s of sheets) {
        const slug = s.worksheet.level.subject.slug;
        const cur = bySubject.get(slug) ?? { name: s.worksheet.level.subject.name, sum: 0, n: 0, time: 0, timeN: 0, pass: 0 };
        cur.sum += s.accuracyPct; cur.n++;
        if (s.timeSeconds) { cur.time += s.timeSeconds; cur.timeN++; }
        if (s.accuracyPct >= (s.worksheet.level.masteryThresholdPct ?? 90)) cur.pass++;
        bySubject.set(slug, cur);
      }
      const subjects = [...bySubject.entries()].map(([slug, v]) => ({
        slug, name: v.name, sheets: v.n,
        avgAccuracy: Math.round(v.sum / v.n),
        passRatePct: Math.round((v.pass / v.n) * 100),
        avgMinutes: v.timeN ? Math.round(v.time / v.timeN / 60) : null,
      }));

      const avgMastery = sheets.length ? Math.round((sheets.reduce((a, s) => a + s.accuracyPct, 0) / sheets.length) * 10) / 10 : 0;

      return ok({
        engine: {
          passedToday,
          activeToday,
          repeating7d: repeating.size,
          avgMastery30d: avgMastery,
          lowestMastery,
          highestFailure,
          totalSheets30d: sheets.length,
        },
        heatmap,
        subjects,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
