const fs = require('fs');
const f = 'src/lib/pdf/renderer.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Don't append = to problems that already contain = OR are word questions
c = c.replace(
  '{p.question.endsWith("=") ? p.question : p.question + " ="}',
  `{(() => {
              const q = p.question;
              // Don't add = if question already has one, or is a word problem
              if (q.includes("=") || q.includes("?") || q.toLowerCase().startsWith("which") || 
                  q.toLowerCase().startsWith("what") || q.toLowerCase().startsWith("convert") ||
                  q.toLowerCase().startsWith("factor") || q.toLowerCase().startsWith("expand") ||
                  q.toLowerCase().startsWith("simplify") || q.toLowerCase().startsWith("add") ||
                  q.toLowerCase().startsWith("subtract") || q.toLowerCase().startsWith("in ")) {
                return q;
              }
              return q + " =";
            })()}`
);

fs.writeFileSync(f, c);
const written = fs.readFileSync(f, 'utf8');
console.log('Fixed:', written.includes('q.includes("=")'));
