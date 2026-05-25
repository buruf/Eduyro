// src/app/api/auth/reset-password/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, parseRequest } from "@/lib/api/helpers";
import { ResetPasswordSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req, ResetPasswordSchema);
  if ("status" in parsed) return parsed;
  const { token, password } = parsed.data;

  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) return err("Invalid or expired reset link", 400);
    if (resetToken.used) return err("This reset link has already been used", 400);
    if (resetToken.expires < new Date()) return err("This reset link has expired", 400);

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all sessions (force re-login)
      db.session.deleteMany({
        where: { user: { email: resetToken.email } },
      }),
    ]);

    return ok({ message: "Password updated successfully. You can now sign in." });
  } catch (error) {
    return handleRouteError(error);
  }
}
