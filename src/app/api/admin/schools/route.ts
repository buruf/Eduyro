// src/app/api/admin/schools/route.ts
// GET — school/teacher oversight for the platform owner: every school with its
// plan, seat usage (students), teacher count, and subscription status.
// ADMIN / SUPER_ADMIN only.  ?q= search by name/slug
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleRouteError, withRole } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  return withRole(req, ["ADMIN", "SUPER_ADMIN"], async () => {
    try {
      const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
      const schools = await db.school.findMany({
        where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : undefined,
        select: {
          id: true, name: true, slug: true, plan: true, city: true, province: true,
          contactEmail: true, createdAt: true,
          subscription: { select: { status: true, studentQuantity: true, currentPeriodEnd: true } },
          _count: { select: { students: true, teachers: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const rows = schools.map(s => ({
        id: s.id, name: s.name, slug: s.slug, plan: s.plan, city: s.city, province: s.province,
        contactEmail: s.contactEmail, createdAt: s.createdAt,
        students: s._count.students, teachers: s._count.teachers,
        seats: s.subscription?.studentQuantity ?? null,
        // Over-seat = more enrolled students than the subscription pays for.
        overSeat: s.subscription?.studentQuantity != null && s._count.students > s.subscription.studentQuantity,
        subStatus: s.subscription?.status ?? null,
        renewsAt: s.subscription?.currentPeriodEnd ?? null,
      }));

      return ok({
        schools: rows,
        summary: {
          total: rows.length,
          totalStudents: rows.reduce((a, r) => a + r.students, 0),
          totalTeachers: rows.reduce((a, r) => a + r.teachers, 0),
          overSeat: rows.filter(r => r.overSeat).length,
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
