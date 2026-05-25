// src/app/api/integrations/google-classroom/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthUrl } from "@/lib/integrations/google-classroom/client";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Store state in a cookie for CSRF protection
  const state = nanoid(24);
  const authUrl = getAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("gc_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });
  response.cookies.set("gc_oauth_userid", session.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });
  return response;
}
