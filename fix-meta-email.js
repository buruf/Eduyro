const fs = require('fs');

// Fix 1: metadataBase in layout.tsx
const layoutPath = 'src/app/layout.tsx';
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace(
  'export const metadata: Metadata = {',
  `export const metadata: Metadata = {
  metadataBase: new URL('https://eduyro.com'),`
);
fs.writeFileSync(layoutPath, layout);
console.log('✅ metadataBase added:', layout.includes('metadataBase'));

// Fix 2: BrightSteps subject lines in email/index.ts
const emailPath = 'src/lib/email/index.ts';
let email = fs.readFileSync(emailPath, 'utf8');
email = email.replace(/Verify your BrightSteps account/g, 'Verify your Eduyro account');
email = email.replace(/BrightSteps payment failed/g, 'Eduyro payment failed');
fs.writeFileSync(emailPath, email);
console.log('✅ BrightSteps references remaining:', (email.match(/BrightSteps/g) || []).length);
console.log('   Should be 0');
