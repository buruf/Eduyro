// src/app/api/admin/users/route.ts
// GET /api/admin/users?q=  — search any user by email / name / id. ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
      const where = q
        ? { OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { id: q },
          ] }
        : {};
      const users = await db.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          suspendedAt: true, coppaConsentStatus: true,
          subscription: { select: { status: true, plan: true } },
          parent: { select: { _count: { select: { children: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return ok({ users, count: users.length });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
