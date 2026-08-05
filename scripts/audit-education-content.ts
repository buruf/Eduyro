// scripts/audit-education-content.ts
// EMPIRICAL education-content audit for M1–M18.
// Generates every sheet from the real engines and INDEPENDENTLY re-verifies
// each answer by parsing the question string. Also checks within-sheet
// repetition and cross-sheet difficulty monotonicity.
//
// Run: npx tsx scripts/audit-education-content.ts

import { generateProgressiveSheet, type WorksheetData, type WorksheetProblem } from "../src/lib/shop/progressive-generator";
import { generateEarlyMathSheet } from "../src/lib/shop/early-math-engine";
import { generateHigherMathSheet } from "../src/lib/shop/higher-math-engine";
import { SHOP_SKILLS, type ShopSkill } from "../src/lib/shop/pack-generator";

// ── independent answer verifier ────────────────────────────────────────────
// Returns: true (verified correct), false (verified WRONG), or null (can't verify).

function frac(s: string): [number, number] | null {
  const m = s.replace(/\\+/g, "\\").match(/\\frac\{(-?\d+)\}\{(-?\d+)\}/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10)];
}
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function fracEqual(a: string, b: string): boolean | null {
  const fa = frac(a), fb = frac(b);
  if (!fa && /^\d+$/.test(a.trim()) && fb) { // integer vs fraction
    return fb[1] !== 0 && fb[0] / fb[1] === parseInt(a, 10);
  }
  if (fa && fb) {
    return fa[0] * fb[1] === fb[0] * fa[1];
  }
  return null;
}

// Verify an arithmetic-style question against the engine's answer.
function verify(q: string, ans: string): boolean | null {
  const question = q.replace(/ /g, " ").trim();
  const answer = ans.trim();

  // missing-operand forms: "___ + 3 = 8", "5 + ___ = 8", "9 - ___ = 4", "___ × 3 = 12", "___ ÷ 4 = 3"
  let m = question.match(/^___\s*([+\-×*])\s*(\d+)\s*=\s*(\d+)$/);
  if (m) {
    const [, op, b, c] = m; const B = +b, C = +c;
    const expect = op === "+" ? C - B : op === "-" ? C + B : /* ×/* */ C / B;
    return String(expect) === answer;
  }
  m = question.match(/^(\d+)\s*([+\-×*])\s*___\s*=\s*(\d+)$/);
  if (m) {
    const [, a, op, c] = m; const A = +a, C = +c;
    const expect = op === "+" ? C - A : op === "-" ? A - C : C / A;
    return String(expect) === answer;
  }
  m = question.match(/^___\s*([÷/])\s*(\d+)\s*=\s*(\d+)$/); // ___ ÷ 4 = 3
  if (m) { const [, , b, c] = m; return String(+b * +c) === answer; }
  m = question.match(/^(\d+)\s*([÷/])\s*___\s*=\s*(\d+)$/); // 12 ÷ ___ = 3
  if (m) { const [, a, , c] = m; return +c !== 0 && String(+a / +c) === answer; }

  // plain binary: a op b  (optional trailing =)
  m = question.match(/^(\d+)\s*([+\-×*÷/])\s*(\d+)\s*=?\s*$/);
  if (m) {
    const [, a, op, b] = m; const A = +a, B = +b;
    let expect: number;
    switch (op) {
      case "+": expect = A + B; break;
      case "-": expect = A - B; break;
      case "×": case "*": expect = A * B; break;
      case "÷": case "/":
        if (B === 0) return null;
        // remainder answers "q r r"
        if (/r/.test(answer)) {
          const mm = answer.match(/^(\d+)\s*r\s*(\d+)$/);
          if (!mm) return null;
          return +mm[1] * B + +mm[2] === A;
        }
        if (A % B !== 0) return null;
        expect = A / B; break;
      default: return null;
    }
    return String(expect) === answer;
  }

  // fraction arithmetic:  \frac{a}{b} [op] \frac{c}{d}
  const fracs = [...question.matchAll(/\\+frac\{(-?\d+)\}\{(-?\d+)\}/g)];
  const opM = question.match(/\}\s*([+\-×*÷])\s*\\/);
  if (fracs.length === 2 && opM) {
    const [n1, d1] = [+fracs[0][1], +fracs[0][2]];
    const [n2, d2] = [+fracs[1][1], +fracs[1][2]];
    let rn: number, rd: number;
    switch (opM[1]) {
      case "+": rn = n1 * d2 + n2 * d1; rd = d1 * d2; break;
      case "-": rn = n1 * d2 - n2 * d1; rd = d1 * d2; break;
      case "×": case "*": rn = n1 * n2; rd = d1 * d2; break;
      case "÷": rn = n1 * d2; rd = d1 * n2; break;
      default: return null;
    }
    if (rd === 0) return null;
    const g = gcd(rn, rd) || 1;
    const canon = `\\frac{${rn / g}}{${rd / g}}`;
    const eq = fracEqual(canon, answer);
    return eq;
  }

  // "Write the fraction: n out of d" / "n shaded out of d"
  m = question.match(/(\d+)\s*(?:shaded\s+)?out of\s*(\d+)/i);
  if (m) {
    const f = frac(answer);
    return f ? f[0] === +m[1] && f[1] === +m[2] : answer === `${m[1]}/${m[2]}`;
  }

  // word problems: pull the numbers and try +,-,× to match a single-number answer
  if (/[a-zA-Z]/.test(question) && /^\d+(\s*r\s*\d+)?$/.test(answer)) {
    const nums = (question.match(/\d+/g) || []).map(Number);
    if (nums.length >= 2 && /^\d+$/.test(answer)) {
      const A = +answer;
      // try every ordered pair with +,-,×,÷
      for (let i = 0; i < nums.length; i++)
        for (let j = 0; j < nums.length; j++) {
          if (i === j) continue;
          const x = nums[i], y = nums[j];
          if (x + y === A || x - y === A || x * y === A || (y !== 0 && x / y === A)) return true;
        }
      return null; // couldn't reconstruct — don't claim wrong
    }
  }

  return null; // unverifiable form (decimals, algebra, geometry, interactive…)
}

