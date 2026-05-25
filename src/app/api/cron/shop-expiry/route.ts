// src/app/api/cron/shop-expiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret, runCronJob } from "@/lib/cron";
import { expireOldShopPurchases } from "@/lib/cron/jobs/shop-expiry";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runCronJob("shop-expiry", expireOldShopPurchases);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
