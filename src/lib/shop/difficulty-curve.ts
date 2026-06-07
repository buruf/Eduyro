// src/lib/shop/difficulty-curve.ts
// Progressive difficulty curves for all skills.
// Maps sheet number (1-100) to exact difficulty parameters.
// Implements Kumon philosophy: invisible gradual progression.
// Each skill's 100 sheets are distributed across sub-skills.

export interface DifficultyParams {
  minA?: number;
  maxA?: number;
  minB?: number;
  maxB?: number;
  requiresCarry?: boolean;
  requiresBorrow?: boolean;
  minDenominator?: number;
  maxDenominator?: number;
  maxNumerator?: number;
  maxCoefficient?: number;
  maxConstant?: number;
  maxAnswer?: number;
  subSkill: string;       // specific skill name for this sheet
  subSkillLabel: string;  // display label
  gradeLevel: string;     // e.g. "Grade 1"
  difficultyStars: number; // 1-5 for display
  learningObjective: string; // "Today I will..."
  mode: "tutorial" | "practice" | "assessment";
}

function lerp(t: number, a: number, b: number): number {
  return Math.round(a + (b - a) * t);
}

function progress(sheet: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (sheet - start) / (end - start)));
}

function mode(sheet: number): "tutorial" | "practice" | "assessment" {
  // Assessment every 10th sheet
  if (sheet % 10 === 0) return "assessment";
  // Tutorial on first sheet of each sub-skill group (handled per skill)
  return "practice";
}

// ── ADDITION ──────────────────────────────────────────────────────────────────
export function additionDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 7 || sheet === 16 || sheet === 26 || sheet === 41 || sheet === 61 || sheet === 76 || sheet === 91;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 6) return { minA:1, maxA:3, minB:1, maxB:2, subSkill:"add-foundations", subSkillLabel:"Adding within 5", gradeLevel:"Grade K", difficultyStars:1, learningObjective:"add two small numbers to get a sum of 5 or less", mode:m };
  if (sheet <= 15) return { minA:1, maxA:5, minB:1, maxB:4, subSkill:"add-within-10", subSkillLabel:"Adding within 10", gradeLevel:"Grade K–1", difficultyStars:1, learningObjective:"add two single-digit numbers to get a sum of 10 or less", mode:m };
  if (sheet <= 25) { const t=progress(sheet,15,25); return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:lerp(t,4,9), subSkill:"add-single-digit", subSkillLabel:"Single-digit addition", gradeLevel:"Grade 1", difficultyStars:2, learningObjective:"add any two single-digit numbers fluently", mode:m }; }
  if (sheet <= 40) return { minA:10, maxA:19, minB:1, maxB:9, requiresCarry:false, subSkill:"add-teen", subSkillLabel:"Adding with teen numbers", gradeLevel:"Grade 1", difficultyStars:2, learningObjective:"add a teen number and a single digit", mode:m };
  if (sheet <= 60) { const t=progress(sheet,40,60); return { minA:10, maxA:lerp(t,20,49), minB:10, maxB:lerp(t,15,39), requiresCarry:false, subSkill:"add-2digit-no-carry", subSkillLabel:"2-digit addition (no regrouping)", gradeLevel:"Grade 2", difficultyStars:3, learningObjective:"add two 2-digit numbers without regrouping", mode:m }; }
  if (sheet <= 75) { const t=progress(sheet,60,75); return { minA:lerp(t,15,49), maxA:lerp(t,39,89), minB:lerp(t,8,29), maxB:lerp(t,19,49), requiresCarry:true, subSkill:"add-2digit-carry", subSkillLabel:"2-digit addition with regrouping", gradeLevel:"Grade 2", difficultyStars:4, learningObjective:"add two 2-digit numbers with regrouping (carrying)", mode:m }; }
  if (sheet <= 90) { const t=progress(sheet,75,90); return { minA:lerp(t,100,200), maxA:lerp(t,299,499), minB:lerp(t,10,100), maxB:lerp(t,99,299), requiresCarry:false, subSkill:"add-3digit", subSkillLabel:"3-digit addition", gradeLevel:"Grade 3", difficultyStars:4, learningObjective:"add three-digit numbers", mode:m }; }
  { const t=progress(sheet,90,100); return { minA:lerp(t,127,300), maxA:lerp(t,399,699), minB:lerp(t,100,200), maxB:lerp(t,299,499), requiresCarry:true, subSkill:"add-3digit-carry", subSkillLabel:"3-digit addition with regrouping", gradeLevel:"Grade 3", difficultyStars:5, learningObjective:"add three-digit numbers with multiple regroupings", mode:m }; }
}

