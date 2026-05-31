import { readFileSync, writeFileSync } from 'fs';

const files = [
  'src/app/api/checkout/route.ts',
  'src/app/page.tsx',
  'src/app/terms/page.tsx',
  'src/lib/stripe/index.ts',
];

for (const f of files) {
  let c = readFileSync(f, 'utf8');
  const before = c;
  c = c
    .replace(/14-day free trial/g, '7-day free trial')
    .replace(/14-day/g, '7-day')
    .replace(/14 day/g, '7 day')
    .replace(/trialDays: 14/g, 'trialDays: 7')
    .replace(/trialDays ?? 14/g, 'trialDays ?? 7')
    .replace(/planConfig\.trialDays \?\? 14/g, 'planConfig.trialDays ?? 7')
    .replace(/Start 14-day/g, 'Start 7-day');
  if (c !== before) {
    writeFileSync(f, c, 'utf8');
    console.log('Updated: ' + f);
  } else {
    console.log('No changes: ' + f);
  }
}