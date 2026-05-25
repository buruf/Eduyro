// src/app/api/content/reviews/bulk/route.ts
// Bulk approve / reject — for the curriculum specialist who's reviewed
// a batch and wants to take action on many at once.

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";

const BulkSchema = z.object({
  reviewIds: z.array(z.string()).min(1).max(500),
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, BulkSchema);
    if ("status" in parsed) return parsed;
    const { reviewIds, status, notes } = parsed.data;

    try {
      const reviewer = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, email: true },
      });

      const result = await db.contentReview.updateMany({
        where: { id: { in: reviewIds } },
        data: {
          status,
          reviewedById: ctx.userId,
          reviewerName: reviewer?.name ?? reviewer?.email ?? null,
          reviewedAt: new Date(),
          notes,
        },
      });

      // If rejecting, deactivate the worksheets
      if (status === "REJECTED") {
        const reviews = await db.contentReview.findMany({
          where: { id: { in: reviewIds } },
          select: { worksheetId: true },
        });
        await db.worksheet.updateMany({
          where: { id: { in: reviews.map((r) => r.worksheetId) } },
          data: { isActive: false },
        });
      }

      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: `content.bulk_review_${status.toLowerCase()}`,
          entityType: "content_review",
          metadata: { count: result.count, notes } as any,
        },
      });

      return ok({ updated: result.count });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
