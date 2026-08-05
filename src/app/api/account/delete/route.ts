// src/app/api/account/delete/route.ts
// POST { confirm: "DELETE MY ACCOUNT" } — self-service ERASURE (right to be
// forgotten: GDPR Art. 17, CCPA, PIPEDA, APPI, PIPA, PIPL; also COPPA parental
// deletion). Cancels any Stripe subscription, records an erasure audit entry,
// then deletes the User row — Student/Parent/CompletedSheet/etc. cascade.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { z } from "zod";

const Schema = z.object({ confirm: z.literal("DELETE MY ACCOUNT") });

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, role: true, subscription: { select: { stripeSubscriptionId: true, status: true } } },
      });
      if (!user) return notFound("User");
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        return err("Admin accounts can't self-delete — remove the admin role first.", 400);
      }

      // Cancel any live Stripe subscription so billing stops immediately.
      const subId = user.subscription?.stripeSubscriptionId;
      if (subId) {
        try {
          const { stripe } = await import("@/lib/stripe");
          await stripe.subscriptions.cancel(subId);
        } catch (e) {
          console.error("[account/delete] stripe cancel failed (continuing with erasure):", e);
        }
      }

      // Erasure audit record FIRST (kept as the minimal legal record of the
      // deletion itself), then the cascade delete.
      await logAdmin(ctx as any, "user.self_delete", {
        entityType: "User",
        entityId: user.id,
        metadata: { email: user.email, role: user.role, requestedBy: "self" },
      }).catch(() => {});
      await db.user.delete({ where: { id: user.id } });

      return ok({ deleted: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
