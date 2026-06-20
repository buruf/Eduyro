// src/lib/shop/difficulty-scorer.ts
// Deterministic difficulty scoring for every problem type.
// Every problem gets a numeric score. No subjectivity.
// Validator uses these scores to enforce progression.

export interface ProblemFeatures {
  // Arithmetic
  maxOperand?: number;        // largest number in the problem
  minOperand?: number;        // smallest number in the problem
  carryCount?: number;        // number of carrying/borrowing operations
  digitCount?: number;        // number of digits in largest operand
  addendCount?: number;       // how many numbers being added
  // Format complexity
  isMissingAddend?: boolean;  // ___ + b = c
  isWordProblem?: boolean;    // requires language parsing
  isReverse?: boolean;        // subtraction presented as missing addend
  // Fraction specific
  denominator?: number;       // size of denominator
  gcfSize?: number;           // GCF needed for simplification
  requiresLCM?: boolean;      // unlike denominators need LCM
  lcmValue?: number;          // size of LCM
  operandCount?: number;      // number of fraction operands
  // General
  conceptDepth?: number;      // 1=recognition, 2=procedure, 3=application
}

export interface DifficultyScore {
  total: number;              // overall score
  breakdown: Record<string, number>; // which factors contributed how much
}

// ── Addition scoring ──────────────────────────────────────────────────────────
export function scoreAddition(features: ProblemFeatures): DifficultyScore {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // Base: size of operands
  const maxOp = features.maxOperand ?? 1;
  const digitScore = Math.floor(Math.log10(maxOp + 1)) * 30; // 1-digit=0, 2-digit=30, 3-digit=60
  breakdown.digitCount = digitScore;
  total += digitScore;

  // Operand magnitude within digit class
  const magnitudeScore = Math.round((maxOp / Math.pow(10, Math.floor(Math.log10(maxOp + 1)))) * 10);
  breakdown.magnitude = magnitudeScore;
  total += magnitudeScore;

  // Carrying
  const carryScore = (features.carryCount ?? 0) * 20;
  breakdown.carry = carryScore;
  total += carryScore;

  // Missing addend (reverse thinking)
  if (features.isMissingAddend) {
    breakdown.missingAddend = 25;
    total += 25;
  }

  // Word problem (language parsing overhead)
  if (features.isWordProblem) {
    breakdown.wordProblem = 15;
    total += 15;
  }

  // Multiple addends
  const addendScore = ((features.addendCount ?? 2) - 2) * 10;
  breakdown.addendCount = addendScore;
  total += addendScore;

  return { total, breakdown };
}

// ── Subtraction scoring ───────────────────────────────────────────────────────
export function scoreSubtraction(features: ProblemFeatures): DifficultyScore {
  const breakdown: Record<string, number> = {};
  let total = 0;

  const maxOp = features.maxOperand ?? 1;
  const digitScore = Math.floor(Math.log10(maxOp + 1)) * 30;
  breakdown.digitCount = digitScore;
  total += digitScore;

  const magnitudeScore = Math.round((maxOp / Math.pow(10, Math.floor(Math.log10(maxOp + 1)))) * 10);
  breakdown.magnitude = magnitudeScore;
  total += magnitudeScore;

  // Borrowing is harder than carrying
  const borrowScore = (features.carryCount ?? 0) * 25;
  breakdown.borrow = borrowScore;
  total += borrowScore;

  if (features.isMissingAddend) { breakdown.missing = 25; total += 25; }
  if (features.isWordProblem)   { breakdown.word = 15;    total += 15; }

  return { total, breakdown };
}

// ── Multiplication scoring ────────────────────────────────────────────────────
export function scoreMultiplication(features: ProblemFeatures): DifficultyScore {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // Difficulty scales with the size of the larger factor (times-table position)
  // and with how many digits the operands carry — single facts are easy,
  // multi-digit products require the standard algorithm.
  const factorScore = (features.maxOperand ?? 1) * 4;
  breakdown.factor = factorScore;
  total += factorScore;

  const digitScore = ((features.digitCount ?? 1) - 1) * 35;
  breakdown.digitCount = digitScore;
  total += digitScore;

  if (features.isMissingAddend) { breakdown.missingFactor = 22; total += 22; }
  if (features.isWordProblem)   { breakdown.word = 18;          total += 18; }

  return { total, breakdown };
}

// ── Division scoring ──────────────────────────────────────────────────────────
export function scoreDivision(features: ProblemFeatures): DifficultyScore {
  const breakdown: Record<string, number> = {};
  let total = 0;

  const divisorScore = (features.minOperand ?? 1) * 5;
  breakdown.divisor = divisorScore;
  total += divisorScore;

  const digitScore = ((features.digitCount ?? 1) - 1) * 35;
  breakdown.digitCount = digitScore;
  total += digitScore;

  if (features.carryCount) { breakdown.remainder = 20; total += 20; }
  if (features.isWordProblem) { breakdown.word = 18; total += 18; }

  return { total, breakdown };
}

