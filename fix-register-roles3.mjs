import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(auth)/register/page.tsx', 'utf8');

// Fix Google sign in - always go to parent dashboard
c = c.replace(
  'callbackUrl: role === "STUDENT" ? "/placement" : "/parent"',
  'callbackUrl: "/parent"'
);

// Remove the grade selector - only shown for students
const gradeStart = c.indexOf('{role === "STUDENT" && (');
const gradeEnd = c.indexOf(')}', gradeStart) + 2;
c = c.substring(0, gradeStart) + c.substring(gradeEnd);

writeFileSync('src/app/(auth)/register/page.tsx', c, 'utf8');
console.log('Done');
console.log('Remaining STUDENT refs:', (c.match(/"STUDENT"/g) || []).length);