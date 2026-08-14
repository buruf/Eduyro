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

if (failed) process.exitCode = 1;

// ── Multiplication & division: no untaught skill on any sheet ──────────────
type Check = { skill: "MULTIPLICATION" | "DIVISION"; from: number; to: number; name: string; bad: (q: string) => string | null };

const tablesOk = (taught: number[]) => (q: string): string | null => {
  // a × b (or missing-factor within the same fact) — one factor must be taught.
  // Squares (n × n) are taught in the square-facts unit (sheets 10-12), which
  // precedes every unit using this predicate, so they are legitimate review.
  let m = q.match(/^(\d+) × (\d+)( = \?)?$/);
  if (m) {
    if (+m[1] === +m[2]) return null;
    return taught.includes(+m[1]) || taught.includes(+m[2]) ? null : `${q} — no taught factor`;
  }
  m = q.match(/^(\d+) × _+ = (\d+)$/);
  if (m) {
    const other = +m[2] / +m[1];
    if (other === +m[1]) return null; // square
    return taught.includes(+m[1]) || taught.includes(other) ? null : `${q} — no taught factor`;
  }
  return null; // scaffold/step formats carry their own numbers
};

const divisorOk = (taught: number[]) => (q: string): string | null => {
  // Square-root facts (n² ÷ n) are taught at sheets 10-12, before every unit
  // using this predicate — legitimate review.
  let m = q.match(/^(\d+) ÷ (\d+)( = \?)?$/);
  if (m) {
    if (+m[1] % +m[2] !== 0) return `${q} — has a remainder before the remainder unit`;
    if (+m[1] / +m[2] === +m[2]) return null; // square
    if (!taught.includes(+m[2]) && !taught.includes(+m[1] / +m[2])) return `${q} — divisor ${m[2]} untaught`;
    return null;
  }
  m = q.match(/^(\d+) ÷ _+ = (\d+)$/);
  if (m) {
    const divisor = +m[1] / +m[2];
    if (divisor === +m[2]) return null; // square
    if (!taught.includes(divisor) && !taught.includes(+m[2])) return `${q} — divisor ${divisor} untaught`;
    return null;
  }
  return null;
};

const noCarryBreakApart = (q: string): string | null => {
  // Any bare or step product in this unit must regroup nowhere.
  const m = q.match(/^(\d\d) × (\d)\b/);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  const tens = Math.floor(a / 10), ones = a % 10;
  return tens * b > 9 || ones * b > 9 ? `${q} — partial product carries` : null;
};

const CHECKS: Check[] = [
  { skill: "MULTIPLICATION", from: 1, to: 6, name: "mul-skip ×2,5,10", bad: tablesOk([2, 5, 10, 0, 1]) },
  { skill: "MULTIPLICATION", from: 7, to: 9, name: "mul-identity ×1,×0", bad: tablesOk([2, 5, 10, 0, 1]) },
  { skill: "MULTIPLICATION", from: 13, to: 22, name: "mul-3-4 (+review)", bad: tablesOk([0, 1, 2, 3, 4, 5, 10]) },
  { skill: "MULTIPLICATION", from: 59, to: 68, name: "mul-break-apart (no carrying)", bad: noCarryBreakApart },
  { skill: "DIVISION", from: 1, to: 6, name: "div-skip ÷2,5,10", bad: divisorOk([2, 5, 10]) },
  { skill: "DIVISION", from: 13, to: 22, name: "div-3-4 (+review)", bad: divisorOk([1, 2, 3, 4, 5, 10]) },
  { skill: "DIVISION", from: 23, to: 36, name: "div-6-9 (+review)", bad: divisorOk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) },
  { skill: "DIVISION", from: 37, to: 58, name: "div-fact-family + 10-12", bad: divisorOk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) },
  { skill: "DIVISION", from: 77, to: 92, name: "div-larger (exact only)", bad: (q) => {
    const m = q.match(/^(\d+) ÷ (\d+)( = \?)?$/);
    return m && +m[1] % +m[2] !== 0 ? `${q} — remainder in an exact unit` : null;
  } },
];

let mdFailed = false;
for (const c of CHECKS) {
  let total = 0;
  const bad: string[] = [];
  for (let n = c.from; n <= c.to; n++) {
    const sheet = generateArithmeticSheet(c.skill, n, 100, 30);
    for (const p of sheet.problems) {
      total++;
      const why = c.bad(String(p.question).replace(/\s+/g, " ").trim());
      if (why) bad.push(`sheet ${n}: ${why}`);
    }
  }
  if (bad.length) mdFailed = true;
  console.log(`${bad.length ? "FAIL" : "PASS"}  ${c.name} — ${total} problems, ${bad.length} violations`);
  for (const b of [...new Set(bad)].slice(0, 6)) console.log(`        ${b}`);
}
if (mdFailed) process.exitCode = 1;