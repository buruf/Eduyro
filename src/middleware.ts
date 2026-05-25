// src/middleware.ts
// Route protection — redirects unauthenticated users away from protected pages

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that anyone can visit without signing in.
// Customers should be able to browse the shop, run the placement test,
// and use the public worksheet generator without an account.
const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/schools",
  "/pricing",
  "/about",
  "/terms",
  "/privacy",
  "/accessibility",
  // Public shop — anyone can browse, purchase, download
  "/shop",
  // Public placement test — marketed as "Free, no card required"
  "/placement",
  // Public worksheet generator tool
  "/pdf-generator",
];

const STUDENT_ROUTES = ["/student", "/onboarding"];
const PARENT_ROUTES = ["/parent"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes, static files, and Next internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // assets like .png, .css, .js
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public routes — always allowed
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    // If already signed in and visiting auth pages, redirect to dashboard
    if (token && (pathname === "/signin" || pathname === "/register")) {
      const dashUrl = roleToDashboard(token.role as string);
      return NextResponse.redirect(new URL(dashUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as string;

  // Role-based access control
  if (STUDENT_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!["STUDENT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL(roleToDashboard(role), req.url));
    }
  }
  if (PARENT_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!["PARENT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL(roleToDashboard(role), req.url));
    }
  }
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL(roleToDashboard(role), req.url));
    }
  }

  return NextResponse.next();
}

function roleToDashboard(role: string): string {
  switch (role) {
    case "STUDENT": return "/student";
    case "PARENT": return "/parent";
    case "TEACHER":
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    default: return "/";
  }
}

export const config = {
  matcher: ["/((?!api|_next|static|.*\\..*).*)"],
};
