// src/lib/dunning/index.ts
// Dunning sequence — when a Stripe payment fails, automatically email
// the customer on days 1, 3, and 7 before downgrading to FREE.

import { db } from "@/lib/db";
import { sendPaymentFailedEmail } from "@/lib/email";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// Dunning state machine
// ─────────────────────────────────────────────

export const DUNNING_STAGES = [
  { day: 1, label: "soft_reminder", subject: "Your payment didn't go through" },
  { day: 3, label: "stronger_nudge", subject: "Action needed: your subscription is at risk" },
  { day: 7, label: "final_warning", subject: "Final notice — your account moves to Free tomorrow" },
] as const;

const FINAL_STAGE = DUNNING_STAGES[DUNNING_STAGES.length - 1];
const DOWNGRADE_DAY = 8; // day after final warning

/** The query the job opens with. Exported so a test can validate its SHAPE
 *  against the real Prisma client: this query carried a `take: 1` inside a
 *  one-to-one `school` include (hidden by `as any`), and Prisma rejected it
 *  before reading a row — every run from Jun 16 to Sep 4 2026 failed here, and
 *  no past-due customer was contacted. School subs are skipped below, so only
 *  the user is needed. */
export const PAST_DUE_QUERY = {
  where: { status: "PAST_DUE" },
  include: { user: true },
} satisfies Prisma.SubscriptionFindManyArgs;

/** Which stage is due for a subscription that has been past due for
 *  `daysSinceFail` days, given the stage labels already sent? The highest
 *  stage whose day has arrived and has not gone out yet — one email per run,
 *  so a missed day (or three months of a broken cron) catches up in order
 *  rather than jumping straight to a downgrade nobody was warned about. */
export function nextDunningStage(
  daysSinceFail: number,
  sentLabels: ReadonlySet<string>,
): (typeof DUNNING_STAGES)[number] | null {
  for (let i = DUNNING_STAGES.length - 1; i >= 0; i--) {
    const s = DUNNING_STAGES[i];
    if (s.day <= daysSinceFail && !sentLabels.has(s.label)) return s;
  }
  return null;
}

/** Downgrade only a customer who has actually received the final warning.
 *  Never move a paying account to Free on the strength of a date alone. */
export function shouldDowngrade(daysSinceFail: number, sentLabels: ReadonlySet<string>): boolean {
  return daysSinceFail >= DOWNGRADE_DAY && sentLabels.has(FINAL_STAGE.label);
}

// ─────────────────────────────────────────────
// Run dunning checks for all PAST_DUE subscriptions
// ─────────────────────────────────────────────

export async function processDunningEmails(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  const pastDueSubs = await db.subscription.findMany(PAST_DUE_QUERY);

  let emailsSent = 0;
  let accountsDowngraded = 0;

  for (const sub of pastDueSubs) {
    if (!sub.user) continue; // skip school-level subs for email (different flow)

    // Days since the subscription went PAST_DUE
    // Use updatedAt as a proxy (it changes when Stripe webhook fires)
    const daysSinceFail = Math.floor(
      (Date.now() - sub.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Everything this customer has already been told
    const prior = await db.notification.findMany({
      where: { userId: sub.userId!, type: "PAYMENT_FAILED" },
      select: { metadata: true },
    });
    const sentLabels = new Set<string>(
      prior.map((n) => (n.metadata as any)?.dunningStage).filter(Boolean),
    );

    const stage = nextDunningStage(daysSinceFail, sentLabels);
    if (stage) {
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
      continue; // one step per run; the downgrade waits for the next one
    }

    if (shouldDowngrade(daysSinceFail, sentLabels)) {
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
