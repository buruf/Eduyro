// src/app/api/content/reviews/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";

const ReviewActionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  notes: z.string().max(2000).optional(),
  issuesFound: z.array(z.object({
    type: z.string(),
    problemIdx: z.number().int().nonnegative(),
    note: z.string().max(500),
  })).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, ReviewActionSchema);
    if ("status" in parsed) return parsed;
    const { status, notes, issuesFound } = parsed.data;

    try {
      const reviewer = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, email: true },
      });

      const updated = await db.contentReview.update({
        where: { id: params.id },
        data: {
          status,
          reviewedById: ctx.userId,
          reviewerName: reviewer?.name ?? reviewer?.email ?? null,
          reviewedAt: new Date(),
          notes,
          issuesFound: issuesFound as any,
        },
      });

      // If rejected, deactivate the worksheet so it doesn't get served
      if (status === "REJECTED") {
        await db.worksheet.update({
          where: { id: updated.worksheetId },
          data: { isActive: false },
        });
      }

      // Audit log
      await db.auditLog.create({
        data: {
          userId: ctx.userId,
          action: `content.review_${status.toLowerCase()}`,
          entityType: "worksheet",
          entityId: updated.worksheetId,
          metadata: { notes, issueCount: issuesFound?.length ?? 0 } as any,
        },
      });

      return ok(updated);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
