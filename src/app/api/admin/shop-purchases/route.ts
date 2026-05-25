// src/app/api/admin/shop-purchases/route.ts
// Admin view of all shop purchases — for support / revenue tracking.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

      const purchases = await db.shopPurchase.findMany({
        where: status ? { status: status as any } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { files: true },
      });

      // Stats
      const completedThisMonth = await db.shopPurchase.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { amountCents: true },
      });
      const revenueCentsThisMonth = completedThisMonth.reduce((sum, p) => sum + p.amountCents, 0);

      const summary = await db.shopPurchase.groupBy({
        by: ["status"],
        _count: true,
      });

      return ok({
        purchases,
        summary: Object.fromEntries(summary.map((s) => [s.status, s._count])),
        stats: {
          completedThisMonth: completedThisMonth.length,
          revenueCentsThisMonth,
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
