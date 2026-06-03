const fs = require('fs');
const f = 'src/lib/shop/pack-generator.ts';
let c = fs.readFileSync(f, 'utf8');

// Exact replacement based on real bytes
const oldText = 'poly-mixed":\n      return generateM12Band(bandId, rng, r);\n\n  // Fallback (should never hit)\n  return ["1 + 1", "2"];\n}';
const newText = 'poly-mixed":\n      return generateM12Band(bandId, rng, r);\n\n    default:\n      return ["1 + 1", "2"];\n  }\n}';

if (!c.includes(oldText)) {
  console.log('❌ Text not found exactly');
  const idx = c.lastIndexOf('poly-mixed');
  console.log('Context:', JSON.stringify(c.substring(idx, idx+120)));
} else {
  c = c.replace(oldText, newText);
  fs.writeFileSync(f, c);
  console.log('✅ Fixed');
  console.log('default case:', c.includes('default:\n      return ["1 + 1"'));
  const opens = (c.match(/\{/g)||[]).length;
  const closes = (c.match(/\}/g)||[]).length;
  console.log('Brace balance:', opens, '/', closes, opens === closes ? '✅' : '❌');
}
