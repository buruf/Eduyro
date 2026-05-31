import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/api/auth/verify-email/route.ts', 'utf8');

const old = `  return NextResponse.redirect(new URL("/signin?verified=1", req.url));`;

const replacement = `  const user = await db.user.findUnique({ where: { email: record.identifier } });
  if (user) {
    sendWelcomeEmail({ email: user.email, firstName: user.firstName ?? user.name?.split(" ")[0] ?? "there", role: user.role }).catch(console.error);
  }
  return NextResponse.redirect(new URL("/signin?verified=1", req.url));`;

c = c.replace(old, replacement);
writeFileSync('src/app/api/auth/verify-email/route.ts', c, 'utf8');
console.log('Done');