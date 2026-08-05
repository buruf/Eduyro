// src/app/api/admin/support/route.ts
// Owner support tooling. ADMIN / SUPER_ADMIN only. All write actions audited.
//   GET  ?email=  → 360° lookup: account + linked students + shop purchases
//   POST { action }:
//     resend-verification  { email }  → fresh verification link (if unverified)
//     send-reset           { email }  → password-reset link
//     regenerate-download  { token }  → new shop download token + extended expiry
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { logAdmin } from "@/lib/admin/audit";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import { z } from "zod";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const email = new URL(req.url).searchParams.get("email")?.toLowerCase().trim();

      // No email → RECENT purchases across all customers, so the admin can see
      // what was bought/downloaded at a glance without knowing an email first.
      if (!email) {
        const purchases = await db.shopPurchase.findMany({
          select: { id: true, customerEmail: true, skillsCsv: true, status: true, amountCents: true, downloadToken: true, downloadCount: true, expiresAt: true, createdAt: true, _count: { select: { files: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        return ok({ user: null, purchases, recent: true });
      }

      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, name: true, firstName: true, role: true,
          emailVerified: true, createdAt: true, lastActiveAt: true, suspendedAt: true,
          subscription: { select: { plan: true, status: true } },
          student: { select: { grade: true, totalSheetsCompleted: true, currentStreak: true } },
          parent: { select: { children: { select: { student: { select: { user: { select: { name: true, email: true } } } } } } } },
        },
      });

      // Shop purchases are keyed by email, not user account — surface them too.
      const purchases = await db.shopPurchase.findMany({
        where: { customerEmail: email },
        select: { id: true, skillsCsv: true, status: true, amountCents: true, downloadToken: true, downloadCount: true, expiresAt: true, createdAt: true, _count: { select: { files: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return ok({ user, purchases });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

const Schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resend-verification"), email: z.string().email() }),
  z.object({ action: z.literal("send-reset"), email: z.string().email() }),
  z.object({ action: z.literal("regenerate-download"), token: z.string() }),
]);

export async function POST(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const data = parsed.data;
    try {
      if (data.action === "resend-verification") {
        const email = data.email.toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email }, select: { email: true, firstName: true, name: true, emailVerified: true } });
        if (!user) return notFound("User");
        if (user.emailVerified) return err("Account is already verified", 400);
        await db.verificationToken.deleteMany({ where: { identifier: email } });
        const token = nanoid(32);
        await db.verificationToken.create({ data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
        await sendVerificationEmail({ email, firstName: user.firstName ?? user.name?.split(" ")[0] ?? "there", token });
        await logAdmin(ctx, "support.resend_verification", { entityType: "User", metadata: { email } });
        return ok({ sent: true });
      }

      if (data.action === "send-reset") {
        const email = data.email.toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email }, select: { email: true, firstName: true, name: true } });
        if (!user) return notFound("User");
        await db.passwordResetToken.deleteMany({ where: { email, used: false } });
        const token = nanoid(32);
        await db.passwordResetToken.create({ data: { email, token, expires: new Date(Date.now() + 60 * 60 * 1000) } });
        await sendPasswordResetEmail({ email, firstName: user.firstName ?? user.name?.split(" ")[0] ?? "there", token });
        await logAdmin(ctx, "support.send_reset", { entityType: "User", metadata: { email } });
        return ok({ sent: true });
      }

      // regenerate-download
      const purchase = await db.shopPurchase.findUnique({ where: { downloadToken: data.token }, select: { id: true, customerEmail: true } });
      if (!purchase) return notFound("Shop purchase");
      const newToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fresh 30-day window
      await db.shopPurchase.update({ where: { id: purchase.id }, data: { downloadToken: newToken, downloadCount: 0, expiresAt } });
      await logAdmin(ctx, "support.regenerate_download", { entityType: "ShopPurchase", entityId: purchase.id, metadata: { email: purchase.customerEmail } });
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";
      return ok({ downloadUrl: `${base}/shop/download?token=${newToken}`, expiresAt });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
