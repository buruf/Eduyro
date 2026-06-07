// src/lib/shop/progressive-generator.ts
// Path-following worksheet generator.
// Each problem is generated from its DifficultyVector node.
// Only ONE dimension changes between consecutive problems.

import { nanoid } from "nanoid";
import { getProgressionPath, type DifficultyVector, type ShopSkill } from "./progression-paths";
import { getDifficultyForSheet, SKILL_LEVEL_CODE } from "./difficulty-curve";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorksheetProblem {
  id: string;
  type: "arithmetic" | "fill_blank" | "short_answer";
  question: string;
  answer: string;
  points: number;
  zone: 1 | 2 | 3 | 4 | 5;
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface WorksheetData {
  problems: WorksheetProblem[];
  answerKey: { id: string; answer: string }[];
  workedExample?: WorkedExample;
  meta: {
    skill: ShopSkill;
    skillCode: string;
    sheetNumber: number;
    totalSheets: number;
    subSkillLabel: string;
    gradeLevel: string;
    difficultyStars: number;
    learningObjective: string;
    mode: "tutorial" | "practice" | "assessment";
    estimatedMinutes: number;
  };
}

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function seedRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  let s = h >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ri(rng: () => number, lo: number, hi: number): number {
  if (lo >= hi) return lo;
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

function zoneForIndex(i: number): 1 | 2 | 3 | 4 | 5 {
  if (i < 6)  return 1;
  if (i < 12) return 2;
  if (i < 18) return 3;
  if (i < 24) return 4;
  return 5;
}

// ── Problem generators from DifficultyVector ──────────────────────────────────

function generateAdditionProblem(v: DifficultyVector, rng: () => number): [string, string] {
  const minA = v.minA ?? 1, maxA = v.maxA ?? 9;
  const minB = v.minB ?? 1, maxB = v.maxB ?? 9;
  let a: number, b: number, attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, maxB);
    attempts++;
    if (attempts > 30) break;
    if (v.carry === true  && (a % 10) + (b % 10) < 10) continue;
    if (v.carry === false && maxA > 9 && (a % 10) + (b % 10) >= 10) continue;
    break;
  } while (true);
  return [`${a} + ${b}`, String(a + b)];
}

function generateSubtractionProblem(v: DifficultyVector, rng: () => number): [string, string] {
  const minA = v.minA ?? 2, maxA = v.maxA ?? 9;
  const minB = v.minB ?? 1, maxB = v.maxB ?? 4;
  let a: number, b: number, attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, Math.min(maxB, a - 1));
    if (b < 1) b = 1;
    attempts++;
    if (attempts > 30) break;
    if (v.borrow === true  && (a % 10) >= (b % 10)) continue;
    if (v.borrow === false && maxA > 9 && (a % 10) < (b % 10)) continue;
    break;
  } while (true);
  return [`${a} - ${b}`, String(a - b)];
}

function generateMultiplicationProblem(v: DifficultyVector, rng: () => number): [string, string] {
  const a = ri(rng, v.minA ?? 1, v.maxA ?? 9);
  const b = ri(rng, v.minB ?? 1, v.maxB ?? 10);
  return [`${a} x ${b}`, String(a * b)];
}

function generateDivisionProblem(v: DifficultyVector, rng: () => number): [string, string] {
  const divisor  = ri(rng, v.minB ?? 2, v.maxB ?? 9);
  const quotient = ri(rng, v.minA ?? 1, v.maxA ?? 12);
  return [`${divisor * quotient} / ${divisor}`, String(quotient)];
}

