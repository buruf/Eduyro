// src/lib/cron/jobs/shop-expiry.ts
// Runs daily — marks shop purchases past their expiry as EXPIRED.
// (Optional future enhancement: also delete the S3 files to save storage.)

import { db } from "@/lib/db";

export async function expireOldShopPurchases(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  const result = await db.shopPurchase.updateMany({
    where: {
      status: "COMPLETED",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  return {
    recordsProcessed: result.count,
    metadata: { expired: result.count },
  };
}
