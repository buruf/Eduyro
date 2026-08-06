// src/app/api/auth/resend-verification/route.ts
// POST /api/auth/resend-verification
// Resends the verification email for an unverified account.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { ok, err, handleRouteError, withRateLimit } from "@/lib/api/helpers";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, 3, 60_000); // 3 per minute
  if (limited) return limited;

  try {
    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) return err("Email is required", 400);

    const user = await db.user.findUnique({ where: { email } });

    // Don't reveal if email exists or not — just say "if it exists, we sent it"
    if (!user || user.emailVerified) {
      return ok({ message: "If that email exists and is unverified, we've sent a new link." });
    }

    // Delete old tokens for this email
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    // Create new token
    const token = nanoid(32);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    await sendVerificationEmail({
      email,
      firstName: user.firstName ?? user.name?.split(" ")[0] ?? "there",
      token,
    });

    return ok({ message: "Verification email sent. Check your inbox and spam folder." });
  } catch (error) {
    return handleRouteError(error);
  }
}
