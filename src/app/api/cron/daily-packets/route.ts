// src/app/api/cron/daily-packets/route.ts
// POST /api/cron/daily-packets — generates daily packets for all active students
// Scheduled via vercel.json (6am daily) or any external cron service.

import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret, runCronJob } from "@/lib/cron";
import { generateDailyPackets } from "@/lib/cron/jobs/daily-packets";

export const maxDuration = 300; // 5 minutes — bulk PDF generation can take a while

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronJob("daily-packets", generateDailyPackets);
  return NextResponse.json(result);
}

// GET for compatibility with Vercel Cron (which sends GET requests)
export async function GET(req: NextRequest) {
  return POST(req);
}
