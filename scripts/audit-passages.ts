// scripts/audit-passages.ts
// THE TRACK B GATE, run over the real passage bank. Phases B1–B4 add content to
// src/lib/reading/passages.ts; this fails the build the moment any of it is the
// wrong length, the wrong difficulty, ungrounded in its own text, or served to
// a grade band it doesn't belong to.
//
// An empty bank passes — that is the correct state until B1 lands.
import { PASSAGES, BANDS, fleschKincaidGrade, hardWordPct, words, type BandId } from "../src/lib/reading/passages";
import { checkPassage, checkBank } from "../src/lib/reading/passage-qa";

let fails = 0;

for (const p of PASSAGES) {
  const failures = checkPassage(p);
  const n = words(p.text).length;
  if (failures.length) {
    fails += failures.length;
    console.log(`✗ ${p.band.padEnd(6)} ${p.id.padEnd(18)} ${p.title}`);
    for (const f of failures) console.log(`    ${f.check}: ${f.detail}`);
  } else {
    console.log(`✓ ${p.band.padEnd(6)} ${p.id.padEnd(18)} ${String(n).padStart(4)}w · FK ${String(fleschKincaidGrade(p.text)).padStart(4)} · ${String(hardWordPct(p.text)).padStart(4)}% hard · ${p.items.length} items`);
  }
}

const bankFailures = checkBank(PASSAGES);
if (bankFailures.length) {
  fails += bankFailures.length;
  console.log(`\n✗ bank-wide:`);
  for (const f of bankFailures) console.log(`    ${f.check}: ${f.detail}`);
}

// Coverage per band — B1–B4 progress, and a reminder of what is still unbuilt.
console.log(`\nband coverage:`);
for (const b of Object.keys(BANDS) as BandId[]) {
  const inBand = PASSAGES.filter((p) => p.band === b);
  const info = inBand.filter((p) => p.genre === "informational").length;
  console.log(`  ${BANDS[b].label.padEnd(12)} ${String(inBand.length).padStart(3)} passages` +
    (inBand.length ? ` (${Math.round((info / inBand.length) * 100)}% informational)` : "  — not built yet"));
}

console.log(`\npassages: ${PASSAGES.length}`);
console.log(`${fails === 0 ? "✅" : "❌"} passage failures: ${fails}`);
if (!PASSAGES.length) {
  console.log(`   (empty bank — correct until phase B1 adds Grades 2–3 content)`);
}
process.exit(fails ? 1 : 0);
