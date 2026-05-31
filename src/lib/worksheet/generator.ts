// src/lib/worksheet/generator.ts
// Core worksheet generation engine — produces Problem[] for any subject/skill
// Covers all 50+ skills across Math M1-M18, Reading R1-R9, Writing W1-W8, Science S1-S7

import { nanoid } from "nanoid";
import type { Problem, GeneratedWorksheet, AnswerKeyEntry } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratorConfig {
  subjectSlug: string;
  levelCode: string;
  skillName: string;
  problemCount: number;
  timeLimitMinutes: number;
  difficulty?: number;
  sheetNumber?: number;
  totalSheets?: number;
}

export function generateProblems(config: GeneratorConfig): {
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
} {
  const { subjectSlug, skillName, problemCount, difficulty = 1.0 } = config;

  let problems: Problem[] = [];

  switch (subjectSlug) {
    case "MATH":
      problems = generateMathProblems(skillName, problemCount, difficulty);
      break;
    case "READING":
      problems = generateReadingProblems(skillName, problemCount);
      break;
    case "WRITING":
      problems = generateWritingProblems(skillName, problemCount);
      break;
    case "SCIENCE":
      problems = generateScienceProblems(skillName, problemCount);
      break;
    default:
      problems = generateMathProblems(skillName, problemCount, difficulty);
  }

  const shuffled = shuffleArray(problems).slice(0, problemCount);

  const answerKey: AnswerKeyEntry[] = shuffled.map((p) => ({
    id: p.id,
    answer: p.answer,
    explanation: p.explanation,
  }));

  return { problems: shuffled, answerKey };
}

// ─────────────────────────────────────────────────────────────────────────────
// MATH GENERATOR — all 18 levels
// ─────────────────────────────────────────────────────────────────────────────

function generateMathProblems(skillName: string, count: number, difficulty: number): Problem[] {
  const skill = skillName.toLowerCase();

  // M1 — Early Counting
  if (skill.includes("counting 1") || skill.includes("number recognition") || skill.includes("counting to 100")) {
    return generateCounting(count);
  }
  // M2 — Number Sense
  if (skill.includes("more/less") || skill.includes("more less")) return generateMoreLess(count);
  if (skill.includes("number pattern")) return generateNumberPatterns(count);
  // M3 — Addition
  if (skill.includes("number bond")) return generateNumberBonds(count);
  if (skill.includes("addition within 5")) return generateAddition(count, 5);
  if (skill.includes("addition within 10")) return generateAddition(count, 10);
  if (skill.includes("addition within 20")) return generateAddition(count, 20);
  if (skill.includes("2-digit addition") || skill.includes("2 digit addition")) return generateAddition(count, 99);
  if (skill.includes("addition")) return generateAddition(count, difficulty >= 1.5 ? 999 : 99);
  // M4 — Subtraction
  if (skill.includes("missing number")) return generateMissingNumbers(count);
  if (skill.includes("subtraction within 20")) return generateSubtraction(count, 20);
  if (skill.includes("subtraction")) return generateSubtraction(count, difficulty >= 1.5 ? 999 : 99);
  // M5 — Multiplication
  if (skill.includes("×2") && skill.includes("×5")) return generateMultiplication(count, [2, 3, 4, 5]);
  if (skill.includes("×2–×5") || skill.includes("×2-×5") || skill.includes("x2") && skill.includes("x5")) return generateMultiplication(count, [2, 3, 4, 5]);
  if (skill.includes("×6") || skill.includes("×7") || skill.includes("×8")) return generateMultiplication(count, [6, 7, 8]);
  if (skill.includes("×9") || skill.includes("x9")) return generateMultiplication(count, [9]);
  if (skill.includes("×10") || skill.includes("×11") || skill.includes("×12")) return generateMultiplication(count, [10, 11, 12]);
  if (skill.includes("mixed") && (skill.includes("×") || skill.includes("x") || skill.includes("multiplicat"))) return generateMultiplication(count, [6, 7, 8, 9]);
  if (skill.includes("multiplicat")) return generateMultiplication(count, [2, 3, 4, 5, 6, 7, 8, 9]);
  // M6 — Division
  if (skill.includes("division by 6") || skill.includes("division by 7") || skill.includes("division by 8")) return generateDivision(count, [6, 7, 8]);
  if (skill.includes("division by 9")) return generateDivision(count, [9]);
  if (skill.includes("mixed division")) return generateDivision(count, [6, 7, 8, 9]);
  if (skill.includes("division with remainder")) return generateDivisionWithRemainders(count);
  if (skill.includes("division")) return generateDivision(count, [2, 3, 4, 5, 6, 7, 8, 9]);
  // M7 — Fractions
  if (skill.includes("identifying fraction")) return generateFractionIdentification(count);
  if (skill.includes("simplifying fraction")) return generateFractionSimplification(count);
  if (skill.includes("adding fraction")) return generateFractionAddition(count);
  if (skill.includes("comparing fraction")) return generateFractionComparison(count);
  if (skill.includes("fraction")) return generateFractionIdentification(count);
  // M8 — Decimals & Percentages
  if (skill.includes("decimal place value")) return generateDecimalPlaceValue(count);
  if (skill.includes("decimal operation")) return generateDecimalOperations(count);
  if (skill.includes("decimal")) return generateDecimalOperations(count);
  if (skill.includes("percentage") || skill.includes("percent")) return generatePercentages(count);
  // M9 — Ratios & Proportions
  if (skill.includes("ratio")) return generateRatios(count);
  if (skill.includes("proportion")) return generateProportions(count);
  if (skill.includes("unit rate")) return generateUnitRates(count);
  // M10 — Pre-Algebra
  if (skill.includes("one-step") || skill.includes("one step")) return generateOneStepEquations(count);
  if (skill.includes("two-step") || skill.includes("two step")) return generateTwoStepEquations(count);
  if (skill.includes("inequalit")) return generateInequalities(count);
  if (skill.includes("word problem")) return generateWordProblems(count);
  // M11 — Linear Equations
  if (skill.includes("slope") || skill.includes("intercept")) return generateSlopeIntercept(count);
  if (skill.includes("graphing line")) return generateGraphingLines(count);
  if (skill.includes("system")) return generateSystemsOfEquations(count);
  // M12 — Polynomials
  if (skill.includes("adding polynomial")) return generateAddingPolynomials(count);
  if (skill.includes("multiplying polynomial")) return generateMultiplyingPolynomials(count);
  if (skill.includes("factor")) return generateFactoring(count);
  if (skill.includes("polynomial")) return generateAddingPolynomials(count);
  // M13 — Quadratics
  if (skill.includes("quadratic equation")) return generateQuadraticEquations(count);
  if (skill.includes("quadratic formula")) return generateQuadraticFormula(count);
  if (skill.includes("graphing parabola") || skill.includes("parabola")) return generateGraphingParabolas(count);
  if (skill.includes("quadratic")) return generateQuadraticEquations(count);
  // M14 — Functions
  if (skill.includes("function notation")) return generateFunctionNotation(count);
  if (skill.includes("domain") || skill.includes("range")) return generateDomainRange(count);
  if (skill.includes("inverse function")) return generateInverseFunctions(count);
  if (skill.includes("function")) return generateFunctionNotation(count);
  // M15 — Trigonometry
  if (skill.includes("right triangle trig") || skill.includes("right triangle")) return generateRightTriangleTrig(count);
  if (skill.includes("unit circle")) return generateUnitCircle(count);
  if (skill.includes("trig identit")) return generateTrigIdentities(count);
  if (skill.includes("trig")) return generateRightTriangleTrig(count);
  // M16 — Algebra II
  if (skill.includes("logarithm")) return generateLogarithms(count);
  if (skill.includes("exponential function") || skill.includes("exponential")) return generateExponentialFunctions(count);
  if (skill.includes("complex number")) return generateComplexNumbers(count);
  // M17 — Pre-Calculus
  if (skill.includes("limit")) return generateLimits(count);
  if (skill.includes("sequence") || skill.includes("series")) return generateSequencesAndSeries(count);
  if (skill.includes("vector")) return generateVectors(count);
  // M18 — Calculus
  if (skill.includes("derivative")) return generateDerivatives(count);
  if (skill.includes("integral")) return generateIntegrals(count);
  if (skill.includes("application")) return generateCalculusApplications(count);

  // Fallback — generate basic arithmetic appropriate to level
  return generateAddition(count, 99);
}

