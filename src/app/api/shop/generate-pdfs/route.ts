// src/app/api/shop/generate-pdfs/route.ts
// Internal API route for background PDF generation.
// Called by the Stripe webhook after marking a purchase PAID.
// Runs in its own serverless function with full 300-second timeout.
// Protected by INTERNAL_API_SECRET environment variable.

import { NextRequest, NextResponse } from "next/server";
import { generatePdfsForPurchase } from "@/lib/shop/fulfillment";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // Verify internal secret. Fail CLOSED: if the env var is unset, refuse rather
  // than fall back to a secret that's visible in source (which would let anyone
  // trigger PDF generation).
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let shopPurchaseId: string;
  try {
    const body = await req.json();
    shopPurchaseId = body.shopPurchaseId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!shopPurchaseId) {
    return NextResponse.json({ error: "shopPurchaseId required" }, { status: 400 });
  }

  console.log(`[shop/generate-pdfs] Starting PDF generation for ${shopPurchaseId}`);

  try {
    await generatePdfsForPurchase(shopPurchaseId);
    return NextResponse.json({ success: true, shopPurchaseId });
  } catch (error: any) {
    console.error(`[shop/generate-pdfs] Error for ${shopPurchaseId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
