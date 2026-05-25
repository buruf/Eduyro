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
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
import { calculateAge, requiresParentalConsent } from "@/lib/coppa";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, 5, 60_000); // 5 per minute
  if (limited) return limited;

  const parsed = await parseRequest(req, RegisterSchema);
  if ("status" in parsed) return parsed;
  const { email, password, firstName, lastName, role, grade, dateOfBirth } = parsed.data as any;

  try {
    // Check existing
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return conflict("An account with this email already exists");

    // COPPA check — if student under 13, lock until parental consent
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;
    const needsCoppa = role === "STUDENT" && dob && requiresParentalConsent(dob);

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

    // Generate email verification token
    const token = nanoid(32);
    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send emails (non-blocking) — but skip welcome to children awaiting COPPA
    sendVerificationEmail({ email, firstName: firstName ?? "there", token }).catch(console.error);
    if (!needsCoppa) {
      sendWelcomeEmail({ email, firstName: firstName ?? "there", role }).catch(console.error);
    }

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
