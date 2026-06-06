const fs = require('fs');
const f = 'src/lib/shop/band-generators.ts';
let c = fs.readFileSync(f, 'utf8');

// Remove the OLD duplicate return lines
c = c.replace(
  `        return [\`A pizza is cut into \${d} slices. \${n} slices are eaten. What fraction remains?\`, \`\${d-n}/\${d}\`];\n        return [\`A pizza has \${d} slices. \${n} are eaten. What fraction is left?\`, \`\${d-n}/\${d}\`];`,
  `        return [\`A pizza has \${d} slices. \${n} are eaten. What fraction is left?\`, \`\${d-n}/\${d}\`];`
);

c = c.replace(
  `        return [\`What fraction of \${total} is \${part}?\`, \`\${part/g}/\${total/g}\`];\n        return [\`Write \${part} out of \${total} as a fraction in simplest form.\`, \`\${part/g}/\${total/g}\`];`,
  `        return [\`Write \${part} out of \${total} as a fraction in simplest form.\`, \`\${part/g}/\${total/g}\`];`
);

c = c.replace(
  `      return [\`A shape is divided into \${d} equal parts. \${n} parts are shaded. Write the fraction.\`, \`\${n}/\${d}\`];\n      return [\`A shape has \${d} equal parts. \${n} are shaded. Write the fraction.\`, \`\${n}/\${d}\`];`,
  `      return [\`A shape has \${d} equal parts. \${n} are shaded. Write the fraction.\`, \`\${n}/\${d}\`];`
);

fs.writeFileSync(f, c);
console.log('Duplicates removed');
console.log('Old pizza wording gone:', !c.includes('A pizza is cut into'));
console.log('Old fraction wording gone:', !c.includes('What fraction of ${total} is ${part}'));
