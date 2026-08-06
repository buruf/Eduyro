// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  ok,
  err,
  conflict,
  handleRouteError,
  parseRequest,
  withRateLimit,
} from "@/lib/api/helpers";
import { RegisterSchema } from "@/lib/validation/schemas";
import { sendVerificationEmail } from "@/lib/email";
import { calculateAge, requiresParentalConsent } from "@/lib/compliance/consent-age";
import { recordConsent, getRequestCountry, getClientIp } from "@/lib/compliance/consent";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, 5, 60_000); // 5 per minute
  if (limited) return limited;

  const parsed = await parseRequest(req, RegisterSchema);
  if ("status" in parsed) return parsed;
  const { email, password, firstName, lastName, role, grade, dateOfBirth, countryCode } = parsed.data as any;

  // Jurisdiction evidence captured at signup (worldwide compliance).
  const country = getRequestCountry(req, countryCode);
  const ipAddress = getClientIp(req);

  try {
    // Check existing
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return conflict("An account with this email already exists");

    // Parental-consent check — jurisdiction-aware (digital consent age varies by
    // country: US 13 / COPPA, EU 13–16, default 16). Under threshold → lock until
    // a parent gives verifiable consent.
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;
    const needsCoppa = role === "STUDENT" && dob && requiresParentalConsent(dob, country);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + role record in transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role,
          provider: "EMAIL",
          dateOfBirth: dob,
          requiresCoppaConsent: needsCoppa ?? false,
          coppaConsentStatus: needsCoppa ? "PENDING" : null,
        },
      });

      if (role === "STUDENT") {
        await tx.student.create({
          data: { userId: newUser.id, grade, dateOfBirth: dob },
        });
      } else if (role === "PARENT") {
        await tx.parent.create({
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    // Record acceptance of the current Terms & Privacy Policy with jurisdiction
    // + IP evidence (non-blocking — never fails signup). A self-registering
    // minor is locked pending parental consent, so only the adult-facing docs
    // are recorded here; parental COPPA consent is recorded when a parent acts.
    await recordConsent({ userId: user.id, types: ["TERMS", "PRIVACY"], country, ipAddress });

    // Generate email verification token
    const token = nanoid(32);
    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email (non-blocking).
    sendVerificationEmail({ email, firstName: firstName ?? "there", token }).catch(console.error);

    return ok(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        requiresCoppaConsent: Boolean(needsCoppa),
        age: dob ? calculateAge(dob) : null,
        message: needsCoppa
          ? "Account created. Parental consent required before sign-in."
          : "Account created. Check your email to verify.",
      },
      201
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
