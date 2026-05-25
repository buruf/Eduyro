// src/lib/coppa/stripe-verification.ts
// COPPA-compliant parent verification via $0.50 credit card micro-charge.
// The charge is created, immediately captured, and refunded — leaving
// only an authoritative record that the parent owns the card.

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

const COPPA_VERIFICATION_AMOUNT_CENTS = 50; // $0.50

export interface VerificationChargeResult {
  paymentIntentId: string;
  status: "succeeded" | "failed" | "requires_action";
  clientSecret?: string;
  failureReason?: string;
}

/**
 * Step 1: Create a SetupIntent for verifying parent's card.
 * The frontend uses Stripe.js to confirm the card and capture
 * billing details. We don't charge yet — just verify the card is valid.
 */
export async function createVerificationSetupIntent(params: {
  parentEmail: string;
  consentRequestId: string;
}): Promise<{ clientSecret: string; setupIntentId: string }> {
  const intent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
    metadata: {
      purpose: "coppa_parental_verification",
      consentRequestId: params.consentRequestId,
      parentEmail: params.parentEmail,
    },
    description: "COPPA parental verification — $0.50 will be charged and immediately refunded",
  });

  return {
    clientSecret: intent.client_secret!,
    setupIntentId: intent.id,
  };
}

/**
 * Step 2: Charge $0.50 to the verified payment method, then refund it.
 * Creates a permanent record that we successfully charged the card,
 * which is the COPPA-acceptable evidence of parental verification.
 */
export async function executeVerificationCharge(params: {
  setupIntentId: string;
  consentRequestId: string;
}): Promise<VerificationChargeResult> {
  // Fetch the SetupIntent to get the verified payment method
  const setupIntent = await stripe.setupIntents.retrieve(params.setupIntentId);
  if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) {
    return { paymentIntentId: "", status: "failed", failureReason: "Setup not completed" };
  }

  try {
    // Create + immediately confirm the charge
    const payment = await stripe.paymentIntents.create({
      amount: COPPA_VERIFICATION_AMOUNT_CENTS,
      currency: "usd",
      payment_method: setupIntent.payment_method as string,
      confirm: true,
      off_session: true,
      capture_method: "automatic",
      description: "BrightSteps COPPA parental verification (will be refunded)",
      statement_descriptor_suffix: "COPPA VERIFY",
      metadata: {
        purpose: "coppa_parental_verification",
        consentRequestId: params.consentRequestId,
      },
    });

    if (payment.status !== "succeeded") {
      return {
        paymentIntentId: payment.id,
        status: payment.status as any,
        failureReason: `Status: ${payment.status}`,
      };
    }

    // Immediately refund
    await stripe.refunds.create({
      payment_intent: payment.id,
      reason: "requested_by_customer",
      metadata: {
        purpose: "coppa_verification_complete",
        consentRequestId: params.consentRequestId,
      },
    });

    return {
      paymentIntentId: payment.id,
      status: "succeeded",
    };
  } catch (err: any) {
    return {
      paymentIntentId: "",
      status: "failed",
      failureReason: err.message ?? "Unknown error",
    };
  }
}
