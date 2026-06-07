// src/lib/shop/difficulty-curve.ts
// Defines progressive difficulty curves for each skill.
// Maps sheet number (1-100) to exact difficulty parameters.
// Implements Kumon philosophy: invisible gradual progression,
// mastery at each level before advancing, no sudden jumps.

export interface DifficultyParams {
  // Arithmetic bounds
  minA?: number;    // minimum value of first operand
  maxA?: number;    // maximum value of first operand
  minB?: number;    // minimum value of second operand
  maxB?: number;    // maximum value of second operand
  requiresCarry?: boolean;   // addition must carry
  requiresBorrow?: boolean;  // subtraction must borrow
  digits?: number;           // number of digits in operands
  
  // Fraction bounds
  minDenominator?: number;
  maxDenominator?: number;
  maxNumerator?: number;
  
  // Algebra bounds
  maxCoefficient?: number;
  maxConstant?: number;
  maxAnswer?: number;
  
  // General
  label?: string;  // human-readable description for this difficulty point
}

// Linear interpolation helper
function lerp(t: number, a: number, b: number): number {
  return Math.round(a + (b - a) * t);
}

// Get progress within a range: returns 0.0 to 1.0
function progress(sheet: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (sheet - start) / (end - start)));
}

// ── ADDITION: 100 sheets, 8 stages ────────────────────────────────────────────
export function additionDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 5)  return { minA:1, maxA:3, minB:1, maxB:3, label:"Sums to 6" };
  if (sheet <= 10) return { minA:1, maxA:5, minB:1, maxB:4, label:"Sums to 9" };
  if (sheet <= 20) {
    const t = progress(sheet, 10, 20);
    return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:lerp(t,4,9), label:"Single digit" };
  }
  if (sheet <= 35) {
    const t = progress(sheet, 20, 35);
    return { minA:10, maxA:lerp(t,14,19), minB:1, maxB:9, requiresCarry:false, label:"Teen + single" };
  }
  if (sheet <= 50) {
    const t = progress(sheet, 35, 50);
    return { minA:10, maxA:lerp(t,20,49), minB:10, maxB:lerp(t,20,49), requiresCarry:false, label:"2-digit no carry" };
  }
  if (sheet <= 70) {
    const t = progress(sheet, 50, 70);
    return { minA:lerp(t,15,49), maxA:lerp(t,29,79), minB:lerp(t,8,29), maxB:lerp(t,15,49), requiresCarry:true, label:"2-digit with carry" };
  }
  if (sheet <= 85) {
    const t = progress(sheet, 70, 85);
    return { minA:lerp(t,100,200), maxA:lerp(t,199,499), minB:lerp(t,10,100), maxB:lerp(t,99,299), requiresCarry:false, label:"3-digit no carry" };
  }
  {
    const t = progress(sheet, 85, 100);
    return { minA:lerp(t,127,300), maxA:lerp(t,299,699), minB:lerp(t,100,200), maxB:lerp(t,199,499), requiresCarry:true, label:"3-digit with carry" };
  }
}

// ── SUBTRACTION: 100 sheets, 8 stages ────────────────────────────────────────
export function subtractionDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 5)  return { minA:2, maxA:5, minB:1, maxB:2, label:"Differences to 4" };
  if (sheet <= 10) return { minA:3, maxA:9, minB:1, maxB:4, label:"Single digit easy" };
  if (sheet <= 20) {
    const t = progress(sheet, 10, 20);
    return { minA:5, maxA:lerp(t,9,18), minB:1, maxB:lerp(t,5,9), requiresBorrow:false, label:"Single digit" };
  }
  if (sheet <= 35) {
    const t = progress(sheet, 20, 35);
    return { minA:10, maxA:lerp(t,19,29), minB:1, maxB:9, requiresBorrow:false, label:"Teen - single" };
  }
  if (sheet <= 50) {
    const t = progress(sheet, 35, 50);
    return { minA:20, maxA:lerp(t,39,79), minB:10, maxB:lerp(t,19,39), requiresBorrow:false, label:"2-digit no borrow" };
  }
  if (sheet <= 70) {
    const t = progress(sheet, 50, 70);
    return { minA:lerp(t,21,50), maxA:lerp(t,50,99), minB:lerp(t,9,29), maxB:lerp(t,19,49), requiresBorrow:true, label:"2-digit with borrow" };
  }
  if (sheet <= 85) {
    const t = progress(sheet, 70, 85);
    return { minA:lerp(t,110,200), maxA:lerp(t,299,599), minB:lerp(t,10,100), maxB:lerp(t,99,199), requiresBorrow:false, label:"3-digit no borrow" };
  }
  {
    const t = progress(sheet, 85, 100);
    return { minA:lerp(t,200,400), maxA:lerp(t,499,899), minB:lerp(t,100,200), maxB:lerp(t,299,499), requiresBorrow:true, label:"3-digit with borrow" };
  }
}

