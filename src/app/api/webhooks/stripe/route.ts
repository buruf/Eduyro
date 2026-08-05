// src/app/api/webhooks/stripe/route.ts
// Stripe webhook handler — verifies signature, dispatches to the right handler
// (see @/lib/stripe/webhook-dispatch), and persists every delivery so silent
// failures are visible & replayable in the admin monitor.

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { dispatchStripeEvent } from "@/lib/stripe/webhook-dispatch";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe webhook] signature verify failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency: if we already processed this exact event, ack & skip.
  const existing = await db.webhookEvent.findUnique({ where: { eventId: event.id }, select: { status: true } });
  if (existing?.status === "PROCESSED" || existing?.status === "SKIPPED") {
    await db.webhookEvent.update({ where: { eventId: event.id }, data: { status: "SKIPPED" } }).catch(() => {});
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const outcome = await dispatchStripeEvent(event);
    await recordWebhookEvent(event, outcome === "ignored" ? "IGNORED" : "PROCESSED");
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe webhook] Handler error:", error);
    // Persist the failure so it surfaces in the admin monitor and can be replayed.
    await recordWebhookEvent(event, "FAILED", error?.message ?? String(error));
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Records (or upserts on retry) the outcome of a webhook delivery.
async function recordWebhookEvent(event: Stripe.Event, status: "PROCESSED" | "FAILED" | "IGNORED" | "SKIPPED", error?: string) {
  try {
    await db.webhookEvent.upsert({
      where: { eventId: event.id },
      create: { eventId: event.id, source: "stripe", type: event.type, status, error: error ?? null, processedAt: status === "PROCESSED" || status === "IGNORED" ? new Date() : null },
      update: { status, error: error ?? null, attempts: { increment: 1 }, processedAt: status === "PROCESSED" || status === "IGNORED" ? new Date() : null },
    });
  } catch (e) {
    console.error("[Stripe webhook] failed to record event", event.id, e);
  }
}
