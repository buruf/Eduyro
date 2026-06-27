// src/app/api/admin/billing/route.ts
// POST — subscription ops by userId: cancel (now / period-end) | refund.
// Audited; touches Stripe + the local Subscription row. ADMIN / SUPER_ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { cancelSubscription, refundLatestPayment } from "@/lib/stripe";
import { z } from "zod";

const Schema = z.object({
  userId: z.string(),
  action: z.enum(["cancel", "refund"]),
  immediately: z.boolean().optional(),
  amountCents: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const { userId, action, immediately, amountCents } = parsed.data;
    try {
      const sub = await db.subscription.findUnique({ where: { userId } });
      if (!sub?.stripeSubscriptionId) return notFound("Stripe subscription for this user");

      if (action === "cancel") {
        const updated = await cancelSubscription(sub.stripeSubscriptionId, { immediately });
        await db.subscription.update({
          where: { userId },
          data: immediately
            ? { status: "CANCELED", canceledAt: new Date(), cancelAtPeriodEnd: false }
            : { cancelAtPeriodEnd: true },
        });
        await logAdmin(ctx, "billing.cancel", { entityType: "Subscription", entityId: sub.id, metadata: { userId, immediately: !!immediately, stripeStatus: (updated as any).status } });
        return ok({ canceled: true, immediately: !!immediately });
      }
      if (action === "refund") {
        const refund = await refundLatestPayment(sub.stripeSubscriptionId, amountCents);
        await logAdmin(ctx, "billing.refund", { entityType: "Subscription", entityId: sub.id, metadata: { userId, amountCents: amountCents ?? "full", refundId: (refund as any).id } });
        return ok({ refunded: true, amount: (refund as any).amount, refundId: (refund as any).id });
      }
      return err("Unknown action", 400);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