// ── SUBTRACTION ───────────────────────────────────────────────────────────────
export function subtractionDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 7 || sheet === 16 || sheet === 26 || sheet === 41 || sheet === 61 || sheet === 76 || sheet === 91;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 6) return { minA:2, maxA:5, minB:1, maxB:2, subSkill:"sub-foundations", subSkillLabel:"Subtracting within 5", gradeLevel:"Grade K–1", difficultyStars:1, learningObjective:"subtract small numbers within 5", mode:m };
  if (sheet <= 15) return { minA:3, maxA:9, minB:1, maxB:4, subSkill:"sub-within-10", subSkillLabel:"Subtracting within 10", gradeLevel:"Grade 1", difficultyStars:1, learningObjective:"subtract within 10", mode:m };
  if (sheet <= 25) { const t=progress(sheet,15,25); return { minA:5, maxA:lerp(t,9,18), minB:1, maxB:lerp(t,5,9), requiresBorrow:false, subSkill:"sub-single", subSkillLabel:"Single-digit subtraction", gradeLevel:"Grade 1", difficultyStars:2, learningObjective:"subtract single-digit numbers fluently", mode:m }; }
  if (sheet <= 40) return { minA:10, maxA:29, minB:1, maxB:9, requiresBorrow:false, subSkill:"sub-teen", subSkillLabel:"Subtracting from teen numbers", gradeLevel:"Grade 1–2", difficultyStars:2, learningObjective:"subtract a single digit from a teen number", mode:m };
  if (sheet <= 60) { const t=progress(sheet,40,60); return { minA:20, maxA:lerp(t,39,79), minB:10, maxB:lerp(t,19,39), requiresBorrow:false, subSkill:"sub-2digit-no-borrow", subSkillLabel:"2-digit subtraction (no borrowing)", gradeLevel:"Grade 2", difficultyStars:3, learningObjective:"subtract 2-digit numbers without borrowing", mode:m }; }
  if (sheet <= 75) { const t=progress(sheet,60,75); return { minA:lerp(t,21,50), maxA:lerp(t,50,99), minB:lerp(t,9,29), maxB:lerp(t,19,49), requiresBorrow:true, subSkill:"sub-2digit-borrow", subSkillLabel:"2-digit subtraction with borrowing", gradeLevel:"Grade 2–3", difficultyStars:4, learningObjective:"subtract 2-digit numbers with borrowing", mode:m }; }
  if (sheet <= 90) { const t=progress(sheet,75,90); return { minA:lerp(t,110,200), maxA:lerp(t,299,599), minB:lerp(t,10,100), maxB:lerp(t,99,199), requiresBorrow:false, subSkill:"sub-3digit", subSkillLabel:"3-digit subtraction", gradeLevel:"Grade 3", difficultyStars:4, learningObjective:"subtract three-digit numbers", mode:m }; }
  { const t=progress(sheet,90,100); return { minA:lerp(t,200,400), maxA:lerp(t,499,899), minB:lerp(t,100,200), maxB:lerp(t,299,499), requiresBorrow:true, subSkill:"sub-3digit-borrow", subSkillLabel:"3-digit subtraction with borrowing", gradeLevel:"Grade 3", difficultyStars:5, learningObjective:"subtract three-digit numbers with multiple borrowings", mode:m }; }
}

