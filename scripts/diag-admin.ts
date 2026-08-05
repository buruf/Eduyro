import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const admins = await db.user.findMany({ where: { role: { in: ["ADMIN","SUPER_ADMIN"] } }, select: { email: true, role: true } });
  console.log("admins:", admins);
  // Per-student: does each student have any active progress? (would they be asked to place?)
  const students = await db.student.findMany({ select: { id: true, grade: true, user: { select: { email: true, name: true } }, progress: { select: { status: true } }, placementTests: { select: { id: true, completedAt: true } } } });
  for (const s of students) {
    const active = s.progress.filter(p=>p.status==="IN_PROGRESS"||p.status==="MASTERED"||p.status==="REVIEWING").length;
    const placed = s.placementTests.filter(p=>p.completedAt).length;
    console.log(`${(s.user.name||s.user.email).padEnd(18)} grade=${(s.grade||'?').padEnd(8)} activeProgress=${active} totalProgress=${s.progress.length} placementsDone=${placed}`);
  }
  await db.$disconnect();
})();
