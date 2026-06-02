const fs = require('fs');
const f = 'src/lib/cron/jobs/trial-ending.ts';

const content = `// src/lib/cron/jobs/trial-ending.ts
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
        upgradeUrl:  \`\${process.env.NEXT_PUBLIC_APP_URL}/parent?upgrade=1\`,
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

  return {
    recordsProcessed: emailsSent,
    metadata: { emailsSent, skipped, failures: failures.length },
  };
}
`;

fs.writeFileSync(f, content);
const written = fs.readFileSync(f, 'utf8');
console.log('parentLinks:', written.includes('parentLinks'));
console.log('parent.children:', written.includes('parent: {'));
console.log('sub.user.parent:', written.includes('sub.user.parent'));
console.log('Result should be: false, true, true');
