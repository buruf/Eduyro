import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const code = process.argv[2] ?? "M7";
  const student = await db.student.findFirst({ where: { user: { email: "qa-army@eduyro.test" } }, select: { id: true } });
  const level = await db.level.findFirst({ where: { code }, select: { id: true, subjectId: true } });
  if (!student || !level) { console.log("missing", { student: !!student, level: !!level }); return; }
  const sibs = await db.level.findMany({ where: { subjectId: level.subjectId }, select: { id: true } });
  await db.$transaction([
    db.studentProgress.updateMany({ where: { studentId: student.id, levelId: { in: sibs.map((l) => l.id) }, status: "IN_PROGRESS" }, data: { status: "NOT_STARTED" } }),
    db.studentProgress.upsert({
      where: { studentId_levelId: { studentId: student.id, levelId: level.id } },
      update: { status: "IN_PROGRESS", currentSkillIndex: 0, skillUnlockedAt: new Date(), sheetsCompleted: 0 },
      create: { studentId: student.id, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date(), currentSkillIndex: 0, skillUnlockedAt: new Date() },
    }),
    db.dailyPacket.deleteMany({ where: { studentId: student.id, levelId: level.id } }),
  ]);
  console.log(`qa-army → ${code} skill 0`);
  await db.$disconnect();
})();