// ── Fraction scoring ──────────────────────────────────────────────────────────
export function scoreFraction(features: ProblemFeatures): DifficultyScore {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // Denominator size is primary difficulty driver
  const denom = features.denominator ?? 2;
  const denomScore = denom * 5;
  breakdown.denominator = denomScore;
  total += denomScore;

  // GCF simplification required
  if (features.gcfSize && features.gcfSize > 1) {
    const gcfScore = Math.floor(Math.log2(features.gcfSize)) * 10;
    breakdown.gcf = gcfScore;
    total += gcfScore;
  }

  // LCM required (unlike denominators)
  if (features.requiresLCM) {
    const lcmScore = Math.floor(Math.log2(features.lcmValue ?? 4)) * 15;
    breakdown.lcm = lcmScore;
    total += lcmScore;
  }

  // Operation complexity: identify=1, simplify=2, add=3, multiply=4, divide=5
  const opScores: Record<string, number> = {
    "identify": 0, "simplify": 15, "add-same": 20,
    "add-unlike": 35, "multiply": 40, "divide": 50,
  };
  const op = features.conceptDepth ? Object.keys(opScores)[features.conceptDepth - 1] : "identify";

  if (features.isWordProblem) { breakdown.word = 10; total += 10; }

  return { total, breakdown };
}

// ── Generic scorer — dispatches to specific scorer ────────────────────────────
export function scoreProblem(
  question: string,
  answer: string,
  skill: string
): DifficultyScore {
  const features = extractFeatures(question, answer, skill);

  switch (skill) {
    case "ADDITION":        return scoreAddition(features);
    case "SUBTRACTION":     return scoreSubtraction(features);
    case "MULTIPLICATION":  return scoreMultiplication(features);
    case "DIVISION":        return scoreDivision(features);
    case "FRACTIONS":       return scoreFraction(features);
    default:                return scoreAddition(features); // fallback
  }
}

// ── Feature extractor ─────────────────────────────────────────────────────────
export function extractFeatures(question: string, answer: string, skill: string): ProblemFeatures {
  const features: ProblemFeatures = {};

  if (skill === "ADDITION" || skill === "SUBTRACTION" || skill === "MULTIPLICATION" || skill === "DIVISION") {
    // Extract numbers from question
    const nums = question.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length > 0) {
      features.maxOperand = Math.max(...nums);
      features.minOperand = Math.min(...nums);
      features.digitCount = String(features.maxOperand).length;
      features.addendCount = nums.length;
    }

    // Check for carrying in addition
    if (skill === "ADDITION" && nums.length >= 2) {
      let carry = 0;
      const a = String(nums[0]).padStart(10, "0").split("").reverse();
      const b = String(nums[1]).padStart(10, "0").split("").reverse();
      for (let i = 0; i < a.length; i++) {
        const sum = parseInt(a[i]) + parseInt(b[i]) + carry;
        carry = sum >= 10 ? 1 : 0;
      }
      features.carryCount = carry > 0 ? 1 : 0;
    }

    // Check for borrowing in subtraction (stored in carryCount — same
    // "regrouping required" concept the validator and blueprint reason about)
    if (skill === "SUBTRACTION" && nums.length >= 2 && !question.includes("___")) {
      let borrow = 0;
      const minuend = Math.max(nums[0], nums[1]);
      const subtrahend = Math.min(nums[0], nums[1]);
      const a = String(minuend).padStart(10, "0").split("").reverse();
      const b = String(subtrahend).padStart(10, "0").split("").reverse();
      for (let i = 0; i < a.length; i++) {
        const diff = parseInt(a[i]) - parseInt(b[i]) - borrow;
        borrow = diff < 0 ? 1 : 0;
      }
      features.carryCount = borrow > 0 ? 1 : 0;
    }

    // Division remainder — flagged via "r" in the answer (e.g. "7 r 2")
    if (skill === "DIVISION") {
      features.carryCount = /\br\s*\d/.test(answer) ? 1 : 0;
    }

    // Missing addend / missing factor / missing operand — all represented as ___
    features.isMissingAddend = question.includes("___");

    // Word problem
    features.isWordProblem = question.includes("?") &&
      !question.match(/^\d+\s*[+\-x\/]\s*\d+/) &&
      question.length > 20;
  }

  if (skill === "FRACTIONS") {
    // Extract denominator from \frac{n}{d}
    const fracMatch = question.match(/\\frac\{(\d+)\}\{(\d+)\}/);
    if (fracMatch) {
      features.denominator = parseInt(fracMatch[2]);
    }

    // Detect operation type
    if (question.includes("/") && question.includes("\\frac")) features.conceptDepth = 5; // divide
    else if (question.includes("x") && question.includes("\\frac")) features.conceptDepth = 4; // multiply
    else if (question.includes("+") && question.match(/\\frac.*\\frac/)) {
      // Check if unlike denominators
      const fracs = question.match(/\\frac\{(\d+)\}\{(\d+)\}/g) ?? [];
      if (fracs.length >= 2) {
        const d1 = parseInt((fracs[0] ?? "").match(/\{(\d+)\}$/)?.[1] ?? "2");
        const d2 = parseInt((fracs[1] ?? "").match(/\{(\d+)\}$/)?.[1] ?? "2");
        features.requiresLCM = d1 !== d2;
        if (features.requiresLCM) {
          const gcdVal = (a: number, b: number): number => b === 0 ? a : gcdVal(b, a % b);
          features.lcmValue = (d1 * d2) / gcdVal(d1, d2);
        }
        features.conceptDepth = features.requiresLCM ? 3 : 3;
      }
    }
    else if (question.includes("Simplify")) features.conceptDepth = 2;
    else features.conceptDepth = 1; // identify

    features.isWordProblem = question.includes("?") && !question.includes("\\frac");
  }

  return features;
}
