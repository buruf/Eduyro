const fs = require('fs');
const f = 'src/lib/pdf/renderer.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix the equals sign logic:
// Old: append " =" if question doesn't END with "="
// New: only append " =" if question has NO "=" at all (e.g. "3 × 4")
// Algebra problems like "Solve: x + 11 = 9" already have "=" so don't add another
c = c.replace(
  '{p.question.endsWith("=") ? p.question : p.question + " ="}',
  '{p.question.includes("=") ? p.question : p.question + " ="}'
);

fs.writeFileSync(f, c);
const written = fs.readFileSync(f, 'utf8');
console.log('Fixed:', written.includes('p.question.includes("=")'));
