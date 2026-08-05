// src/app/api/admin/logs/route.ts
// Audit-log viewer: every privileged action (logAdmin) + recent bug reports.
// ADMIN only, read-only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
      const logs = await db.auditLog.findMany({
        where: q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { entityId: { contains: q } }] } : undefined,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return ok({ logs });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
