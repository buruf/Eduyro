// src/app/api/admin/platform/overview/route.ts
// GET — platform-owner overview. ADMIN / SUPER_ADMIN only.
// Real counts/metrics so the admin home is never blank: users, revenue health,
// trials, shop sales, COPPA queue, and operational watch-items.
import { appDayStart } from "@/lib/time";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { startOfDay, subDays } from "date-fns";

const PRICE = { firstChild: 9.99, additionalChild: 5.99 };

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const since30 = subDays(new Date(), 30);
      const today = appDayStart();

      const [
        users, students, parents, activeSubs, trialingSubs, pastDueSubs,
        canceledSubs, newUsers30, shopPaid, shopRevenueAgg, pendingCoppa,
        failedPdf, sheetsToday, suspended, failedWebhooks,
      ] = await Promise.all([
        db.user.count(),
        db.student.count(),
        db.parent.count(),
        db.subscription.count({ where: { status: "ACTIVE" } }),
        db.subscription.count({ where: { status: "TRIALING" } }),
        db.subscription.count({ where: { status: "PAST_DUE" } }),
        db.subscription.count({ where: { status: "CANCELED" } }),
        db.user.count({ where: { createdAt: { gte: since30 } } }),
        db.shopPurchase.count({ where: { status: { in: ["PAID", "COMPLETED"] } } }),
        db.shopPurchase.aggregate({ where: { status: { in: ["PAID", "COMPLETED"] } }, _sum: { amountCents: true } }),
        db.coppaConsentRequest.count({ where: { status: "PENDING" } }),
        db.pdfExport.count({ where: { fileUrl: null } }),
        db.completedSheet.count({ where: { completedAt: { gte: today } } }),
        db.user.count({ where: { suspendedAt: { not: null } } }),
        db.webhookEvent.count({ where: { status: "FAILED" } }),
      ]);

      // Per-child subscription revenue estimate (each active sub bills 1st child
      // + (studentQuantity-1) additional children).
      const activeSubRows = await db.subscription.findMany({ where: { status: "ACTIVE" }, select: { studentQuantity: true } });
      const mrr = activeSubRows.reduce((sum, s) => sum + PRICE.firstChild + Math.max(0, (s.studentQuantity || 1) - 1) * PRICE.additionalChild, 0);

      const trialToPaid = trialingSubs + activeSubs > 0 ? activeSubs / (activeSubs + trialingSubs) : 0;

      // ── 30-day trend series (registrations, practice, shop revenue) ──
      const [regRows, sheetRows, saleRows] = await Promise.all([
        db.user.findMany({ where: { createdAt: { gte: since30 } }, select: { createdAt: true } }),
        db.completedSheet.findMany({ where: { completedAt: { gte: since30 } }, select: { completedAt: true } }),
        db.shopPurchase.findMany({ where: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: since30 } }, select: { createdAt: true, amountCents: true } }),
      ]);
      const dayKey = (d: Date) => d.toISOString().slice(0, 10);
      const seriesDays: string[] = [];
      for (let i = 29; i >= 0; i--) seriesDays.push(dayKey(subDays(new Date(), i)));
      const bucket = (rows: { at: Date; v: number }[]) => {
        const m = new Map<string, number>();
        for (const r of rows) m.set(dayKey(r.at), (m.get(dayKey(r.at)) ?? 0) + r.v);
        return seriesDays.map((d) => ({ date: d, value: m.get(d) ?? 0 }));
      };
      const trends = {
        registrations: bucket(regRows.map((r) => ({ at: r.createdAt, v: 1 }))),
        practice: bucket(sheetRows.map((r) => ({ at: r.completedAt, v: 1 }))),
        shopRevenueCents: bucket(saleRows.map((r) => ({ at: r.createdAt, v: r.amountCents }))),
      };

      // ── Health row: checks that actually matter on this stack ──
      const [lastWebhook, lastPdf, lastSheet, lastEmailish] = await Promise.all([
        db.webhookEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, status: true } }),
        db.pdfExport.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, fileUrl: true } }),
        db.completedSheet.findFirst({ orderBy: { completedAt: "desc" }, select: { completedAt: true } }),
        db.notification.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ]);
      const health = {
        database: "OK", // this handler ran → DB answered
        stripeWebhooks: failedWebhooks > 0 ? "DEGRADED" : "OK",
        lastWebhookAt: lastWebhook?.createdAt ?? null,
        pdfGeneration: failedPdf > 0 ? "DEGRADED" : "OK",
        lastPdfAt: lastPdf?.createdAt ?? null,
        lastPracticeAt: lastSheet?.completedAt ?? null,
        lastNotificationAt: lastEmailish?.createdAt ?? null,
      };

      return ok({
        trends,
        health,
        users: { total: users, students, parents, newLast30: newUsers30, suspended },
        revenue: { mrrEstimate: Math.round(mrr * 100) / 100, activeSubs, trialingSubs, pastDueSubs, canceledSubs, trialToPaidPct: Math.round(trialToPaid * 100) },
        shop: { paidOrders: shopPaid, revenue: Math.round((shopRevenueAgg._sum.amountCents ?? 0)) / 100 },
        watch: { pendingCoppa, failedPdfExports: failedPdf, pastDueSubs, suspendedUsers: suspended, failedWebhooks },
        activity: { sheetsToday },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
