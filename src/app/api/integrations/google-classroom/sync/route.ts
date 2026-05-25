// src/app/api/integrations/google-classroom/sync/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, err, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { syncRoster } from "@/lib/integrations/google-classroom/roster-sync";

const SyncRosterSchema = z.object({
  classroomCourseId: z.string().min(1),
  schoolId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  return withRole(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, SyncRosterSchema);
    if ("status" in parsed) return parsed;

    try {
      const result = await syncRoster({
        userId: ctx.userId,
        schoolId: parsed.data.schoolId,
        classroomCourseId: parsed.data.classroomCourseId,
      });
      return ok(result);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
