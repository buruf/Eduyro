// src/app/api/admin/moderation/route.ts
// GET — content-moderation summary for the platform console: ContentReview
// counts by status + most-recent pending items. The full review/triage UI lives
// at /admin/content-review; this surfaces the queue health in the admin console.
// ADMIN / SUPER_ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const [grouped, pending] = await Promise.all([
        db.contentReview.groupBy({ by: ["status"], _count: { _all: true } }),
        db.contentReview.findMany({
          where: { status: "PENDING_REVIEW" },
          select: {
            id: true, status: true, createdAt: true,
            worksheet: { select: { title: true, problemCount: true, level: { select: { code: true, subject: { select: { name: true } } } }, skill: { select: { name: true } } } },
          },
          orderBy: { createdAt: "asc" },
          take: 12,
        }),
      ]);
      const counts: Record<string, number> = { PENDING_REVIEW: 0, APPROVED: 0, REJECTED: 0, NEEDS_REVISION: 0, DRAFT: 0 };
      for (const g of grouped) counts[g.status] = g._count._all;
      return ok({ counts, pending });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
