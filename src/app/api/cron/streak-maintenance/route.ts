// src/app/api/cron/streak-maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret, runCronJob } from "@/lib/cron";
import { runStreakMaintenance } from "@/lib/cron/jobs/streak-maintenance";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runCronJob("streak-maintenance", runStreakMaintenance);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
