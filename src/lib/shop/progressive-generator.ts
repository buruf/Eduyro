// src/lib/shop/progressive-generator.ts
// Generates problems using the difficulty curve system.
// Problems within a sheet are ordered from slightly easier to slightly harder
// within the sheet's difficulty tier — Kumon philosophy applied at problem level too.
// Uses seeded RNG for reproducibility — same sheet always gives same problems.

import { nanoid } from "nanoid";
import { getDifficultyForSheet, type DifficultyParams, type ShopSkill } from "./difficulty-curve";

interface Problem {
  id: string;
  type: "arithmetic" | "fill_blank" | "short_answer";
  question: string;
  answer: string;
  points: number;
}

// Seeded RNG — Mulberry32
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
  return Math.floor(rng() * (hi - lo + 1)) + lo;
}

// ── Problem generators by skill ───────────────────────────────────────────────

function additionProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minA = p.minA ?? 1, maxA = p.maxA ?? 9;
  const minB = p.minB ?? 1, maxB = p.maxB ?? 9;
  
  let a: number, b: number;
  let attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, maxB);
    attempts++;
    if (attempts > 20) break;
    // If carry required, ensure ones digits sum to ≥ 10
    if (p.requiresCarry && (a % 10) + (b % 10) < 10) continue;
    // If carry not required and both are multi-digit, ensure no carry
    if (p.requiresCarry === false && maxA > 9 && (a % 10) + (b % 10) >= 10) continue;
    break;
  } while (true);
  
  return [`${a} + ${b}`, String(a + b)];
}

function subtractionProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minA = p.minA ?? 2, maxA = p.maxA ?? 9;
  const minB = p.minB ?? 1, maxB = p.maxB ?? 4;
  
  let a: number, b: number;
  let attempts = 0;
  do {
    a = ri(rng, minA, maxA);
    b = ri(rng, minB, Math.min(maxB, a - 1));
    if (b < 1) b = 1;
    attempts++;
    if (attempts > 20) break;
    if (p.requiresBorrow && (a % 10) >= (b % 10)) continue;
    if (p.requiresBorrow === false && maxA > 9 && (a % 10) < (b % 10)) continue;
    break;
  } while (true);
  
  return [`${a} - ${b}`, String(a - b)];
}

function multiplicationProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minA = p.minA ?? 1, maxA = p.maxA ?? 9;
  const minB = p.minB ?? 1, maxB = p.maxB ?? 10;
  const a = ri(rng, minA, maxA);
  const b = ri(rng, minB, maxB);
  return [`${a} x ${b}`, String(a * b)];
}

function divisionProblem(rng: () => number, p: DifficultyParams): [string, string] {
  const minB = p.minB ?? 2, maxB = p.maxB ?? 9;
  const minQ = p.minA ?? 1, maxQ = p.maxA ?? 12;
  const divisor = ri(rng, minB, maxB);
  const quotient = ri(rng, minQ, maxQ);
  const dividend = divisor * quotient;
  return [`${dividend} / ${divisor}`, String(quotient)];
}

function fractionProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  const minD = p.minDenominator ?? 2;
  const maxD = p.maxDenominator ?? 8;
  const maxN = p.maxNumerator ?? 7;
  
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  
  // Sheets 1-35: identify/simplify
  if (sheetNumber <= 35) {
    const d = ri(rng, minD, maxD);
    const n = ri(rng, 1, Math.min(maxN, d - 1));
    const g = gcd(n, d);
    if (g > 1) {
      return [`Simplify $\\frac{${n}}{${d}}$`, `$\\frac{${n/g}}{${d/g}}$`];
    }
    return [`Write $\\frac{${n}}{${d}}$ in simplest form.`, `$\\frac{${n}}{${d}}$`];
  }
  
  // Sheets 36-50: same denominator add/subtract
  if (sheetNumber <= 50) {
    const d = ri(rng, minD, maxD);
    const n1 = ri(rng, 1, Math.max(1, Math.floor(d/2)));
    const n2 = ri(rng, 1, Math.max(1, d - n1 - 1));
    const sum = n1 + n2;
    const g = gcd(sum, d);
    const ans = g === d ? "1" : g > 1 ? `$\\frac{${sum/g}}{${d/g}}$` : `$\\frac{${sum}}{${d}}$`;
    return [`$\\frac{${n1}}{${d}}$ + $\\frac{${n2}}{${d}}$`, ans];
  }
  
  // Sheets 51-65: unlike denominators
  if (sheetNumber <= 65) {
    const d1 = ri(rng, minD, Math.min(maxD, 8));
    const d2 = ri(rng, minD, Math.min(maxD, 8));
    if (d1 === d2) return fractionProblem(rng, p, sheetNumber);
    const n1 = ri(rng, 1, d1 - 1);
    const n2 = ri(rng, 1, d2 - 1);
    const lcm = (d1 * d2) / gcd(d1, d2);
    const sumN = n1 * (lcm/d1) + n2 * (lcm/d2);
    const g = gcd(sumN, lcm);
    const ans = g === lcm ? "1" : `$\\frac{${sumN/g}}{${lcm/g}}$`;
    return [`$\\frac{${n1}}{${d1}}$ + $\\frac{${n2}}{${d2}}$`, ans];
  }
  
  // Sheets 66-80: multiply
  if (sheetNumber <= 80) {
    const d1 = ri(rng, minD, maxD);
    const d2 = ri(rng, minD, maxD);
    const n1 = ri(rng, 1, d1 - 1);
    const n2 = ri(rng, 1, d2 - 1);
    const resN = n1 * n2, resD = d1 * d2;
    const g = gcd(resN, resD);
    const ans = g === resD ? "1" : `$\\frac{${resN/g}}{${resD/g}}$`;
    return [`$\\frac{${n1}}{${d1}}$ x $\\frac{${n2}}{${d2}}$`, ans];
  }
  
  // Sheets 81-100: divide
  const d1 = ri(rng, minD, maxD);
  const d2 = ri(rng, minD, maxD);
  const n1 = ri(rng, 1, d1 - 1);
  const n2 = ri(rng, 1, d2 - 1);
  const resN = n1 * d2, resD = d1 * n2;
  const g = gcd(resN, resD);
  const ans = g === resD ? "1" : `$\\frac{${resN/g}}{${resD/g}}$`;
  return [`$\\frac{${n1}}{${d1}}$ / $\\frac{${n2}}{${d2}}$`, ans];
}

function decimalProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  if (sheetNumber <= 15) {
    const n = ri(rng, 1, 9);
    const d = ri(rng, 1, 9);
    return [`In ${n}.${d}, what digit is in the tenths place?`, String(d)];
  }
  if (sheetNumber <= 30) {
    const n = ri(rng, 1, 9);
    const d1 = ri(rng, 0, 9);
    const d2 = ri(rng, 1, 9);
    const t = rng() > 0.5 ? "tenths" : "hundredths";
    const ans = t === "tenths" ? String(d1) : String(d2);
    return [`In ${n}.${d1}${d2}, what digit is in the ${t} place?`, ans];
  }
  if (sheetNumber <= 50) {
    const a = parseFloat((ri(rng, 1, 99) / 10).toFixed(1));
    const b = parseFloat((ri(rng, 1, 99) / 10).toFixed(1));
    return [`${a} + ${b}`, String(parseFloat((a + b).toFixed(2)))];
  }
  if (sheetNumber <= 70) {
    const a = parseFloat((ri(rng, 1, 9) / 10).toFixed(1));
    const b = ri(rng, 2, 9);
    return [`${a} x ${b}`, String(parseFloat((a * b).toFixed(2)))];
  }
  if (sheetNumber <= 85) {
    const divisor = ri(rng, 2, 5);
    const answer = parseFloat((ri(rng, 1, 9) / 10).toFixed(1));
    const dividend = parseFloat((answer * divisor).toFixed(1));
    return [`${dividend} / ${divisor}`, String(answer)];
  }
  const bases = [10, 20, 25, 50, 100];
  const pcts = [10, 15, 20, 25, 50];
  const base = bases[Math.floor(rng() * bases.length)];
  const pct = pcts[Math.floor(rng() * pcts.length)];
  return [`What is ${pct}% of ${base}?`, String((base * pct) / 100)];
}

