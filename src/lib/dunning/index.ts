// src/lib/dunning/index.ts
// Dunning sequence — when a Stripe payment fails, automatically email
// the customer on days 1, 3, and 7 before downgrading to FREE.

import { db } from "@/lib/db";
import { sendPaymentFailedEmail } from "@/lib/email";

// ─────────────────────────────────────────────
// Dunning state machine
// ─────────────────────────────────────────────

export const DUNNING_STAGES = [
  { day: 1, label: "soft_reminder", subject: "Your payment didn't go through" },
  { day: 3, label: "stronger_nudge", subject: "Action needed: your subscription is at risk" },
  { day: 7, label: "final_warning", subject: "Final notice — your account moves to Free tomorrow" },
] as const;

const DOWNGRADE_DAY = 8; // day after final warning

// ─────────────────────────────────────────────
// Run dunning checks for all PAST_DUE subscriptions
// ─────────────────────────────────────────────

export async function processDunningEmails(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  // Find all subscriptions stuck in PAST_DUE
  const pastDueSubs = await db.subscription.findMany({
    where: { status: "PAST_DUE" },
    include: {
      user: true,
      school: { include: { teachers: { include: { user: true } }, take: 1 } as any },
    },
  });

  let emailsSent = 0;
  let accountsDowngraded = 0;

  for (const sub of pastDueSubs) {
    if (!sub.user) continue; // skip school-level subs for email (different flow)

    // Days since the subscription went PAST_DUE
    // Use updatedAt as a proxy (it changes when Stripe webhook fires)
    const daysSinceFail = Math.floor(
      (Date.now() - sub.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Find which stage we should send (if any)
    const stage = DUNNING_STAGES.find((s) => s.day === daysSinceFail);
    if (stage) {
      // Check if we already sent this stage
      const alreadySent = await db.notification.findFirst({
        where: {
          userId: sub.userId!,
          type: "PAYMENT_FAILED",
          metadata: { path: ["dunningStage"], equals: stage.label } as any,
        },
      });
      if (alreadySent) continue;

      await sendPaymentFailedEmail({
        email: sub.user.email,
        firstName: sub.user.firstName ?? "there",
        amount: `$${((sub.studentQuantity ?? 1) * 19).toFixed(2)}`,
        retryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }).catch(console.error);

      await db.notification.create({
        data: {
          userId: sub.userId!,
          type: "PAYMENT_FAILED",
          title: stage.subject,
          message: `Day ${stage.day} reminder — update your payment method to avoid service disruption.`,
          metadata: { dunningStage: stage.label, daysSinceFail } as any,
        },
      });

      emailsSent++;
    }

    // Auto-downgrade at day 8
    if (daysSinceFail >= DOWNGRADE_DAY) {
      await db.subscription.update({
        where: { id: sub.id },
        data: { plan: "FREE", status: "CANCELED", canceledAt: new Date() },
      });
      await db.notification.create({
        data: {
          userId: sub.userId!,
          type: "PAYMENT_FAILED",
          title: "Your account has been moved to Free",
          message: "Reactivate anytime by updating your payment method.",
          metadata: { dunningStage: "downgraded" } as any,
        },
      });
      accountsDowngraded++;
    }
  }

  return {
    recordsProcessed: pastDueSubs.length,
    metadata: { emailsSent, accountsDowngraded },
  };
}