// ── MULTIPLICATION ────────────────────────────────────────────────────────────
export function multiplicationDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 11 || sheet === 21 || sheet === 31 || sheet === 46 || sheet === 66 || sheet === 81;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 10) return { minA:1, maxA:2, minB:1, maxB:5, subSkill:"mul-1-2", subSkillLabel:"×1 and ×2 tables", gradeLevel:"Grade 2", difficultyStars:1, learningObjective:"multiply by 1 and 2", mode:m };
  if (sheet <= 20) return { minA:1, maxA:3, minB:1, maxB:10, subSkill:"mul-3", subSkillLabel:"×3 table", gradeLevel:"Grade 2–3", difficultyStars:2, learningObjective:"multiply by 3", mode:m };
  if (sheet <= 30) return { minA:1, maxA:5, minB:1, maxB:10, subSkill:"mul-4-5", subSkillLabel:"×4 and ×5 tables", gradeLevel:"Grade 3", difficultyStars:2, learningObjective:"multiply by 4 and 5", mode:m };
  if (sheet <= 45) { const t=progress(sheet,30,45); return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:12, subSkill:"mul-6-9", subSkillLabel:"×6 through ×9 tables", gradeLevel:"Grade 3–4", difficultyStars:3, learningObjective:"multiply by 6, 7, 8, and 9", mode:m }; }
  if (sheet <= 65) { const t=progress(sheet,45,65); return { minA:2, maxA:lerp(t,9,12), minB:2, maxB:12, subSkill:"mul-all-tables", subSkillLabel:"Complete times tables", gradeLevel:"Grade 4", difficultyStars:3, learningObjective:"recall all multiplication facts to 12×12", mode:m }; }
  if (sheet <= 80) { const t=progress(sheet,65,80); return { minA:lerp(t,10,19), maxA:lerp(t,19,49), minB:1, maxB:9, subSkill:"mul-2digit-1digit", subSkillLabel:"2-digit × 1-digit", gradeLevel:"Grade 4", difficultyStars:4, learningObjective:"multiply a 2-digit number by a 1-digit number", mode:m }; }
  { const t=progress(sheet,80,100); return { minA:lerp(t,10,20), maxA:lerp(t,49,99), minB:lerp(t,10,20), maxB:lerp(t,19,49), subSkill:"mul-2digit-2digit", subSkillLabel:"2-digit × 2-digit", gradeLevel:"Grade 4–5", difficultyStars:5, learningObjective:"multiply two 2-digit numbers", mode:m }; }
}

// ── DIVISION ──────────────────────────────────────────────────────────────────
export function divisionDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 11 || sheet === 21 || sheet === 31 || sheet === 46 || sheet === 66 || sheet === 81;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 10) return { minA:1, maxA:2, minB:1, maxB:5, subSkill:"div-1-2", subSkillLabel:"Dividing by 1 and 2", gradeLevel:"Grade 3", difficultyStars:1, learningObjective:"divide by 1 and 2", mode:m };
  if (sheet <= 20) return { minA:1, maxA:3, minB:1, maxB:10, subSkill:"div-3", subSkillLabel:"Dividing by 3", gradeLevel:"Grade 3", difficultyStars:2, learningObjective:"divide by 3", mode:m };
  if (sheet <= 30) return { minA:1, maxA:5, minB:1, maxB:10, subSkill:"div-4-5", subSkillLabel:"Dividing by 4 and 5", gradeLevel:"Grade 3", difficultyStars:2, learningObjective:"divide by 4 and 5", mode:m };
  if (sheet <= 45) { const t=progress(sheet,30,45); return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:12, subSkill:"div-6-9", subSkillLabel:"Dividing by 6 through 9", gradeLevel:"Grade 3–4", difficultyStars:3, learningObjective:"divide by 6, 7, 8, and 9", mode:m }; }
  if (sheet <= 65) { const t=progress(sheet,45,65); return { minA:2, maxA:lerp(t,9,12), minB:2, maxB:12, subSkill:"div-all", subSkillLabel:"All division facts", gradeLevel:"Grade 4", difficultyStars:3, learningObjective:"recall all division facts to 144÷12", mode:m }; }
  if (sheet <= 80) { const t=progress(sheet,65,80); return { minA:lerp(t,10,19), maxA:lerp(t,19,49), minB:1, maxB:9, subSkill:"div-long-no-rem", subSkillLabel:"Long division (no remainder)", gradeLevel:"Grade 4–5", difficultyStars:4, learningObjective:"divide 2-digit numbers with no remainder", mode:m }; }
  { const t=progress(sheet,80,100); return { minA:lerp(t,10,20), maxA:lerp(t,49,99), minB:lerp(t,2,9), maxB:lerp(t,9,12), subSkill:"div-long-rem", subSkillLabel:"Long division with remainders", gradeLevel:"Grade 5", difficultyStars:5, learningObjective:"divide numbers and express remainders", mode:m }; }
}

