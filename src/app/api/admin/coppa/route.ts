// src/app/api/admin/coppa/route.ts
// GET  — COPPA consent queue (pending first) + recent decisions.
// POST — verify | revoke a consent request (audited). ADMIN / SUPER_ADMIN only.
// Legally mandatory: under-13 children require verifiable parental consent.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const requests = await db.coppaConsentRequest.findMany({
        select: {
          id: true, childFirstName: true, childDateOfBirth: true, parentEmail: true,
          parentFullName: true, consentMethod: true, status: true, verifiedAt: true,
          createdAt: true, expiresAt: true, studentUserId: true,
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
      });
      const pending = requests.filter(r => r.status === "PENDING").length;
      return ok({ requests, pending });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.object({ requestId: z.string(), action: z.enum(["verify", "revoke"]) });

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const { requestId, action } = parsed.data;
    try {
      const reqRow = await db.coppaConsentRequest.findUnique({ where: { id: requestId } });
      if (!reqRow) return notFound("Consent request");
      const status = action === "verify" ? "VERIFIED" : "DENIED";
      await db.$transaction([
        db.coppaConsentRequest.update({ where: { id: requestId }, data: { status, verifiedAt: action === "verify" ? new Date() : null } }),
        db.user.update({ where: { id: reqRow.studentUserId }, data: { coppaConsentStatus: status, coppaVerifiedAt: action === "verify" ? new Date() : null } }),
      ]);
      await logAdmin(ctx, `coppa.${action}`, { entityType: "CoppaConsentRequest", entityId: requestId, metadata: { childFirstName: reqRow.childFirstName, parentEmail: reqRow.parentEmail } });
      return ok({ status });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
