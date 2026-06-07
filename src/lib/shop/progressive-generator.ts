// src/lib/shop/progressive-generator.ts
// Generates 30 problems in 5 Kumon-style zones per worksheet.
// Also generates fresh worked examples for Tutorial mode.

import { nanoid } from "nanoid";
import { getDifficultyForSheet, SKILL_LEVEL_CODE, type DifficultyParams, type ShopSkill } from "./difficulty-curve";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorksheetProblem {
  id: string;
  type: "arithmetic" | "fill_blank" | "short_answer";
  question: string;
  answer: string;
  points: number;
  zone: 1 | 2 | 3 | 4 | 5; // which of the 5 sections
}

export interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface WorksheetData {
  problems: WorksheetProblem[];
  answerKey: { id: string; answer: string }[];
  workedExample?: WorkedExample; // present in tutorial mode only
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

// ── Zone difficulty multipliers ───────────────────────────────────────────────
// Each zone adjusts the base difficulty params for the sheet
const ZONE_SCALE = [
  { zone: 1, label: "Foundation",           lo: 0.40, hi: 0.55 }, // very easy
  { zone: 2, label: "Building Fluency",      lo: 0.55, hi: 0.70 },
  { zone: 3, label: "Guided Fluency",        lo: 0.70, hi: 0.82 },
  { zone: 4, label: "Independent Practice",  lo: 0.82, hi: 0.92 },
  { zone: 5, label: "Mastery Challenge",     lo: 0.92, hi: 1.00 },
] as const;

function scaleParams(p: DifficultyParams, lo: number, hi: number, t: number): DifficultyParams {
  const scale = lo + (hi - lo) * t;
  const minD = p.minDenominator ?? 2;
  const maxD = p.maxDenominator ?? 8;
  // Scale denominator range — higher zones get larger denominators
  const scaledMaxD = Math.max(minD + 1, Math.round(minD + (maxD - minD) * scale));
  return {
    ...p,
    maxA: p.maxA ? Math.max((p.minA ?? 1) + 1, Math.round(p.maxA * scale)) : undefined,
    maxB: p.maxB ? Math.max((p.minB ?? 1) + 1, Math.round(p.maxB * scale)) : undefined,
    maxCoefficient: p.maxCoefficient ? Math.max(1, Math.round(p.maxCoefficient * scale)) : undefined,
    maxConstant: p.maxConstant ? Math.max(1, Math.round(p.maxConstant * scale)) : undefined,
    maxAnswer: p.maxAnswer ? Math.max(2, Math.round(p.maxAnswer * scale)) : undefined,
    maxNumerator: p.maxNumerator ? Math.max(1, Math.round(p.maxNumerator * scale)) : undefined,
    maxDenominator: scaledMaxD,
    minDenominator: minD,
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

// ── Problem generators ────────────────────────────────────────────────────────

function addProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minA = p.minA ?? 1, maxA = p.maxA ?? 9;
  const minB = p.minB ?? 1, maxB = p.maxB ?? 9;
  let a: number, b: number, attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, maxB);
    if (p.requiresCarry && (a % 10) + (b % 10) < 10 && attempts < 15) { attempts++; continue; }
    if (p.requiresCarry === false && maxA > 9 && (a % 10) + (b % 10) >= 10 && attempts < 15) { attempts++; continue; }
    break;
  } while (true);
  return [`${a} + ${b}`, String(a + b)];
}

function subProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minA = p.minA ?? 2, maxA = p.maxA ?? 9;
  const minB = p.minB ?? 1, maxB = p.maxB ?? 4;
  let a: number, b: number, attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, Math.min(maxB, a - 1));
    if (b < 1) b = 1;
    if (p.requiresBorrow && (a % 10) >= (b % 10) && attempts < 15) { attempts++; continue; }
    if (p.requiresBorrow === false && maxA > 9 && (a % 10) < (b % 10) && attempts < 15) { attempts++; continue; }
    break;
  } while (true);
  return [`${a} - ${b}`, String(a - b)];
}

function mulProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const a = ri(rng, p.minA ?? 1, p.maxA ?? 9);
  const b = ri(rng, p.minB ?? 1, p.maxB ?? 10);
  return [`${a} x ${b}`, String(a * b)];
}

function divProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const divisor = ri(rng, p.minB ?? 2, p.maxB ?? 9);
  const quotient = ri(rng, p.minA ?? 1, p.maxA ?? 12);
  return [`${divisor * quotient} / ${divisor}`, String(quotient)];
}

function fracProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  const minD = p.minDenominator ?? 2, maxD = p.maxDenominator ?? 8, maxN = p.maxNumerator ?? 7;
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

  // Identify/simplify (sheets 1-30)
  if (sheetNumber <= 30) {
    const d = ri(rng, minD, maxD);
    const n = ri(rng, 1, Math.min(maxN, d - 1));
    const g = gcd(n, d);
    if (g > 1) return [`Simplify \\frac{${n}}{${d}}`, `\\frac{${n/g}}{${d/g}}`];
    return [`Write \\frac{${n}}{${d}} in simplest form`, `\\frac{${n}}{${d}}`];
  }

  // Add same denominator (sheets 31-45)
  if (sheetNumber <= 45) {
    const d = ri(rng, minD, maxD);
    const n1 = ri(rng, 1, Math.max(1, Math.floor(d/2)));
    const n2 = ri(rng, 1, Math.max(1, d - n1 - 1));
    const sum = n1 + n2;
    const g = gcd(sum, d);
    const ans = g === d ? "1" : g > 1 ? `\\frac{${sum/g}}{${d/g}}` : `\\frac{${sum}}{${d}}`;
    return [`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}}`, ans];
  }

  // Add unlike denominators (sheets 46-60)
  if (sheetNumber <= 60) {
    const d1 = ri(rng, minD, Math.min(maxD, 8));
    const d2 = ri(rng, minD, Math.min(maxD, 8));
    if (d1 === d2) return fracProblem(rng, p, sheetNumber);
    const n1 = ri(rng, 1, d1 - 1);
    const n2 = ri(rng, 1, d2 - 1);
    const lcm = (d1 * d2) / gcd(d1, d2);
    const sumN = n1 * (lcm/d1) + n2 * (lcm/d2);
    const g = gcd(sumN, lcm);
    const ans = g === lcm ? "1" : `\\frac{${sumN/g}}{${lcm/g}}`;
    return [`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`, ans];
  }

  // Multiply (sheets 61-75)
  if (sheetNumber <= 75) {
    const d1 = ri(rng, minD, maxD), d2 = ri(rng, minD, maxD);
    const n1 = ri(rng, 1, d1 - 1), n2 = ri(rng, 1, d2 - 1);
    const resN = n1 * n2, resD = d1 * d2;
    const g = gcd(resN, resD);
    const ans = g === resD ? "1" : `\\frac{${resN/g}}{${resD/g}}`;
    return [`\\frac{${n1}}{${d1}} x \\frac{${n2}}{${d2}}`, ans];
  }

  // Divide (sheets 76-88) & mixed (89-100)
  const d1 = ri(rng, minD, maxD), d2 = ri(rng, minD, maxD);
  const n1 = ri(rng, 1, d1 - 1), n2 = ri(rng, 1, d2 - 1);
  const resN = n1 * d2, resD = d1 * n2;
  const g = gcd(resN, resD);
  const ans = g === resD ? "1" : `\\frac{${resN/g}}{${resD/g}}`;
  return [`\\frac{${n1}}{${d1}} / \\frac{${n2}}{${d2}}`, ans];
}

function decProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  if (sheetNumber <= 15) {
    const n = ri(rng, 1, 9), d = ri(rng, 1, 9);
    return [`In ${n}.${d}, what digit is in the tenths place?`, String(d)];
  }
  if (sheetNumber <= 30) {
    const n = ri(rng, 1, 9), d1 = ri(rng, 0, 9), d2 = ri(rng, 1, 9);
    const t = rng() > 0.5 ? "tenths" : "hundredths";
    return [`In ${n}.${d1}${d2}, what digit is in the ${t} place?`, t === "tenths" ? String(d1) : String(d2)];
  }
  if (sheetNumber <= 50) {
    const a = parseFloat((ri(rng, 1, 99) / 10).toFixed(1));
    const b = parseFloat((ri(rng, 1, 99) / 10).toFixed(1));
    const op = rng() > 0.5 ? "+" : "-";
    if (op === "+") return [`${a} + ${b}`, String(parseFloat((a + b).toFixed(2)))];
    const big = Math.max(a, b), small = Math.min(a, b);
    return [`${big} - ${small}`, String(parseFloat((big - small).toFixed(2)))];
  }
  if (sheetNumber <= 70) {
    const a = parseFloat((ri(rng, 1, 9) / 10).toFixed(1));
    const b = ri(rng, 2, 9);
    return [`${a} x ${b}`, String(parseFloat((a * b).toFixed(2)))];
  }
  if (sheetNumber <= 85) {
    const divisor = ri(rng, 2, 5);
    const answer = parseFloat((ri(rng, 1, 9) / 10).toFixed(1));
    return [`${parseFloat((answer * divisor).toFixed(1))} / ${divisor}`, String(answer)];
  }
  const bases = [10, 20, 25, 50, 100], pcts = [10, 15, 20, 25, 50];
  const base = bases[Math.floor(rng() * bases.length)];
  const pct = pcts[Math.floor(rng() * pcts.length)];
  return [`What is ${pct}% of ${base}?`, String((base * pct) / 100)];
}

function algProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  const maxC = p.maxCoefficient ?? 3, maxK = p.maxConstant ?? 10, maxAns = p.maxAnswer ?? 15;
  const x = ri(rng, 1, maxAns);

  if (sheetNumber <= 20) {
    const a = ri(rng, 1, maxK);
    return rng() > 0.5 ? [`x + ${a} = ${x + a}`, String(x)] : [`x - ${a} = ${Math.max(1, x - a)}`, String(x)];
  }
  if (sheetNumber <= 40) {
    const a = ri(rng, 2, Math.max(2, maxC));
    return [`${a}x = ${a * x}`, String(x)];
  }
  if (sheetNumber <= 65) {
    const a = ri(rng, 2, Math.max(2, maxC)), b = ri(rng, 1, maxK);
    return rng() > 0.5 ? [`${a}x + ${b} = ${a * x + b}`, String(x)] : [`${a}x - ${b} = ${a * x - b}`, String(x)];
  }
  if (sheetNumber <= 85) {
    const a = ri(rng, 2, maxC);
    return [`${a}x < ${a * x + ri(rng, 1, 5)}. Largest integer x?`, String(x)];
  }
  // Word problems
  const probs: [string, string][] = [
    [`A has 3 times as many as B. Together they have ${4 * x}. How many does A have?`, String(3 * x)],
    [`A number times 2 plus ${ri(rng,1,8)} equals ${2*x + ri(rng,1,8)}. The number?`, String(x)],
    [`Two consecutive integers sum to ${2*x+1}. The smaller?`, String(x)],
  ];
  return probs[Math.floor(rng() * probs.length)];
}

function generateOneProblem(skill: ShopSkill, p: DifficultyParams, sheetNumber: number, rng: () => number): [string, string] {
  switch (skill) {
    case "ADDITION":        return addProblem(rng, p);
    case "SUBTRACTION":     return subProblem(rng, p);
    case "MULTIPLICATION":  return mulProblem(rng, p);
    case "DIVISION":        return divProblem(rng, p);
    case "FRACTIONS":       return fracProblem(rng, p, sheetNumber);
    case "DECIMALS":        return decProblem(rng, p, sheetNumber);
    case "PRE_ALGEBRA":     return algProblem(rng, p, sheetNumber);
    default:                return [`Problem`, "—"];
  }
}

// ── Worked Example Generator ──────────────────────────────────────────────────

