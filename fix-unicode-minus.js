const fs = require('fs');

// Fix band-generators.ts — replace Unicode minus (−) with ASCII hyphen (-)
// @react-pdf/renderer with Helvetica doesn't support Unicode minus U+2212
{
  const f = 'src/lib/shop/band-generators.ts';
  let c = fs.readFileSync(f, 'utf8');
  const before = (c.match(/−/g)||[]).length;
  c = c.replace(/−/g, '-');
  fs.writeFileSync(f, c);
  console.log(`✅ band-generators.ts: replaced ${before} Unicode minus signs`);
}

// Fix pack-generator.ts too
{
  const f = 'src/lib/shop/pack-generator.ts';
  let c = fs.readFileSync(f, 'utf8');
  const before = (c.match(/−/g)||[]).length;
  c = c.replace(/−/g, '-');
  fs.writeFileSync(f, c);
  console.log(`✅ pack-generator.ts: replaced ${before} Unicode minus signs`);
}

// Also fix renderer.tsx to use ASCII hyphen in instructions
{
  const f = 'src/lib/pdf/renderer.tsx';
  let c = fs.readFileSync(f, 'utf8');
  const before = (c.match(/−/g)||[]).length;
  c = c.replace(/−/g, '-');
  fs.writeFileSync(f, c);
  console.log(`✅ renderer.tsx: replaced ${before} Unicode minus signs`);
}

// Bump cache to v4
{
  const f = 'src/lib/shop/pack-cache.ts';
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace('const CACHE_VERSION = "v3";', 'const CACHE_VERSION = "v4";');
  fs.writeFileSync(f, c);
  console.log('✅ Cache bumped to v4');
}
