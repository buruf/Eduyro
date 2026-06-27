// src/app/api/admin/users/[id]/route.ts
// GET  — full account detail (linked students, subscription, consent).
// POST — privileged action: suspend | unsuspend | reset-password | delete.
// All actions are audited. ADMIN / SUPER_ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const user = await db.user.findUnique({
        where: { id: params.id },
        select: {
          id: true, email: true, name: true, firstName: true, lastName: true, role: true,
          createdAt: true, lastActiveAt: true, suspendedAt: true, suspendedReason: true,
          dateOfBirth: true, requiresCoppaConsent: true, coppaConsentStatus: true,
          subscription: true,
          parent: { select: { children: { select: { student: { select: { id: true, user: { select: { name: true, email: true } } } } } } } },
          student: { select: { id: true, grade: true, totalSheetsCompleted: true, currentStreak: true, parentLinks: { select: { parent: { select: { user: { select: { email: true } } } } } } } },
          coppaConsentRequests: { select: { id: true, status: true, consentMethod: true, verifiedAt: true, createdAt: true }, orderBy: { createdAt: "desc" } },
        },
      });
      if (!user) return notFound("User");
      return ok({ user });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const ActionSchema = z.object({
  action: z.enum(["suspend", "unsuspend", "reset-password", "delete"]),
  reason: z.string().max(300).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, ActionSchema);
    if ("status" in parsed) return parsed;
    const { action, reason } = parsed.data;
    try {
      const user = await db.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, role: true } });
      if (!user) return notFound("User");
      if (user.id === ctx.userId && (action === "suspend" || action === "delete")) return err("You can't suspend or delete your own account", 400);

      if (action === "suspend") {
        await db.user.update({ where: { id: user.id }, data: { suspendedAt: new Date(), suspendedReason: reason ?? null } });
        await db.session.deleteMany({ where: { userId: user.id } }); // force logout
        await logAdmin(ctx, "user.suspend", { entityType: "User", entityId: user.id, metadata: { email: user.email, reason } });
        return ok({ suspended: true });
      }
      if (action === "unsuspend") {
        await db.user.update({ where: { id: user.id }, data: { suspendedAt: null, suspendedReason: null } });
        await logAdmin(ctx, "user.unsuspend", { entityType: "User", entityId: user.id, metadata: { email: user.email } });
        return ok({ suspended: false });
      }
      if (action === "reset-password") {
        // Issue a one-time temporary password (shown ONCE to the admin to relay).
        const temp = `Eduyro-${nanoid(10)}`;
        await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(temp, 12) } });
        await db.session.deleteMany({ where: { userId: user.id } });
        await logAdmin(ctx, "user.reset_password", { entityType: "User", entityId: user.id, metadata: { email: user.email } });
        return ok({ tempPassword: temp });
      }
      if (action === "delete") {
        // COPPA / DSAR deletion. Cascades to Student/Parent/CompletedSheet/etc.
        // via onDelete: Cascade relations; the User row is the root.
        await logAdmin(ctx, "user.delete", { entityType: "User", entityId: user.id, metadata: { email: user.email, role: user.role, reason } });
        await db.user.delete({ where: { id: user.id } });
        return ok({ deleted: true });
      }
      return err("Unknown action", 400);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