// ── FRACTIONS ─────────────────────────────────────────────────────────────────
export function fractionsDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 16 || sheet === 31 || sheet === 46 || sheet === 61 || sheet === 76 || sheet === 89;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 15) return { minDenominator:2, maxDenominator:4, maxNumerator:3, subSkill:"frac-identify", subSkillLabel:"Identifying fractions", gradeLevel:"Grade 3–4", difficultyStars:1, learningObjective:"identify and write fractions as parts of a whole", mode:m };
  if (sheet <= 30) return { minDenominator:2, maxDenominator:10, maxNumerator:9, subSkill:"frac-simplify", subSkillLabel:"Simplifying fractions", gradeLevel:"Grade 4", difficultyStars:2, learningObjective:"simplify fractions to their lowest terms", mode:m };
  if (sheet <= 45) return { minDenominator:2, maxDenominator:8, maxNumerator:7, subSkill:"frac-add-same", subSkillLabel:"Adding — same denominator", gradeLevel:"Grade 4", difficultyStars:3, learningObjective:"add fractions with the same denominator", mode:m };
  if (sheet <= 60) { const t=progress(sheet,45,60); return { minDenominator:2, maxDenominator:lerp(t,6,12), maxNumerator:lerp(t,5,11), subSkill:"frac-add-unlike", subSkillLabel:"Adding — unlike denominators", gradeLevel:"Grade 5", difficultyStars:3, learningObjective:"add fractions with different denominators using the LCM", mode:m }; }
  if (sheet <= 75) return { minDenominator:2, maxDenominator:8, maxNumerator:7, subSkill:"frac-multiply", subSkillLabel:"Multiplying fractions", gradeLevel:"Grade 5–6", difficultyStars:4, learningObjective:"multiply fractions and simplify the result", mode:m };
  if (sheet <= 88) return { minDenominator:2, maxDenominator:8, maxNumerator:7, subSkill:"frac-divide", subSkillLabel:"Dividing fractions", gradeLevel:"Grade 6", difficultyStars:4, learningObjective:"divide fractions by multiplying by the reciprocal", mode:m };
  { const t=progress(sheet,88,100); return { minDenominator:2, maxDenominator:lerp(t,4,8), maxNumerator:lerp(t,3,7), subSkill:"frac-mixed", subSkillLabel:"Mixed numbers", gradeLevel:"Grade 6", difficultyStars:5, learningObjective:"convert and operate with mixed numbers and improper fractions", mode:m }; }
}

// ── DECIMALS ──────────────────────────────────────────────────────────────────
export function decimalsDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 16 || sheet === 31 || sheet === 51 || sheet === 71 || sheet === 86;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 15) return { minA:1, maxA:9, subSkill:"dec-place-tenths", subSkillLabel:"Decimal place value — tenths", gradeLevel:"Grade 4–5", difficultyStars:1, learningObjective:"identify the tenths digit in a decimal number", mode:m };
  if (sheet <= 30) return { minA:1, maxA:99, subSkill:"dec-place-hundredths", subSkillLabel:"Decimal place value — hundredths", gradeLevel:"Grade 5", difficultyStars:2, learningObjective:"identify tenths and hundredths digits", mode:m };
  if (sheet <= 50) { const t=progress(sheet,30,50); return { minA:lerp(t,1,5), maxA:lerp(t,9,49), subSkill:"dec-add-sub", subSkillLabel:"Adding and subtracting decimals", gradeLevel:"Grade 5", difficultyStars:3, learningObjective:"add and subtract decimal numbers", mode:m }; }
  if (sheet <= 70) { const t=progress(sheet,50,70); return { minA:lerp(t,1,5), maxA:lerp(t,9,49), subSkill:"dec-multiply", subSkillLabel:"Multiplying decimals", gradeLevel:"Grade 5–6", difficultyStars:4, learningObjective:"multiply decimal numbers", mode:m }; }
  if (sheet <= 85) return { minA:1, maxA:99, subSkill:"dec-divide", subSkillLabel:"Dividing decimals", gradeLevel:"Grade 6", difficultyStars:4, learningObjective:"divide decimal numbers", mode:m };
  return { minA:1, maxA:100, subSkill:"dec-percent", subSkillLabel:"Percentages and conversions", gradeLevel:"Grade 6", difficultyStars:5, learningObjective:"convert between decimals, fractions, and percentages", mode:m };
}

