// src/lib/compliance/consent.ts
// Records a user's acceptance of the CURRENT legal documents at signup, with
// jurisdiction + IP evidence. Built on the LegalDocument/LegalAcceptance
// versioning the admin console manages. Never throws into the signup path —
// failing to record consent must not block account creation, but is logged.
import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export type ConsentDocType = "TERMS" | "PRIVACY" | "COPPA_CONSENT";

// Country (ISO alpha-2) from the platform/CDN geo header. Vercel sets
// x-vercel-ip-country; we also accept a Cloudflare header and an explicit
// client-provided fallback.
export function getRequestCountry(req: NextRequest, fallback?: string | null): string | null {
  const h = req.headers;
  const c = h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || fallback || null;
  return c ? c.toUpperCase().slice(0, 2) : null;
}

export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

interface RecordConsentParams {
  userId: string;            // whose acceptance this is (the child, for a minor)
  types: ConsentDocType[];   // which current documents were accepted
  country?: string | null;
  ipAddress?: string | null;
  acceptedByUserId?: string | null; // parent/guardian when accepting on a child's behalf
}

// Records acceptance of the current version of each requested doc type.
// Types with no published "current" document are skipped (so signup still
// works before legal docs are published). Returns the types actually recorded.
export async function recordConsent(params: RecordConsentParams): Promise<ConsentDocType[]> {
  const recorded: ConsentDocType[] = [];
  try {
    const currentDocs = await db.legalDocument.findMany({
      where: { type: { in: params.types as any }, isCurrent: true },
      select: { id: true, type: true },
    });
    if (currentDocs.length === 0) return recorded;

    for (const doc of currentDocs) {
      await db.legalAcceptance.upsert({
        where: { userId_documentId: { userId: params.userId, documentId: doc.id } },
        create: {
          userId: params.userId, documentId: doc.id,
          country: params.country ?? null, ipAddress: params.ipAddress ?? null,
          acceptedByUserId: params.acceptedByUserId ?? null,
        },
        update: {
          acceptedAt: new Date(),
          country: params.country ?? null, ipAddress: params.ipAddress ?? null,
          acceptedByUserId: params.acceptedByUserId ?? null,
        },
      });
      recorded.push(doc.type as ConsentDocType);
    }
  } catch (e) {
    console.error("[consent] failed to record acceptance for", params.userId, e);
  }
  return recorded;
}
