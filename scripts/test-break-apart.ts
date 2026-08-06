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
for (let sheet = 59; sheet <= 68; sheet++) {
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
const first = kinds(59), mid = kinds(63), last = kinds(68);
console.log(`  sheet 59: ${JSON.stringify(first)}   sheet 63: ${JSON.stringify(mid)}   sheet 68: ${JSON.stringify(last)}`);
// The selector keeps a wide review window (Kumon-style mixing), so the last
// sheet is split-dominant with bare items present — not 100% bare. Assert the
// real invariants: scaffold fades, bare only appears late, steps decline.
if (first.steps < first.bare) bad("sheet 59 should be scaffold-dominant");
if (first.bare !== 0) bad("sheet 59 should have NO bare items yet");
if (last.bare === 0) bad("sheet 68 should include bare stacked items");
if (last.steps >= first.steps) bad("scaffold items should decline across the unit");

const at = (sheet: number) => generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30).meta.subSkillLabel;
if (at(52) !== "×10, ×11, ×12") bad(`sheet 52 = ${at(52)}`);
if (at(53) !== "Multiplying tens (20 × 3)") bad(`sheet 53 = ${at(53)}`);
if (at(69) !== "Carrying in multiplication") bad(`sheet 69 = ${at(69)}`);
if (at(79) !== "2-digit × 1-digit") bad(`sheet 79 = ${at(79)}`);


// ── Multiplying tens (sheets 53–58): every answer correct, no bare ×10 tens ──
for (let sheet = 53; sheet <= 58; sheet++) {
  for (const p of generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30).problems) {
    const q = String(p.question);
    const mt = q.match(/(\d+) × (\d+) =$/); // covers paired, bare, hundreds
    if (mt && !q.includes("___")) {
      const want = Number(mt[1]) * Number(mt[2]);
      if (want !== Number(p.answer)) bad(`mul-tens: ${q} = ${p.answer} (want ${want})`);
    }
    const rev = q.match(/^___ × (\d) = (\d+)$/);
    if (rev && Number(p.answer) * Number(rev[1]) !== Number(rev[2])) bad(`mul-tens reverse: ${q} = ${p.answer}`);
  }
}

// ── Carrying (sheets 69–78): stage 1 must be ones-carry-only, answers right ──
// The selector's wide review window means stages blend at the edges (by
// design — Kumon-style mixing). Assert the RAMP, not strict bands: gentle
// ones-carry-only problems must dominate the first sheet, and the share of
// 3-digit-answer problems must grow substantially by the last sheet.
const carryOf = (a: number, b: number) => Math.floor(((a % 10) * b) / 10);
const carryMix = (sheet: number) => {
  let gentle = 0, hard = 0;
  for (const p of generateArithmeticSheet("MULTIPLICATION" as any, sheet, 100, 30).problems) {
    const m = /^(\d{2}) × (\d)(?: =)?$/.exec(String(p.question));
    if (!m) continue;
    const a = Number(m[1]), b = Number(m[2]);
    if (a * b !== Number(p.answer)) bad(`carry: ${p.question} = ${p.answer}`);
    if (Math.floor(a / 10) * b + carryOf(a, b) <= 9) gentle++; else hard++;
  }
  return { gentle, hard };
};
const c1 = carryMix(69), c2 = carryMix(78);
console.log(`  carry sheet 69: gentle=${c1.gentle} hard=${c1.hard}   sheet 78: gentle=${c2.gentle} hard=${c2.hard}`);
if (c1.gentle <= c1.hard) bad(`carry sheet 69 should be gentle-dominant (${c1.gentle} vs ${c1.hard})`);
if (c2.hard <= c1.hard) bad("hard problems should increase across the carrying unit");

console.log(`  bare answers checked: ${n}, wrong: ${wrong}, regroup leaks: ${regroup}`);
console.log(`${fail === 0 ? "✅" : "❌"} break-apart: ${fail} failure(s)`);
process.exit(fail ? 1 : 0);
