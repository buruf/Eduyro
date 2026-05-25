// src/app/api/admin/audit-log/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    try {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);

      const logs = await db.auditLog.findMany({
        where: action ? { action: { startsWith: action } } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return ok({ logs });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
