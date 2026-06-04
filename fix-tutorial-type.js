const fs = require('fs');
const f = 'src/lib/worksheet/tutorials.ts';
let c = fs.readFileSync(f, 'utf8');

// Make concepts optional in TutorialContent type
c = c.replace(
  '  concepts: ConceptCard[];',
  '  concepts?: ConceptCard[];'
);

fs.writeFileSync(f, c);
console.log('concepts optional:', c.includes('concepts?: ConceptCard[]'));
