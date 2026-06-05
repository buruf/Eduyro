const fs = require('fs');
const f = 'src/lib/shop/band-generators.ts';
let c = fs.readFileSync(f, 'utf8');

// Fix dec-place generator in generateDecimalsComplete
c = c.replace(
  `    case "dec-place": {
      const nums = [3.5, 12.4, 0.75, 1.25, 4.08, 10.3, 0.6, 7.15, 25.9, 3.14, 0.08, 5.6, 0.125, 8.04, 100.5];
      const n = nums[Math.floor(rng() * nums.length)];
      const parts = n.toString().split('.');
      const tenths = parts[1]?.[0] ?? '0';
      const hundredths = parts[1]?.[1] ?? '0';
      const t = Math.floor(rng() * 2);
      if (t === 0) return [\`In \${n}, what digit is in the tenths place?\`, tenths];
      return [\`In \${n}, what digit is in the hundredths place?\`, hundredths];
    }`,
  `    case "dec-place": {
      // Only use numbers that have BOTH tenths and hundredths digits
      // to avoid "0" as a misleading answer for missing digits
      const withBoth: [number, string, string][] = [
        [0.75, "7", "5"], [1.25, "2", "5"], [4.08, "0", "8"],
        [7.15, "1", "5"], [3.14, "1", "4"], [0.08, "0", "8"],
        [0.125, "1", "2"], [8.04, "0", "4"], [2.35, "3", "5"],
        [5.62, "6", "2"], [9.17, "1", "7"], [6.83, "8", "3"],
        [0.46, "4", "6"], [1.09, "0", "9"], [3.72, "7", "2"],
        [0.51, "5", "1"], [4.67, "6", "7"], [2.90, "9", "0"],
        [7.38, "3", "8"], [0.24, "2", "4"],
      ];
      // Numbers with only tenths
      const tenthsOnly: [number, string][] = [
        [3.5, "5"], [12.4, "4"], [10.3, "3"], [0.6, "6"],
        [25.9, "9"], [5.6, "6"], [100.5, "5"], [8.7, "7"],
        [0.2, "2"], [14.8, "8"],
      ];
      const t = Math.floor(rng() * 3);
      if (t === 0) {
        // Tenths question — any number
        const item = tenthsOnly[Math.floor(rng() * tenthsOnly.length)];
        return [\`In \${item[0]}, what digit is in the tenths place?\`, item[1]];
      }
      if (t === 1) {
        // Tenths from two-decimal numbers
        const item = withBoth[Math.floor(rng() * withBoth.length)];
        return [\`In \${item[0]}, what digit is in the tenths place?\`, item[1]];
      }
      // Hundredths question — only two-decimal numbers
      const item = withBoth[Math.floor(rng() * withBoth.length)];
      return [\`In \${item[0]}, what digit is in the hundredths place?\`, item[2]];
    }`
);

fs.writeFileSync(f, c);
console.log('✅ dec-place generator fixed');
console.log('withBoth array:', c.includes('withBoth'));
console.log('tenthsOnly array:', c.includes('tenthsOnly'));
