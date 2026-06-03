const fs = require('fs');
const f = 'src/lib/shop/pack-generator.ts';
let c = fs.readFileSync(f, 'utf8');
const lines = c.split('\n');

// Line 455 (index 454) is the stray closing brace — remove it
// Line 472 (index 471) is "return [1+1,2]" — add closing } after it

// Remove stray } at line 455
if (lines[454].trim() === '}') {
  lines.splice(454, 1);
  console.log('Removed stray } at line 455');
} else {
  console.log('Line 455 content:', JSON.stringify(lines[454]));
}

// Now find the fallback return and add } after it
const fallbackIdx = lines.findIndex(l => l.includes('return ["1 + 1", "2"]'));
console.log('Fallback at line:', fallbackIdx + 1, '—', lines[fallbackIdx]);

// The line after fallback should be } (closing generateOneProblem function)
// but we need BOTH } to close switch AND } to close function
// Check what's there
console.log('Line after fallback:', JSON.stringify(lines[fallbackIdx + 1]));

// Insert a closing } for the switch before the function closing }
if (lines[fallbackIdx + 1].trim() === '}') {
  lines.splice(fallbackIdx + 1, 0, '  }');
  console.log('Inserted switch closing } after fallback');
}

const result = lines.join('\n');
fs.writeFileSync(f, result);

// Verify brace balance
const opens = (result.match(/\{/g) || []).length;
const closes = (result.match(/\}/g) || []).length;
console.log('\nBrace balance — opens:', opens, 'closes:', closes, opens === closes ? '✅' : '❌');
console.log('Lines now:', result.split('\n').length);
