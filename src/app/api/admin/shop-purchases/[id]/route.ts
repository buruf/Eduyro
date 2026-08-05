// src/app/api/admin/shop-purchases/[id]/route.ts
// Dispute-resolution tooling for a single shop purchase. ADMIN / SUPER_ADMIN.
//   GET            → purchase + files with FRESH signed URLs (open/preview).
//   POST {action}:
//     email        → re-send the purchase delivery email to the customer.
//     regenerate   → rotate download token + extend 30-day window.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { getFreshDownloadUrl } from "@/lib/shop/fulfillment";
import { sendShopPurchaseEmail } from "@/lib/shop/emails";
import { SHOP_SKILLS } from "@/lib/shop/pack-generator";
import { nanoid } from "nanoid";
import { z } from "zod";

async function loadWithFreshUrls(id: string) {
  const purchase = await db.shopPurchase.findUnique({ where: { id }, include: { files: true } });
  if (!purchase) return null;
  // S3 URLs expire; mint fresh signed links from the stored fileKey so admins
  // can always open/preview what the parent actually received.
  const files = await Promise.all(purchase.files.map(async (f) => ({
    id: f.id, skill: f.skill, label: SHOP_SKILLS[f.skill as keyof typeof SHOP_SKILLS]?.label ?? f.skill,
    sheetCount: f.sheetCount, fileSizeBytes: f.fileSizeBytes,
    url: await getFreshDownloadUrl(f.fileKey).catch(() => f.fileUrl),
  })));
  return { purchase, files };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const loaded = await loadWithFreshUrls(params.id);
      if (!loaded) return notFound("Shop purchase");
      const { purchase, files } = loaded;
      return ok({
        purchase: {
          id: purchase.id, customerEmail: purchase.customerEmail, customerFirstName: purchase.customerFirstName,
          skillsCsv: purchase.skillsCsv, status: purchase.status, amountCents: purchase.amountCents,
          downloadToken: purchase.downloadToken, downloadCount: purchase.downloadCount,
          expiresAt: purchase.expiresAt, createdAt: purchase.createdAt,
        },
        files,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({ action: z.enum(["email", "regenerate"]) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    try {
      const loaded = await loadWithFreshUrls(params.id);
      if (!loaded) return notFound("Shop purchase");
      const { purchase, files } = loaded;

      if (parsed.data.action === "regenerate") {
        const newToken = nanoid(32);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await db.shopPurchase.update({ where: { id: purchase.id }, data: { downloadToken: newToken, downloadCount: 0, expiresAt } });
        await logAdmin(ctx, "shop.regenerate_download", { entityType: "ShopPurchase", entityId: purchase.id, metadata: { email: purchase.customerEmail } });
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";
        return ok({ downloadUrl: `${base}/shop/download?token=${newToken}`, expiresAt });
      }

      // email
      if (files.length === 0) return err("No generated files to email yet — run fulfillment first.", 400);
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";
      await sendShopPurchaseEmail({
        to: purchase.customerEmail,
        skills: purchase.skillsCsv.split(",").filter(Boolean),
        files: files.map((f) => ({ skill: f.skill, label: f.label, sheetCount: f.sheetCount, downloadUrl: f.url })),
        accessPageUrl: `${base}/shop/download?token=${purchase.downloadToken}`,
        amountCents: purchase.amountCents,
        expiresAt: purchase.expiresAt,
      });
      await logAdmin(ctx, "shop.resend_email", { entityType: "ShopPurchase", entityId: purchase.id, metadata: { email: purchase.customerEmail } });
      return ok({ emailed: true, to: purchase.customerEmail });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
