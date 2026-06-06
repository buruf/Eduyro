// src/app/api/cron/shop-generate/route.ts
// Background PDF generation for shop purchases.
// Runs every 2 minutes via Vercel cron.
// Finds PAID purchases with no files and generates PDFs one skill at a time.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreatePackPdf } from "@/lib/shop/pack-cache";
import { sendShopPurchaseEmail } from "@/lib/shop/emails";
import { SHOP_SKILLS, type ShopSkill } from "@/lib/shop/pack-generator";

export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingPurchases = await db.shopPurchase.findMany({
      where: { status: "PAID" },
      include: { files: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    if (pendingPurchases.length === 0) {
      return NextResponse.json({ message: "No pending purchases", processed: 0 });
    }

    let processed = 0;

    for (const purchase of pendingPurchases) {
      const skills = purchase.skillsCsv.split(",").filter(Boolean) as ShopSkill[];
      const completedSkills = new Set(purchase.files.map((f) => f.skill));
      const pendingSkills = skills.filter((s) => !completedSkills.has(s));

      console.log(`[shop-generate] Purchase ${purchase.id}: ${pendingSkills.length} skills pending`);

      for (const skill of pendingSkills) {
        try {
          console.log(`[shop-generate] Generating ${skill} for ${purchase.id}...`);
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

          console.log(`[shop-generate] ${skill} done for ${purchase.id}`);
          processed++;
        } catch (err) {
          console.error(`[shop-generate] Failed ${skill} for ${purchase.id}:`, err);
        }
      }

      // Check if all skills complete
      const updatedFiles = await db.shopPurchaseFile.findMany({
        where: { purchaseId: purchase.id },
      });
      const allDone = skills.every((s) => updatedFiles.some((f) => f.skill === s));

      if (allDone) {
        await db.shopPurchase.update({
          where: { id: purchase.id },
          data: { status: "COMPLETED" },
        });

        if (purchase.emailDelivery) {
          const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com"}/shop/download?token=${purchase.downloadToken}`;
          sendShopPurchaseEmail({
            to: purchase.customerEmail,
            skills,
            files: updatedFiles.map((f) => ({
              skill: f.skill as ShopSkill,
              label: SHOP_SKILLS[f.skill as ShopSkill]?.label ?? f.skill,
              sheetCount: f.sheetCount,
              downloadUrl: f.fileUrl,
            })),
            accessPageUrl: downloadUrl,
            amountCents: purchase.amountCents,
            expiresAt: purchase.expiresAt,
          }).catch((e) => console.error("[shop-generate] Email failed:", e));
        }

        console.log(`[shop-generate] Purchase ${purchase.id} COMPLETED`);
      }
    }

    return NextResponse.json({ message: `Processed ${processed} skill PDFs`, processed });
  } catch (error: any) {
    console.error("[shop-generate] Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
