// scripts/test-hm-variety.ts — M14–M18 variety + independent answer check
// (extends the M18-only test): per sampled sheet, no 5+ same-shape runs, and
// every answer we can re-derive must be correct.
import { generateHigherMathSheet, validateHigherMathPack } from "../src/lib/shop/higher-math-engine";

const sig = (q: string) => q.replace(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "#").slice(0, 40);
const frac = (a: number, b: number) => { const g = (x: number, y: number): number => (y ? g(y, x % y) : x); const d = g(a, b); return `${a / d}/${b / d}`; };

// Independent re-derivations for the NEW M14/M15 forms (+ a few M16/M17 staples).
function check(q: string, a: string): boolean | null {
  let m = q.match(/^f\(x\) = (\d+)x \+ (\d+)\. Find f\((\d+)\)$/);
  if (m) return a === `${+m[1] * +m[3] + +m[2]}`;
  m = q.match(/^f\(x\) = (\d+)x \+ (\d+)\. For which x is f\(x\) = (\d+)\?$/);
  if (m) return +m[3] === +m[1] * +a + +m[2];
  m = q.match(/^A taxi charges \$(\d+) to start plus \$(\d+) per km\. How much is a (\d+) km ride\?$/);
  if (m) return a === `${+m[2] * +m[3] + +m[1]}`;
  m = q.match(/^f\(x\) = x² \+ (\d+)\. Find f\((\d+)\)$/);
  if (m) return a === `${+m[2] * +m[2] + +m[1]}`;
  m = q.match(/^f\(x\) = x² \+ (\d+)\. For which positive x is f\(x\) = (\d+)\?$/);
  if (m) return +m[2] === +a * +a + +m[1];
  m = q.match(/^f\(x\) = x \+ (\d+), g\(x\) = (\d+)x\. Find f\(g\((\d+)\)\)$/);
  if (m) return a === `${+m[2] * +m[3] + +m[1]}`;
  m = q.match(/^f\(x\) = x \+ (\d+), g\(x\) = (\d+)x\. Find g\(f\((\d+)\)\)$/);
  if (m) return a === `${+m[2] * (+m[3] + +m[1])}`;
  m = q.match(/^Domain of f\(x\) = 1\/\(x - (\d+)\)$/);
  if (m) return a === `x ≠ ${m[1]}`;
  m = q.match(/^f\(x\) = x² \+ (\d+)\. What is the SMALLEST value/);
  if (m) return a === m[1];
  m = q.match(/^f\(x\) = x \+ (\d+)\. Find f⁻¹\((\d+)\)$/);
  if (m) return a === `${+m[2] - +m[1]}`;
  m = q.match(/code adds (\d+) to every number\. A message arrived as (\d+)/);
  if (m) return a === `${+m[2] - +m[1]}`;
  m = q.match(/^Right triangle with legs (\d+) and (\d+)\. Find the hypotenuse$/);
  if (m) return +a * +a === +m[1] * +m[1] + +m[2] * +m[2];
  m = q.match(/^Right triangle: hypotenuse (\d+), one leg (\d+)\. Find the other leg$/);
  if (m) return +m[1] * +m[1] === +m[2] * +m[2] + +a * +a;
  m = q.match(/ladder's foot stands (\d+) m from a wall and its top reaches (\d+) m/);
  if (m) return +a * +a === +m[1] * +m[1] + +m[2] * +m[2];
  m = q.match(/^Right triangle: opposite = (\d+), hypotenuse = (\d+)\. Find sin θ$/);
  if (m) return a === frac(+m[1], +m[2]);
  m = q.match(/^Right triangle: adjacent = (\d+), hypotenuse = (\d+)\. Find cos θ$/);
  if (m) return a === frac(+m[1], +m[2]);
  m = q.match(/^Right triangle: opposite = (\d+), adjacent = (\d+)\. Find tan θ$/);
  if (m) return a === frac(+m[1], +m[2]);
  m = q.match(/^A ramp rises (\d+) m over a horizontal base of (\d+) m/);
  if (m) return a === frac(+m[1], +m[2]);
  const SIN: Record<string, string> = { "0": "0", "30": "1/2", "45": "√2/2", "60": "√3/2", "90": "1" };
  const COS: Record<string, string> = { "0": "1", "30": "√3/2", "45": "√2/2", "60": "1/2", "90": "0" };
  m = q.match(/^Evaluate sin (\d+)°\.$/); if (m) return a === SIN[m[1]];
  m = q.match(/^Evaluate cos (\d+)°\.$/); if (m) return a === COS[m[1]];
  m = q.match(/x-coordinate\?$/) && q.match(/point at (\d+)°/); if (m && /x-coordinate/.test(q)) return a === COS[m[1]];
  m = q.match(/y-coordinate of the point at (\d+)°/); if (m) return a === SIN[m[1]];
  m = q.match(/^True or false: sin (\d+)° = cos (\d+)°$/);
  if (m) return (SIN[m[1]] === COS[m[2]]) === (a === "True");
  return null;
}

let failures = 0, wrong = 0, checked = 0;
for (const code of ["M14", "M15", "M16", "M17", "M18"]) {
  for (const s of [1, 10, 20, 25, 35, 45, 55, 65, 75, 85, 95, 100]) {
    const sheet = generateHigherMathSheet(code, s, 100, 36);
    const qs = sheet.problems.map((p) => p.question);
    let run = 1, maxRun = 1;
    for (let i = 1; i < qs.length; i++) { run = sig(qs[i]) === sig(qs[i - 1]) ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
    if (maxRun >= 5) { failures++; console.log(`FLOOD ${code} sheet ${s}: run ${maxRun}`); }
    for (const p of sheet.problems) {
      const ok = check(p.question, p.answer);
      if (ok === false) { wrong++; console.log(`WRONG ${code} s${s}: ${p.question.slice(0, 70)} => ${p.answer}`); }
      if (ok !== null) checked++;
      if (p.options && !p.options.includes(p.answer)) { wrong++; console.log(`MC-MISSING ${code} s${s}: ${p.question.slice(0, 60)}`); }
    }
  }
  const v = validateHigherMathPack(code);
  if (!v.ok) { failures++; console.log(`${code} validator: ${v.issues.slice(0, 3).join(" | ")}`); }
  console.log(`${code} ok`);
}
console.log(`\nanswers independently verified: ${checked}, wrong: ${wrong}, floods/validator fails: ${failures}`);
process.exit(wrong || failures ? 1 : 0);
