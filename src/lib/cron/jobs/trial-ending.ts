// src/lib/cron/jobs/trial-ending.ts
import { db } from "@/lib/db";
import { sendTrialEndingEmail } from "@/lib/email";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { batchProcess } from "@/lib/cron";

export async function runTrialEndingJob(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  const threeDaysFromNow = addDays(new Date(), 3);
  const windowStart = startOfDay(threeDaysFromNow);
  const windowEnd   = endOfDay(threeDaysFromNow);

  const trialSubscriptions = await db.subscription.findMany({
    where: {
      status:      "TRIALING",
      trialEndsAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      user: {
        include: {
          parent: {
            include: {
              children: {
                include: { student: true },
              },
            },
          },
        },
      },
    },
  });

  let emailsSent = 0;
  let skipped    = 0;

  const { failures } = await batchProcess(
    trialSubscriptions,
    5,
    async (sub) => {
      if (!sub.user) return;

      const alreadySent = await db.auditLog.findFirst({
        where: { action: "email.trial_ending", entityId: sub.id },
      });
      if (alreadySent) { skipped++; return; }

      const childNames = sub.user.parent?.children?.length
        ? sub.user.parent.children.map((l: any) => l.student?.firstName ?? "your child").join(", ")
        : "your child";

      await sendTrialEndingEmail({
        email:       sub.user.email,
        firstName:   sub.user.firstName ?? "there",
        childNames,
        trialEndsAt: sub.trialEndsAt!,
        upgradeUrl:  `${process.env.NEXT_PUBLIC_APP_URL}/parent?upgrade=1`,
      });

      await db.auditLog.create({
        data: {
          action:     "email.trial_ending",
          entityType: "subscription",
          entityId:   sub.id,
          metadata:   { email: sub.user.email, trialEndsAt: sub.trialEndsAt } as any,
        },
      });

      emailsSent++;
    }
  );

  // Expire complimentary access (admin-granted, Stripe-less TRIALING rows).
  // Stripe-backed trials are flipped by webhooks when the trial converts or
  // lapses; comp rows have no webhook, so the cron downgrades them on time.
  const compExpired = await db.subscription.updateMany({
    where: { status: "TRIALING", stripeSubscriptionId: null, trialEndsAt: { lt: new Date() } },
    data: { plan: "FREE", status: "CANCELED", canceledAt: new Date() },
  });

  return {
    recordsProcessed: emailsSent + compExpired.count,
    metadata: { emailsSent, skipped, compExpired: compExpired.count, failures: failures.length },
  };
}
