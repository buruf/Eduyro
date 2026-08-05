// src/app/api/students/me/timezone/route.ts
// POST { timezone: "Asia/Tokyo" } — auto-captured from the student's browser
// (Intl.DateTimeFormat().resolvedOptions().timeZone) so the daily-quota day
// boundary rolls at THEIR local midnight, wherever they are in the world.
// Validates the IANA name server-side; only updates on change.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, notFound, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { z } from "zod";

const Schema = z.object({ timezone: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const tz = parsed.data.timezone;
    try {
      // Validate it's a real IANA zone (throws for junk input).
      try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { return err("Invalid timezone", 400); }
      const student = await db.student.findUnique({ where: { userId: ctx.userId }, select: { id: true, timezone: true } });
      if (!student) return notFound("Student");
      if (student.timezone !== tz) {
        await db.student.update({ where: { id: student.id }, data: { timezone: tz } });
      }
      return ok({ timezone: tz });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
