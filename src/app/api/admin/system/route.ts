// src/app/api/admin/system/route.ts
// GET  — operational watch: failed/recent PDF exports, recent shop purchases &
//        their fulfillment status, and the recent admin audit log.
// POST — retry shop fulfillment for a purchase (protects paid delivery).
// ADMIN / SUPER_ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { generatePdfsForPurchase } from "@/lib/shop/fulfillment";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const [pdfExports, shopPurchases, audit] = await Promise.all([
        db.pdfExport.findMany({ select: { id: true, type: true, sheetCount: true, fileUrl: true, createdAt: true, studentId: true, schoolId: true }, orderBy: { createdAt: "desc" }, take: 20 }),
        db.shopPurchase.findMany({ select: { id: true, customerEmail: true, skillsCsv: true, amountCents: true, status: true, createdAt: true, _count: { select: { files: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
        db.auditLog.findMany({ where: { action: { startsWith: "admin." } }, select: { id: true, userId: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 }),
      ]);
      return ok({ pdfExports, shopPurchases, audit });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({ action: z.literal("retry-shop"), purchaseId: z.string() });

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const { purchaseId } = parsed.data;
    try {
      const purchase = await db.shopPurchase.findUnique({ where: { id: purchaseId }, select: { id: true, customerEmail: true } });
      if (!purchase) return notFound("Shop purchase");
      await generatePdfsForPurchase(purchaseId); // idempotent — skips if files already exist
      await logAdmin(ctx, "system.retry_shop_fulfillment", { entityType: "ShopPurchase", entityId: purchaseId, metadata: { email: purchase.customerEmail } });
      return ok({ retried: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
