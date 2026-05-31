import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const levels = await db.level.findMany({
  where: { subject: { slug: 'MATH' } },
  orderBy: { sortOrder: 'asc' },
  include: { skills: { orderBy: { sortOrder: 'asc' } } }
});
for (const level of levels) {
  console.log(`\n${level.code}: ${level.name}`);
  level.skills.forEach(s => console.log(` - ${s.name}`));
}
await db.$disconnect();