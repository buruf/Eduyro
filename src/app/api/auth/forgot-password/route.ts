// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, parseRequest, withRateLimit, rateLimit } from "@/lib/api/helpers";
import { ForgotPasswordSchema } from "@/lib/validation/schemas";
import { sendPasswordResetEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  // Rate limit to stop reset-email flooding / enumeration probing: per IP AND
  // per target email (a generic success is returned regardless, so limits are
  // the only brake on abuse).
  const ipLimited = await withRateLimit(req, 8, 15 * 60_000);
  if (ipLimited) return ipLimited;

  const parsed = await parseRequest(req, ForgotPasswordSchema);
  if ("status" in parsed) return parsed;
  const { email } = parsed.data;

  if (!(await rateLimit(`forgot-pw:${email}`, 3, 60 * 60_000))) {
    // Same shape as success — never reveal that a limit (or the account) exists.
    return ok({ message: "If an account exists with that email, a reset link has been sent." });
  }

  try {
    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });

    if (user && user.provider === "EMAIL") {
      // Invalidate old tokens
      await db.passwordResetToken.updateMany({
        where: { email, used: false },
        data: { used: true },
      });

      const token = nanoid(32);
      await db.passwordResetToken.create({
        data: {
          email,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await sendPasswordResetEmail({
        email,
        firstName: user.firstName ?? "there",
        token,
      });
    }

    return ok({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
