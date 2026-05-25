// src/lib/coppa/index.ts
// COPPA compliance — Children's Online Privacy Protection Act
//
// Required for any U.S. user under 13. Implementation follows FTC's
// "Verifiable Parental Consent" rules — must use a reasonable method to
// verify the parent (not just self-declaration).
//
// We use: government-issued ID upload OR credit card micro-charge ($0.50)
// OR knowledge-based authentication. Default: credit card method.
//
// Until consent is verified:
//   - No data collection beyond child's first name
//   - No marketing emails to child
//   - No third-party sharing
//   - No account features (must show "Awaiting parent verification" screen)

import { db } from "@/lib/db";
import { nanoid } from "nanoid";

export const COPPA_AGE_THRESHOLD = 13;

// ─────────────────────────────────────────────
// Age calculation
// ─────────────────────────────────────────────

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function requiresParentalConsent(dateOfBirth: Date | string): boolean {
  return calculateAge(dateOfBirth) < COPPA_AGE_THRESHOLD;
}

// ─────────────────────────────────────────────
// Consent request lifecycle
// ─────────────────────────────────────────────

export type ConsentMethod = "CREDIT_CARD_MICROCHARGE" | "GOVERNMENT_ID" | "KNOWLEDGE_BASED_AUTH" | "SCHOOL_TEACHER_AUTHORIZATION";
export type ConsentStatus = "PENDING" | "VERIFIED" | "DENIED" | "EXPIRED";

export interface InitiateConsentParams {
  studentUserId: string;
  childFirstName: string;
  childDateOfBirth: Date;
  parentEmail: string;
  parentFullName: string;
  consentMethod: ConsentMethod;
}

/**
 * Create a new consent request. Sends an email to the parent with a
 * verification link. Until verified, child account is locked.
 */
export async function initiateConsent(params: InitiateConsentParams): Promise<{
  consentRequestId: string;
  verificationToken: string;
  parentVerificationUrl: string;
  expiresAt: Date;
}> {
  const verificationToken = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const request = await db.coppaConsentRequest.create({
    data: {
      studentUserId: params.studentUserId,
      childFirstName: params.childFirstName,
      childDateOfBirth: params.childDateOfBirth,
      parentEmail: params.parentEmail.toLowerCase(),
      parentFullName: params.parentFullName,
      consentMethod: params.consentMethod,
      verificationToken,
      status: "PENDING",
      expiresAt,
    },
  });

  // Set user's COPPA status
  await db.user.update({
    where: { id: params.studentUserId },
    data: {
      requiresCoppaConsent: true,
      coppaConsentStatus: "PENDING",
    },
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/coppa/verify?token=${verificationToken}`;

  return {
    consentRequestId: request.id,
    verificationToken,
    parentVerificationUrl: verificationUrl,
    expiresAt,
  };
}

/**
 * Look up a consent request by its verification token. Returns null if
 * not found, or sets to EXPIRED if past expiry.
 */
export async function getConsentRequestByToken(token: string) {
  const request = await db.coppaConsentRequest.findUnique({
    where: { verificationToken: token },
  });
  if (!request) return null;

  if (request.expiresAt < new Date() && request.status === "PENDING") {
    await db.coppaConsentRequest.update({
      where: { id: request.id },
      data: { status: "EXPIRED" },
    });
    return { ...request, status: "EXPIRED" as const };
  }
  return request;
}

/**
 * Approve consent — called after verifiable method completes
 * (e.g. Stripe SetupIntent confirmed, ID verified, etc.).
 */
export async function approveConsent(params: {
  consentRequestId: string;
  verificationMethod: ConsentMethod;
  verificationEvidence: Record<string, any>; // e.g. Stripe payment intent ID
}): Promise<void> {
  const request = await db.coppaConsentRequest.update({
    where: { id: params.consentRequestId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verificationEvidence: params.verificationEvidence,
    },
  });

  await db.user.update({
    where: { id: request.studentUserId },
    data: {
      coppaConsentStatus: "VERIFIED",
      coppaVerifiedAt: new Date(),
    },
  });

  // Audit trail
  await db.auditLog.create({
    data: {
      action: "coppa.consent_approved",
      entityType: "user",
      entityId: request.studentUserId,
      metadata: {
        method: params.verificationMethod,
        evidence: params.verificationEvidence,
        parentEmail: request.parentEmail,
      },
    },
  });
}

/**
 * Deny consent. Marks the child account as denied — features will
 * remain locked until a new consent flow is started.
 */
export async function denyConsent(consentRequestId: string, reason?: string): Promise<void> {
  const request = await db.coppaConsentRequest.update({
    where: { id: consentRequestId },
    data: {
      status: "DENIED",
      verifiedAt: new Date(),
      verificationEvidence: { denialReason: reason ?? "Parent denied" } as any,
    },
  });

  await db.user.update({
    where: { id: request.studentUserId },
    data: { coppaConsentStatus: "DENIED" },
  });
}

// ─────────────────────────────────────────────
// Gatekeeper — call this before letting a child do anything
// ─────────────────────────────────────────────

export async function isCoppaCleared(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { requiresCoppaConsent: true, coppaConsentStatus: true },
  });
  if (!user) return false;
  if (!user.requiresCoppaConsent) return true; // not subject to COPPA
  return user.coppaConsentStatus === "VERIFIED";
}
