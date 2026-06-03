const fs = require('fs');
const f = 'src/components/shop/SamplePreviewModal.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  'skill: "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" | null;',
  'skill: string | null;'
);
fs.writeFileSync(f, c);
console.log('fixed:', c.includes('skill: string | null'));