function preAlgebraProblem(rng: () => number, p: DifficultyParams, sheetNumber: number): [string, string] {
  const maxC = p.maxCoefficient ?? 3;
  const maxK = p.maxConstant ?? 10;
  const maxAns = p.maxAnswer ?? 15;
  
  const x = ri(rng, 1, maxAns);
  
  if (sheetNumber <= 20) {
    const a = ri(rng, 1, maxK);
    const t = Math.floor(rng() * 2);
    if (t === 0) return [`x + ${a} = ${x + a}`, String(x)];
    return [`x - ${a} = ${Math.max(1, x - a)}`, String(x)];
  }
  if (sheetNumber <= 40) {
    const a = ri(rng, 2, Math.max(2, maxC));
    return [`${a}x = ${a * x}`, String(x)];
  }
  if (sheetNumber <= 65) {
    const a = ri(rng, 2, Math.max(2, maxC));
    const b = ri(rng, 1, maxK);
    const t = Math.floor(rng() * 2);
    if (t === 0) return [`${a}x + ${b} = ${a * x + b}`, String(x)];
    return [`${a}x - ${b} = ${a * x - b}`, String(x)];
  }
  if (sheetNumber <= 85) {
    const a = ri(rng, 2, maxC);
    const limit = ri(rng, a * x + 1, a * x + 5);
    return [`${a}x < ${limit}. Largest integer x?`, String(x)];
  }
  // Word problems
  const items: [string, string][] = [
    [`A has 3 times as many as B. Together they have ${4 * x}. How many does A have?`, String(3 * x)],
    [`A number doubled plus ${ri(rng,1,8)} equals ${2*x + ri(rng,1,8)}. The number?`, String(x)],
    [`Two consecutive integers sum to ${2*x+1}. The smaller?`, String(x)],
  ];
  return items[Math.floor(rng() * items.length)];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateProgressiveSheet(
  skill: ShopSkill,
  sheetNumber: number,
  problemCount: number
): { problems: Problem[]; answerKey: { id: string; answer: string }[] } {
  const difficulty = getDifficultyForSheet(skill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}`);
  
  // Generate problems with slight internal progression within the sheet
  // First 10%: slightly below sheet difficulty (warm up)
  // Middle 70%: at sheet difficulty
  // Final 20%: slightly above sheet difficulty (challenge)
  const problems: Problem[] = [];
  const answerKey: { id: string; answer: string }[] = [];
  
  for (let i = 0; i < problemCount; i++) {
    const intraProgress = i / (problemCount - 1); // 0.0 to 1.0 within sheet
    
    // Adjust bounds slightly for intra-sheet progression
    const adjustedDifficulty = { ...difficulty };
    if (intraProgress < 0.1) {
      // Warm-up: use lower end of range
      if (adjustedDifficulty.maxA) adjustedDifficulty.maxA = Math.max(adjustedDifficulty.minA ?? 1, Math.floor(adjustedDifficulty.maxA * 0.7));
      if (adjustedDifficulty.maxB) adjustedDifficulty.maxB = Math.max(adjustedDifficulty.minB ?? 1, Math.floor(adjustedDifficulty.maxB * 0.7));
    } else if (intraProgress > 0.8) {
      // Challenge: use upper end of range
      if (adjustedDifficulty.minA && adjustedDifficulty.maxA) adjustedDifficulty.minA = Math.floor((adjustedDifficulty.minA + adjustedDifficulty.maxA) / 2);
      if (adjustedDifficulty.minB && adjustedDifficulty.maxB) adjustedDifficulty.minB = Math.floor((adjustedDifficulty.minB + adjustedDifficulty.maxB) / 2);
    }
    
    let question: string, answer: string;
    
    switch (skill) {
      case "ADDITION":       [question, answer] = additionProblem(rng, adjustedDifficulty); break;
      case "SUBTRACTION":    [question, answer] = subtractionProblem(rng, adjustedDifficulty); break;
      case "MULTIPLICATION": [question, answer] = multiplicationProblem(rng, adjustedDifficulty); break;
      case "DIVISION":       [question, answer] = divisionProblem(rng, adjustedDifficulty); break;
      case "FRACTIONS":      [question, answer] = fractionProblem(rng, adjustedDifficulty, sheetNumber); break;
      case "DECIMALS":       [question, answer] = decimalProblem(rng, adjustedDifficulty, sheetNumber); break;
      case "PRE_ALGEBRA":    [question, answer] = preAlgebraProblem(rng, adjustedDifficulty, sheetNumber); break;
      default:               [question, answer] = [`Problem ${i+1}`, "—"]; break;
    }
    
    const id = nanoid(8);
    problems.push({ id, type: "arithmetic" as const, question, answer, points: 1 });
    answerKey.push({ id, answer });
  }
  
  return { problems, answerKey };
}
