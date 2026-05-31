import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const level = await db.level.findFirst({
  where: { code: 'M16' },
  include: { skills: { orderBy: { sortOrder: 'asc' } } }
});
if (level) {
  console.log(`M16: ${level.name}`);
  level.skills.forEach(s => console.log(' -', s.name));
} else {
  console.log('M16 not found');
}
await db.$disconnect();
