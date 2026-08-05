// src/lib/api/student-access.ts
// Shared authorization for /api/students/[id]/* routes.
//
// A TEACHER may only access students they are actually LINKED to via
// TeacherStudent. (Blanket `ctx.role === "TEACHER"` checks let ANY
// self-registered teacher account read/write ANY child's data — cross-tenant
// IDOR and a COPPA problem. Found in the Jul 2026 security audit.)
import { db } from "@/lib/db";

interface Ctx { userId: string; role: string; }

/**
 * True when `ctx` may access the student:
 *  - the student themselves
 *  - ADMIN / SUPER_ADMIN
 *  - a PARENT linked via ParentStudent (checked only when `parentLinks` not prefetched)
 *  - a TEACHER linked via TeacherStudent
 */
export async function canAccessStudent(
  ctx: Ctx,
  student: { id: string; userId: string },
  opts: { checkParent?: boolean } = {}
): Promise<boolean> {
  if (student.userId === ctx.userId) return true;
  if (ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN") return true;
  if (ctx.role === "TEACHER") {
    const link = await db.teacherStudent.findFirst({
      where: { studentId: student.id, teacher: { userId: ctx.userId } },
      select: { id: true },
    });
    return link !== null;
  }
  if (opts.checkParent !== false && ctx.role === "PARENT") {
    const link = await db.parentStudent.findFirst({
      where: { studentId: student.id, parent: { userId: ctx.userId } },
      select: { id: true },
    });
    return link !== null;
  }
  return false;
}
