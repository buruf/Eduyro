// src/app/api/students/me/dashboard/route.ts
// Convenience route: resolves the current user to their student ID
// and forwards to the dashboard handler.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { ok, notFound, handleRouteError, withAuth } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const student = await db.student.findUnique({
        where: { userId: ctx.userId },
      });
      if (!student) return notFound("Student profile");

      // Redirect to the canonical dashboard endpoint
      return NextResponse.redirect(
        new URL(`/api/students/${student.id}/dashboard`, req.url),
        307
      );
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
