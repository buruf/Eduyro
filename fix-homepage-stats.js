const fs = require('fs');
const f = 'src/app/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix the stats row under the hero animation
c = c.replace(
  '{ n: "12,600+", label: "worksheets generated" },',
  '{ n: "Unlimited", label: "fresh worksheets generated" },'
);

// Fix curriculum section copy
c = c.replace(
  '42 levels across 4 subjects. Over 12,600 individual worksheets. Every skill sequenced so mastery at one level is exactly the foundation the next level requires.',
  '42 levels across 4 subjects. Every skill sequenced so mastery at one level is exactly the foundation the next level requires. Worksheets are generated fresh — your child never sees the same sheet twice.'
);

fs.writeFileSync(f, c);
console.log('fixed:', c.includes('Unlimited'));
