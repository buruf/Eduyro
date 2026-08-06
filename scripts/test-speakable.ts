// scripts/test-speakable.ts — spoken-math transform regression test.
import { speakable } from "../src/lib/tts/speakable";

const cases: [string, string][] = [
  // Skip-count framing (Ridwan field report: arrow→comma made number soup —
  // "three times four, three, six, nine, twelve").
  ["Skip-count to get there: 3 × 4 → 3, 6, 9, 12", "Skip-count to get there: 3 times 4 — count: 3, 6, 9, 12"],
  ["x → y", "x, y"],
  ["d/dx x²", "the derivative of x squared"],
  ["d/dx 3x²", "the derivative of 3 x squared"],
  ["d/dx 8x⁵", "the derivative of 8 x to the power of 5"],
  ["d/dx x²⁰", "the derivative of x to the power of 20"],
  ["d/dx 12", "the derivative of 12"],
  ["d/dx 5x", "the derivative of 5 x"],
  ["Which function has derivative 10x?", "Which function has derivative 10 x?"],
  ["Omar says d/dx 5x² = 5x. What did Omar forget?", "Omar says the derivative of 5 x squared equals 5 x. What did Omar forget?"],
  ["∫ x² dx", "the integral of x squared"],
  ["∫₀^4 x dx", "the integral from 0 to 4 of x"],
  ["∫₀^6 3x² dx", "the integral from 0 to 6 of 3 x squared"],
  ["f(x) = x² + 2x + 1. Find f'(3)", "f(x) equals x squared plus 2 x plus 1. Find f prime of (3)"],
  ["x³/3 + C", "x cubed/3 plus a constant C"],
  ["Slope of y = x² at x = 5", "Slope of y equals x squared at x equals 5"],
  ["A ball's height after t seconds is h(t) = 4t². Its speed is h′(t) = 8t. How fast is it moving at t = 3?",
   "A ball's height after t seconds is h(t) equals 4 t squared. Its speed is h prime of (t) equals 8 t. How fast is it moving at t equals 3?"],
  ["7 − 4", "7 minus 4"],
  ["3 × 4 = 12", "3 times 4 equals 12"],
  ["30° + 60° = 90°", "30 degrees plus 60 degrees equals 90 degrees"],
  ["√49", "the square root of 49"],
  ["½ + ¼", "one half plus one quarter"],
  // Arrows are visual flow markers — spoken as a pause, never "right arrow".
  ["count ALL the parts first → that's the bottom", "count ALL the parts first, that's the bottom"],
  ["Mixed → improper: multiply the whole by the bottom", "Mixed, improper: multiply the whole by the bottom"],
  ["Fractions ↔ percents", "Fractions to percents"],
  ["✓ Check the answer", "Check the answer"],
];

let fail = 0;
for (const [input, want] of cases) {
  const got = speakable(input);
  const ok = got === want;
  if (!ok) { fail++; console.log(`FAIL: ${input}\n  want: ${want}\n  got : ${got}`); }
}
console.log(fail === 0 ? `PASS (${cases.length} cases)` : `${fail}/${cases.length} FAILED`);
process.exit(fail ? 1 : 0);
