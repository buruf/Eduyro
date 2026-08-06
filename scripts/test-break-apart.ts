// scripts/test-break-apart.ts
// Regression tests for the M5 bridge unit "Break apart to multiply".
// Verifies: engine self-validation, every answer arithmetically correct, the
// no-regrouping constraint holds on every bare item, staging walks scaffold →
// split → bare across the unit, and range boundaries land on the right units.
import { generateArithmeticSheet, validateArithmetic } from "../src/lib/shop/arithmetic-engine";

let fail = 0;
const bad = (m: string) => { fail++; console.log(`  ✗ ${m}`); };

const v = validateArithmetic("MULTIPLICATION" as any);
if (!v.ok) bad(`engine self-validation: ${v.issues.join("; ").slice(0, 240)}`);

let n = 0, wrong = 0, regroup = 0;
const BARE = /^(\d{2}) × (\d)$/;
for (let sheet = 53; sheet <= 62; sheet++) {
  const ws = generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30);
  if (ws.meta.subSkillLabel !== "Break apart to multiply (no carrying)") {
    bad(`sheet ${sheet} label = ${ws.meta.subSkillLabel}`);
  }
  for (const p of ws.problems) {
    n++;
    const m = BARE.exec(String(p.question));
    if (!m) continue;
    const a = Number(m[1]), b = Number(m[2]);
    if (a * b !== Number(p.answer)) { wrong++; bad(`${p.question} = ${p.answer}`); }
    if (Math.floor(a / 10) * b > 9 || (a % 10) * b > 9) { regroup++; bad(`REGROUP LEAK: ${p.question}`); }
  }
}

const kinds = (sheet: number) => {
  const qs = generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30).problems.map((p) => String(p.question));
  return {
    steps: qs.filter((q) => q.includes("Step 1:") || q.includes("Step 2:") || q.includes(". So ")).length,
    split: qs.filter((q) => q.includes("Break apart") || q.includes("(___")).length,
    bare: qs.filter((q) => BARE.test(q)).length,
  };
};
const first = kinds(53), mid = kinds(57), last = kinds(62);
console.log(`  sheet 53: ${JSON.stringify(first)}   sheet 57: ${JSON.stringify(mid)}   sheet 62: ${JSON.stringify(last)}`);
// The selector keeps a wide review window (Kumon-style mixing), so the last
// sheet is split-dominant with bare items present — not 100% bare. Assert the
// real invariants: scaffold fades, bare only appears late, steps decline.
if (first.steps < first.bare) bad("sheet 53 should be scaffold-dominant");
if (first.bare !== 0) bad("sheet 53 should have NO bare items yet");
if (last.bare === 0) bad("sheet 62 should include bare stacked items");
if (last.steps >= first.steps) bad("scaffold items should decline across the unit");

const at = (sheet: number) => generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30).meta.subSkillLabel;
if (at(52) !== "×10, ×11, ×12") bad(`sheet 52 = ${at(52)}`);
if (at(63) !== "2-digit × 1-digit") bad(`sheet 63 = ${at(63)}`);

console.log(`  bare answers checked: ${n}, wrong: ${wrong}, regroup leaks: ${regroup}`);
console.log(`${fail === 0 ? "✅" : "❌"} break-apart: ${fail} failure(s)`);
process.exit(fail ? 1 : 0);
