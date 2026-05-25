// src/app/api/coppa/verify/route.ts
// Called from the parent verification page when they submit
// (Stripe SetupIntent succeeds).

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, handleRouteError, parseRequest } from "@/lib/api/helpers";
import {
  approveConsent,
  denyConsent,
  getConsentRequestByToken,
} from "@/lib/coppa";
import { executeVerificationCharge } from "@/lib/coppa/stripe-verification";
import { sendEmail } from "@/lib/email/coppa-emails";

const VerifySchema = z.object({
  verificationToken: z.string().min(1),
  setupIntentId: z.string().optional(),
  approve: z.boolean(),
  denialReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req, VerifySchema);
  if ("status" in parsed) return parsed;
  const { verificationToken, setupIntentId, approve, denialReason } = parsed.data;

  try {
    const request = await getConsentRequestByToken(verificationToken);
    if (!request) return err("Invalid verification token", 404);
    if (request.status === "EXPIRED") return err("Verification link expired", 410);
    if (request.status !== "PENDING") {
      return err(`Already ${request.status.toLowerCase()}`, 409);
    }

    if (!approve) {
      await denyConsent(request.id, denialReason);
      return ok({ status: "DENIED" });
    }

    // Approval path — verify via the chosen method
    if (request.consentMethod === "CREDIT_CARD_MICROCHARGE") {
      if (!setupIntentId) return err("Missing setupIntentId for credit card method", 400);

      const result = await executeVerificationCharge({
        setupIntentId,
        consentRequestId: request.id,
      });

      if (result.status !== "succeeded") {
        return err(`Verification failed: ${result.failureReason}`, 402);
      }

      await approveConsent({
        consentRequestId: request.id,
        verificationMethod: "CREDIT_CARD_MICROCHARGE",
        verificationEvidence: {
          paymentIntentId: result.paymentIntentId,
          amountCents: 50,
          chargedAt: new Date().toISOString(),
          refunded: true,
        },
      });
    } else {
      // Other methods (Government ID, KBA) require additional flows
      // For now, just record manually-approved with limited evidence
      await approveConsent({
        consentRequestId: request.id,
        verificationMethod: request.consentMethod as any,
        verificationEvidence: { method: request.consentMethod, approvedAt: new Date().toISOString() },
      });
    }

    // Notify parent of confirmation
    await sendEmail({
      to: request.parentEmail,
      template: "consent_confirmed",
      data: {
        parentName: request.parentFullName,
        childName: request.childFirstName,
      },
    }).catch(console.error);

    return ok({ status: "VERIFIED" });
  } catch (error) {
    return handleRouteError(error);
  }
}