// ── MULTIPLICATION: 100 sheets, 7 stages ─────────────────────────────────────
export function multiplicationDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 8)  return { minA:1, maxA:2, minB:1, maxB:5, label:"×1 and ×2 tables" };
  if (sheet <= 16) return { minA:1, maxA:3, minB:1, maxB:10, label:"×3 table" };
  if (sheet <= 25) return { minA:1, maxA:5, minB:1, maxB:10, label:"×4 and ×5 tables" };
  if (sheet <= 40) {
    const t = progress(sheet, 25, 40);
    return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:12, label:"×6 to ×9 tables" };
  }
  if (sheet <= 60) {
    const t = progress(sheet, 40, 60);
    return { minA:2, maxA:lerp(t,9,12), minB:2, maxB:12, label:"Full times tables" };
  }
  if (sheet <= 80) {
    const t = progress(sheet, 60, 80);
    return { minA:lerp(t,10,19), maxA:lerp(t,19,49), minB:1, maxB:9, label:"Multi-digit × single" };
  }
  {
    const t = progress(sheet, 80, 100);
    return { minA:lerp(t,10,20), maxA:lerp(t,49,99), minB:lerp(t,10,20), maxB:lerp(t,19,49), label:"Multi-digit × multi-digit" };
  }
}

// ── DIVISION: 100 sheets, 7 stages ────────────────────────────────────────────
export function divisionDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 8)  return { minA:1, maxA:2, minB:1, maxB:5, label:"÷1 and ÷2" };
  if (sheet <= 16) return { minA:1, maxA:3, minB:1, maxB:10, label:"÷3" };
  if (sheet <= 25) return { minA:1, maxA:5, minB:1, maxB:10, label:"÷4 and ÷5" };
  if (sheet <= 40) {
    const t = progress(sheet, 25, 40);
    return { minA:1, maxA:lerp(t,5,9), minB:1, maxB:12, label:"÷6 to ÷9" };
  }
  if (sheet <= 60) {
    const t = progress(sheet, 40, 60);
    return { minA:2, maxA:lerp(t,9,12), minB:2, maxB:12, label:"All divisors to 12" };
  }
  if (sheet <= 80) {
    const t = progress(sheet, 60, 80);
    return { minA:lerp(t,10,19), maxA:lerp(t,19,49), minB:1, maxB:9, label:"Long division no remainder" };
  }
  {
    const t = progress(sheet, 80, 100);
    return { minA:lerp(t,10,20), maxA:lerp(t,49,99), minB:lerp(t,2,9), maxB:lerp(t,9,12), label:"Long division with remainder" };
  }
}

// ── FRACTIONS: 100 sheets, 7 stages ──────────────────────────────────────────
export function fractionsDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 10) return { minDenominator:2, maxDenominator:4, maxNumerator:3, label:"Halves and quarters" };
  if (sheet <= 20) return { minDenominator:2, maxDenominator:8, maxNumerator:7, label:"Simple fractions" };
  if (sheet <= 35) return { minDenominator:2, maxDenominator:10, maxNumerator:9, label:"Simplifying fractions" };
  if (sheet <= 50) return { minDenominator:2, maxDenominator:8, maxNumerator:7, label:"Add/subtract same denominator" };
  if (sheet <= 65) {
    const t = progress(sheet, 50, 65);
    return { minDenominator:2, maxDenominator:lerp(t,6,12), maxNumerator:lerp(t,5,11), label:"Add/subtract unlike denominators" };
  }
  if (sheet <= 80) return { minDenominator:2, maxDenominator:8, maxNumerator:7, label:"Multiply fractions" };
  {
    const t = progress(sheet, 80, 100);
    return { minDenominator:2, maxDenominator:lerp(t,6,10), maxNumerator:lerp(t,5,9), label:"Divide fractions & mixed numbers" };
  }
}

// ── DECIMALS: 100 sheets ──────────────────────────────────────────────────────
export function decimalsDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 15) return { minA:1, maxA:9, label:"Place value — tenths" };
  if (sheet <= 30) return { minA:1, maxA:99, label:"Place value — hundredths" };
  if (sheet <= 50) {
    const t = progress(sheet, 30, 50);
    return { minA:lerp(t,1,5), maxA:lerp(t,9,49), label:"Add/subtract decimals" };
  }
  if (sheet <= 70) {
    const t = progress(sheet, 50, 70);
    return { minA:lerp(t,1,5), maxA:lerp(t,9,49), label:"Multiply decimals" };
  }
  if (sheet <= 85) return { minA:1, maxA:99, label:"Divide decimals" };
  return { minA:1, maxA:100, label:"Percentages & conversions" };
}

// ── PRE-ALGEBRA: 100 sheets ───────────────────────────────────────────────────
export function preAlgebraDifficulty(sheet: number): DifficultyParams {
  if (sheet <= 20) {
    const t = progress(sheet, 0, 20);
    return { maxCoefficient:1, maxConstant:lerp(t,5,15), maxAnswer:lerp(t,10,20), label:"One-step: x + a = b" };
  }
  if (sheet <= 40) {
    const t = progress(sheet, 20, 40);
    return { maxCoefficient:lerp(t,1,5), maxConstant:lerp(t,5,15), maxAnswer:lerp(t,10,30), label:"One-step: ax = b" };
  }
  if (sheet <= 65) {
    const t = progress(sheet, 40, 65);
    return { maxCoefficient:lerp(t,2,6), maxConstant:lerp(t,3,12), maxAnswer:lerp(t,5,20), label:"Two-step equations" };
  }
  if (sheet <= 85) return { maxCoefficient:5, maxConstant:15, maxAnswer:25, label:"Inequalities" };
  return { maxCoefficient:6, maxConstant:20, maxAnswer:30, label:"Word problems" };
}

// Master difficulty resolver
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
    // Ratios, Linear, Polynomials — use band-based progress for now
    default: return { label: "Progressive" };
  }
}