function generateFractionProblem(v: DifficultyVector, rng: () => number): [string, string] {
  const op = v.operation ?? "identify";
  const minD = 2;
  const maxD = v.denominator ?? v.maxDenominator ?? 6;
  const d = v.denominator ?? ri(rng, minD, maxD);

  if (op === "identify") {
    const n = ri(rng, 1, d - 1);
    const formats = [
      `A shape has ${d} equal parts. ${n} ${n===1?"part":"parts"} ${n===1?"is":"are"} shaded. Write the fraction.`,
      `${n} out of ${d} equal parts are coloured. Write the fraction.`,
      `A ribbon is cut into ${d} equal pieces. ${n} ${n===1?"piece is":"pieces are"} taken. What fraction is taken?`,
    ];
    const q = formats[Math.floor(rng() * formats.length)];
    return [q, `\\frac{${n}}{${d}}`];
  }

  if (op === "simplify") {
    // Find a fraction with GCF > 1
    let n: number, attempts = 0;
    do {
      n = ri(rng, 2, d - 1);
      attempts++;
    } while (gcd(n, d) === 1 && attempts < 20);
    const g = gcd(n, d);
    if (g <= 1) return [`Simplify \\frac{${n+1}}{${d}}`, `\\frac{${n+1}}{${d}}`];
    return [`Simplify \\frac{${n}}{${d}}`, `\\frac{${n/g}}{${d/g}}`];
  }

  if (op === "add-same") {
    const safeD = Math.max(3, d);
    const n1 = ri(rng, 1, Math.floor(safeD / 2));
    const n2 = ri(rng, 1, safeD - n1 - 1);
    const sum = n1 + n2;
    const g = gcd(sum, safeD);
    const ans = g === safeD ? "1" : g > 1 ? `\\frac{${sum/g}}{${safeD/g}}` : `\\frac{${sum}}{${safeD}}`;
    return [`\\frac{${n1}}{${safeD}} + \\frac{${n2}}{${safeD}}`, ans];
  }

  if (op === "add-unlike") {
    const d1 = v.denominator ?? ri(rng, minD, Math.max(minD, maxD - 1));
    const d2 = v.maxDenominator ? ri(rng, d1 + 1, Math.max(d1+1, maxD)) : d1 + ri(rng, 1, 3);
    const n1 = ri(rng, 1, d1 - 1);
    const n2 = ri(rng, 1, d2 - 1);
    const lcm = (d1 * d2) / gcd(d1, d2);
    const sumN = n1 * (lcm/d1) + n2 * (lcm/d2);
    const g = gcd(sumN, lcm);
    const ans = g === lcm ? "1" : `\\frac{${sumN/g}}{${lcm/g}}`;
    return [`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`, ans];
  }

  if (op === "multiply") {
    const d2 = v.maxDenominator ? ri(rng, minD, maxD) : d + ri(rng, 0, 2);
    const n1 = ri(rng, 1, d - 1);
    const n2 = ri(rng, 1, Math.max(1, d2 - 1));
    const resN = n1 * n2, resD = d * d2;
    const g = gcd(resN, resD);
    const ans = g === resD ? "1" : `\\frac{${resN/g}}{${resD/g}}`;
    return [`\\frac{${n1}}{${d}} x \\frac{${n2}}{${d2}}`, ans];
  }

  if (op === "divide") {
    const d2 = v.maxDenominator ? ri(rng, minD, maxD) : d + ri(rng, 0, 2);
    const n1 = ri(rng, 1, d - 1);
    const n2 = ri(rng, 1, Math.max(1, d2 - 1));
    const resN = n1 * d2, resD = d * n2;
    const g = gcd(resN, resD);
    const ans = g === resD ? "1" : `\\frac{${resN/g}}{${resD/g}}`;
    return [`\\frac{${n1}}{${d}} / \\frac{${n2}}{${d2}}`, ans];
  }

  return [`\\frac{1}{${d}}`, `\\frac{1}{${d}}`];
}

function generateProblemFromVector(
  skill: ShopSkill,
  v: DifficultyVector,
  rng: () => number,
  sheetNumber: number
): [string, string] {
  switch (skill) {
    case "ADDITION":        return generateAdditionProblem(v, rng);
    case "SUBTRACTION":     return generateSubtractionProblem(v, rng);
    case "MULTIPLICATION":  return generateMultiplicationProblem(v, rng);
    case "DIVISION":        return generateDivisionProblem(v, rng);
    case "FRACTIONS":       return generateFractionProblem(v, rng);
    default: {
      // Fallback for skills without paths yet
      const a = ri(rng, v.minA ?? 1, v.maxA ?? 9);
      const b = ri(rng, v.minB ?? 1, v.maxB ?? 9);
      return [`${a} + ${b}`, String(a + b)];
    }
  }
}

// ── Worked examples ───────────────────────────────────────────────────────────

