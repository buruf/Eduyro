// src/app/api/shop/download/route.ts
// GET /api/shop/download?token=...
// Returns the list of files for a completed purchase.
// Generates fresh signed S3 URLs (1 hour expiry) for each file.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRateLimit } from "@/lib/api/helpers";
import { getFreshDownloadUrl } from "@/lib/shop/fulfillment";
import { SHOP_SKILLS, type ShopSkill } from "@/lib/shop/pack-generator";

export async function GET(req: NextRequest) {
  const limited = withRateLimit(req, 30, 60_000);
  if (limited) return limited;

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return err("Missing token", 400);

  try {
    const purchase = await db.shopPurchase.findUnique({
      where: { downloadToken: token },
      include: { files: true },
    });
    if (!purchase) return err("Invalid download link", 404);

    // Expired?
    if (purchase.expiresAt < new Date()) {
      if (purchase.status !== "EXPIRED") {
        await db.shopPurchase.update({
          where: { id: purchase.id },
          data: { status: "EXPIRED" },
        });
      }
      return err("This download link has expired. It was valid for 30 days from purchase.", 410);
    }

    // Still processing?
    if (purchase.status === "PENDING") {
      return ok({
        status: "PENDING",
        message: "Payment received, generating PDFs… try again in a few seconds.",
      });
    }
    if (purchase.status === "PAID") {
      return ok({
        status: "PROCESSING",
        message: "Generating your PDFs… check back in 30-60 seconds.",
      });
    }
    if (purchase.status === "FAILED") {
      return err("PDF generation failed. Please contact support@eduyro.com with your purchase email.", 500);
    }

    // Completed — generate fresh signed URLs
    const files = await Promise.all(
      purchase.files.map(async (f) => ({
        skill: f.skill,
        label: SHOP_SKILLS[f.skill as ShopSkill]?.label ?? f.skill,
        sheetCount: f.sheetCount,
        fileSizeBytes: f.fileSizeBytes,
        downloadUrl: await getFreshDownloadUrl(f.fileKey).catch(() => f.fileUrl),
      }))
    );

    // Track download access (anti-abuse)
    await db.shopPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Mask the email — the download URL can end up in browser history, referrer
    // headers, or a forwarded email, so don't echo full PII back to the holder.
    const maskEmail = (e: string) => {
      const [u, d] = e.split("@");
      if (!d) return "***";
      return `${u.slice(0, 1)}***@${d}`;
    };

    return ok({
      status: "COMPLETED",
      customerEmail: maskEmail(purchase.customerEmail),
      skills: purchase.skillsCsv.split(","),
      amountCents: purchase.amountCents,
      files,
      expiresAt: purchase.expiresAt,
      downloadCount: purchase.downloadCount + 1,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
