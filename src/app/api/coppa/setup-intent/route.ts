// src/app/api/coppa/setup-intent/route.ts
// Returns a Stripe SetupIntent client secret so the parent can verify
// their card via Stripe Elements on the verification page.

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, handleRouteError, parseRequest } from "@/lib/api/helpers";
import { createVerificationSetupIntent } from "@/lib/coppa/stripe-verification";
import { getConsentRequestByToken } from "@/lib/coppa";

const SetupIntentSchema = z.object({
  verificationToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req, SetupIntentSchema);
  if ("status" in parsed) return parsed;

  try {
    const request = await getConsentRequestByToken(parsed.data.verificationToken);
    if (!request) return err("Invalid token", 404);
    if (request.status === "EXPIRED") return err("Verification link expired", 410);
    if (request.status !== "PENDING") return err(`Already ${request.status.toLowerCase()}`, 409);

    const { clientSecret, setupIntentId } = await createVerificationSetupIntent({
      parentEmail: request.parentEmail,
      consentRequestId: request.id,
    });

    return ok({ clientSecret, setupIntentId });
  } catch (error) {
    return handleRouteError(error);
  }
}
