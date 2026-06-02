const fs = require('fs');
const f = 'src/components/marketing/PathFork.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix left card — subscription price + USD
c = c.replace(
  '$9.99<span className="text-base font-sans font-normal text-cream/40">/mo</span>',
  '$9.99 USD<span className="text-base font-sans font-normal text-cream/40">/mo</span>'
);

// Fix right card — shop price from $9.99 to $3.99 + USD
c = c.replace(
  '$9.99<span className="text-base font-sans font-normal text-muted">/pack</span>',
  '$3.99 USD<span className="text-base font-sans font-normal text-muted">/pack</span>'
);

// Fix $24.99 total to $9.99 total
c = c.replace(
  '<div className="text-sm font-semibold text-brand-blue">$24.99 total</div>',
  '<div className="text-sm font-semibold text-brand-blue">$9.99 total</div>'
);

fs.writeFileSync(f, c);
const written = fs.readFileSync(f, 'utf8');
console.log('USD in PathFork:', written.includes('USD'));
console.log('3.99:', written.includes('3.99'));
console.log('9.99 total:', written.includes('$9.99 total'));
console.log('Old 24.99 remaining:', written.includes('$24.99'));
