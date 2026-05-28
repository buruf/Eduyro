// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/signin?error=missing-token", req.url));
  }

  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return NextResponse.redirect(new URL("/signin?error=invalid-token", req.url));
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/signin?error=expired-token", req.url));
  }

  await db.$transaction([
    db.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  const user = await db.user.findUnique({ where: { email: record.identifier } });
  if (user) {
    sendWelcomeEmail({ email: user.email, firstName: user.firstName ?? user.name?.split(" ")[0] ?? "there", role: user.role }).catch(console.error);
  }
  return NextResponse.redirect(new URL("/signin?verified=1", req.url));
}
