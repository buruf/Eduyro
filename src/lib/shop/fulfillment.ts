// src/lib/shop/fulfillment.ts
// Post-payment fulfillment for shop purchases.
// handleShopPurchaseCompleted: marks PAID quickly (called in webhook, must be fast)
// generatePdfsForPurchase: generates PDFs in background via unstable_after

import Stripe from "stripe";
import { db } from "@/lib/db";
import { getOrCreatePackPdf } from "@/lib/shop/pack-cache";
import { sendShopPurchaseEmail } from "@/lib/shop/emails";
import { SHOP_SKILLS, type ShopSkill } from "./pack-generator";

// Step 1: Called synchronously in webhook — just marks PAID, returns fast
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

  if (purchase.status === "COMPLETED" && purchase.files.length > 0) {
    console.log(`[shop] ${shopPurchaseId} already fulfilled — skipping`);
    return;
  }

  await db.shopPurchase.update({
    where: { id: shopPurchaseId },
    data: {
      status: "PAID",
      stripePaymentIntentId: session.payment_intent as string,
    },
  });

  console.log(`[shop] Purchase ${shopPurchaseId} marked PAID — PDF generation starting in background`);
}

// Step 2: Called via unstable_after — runs after webhook response is sent
export async function generatePdfsForPurchase(shopPurchaseId: string): Promise<void> {
  if (!shopPurchaseId) return;

  const purchase = await db.shopPurchase.findUnique({
    where: { id: shopPurchaseId },
    include: { files: true },
  });

  if (!purchase) {
    console.error(`[shop] generatePdfs: purchase ${shopPurchaseId} not found`);
    return;
  }

  if (purchase.status === "COMPLETED" && purchase.files.length > 0) {
    console.log(`[shop] ${shopPurchaseId} already has PDFs — skipping`);
    return;
  }

  try {
    const skills = purchase.skillsCsv.split(",").filter(Boolean) as ShopSkill[];
    const completedSkills = new Set(purchase.files.map((f) => f.skill));
    const pendingSkills = skills.filter((s) => !completedSkills.has(s));

    const files: Array<{ skill: ShopSkill; key: string; url: string; size: number; sheetCount: number }> = [
      ...purchase.files.map((f) => ({
        skill: f.skill as ShopSkill,
        key: f.fileKey,
        url: f.fileUrl,
        size: f.fileSizeBytes,
        sheetCount: f.sheetCount,
      })),
    ];

    for (const skill of pendingSkills) {
      console.log(`[shop] Generating ${skill} for purchase ${shopPurchaseId}...`);
      const cached = await getOrCreatePackPdf(skill);
      
      await db.shopPurchaseFile.create({
        data: {
          purchaseId: purchase.id,
          skill,
          fileKey: cached.key,
          fileUrl: cached.url,
          fileSizeBytes: cached.sizeBytes,
          sheetCount: cached.sheetCount,
        },
      });

      files.push({ skill, key: cached.key, url: cached.url, size: cached.sizeBytes, sheetCount: cached.sheetCount });
      console.log(`[shop] ✅ ${skill} done for ${shopPurchaseId}`);
    }

    await db.shopPurchase.update({
      where: { id: purchase.id },
      data: { status: "COMPLETED" },
    });

    // Send email
    if (purchase.emailDelivery) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com"}/shop/download?token=${purchase.downloadToken}`;
      sendShopPurchaseEmail({
        to: purchase.customerEmail,
        skills,
        files: files.map((f) => ({
          skill: f.skill,
          label: SHOP_SKILLS[f.skill]?.label ?? f.skill,
          sheetCount: f.sheetCount,
          downloadUrl: f.url,
        })),
        accessPageUrl: downloadUrl,
        amountCents: purchase.amountCents,
        expiresAt: purchase.expiresAt,
      }).catch((e) => console.error("[shop] email failed:", e));
    }

    console.log(`[shop] ✅ Purchase ${shopPurchaseId} COMPLETED`);
  } catch (error: any) {
    console.error(`[shop] PDF generation failed for ${shopPurchaseId}:`, error);
    await db.shopPurchase.update({
      where: { id: shopPurchaseId },
      data: { status: "FAILED" },
    });
  }
}

export { getFreshDownloadUrl } from "./fulfillment-helpers";
