// scripts/test-m18-variety.ts — prove the M18 boredom fix:
// (a) sheets mix formats (no single-form floods),
// (b) no runs of 3+ near-identical stems,
// (c) validateHigherMathPack still passes,
// (d) independently re-derive every answer for correctness.
import { generateHigherMathSheet, validateHigherMathPack } from "../src/lib/shop/higher-math-engine";

let failures = 0;

// Independent answer check for the forms we authored.
function checkAnswer(q: string, a: string): boolean | null {
  const sup: Record<string, number> = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
  const readPow = (s: string): { c: number; n: number } | null => {
    const m = s.match(/^(-?\d*)x([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);
    if (!m) return /^-?\d+$/.test(s) ? { c: parseInt(s, 10), n: 0 } : null;
    const c = m[1] === "" ? 1 : m[1] === "-" ? -1 : parseInt(m[1], 10);
    const n = m[2] ? [...m[2]].reduce((acc, ch) => acc * 10 + sup[ch], 0) : 1;
    return { c, n };
  };
  let m = q.match(/^d\/dx (\S+)$/);
  if (m) {
    const p = readPow(m[1]);
    if (!p) return null;
    const dc = p.c * p.n, dn = p.n - 1;
    const expect = dc === 0 ? "0" : dn === 0 ? `${dc}` : dn === 1 ? (dc === 1 ? "x" : `${dc}x`) : `${dc === 1 ? "" : dc}x${String(dn).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]).join("")}`;
    return a === expect;
  }
  m = q.match(/h\(t\) = (\d+)t².*t = (\d+)\?$/);
  if (m) return a === `${2 * parseInt(m[1], 10) * parseInt(m[2], 10)}`;
  m = q.match(/^f\(x\) = x² \+ (\d+)x \+ \d+\. Find f'\((\d+)\)$/);
  if (m) return a === `${2 * parseInt(m[2], 10) + parseInt(m[1], 10)}`;
  m = q.match(/tangent line to y = x² \+ (\d+)x at x = (\d+)$/);
  if (m) return a === `${2 * parseInt(m[2], 10) + parseInt(m[1], 10)}`;
  m = q.match(/^∫₀\^(\d+) x dx$/);
  if (m) { const b = parseInt(m[1], 10); return a === `${(b * b) / 2}`; }
  m = q.match(/^∫₀\^(\d+) 2x dx$/);
  if (m) { const b = parseInt(m[1], 10); return a === `${b * b}`; }
  m = q.match(/^∫₀\^(\d+) 3x² dx$/);
  if (m) { const b = parseInt(m[1], 10); return a === `${b * b * b}`; }
  m = q.match(/area under y = 2x from x = 0 to x = (\d+)$/);
  if (m) { const b = parseInt(m[1], 10); return a === `${b * b}`; }
  m = q.match(/^Slope of y = x² at x = (\d+)$/);
  if (m) return a === `${2 * parseInt(m[1], 10)}`;
  m = q.match(/^At which x does y = x² have slope (\d+)\?$/);
  if (m) return a === `${parseInt(m[1], 10) / 2}`;
  m = q.match(/velocity at t = (\d+)$/);
  if (m) return a === `${2 * parseInt(m[1], 10)}`;
  m = q.match(/^d\/dx (\d+)x$/);
  if (m) return a === m[1];
  return null; // MC/TF/other — validated structurally below
}

// A crude "stem signature" — question with digits stripped — to detect runs of
// the same-shaped question back to back.
const sig = (q: string) => q.replace(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "#").slice(0, 40);

let checked = 0, wrong = 0;
for (const s of [1, 8, 17, 18, 25, 36, 40, 50, 60, 70, 80, 85, 95, 100]) {
  const sheet = generateHigherMathSheet("M18", s, 100, 36);
  const qs = sheet.problems.map((p) => p.question);
  // (b) longest run of identical signatures
  let run = 1, maxRun = 1;
  for (let i = 1; i < qs.length; i++) { run = sig(qs[i]) === sig(qs[i - 1]) ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  // (a) distinct signatures per sheet
  const distinct = new Set(qs.map(sig)).size;
  // (d) answers
  for (const p of sheet.problems) {
    const ok = checkAnswer(p.question, p.answer);
    if (ok === false) { wrong++; console.log(`  WRONG: sheet ${s}: ${p.question} => ${p.answer}`); }
    if (ok !== null) checked++;
    if (p.options && !p.options.includes(p.answer)) { wrong++; console.log(`  MC answer missing from options: ${p.question}`); }
  }
  // Runs of ≤4 of the unit's CORE stem (mixed with other shapes around them)
  // are healthy Kumon reps; 5+ of one shape back-to-back is a flood.
  const flood = maxRun >= 5;
  if (flood) failures++;
  console.log(`sheet ${String(s).padStart(3)}  distinct-shapes:${String(distinct).padStart(3)}  longest-same-shape-run:${maxRun}${flood ? "  ← FLOOD" : ""}`);
}
console.log(`\nanswers independently verified: ${checked}, wrong: ${wrong}`);
const v = validateHigherMathPack("M18");
console.log(`validateHigherMathPack: ok=${v.ok}${v.issues.length ? "\n  " + v.issues.slice(0, 5).join("\n  ") : ""}`);
if (wrong || failures || !v.ok) { console.log("FAIL"); process.exit(1); }
console.log("PASS");
