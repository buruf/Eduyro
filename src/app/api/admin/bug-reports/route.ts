// src/app/api/admin/bug-reports/route.ts
// GET  — list bug reports (NEW first). POST — resolve/reopen one. ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const reports = await db.bugReport.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
      });
      // Resolve reporter emails in one query (BugReport has no FK relation).
      const userIds = [...new Set(reports.map((r) => r.userId).filter(Boolean))] as string[];
      const users = await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } });
      const byId = new Map(users.map((u) => [u.id, u]));
      return ok({ reports: reports.map((r) => ({ ...r, reporter: r.userId ? byId.get(r.userId) ?? null : null })) });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({ id: z.string(), action: z.enum(["resolve", "reopen"]) });

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    try {
      const { id, action } = parsed.data;
      const report = await db.bugReport.findUnique({ where: { id } });
      if (!report) return err("Report not found", 404);
      await db.bugReport.update({
        where: { id },
        data: action === "resolve" ? { status: "RESOLVED", resolvedAt: new Date() } : { status: "NEW", resolvedAt: null },
      });
      await logAdmin(ctx, `bug_report.${action}`, { entityType: "BugReport", entityId: id });
      return ok({ done: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
