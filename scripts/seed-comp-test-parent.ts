// scripts/seed-comp-test-parent.ts — QA fixture: a fresh verified parent with
// NO children and NO subscription, to exercise the complimentary-access flow.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
(async () => {
  const email = "qa-comp-parent@eduyro.test";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) { await db.user.delete({ where: { email } }); console.log("removed stale fixture"); }
  const user = await db.user.create({
    data: {
      email, name: "QA Comp Parent", firstName: "QA", lastName: "CompParent",
      role: "PARENT", emailVerified: new Date(),
      passwordHash: await bcrypt.hash("QaComp!2026-secret", 12),
      parent: { create: {} },
    },
    select: { id: true },
  });
  console.log("created", email, user.id);
  await db.$disconnect();
})();