// ── audit a single generated sheet ─────────────────────────────────────────
interface SheetReport { wrong: { q: string; a: string }[]; verified: number; unverified: number; dupWorst: number; }

function auditSheet(data: WorksheetData): SheetReport {
  const wrong: { q: string; a: string }[] = [];
  let verified = 0, unverified = 0;
  const counts = new Map<string, number>();
  for (const p of data.problems as WorksheetProblem[]) {
    counts.set(p.question, (counts.get(p.question) ?? 0) + 1);
    // For MC/TF, the engine's `answer` should be one of the options
    const res = verify(p.question, p.answer);
    if (res === null) unverified++;
    else if (res) verified++;
    else { wrong.push({ q: p.question, a: p.answer }); }
  }
  const dupWorst = Math.max(0, ...[...counts.values()]);
  return { wrong, verified, unverified, dupWorst };
}

// ── run ────────────────────────────────────────────────────────────────────
type Gen = (n: number, total: number) => WorksheetData;

interface LevelSpec { code: string; label: string; total: number; gen: Gen; }

const levels: LevelSpec[] = [];

// M1–M2 early math
for (const code of ["M1", "M2"]) {
  levels.push({ code, label: code, total: 100, gen: (n, t) => generateEarlyMathSheet(code, n, t, 30) });
}
// M3–M12 (+ decimals/ratios/etc) via shop skills
const codeForSkill: Record<string, string> = {
  ADDITION: "M3", SUBTRACTION: "M4", MULTIPLICATION: "M5", DIVISION: "M6",
  FRACTIONS: "M7", DECIMALS: "M8", RATIOS: "M9", PRE_ALGEBRA: "M10",
  LINEAR_EQUATIONS: "M11", POLYNOMIALS: "M12", GEOMETRY: "GEO",
};
for (const skill of Object.keys(SHOP_SKILLS) as ShopSkill[]) {
  const total = SHOP_SKILLS[skill].totalSheets;
  levels.push({
    code: codeForSkill[skill] ?? skill, label: `${codeForSkill[skill] ?? skill} ${skill}`, total,
    gen: (n, t) => generateProgressiveSheet(skill, n, t, 30, false),
  });
}
// M13–M18 higher math
for (const code of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
  levels.push({ code, label: code, total: 100, gen: (n, t) => generateHigherMathSheet(code, n, t, 30) });
}

let grandWrong = 0, grandVerified = 0, grandUnverified = 0, grandDupSheets = 0, grandMonoViolations = 0;

for (const lvl of levels) {
  let wrong = 0, verified = 0, unverified = 0, dupSheets = 0;
  const wrongSamples: string[] = [];
  const starsSeq: number[] = [];
  for (let n = 1; n <= lvl.total; n++) {
    let data: WorksheetData;
    try { data = lvl.gen(n, lvl.total); }
    catch (e) { console.log(`  ${lvl.label} sheet ${n}: THREW ${(e as Error).message}`); continue; }
    const r = auditSheet(data);
    verified += r.verified; unverified += r.unverified;
    if (r.wrong.length) {
      wrong += r.wrong.length;
      for (const w of r.wrong) if (wrongSamples.length < 6) wrongSamples.push(`"${w.q}" → engine says ${w.a}`);
    }
    if (r.dupWorst > 2) dupSheets++; // >2 identical in one sheet = repetition smell
    starsSeq.push(data.meta.difficultyStars ?? 0);
  }
  // monotonicity: count strict DROPS in difficulty stars across the sequence
  let mono = 0;
  for (let i = 1; i < starsSeq.length; i++) if (starsSeq[i] < starsSeq[i - 1]) mono++;

  grandWrong += wrong; grandVerified += verified; grandUnverified += unverified;
  grandDupSheets += dupSheets; grandMonoViolations += mono;

  const flag = wrong > 0 ? "❌" : "✓";
  console.log(
    `${flag} ${lvl.label.padEnd(26)} sheets=${lvl.total}  verified=${verified}  wrong=${wrong}  unverifiable=${unverified}  dupSheets(>2)=${dupSheets}  starDrops=${mono}`
  );
  if (wrongSamples.length) wrongSamples.forEach((s) => console.log(`      WRONG: ${s}`));
}

console.log(`\n── TOTALS ──`);
console.log(`verified correct : ${grandVerified}`);
console.log(`WRONG answers    : ${grandWrong}`);
console.log(`unverifiable     : ${grandUnverified}`);
console.log(`sheets w/ >2 dup : ${grandDupSheets}`);
console.log(`star-drop events : ${grandMonoViolations}`);
