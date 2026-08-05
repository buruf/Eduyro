// src/app/api/feedback/route.ts
// "Report a problem" from the student/parent dashboards. Stored as BugReport
// rows and triaged in the admin Support tab.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { z } from "zod";

const Schema = z.object({
  category: z.enum(["practice", "worksheet", "billing", "other"]),
  message: z.string().min(5).max(2000),
  page: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    try {
      // Light abuse guard: max 10 open reports per user per day.
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const recent = await db.bugReport.count({ where: { userId: ctx.userId, createdAt: { gte: since } } });
      if (recent >= 10) return err("Too many reports today — thank you, we have them!", 429);

      const report = await db.bugReport.create({
        data: {
          userId: ctx.userId,
          role: ctx.role,
          page: parsed.data.page,
          category: parsed.data.category,
          message: parsed.data.message,
        },
      });
      return ok({ id: report.id });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
