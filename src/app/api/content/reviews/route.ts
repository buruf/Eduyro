// src/app/api/content/reviews/route.ts
// List worksheets pending review, filtered by level/subject/status.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") ?? "PENDING_REVIEW";
      const levelCode = url.searchParams.get("level");
      const subjectSlug = url.searchParams.get("subject");
      const page = parseInt(url.searchParams.get("page") ?? "1", 10);
      const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") ?? "20", 10), 100);

      const where: any = {};
      if (status !== "ALL") {
        where.status = status;
      }
      if (levelCode || subjectSlug) {
        where.worksheet = { level: {} };
        if (levelCode) where.worksheet.level.code = levelCode;
        if (subjectSlug) where.worksheet.level.subject = { slug: subjectSlug };
      }

      const [reviews, total] = await Promise.all([
        db.contentReview.findMany({
          where,
          include: {
            worksheet: {
              include: {
                level: { include: { subject: true } },
                skill: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.contentReview.count({ where }),
      ]);

      // Summary counts per status
      const summary = await db.contentReview.groupBy({
        by: ["status"],
        _count: true,
      });

      return ok({
        reviews,
        total,
        page,
        pageSize,
        summary: Object.fromEntries(summary.map((s) => [s.status, s._count])),
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
