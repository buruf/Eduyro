import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const [, , code = "M15", idxStr = "0"] = process.argv;
  const idx = parseInt(idxStr, 10);
  const student = await db.student.findFirst({ where: { user: { email: "qa-army@eduyro.test" } }, select: { id: true } });
  const level = await db.level.findFirst({ where: { code }, select: { id: true, subjectId: true } });
  if (!student || !level) { console.log("missing"); return; }
  const subjectLevels = await db.level.findMany({ where: { subjectId: level.subjectId }, select: { id: true } });
  await db.$transaction([
    db.studentProgress.updateMany({ where: { studentId: student.id, levelId: { in: subjectLevels.map(l => l.id) }, status: "IN_PROGRESS" }, data: { status: "NOT_STARTED" } }),
    db.studentProgress.upsert({
      where: { studentId_levelId: { studentId: student.id, levelId: level.id } },
      update: { status: "IN_PROGRESS", currentSkillIndex: idx, skillUnlockedAt: new Date(), sheetsCompleted: 0 },
      create: { studentId: student.id, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date(), currentSkillIndex: idx, skillUnlockedAt: new Date() },
    }),
    db.dailyPacket.deleteMany({ where: { studentId: student.id, levelId: level.id } }),
  ]);
  console.log(`qa-army → ${code} skill index ${idx}`);
  await db.$disconnect();
})();
