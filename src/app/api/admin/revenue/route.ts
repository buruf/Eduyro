// src/app/api/admin/revenue/route.ts
// GET — revenue-dashboard depth for the platform owner: MRR breakdown, ARPU,
// plan mix, subscriber movement (new/churned/net), churn rate, and 6-month
// trends for both subscription and shop revenue. ADMIN / SUPER_ADMIN only.
//
// MRR uses the same per-child model as the Overview tab so the numbers agree:
// each active sub bills 1st child + (studentQuantity-1) additional children.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { subDays, startOfMonth, subMonths, format } from "date-fns";

const PRICE = { firstChild: 9.99, additionalChild: 5.99 };
const monthlyValue = (qty: number) => PRICE.firstChild + Math.max(0, (qty || 1) - 1) * PRICE.additionalChild;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const now = new Date();
      const since30 = subDays(now, 30);
      const window6Start = startOfMonth(subMonths(now, 5)); // first day of the 6-month window

      const [subs, shop] = await Promise.all([
        db.subscription.findMany({
          select: { status: true, plan: true, studentQuantity: true, createdAt: true, canceledAt: true },
        }),
        db.shopPurchase.findMany({
          where: { status: { in: ["PAID", "COMPLETED"] } },
          select: { amountCents: true, createdAt: true },
        }),
      ]);

      const active = subs.filter(s => s.status === "ACTIVE");
      const trialing = subs.filter(s => s.status === "TRIALING");

      // ── MRR / ARPU ──────────────────────────────────────────────
      const mrr = round2(active.reduce((sum, s) => sum + monthlyValue(s.studentQuantity), 0));
      const billedChildren = active.reduce((sum, s) => sum + Math.max(1, s.studentQuantity || 1), 0);
      const arpu = active.length ? round2(mrr / active.length) : 0;
      const arr = round2(mrr * 12);

      // ── Plan mix (active subs) ──────────────────────────────────
      const planMix: Record<string, number> = {};
      for (const s of active) planMix[s.plan] = (planMix[s.plan] ?? 0) + 1;

      // ── Subscriber movement (last 30d) ──────────────────────────
      const newSubs30 = subs.filter(s => s.createdAt >= since30).length;
      const churned30 = subs.filter(s => s.canceledAt && s.canceledAt >= since30).length;
      const netSubs30 = newSubs30 - churned30;
      // Monthly churn rate ≈ churned in 30d / active subscribers at window start.
      const activeAtStart = active.length + churned30; // approximation: current active + those who churned
      const churnRatePct = activeAtStart > 0 ? Math.round((churned30 / activeAtStart) * 100) : 0;

      // ── 6-month trends ──────────────────────────────────────────
      const months: { key: string; label: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM") });
      }
      const bucket = (d: Date) => format(d, "yyyy-MM");

      const subTrend = months.map(m => ({ month: m.label, added: 0, churned: 0 }));
      const subIdx = new Map(months.map((m, i) => [m.key, i]));
      for (const s of subs) {
        if (s.createdAt >= window6Start) { const i = subIdx.get(bucket(s.createdAt)); if (i != null) subTrend[i].added++; }
        if (s.canceledAt && s.canceledAt >= window6Start) { const i = subIdx.get(bucket(s.canceledAt)); if (i != null) subTrend[i].churned++; }
      }

      const shopTrend = months.map(m => ({ month: m.label, revenue: 0, orders: 0 }));
      for (const p of shop) {
        if (p.createdAt < window6Start) continue;
        const i = subIdx.get(bucket(p.createdAt));
        if (i != null) { shopTrend[i].revenue = round2(shopTrend[i].revenue + p.amountCents / 100); shopTrend[i].orders++; }
      }

      // ── Shop totals ─────────────────────────────────────────────
      const shopRevenueTotal = round2(shop.reduce((s, p) => s + p.amountCents / 100, 0));
      const shopRevenue30 = round2(shop.filter(p => p.createdAt >= since30).reduce((s, p) => s + p.amountCents / 100, 0));
      const shopAov = shop.length ? round2(shopRevenueTotal / shop.length) : 0;

      return ok({
        mrr, arr, arpu, billedChildren,
        subs: {
          active: active.length, trialing: trialing.length,
          newLast30: newSubs30, churnedLast30: churned30, netLast30: netSubs30, churnRatePct,
        },
        planMix,
        shop: { revenueTotal: shopRevenueTotal, revenue30: shopRevenue30, orders: shop.length, aov: shopAov },
        trends: { subscriptions: subTrend, shop: shopTrend },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
