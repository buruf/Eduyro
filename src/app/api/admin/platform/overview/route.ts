// src/app/api/admin/platform/overview/route.ts
// GET — platform-owner overview. ADMIN / SUPER_ADMIN only.
// Real counts/metrics so the admin home is never blank: users, revenue health,
// trials, shop sales, COPPA queue, and operational watch-items.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { startOfDay, subDays } from "date-fns";

const PRICE = { firstChild: 9.99, additionalChild: 5.99 };

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const since30 = subDays(new Date(), 30);
      const today = startOfDay(new Date());

      const [
        users, students, parents, activeSubs, trialingSubs, pastDueSubs,
        canceledSubs, newUsers30, shopPaid, shopRevenueAgg, pendingCoppa,
        failedPdf, sheetsToday, suspended,
      ] = await Promise.all([
        db.user.count(),
        db.student.count(),
        db.parent.count(),
        db.subscription.count({ where: { status: "ACTIVE" } }),
        db.subscription.count({ where: { status: "TRIALING" } }),
        db.subscription.count({ where: { status: "PAST_DUE" } }),
        db.subscription.count({ where: { status: "CANCELED" } }),
        db.user.count({ where: { createdAt: { gte: since30 } } }),
        db.shopPurchase.count({ where: { status: "PAID" } }),
        db.shopPurchase.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
        db.coppaConsentRequest.count({ where: { status: "PENDING" } }),
        db.pdfExport.count({ where: { fileUrl: null } }),
        db.completedSheet.count({ where: { completedAt: { gte: today } } }),
        db.user.count({ where: { suspendedAt: { not: null } } }),
      ]);

      // Per-child subscription revenue estimate (each active sub bills 1st child
      // + (studentQuantity-1) additional children).
      const activeSubRows = await db.subscription.findMany({ where: { status: "ACTIVE" }, select: { studentQuantity: true } });
      const mrr = activeSubRows.reduce((sum, s) => sum + PRICE.firstChild + Math.max(0, (s.studentQuantity || 1) - 1) * PRICE.additionalChild, 0);

      const trialToPaid = trialingSubs + activeSubs > 0 ? activeSubs / (activeSubs + trialingSubs) : 0;

      return ok({
        users: { total: users, students, parents, newLast30: newUsers30, suspended },
        revenue: { mrrEstimate: Math.round(mrr * 100) / 100, activeSubs, trialingSubs, pastDueSubs, canceledSubs, trialToPaidPct: Math.round(trialToPaid * 100) },
        shop: { paidOrders: shopPaid, revenue: Math.round((shopRevenueAgg._sum.amountCents ?? 0)) / 100 },
        watch: { pendingCoppa, failedPdfExports: failedPdf, pastDueSubs, suspendedUsers: suspended },
        activity: { sheetsToday },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
