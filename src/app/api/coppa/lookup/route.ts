// src/app/api/coppa/lookup/route.ts
// Public read-only endpoint — parent verification page fetches details via this.
// No PII leakage: returns child first name only, no email, no progress data.

import { NextRequest } from "next/server";
import { ok, err, handleRouteError } from "@/lib/api/helpers";
import { getConsentRequestByToken } from "@/lib/coppa";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return err("Missing token", 400);

  try {
    const request = await getConsentRequestByToken(token);
    if (!request) return err("Invalid token", 404);
    if (request.status === "EXPIRED") return err("Verification link expired", 410);

    return ok({
      childFirstName: request.childFirstName,
      parentEmail: request.parentEmail,
      parentFullName: request.parentFullName,
      consentMethod: request.consentMethod,
      status: request.status,
      expiresAt: request.expiresAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
