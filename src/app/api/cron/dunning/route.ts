// src/app/api/cron/dunning/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret, runCronJob } from "@/lib/cron";
import { processDunningEmails } from "@/lib/dunning";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runCronJob("dunning", processDunningEmails);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
