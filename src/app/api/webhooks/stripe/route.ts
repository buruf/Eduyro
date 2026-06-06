// src/app/api/webhooks/stripe/route.ts
// Stripe webhook handler — processes all subscription lifecycle events

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPaymentFailedEmail } from "@/lib/email";

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.trial_will_end":
        await handleTrialEnding(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`[Stripe webhook] Unhandled event: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.purpose === "shop_purchase") {
    // Mark PAID synchronously so webhook returns fast
    const { handleShopPurchaseCompleted } = await import("@/lib/shop/fulfillment");
    await handleShopPurchaseCompleted(session);
    // Trigger background PDF generation via internal API route (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";
    fetch(`${appUrl}/api/shop/generate-pdfs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "eduyro-internal-2026-secure",
      },
      body: JSON.stringify({ shopPurchaseId: session.metadata?.shopPurchaseId }),
    }).catch((e) => console.error("[shop] Failed to trigger PDF generation:", e));
    return;
  }
  const userId = session.metadata?.userId;
  const schoolId = session.metadata?.schoolId;
  const plan = session.metadata?.plan;

  if (!session.subscription || !plan) return;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const data = {
    plan: plan as any,
    status: mapStripeStatus(subscription.status),
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    studentQuantity: subscription.items.data[0]?.quantity ?? 1,
  };

  if (schoolId) {
    await db.subscription.upsert({
      where: { schoolId },
      create: { schoolId, ...data },
      update: data,
    });
  } else if (userId) {
    await db.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      studentQuantity: subscription.items.data[0]?.quantity ?? 1,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "CANCELED",
      plan: "FREE",
      canceledAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  const sub = await db.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { user: true, school: true },
  });
  if (!sub) return;

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: "ACTIVE" },
  });

  // Notify user
  const recipientId = sub.userId ?? (sub.school as any)?.teachers?.[0]?.userId;
  if (recipientId) {
    await db.notification.create({
      data: {
        userId: recipientId,
        type: "PAYMENT_SUCCESS",
        title: "Payment received",
        message: `Your subscription has been renewed.`,
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  const sub = await db.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { user: true },
  });
  if (!sub) return;

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: "PAST_DUE" },
  });

  if (sub.user) {
    await db.notification.create({
      data: {
        userId: sub.user.id,
        type: "PAYMENT_FAILED",
        title: "Payment failed",
        message: `We couldn't process your payment. Please update your payment method.`,
      },
    });

    sendPaymentFailedEmail({
      email: sub.user.email,
      firstName: sub.user.firstName ?? "there",
      amount: `$${(invoice.amount_due / 100).toFixed(2)}`,
      retryDate: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
        : "in 3 days",
    }).catch(console.error);
  }
}

async function handleTrialEnding(subscription: Stripe.Subscription) {
  const sub = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });
  if (!sub?.user) return;

  await db.notification.create({
    data: {
      userId: sub.user.id,
      type: "SYSTEM",
      title: "Your trial ends in 3 days",
      message: `Your BrightSteps trial ends soon. Your card will be charged on the renewal date.`,
    },
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status): any {
  switch (status) {
    case "trialing": return "TRIALING";
    case "active": return "ACTIVE";
    case "past_due": return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
    case "unpaid": return "CANCELED";
    case "paused": return "PAUSED";
    default: return "ACTIVE";
  }
}