// ─── M1: Counting ───
function generateCounting(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let n = 1; n <= 99; n++) {
    problems.push({ id: nanoid(8), type: "fill_blank", question: `What number comes after ${n}?`, answer: n + 1, points: 1 });
    if (n > 1) problems.push({ id: nanoid(8), type: "fill_blank", question: `What number comes before ${n}?`, answer: n - 1, points: 1 });
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M2: More/Less ───
function generateMoreLess(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 4; i++) {
    const a = rand(1, 100);
    const b = rand(1, 100);
    if (a !== b) {
      problems.push({
        id: nanoid(8), type: "multiple_choice",
        question: `Which number is greater: ${a} or ${b}?`,
        options: [`${a}`, `${b}`, "They are equal", "Cannot tell"],
        answer: a > b ? `${a}` : `${b}`,
        points: 1,
      });
    }
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── M2: Number Patterns ───
function generateNumberPatterns(count: number): Problem[] {
  const problems: Problem[] = [];
  const steps = [2, 3, 4, 5, 10];
  for (const step of steps) {
    for (let start = 1; start <= 20; start += 3) {
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      problems.push({
        id: nanoid(8), type: "fill_blank",
        question: `What comes next: ${seq[0]}, ${seq[1]}, ${seq[2]}, ___?`,
        answer: seq[3], points: 1,
        explanation: `The pattern increases by ${step} each time.`,
      });
    }
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M3: Number Bonds ───
function generateNumberBonds(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let total = 5; total <= 20; total++) {
    for (let a = 1; a < total; a++) {
      const b = total - a;
      problems.push({
        id: nanoid(8), type: "fill_blank",
        question: `${a} + ___ = ${total}`,
        answer: b, points: 1,
      });
    }
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M4: Missing Numbers ───
function generateMissingNumbers(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 4; i++) {
    const a = rand(1, 50);
    const b = rand(1, 50);
    const sum = a + b;
    const variant = rand(0, 2);
    if (variant === 0) {
      problems.push({ id: nanoid(8), type: "fill_blank", question: `___ + ${b} = ${sum}`, answer: a, points: 1 });
    } else if (variant === 1) {
      problems.push({ id: nanoid(8), type: "fill_blank", question: `${a} + ___ = ${sum}`, answer: b, points: 1 });
    } else {
      problems.push({ id: nanoid(8), type: "fill_blank", question: `${sum} − ${b} = ___`, answer: a, points: 1 });
    }
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── Addition ───
function generateAddition(count: number, max: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const a = rand(1, max);
    const b = rand(1, max);
    problems.push({ id: nanoid(8), type: "arithmetic", question: `${a} + ${b} =`, answer: a + b, points: 1 });
  }
  return problems;
}

// ─── Subtraction ───
function generateSubtraction(count: number, max: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 4; i++) {
    const b = rand(1, max - 1);
    const a = rand(b, max);
    problems.push({ id: nanoid(8), type: "arithmetic", question: `${a} − ${b} =`, answer: a - b, points: 1 });
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── Multiplication ───
function generateMultiplication(count: number, multipliers: number[]): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const m = multipliers[rand(0, multipliers.length - 1)];
    const n = rand(1, 12);
    problems.push({ id: nanoid(8), type: "arithmetic", question: `${m} x ${n} =`, answer: m * n, points: 1 });
  }
  return problems;
}

// ─── Division ───
function generateDivision(count: number, divisors: number[]): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count; i++) {
    const d = divisors[rand(0, divisors.length - 1)];
    const q = rand(1, 12);
    const dividend = d * q;
    problems.push({ id: nanoid(8), type: "arithmetic", question: `${dividend} / ${d} =`, answer: q, points: 1 });
  }
  return problems;
}

// ─── Division with Remainders ───
function generateDivisionWithRemainders(count: number): Problem[] {
  const problems: Problem[] = [];
  const divisors = [3, 4, 5, 6, 7];
  for (let i = 0; i < count * 4; i++) {
    const d = divisors[rand(0, divisors.length - 1)];
    const q = rand(2, 12);
    const r = rand(1, d - 1);
    const dividend = d * q + r;
    problems.push({ id: nanoid(8), type: "arithmetic", question: `${dividend} ÷ ${d} = ___ R ___`, answer: `${q} R ${r}`, points: 1 });
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── Fraction Identification ───
function generateFractionIdentification(count: number): Problem[] {
  const items = [
    { q: "A pizza has 8 slices. Maria eats 3. What fraction did she eat?", a: "3/8" },
    { q: "There are 12 students. 5 are girls. What fraction are boys?", a: "7/12" },
    { q: "A jug holds 1 litre. 250 ml is poured out. What fraction remains?", a: "3/4" },
    { q: "A day has 24 hours. What fraction of the day is 6 hours?", a: "1/4" },
    { q: "Shade 2/5 of a shape with 10 equal parts. How many parts are shaded?", a: "4" },
    { q: "What fraction of 20 is 5?", a: "1/4" },
    { q: "Write 4/8 in its simplest form.", a: "1/2" },
    { q: "Which fraction is larger: 2/3 or 3/5?", a: "2/3" },
    { q: "1/4 + 2/4 = ?", a: "3/4" },
    { q: "A bag has 6 red and 4 blue marbles. What fraction are red?", a: "3/5" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── Fraction Simplification ───
function generateFractionSimplification(count: number): Problem[] {
  const fractions: [number, number][] = [[2,4],[3,6],[4,8],[6,9],[4,6],[6,10],[8,12],[9,12],[10,15],[6,8],[15,20],[12,16],[4,10],[6,14],[10,12]];
  return shuffleArray(fractions).slice(0, count).map(([n, d]) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(n, d);
    return { id: nanoid(8), type: "arithmetic" as const, question: `Simplify ${n}/${d}`, answer: `${n/g}/${d/g}`, points: 1 };
  });
}

// ─── Fraction Addition ───
function generateFractionAddition(count: number): Problem[] {
  const pairs: [string, string, string][] = [
    ["1/4","2/4","3/4"],["1/3","1/3","2/3"],["2/5","1/5","3/5"],["1/6","3/6","4/6"],["3/8","1/8","1/2"],["1/2","1/4","3/4"],["1/3","1/6","1/2"],["2/3","1/6","5/6"],["3/4","1/8","7/8"],["1/2","1/3","5/6"],
  ];
  return shuffleArray(pairs).slice(0, count).map(([a, b, ans]) => ({ id: nanoid(8), type: "arithmetic" as const, question: `${a} + ${b} =`, answer: ans, points: 1 }));
}

// ─── Fraction Comparison ───
function generateFractionComparison(count: number): Problem[] {
  const pairs: [string, string, string][] = [["1/2","1/3","1/2"],["2/3","3/5","2/3"],["3/4","5/8","3/4"],["4/5","7/10","4/5"],["2/3","3/4","3/4"],["1/4","1/3","1/3"],["5/6","7/8","7/8"],["3/8","2/5","2/5"]];
  return shuffleArray(pairs).slice(0, count).map(([a, b, larger]) => ({ id: nanoid(8), type: "multiple_choice" as const, question: `Which fraction is larger: ${a} or ${b}?`, options: [a, b, "They are equal", "Cannot tell"], answer: larger, points: 1 }));
}

// ─── M8: Decimal Place Value ───
function generateDecimalPlaceValue(count: number): Problem[] {
  const problems: Problem[] = [];
  const numbers = [3.5, 12.4, 0.75, 1.25, 4.08, 10.3, 0.6, 7.15, 25.9, 3.14, 100.05, 0.001];
  for (const n of numbers) {
    const str = n.toString();
    const parts = str.split(".");
    const intPart = parts[0];
    const decPart = parts[1] ?? "0";
    problems.push({ id: nanoid(8), type: "short_answer", question: `In ${n}, what digit is in the tenths place?`, answer: decPart[0] ?? "0", points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `Write ${n} in words (decimal part only).`, answer: `${decPart} ${decPart.length === 1 ? "tenths" : "hundredths"}`, points: 1 });
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M8: Decimal Operations ───
function generateDecimalOperations(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 4; i++) {
    const a = parseFloat((rand(1, 99) / 10).toFixed(1));
    const b = parseFloat((rand(1, 99) / 10).toFixed(1));
    const op = rand(0, 2);
    if (op === 0) problems.push({ id: nanoid(8), type: "arithmetic", question: `${a} + ${b} =`, answer: parseFloat((a + b).toFixed(2)), points: 1 });
    else if (op === 1 && a >= b) problems.push({ id: nanoid(8), type: "arithmetic", question: `${a} − ${b} =`, answer: parseFloat((a - b).toFixed(2)), points: 1 });
    else problems.push({ id: nanoid(8), type: "arithmetic", question: `${a} × 10 =`, answer: a * 10, points: 1 });
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── M8: Percentages ───
function generatePercentages(count: number): Problem[] {
  const problems: Problem[] = [];
  const bases = [10, 20, 25, 50, 80, 100, 200, 400, 500];
  const pcts = [10, 15, 20, 25, 50, 75];
  for (const base of bases) {
    for (const pct of pcts) {
      problems.push({ id: nanoid(8), type: "arithmetic", question: `What is ${pct}% of ${base}?`, answer: (base * pct) / 100, points: 1 });
    }
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M9: Ratios ───
function generateRatios(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 3; i++) {
    const a = rand(1, 10);
    const b = rand(1, 10);
    const mult = rand(2, 5);
    problems.push({ id: nanoid(8), type: "fill_blank", question: `${a}:${b} = ${a * mult}:___`, answer: b * mult, points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `Simplify the ratio ${a * mult}:${b * mult}`, answer: `${a}:${b}`, points: 1 });
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── M9: Proportions ───
function generateProportions(count: number): Problem[] {
  const problems: Problem[] = [];
  const scenarios = [
    { q: "If 4 apples cost $2, how much do 12 apples cost?", a: "$6", explanation: "4:$2 = 12:$6" },
    { q: "A car travels 60 km in 1 hour. How far does it travel in 3 hours?", a: "180 km" },
    { q: "If 5 workers finish a job in 10 days, how many days for 10 workers?", a: "5 days" },
    { q: "A recipe needs 2 cups of flour for 12 cookies. How much flour for 36 cookies?", a: "6 cups" },
    { q: "A map has scale 1:50,000. If two cities are 3 cm apart on the map, what is the real distance?", a: "1.5 km" },
    { q: "If 3 pens cost $1.50, how much do 9 pens cost?", a: "$4.50" },
    { q: "A train travels 150 km in 2 hours. How long to travel 375 km at the same speed?", a: "5 hours" },
    { q: "If x/4 = 3/12, what is x?", a: "1" },
    { q: "Solve the proportion: 5/8 = x/40", a: "25" },
    { q: "A tank fills in 6 hours. What fraction is filled in 2 hours?", a: "1/3" },
  ];
  return shuffleArray(scenarios).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M9: Unit Rates ───
function generateUnitRates(count: number): Problem[] {
  const scenarios = [
    { q: "A car travels 240 km in 4 hours. What is the speed in km/h?", a: "60 km/h" },
    { q: "12 apples cost $3. What is the cost per apple?", a: "$0.25" },
    { q: "A factory produces 500 items in 5 hours. How many items per hour?", a: "100 items/hour" },
    { q: "A runner covers 5 km in 25 minutes. What is the rate in km per minute?", a: "0.2 km/min" },
    { q: "A store sells 3 books for $12. What is the cost per book?", a: "$4" },
    { q: "A printer prints 60 pages in 5 minutes. How many pages per minute?", a: "12 pages/min" },
    { q: "A cyclist rides 90 km in 3 hours. What is the unit rate?", a: "30 km/h" },
    { q: "5 kg of rice costs $8. What is the price per kg?", a: "$1.60/kg" },
    { q: "A tap fills 24 litres in 8 minutes. What is the flow rate per minute?", a: "3 litres/min" },
    { q: "A student reads 120 pages in 4 days. How many pages per day?", a: "30 pages/day" },
  ];
  return shuffleArray(scenarios).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M10: One-Step Equations ───
function generateOneStepEquations(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let x = 2; x <= 20; x++) {
    for (let a = 2; a <= 15; a++) {
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: x + ${a} = ${x + a}`, answer: x, points: 1, explanation: `x = ${x + a} − ${a} = ${x}` });
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: x − ${a} = ${x - a > 0 ? x - a : 1}`, answer: x - a > 0 ? x : a + 1, points: 1 });
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: ${a}x = ${a * x}`, answer: x, points: 1, explanation: `x = ${a * x} ÷ ${a} = ${x}` });
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M10: Two-Step Equations ───
function generateTwoStepEquations(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let x = 2; x <= 15; x++) {
    for (const [a, b] of [[2,3],[3,4],[4,5],[2,7],[5,3],[3,2],[4,1],[6,5]]) {
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: ${a}x + ${b} = ${a*x+b}`, answer: x, points: 1, explanation: `${a}x = ${a*x+b} − ${b} = ${a*x}, so x = ${x}` });
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: ${a}x − ${b} = ${a*x-b}`, answer: x, points: 1 });
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M10: Inequalities ───
function generateInequalities(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 3; i++) {
    const a = rand(2, 10);
    const b = rand(5, 30);
    const x = Math.ceil(b / a);
    problems.push({ id: nanoid(8), type: "short_answer", question: `Solve: ${a}x < ${a * x + rand(1,5)}. What is the largest integer x?`, answer: `${x}`, points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `Solve: x + ${a} > ${b}. What is the smallest integer x?`, answer: `${b - a + 1}`, points: 1 });
    problems.push({ id: nanoid(8), type: "multiple_choice", question: `Which value satisfies ${a}x ≤ ${a * x}?`, options: [`${x-1}`, `${x}`, `${x+1}`, `${x+2}`], answer: `${x}`, points: 1 });
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M10: Word Problems ───
function generateWordProblems(count: number): Problem[] {
  const scenarios = [
    { q: "Sam has 45 stickers. He gives 12 to his friend. How many does he have left?", a: "33" },
    { q: "A box has 8 rows of 9 chocolates. How many chocolates in total?", a: "72" },
    { q: "A train travels at 80 km/h. How far does it travel in 2.5 hours?", a: "200 km" },
    { q: "There are 24 students in a class. 3/8 of them are boys. How many boys are there?", a: "9" },
    { q: "A shirt costs $35 and is on sale for 20% off. What is the sale price?", a: "$28" },
    { q: "Maria earns $15 per hour. She works 8 hours. How much does she earn?", a: "$120" },
    { q: "A rectangle has a perimeter of 36 cm and width of 7 cm. What is its length?", a: "11 cm" },
    { q: "If a dozen eggs costs $3.60, how much does one egg cost?", a: "$0.30" },
    { q: "John reads 25 pages per day. How many days to finish a 300-page book?", a: "12 days" },
    { q: "A tank holds 200 litres. It is 3/4 full. How many litres are in the tank?", a: "150 litres" },
  ];
  return shuffleArray(scenarios).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M11: Slope and Intercept ───
function generateSlopeIntercept(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let m = -5; m <= 5; m++) {
    if (m === 0) continue;
    for (let b = -5; b <= 5; b++) {
      problems.push({ id: nanoid(8), type: "short_answer", question: `What is the slope of y = ${m}x + ${b}?`, answer: `${m}`, points: 1, explanation: `In y = mx + b, m is the slope.` });
      problems.push({ id: nanoid(8), type: "short_answer", question: `What is the y-intercept of y = ${m}x + ${b}?`, answer: `${b}`, points: 1 });
      problems.push({ id: nanoid(8), type: "short_answer", question: `For y = ${m}x + ${b}, what is y when x = 2?`, answer: `${m * 2 + b}`, points: 1 });
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M11: Graphing Lines ───
function generateGraphingLines(count: number): Problem[] {
  const items = [
    { q: "Which equation represents a horizontal line?", a: "y = 5", opts: ["y = 5", "x = 5", "y = x", "y = 2x"] },
    { q: "Which equation represents a vertical line?", a: "x = 3", opts: ["y = 3", "x = 3", "y = x + 3", "y = 3x"] },
    { q: "What is the slope of a horizontal line?", a: "0", opts: ["0", "1", "undefined", "-1"] },
    { q: "What is the slope of a vertical line?", a: "undefined", opts: ["0", "1", "undefined", "-1"] },
    { q: "Two lines are parallel if they have:", a: "The same slope", opts: ["The same slope", "The same y-intercept", "The same x-intercept", "No points in common"] },
    { q: "Two lines are perpendicular if their slopes are:", a: "Negative reciprocals", opts: ["Equal", "Opposite", "Negative reciprocals", "Both zero"] },
    { q: "Find the x-intercept of y = 2x − 6.", a: "3", opts: ["3", "6", "-3", "-6"] },
    { q: "What does the x-intercept represent on a graph?", a: "Where the line crosses the x-axis (y=0)", opts: ["Where y=1", "Where x=1", "Where the line crosses the x-axis (y=0)", "The slope"] },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: "multiple_choice" as const, question: item.q, options: item.opts, answer: item.a, points: 1 }));
}

// ─── M11: Systems of Equations ───
function generateSystemsOfEquations(count: number): Problem[] {
  const problems: Problem[] = [];
  // Generate systems with nice integer solutions
  for (let x = 1; x <= 8; x++) {
    for (let y = 1; y <= 8; y++) {
      const a1 = rand(1, 3), b1 = rand(1, 3);
      const a2 = rand(1, 3), b2 = rand(1, 3);
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      if (a1 !== a2 || b1 !== b2) {
        problems.push({
          id: nanoid(8), type: "short_answer",
          question: `Solve the system:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}\nWhat is x?`,
          answer: `${x}`, points: 1,
        });
      }
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M12: Adding Polynomials ───
function generateAddingPolynomials(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let i = 0; i < count * 3; i++) {
    const a = rand(1, 6), b = rand(-5, 5), c = rand(1, 6), d = rand(-5, 5);
    const sumCoeff = a + c;
    const sumConst = b + d;
    const bSign = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
    const dSign = d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`;
    const ansConst = sumConst >= 0 ? `+ ${sumConst}` : `− ${Math.abs(sumConst)}`;
    problems.push({
      id: nanoid(8), type: "short_answer",
      question: `Add: (${a}x ${bSign}) + (${c}x ${dSign})`,
      answer: `${sumCoeff}x ${ansConst}`, points: 1,
    });
  }
  return deduplicateProblems(problems).slice(0, count);
}

// ─── M12: Multiplying Polynomials ───
function generateMultiplyingPolynomials(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let a = 1; a <= 5; a++) {
    for (let b = -5; b <= 5; b++) {
      for (let c = 1; c <= 5; c++) {
        for (let d = -5; d <= 5; d++) {
          if (b === 0 || d === 0) continue;
          // (ax + b)(cx + d) = acx² + (ad+bc)x + bd
          const coeff2 = a * c;
          const coeff1 = a * d + b * c;
          const coeff0 = b * d;
          const bSign = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
          const dSign = d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`;
          const c1Sign = coeff1 >= 0 ? `+ ${coeff1}` : `− ${Math.abs(coeff1)}`;
          const c0Sign = coeff0 >= 0 ? `+ ${coeff0}` : `− ${Math.abs(coeff0)}`;
          problems.push({
            id: nanoid(8), type: "short_answer",
            question: `Expand: (${a}x ${bSign})(${c}x ${dSign})`,
            answer: `${coeff2}x² ${c1Sign}x ${c0Sign}`, points: 1,
          });
          if (problems.length > count * 5) break;
        }
        if (problems.length > count * 5) break;
      }
      if (problems.length > count * 5) break;
    }
    if (problems.length > count * 5) break;
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M12: Factoring ───
function generateFactoring(count: number): Problem[] {
  const problems: Problem[] = [];
  // Difference of squares: x² - a² = (x+a)(x-a)
  for (let a = 1; a <= 10; a++) {
    problems.push({
      id: nanoid(8), type: "short_answer",
      question: `Factor: x² − ${a * a}`,
      answer: `(x + ${a})(x − ${a})`, points: 1,
      explanation: `Difference of squares: a² − b² = (a+b)(a−b)`,
    });
  }
  // Simple trinomials: x² + (a+b)x + ab = (x+a)(x+b)
  for (let a = 1; a <= 8; a++) {
    for (let b = 1; b <= 8; b++) {
      const sum = a + b;
      const product = a * b;
      problems.push({
        id: nanoid(8), type: "short_answer",
        question: `Factor: x² + ${sum}x + ${product}`,
        answer: `(x + ${a})(x + ${b})`, points: 1,
      });
    }
  }
  // GCF factoring
  for (let gcf = 2; gcf <= 5; gcf++) {
    for (let a = 2; a <= 8; a++) {
      for (let b = 1; b <= 8; b++) {
        problems.push({
          id: nanoid(8), type: "short_answer",
          question: `Factor out the GCF: ${gcf * a}x + ${gcf * b}`,
          answer: `${gcf}(${a}x + ${b})`, points: 1,
        });
      }
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M13: Quadratic Equations ───
function generateQuadraticEquations(count: number): Problem[] {
  const problems: Problem[] = [];
  // x² + (a+b)x + ab = 0 → x = -a or x = -b
  for (let a = 1; a <= 8; a++) {
    for (let b = 1; b <= 8; b++) {
      const sum = a + b;
      const product = a * b;
      problems.push({
        id: nanoid(8), type: "short_answer",
        question: `Solve by factoring: x² − ${sum}x + ${product} = 0`,
        answer: `x = ${a} or x = ${b}`, points: 1,
        explanation: `Factor: (x − ${a})(x − ${b}) = 0`,
      });
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M13: Quadratic Formula ───
function generateQuadraticFormula(count: number): Problem[] {
  const items = [
    { q: "Use the quadratic formula to solve: x² + 4x + 4 = 0", a: "x = −2 (double root)", explanation: "Discriminant = 0" },
    { q: "Use the quadratic formula to solve: x² − 5x + 6 = 0", a: "x = 2 or x = 3" },
    { q: "Use the quadratic formula to solve: 2x² + 3x − 2 = 0", a: "x = 1/2 or x = −2" },
    { q: "What is the discriminant of x² + 2x + 1 = 0?", a: "0", explanation: "b² − 4ac = 4 − 4 = 0" },
    { q: "What is the discriminant of x² − 4x + 3 = 0?", a: "4" },
    { q: "How many real solutions does x² + x + 1 = 0 have?", a: "None (discriminant < 0)" },
    { q: "Write the quadratic formula.", a: "x = (−b ± √(b²−4ac)) / 2a" },
    { q: "If the discriminant > 0, how many real solutions are there?", a: "Two distinct real solutions" },
    { q: "If the discriminant = 0, how many real solutions are there?", a: "One real solution (double root)" },
    { q: "Solve using the quadratic formula: x² − 6x + 9 = 0", a: "x = 3" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, explanation: s.explanation, points: 1 }));
}

// ─── M13: Graphing Parabolas ───
function generateGraphingParabolas(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let a = -3; a <= 3; a++) {
    if (a === 0) continue;
    for (let h = -4; h <= 4; h++) {
      for (let k = -4; k <= 4; k++) {
        // y = a(x−h)² + k, vertex at (h,k)
        const label = `y = ${a}(x${h >= 0 ? `−${h}` : `+${Math.abs(h)}`})² ${k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`}`;
        problems.push({ id: nanoid(8), type: "short_answer", question: `What is the vertex of ${label}?`, answer: `(${h}, ${k})`, points: 1 });
        problems.push({ id: nanoid(8), type: "multiple_choice", question: `Does the parabola ${label} open upward or downward?`, options: ["Upward", "Downward"], answer: a > 0 ? "Upward" : "Downward", points: 1 });
        if (problems.length > count * 5) break;
      }
      if (problems.length > count * 5) break;
    }
    if (problems.length > count * 5) break;
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M14: Function Notation ───
function generateFunctionNotation(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let m = 1; m <= 5; m++) {
    for (let b = -5; b <= 5; b++) {
      for (let x = -3; x <= 5; x++) {
        problems.push({
          id: nanoid(8), type: "arithmetic",
          question: `If f(x) = ${m}x ${b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`}, find f(${x}).`,
          answer: m * x + b, points: 1,
        });
      }
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M14: Domain and Range ───
function generateDomainRange(count: number): Problem[] {
  const items = [
    { q: "What is the domain of f(x) = 1/x?", a: "All real numbers except x = 0" },
    { q: "What is the domain of f(x) = √x?", a: "x ≥ 0" },
    { q: "What is the range of f(x) = x²?", a: "y ≥ 0" },
    { q: "What is the domain of f(x) = log(x)?", a: "x > 0" },
    { q: "What is the range of f(x) = |x|?", a: "y ≥ 0" },
    { q: "What is the domain of f(x) = 1/(x−3)?", a: "All real numbers except x = 3" },
    { q: "What is the domain of f(x) = √(x−4)?", a: "x ≥ 4" },
    { q: "For the function f(x) = 2x + 1, what is the range if domain is {1, 2, 3}?", a: "{3, 5, 7}" },
    { q: "What is the range of f(x) = sin(x)?", a: "−1 ≤ y ≤ 1" },
    { q: "What is the domain of a polynomial function like f(x) = x³ − 2x?", a: "All real numbers" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M14: Inverse Functions ───
function generateInverseFunctions(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let m = 1; m <= 8; m++) {
    for (let b = -5; b <= 5; b++) {
      // f(x) = mx + b, f⁻¹(x) = (x − b) / m
      const bStr = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
      problems.push({
        id: nanoid(8), type: "short_answer",
        question: `Find the inverse of f(x) = ${m}x ${bStr}.`,
        answer: b === 0 ? `f⁻¹(x) = x/${m}` : `f⁻¹(x) = (x ${b >= 0 ? `− ${b}` : `+ ${Math.abs(b)}`}) / ${m}`,
        points: 1,
      });
    }
  }
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M15: Right Triangle Trig ───
function generateRightTriangleTrig(count: number): Problem[] {
  // 3-4-5, 5-12-13, 8-15-17, 7-24-25 Pythagorean triples
  const triples = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,40,41],[6,8,10],[10,24,26]];
  const problems: Problem[] = [];
  for (const [opp, adj, hyp] of triples) {
    problems.push({ id: nanoid(8), type: "short_answer", question: `In a right triangle with opposite=${opp} and hypotenuse=${hyp}, what is sin(θ)?`, answer: `${opp}/${hyp}`, points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `In a right triangle with adjacent=${adj} and hypotenuse=${hyp}, what is cos(θ)?`, answer: `${adj}/${hyp}`, points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `In a right triangle with opposite=${opp} and adjacent=${adj}, what is tan(θ)?`, answer: `${opp}/${adj}`, points: 1 });
    problems.push({ id: nanoid(8), type: "short_answer", question: `A right triangle has legs ${opp} and ${adj}. What is the hypotenuse?`, answer: `${hyp}`, points: 1, explanation: `√(${opp}² + ${adj}²) = √${opp*opp+adj*adj} = ${hyp}` });
  }
  return shuffleArray(problems).slice(0, count);
}

// ─── M15: Unit Circle ───
function generateUnitCircle(count: number): Problem[] {
  const items = [
    { q: "What is sin(0°)?", a: "0" }, { q: "What is cos(0°)?", a: "1" },
    { q: "What is sin(30°)?", a: "1/2" }, { q: "What is cos(30°)?", a: "√3/2" },
    { q: "What is sin(45°)?", a: "√2/2" }, { q: "What is cos(45°)?", a: "√2/2" },
    { q: "What is sin(60°)?", a: "√3/2" }, { q: "What is cos(60°)?", a: "1/2" },
    { q: "What is sin(90°)?", a: "1" }, { q: "What is cos(90°)?", a: "0" },
    { q: "What is sin(180°)?", a: "0" }, { q: "What is cos(180°)?", a: "−1" },
    { q: "What is sin(270°)?", a: "−1" }, { q: "What is cos(270°)?", a: "0" },
    { q: "What is sin(360°)?", a: "0" }, { q: "What is cos(360°)?", a: "1" },
    { q: "In which quadrant is sin positive and cos negative?", a: "Quadrant II" },
    { q: "In which quadrant are both sin and cos negative?", a: "Quadrant III" },
    { q: "What is tan(45°)?", a: "1" }, { q: "What is tan(0°)?", a: "0" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M15: Trig Identities ───
function generateTrigIdentities(count: number): Problem[] {
  const items = [
    { q: "Complete the Pythagorean identity: sin²θ + ___ = 1", a: "cos²θ" },
    { q: "Complete: 1 + tan²θ = ___", a: "sec²θ" },
    { q: "Complete: 1 + cot²θ = ___", a: "csc²θ" },
    { q: "What is sin(2θ) in terms of sin θ and cos θ?", a: "2 sin θ cos θ" },
    { q: "What is cos(2θ) in terms of cos θ?", a: "2cos²θ − 1" },
    { q: "Simplify: sin²θ / cos²θ", a: "tan²θ" },
    { q: "Simplify: (1 − cos²θ)", a: "sin²θ" },
    { q: "What is tan θ in terms of sin and cos?", a: "sin θ / cos θ" },
    { q: "What is sec θ in terms of cos θ?", a: "1 / cos θ" },
    { q: "What is csc θ in terms of sin θ?", a: "1 / sin θ" },
    { q: "Verify: sin(A+B) = sinA cosB + cosA sinB. What does this formula expand to if A=B?", a: "sin(2A) = 2 sinA cosA" },
    { q: "Simplify: cos²θ − sin²θ", a: "cos(2θ)" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─── M16: Logarithms ───
function generateLogarithms(count: number): Problem[] {
  const problems: Problem[] = [];
  // log_b(b^n) = n
  for (const base of [2, 3, 5, 10]) {
    for (let exp = 1; exp <= 5; exp++) {
      const val = Math.pow(base, exp);
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Evaluate: log${base === 10 ? "" : `_${base}`}(${val})`, answer: exp, points: 1, explanation: `${base}^${exp} = ${val}` });
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Solve: log_${base}(x) = ${exp}`, answer: val, points: 1 });
    }
  }
  const logRules = [
    { q: "Expand: log(AB)", a: "log A + log B", explanation: "Product rule" },
    { q: "Expand: log(A/B)", a: "log A − log B", explanation: "Quotient rule" },
    { q: "Expand: log(A^n)", a: "n log A", explanation: "Power rule" },
    { q: "Simplify: log₃(9) + log₃(3)", a: "3", explanation: "log₃(27) = 3" },
    { q: "What is log₁₀(1000)?", a: "3" },
    { q: "What is ln(e)?", a: "1", explanation: "Natural log of e = 1" },
    { q: "What is ln(1)?", a: "0" },
    { q: "What is e^(ln 7)?", a: "7" },
  ];
  logRules.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, explanation: r.explanation, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M16: Exponential Functions ───
function generateExponentialFunctions(count: number): Problem[] {
  const problems: Problem[] = [];
  // f(x) = a^x evaluations
  for (const base of [2, 3, 5]) {
    for (let x = 0; x <= 5; x++) {
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Evaluate: ${base}^${x}`, answer: Math.pow(base, x), points: 1 });
    }
    for (let x = -1; x >= -3; x--) {
      problems.push({ id: nanoid(8), type: "short_answer", question: `Evaluate: ${base}^(${x})`, answer: `1/${Math.pow(base, -x)}`, points: 1 });
    }
  }
  const conceptual = [
    { q: "For f(x) = 2^x, what happens to f(x) as x → ∞?", a: "f(x) → ∞ (grows without bound)" },
    { q: "For f(x) = (1/2)^x, is this exponential growth or decay?", a: "Exponential decay" },
    { q: "What is the y-intercept of f(x) = 3^x?", a: "1 (since 3^0 = 1)" },
    { q: "Solve: 2^x = 32", a: "x = 5" },
    { q: "Solve: 3^x = 81", a: "x = 4" },
    { q: "Solve: 5^x = 1", a: "x = 0" },
    { q: "What is the horizontal asymptote of f(x) = 2^x + 3?", a: "y = 3" },
    { q: "Solve: 4^x = 2", a: "x = 1/2" },
  ];
  conceptual.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M16: Complex Numbers ───
function generateComplexNumbers(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let a = 1; a <= 5; a++) {
    for (let b = 1; b <= 5; b++) {
      for (let c = 1; c <= 5; c++) {
        for (let d = 1; d <= 5; d++) {
          // Addition
          problems.push({ id: nanoid(8), type: "short_answer", question: `Add: (${a} + ${b}i) + (${c} + ${d}i)`, answer: `${a+c} + ${b+d}i`, points: 1 });
          // Subtraction
          problems.push({ id: nanoid(8), type: "short_answer", question: `Subtract: (${a+c} + ${b+d}i) − (${c} + ${d}i)`, answer: `${a} + ${b}i`, points: 1 });
          if (problems.length > count * 5) break;
        }
        if (problems.length > count * 5) break;
      }
      if (problems.length > count * 5) break;
    }
    if (problems.length > count * 5) break;
  }
  const conceptual = [
    { q: "What is i²?", a: "−1" }, { q: "What is i³?", a: "−i" }, { q: "What is i⁴?", a: "1" },
    { q: "What is the conjugate of (3 + 4i)?", a: "3 − 4i" },
    { q: "What is the modulus of (3 + 4i)?", a: "5", explanation: "√(9 + 16) = √25 = 5" },
    { q: "Multiply: (2 + 3i)(2 − 3i)", a: "13", explanation: "Difference of squares: 4 + 9 = 13" },
    { q: "Simplify: √(−16)", a: "4i" },
    { q: "What is the real part of (5 − 2i)?", a: "5" },
    { q: "What is the imaginary part of (5 − 2i)?", a: "−2" },
  ];
  conceptual.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, explanation: (r as any).explanation, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M17: Limits ───
function generateLimits(count: number): Problem[] {
  const items = [
    { q: "What is lim(x→0) of x²?", a: "0" }, { q: "What is lim(x→∞) of 1/x?", a: "0" },
    { q: "What is lim(x→0) of sin(x)/x?", a: "1" }, { q: "What is lim(x→∞) of (2x+1)/(x+3)?", a: "2" },
    { q: "What is lim(x→2) of (x² − 4)/(x − 2)?", a: "4", explanation: "Factor: (x+2)(x−2)/(x−2) = x+2 → 4" },
    { q: "What is lim(x→∞) of e^(−x)?", a: "0" }, { q: "What is lim(x→0⁺) of ln(x)?", a: "−∞" },
    { q: "What is lim(x→π) of sin(x)?", a: "0" }, { q: "What is lim(x→1) of (x³−1)/(x−1)?", a: "3" },
    { q: "A function is continuous at x=a if lim(x→a) f(x) equals what?", a: "f(a)" },
    { q: "What is lim(x→0) of (1−cos x)/x?", a: "0" },
    { q: "What is lim(x→∞) of (3x² + 2)/(x² − 1)?", a: "3" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, explanation: (s as any).explanation, points: 1 }));
}

// ─── M17: Sequences and Series ───
function generateSequencesAndSeries(count: number): Problem[] {
  const problems: Problem[] = [];
  // Arithmetic sequences
  for (let a = 1; a <= 10; a++) {
    for (let d = 1; d <= 5; d++) {
      const terms = [a, a+d, a+2*d, a+3*d];
      problems.push({ id: nanoid(8), type: "fill_blank", question: `What is the next term: ${terms[0]}, ${terms[1]}, ${terms[2]}, ___?`, answer: terms[3], points: 1 });
      const n = rand(5, 15);
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Find the ${n}th term of the arithmetic sequence: ${a}, ${a+d}, ${a+2*d}, ...`, answer: a + (n-1)*d, points: 1, explanation: `aₙ = ${a} + (${n}−1)×${d} = ${a+(n-1)*d}` });
    }
  }
  // Geometric sequences
  for (let a = 1; a <= 5; a++) {
    for (const r of [2, 3, 0.5]) {
      const terms = [a, a*r, a*r*r, a*r*r*r];
      problems.push({ id: nanoid(8), type: "fill_blank", question: `What is the next term: ${terms[0]}, ${terms[1]}, ${terms[2]}, ___?`, answer: terms[3], points: 1 });
    }
  }
  // Sum of series
  const seriesItems = [
    { q: "What is the sum of an infinite geometric series with a=1 and r=1/2?", a: "2", explanation: "S = a/(1−r) = 1/(1/2) = 2" },
    { q: "What is the sum of an infinite geometric series with a=3 and r=1/3?", a: "4.5" },
    { q: "Find the sum of the first 5 terms of: 2, 4, 6, 8, 10", a: "30" },
  ];
  seriesItems.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, explanation: (r as any).explanation, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M17: Vectors ───
function generateVectors(count: number): Problem[] {
  const problems: Problem[] = [];
  for (let a = 1; a <= 5; a++) {
    for (let b = 1; b <= 5; b++) {
      for (let c = 1; c <= 5; c++) {
        for (let d = 1; d <= 5; d++) {
          problems.push({ id: nanoid(8), type: "short_answer", question: `Add vectors: (${a}, ${b}) + (${c}, ${d})`, answer: `(${a+c}, ${b+d})`, points: 1 });
          problems.push({ id: nanoid(8), type: "short_answer", question: `What is the magnitude of vector (${a}, ${b})?`, answer: `√${a*a+b*b} ≈ ${Math.sqrt(a*a+b*b).toFixed(2)}`, points: 1 });
          if (problems.length > count * 5) break;
        }
        if (problems.length > count * 5) break;
      }
      if (problems.length > count * 5) break;
    }
    if (problems.length > count * 5) break;
  }
  const dotProductItems = [
    { q: "What is the dot product of (2, 3) and (4, 5)?", a: "23", explanation: "2×4 + 3×5 = 8+15 = 23" },
    { q: "What is the dot product of (1, 0) and (0, 1)?", a: "0 (perpendicular)" },
    { q: "What does a dot product of 0 indicate about two vectors?", a: "They are perpendicular (orthogonal)" },
    { q: "Subtract vectors: (5, 3) − (2, 1)", a: "(3, 2)" },
    { q: "What is the unit vector in the direction of (3, 4)?", a: "(3/5, 4/5)" },
  ];
  dotProductItems.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, explanation: (r as any).explanation, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M18: Derivatives ───
function generateDerivatives(count: number): Problem[] {
  const problems: Problem[] = [];
  // Power rule: d/dx [x^n] = nx^(n-1)
  for (let n = 1; n <= 8; n++) {
    problems.push({ id: nanoid(8), type: "short_answer", question: `Find the derivative of f(x) = x^${n}`, answer: n === 1 ? "1" : n === 2 ? "2x" : `${n}x^${n-1}`, points: 1, explanation: `Power rule: d/dx[x^${n}] = ${n}x^${n-1}` });
  }
  // Constant multiples
  for (let a = 2; a <= 5; a++) {
    for (let n = 2; n <= 6; n++) {
      problems.push({ id: nanoid(8), type: "short_answer", question: `Find the derivative of f(x) = ${a}x^${n}`, answer: `${a*n}x^${n-1}`, points: 1 });
    }
  }
  // Trig derivatives
  const trigDerivs = [
    { q: "What is d/dx[sin x]?", a: "cos x" }, { q: "What is d/dx[cos x]?", a: "−sin x" },
    { q: "What is d/dx[tan x]?", a: "sec²x" }, { q: "What is d/dx[e^x]?", a: "e^x" },
    { q: "What is d/dx[ln x]?", a: "1/x" }, { q: "What is d/dx[√x]?", a: "1/(2√x)" },
  ];
  trigDerivs.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M18: Integrals ───
function generateIntegrals(count: number): Problem[] {
  const problems: Problem[] = [];
  // Power rule for integrals: ∫x^n dx = x^(n+1)/(n+1) + C
  for (let n = 1; n <= 8; n++) {
    problems.push({ id: nanoid(8), type: "short_answer", question: `Find ∫x^${n} dx`, answer: `x^${n+1}/${n+1} + C`, points: 1, explanation: `∫x^n dx = x^(n+1)/(n+1) + C` });
  }
  // Constant multiples
  for (let a = 2; a <= 5; a++) {
    for (let n = 1; n <= 4; n++) {
      problems.push({ id: nanoid(8), type: "short_answer", question: `Find ∫${a}x^${n} dx`, answer: `${a}x^${n+1}/${n+1} + C`, points: 1 });
    }
  }
  // Definite integrals
  for (let a = 0; a <= 3; a++) {
    for (let b = a+1; b <= 5; b++) {
      const result = (Math.pow(b, 2) - Math.pow(a, 2)) / 2;
      problems.push({ id: nanoid(8), type: "arithmetic", question: `Evaluate ∫[${a} to ${b}] x dx`, answer: result, points: 1, explanation: `[x²/2] from ${a} to ${b} = ${b*b/2} − ${a*a/2} = ${result}` });
    }
  }
  const trigIntegrals = [
    { q: "What is ∫sin x dx?", a: "−cos x + C" }, { q: "What is ∫cos x dx?", a: "sin x + C" },
    { q: "What is ∫e^x dx?", a: "e^x + C" }, { q: "What is ∫(1/x) dx?", a: "ln|x| + C" },
    { q: "What is ∫sec²x dx?", a: "tan x + C" },
  ];
  trigIntegrals.forEach((r) => problems.push({ id: nanoid(8), type: "short_answer" as const, question: r.q, answer: r.a, points: 1 }));
  return shuffleArray(deduplicateProblems(problems)).slice(0, count);
}

// ─── M18: Calculus Applications ───
function generateCalculusApplications(count: number): Problem[] {
  const items = [
    { q: "If f(x) = x², at what x-value is the slope of the tangent line equal to 6?", a: "x = 3", explanation: "f'(x) = 2x = 6 → x = 3" },
    { q: "A ball is thrown upward with position s(t) = −5t² + 20t. When does it reach maximum height?", a: "t = 2 seconds", explanation: "s'(t) = −10t + 20 = 0 → t = 2" },
    { q: "What does a derivative equal to zero indicate about a function?", a: "A critical point (possible maximum or minimum)" },
    { q: "If f'(x) > 0 on an interval, what can you say about f?", a: "f is increasing on that interval" },
    { q: "If f'(x) < 0 on an interval, what can you say about f?", a: "f is decreasing on that interval" },
    { q: "What does the definite integral ∫[a to b] f(x) dx represent geometrically?", a: "The area under the curve f(x) between x=a and x=b" },
    { q: "Find the area under y = x from x=0 to x=4.", a: "8", explanation: "∫[0 to 4] x dx = [x²/2] from 0 to 4 = 8" },
    { q: "If f(x) = x³ − 3x, find the critical points.", a: "x = 1 and x = −1", explanation: "f'(x) = 3x² − 3 = 0 → x² = 1" },
    { q: "What is the second derivative test used for?", a: "To determine if a critical point is a local max, min, or saddle point" },
    { q: "If f''(x) > 0 at a critical point, it is a:", a: "Local minimum" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, explanation: (s as any).explanation, points: 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// READING GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

// ─── R2: Phonics generators (Silent E, Long Vowels) ───────────────────────────

function generateSilentEProblems(count: number): Problem[] {
  const items = [
    { q: "Which word has a silent E? (cap / cape / cat / can)", a: "cape", opts: ["cap","cape","cat","can"] },
    { q: "Add a silent E to make a new word: 'pin' → ___", a: "pine" },
    { q: "Which word has a long vowel sound? (hop / hope / hot / hop)", a: "hope", opts: ["hop","hope","hot","cot"] },
    { q: "Does 'cake' have a silent E?", a: "Yes", opts: ["Yes","No"] },
    { q: "Which word follows the silent E rule? (bit / bite / sit / fit)", a: "bite", opts: ["bit","bite","sit","fit"] },
    { q: "Add a silent E: 'rob' → ___", a: "robe" },
    { q: "Which is a silent E word? (cut / cute / cup / cub)", a: "cute", opts: ["cut","cute","cup","cub"] },
    { q: "What sound does the vowel 'a' make in 'game'?", a: "Long A (like the letter name)", opts: ["Short A","Long A (like the letter name)","Silent","Schwa"] },
    { q: "Add a silent E: 'slid' → ___", a: "slide" },
    { q: "Which word rhymes with 'bone'? (Don / done / tone / ton)", a: "tone", opts: ["don","done","tone","ton"] },
    { q: "Circle the silent E word: ride / rid / rip / rich", a: "ride" },
    { q: "Does 'have' follow the regular silent E rule?", a: "No — 'have' is an exception; the 'a' is still short", opts: ["Yes","No — 'have' is an exception; the 'a' is still short"] },
    { q: "What does a silent E at the end of a word usually do?", a: "Makes the vowel before it say its long sound (letter name)" },
    { q: "Make a silent E word from these letters: t, i, m, e", a: "time" },
    { q: "Which pair shows the silent E rule? (hop→hope / cat→cate / fit→fite / run→rune)", a: "hop→hope", opts: ["hop→hope","cat→cate","fit→fite","run→rune"] },
    { q: "Spell the silent E word for a small rodent that rhymes with 'mice'.", a: "mice" },
    { q: "What is the vowel sound in 'tube'?", a: "Long U", opts: ["Short U","Long U","Silent","Schwa"] },
    { q: "Which word has a short vowel sound? (kite / kit / bike / time)", a: "kit", opts: ["kite","kit","bike","time"] },
    { q: "Add a silent E: 'not' → ___", a: "note" },
    { q: "Does the word 'blue' follow the silent E rule?", a: "Yes — the 'e' is silent and the 'u' says its long sound" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generateLongVowelProblems(vowel: "a" | "i" | "o", count: number): Problem[] {
  const banks = {
    a: [
      { q: "Which word has a long A sound? (hat / hate / have / hand)", a: "hate", opts: ["hat","hate","have","hand"] },
      { q: "Does 'rain' have a long A sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling pattern makes a long A sound? (ai / au / oi / ou)", a: "ai", opts: ["ai","au","oi","ou"] },
      { q: "Give an example of a long A word spelled with 'ay'.", a: "(e.g., play, day, say, way)" },
      { q: "Sort: long A or short A — 'cake'?", a: "Long A" },
      { q: "Sort: long A or short A — 'cap'?", a: "Short A" },
      { q: "Which word rhymes with 'train'? (tan / rain / ran / tin)", a: "rain", opts: ["tan","rain","ran","tin"] },
      { q: "What are three ways to spell the long A sound?", a: "a_e (cake), ai (rain), ay (play)" },
      { q: "Spell a long A word that means the opposite of night.", a: "day" },
      { q: "Does 'snake' have a long or short A?", a: "Long A" },
      { q: "Which word has a long A? (bad / braid / back / ban)", a: "braid", opts: ["bad","braid","back","ban"] },
      { q: "Change the short A to a long A: 'mad' → ___", a: "made" },
    ],
    i: [
      { q: "Which word has a long I sound? (bit / bite / big / bin)", a: "bite", opts: ["bit","bite","big","bin"] },
      { q: "Does 'night' have a long I sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling makes a long I? (ie / oe / ue / ae)", a: "ie", opts: ["ie","oe","ue","ae"] },
      { q: "Give a long I word spelled with 'igh'.", a: "(e.g., night, light, right, fight)" },
      { q: "Sort: long I or short I — 'pine'?", a: "Long I" },
      { q: "Sort: long I or short I — 'pin'?", a: "Short I" },
      { q: "Spell a long I word that means not dark.", a: "light" },
      { q: "What are two ways to spell the long I sound?", a: "i_e (kite), igh (night), ie (pie), y (fly)" },
      { q: "Which rhymes with 'kite'? (kit / sit / white / hit)", a: "white", opts: ["kit","sit","white","hit"] },
      { q: "Change the short I to a long I: 'rip' → ___", a: "ripe" },
      { q: "Does 'fly' have a long I sound?", a: "Yes — the 'y' acts as a long I vowel" },
      { q: "Which word has a long I? (hill / mild / fill / mill)", a: "mild", opts: ["hill","mild","fill","mill"] },
    ],
    o: [
      { q: "Which word has a long O sound? (hop / hope / hot / hog)", a: "hope", opts: ["hop","hope","hot","hog"] },
      { q: "Does 'boat' have a long O sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which spelling makes a long O? (oa / ou / oi / au)", a: "oa", opts: ["oa","ou","oi","au"] },
      { q: "Give a long O word spelled with 'ow'.", a: "(e.g., snow, blow, grow, show)" },
      { q: "Sort: long O or short O — 'code'?", a: "Long O" },
      { q: "Sort: long O or short O — 'cot'?", a: "Short O" },
      { q: "Spell a long O word that means a path or road.", a: "road" },
      { q: "What are two ways to spell the long O sound?", a: "o_e (home), oa (boat), ow (snow)" },
      { q: "Which rhymes with 'coat'? (cot / goat / got / cob)", a: "goat", opts: ["cot","goat","got","cob"] },
      { q: "Change the short O to a long O: 'not' → ___", a: "note" },
      { q: "Does 'toe' have a long O sound?", a: "Yes", opts: ["Yes","No"] },
      { q: "Which word has a long O? (fog / fond / fold / frog)", a: "fold", opts: ["fog","fond","fold","frog"] },
    ],
  };
  const items = banks[vowel];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8),
    type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

// ─── R5/R9: Passage banks — each has enough questions to fill up to 30 problems ──

const readingPassages: Record<string, { passage: string; questions: Problem[] }[]> = {
  "main idea": [{
    passage: `Honey bees are one of the most important insects on Earth. A single hive can contain up to 60,000 bees, all working together. The queen bee lays up to 2,000 eggs per day. Worker bees gather nectar from flowers and turn it into honey. A single bee produces only one twelfth of a teaspoon of honey in its entire lifetime. Bees communicate using a dance called the "waggle dance," which tells other bees the direction and distance of food.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the main idea of this passage?", options: ["Bees are dangerous", "Honey bees are important insects that work together", "All bees make honey", "Bees only live in hives"], answer: "Honey bees are important insects that work together", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How much honey does one bee make in its lifetime?", options: ["One jar", "One teaspoon", "One twelfth of a teaspoon", "One cup"], answer: "One twelfth of a teaspoon", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the waggle dance used for?", answer: "To tell other bees the direction and distance of food", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the role of the queen bee?", answer: "She lays up to 2,000 eggs per day", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What do worker bees collect from flowers?", options: ["Water", "Nectar", "Pollen only", "Wax"], answer: "Nectar", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Why are honey bees described as 'important'?", answer: "They work together, produce honey, and communicate complex information", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How many bees can a single hive contain?", options: ["Up to 600", "Up to 6,000", "Up to 60,000", "Up to 600,000"], answer: "Up to 60,000", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "In your own words, describe how bees communicate.", answer: "They do a 'waggle dance' to show other bees where food is", points: 1 },
    ],
  }, {
    passage: `The Great Barrier Reef is the world's largest coral reef system, stretching over 2,300 kilometres off the coast of Queensland, Australia. It is home to thousands of species of fish, corals, and other sea creatures. Scientists warn that rising ocean temperatures caused by climate change are bleaching the corals — stripping them of the algae they depend on for survival. Without urgent action, large sections of the reef could be permanently lost.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the main idea of this passage?", answer: "The Great Barrier Reef is the world's largest coral reef but is threatened by climate change", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Where is the Great Barrier Reef located?", options: ["New Zealand", "Brazil", "Queensland, Australia", "South Africa"], answer: "Queensland, Australia", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is coral bleaching?", answer: "When rising temperatures strip corals of the algae they need to survive", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How long is the Great Barrier Reef?", options: ["230 km", "2,300 km", "23,000 km", "230,000 km"], answer: "2,300 km", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the passage suggest could happen without urgent action?", answer: "Large sections of the reef could be permanently lost", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What causes coral bleaching according to the passage?", answer: "Rising ocean temperatures caused by climate change", points: 1 },
    ],
  }],
  "cause and effect": [{
    passage: `Every autumn, millions of monarch butterflies migrate up to 5,000 kilometres from Canada and the United States to Mexico. They navigate using the sun and Earth's magnetic field. The migration is threatened by climate change and loss of milkweed — the only plant monarch caterpillars can eat. Conservation efforts include planting milkweed gardens across North America.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What causes the monarch butterfly migration to be threatened? Give two reasons.", answer: "Climate change and loss of milkweed habitat", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "Why is milkweed important to monarch butterflies?", options: ["It helps them navigate", "It is the only plant their caterpillars can eat", "It provides shelter", "It attracts other insects"], answer: "It is the only plant their caterpillars can eat", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What conservation effort is mentioned in the passage?", answer: "Planting milkweed gardens across North America", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How do monarch butterflies navigate?", options: ["By smell", "Using the sun and Earth's magnetic field", "By following rivers", "By echolocation"], answer: "Using the sun and Earth's magnetic field", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the cause of milkweed loss? What is the effect on butterflies?", answer: "Habitat destruction causes milkweed loss; butterflies cannot feed their caterpillars", points: 2 },
      { id: nanoid(8), type: "short_answer", question: "How far do monarchs migrate each autumn?", answer: "Up to 5,000 kilometres", points: 1 },
    ],
  }, {
    passage: `In 1883, the volcanic island of Krakatau in Indonesia erupted with enormous force. The explosion was heard 5,000 kilometres away. The eruption sent massive amounts of ash into the atmosphere, blocking sunlight around the world. As a result, global temperatures dropped by about 1.2°C for several years — a phenomenon scientists now call a 'volcanic winter.' Crops failed in many regions, causing widespread food shortages.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What was the direct cause of the volcanic winter described in the passage?", answer: "Ash from the Krakatau eruption blocked sunlight, causing temperatures to drop", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "How far away was the eruption heard?", options: ["500 km", "1,000 km", "5,000 km", "50,000 km"], answer: "5,000 km", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What was the effect of the temperature drop on people?", answer: "Crops failed in many regions, causing widespread food shortages", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "By how much did global temperatures drop?", options: ["0.12°C", "1.2°C", "12°C", "0.012°C"], answer: "1.2°C", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Identify one cause and one effect from the passage.", answer: "Cause: eruption sent ash into atmosphere; Effect: sunlight blocked, temperatures dropped", points: 2 },
    ],
  }],
  "context clues": [{
    passage: `The ancient city of Pompeii was buried under volcanic ash when Mount Vesuvius erupted in 79 CE. The eruption was so sudden that residents had no time to escape. Archaeologists excavating the site have uncovered remarkably preserved buildings, artwork, and even food. The city gives us a unique snapshot of Roman life at the height of the empire.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "Using context clues, what does 'excavating' most likely mean?", options: ["Burning", "Digging up", "Rebuilding", "Flooding"], answer: "Digging up", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does 'remarkably preserved' tell you about the buildings?", answer: "They were unusually well kept or undamaged despite being buried for centuries", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'snapshot' mean in this context?", options: ["A photograph", "A quick look or picture of a moment in time", "A type of building", "A volcanic eruption"], answer: "A quick look or picture of a moment in time", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What clues in the passage helped you understand what 'excavating' means?", answer: "'Uncovered' and 'site' suggest digging at a location to find buried things", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'residents' most likely mean?", options: ["Soldiers", "People who lived in the city", "Tourists", "Government officials"], answer: "People who lived in the city", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does 'at the height of the empire' suggest about Rome?", answer: "Rome was at its most powerful or successful period", points: 1 },
    ],
  }],
  "inference": [{
    passage: `Maya arrived at the library with muddy boots and a drenched jacket. She pulled a stack of travel books off the shelf and spread a map across the table. She circled several locations in South America and scribbled notes in the margins. A smile crossed her face as she looked at the circled spots.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What can you infer about the weather outside?", options: ["It was hot and sunny", "It was raining", "It was snowing", "It was windy only"], answer: "It was raining", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What can you infer about Maya's plans based on her actions?", answer: "She is planning a trip to South America", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Why do you think Maya was smiling?", options: ["She found a funny book", "She was excited about her travel plans", "She saw a friend", "She finished her homework"], answer: "She was excited about her travel plans", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What evidence from the text supports your inference about the weather?", answer: "'Muddy boots' and 'drenched jacket' both suggest she walked through rain", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the detail about 'scribbled notes in the margins' tell us about Maya?", answer: "She is engaged, organized, and serious about planning", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which word best describes Maya's mood in this passage?", options: ["Sad", "Bored", "Excited", "Frightened"], answer: "Excited", points: 1 },
    ],
  }],
  "sequence of events": [{
    passage: `Making bread from scratch takes patience. First, you mix flour, yeast, salt, and water into a dough. Next, you knead the dough for about ten minutes until it is smooth and elastic. After that, you leave the dough in a warm place to rise for an hour. Once the dough has doubled in size, you shape it into a loaf and place it in a pan. Finally, you bake it in a hot oven for thirty minutes until the crust is golden brown.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the FIRST step in making bread?", options: ["Knead the dough", "Mix flour, yeast, salt, and water", "Bake in the oven", "Let the dough rise"], answer: "Mix flour, yeast, salt, and water", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What happens AFTER kneading the dough?", options: ["You mix the ingredients", "You bake it", "You leave it to rise", "You shape it into a loaf"], answer: "You leave it to rise", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "List the five steps in the correct order.", answer: "1. Mix ingredients 2. Knead 3. Let rise 4. Shape into loaf 5. Bake", points: 2 },
      { id: nanoid(8), type: "multiple_choice", question: "How long should the dough rise?", options: ["10 minutes", "30 minutes", "1 hour", "2 hours"], answer: "1 hour", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What signal word tells you the LAST step?", answer: "'Finally'", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What is the LAST step?", options: ["Knead the dough", "Mix ingredients", "Let it rise", "Bake until golden brown"], answer: "Bake until golden brown", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What sequence signal words are used in this passage?", answer: "First, Next, After that, Once, Finally", points: 1 },
    ],
  }, {
    passage: `The life cycle of a frog has four stages. It begins when a female frog lays hundreds of eggs in a pond. The eggs hatch into tadpoles, which breathe through gills and swim using their tails. Over several weeks, the tadpoles grow back legs, then front legs, and their tails shrink. By the end of the process, the tadpole has become a fully formed froglet that can breathe air and hop onto land.`,
    questions: [
      { id: nanoid(8), type: "multiple_choice", question: "What is the FIRST stage of the frog's life cycle?", options: ["Tadpole", "Froglet", "Egg", "Adult frog"], answer: "Egg", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What comes AFTER the egg stage?", options: ["Froglet", "Tadpole", "Adult frog", "Larva"], answer: "Tadpole", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "In what order do legs grow on the tadpole?", answer: "Back legs grow first, then front legs", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the froglet differ from the tadpole?", answer: "The froglet breathes air and can hop on land; the tadpole breathes through gills and swims", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How many stages does the frog life cycle have?", options: ["2", "3", "4", "5"], answer: "4", points: 1 },
    ],
  }],
  "character analysis": [{
    passage: `In the story of 'The Tortoise and the Hare,' the hare is quick to brag about his speed and challenges the tortoise to a race, certain of an easy win. The tortoise, calm and determined, accepts without complaint. During the race, the hare takes a nap, confident he has plenty of time. The tortoise, never stopping, crosses the finish line first. The hare wakes to find he has lost — not because of speed, but because of arrogance and laziness.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What character trait causes the hare to lose the race?", answer: "Arrogance and laziness — he was overconfident and stopped to nap", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which word best describes the tortoise?", options: ["Arrogant", "Determined", "Lazy", "Frightened"], answer: "Determined", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the author reveal the hare's personality? Give two examples from the text.", answer: "He brags about his speed and takes a nap during the race, showing arrogance", points: 2 },
      { id: nanoid(8), type: "short_answer", question: "What lesson does the tortoise's behaviour teach?", answer: "Steady, persistent effort beats natural talent combined with laziness", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "How does the tortoise respond to the hare's challenge?", options: ["He refuses", "He is afraid", "He accepts calmly", "He brags back"], answer: "He accepts calmly", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Would you describe the hare as a static or dynamic character? Explain.", answer: "Static — the hare does not change or learn from his experience by the story's end", points: 1 },
    ],
  }],
  "theme identification": [{
    passage: `At the end of a long journey, a weary traveller came to a well. He found a young boy drawing water to give to a thirsty dog. 'I have been walking for hours,' said the traveller, 'yet you give water to an animal before me.' The boy replied, 'All living things are thirsty, and kindness costs nothing.' The traveller was ashamed of his selfishness. He helped the boy carry the water and they shared it together, traveller, boy, and dog alike.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the theme of this passage?", answer: "Kindness and compassion for all living things; generosity benefits everyone", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "Which statement best expresses the theme?", options: ["Animals are more important than people", "Kindness and sharing benefit everyone", "Travellers should always be served first", "Water is more valuable than gold"], answer: "Kindness and sharing benefit everyone", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What does the boy's action of giving water to the dog tell us about his character?", answer: "He is compassionate and treats all living things with equal care", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the traveller change by the end of the story?", answer: "He feels ashamed of his selfishness and chooses to help and share", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "The phrase 'kindness costs nothing' is an example of:", options: ["Metaphor", "Simile", "Aphorism (a wise saying)", "Alliteration"], answer: "Aphorism (a wise saying)", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What evidence from the text supports the theme of generosity?", answer: "The boy shares water with the dog; the traveller eventually helps and shares with both", points: 1 },
    ],
  }],
  "figurative language": [{
    passage: `The storm arrived like an army marching to war. Thunder drummed across the sky, and lightning stitched silver threads through the clouds. The wind was a wolf howling in the darkness, shaking the windows until they rattled their protests. By morning, the street was a mirror reflecting the pale sun — perfectly still, as if the storm had never come to call.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "Identify the simile in the first sentence.", answer: "'The storm arrived like an army marching to war'", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What figure of speech is 'The wind was a wolf'?", options: ["Simile", "Metaphor", "Personification", "Hyperbole"], answer: "Metaphor", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Find an example of personification in the passage.", answer: "'The windows rattled their protests' — windows cannot actually protest; they are given human behaviour", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the effect of calling the street 'a mirror' after the storm?", answer: "It creates an image of stillness and calm, contrasting with the violent storm", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What does 'Thunder drummed across the sky' use?", options: ["Simile", "Personification", "Metaphor", "Alliteration"], answer: "Personification", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What mood does the figurative language create in this passage?", answer: "A dramatic, powerful mood — the storm feels alive and threatening", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Explain the metaphor 'lightning stitched silver threads through the clouds.'", answer: "Lightning is compared to a needle stitching fabric — vivid image of lightning's jagged lines", points: 1 },
    ],
  }],
  "narrative structure": [{
    passage: `Lena had always been afraid of the deep end of the pool. Every summer, her friends dived in fearlessly while she stayed in the shallows. One afternoon, her coach quietly challenged her: 'You don't have to jump. Just walk to the edge and look.' Lena took a breath and walked to the edge. She looked down. Her heart hammered. But she didn't walk away. The next day, she jumped. It was terrifying — and then it was wonderful.`,
    questions: [
      { id: nanoid(8), type: "short_answer", question: "What is the conflict (problem) in this story?", answer: "Lena is afraid of the deep end of the pool", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What is the climax (turning point) of this story?", options: ["Lena watching her friends dive", "The coach giving advice", "Lena walking to the edge", "Lena jumping the next day"], answer: "Lena jumping the next day", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "How does the coach help Lena overcome her fear?", answer: "He gives her a small manageable challenge — just walk to the edge and look — not a big demand", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the resolution of the story?", answer: "Lena overcomes her fear and jumps — and it is wonderful", points: 1 },
      { id: nanoid(8), type: "multiple_choice", question: "What narrative technique is used in 'Her heart hammered'?", options: ["Flashback", "Foreshadowing", "Personification", "Simile"], answer: "Personification", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "What is the theme of this story?", answer: "Courage grows by facing fear one small step at a time", points: 1 },
      { id: nanoid(8), type: "short_answer", question: "Describe the rising action in this story.", answer: "Lena's history of fear, watching her friends, the coach's challenge, walking to the edge", points: 1 },
    ],
  }],
};

function generateReadingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();

  // R2 — Phonics (no passage, direct question banks)
  if (skill.includes("silent e")) return generateSilentEProblems(count);
  if (skill.includes("long a")) return generateLongVowelProblems("a", count);
  if (skill.includes("long i")) return generateLongVowelProblems("i", count);
  if (skill.includes("long o")) return generateLongVowelProblems("o", count);

  // R5/R9 — Passage-based comprehension
  let key = "main idea";
  if (skill.includes("cause") || skill.includes("effect"))        key = "cause and effect";
  else if (skill.includes("context") || skill.includes("vocabulary")) key = "context clues";
  else if (skill.includes("inference") || skill.includes("infer"))    key = "inference";
  else if (skill.includes("sequence"))                               key = "sequence of events";
  else if (skill.includes("character"))                              key = "character analysis";
  else if (skill.includes("theme"))                                  key = "theme identification";
  else if (skill.includes("figurative"))                             key = "figurative language";
  else if (skill.includes("narrative structure"))                    key = "narrative structure";
  else if (skill.includes("main idea") || skill.includes("topic") || skill.includes("detail")) key = "main idea";

  const bank = readingPassages[key] ?? readingPassages["main idea"];

  // Build a pool by cycling through all passages in the bank
  const allProblems: Problem[] = [];
  for (const entry of bank) {
    allProblems.push({
      id: nanoid(8), type: "short_answer",
      question: `READ THIS PASSAGE:\n\n${entry.passage}\n\nNow answer the questions below.`,
      answer: "(passage — no answer required)", points: 0,
    });
    allProblems.push(...entry.questions);
  }

  // If we have enough, shuffle just the questions (keep passage headers in place)
  // Build sheet: passage block + questions from first entry; if more needed, add second entry
  const result: Problem[] = [];
  for (const entry of bank) {
    if (result.length >= count) break;
    result.push({
      id: nanoid(8), type: "short_answer",
      question: `READ THIS PASSAGE:\n\n${entry.passage}\n\nNow answer the questions below.`,
      answer: "(passage — no answer required)", points: 0,
    });
    for (const q of entry.questions) {
      if (result.length >= count) break;
      result.push({ ...q, id: nanoid(8) });
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITING GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function generateWritingProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();
  if (skill.includes("uppercase") || skill.includes("lowercase") || skill.includes("letter")) return generateLetterProblems(count);
  if (skill.includes("noun")) return generateNounProblems(count);
  if (skill.includes("verb")) return generateVerbProblems(count);
  if (skill.includes("adjective")) return generateAdjectiveProblems(count);
  if (skill.includes("pronoun")) return generatePronounProblems(count);
  if (skill.includes("preposition")) return generatePrepositionProblems(count);
  if (skill.includes("parts of speech") || skill.includes("part of speech")) return generatePartsOfSpeech(count);
  if (skill.includes("punctuation") || skill.includes("capitalization")) return generatePunctuationProblems(count);
  if (skill.includes("sentence")) return generateSentenceProblems(count);
  if (skill.includes("paragraph") || skill.includes("topic")) return generateParagraphProblems(count);
  if (skill.includes("essay")) return generateEssayProblems(count);
  if (skill.includes("transition")) return generateTransitionProblems(count);
  if (skill.includes("narrative")) return generateNarrativeProblems(count);
  if (skill.includes("persuasive")) return generatePersuasiveProblems(count);
  if (skill.includes("rhetoric") || skill.includes("diction") || skill.includes("syntax")) return generateAdvancedWritingProblems(count);
  return generatePartsOfSpeech(count);
}

function generateLetterProblems(count: number): Problem[] {
  const items = [
    { q: "Which is a capital letter?", a: "A", opts: ["a","b","A","c"] },
    { q: "Write the capital letter for 'm'.", a: "M" },
    { q: "Which sentence is capitalized correctly?", a: "My name is Sam.", opts: ["my name is sam.", "My name is Sam.", "MY name is Sam.", "my Name is Sam."] },
    { q: "Every sentence must begin with a:", a: "Capital letter", opts: ["lowercase letter","Capital letter","number","comma"] },
    { q: "Proper nouns must be:", a: "Capitalized", opts: ["lowercase","Capitalized","plural","italicized"] },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.opts ? "multiple_choice" : "short_answer" as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generateNounProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the noun: run / dog / quickly / blue", a: "dog" },
    { q: "Which word is a noun? (car / eat / fast / loudly)", a: "car" },
    { q: "Which is a proper noun? (city / London / table / river)", a: "London" },
    { q: "Is 'happiness' a concrete or abstract noun?", a: "abstract" },
    { q: "Is 'apple' a concrete or abstract noun?", a: "concrete" },
    { q: "Give a noun that names a place.", a: "(any place noun, e.g., school, park, Canada)" },
    { q: "Give a noun that names a person.", a: "(any person noun, e.g., teacher, doctor, Maria)" },
    { q: "Identify all nouns: 'The dog chased the cat around the garden.'", a: "dog, cat, garden" },
    { q: "What is a collective noun? Give an example.", a: "A noun that refers to a group (e.g., team, flock, crowd)" },
    { q: "Change to plural: 'child'", a: "children" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateVerbProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the verb: happy / table / jump / city", a: "jump" },
    { q: "Is 'quickly' a verb or adverb?", a: "adverb" },
    { q: "Identify the verb: 'She ran to school.'", a: "ran" },
    { q: "Change to past tense: 'I run every day.'", a: "I ran every day." },
    { q: "Change to future tense: 'He eats breakfast.'", a: "He will eat breakfast." },
    { q: "Identify the verb tense: 'They have finished the race.'", a: "present perfect" },
    { q: "What is an irregular verb? Give an example.", a: "A verb that doesn't form past tense with -ed (e.g., go → went)" },
    { q: "Fill in the blank: Yesterday, she ___ (eat) her lunch.", a: "ate" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateAdjectiveProblems(count: number): Problem[] {
  const items = [
    { q: "Circle the adjective: school / eat / tall / swim", a: "tall" },
    { q: "Add an adjective: The ___ cat sat on the mat.", a: "(any adjective, e.g., fluffy, black, sleepy)" },
    { q: "Identify the adjective: 'She wore a beautiful dress.'", a: "beautiful" },
    { q: "Compare: 'big' → bigger → ___", a: "biggest" },
    { q: "Compare: 'happy' → happier → ___", a: "happiest" },
    { q: "What is the difference between a comparative and superlative adjective?", a: "Comparative compares two things (bigger); superlative compares three or more (biggest)" },
    { q: "Is 'quickly' an adjective or adverb?", a: "adverb" },
    { q: "Identify the adjectives: 'The tall, dark stranger wore an old coat.'", a: "tall, dark, old" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePronounProblems(count: number): Problem[] {
  const items = [
    { q: "Replace the noun with a pronoun: 'Maria went to school.' → ___ went to school.", a: "She" },
    { q: "Which is a subject pronoun? (him / her / she / them)", a: "she", opts: ["him","her","she","them"] },
    { q: "Which is an object pronoun? (I / he / she / him)", a: "him", opts: ["I","he","she","him"] },
    { q: "Fill in: Give the book to ___. (he / him)", a: "him", opts: ["he","him"] },
    { q: "Fill in: ___ and I went to the park. (Me / Him / She / He)", a: "He", opts: ["Me","Him","She","He"] },
    { q: "What is a reflexive pronoun? Give an example.", a: "A pronoun that refers back to the subject (e.g., himself, herself, themselves)" },
    { q: "Choose the correct pronoun: Each student must bring ___ own pencil. (their / they / them)", a: "their", opts: ["their","they","them"] },
    { q: "What type of pronoun is 'who'?", a: "Relative pronoun", opts: ["Personal","Reflexive","Relative","Indefinite"] },
    { q: "Replace: 'The dog wagged the dog's tail.'", a: "The dog wagged its tail." },
    { q: "What is an indefinite pronoun? Give an example.", a: "A pronoun that does not refer to a specific person or thing (e.g., everyone, nobody, someone)" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generatePrepositionProblems(count: number): Problem[] {
  const items = [
    { q: "Which word is a preposition? (run / under / happy / eat)", a: "under", opts: ["run","under","happy","eat"] },
    { q: "Fill in: The cat sat ___ the mat. (on / run / blue / sing)", a: "on", opts: ["on","run","blue","sing"] },
    { q: "Identify the preposition: 'She walked through the park.'", a: "through" },
    { q: "What is a prepositional phrase? Give an example.", a: "A phrase beginning with a preposition (e.g., 'in the morning', 'under the table')" },
    { q: "Choose the correct preposition: She arrived ___ Monday. (on / in / at / by)", a: "on", opts: ["on","in","at","by"] },
    { q: "Choose the correct preposition: He lives ___ Canada. (on / in / at / by)", a: "in", opts: ["on","in","at","by"] },
    { q: "Choose the correct preposition: The meeting is ___ noon. (on / in / at / by)", a: "at", opts: ["on","in","at","by"] },
    { q: "Identify all prepositions: 'The dog ran under the fence and through the garden.'", a: "under, through" },
    { q: "True or False: A preposition always comes before a noun or pronoun.", a: "True" },
    { q: "What does a preposition show?", a: "The relationship between a noun/pronoun and another word (position, direction, time, etc.)" },
    { q: "Give three examples of prepositions of place.", a: "(e.g., on, under, above, beside, between, near, behind, in front of)" },
    { q: "Give three examples of prepositions of time.", a: "(e.g., at, on, in, before, after, during, since, until)" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: (item.opts ? "multiple_choice" : "short_answer") as any,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}


function generatePartsOfSpeech(count: number): Problem[] {
  const items = [
    { q: "What part of speech is 'beautiful'?", a: "adjective", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'run'?", a: "verb", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'quickly'?", a: "adverb", opts: ["noun","verb","adjective","adverb"] },
    { q: "What part of speech is 'school'?", a: "noun", opts: ["noun","verb","adjective","adverb"] },
    { q: "Label each word: fast ___ / teacher ___ / laugh ___ (Adj/N/V)", a: "Adj / N / V" },
    { q: "What word class connects two clauses? (e.g., 'and', 'but', 'because')", a: "conjunction", opts: ["noun","conjunction","adjective","pronoun"] },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({
    id: nanoid(8), type: item.opts ? "multiple_choice" as const : "short_answer" as const,
    question: item.q, options: item.opts, answer: item.a, points: 1,
  }));
}

function generatePunctuationProblems(count: number): Problem[] {
  const items = [
    { q: "Which sentence is correct? (a) i like dogs. (b) I like dogs.", a: "I like dogs." },
    { q: "Add the correct punctuation: Where are you going___", a: "Where are you going?" },
    { q: "Add the correct punctuation: Stop right there___", a: "Stop right there!" },
    { q: "Which uses a comma correctly? (a) I like cats and, dogs. (b) I like cats, and I like dogs.", a: "I like cats, and I like dogs." },
    { q: "Does this sentence need a capital letter? (my name is kai.)", a: "My name is Kai." },
    { q: "Add apostrophes where needed: Its the dogs bone.", a: "It's the dog's bone." },
    { q: "True or False: Every sentence must end with a period.", a: "False (can also end with ? or !)" },
    { q: "Where does a comma go in this sentence: 'After we ate dinner we watched a movie.'", a: "After we ate dinner, we watched a movie." },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: "short_answer" as const, question: item.q, answer: item.a, points: 1 }));
}

function generateSentenceProblems(count: number): Problem[] {
  const items = [
    { q: "Which is a complete sentence? (a) Running fast. (b) She ran to school.", a: "She ran to school.", opts: ["Running fast.", "Because it rained.", "She ran to school.", "The big red."], type: "multiple_choice" as const },
    { q: "Fix this run-on: I like apples I eat them every day.", a: "I like apples. I eat them every day.", type: "short_answer" as const },
    { q: "Combine: The dog ran. The dog barked.", a: "The dog ran and barked.", type: "short_answer" as const },
    { q: "What is a compound sentence? Give an example.", a: "Two simple sentences joined by a conjunction (e.g., She sang and I danced.)", type: "short_answer" as const },
    { q: "Add a conjunction: I wanted to play, ___ it was raining.", a: "but", type: "short_answer" as const },
    { q: "Is this simple or compound? 'She sang and danced.'", a: "simple (one subject, compound predicate)", type: "short_answer" as const },
    { q: "What is a complex sentence?", a: "A sentence with an independent clause and at least one dependent clause", type: "short_answer" as const },
    { q: "Identify the clause type: 'Although it was raining, she went outside.'", a: "'Although it was raining' is a dependent clause", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateParagraphProblems(count: number): Problem[] {
  const items = [
    { q: "Which is the best topic sentence? (a) Dogs are good. (b) Dogs make excellent pets for many reasons. (c) I have a dog.", a: "Dogs make excellent pets for many reasons.", opts: ["Dogs are good.", "Dogs make excellent pets for many reasons.", "I have a dog.", "Dogs bark."], type: "multiple_choice" as const },
    { q: "What does a topic sentence do?", a: "States the main idea of the paragraph", type: "short_answer" as const },
    { q: "What does a concluding sentence do?", a: "Wraps up or restates the main idea", type: "short_answer" as const },
    { q: "Write a topic sentence about your favourite season.", a: "(any complete topic sentence)", type: "written_response" as const },
    { q: "True or False: A paragraph should focus on one main idea.", a: "True", type: "short_answer" as const },
    { q: "What are supporting details in a paragraph?", a: "Evidence, examples, or facts that support the topic sentence", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateEssayProblems(count: number): Problem[] {
  const items = [
    { q: "What are the three main parts of an essay?", a: "Introduction, body, conclusion" },
    { q: "What is a thesis statement?", a: "The main argument or claim of the essay, usually in the introduction" },
    { q: "How many body paragraphs does a basic 5-paragraph essay have?", a: "3" },
    { q: "What is the purpose of a conclusion?", a: "To summarize the main points and restate the thesis" },
    { q: "What should a good introduction do?", a: "Hook the reader, provide background, and state the thesis" },
    { q: "What is a 'hook' in essay writing?", a: "An opening sentence that grabs the reader's attention" },
    { q: "What is the difference between a topic sentence and a thesis statement?", a: "Topic sentence is for a paragraph; thesis statement is for the whole essay" },
    { q: "True or False: Every body paragraph needs a topic sentence.", a: "True" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateTransitionProblems(count: number): Problem[] {
  const items = [
    { q: "Choose the correct transition: I was tired. ___, I went to bed. (However / Therefore)", a: "Therefore" },
    { q: "Choose the correct transition: She studied hard. ___, she failed the test. (Nevertheless / In addition)", a: "Nevertheless" },
    { q: "What type of transition is 'furthermore'?", a: "Addition (adds more information)" },
    { q: "What type of transition is 'however'?", a: "Contrast/concession" },
    { q: "What type of transition is 'therefore'?", a: "Cause and effect" },
    { q: "Give an example of a time-order transition word.", a: "(e.g., first, then, next, finally, meanwhile)" },
    { q: "Fill in the blank: ___ finishing dinner, we went for a walk. (After / However / Therefore)", a: "After" },
    { q: "Which transition best shows comparison? (In contrast / First / Therefore / Similarly)", a: "Similarly" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateNarrativeProblems(count: number): Problem[] {
  const items = [
    { q: "What does 'show, don't tell' mean in narrative writing?", a: "Use descriptive details and actions instead of stating emotions directly" },
    { q: "What is a narrative hook?", a: "An opening that grabs the reader's attention" },
    { q: "What is 'first-person point of view'?", a: "The narrator uses 'I' and tells the story from their own perspective" },
    { q: "What is 'third-person limited' point of view?", a: "The narrator knows the thoughts of one character and uses 'he/she/they'" },
    { q: "What is the 'climax' of a story?", a: "The turning point or most intense moment" },
    { q: "What is 'rising action'?", a: "Events that build tension leading to the climax" },
    { q: "What is 'falling action'?", a: "Events after the climax that lead to the resolution" },
    { q: "What is 'setting' in a story?", a: "The time and place where the story occurs" },
    { q: "What is 'characterization'?", a: "The methods an author uses to develop a character's personality" },
    { q: "Rewrite in 'show, don't tell': 'She was nervous.'", a: "Her hands trembled and her heart pounded as she stepped onto the stage." },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePersuasiveProblems(count: number): Problem[] {
  const items = [
    { q: "What is a 'claim' in persuasive writing?", a: "The main argument or position the writer is trying to prove" },
    { q: "What is a 'counterargument'?", a: "The opposing view that you address and refute in your essay" },
    { q: "What does 'ethos' mean as a persuasive appeal?", a: "An appeal to the writer's credibility or character" },
    { q: "What does 'pathos' mean as a persuasive appeal?", a: "An appeal to the reader's emotions" },
    { q: "What does 'logos' mean as a persuasive appeal?", a: "An appeal to logic and reason (facts, statistics)" },
    { q: "Why is it important to address counterarguments?", a: "It shows you understand both sides and strengthens your argument" },
    { q: "What makes evidence 'credible'?", a: "It comes from reliable, authoritative sources" },
    { q: "What is the difference between a fact and an opinion?", a: "Facts can be proven; opinions are personal views" },
    { q: "What is 'bias' in writing?", a: "An unfair preference for one side that may distort the truth" },
    { q: "Identify the appeal: 'Nine out of ten doctors recommend this product.'", a: "Ethos (credibility) and logos (statistics)" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateAdvancedWritingProblems(count: number): Problem[] {
  const items = [
    { q: "What is a 'rhetorical question'?", a: "A question asked for effect, not expecting an answer" },
    { q: "What is 'syntax' in writing?", a: "The arrangement of words and sentences" },
    { q: "What is 'diction' in writing?", a: "The writer's choice of words" },
    { q: "What is 'tone' in writing?", a: "The writer's attitude toward the subject or audience" },
    { q: "What is 'voice' in writing?", a: "The writer's unique style, personality, and perspective" },
    { q: "What is an 'anaphora'?", a: "Repetition of a word or phrase at the beginning of successive clauses" },
    { q: "What is 'parallelism' in writing?", a: "Using the same grammatical structure in a series of phrases or clauses" },
    { q: "What is 'juxtaposition'?", a: "Placing two contrasting ideas or images side by side for effect" },
    { q: "Identify the device: 'It was the best of times, it was the worst of times.'", a: "Antithesis (juxtaposition of opposites)" },
    { q: "What is an 'allusion' in writing?", a: "A brief reference to a well-known person, place, event, or text" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function generateScienceProblems(skillName: string, count: number): Problem[] {
  const skill = skillName.toLowerCase();
  if (skill.includes("water cycle")) return generateWaterCycleProblems(count);
  if (skill.includes("states of matter") || skill.includes("matter")) return generateStatesOfMatterProblems(count);
  if (skill.includes("food chain") || skill.includes("ecosystem")) return generateFoodChainProblems(count);
  if (skill.includes("cell") || skill.includes("biology") || skill.includes("mitosis") || skill.includes("dna")) return generateBiologyProblems(count);
  if (skill.includes("photosynthesis") || skill.includes("life science")) return generateLifeScienceProblems(count);
  if (skill.includes("earth science") || skill.includes("rock") || skill.includes("plate") || skill.includes("weather")) return generateEarthScienceProblems(count);
  if (skill.includes("force") || skill.includes("motion") || skill.includes("newton") || skill.includes("physics") || skill.includes("energy")) return generatePhysicsProblems(count);
  if (skill.includes("chemistry") || skill.includes("atom") || skill.includes("element") || skill.includes("bond") || skill.includes("reaction")) return generateChemistryProblems(count);
  return generateLifeScienceProblems(count);
}

function generateWaterCycleProblems(count: number): Problem[] {
  const items = [
    { q: "What process turns liquid water into water vapor?", a: "Evaporation" },
    { q: "What is it called when water vapor turns into liquid droplets?", a: "Condensation" },
    { q: "What do we call rain, snow, or hail falling from clouds?", a: "Precipitation" },
    { q: "What energy source drives the water cycle?", a: "The Sun" },
    { q: "Where does most evaporation on Earth come from?", a: "Oceans and large bodies of water" },
    { q: "True or False: Water vapour is invisible.", a: "True" },
    { q: "What is runoff?", a: "Water that flows over land into rivers and streams" },
    { q: "What is transpiration?", a: "Water released from plants into the atmosphere" },
    { q: "What is groundwater?", a: "Water that seeps into the ground and is stored underground" },
    { q: "How do clouds form?", a: "Water vapor cools and condenses around tiny particles in the atmosphere" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateStatesOfMatterProblems(count: number): Problem[] {
  const items = [
    { q: "Which state has a definite shape and volume?", a: "Solid", opts: ["Gas","Liquid","Plasma","Solid"], type: "multiple_choice" as const },
    { q: "What is evaporation?", a: "A liquid changing to a gas", type: "short_answer" as const },
    { q: "What is condensation?", a: "A gas changing to a liquid", type: "short_answer" as const },
    { q: "What is sublimation?", a: "A solid changing directly to a gas (e.g., dry ice)", type: "short_answer" as const },
    { q: "In which state are particles farthest apart?", a: "Gas", type: "short_answer" as const },
    { q: "Water freezes at ___ °C.", a: "0", type: "fill_blank" as const },
    { q: "Water boils at ___ °C.", a: "100", type: "fill_blank" as const },
    { q: "True or False: A gas has a definite volume.", a: "False", type: "short_answer" as const },
    { q: "What state change occurs when water vapour hits a cold window?", a: "Condensation", type: "short_answer" as const },
    { q: "What is deposition?", a: "A gas changing directly to a solid (e.g., frost forming)", type: "short_answer" as const },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: item.type, question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateFoodChainProblems(count: number): Problem[] {
  const items = [
    { q: "What is a producer in a food chain?", a: "An organism that makes its own food (plants)" },
    { q: "What is a consumer?", a: "An organism that eats other organisms" },
    { q: "In the chain: grass → rabbit → fox, what role does the rabbit play?", a: "Primary consumer / herbivore" },
    { q: "What is the ultimate source of energy for most food chains?", a: "The Sun" },
    { q: "What is a decomposer? Give one example.", a: "Breaks down dead matter — e.g. fungi, bacteria, worms" },
    { q: "True or False: Energy increases as you move up a food chain.", a: "False (energy decreases — only ~10% transfers to each level)" },
    { q: "A herbivore eats:", a: "Only plants", opts: ["Only plants","Only animals","Both plants and animals","Neither"], type: "multiple_choice" as const },
    { q: "What is a predator?", a: "An animal that hunts and eats other animals" },
    { q: "What is prey?", a: "An animal that is hunted and eaten by predators" },
    { q: "What would happen if all the plants in an ecosystem disappeared?", a: "Herbivores would die, then carnivores would also die (ecosystem collapse)" },
  ];
  return shuffleArray(items).slice(0, count).map((item) => ({ id: nanoid(8), type: (item as any).type ?? "short_answer", question: item.q, options: (item as any).opts, answer: item.a, points: 1 }));
}

function generateLifeScienceProblems(count: number): Problem[] {
  const items = [
    { q: "What do plants need to make food?", a: "Sunlight, water, and carbon dioxide" },
    { q: "What process do plants use to make food?", a: "Photosynthesis" },
    { q: "What gas do plants release during photosynthesis?", a: "Oxygen" },
    { q: "What gas do plants take in during photosynthesis?", a: "Carbon dioxide" },
    { q: "What is the powerhouse of the cell?", a: "Mitochondria" },
    { q: "What does the nucleus do?", a: "Controls cell activities and contains DNA" },
    { q: "True or False: All living things are made of cells.", a: "True" },
    { q: "What is the difference between plant and animal cells?", a: "Plant cells have a cell wall and chloroplasts; animal cells do not" },
    { q: "What is DNA?", a: "A molecule that contains genetic information for all living organisms" },
    { q: "What is the function of chlorophyll?", a: "Absorbs sunlight for photosynthesis; gives plants their green colour" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateEarthScienceProblems(count: number): Problem[] {
  const items = [
    { q: "What causes day and night?", a: "Earth rotating on its axis" },
    { q: "What causes the seasons?", a: "Earth's tilted axis as it orbits the Sun" },
    { q: "What type of rock forms from cooled lava?", a: "Igneous rock" },
    { q: "What type of rock forms from layers of compressed sediment?", a: "Sedimentary rock" },
    { q: "What type of rock forms under extreme heat and pressure?", a: "Metamorphic rock" },
    { q: "What is the rock cycle?", a: "The continuous process by which rocks are formed, broken down, and reformed" },
    { q: "What is plate tectonics?", a: "The theory that Earth's crust is made of moving plates" },
    { q: "What causes earthquakes?", a: "Movement of tectonic plates creating stress and sudden release of energy" },
    { q: "What is the difference between weather and climate?", a: "Weather is short-term atmospheric conditions; climate is long-term patterns" },
    { q: "What is erosion?", a: "The wearing away of rock and soil by wind, water, or ice" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateBiologyProblems(count: number): Problem[] {
  const items = [
    { q: "What is mitosis?", a: "Cell division that produces two genetically identical daughter cells" },
    { q: "What is meiosis?", a: "Cell division that produces four genetically unique sex cells (gametes)" },
    { q: "What is the function of DNA?", a: "To carry genetic information and instructions for building proteins" },
    { q: "What is RNA?", a: "A molecule that carries genetic instructions from DNA to make proteins" },
    { q: "What is a gene?", a: "A segment of DNA that codes for a specific trait or protein" },
    { q: "What is a chromosome?", a: "A thread-like structure of DNA and protein in the nucleus" },
    { q: "How many chromosomes do humans have?", a: "46 (23 pairs)" },
    { q: "What is natural selection?", a: "The process where organisms better adapted to their environment survive and reproduce" },
    { q: "What is a mutation?", a: "A change in the DNA sequence" },
    { q: "What is homeostasis?", a: "The ability of an organism to maintain a stable internal environment" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generatePhysicsProblems(count: number): Problem[] {
  const items = [
    { q: "What is Newton's First Law of Motion?", a: "An object at rest stays at rest; an object in motion stays in motion unless acted upon by an unbalanced force" },
    { q: "What is Newton's Second Law of Motion?", a: "F = ma (Force equals mass times acceleration)" },
    { q: "What is Newton's Third Law of Motion?", a: "For every action there is an equal and opposite reaction" },
    { q: "What is the formula for speed?", a: "Speed = Distance ÷ Time" },
    { q: "What is kinetic energy?", a: "Energy of motion (KE = ½mv²)" },
    { q: "What is potential energy?", a: "Stored energy due to position (PE = mgh)" },
    { q: "What is the law of conservation of energy?", a: "Energy cannot be created or destroyed, only transformed from one form to another" },
    { q: "What is gravity?", a: "The force of attraction between masses" },
    { q: "What is friction?", a: "A force that opposes motion between surfaces in contact" },
    { q: "What is the unit of force?", a: "Newton (N)" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

function generateChemistryProblems(count: number): Problem[] {
  const items = [
    { q: "What is an atom?", a: "The smallest unit of an element that retains its chemical properties" },
    { q: "What are the three subatomic particles?", a: "Protons, neutrons, and electrons" },
    { q: "What is the atomic number?", a: "The number of protons in an atom" },
    { q: "What is an ionic bond?", a: "A bond formed by the transfer of electrons between atoms" },
    { q: "What is a covalent bond?", a: "A bond formed by the sharing of electrons between atoms" },
    { q: "What is the pH scale?", a: "A scale from 0-14 measuring acidity (0-6 acidic, 7 neutral, 8-14 alkaline/basic)" },
    { q: "What is an exothermic reaction?", a: "A chemical reaction that releases energy (heat)" },
    { q: "What is an endothermic reaction?", a: "A chemical reaction that absorbs energy (heat)" },
    { q: "What is the periodic table?", a: "A table organizing all known elements by atomic number and properties" },
    { q: "What is a catalyst?", a: "A substance that speeds up a chemical reaction without being consumed" },
  ];
  return shuffleArray(items).slice(0, count).map((s) => ({ id: nanoid(8), type: "short_answer" as const, question: s.q, answer: s.a, points: 1 }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deduplicateProblems(problems: Problem[]): Problem[] {
  const seen = new Set<string>();
  return problems.filter((p) => {
    if (seen.has(p.question)) return false;
    seen.add(p.question);
    return true;
  });
}