function getWorkedExample(skill: ShopSkill, sheetNumber: number, firstVector: DifficultyVector): WorkedExample {
  if (skill === "ADDITION") {
    const maxA = firstVector.maxA ?? 9;
    if (maxA <= 5) return {
      problem: `2 + 1 =`,
      steps: [`Start with 2`, `Count up 1 more: 2 → 3`, `The answer is 3`],
      answer: `3`,
    };
    if (maxA <= 9) return {
      problem: `5 + 3 =`,
      steps: [`Start with the bigger number: 5`, `Count up 3 more: 5 → 6 → 7 → 8`, `The answer is 8`],
      answer: `8`,
    };
    if (maxA <= 19) return {
      problem: `13 + 5 =`,
      steps: [`Start with 13`, `Count up 5: 13 → 14 → 15 → 16 → 17 → 18`, `The answer is 18`],
      answer: `18`,
    };
    if (firstVector.carry) return {
      problem: `37 + 45 =`,
      steps: [
        `Add ones: 7 + 5 = 12 — write 2, carry 1`,
        `Add tens: 3 + 4 + 1 (carried) = 8`,
        `Answer: 82`,
      ],
      answer: `82`,
    };
    return {
      problem: `34 + 25 =`,
      steps: [
        `Add ones column: 4 + 5 = 9`,
        `Add tens column: 3 + 2 = 5`,
        `Answer: 59`,
      ],
      answer: `59`,
    };
  }

  if (skill === "FRACTIONS") {
    const op = firstVector.operation ?? "identify";
    if (op === "identify") return {
      problem: `A pizza has 4 equal slices. 1 slice is eaten. What fraction is left?`,
      steps: [
        `Total equal parts: 4`,
        `Parts remaining: 4 - 1 = 3`,
        `Write as a fraction: parts remaining / total parts`,
        `Answer: \\frac{3}{4}`,
      ],
      answer: `\\frac{3}{4}`,
    };
    if (op === "simplify") return {
      problem: `Simplify \\frac{6}{9}`,
      steps: [
        `Find the GCF of 6 and 9`,
        `Factors of 6: 1, 2, 3, 6 — Factors of 9: 1, 3, 9 — GCF = 3`,
        `Divide top and bottom by 3: \\frac{6/3}{9/3} = \\frac{2}{3}`,
      ],
      answer: `\\frac{2}{3}`,
    };
    if (op === "add-same") return {
      problem: `\\frac{2}{7} + \\frac{3}{7} =`,
      steps: [
        `Same denominator — add numerators only: 2 + 3 = 5`,
        `Keep the denominator: \\frac{5}{7}`,
        `Check GCF(5,7) = 1 — already simplified`,
      ],
      answer: `\\frac{5}{7}`,
    };
    if (op === "add-unlike") return {
      problem: `\\frac{1}{3} + \\frac{1}{4} =`,
      steps: [
        `Find LCM of 3 and 4: LCM = 12`,
        `Convert: \\frac{1}{3} = \\frac{4}{12} and \\frac{1}{4} = \\frac{3}{12}`,
        `Add: \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}`,
      ],
      answer: `\\frac{7}{12}`,
    };
    if (op === "multiply") return {
      problem: `\\frac{2}{3} x \\frac{3}{4} =`,
      steps: [
        `Multiply numerators: 2 x 3 = 6`,
        `Multiply denominators: 3 x 4 = 12`,
        `Simplify \\frac{6}{12}: GCF = 6, answer = \\frac{1}{2}`,
      ],
      answer: `\\frac{1}{2}`,
    };
    return {
      problem: `\\frac{3}{4} / \\frac{1}{2} =`,
      steps: [
        `Flip the second fraction (reciprocal): \\frac{1}{2} → \\frac{2}{1}`,
        `Multiply: \\frac{3}{4} x \\frac{2}{1} = \\frac{6}{4}`,
        `Simplify: \\frac{6}{4} = \\frac{3}{2}`,
      ],
      answer: `\\frac{3}{2}`,
    };
  }

  return { problem: "Example", steps: ["Work through step by step"], answer: "See above" };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateProgressiveSheet(
  skill: ShopSkill,
  sheetNumber: number,
  totalSheets: number,
  problemCount: number = 30
): WorksheetData {
  const path = getProgressionPath(skill, sheetNumber);
  const difficulty = getDifficultyForSheet(skill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}-v4`);

  const problems: WorksheetProblem[] = [];
  const answerKey: { id: string; answer: string }[] = [];

  for (let i = 0; i < Math.min(problemCount, path.length); i++) {
    const [question, answer] = generateProblemFromVector(skill, path[i], rng, sheetNumber);
    const id = nanoid(8);
    problems.push({ id, type: "arithmetic", question, answer, points: 1, zone: zoneForIndex(i) });
    answerKey.push({ id, answer });
  }

  const workedExample = difficulty.mode === "tutorial"
    ? getWorkedExample(skill, sheetNumber, path[0])
    : undefined;

  return {
    problems,
    answerKey,
    workedExample,
    meta: {
      skill,
      skillCode: SKILL_LEVEL_CODE[skill] ?? "M1",
      sheetNumber,
      totalSheets,
      subSkillLabel: difficulty.subSkillLabel,
      gradeLevel: difficulty.gradeLevel,
      difficultyStars: difficulty.difficultyStars,
      learningObjective: difficulty.learningObjective,
      mode: difficulty.mode,
      estimatedMinutes: skill === "FRACTIONS" || skill === "PRE_ALGEBRA" ? 15 : 10,
    },
  };
}
