// src/app/api/coppa/initiate/route.ts
// Called from registration when DOB shows child is under 13.

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, handleRouteError, parseRequest } from "@/lib/api/helpers";
import { initiateConsent, requiresParentalConsent } from "@/lib/coppa";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/coppa-emails";

const InitiateSchema = z.object({
  studentUserId: z.string().min(1),
  parentEmail: z.string().email(),
  parentFullName: z.string().min(2).max(120),
  consentMethod: z.enum([
    "CREDIT_CARD_MICROCHARGE",
    "GOVERNMENT_ID",
    "KNOWLEDGE_BASED_AUTH",
    "SCHOOL_TEACHER_AUTHORIZATION",
  ]),
});

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req, InitiateSchema);
  if ("status" in parsed) return parsed;
  const { studentUserId, parentEmail, parentFullName, consentMethod } = parsed.data;

  try {
    const student = await db.user.findUnique({
      where: { id: studentUserId },
      select: { firstName: true, dateOfBirth: true },
    });
    if (!student) return err("Student not found", 404);
    if (!student.dateOfBirth) return err("Student date of birth not set", 400);
    if (!requiresParentalConsent(student.dateOfBirth)) {
      return err("This student is 13 or older — COPPA consent not required", 400);
    }

    const result = await initiateConsent({
      studentUserId,
      childFirstName: student.firstName ?? "the child",
      childDateOfBirth: student.dateOfBirth,
      parentEmail,
      parentFullName,
      consentMethod,
    });

    // Send the parent the verification email
    await sendEmail({
      to: parentEmail,
      template: "consent_request",
      data: {
        parentName: parentFullName,
        childName: student.firstName ?? "your child",
        verificationUrl: result.parentVerificationUrl,
        expiresAt: result.expiresAt,
        consentMethod,
      },
    }).catch(console.error);

    return ok({
      consentRequestId: result.consentRequestId,
      parentVerificationUrl: result.parentVerificationUrl,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
