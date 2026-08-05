// src/app/api/admin/webhooks/route.ts
// GET  — Stripe webhook deliverability monitor: status counts + recent events,
//        with failures surfaced first so silent subscription-state corruption is
//        visible to the owner.
// POST — replay a FAILED event: re-fetch from Stripe & re-dispatch the handler.
// ADMIN / SUPER_ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { stripe } from "@/lib/stripe";
import { dispatchStripeEvent } from "@/lib/stripe/webhook-dispatch";
import { subDays } from "date-fns";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const since7 = subDays(new Date(), 7);
      const [grouped, recent, failed, last] = await Promise.all([
        db.webhookEvent.groupBy({ by: ["status"], _count: { _all: true }, where: { createdAt: { gte: since7 } } }),
        db.webhookEvent.findMany({ select: { id: true, eventId: true, type: true, status: true, error: true, attempts: true, createdAt: true, processedAt: true }, orderBy: { createdAt: "desc" }, take: 40 }),
        // Failures float to the top regardless of recency — they're the actionable ones.
        db.webhookEvent.findMany({ where: { status: "FAILED" }, select: { id: true, eventId: true, type: true, status: true, error: true, attempts: true, createdAt: true, processedAt: true }, orderBy: { createdAt: "desc" }, take: 40 }),
        db.webhookEvent.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ]);
      const counts: Record<string, number> = { PROCESSED: 0, FAILED: 0, SKIPPED: 0, IGNORED: 0 };
      for (const g of grouped) counts[g.status] = g._count._all;
      return ok({ counts, failed, recent, lastEventAt: last?.createdAt ?? null });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({ action: z.literal("replay"), eventId: z.string() });

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const { eventId } = parsed.data;
    try {
      const rec = await db.webhookEvent.findUnique({ where: { eventId } });
      if (!rec) return notFound("Webhook event");

      // Re-fetch the canonical event from Stripe so we replay real payload data.
      const event = await stripe.events.retrieve(eventId);
      let status: "PROCESSED" | "FAILED" | "IGNORED";
      let error: string | null = null;
      try {
        const outcome = await dispatchStripeEvent(event as any);
        status = outcome === "ignored" ? "IGNORED" : "PROCESSED";
      } catch (e: any) {
        status = "FAILED";
        error = e?.message ?? String(e);
      }
      await db.webhookEvent.update({
        where: { eventId },
        data: { status, error, attempts: { increment: 1 }, processedAt: status === "FAILED" ? null : new Date() },
      });
      await logAdmin(ctx, "webhook.replay", { entityType: "WebhookEvent", entityId: eventId, metadata: { type: rec.type, result: status } });
      return ok({ replayed: true, status, error });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
