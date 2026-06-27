// src/lib/admin/audit.ts
// Every privileged admin action is written to the AuditLog (actor, target,
// before/after). This is the foundation of the admin tooling — impersonation,
// refunds, suspensions and deletions must all be auditable.
import { db } from "@/lib/db";
import type { AuthContext } from "@/lib/api/helpers";

export async function logAdmin(
  ctx: AuthContext,
  action: string,
  opts: { entityType?: string; entityId?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: ctx.userId,
        action: `admin.${action}`,
        entityType: opts.entityType,
        entityId: opts.entityId,
        metadata: { actorEmail: ctx.email, ...(opts.metadata ?? {}) } as any,
      },
    });
  } catch (e) {
    // Auditing must never block the action itself, but log loudly.
    console.error("[audit] failed to write admin log", action, e);
  }
}
