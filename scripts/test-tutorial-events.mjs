// scripts/test-tutorial-events.mjs — direct-prisma check of the model + upsert
// semantics (route auth is exercised manually in the browser).
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const student = await prisma.student.findFirst({ select: { id: true } });
const runId = `test-${Date.now()}`;
await prisma.tutorialEvent.upsert({ where: { runId }, create: { runId, studentId: student.id, skillId: "mul-tens", variant: "pilot" }, update: {} });
await prisma.tutorialEvent.upsert({ where: { runId }, create: { runId, studentId: student.id, skillId: "mul-tens", variant: "pilot" }, update: { beatIndex: 3, tapCount: 7, predictionAnswer: "60", predictionCorrect: true } });
const row = await prisma.tutorialEvent.findUnique({ where: { runId } });
console.log(row.beatIndex === 3 && row.predictionCorrect === true ? "PASS" : `FAIL ${JSON.stringify(row)}`);
await prisma.tutorialEvent.delete({ where: { runId } });
await prisma.$disconnect();
