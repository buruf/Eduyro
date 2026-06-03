// src/lib/shop/fulfillment.ts
// Post-payment fulfillment for shop purchases.
// Triggered by the Stripe webhook on checkout.session.completed.

import Stripe from "stripe";
import { db } from "@/lib/db";
import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";
import { SHOP_SKILLS, type ShopSkill } from "./pack-generator";
import { getOrCreatePackPdf } from "./pack-cache";
import { sendShopPurchaseEmail } from "./emails";

/**
 * Handle a completed Stripe Checkout session for a shop purchase.
 * Idempotent — safe to call multiple times for the same session.
 */
export async function handleShopPurchaseCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const shopPurchaseId = session.metadata?.shopPurchaseId;
  if (!shopPurchaseId) {
    console.error("[shop] No shopPurchaseId in session metadata");
    return;
  }

  const purchase = await db.shopPurchase.findUnique({
    where: { id: shopPurchaseId },
    include: { files: true },
  });
  if (!purchase) {
    console.error(`[shop] Purchase ${shopPurchaseId} not found`);
    return;
  }

  // Idempotency — if already paid/completed, skip
  if (purchase.status === "COMPLETED" || purchase.status === "PAID") {
    if (purchase.files.length > 0) {
      console.log(`[shop] ${shopPurchaseId} already fulfilled — skipping`);
      return;
    }
  }

  // Mark PAID so we don't double-fire if webhook retries
  await db.shopPurchase.update({
    where: { id: shopPurchaseId },
    data: {
      status: "PAID",
      stripePaymentIntentId: session.payment_intent as string,
    },
  });

  try {
    const skills = purchase.skillsCsv.split(",").filter(Boolean) as ShopSkill[];

    // Fetch (or generate on first sale) the cached pack PDF for each skill.
    // Once cached, subsequent purchases of the same skill are nearly instant.
    const files: Array<{ skill: ShopSkill; key: string; url: string; size: number; sheetCount: number }> = [];
    for (const skill of skills) {
      console.log(`[shop] Resolving cached pack for ${skill} (purchase ${purchase.id})…`);
      const buyerName = (purchase as any).customerFirstName || purchase.customerEmail.split("@")[0];
      const cached = await getOrCreatePackPdf(skill, buyerName);
      files.push({
        skill,
        key: cached.key,
        url: cached.url,
        size: cached.sizeBytes,
        sheetCount: cached.sheetCount,
      });
    }

    // Persist file records
    await db.$transaction([
      db.shopPurchaseFile.createMany({
        data: files.map((f) => ({
          purchaseId: purchase.id,
          skill: f.skill,
          fileKey: f.key,
          fileUrl: f.url,
          fileSizeBytes: f.size,
          sheetCount: f.sheetCount,
        })),
      }),
      db.shopPurchase.update({
        where: { id: purchase.id },
        data: { status: "COMPLETED" },
      }),
    ]);

    // Email the customer (if they opted in at checkout) — non-blocking
    if (purchase.emailDelivery) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/shop/download?token=${purchase.downloadToken}`;
      sendShopPurchaseEmail({
        to: purchase.customerEmail,
        skills,
        files: files.map((f) => ({
          skill: f.skill,
          label: SHOP_SKILLS[f.skill].label,
          sheetCount: f.sheetCount,
          downloadUrl: f.url,
        })),
        accessPageUrl: downloadUrl,
        amountCents: purchase.amountCents,
        expiresAt: purchase.expiresAt,
      }).catch((e) => console.error("[shop] email failed:", e));
    }

    // Audit
    await db.auditLog.create({
      data: {
        action: "shop.purchase_fulfilled",
        entityType: "shop_purchase",
        entityId: purchase.id,
        metadata: {
          skills,
          amountCents: purchase.amountCents,
          fileCount: files.length,
          totalSheets: files.reduce((s, f) => s + f.sheetCount, 0),
        } as any,
      },
    });

    console.log(`[shop] ✓ Fulfilled purchase ${purchase.id}`);
  } catch (error: any) {
    console.error(`[shop] Fulfillment failed for ${purchase.id}:`, error);
    await db.shopPurchase.update({
      where: { id: purchase.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Generate a fresh signed S3 URL for a specific file.
 * Used by the download page to avoid bundling raw URLs into client JS.
 */
export async function getFreshDownloadUrl(fileKey: string): Promise<string> {
  return getSignedDownloadUrl(fileKey, 60 * 60); // 1 hour
}
