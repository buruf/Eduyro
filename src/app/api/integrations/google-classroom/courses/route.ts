// src/app/api/integrations/google-classroom/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ok, err, handleRouteError, withAuth } from "@/lib/api/helpers";
import { listCourses } from "@/lib/integrations/google-classroom/roster-sync";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const courses = await listCourses(ctx.userId);
      return ok({ courses });
    } catch (error: any) {
      if (error.message?.includes("not connected")) {
        return err("Google Classroom not connected", 412, "NOT_CONNECTED");
      }
      return handleRouteError(error);
    }
  });
}
