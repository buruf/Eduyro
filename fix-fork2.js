const fs = require('fs');
const f = 'src/components/marketing/PathFork.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix pricing — from wrong to correct
c = c.replace(
  `                    <div className="text-muted text-xs font-sans mb-1">From</div>
                    <div className="font-serif text-3xl font-bold text-ink">$9.99<span className="text-base font-sans font-normal text-muted">/pack</span></div>`,
  `                    <div className="text-muted text-xs font-sans mb-1">From</div>
                    <div className="font-serif text-3xl font-bold text-ink">$3.99<span className="text-base font-sans font-normal text-muted">/pack</span></div>`
);

c = c.replace(
  `                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-brand-blue">$24.99 total</div>`,
  `                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-brand-blue">$9.99 total</div>`
);

// Also fix the bundle pricing note at the bottom
c = c.replace(
  '100 sheets per pack · Answer keys · Instant download',
  '1 pack $3.99 · 2 packs $5.99 · All 4 packs $9.99'
);

fs.writeFileSync(f, c);
console.log('Fixed pricing:');
console.log('$3.99:', c.includes('$3.99'));
console.log('$9.99 total:', c.includes('$9.99 total'));
