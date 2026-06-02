const fs = require('fs');
const f = 'src/components/marketing/PathFork.tsx';
let c = fs.readFileSync(f, 'utf8');

// Wrap left card in Link to /placement
c = c.replace(
  `            <div className="group relative bg-ink rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-300">`,
  `            <Link href="/placement" className="group relative bg-ink rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-300 no-underline">`
);
c = c.replace(
  `                <p className="text-center text-[10px] text-cream/30 mt-2 font-sans">7-day free trial · No card required</p>
              </div>
            </div>
          </div>

          {/* Card 2 — Shop */}`,
  `                <p className="text-center text-[10px] text-cream/30 mt-2 font-sans">7-day free trial · No card required</p>
              </div>
            </Link>
          </div>

          {/* Card 2 — Shop */}`
);

// Wrap right card in Link to /shop
c = c.replace(
  `            <div className="group relative bg-white border-2 border-border rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:border-gold hover:scale-[1.01] transition-all duration-300">`,
  `            <Link href="/shop" className="group relative bg-white border-2 border-border rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:border-gold hover:scale-[1.01] transition-all duration-300 no-underline">`
);
c = c.replace(
  `                <p className="text-center text-[10px] text-muted mt-2 font-sans">1 pack $3.99 · 2 packs $5.99 · All 4 packs $9.99</p>
              </div>
            </div>
          </div>
        </div>`,
  `                <p className="text-center text-[10px] text-muted mt-2 font-sans">1 pack $3.99 · 2 packs $5.99 · All 4 packs $9.99</p>
              </div>
            </Link>
          </div>
        </div>`
);

fs.writeFileSync(f, c);
const written = fs.readFileSync(f, 'utf8');
const linkCount = (written.match(/<Link /g) || []).length;
console.log('Total Link tags:', linkCount, '(should be 4)');
console.log('Left card wraps placement:', written.includes('href="/placement" className="group'));
console.log('Right card wraps shop:', written.includes('href="/shop" className="group'));
