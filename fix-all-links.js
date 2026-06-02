const fs = require('fs');

// ── Fix 1: PathFork — wrap both cards in Link tags ──────────────────────────
{
  const f = 'src/components/marketing/PathFork.tsx';
  let c = fs.readFileSync(f, 'utf8');

  // Left card — wrap in Link to /placement
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

  // Right card — wrap in Link to /shop
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
  console.log('✅ PathFork left card wraps /placement:', written.includes('<Link href="/placement" className="group'));
  console.log('✅ PathFork right card wraps /shop:', written.includes('<Link href="/shop" className="group'));
}

// ── Fix 2: Navbar — /#shop → /shop, remove /accessibility ───────────────────
{
  const f = 'src/components/layout/index.tsx';
  let c = fs.readFileSync(f, 'utf8');

  // Fix dead /#shop anchors
  c = c.replace(/href="\/#shop"/g, 'href="/shop"');

  // Fix /accessibility — change to /privacy or remove
  c = c.replace(/href="\/accessibility"/g, 'href="/privacy"');

  fs.writeFileSync(f, c);
  const written = fs.readFileSync(f, 'utf8');
  console.log('✅ Dead /#shop links remaining:', (written.match(/href="\/#shop"/g) || []).length, '(should be 0)');
  console.log('✅ /accessibility links remaining:', (written.match(/href="\/accessibility"/g) || []).length, '(should be 0)');
}

console.log('\n✅ All link issues fixed');
