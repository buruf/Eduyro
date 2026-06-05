const fs = require('fs');
const f = 'src/lib/math/pdf-math.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix the invalid regex — replace [→->]+ with (→|->|→)
c = c.replace(
  '/lim\\s*[\\(_]\\s*(x\\s*[→->]+\\s*[^)\\s,]+)\\s*[)\\s]/gi',
  '/lim\\s*[\\(_]\\s*(x\\s*(?:→|->)\\s*[^)\\s,]+)\\s*[)\\s]/gi'
);

fs.writeFileSync(f, c);
console.log('Fixed:', c.includes('(?:→|->)'));
