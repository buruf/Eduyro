const fs = require('fs');
const f = 'src/lib/shop/pack-generator.ts';
let c = fs.readFileSync(f, 'utf8');

// Fix: frac-identify through frac-compare still routes to old generateM7Band
// Should route to generateFractionsComplete which has the new dynamic generators
c = c.replace(
  `    case "frac-identify": case "frac-simplify": case "frac-add": case "frac-compare":
      return generateM7Band(bandId, rng, r);`,
  `    // ── Fractions — complete coverage via generateFractionsComplete ──
    case "frac-identify": case "frac-simplify": case "frac-add-same":
    case "frac-add-unlike": case "frac-multiply": case "frac-divide": case "frac-mixed":
      return generateFractionsComplete(bandId, rng, r);`
);

fs.writeFileSync(f, c);
const w = fs.readFileSync(f, 'utf8');
console.log('generateFractionsComplete for frac-identify:', w.includes('case "frac-identify": case "frac-simplify": case "frac-add-same"'));
console.log('Old M7Band routing removed:', !w.includes('return generateM7Band(bandId, rng, r)'));
