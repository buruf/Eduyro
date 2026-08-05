// src/app/api/admin/legal/route.ts
// Versioned legal documents (ToS / Privacy / COPPA consent) + acceptance stats.
// ADMIN / SUPER_ADMIN only. All writes audited.
//   GET  → all documents grouped by type, current version per type, acceptance
//          count of each current version vs total users.
//   POST { action }:
//     publish     { type, version, title, url?, summary? } → create + mark current
//     set-current { id }                                   → make a version current
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const [documents, totalUsers] = await Promise.all([
        db.legalDocument.findMany({
          orderBy: [{ type: "asc" }, { effectiveAt: "desc" }],
          select: { id: true, type: true, version: true, title: true, url: true, summary: true, effectiveAt: true, isCurrent: true, createdAt: true, _count: { select: { acceptances: true } } },
        }),
        db.user.count(),
      ]);
      const current = documents.filter(d => d.isCurrent).map(d => ({
        type: d.type, id: d.id, version: d.version,
        accepted: d._count.acceptances, totalUsers,
        acceptedPct: totalUsers > 0 ? Math.round((d._count.acceptances / totalUsers) * 100) : 0,
      }));
      return ok({ documents, current, totalUsers });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("publish"),
    type: z.enum(["TERMS", "PRIVACY", "COPPA_CONSENT"]),
    version: z.string().min(1).max(40),
    title: z.string().min(1).max(160),
    url: z.string().url().optional(),
    summary: z.string().max(2000).optional(),
  }),
  z.object({ action: z.literal("set-current"), id: z.string() }),
]);

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const data = parsed.data;
    try {
      if (data.action === "publish") {
        const exists = await db.legalDocument.findUnique({ where: { type_version: { type: data.type, version: data.version } }, select: { id: true } });
        if (exists) return err(`${data.type} version "${data.version}" already exists`, 409);
        // New version becomes the single current one for its type.
        const doc = await db.$transaction(async (tx) => {
          await tx.legalDocument.updateMany({ where: { type: data.type, isCurrent: true }, data: { isCurrent: false } });
          return tx.legalDocument.create({ data: { type: data.type, version: data.version, title: data.title, url: data.url ?? null, summary: data.summary ?? null, isCurrent: true } });
        });
        await logAdmin(ctx, "legal.publish", { entityType: "LegalDocument", entityId: doc.id, metadata: { type: data.type, version: data.version } });
        return ok({ document: doc });
      }

      // set-current
      const doc = await db.legalDocument.findUnique({ where: { id: data.id }, select: { id: true, type: true, version: true } });
      if (!doc) return notFound("Legal document");
      await db.$transaction([
        db.legalDocument.updateMany({ where: { type: doc.type, isCurrent: true }, data: { isCurrent: false } }),
        db.legalDocument.update({ where: { id: doc.id }, data: { isCurrent: true } }),
      ]);
      await logAdmin(ctx, "legal.set_current", { entityType: "LegalDocument", entityId: doc.id, metadata: { type: doc.type, version: doc.version } });
      return ok({ updated: true });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
