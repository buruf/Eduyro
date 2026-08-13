import { generateArithmeticSheet } from "../src/lib/shop/arithmetic-engine";

// The promise a unit's label makes must hold for the operation the CHILD
// performs, not just the one that is printed. "a - ___ = r" is solved as a - r,
// and "___ + b = s" as s - b — that is where the borrow was hiding.
const borrows = (top: number, bot: number) => top % 10 < bot % 10;
const carries = (x: number, y: number) => (x % 10) + (y % 10) >= 10;

const TARGETS = [
  { skill: "SUBTRACTION" as const, label: "2-digit subtraction (no borrowing)", from: 41, to: 54 },
  { skill: "ADDITION" as const, label: "2-digit addition (no regrouping)", from: 29, to: 44 },
];

let failed = false;

for (const t of TARGETS) {
  let total = 0;
  const bad: string[] = [];

  for (let n = t.from; n <= t.to; n++) {
    const sheet = generateArithmeticSheet(t.skill, n, 100, 30);
    for (const p of sheet.problems) {
      const q = String(p.question).replace(/\s+/g, " ").trim();
      total++;
      let m: RegExpMatchArray | null;
      if ((m = q.match(/^(\d+) [-−] _+ = (\d+)$/)) && borrows(+m[1], +m[2]))
        bad.push(`sheet ${n}: ${q}  → child does ${m[1]} - ${m[2]}, borrows`);
      else if ((m = q.match(/^_+ \+ (\d+) = (\d+)$/)) && borrows(+m[2], +m[1]))
        bad.push(`sheet ${n}: ${q}  → child does ${m[2]} - ${m[1]}, borrows`);
      // Facts within 18 are the spiral-review block — known number bonds a
      // child recalls, not a column borrow. Same carve-out as 1 + 9 below.
      else if ((m = q.match(/^(\d+) [-−] (\d+) ?=?$/)) && +m[1] > 18 && borrows(+m[1], +m[2]))
        bad.push(`sheet ${n}: ${q}  borrows`);
      // Single-digit number bonds (1 + 9) are review facts, not a column carry —
      // the label promises no regrouping in 2-DIGIT addition.
      else if ((m = q.match(/^(\d+) \+ (\d+) ?=?$/)) && +m[1] > 9 && +m[2] > 9 && carries(+m[1], +m[2]))
        bad.push(`sheet ${n}: ${q}  carries`);
    }
  }

  const ok = bad.length === 0;
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"}  ${t.label}`);
  console.log(`      sheets ${t.from}-${t.to} · ${total} problems · ${bad.length} break the promise`);
  for (const b of bad.slice(0, 10)) console.log(`        ${b}`);
}

process.exit(failed ? 1 : 0);
