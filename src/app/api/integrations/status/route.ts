// src/app/api/integrations/status/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withAuth } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const gc = await db.googleClassroomIntegration.findUnique({
        where: { userId: ctx.userId },
      });

      // Find school the user belongs to (for teacher/admin)
      const teacher = await db.teacher.findFirst({
        where: { userId: ctx.userId },
        include: { school: true },
      });

      return ok({
        googleClassroom: {
          connected: Boolean(gc),
          googleEmail: gc?.googleEmail ?? null,
          expiresAt: gc?.expiryDate ?? null,
        },
        school: teacher?.school
          ? { id: teacher.school.id, name: teacher.school.name }
          : null,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