// ── PRE-ALGEBRA ───────────────────────────────────────────────────────────────
export function preAlgebraDifficulty(sheet: number): DifficultyParams {
  const isFirst = sheet === 1 || sheet === 21 || sheet === 41 || sheet === 66 || sheet === 86;
  const m = isFirst ? "tutorial" : mode(sheet);

  if (sheet <= 20) { const t=progress(sheet,0,20); return { maxCoefficient:1, maxConstant:lerp(t,5,15), maxAnswer:lerp(t,10,20), subSkill:"alg-one-add-sub", subSkillLabel:"One-step equations: + and −", gradeLevel:"Grade 7", difficultyStars:2, learningObjective:"solve one-step equations using addition and subtraction", mode:m }; }
  if (sheet <= 40) { const t=progress(sheet,20,40); return { maxCoefficient:lerp(t,1,5), maxConstant:lerp(t,5,15), maxAnswer:lerp(t,10,30), subSkill:"alg-one-mul-div", subSkillLabel:"One-step equations: × and ÷", gradeLevel:"Grade 7", difficultyStars:2, learningObjective:"solve one-step equations using multiplication and division", mode:m }; }
  if (sheet <= 65) { const t=progress(sheet,40,65); return { maxCoefficient:lerp(t,2,6), maxConstant:lerp(t,3,12), maxAnswer:lerp(t,5,20), subSkill:"alg-two-step", subSkillLabel:"Two-step equations", gradeLevel:"Grade 7–8", difficultyStars:3, learningObjective:"solve two-step equations", mode:m }; }
  if (sheet <= 85) return { maxCoefficient:5, maxConstant:15, maxAnswer:25, subSkill:"alg-inequalities", subSkillLabel:"Inequalities", gradeLevel:"Grade 8", difficultyStars:4, learningObjective:"solve and graph simple inequalities", mode:m };
  return { maxCoefficient:6, maxConstant:20, maxAnswer:30, subSkill:"alg-word", subSkillLabel:"Word problems", gradeLevel:"Grade 8", difficultyStars:5, learningObjective:"translate and solve word problems using algebra", mode:m };
}

// ── Master resolver ───────────────────────────────────────────────────────────
export type ShopSkill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" |
  "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

export function getDifficultyForSheet(skill: ShopSkill, sheetNumber: number): DifficultyParams {
  switch (skill) {
    case "ADDITION":        return additionDifficulty(sheetNumber);
    case "SUBTRACTION":     return subtractionDifficulty(sheetNumber);
    case "MULTIPLICATION":  return multiplicationDifficulty(sheetNumber);
    case "DIVISION":        return divisionDifficulty(sheetNumber);
    case "FRACTIONS":       return fractionsDifficulty(sheetNumber);
    case "DECIMALS":        return decimalsDifficulty(sheetNumber);
    case "PRE_ALGEBRA":     return preAlgebraDifficulty(sheetNumber);
    default: return { subSkill:"general", subSkillLabel:"Practice", gradeLevel:"Grade 7+", difficultyStars:3, learningObjective:"practice this skill", mode:"practice" };
  }
}

// Skill level codes for display
export const SKILL_LEVEL_CODE: Record<ShopSkill, string> = {
  ADDITION: "M3", SUBTRACTION: "M4", MULTIPLICATION: "M5", DIVISION: "M6",
  FRACTIONS: "M7", DECIMALS: "M8", RATIOS: "M9", PRE_ALGEBRA: "M10",
  LINEAR_EQUATIONS: "M11", POLYNOMIALS: "M12",
};
