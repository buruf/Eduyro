const fs = require('fs');
const f = 'src/lib/shop/band-generators.ts';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: All untyped items/ops arrays
let count = 0;
c = c.replace(/const items = \[/g, () => { count++; return 'const items: [string, string][] = ['; });
c = c.replace(/const ops = \[/g, 'const ops: [string, string][] = [');
c = c.replace(/const warmups = \[/g, 'const warmups: {question: string, answer: string, id?: string}[] = [');

// Fix 2: parseFloat().toFixed() returns string not number — remove the chained .replace()
// The issue: parseFloat((a*b).toFixed(3)).replace() — parseFloat returns a number, not string
c = c.replace(
  "return [`${a} × ${b} =`, String(parseFloat((a*b).toFixed(3)).replace(/\\.?0+$/, ''))];",
  "return [`${a} × ${b} =`, String(parseFloat((a*b).toFixed(3)))];  "
);

// Fix 3: Any other .replace() chained on parseFloat
c = c.replace(/String\(parseFloat\(([^)]+)\)\.replace\([^)]+\)\)/g, (match, inner) => {
  return `String(parseFloat(${inner}))`;
});

fs.writeFileSync(f, c);
console.log(`Fixed ${count} untyped arrays`);
console.log('parseFloat replace fixed:', !c.includes('parseFloat') || !c.includes('.replace('));
console.log('Done');
