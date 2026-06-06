const fs = require('fs');
const f = 'src/lib/shop/band-generators.ts';
let c = fs.readFileSync(f, 'utf8');

// Split into lines, find and remove duplicate old return statements
const lines = c.split(/\r?\n/);
const filtered = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const next = lines[i + 1] || '';
  
  // If this line is the OLD version and the next line is the NEW version of the same return, skip this line
  if (line.includes('A pizza is cut into') && next.includes('A pizza has')) { skipNext = false; continue; }
  if (line.includes('What fraction of') && line.includes('is ${part}') && next.includes('Write ${part} out of')) { skipNext = false; continue; }
  if (line.includes('A shape is divided into') && next.includes('A shape has')) { skipNext = false; continue; }
  
  filtered.push(line);
}

const result = filtered.join('\n');
fs.writeFileSync(f, result);

console.log('Old pizza wording gone:', !result.includes('A pizza is cut into'));
console.log('Old fraction wording gone:', !result.includes('is ${part}?'));
console.log('Old shape wording gone:', !result.includes('A shape is divided into'));
console.log('Lines:', filtered.length);
