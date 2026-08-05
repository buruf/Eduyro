// scripts/qa-set-m3.ts — put the QA student on M3 (addition facts), near-doubles
// stage, so the hint fix + pace chip + fact sprint can be verified in-browser.
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills } from "../src/lib/worksheet/generator";
const db = new PrismaClient();
(async () => {
  const student = await db.student.findFirst({ where: { user: { email: "qa-army@eduyro.test" } }, select: { id: true } });
  const m3 = await db.level.findFirst({ where: { code: "M3" }, select: { id: true, subjectId: true } });
  if (!student || !m3) { console.log("missing student/M3"); return; }
  const skills = getMathLevelSkills("M3");
  const nearIdx = Math.max(0, skills.findIndex((s) => /near.?double/i.test(s.label)));
  const others = await db.level.findMany({ where: { subjectId: m3.subjectId }, select: { id: true } });
  await db.$transaction([
    db.completedSheet.deleteMany({ where: { studentId: student.id, worksheet: { levelId: m3.id } } }),
    db.dailyPacket.deleteMany({ where: { studentId: student.id, levelId: m3.id } }),
    db.studentProgress.updateMany({ where: { studentId: student.id, levelId: { in: others.map((o) => o.id) }, status: "IN_PROGRESS" }, data: { status: "NOT_STARTED" } }),
    db.studentProgress.upsert({
      where: { studentId_levelId: { studentId: student.id, levelId: m3.id } },
      update: { status: "IN_PROGRESS", currentSkillIndex: nearIdx, skillUnlockedAt: new Date(), sheetsCompleted: 0, correctAnswers: 0, totalAnswers: 0, lastAccuracyPct: 0, masteredAt: null },
      create: { studentId: student.id, levelId: m3.id, status: "IN_PROGRESS", currentSkillIndex: nearIdx, skillUnlockedAt: new Date() },
    }),
  ]);
  console.log(`QA student → M3 skill ${nearIdx} (${skills[nearIdx]?.label})`);
  await db.$disconnect();
})();
