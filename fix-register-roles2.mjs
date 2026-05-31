import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(auth)/register/page.tsx', 'utf8');
const lines = c.split('\n');
const newLines = lines.filter(line => 
  !line.includes('"STUDENT"') && 
  !line.includes('ROLES:') &&
  !line.includes('id: Role') &&
  !line.trim().startsWith('{ id: "PARENT"') === false
);

// Better approach - find and replace the ROLES array
const start = c.indexOf('const ROLES:');
const end = c.indexOf('];', start) + 2;
const oldRoles = c.substring(start, end);
c = c.replace(oldRoles, '');

writeFileSync('src/app/(auth)/register/page.tsx', c, 'utf8');
console.log('Done');
console.log('Remaining STUDENT refs:', (c.match(/"STUDENT"/g) || []).length);