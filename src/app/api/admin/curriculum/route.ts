// src/app/api/admin/curriculum/route.ts
// READ-ONLY curriculum browser: every level's engine unit map (label, sheet
// range, worked-example presence). The curriculum itself is code — validated,
// audited and version-controlled — so the admin gets visibility, not editing.
// ADMIN only.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";
import { getMathLevelSkills } from "@/lib/worksheet/generator";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const levels = await db.level.findMany({
        where: { isActive: true },
        orderBy: [{ subject: { name: "asc" } }, { sortOrder: "asc" }],
        include: { subject: { select: { slug: true, name: true } }, skills: { orderBy: { sortOrder: "asc" }, select: { name: true, totalSheets: true } } },
      });

      const out = levels.map((l) => {
        const isMath = l.subject.slug === "MATH";
        const units = isMath
          ? getMathLevelSkills(l.code).map((u) => ({
              label: u.label,
              sheets: u.range ? u.range[1] - u.range[0] + 1 : null,
              range: u.range ?? null,
            }))
          : l.skills.map((s) => ({ label: s.name, sheets: s.totalSheets, range: null }));
        return {
          subject: l.subject.name,
          subjectSlug: l.subject.slug,
          code: l.code,
          name: l.name,
          grades: `${l.gradeMin}–${l.gradeMax}`,
          masteryThresholdPct: l.masteryThresholdPct,
          sheetsPerDay: l.sheetsPerDay,
          unitCount: units.length,
          units,
        };
      });

      return ok({ levels: out });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
