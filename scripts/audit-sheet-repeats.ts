// scripts/audit-sheet-repeats.ts
// No sheet may ask the SAME question three or more times. A small pool is a
// reason for a shorter sheet, never for a third identical pass — a child who
// meets the same question a third time reads it as a bug, not as practice.
import { generateHigherMathSheet } from "../src/lib/shop/higher-math-engine";
import { generateEarlyMathSheet } from "../src/lib/shop/early-math-engine";
import { generateArithmeticSheet } from "../src/lib/shop/arithmetic-engine";

const offenders: string[] = [];
let sheets = 0;

function check(label: string, sheet: number, problems: { question?: string }[]) {
  sheets++;
  const counts = new Map<string, number>();
  for (const p of problems) {
    const q = String(p.question ?? "").trim();
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }
  for (const [q, n] of counts) {
    if (n > 2) offenders.push(`${label} sheet ${sheet}: x${n} "${q.slice(0, 70)}"`);
  }
}

for (const code of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
  for (let s = 1; s <= 100; s++) {
    try {
      check(code, s, generateHigherMathSheet(code, s, 100, 30).problems);
    } catch { /* level not generatable at this sheet */ }
  }
}
for (const code of ["M1", "M2"]) {
  for (let s = 1; s <= 100; s++) {
    try {
      check(code, s, generateEarlyMathSheet(code, s, 100, 30).problems);
    } catch { /* skip */ }
  }
}
for (const skill of ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"]) {
  for (let s = 1; s <= 100; s++) {
    try {
      check(skill, s, generateArithmeticSheet(skill as never, s, 100, 30).problems);
    } catch { /* skip */ }
  }
}

console.log(`Checked ${sheets} sheets for repeated questions.`);
if (offenders.length) {
  console.log(`\nREPEATED 3+ TIMES ON ONE SHEET (${offenders.length}):`);
  for (const o of offenders.slice(0, 20)) console.log(`  x ${o}`);
  process.exit(1);
}
console.log("PASS - no sheet asks the same question three times.");
