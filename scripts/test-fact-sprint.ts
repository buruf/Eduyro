// scripts/test-fact-sprint.ts — verify fact-sprint pools: correct answers,
// non-negative, sane sizes, no dup keys.
import { buildFactPool, FACT_LEVEL_OP, isFactLevel } from "../src/lib/mastery/fact-sprint";

let fail = 0;
function verify(code: string) {
  const op = FACT_LEVEL_OP[code];
  const pool = buildFactPool(code, 1);
  const keys = new Set(pool.map((f) => f.key));
  if (keys.size !== pool.length) { fail++; console.log(`${code}: DUP keys`); }
  let wrong = 0;
  for (const f of pool) {
    const m = f.q.match(/^(\d+)\s*([+−×÷])\s*(\d+)$/);
    if (!m) { wrong++; continue; }
    const a = +m[1], b = +m[3];
    const expect = m[2] === "+" ? a + b : m[2] === "−" ? a - b : m[2] === "×" ? a * b : a / b;
    if (String(expect) !== f.a || +f.a < 0) { wrong++; console.log(`  ${code} WRONG ${f.q} = ${f.a} (expect ${expect})`); }
  }
  if (wrong) fail++;
  console.log(`${code} (${op})  facts=${pool.length}  wrong=${wrong}`);
}
["M3", "M4", "M5", "M6"].forEach(verify);
if (isFactLevel("M10") || isFactLevel("M1")) { fail++; console.log("M10/M1 should NOT be fact levels"); }
// reach scaling keeps early pools smaller
const small = buildFactPool("M5", 0.35).length, full = buildFactPool("M5", 1).length;
console.log(`M5 reach 0.35 → ${small} facts, reach 1 → ${full} facts (scales: ${small < full})`);
if (small >= full) fail++;
console.log(fail ? "FAIL" : "PASS");
process.exit(fail ? 1 : 0);
