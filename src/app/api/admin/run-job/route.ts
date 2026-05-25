// src/app/api/admin/run-job/route.ts
// Manually trigger a cron job from the admin panel.
// Useful for testing and one-off catch-up runs.

import { NextRequest } from "next/server";
import { ok, err, handleRouteError, withRole } from "@/lib/api/helpers";
import { runCronJob } from "@/lib/cron";

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    try {
      const body = await req.json();
      const jobName = body.job as string;

      let result;
      switch (jobName) {
        case "daily-packets": {
          const { generateDailyPackets } = await import("@/lib/cron/jobs/daily-packets");
          result = await runCronJob("daily-packets", generateDailyPackets);
          break;
        }
        case "streak-maintenance": {
          const { runStreakMaintenance } = await import("@/lib/cron/jobs/streak-maintenance");
          result = await runCronJob("streak-maintenance", runStreakMaintenance);
          break;
        }
        case "dunning": {
          const { processDunningEmails } = await import("@/lib/dunning");
          result = await runCronJob("dunning", processDunningEmails);
          break;
        }
        default:
          return err(`Unknown job: ${jobName}`, 400);
      }

      return ok(result);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
