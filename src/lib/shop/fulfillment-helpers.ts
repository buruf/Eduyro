// src/lib/shop/fulfillment-helpers.ts
// Helper functions used by fulfillment and download routes.

import { getSignedDownloadUrl } from "@/lib/pdf/generator";

export async function getFreshDownloadUrl(fileKey: string): Promise<string> {
  return getSignedDownloadUrl(fileKey, 60 * 60 * 24 * 7); // 7 days
}