function generateWorkedExample(skill: ShopSkill, p: DifficultyParams, sheetNumber: number): WorkedExample {
  // Use a deterministic seed so worked example is always the same for this sheet
  const rng = seedRng(`worked-${skill}-${sheetNumber}`);

  // Use slightly easier params than Zone 1 for the worked example
  const easyP = scaleParams(p, 0.3, 0.45, 0.5);

  switch (skill) {
    case "ADDITION": {
      const [q] = addProblem(rng, easyP);
      const parts = q.split(" + ");
      const a = parseInt(parts[0]), b = parseInt(parts[1]);
      const steps: string[] = [];
      if (a >= 10 && b >= 10) {
        steps.push(`Write the numbers one above the other, ones column aligned`);
        steps.push(`Add the ones digits: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10) >= 10 ? `${(a % 10) + (b % 10)} — write ${(a % 10 + b % 10) % 10}, carry 1` : (a % 10) + (b % 10)}`);
        steps.push(`Add the tens digits${(a % 10) + (b % 10) >= 10 ? " plus the carried 1" : ""}: ${Math.floor(a/10)} + ${Math.floor(b/10)}${(a%10+b%10)>=10?"+1":""} = ${Math.floor(a/10)+Math.floor(b/10)+((a%10+b%10)>=10?1:0)}`);
      } else {
        steps.push(`Start from the ones column`);
        steps.push(`${a} + ${b} = count up ${b} from ${a}`);
        steps.push(`Reach ${a + b}`);
      }
      return { problem: q + " =", steps, answer: String(a + b) };
    }

    case "SUBTRACTION": {
      const [q] = subProblem(rng, easyP);
      const parts = q.split(" - ");
      const a = parseInt(parts[0]), b = parseInt(parts[1]);
      const steps: string[] = [];
      if (a >= 10) {
        steps.push(`Write the larger number on top, smaller below, ones column aligned`);
        if ((a % 10) < (b % 10)) {
          steps.push(`Ones column: ${a % 10} < ${b % 10} — borrow 1 ten from the tens column`);
          steps.push(`Ones: ${(a % 10) + 10} - ${b % 10} = ${(a % 10) + 10 - (b % 10)}`);
          steps.push(`Tens: ${Math.floor(a/10) - 1} - ${Math.floor(b/10)} = ${Math.floor(a/10) - 1 - Math.floor(b/10)}`);
        } else {
          steps.push(`Subtract ones: ${a % 10} - ${b % 10} = ${(a % 10) - (b % 10)}`);
          steps.push(`Subtract tens: ${Math.floor(a/10)} - ${Math.floor(b/10)} = ${Math.floor(a/10) - Math.floor(b/10)}`);
        }
      } else {
        steps.push(`Count back ${b} from ${a}`);
        steps.push(`${a} → count down ${b} → reach ${a - b}`);
      }
      return { problem: q + " =", steps, answer: String(a - b) };
    }

    case "MULTIPLICATION": {
      const [q] = mulProblem(rng, easyP);
      const parts = q.split(" x ");
      const a = parseInt(parts[0]), b = parseInt(parts[1]);
      return {
        problem: q + " =",
        steps: [
          `Think of ${a} x ${b} as ${b} groups of ${a}`,
          `Or skip-count by ${a}: ${Array.from({length:b}, (_,i) => a*(i+1)).join(", ")}`,
          `The ${b}th count gives us the answer`,
        ],
        answer: String(a * b),
      };
    }

    case "DIVISION": {
      const [q] = divProblem(rng, easyP);
      const parts = q.split(" / ");
      const dividend = parseInt(parts[0]), divisor = parseInt(parts[1]);
      const quotient = dividend / divisor;
      return {
        problem: q + " =",
        steps: [
          `Ask: how many groups of ${divisor} fit into ${dividend}?`,
          `${divisor} x 1 = ${divisor}, ${divisor} x 2 = ${divisor*2}...`,
          `${divisor} x ${quotient} = ${dividend} ✓`,
        ],
        answer: String(quotient),
      };
    }

    case "FRACTIONS": {
      if (sheetNumber <= 30) {
        return {
          problem: `Simplify \\frac{4}{8}`,
          steps: [
            `Find the GCF (greatest common factor) of 4 and 8`,
            `Factors of 4: 1, 2, 4 — Factors of 8: 1, 2, 4, 8 — GCF = 4`,
            `Divide both numerator and denominator by 4`,
            `\\frac{4 ÷ 4}{8 ÷ 4} = \\frac{1}{2}`,
          ],
          answer: `\\frac{1}{2}`,
        };
      }
      if (sheetNumber <= 45) {
        return {
          problem: `\\frac{2}{7} + \\frac{3}{7} =`,
          steps: [
            `The denominators are the same (both 7) — add the numerators only`,
            `2 + 3 = 5`,
            `Keep the denominator: \\frac{5}{7}`,
            `Check: can \\frac{5}{7} be simplified? GCF of 5 and 7 = 1 — already in simplest form`,
          ],
          answer: `\\frac{5}{7}`,
        };
      }
      if (sheetNumber <= 60) {
        return {
          problem: `\\frac{1}{3} + \\frac{1}{4} =`,
          steps: [
            `Different denominators — find the LCM of 3 and 4`,
            `Multiples of 3: 3, 6, 9, 12... Multiples of 4: 4, 8, 12... LCM = 12`,
            `Convert: \\frac{1}{3} = \\frac{4}{12} and \\frac{1}{4} = \\frac{3}{12}`,
            `Add: \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}`,
          ],
          answer: `\\frac{7}{12}`,
        };
      }
      if (sheetNumber <= 75) {
        return {
          problem: `\\frac{2}{3} x \\frac{3}{4} =`,
          steps: [
            `Multiply numerators together: 2 x 3 = 6`,
            `Multiply denominators together: 3 x 4 = 12`,
            `Result: \\frac{6}{12}`,
            `Simplify: GCF of 6 and 12 = 6 → \\frac{6÷6}{12÷6} = \\frac{1}{2}`,
          ],
          answer: `\\frac{1}{2}`,
        };
      }
      return {
        problem: `\\frac{3}{4} / \\frac{1}{2} =`,
        steps: [
          `Dividing by a fraction = multiplying by its reciprocal`,
          `Flip the second fraction: \\frac{1}{2} becomes \\frac{2}{1}`,
          `Multiply: \\frac{3}{4} x \\frac{2}{1} = \\frac{6}{4}`,
          `Simplify: \\frac{6}{4} = \\frac{3}{2} = 1\\frac{1}{2}`,
        ],
        answer: `\\frac{3}{2}`,
      };
    }

    case "DECIMALS": {
      if (sheetNumber <= 50) {
        return {
          problem: `3.4 + 2.5 =`,
          steps: [
            `Line up the decimal points`,
            `Add tenths: 4 + 5 = 9 tenths`,
            `Add ones: 3 + 2 = 5 ones`,
            `Result: 5.9`,
          ],
          answer: `5.9`,
        };
      }
      return {
        problem: `0.4 x 3 =`,
        steps: [
          `Ignore the decimal: 4 x 3 = 12`,
          `Count decimal places in the original numbers: 1 decimal place`,
          `Place the decimal: 1.2`,
        ],
        answer: `1.2`,
      };
    }

    case "PRE_ALGEBRA": {
      if (sheetNumber <= 20) {
        return {
          problem: `x + 7 = 12`,
          steps: [
            `The goal: get x alone on one side`,
            `x is being added to 7 — undo this by subtracting 7 from both sides`,
            `x + 7 - 7 = 12 - 7`,
            `x = 5`,
            `Check: 5 + 7 = 12 ✓`,
          ],
          answer: `x = 5`,
        };
      }
      if (sheetNumber <= 40) {
        return {
          problem: `3x = 12`,
          steps: [
            `x is being multiplied by 3 — undo this by dividing both sides by 3`,
            `3x ÷ 3 = 12 ÷ 3`,
            `x = 4`,
            `Check: 3 x 4 = 12 ✓`,
          ],
          answer: `x = 4`,
        };
      }
      return {
        problem: `2x + 3 = 11`,
        steps: [
          `Step 1: Subtract 3 from both sides → 2x = 8`,
          `Step 2: Divide both sides by 2 → x = 4`,
          `Check: 2(4) + 3 = 8 + 3 = 11 ✓`,
        ],
        answer: `x = 4`,
      };
    }

    default:
      return { problem: "Example", steps: ["Work through the problem step by step"], answer: "Answer" };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateProgressiveSheet(
  skill: ShopSkill,
  sheetNumber: number,
  totalSheets: number,
  problemCount: number = 30
): WorksheetData {
  const difficulty = getDifficultyForSheet(skill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}-v2`);

  const problems: WorksheetProblem[] = [];
  const answerKey: { id: string; answer: string }[] = [];

  // Generate 6 problems per zone
  const perZone = Math.floor(problemCount / 5);
  const remainder = problemCount - perZone * 5;

  for (let z = 0; z < 5; z++) {
    const zoneConfig = ZONE_SCALE[z];
    const count = perZone + (z === 4 ? remainder : 0); // extra go to last zone

    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0.5;
      const scaled = scaleParams(difficulty, zoneConfig.lo, zoneConfig.hi, t);
      const [question, answer] = generateOneProblem(skill, scaled, sheetNumber, rng);
      const id = nanoid(8);
      problems.push({
        id, type: "arithmetic", question, answer, points: 1,
        zone: (z + 1) as 1 | 2 | 3 | 4 | 5,
      });
      answerKey.push({ id, answer });
    }
  }

  // Generate worked example for tutorial mode
  const workedExample = difficulty.mode === "tutorial"
    ? generateWorkedExample(skill, difficulty, sheetNumber)
    : undefined;

  return {
    problems,
    answerKey,
    workedExample,
    meta: {
      skill,
      skillCode: SKILL_LEVEL_CODE[skill],
      sheetNumber,
      totalSheets,
      subSkillLabel: difficulty.subSkillLabel,
      gradeLevel: difficulty.gradeLevel,
      difficultyStars: difficulty.difficultyStars,
      learningObjective: difficulty.learningObjective,
      mode: difficulty.mode,
      estimatedMinutes: skill.includes("ALGEBRA") || skill === "FRACTIONS" ? 15 : 10,
    },
  };
}
