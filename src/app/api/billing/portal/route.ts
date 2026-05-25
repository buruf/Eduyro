// src/app/api/billing/portal/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withAuth } from "@/lib/api/helpers";
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const sub = await db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      if (!sub?.stripeCustomerId) {
        return err("No active subscription found", 404);
      }

      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/parent/billing`;
      const session = await createPortalSession(sub.stripeCustomerId, returnUrl);

      return ok({ portalUrl: session.url });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
