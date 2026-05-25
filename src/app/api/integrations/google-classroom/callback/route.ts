// src/app/api/integrations/google-classroom/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/lib/integrations/google-classroom/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin?gc_error=${error}`, req.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/admin?gc_error=no_code", req.url));
  }

  // Verify state cookie (CSRF)
  const cookieStore = cookies();
  const storedState = cookieStore.get("gc_oauth_state")?.value;
  const userId = cookieStore.get("gc_oauth_userid")?.value;

  if (!storedState || state !== storedState || !userId) {
    return NextResponse.redirect(new URL("/admin?gc_error=state_mismatch", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await db.googleClassroomIntegration.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: new Date(tokens.expiryDate),
        googleEmail: tokens.email,
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiryDate: new Date(tokens.expiryDate),
        googleEmail: tokens.email,
      },
    });

    const response = NextResponse.redirect(new URL("/admin?gc_connected=1", req.url));
    response.cookies.delete("gc_oauth_state");
    response.cookies.delete("gc_oauth_userid");
    return response;
  } catch (err: any) {
    console.error("[GC OAuth] callback failed:", err);
    return NextResponse.redirect(new URL(`/admin?gc_error=token_exchange`, req.url));
  }
}
