// src/app/api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { ForgotPasswordSchema } from "@/lib/validation/schemas";
import { sendPasswordResetEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, 3, 60 * 60 * 1000); // 3 per hour
  if (limited) return limited;

  const parsed = await parseRequest(req, ForgotPasswordSchema);
  if ("status" in parsed) return parsed;
  const { email } = parsed.data;

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

      sendPasswordResetEmail({
        email,
        firstName: user.firstName ?? "there",
        token,
      }).catch(console.error);
    }

    return ok({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
