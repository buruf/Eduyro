const fs = require('fs');
const f = 'src/components/marketing/PathFork.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Remove Kumon comparison from shop card right side
c = c.replace(
  `                  <div className="text-right">
                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-gold">$24.99</div>
                  </div>`,
  `                  <div className="text-right">
                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-gold">$24.99 total</div>
                  </div>`
);

// Fix 2: Change shop CTA from black to brand-blue
c = c.replace(
  'className="block w-full bg-ink text-cream text-sm font-bold py-3.5 rounded-xl text-center hover:bg-ink-soft transition-colors"',
  'className="block w-full bg-brand-blue text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-[#153F6E] transition-colors"'
);

// Fix 3: Remove Kumon price comparison from shop card price row
c = c.replace(
  `              <div className="border-t border-border pt-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-muted text-xs font-sans mb-1">From</div>
                    <div className="font-serif text-3xl font-bold text-ink">$9.99<span className="text-base font-sans font-normal text-muted">/pack</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-gold">$24.99 total</div>
                  </div>
                </div>`,
  `              <div className="border-t border-border pt-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-muted text-xs font-sans mb-1">From</div>
                    <div className="font-serif text-3xl font-bold text-ink">$9.99<span className="text-base font-sans font-normal text-muted">/pack</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-brand-blue">$24.99 total</div>
                  </div>
                </div>`
);

fs.writeFileSync(f, c);
console.log('Fixed. CTA is now brand-blue:', c.includes('bg-brand-blue'));
