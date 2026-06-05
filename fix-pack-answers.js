const fs = require('fs');

// Fix pack-cache.ts to merge answerKey into problems when mapping
const f = 'src/lib/shop/pack-cache.ts';
let c = fs.readFileSync(f, 'utf8');

// Fix the mapping to include answers from answerKey
c = c.replace(
  `  const sheets = pack.sheets.map((s) => ({
    problems:  s.problems.map((p: any) => ({ ...p, answer: String(p.answer) })),
    skillBand: s.bandLabel,
  }));`,
  `  const sheets = pack.sheets.map((s) => {
    // Build answer map from answerKey (problems don't store answers directly)
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
    };
  });`
);

// Fix sample mapping too
c = c.replace(
  `  const sampleSheets = full.sheets.slice(0, 3).map((s) => ({
    problems:  s.problems.map((p: any) => ({ ...p, answer: String(p.answer) })),
    skillBand: s.bandLabel,
  }));`,
  `  const sampleSheets = full.sheets.slice(0, 3).map((s) => {
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
    };
  });`
);

fs.writeFileSync(f, c);
console.log('✅ pack-cache.ts — answerKey merged into problems');
console.log('answerMap:', c.includes('answerMap'));

// Also bump cache version to v3 to force regeneration
c = c.replace('const CACHE_VERSION = "v2";', 'const CACHE_VERSION = "v3";');
fs.writeFileSync(f, c);
console.log('Cache version:', c.includes('v3') ? 'v3 ✅' : 'still v2 ❌');
