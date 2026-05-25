// src/lib/shop/sample-problems.ts
// Generates sample problems for the in-browser preview.
// Uses the same warmup logic as the easy band of each skill pack,
// but does NOT include answer keys (samples are view-only).

import { SheetProblem } from "@/lib/worksheet/render-sheet";

type Skill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION";

/**
 * Generate ~50 problems for one sample sheet of a given skill.
 * Sheet number changes the seed so sheet 1 and sheet 2 have distinct problems.
 */
export function generateShopSampleProblems(
  skill: Skill,
  sheetNumber: number
): SheetProblem[] {
  const seed = sheetNumber * 13 + skill.length;
  switch (skill) {
    case "ADDITION":
      return additionProblems(seed);
    case "SUBTRACTION":
      return subtractionProblems(seed);
    case "MULTIPLICATION":
      return multiplicationProblems(seed);
    case "DIVISION":
      return divisionProblems(seed);
  }
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function additionProblems(seed: number): SheetProblem[] {
  const r = rng(seed);
  const out: SheetProblem[] = [];
  // First 4 are deterministic warmups
  out.push(...[
    { question: "1 + 1 =", answer: "2" },
    { question: "1 + 2 =", answer: "3" },
    { question: "2 + 2 =", answer: "4" },
    { question: "2 + 3 =", answer: "5" },
  ].map((p, i) => ({ ...p, id: `samp-add-warm-${i}` })));
  // Then 46 random adds up to 10
  for (let i = 0; i < 46; i++) {
    const a = Math.floor(r() * 9) + 1;
    const b = Math.floor(r() * 9) + 1;
    out.push({ id: `samp-add-${i}`, question: `${a} + ${b} =`, answer: String(a + b) });
  }
  return out;
}

function subtractionProblems(seed: number): SheetProblem[] {
  const r = rng(seed);
  const out: SheetProblem[] = [];
  out.push(...[
    { question: "2 − 1 =", answer: "1" },
    { question: "3 − 1 =", answer: "2" },
    { question: "3 − 2 =", answer: "1" },
    { question: "4 − 2 =", answer: "2" },
  ].map((p, i) => ({ ...p, id: `samp-sub-warm-${i}` })));
  for (let i = 0; i < 46; i++) {
    const a = Math.floor(r() * 9) + 1;
    const b = Math.floor(r() * a) + 0; // always ≤ a so result is non-negative
    out.push({ id: `samp-sub-${i}`, question: `${a} − ${b} =`, answer: String(a - b) });
  }
  return out;
}

function multiplicationProblems(seed: number): SheetProblem[] {
  const r = rng(seed);
  const out: SheetProblem[] = [];
  out.push(...[
    { question: "2 × 1 =", answer: "2" },
    { question: "2 × 2 =", answer: "4" },
    { question: "3 × 1 =", answer: "3" },
    { question: "3 × 2 =", answer: "6" },
  ].map((p, i) => ({ ...p, id: `samp-mul-warm-${i}` })));
  for (let i = 0; i < 46; i++) {
    const a = Math.floor(r() * 8) + 2;
    const b = Math.floor(r() * 8) + 2;
    out.push({ id: `samp-mul-${i}`, question: `${a} × ${b} =`, answer: String(a * b) });
  }
  return out;
}

function divisionProblems(seed: number): SheetProblem[] {
  const r = rng(seed);
  const out: SheetProblem[] = [];
  out.push(...[
    { question: "2 ÷ 2 =", answer: "1" },
    { question: "4 ÷ 2 =", answer: "2" },
    { question: "6 ÷ 2 =", answer: "3" },
    { question: "6 ÷ 3 =", answer: "2" },
  ].map((p, i) => ({ ...p, id: `samp-div-warm-${i}` })));
  for (let i = 0; i < 46; i++) {
    const b = Math.floor(r() * 8) + 2;
    const q = Math.floor(r() * 8) + 2;
    const a = b * q;
    out.push({ id: `samp-div-${i}`, question: `${a} ÷ ${b} =`, answer: String(q) });
  }
  return out;
}
