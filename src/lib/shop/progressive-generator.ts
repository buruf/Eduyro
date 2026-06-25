// src/lib/shop/progressive-generator.ts
// Curriculum-graph-driven worksheet generator.
// Reads from curriculum-graph.ts for progression plan.
// Generates questions only AFTER the progression plan exists.

import { nanoid } from "nanoid";
import { getMicroSkillForSheet, type MicroSkill, type Stage } from "./curriculum-graph";
import { validateWorksheet, validateAndLog } from "./worksheet-validator";
import { buildBlueprints, problemFitsBlueprint, type DifficultyBlueprint } from "./difficulty-blueprint";
import { buildWorksheetBlueprint, type WorksheetBlueprint } from "./worksheet-blueprint";
import { getDifficultyForSheet, SKILL_LEVEL_CODE } from "./difficulty-curve";
import { generateFdpSheet } from "./fdp-engine";
import { generateArithmeticSheet, isArithmeticSkill } from "./arithmetic-engine";
import { generateAdvancedSheet, isAdvancedSkill } from "./advanced-engine";
import { generateGeometrySheet, isGeometrySkill } from "./geometry-engine";
import { adaptiveCount } from "@/lib/math/layout-capacity";

// Fisher-Yates shuffle using a seeded RNG — deterministic per attempt.
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Expand a stage's planned form distribution into a shuffled per-problem
// form sequence — guarantees the generator hits the exact counts the
// blueprint planned, rather than drifting via random per-problem picks.
function expandFormSequence(distribution: WorksheetBlueprint["questionDistribution"][number], rng: () => number): string[] {
  const seq: string[] = [];
  for (const { form, count } of distribution.forms) {
    for (let i = 0; i < count; i++) seq.push(form);
  }
  return shuffle(seq, rng);
}

// ShopSkill lives in ./skills (single source of truth); re-exported here for
// back-compat with existing import sites.
export type { ShopSkill } from "./skills";
import type { ShopSkill } from "./skills";

export interface WorksheetProblem {
  id: string;
  type: "arithmetic" | "fill_blank" | "short_answer" | "multiple_choice" | "true_false";
  question: string;
  answer: string;
  /** Present for multiple_choice / true_false items — the selectable option VALUES
   *  (not letters), so grading stays a plain value match. */
  options?: string[];
  /** Answer-input shape ("point" for interactive graphing items). */
  answerType?: string;
  /** Render spec for an interactive graphing item (never includes the answer). */
  interactive?: { kind: "vertex-drag" | "plot-point" | "plot-line"; a?: number; curve?: { a: number; h: number; k: number }; xRange: [number, number]; yRange: [number, number]; snap: number };
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
    /** Parent level name (e.g. "Pre-Calculus") shown beside the unit for context. */
    levelName?: string;
    subSkillLabel: string;
    gradeLevel: string;
    difficultyStars: number;
    learningObjective: string;
    /** Optional once-per-sheet instruction shown instead of repeating it per problem. */
    directive?: string;
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

function zoneForStageIndex(stageIndex: number): 1 | 2 | 3 | 4 | 5 {
  return (stageIndex + 1) as 1 | 2 | 3 | 4 | 5;
}

// ── Question generators per form ──────────────────────────────────────────────

function generateFromForm(form: string, stage: Stage, rng: () => number, stageIndex: number = 0, problemIndex: number = 0): [string, string] {
  const c = stage.constraints;

  // ── Addition forms ──
  if (form === "a+b") {
    const minA = c.minA ?? 1, maxA = c.maxA ?? 9;
    const minB = c.minB ?? 1, maxB = c.maxB ?? 9;
    const fixedB = c.fixedB;
    let a: number, b: number, attempts = 0;
    // Introduction (stage 0) and guided (stage 1) with fixed b:
    // generate SEQUENTIALLY so student sees the pattern clearly
    // e.g. 1+1, 2+1, 3+1 not shuffled
    if ((stageIndex === 0 || stageIndex === 1) && fixedB !== undefined) {
      const range = maxA - minA + 1;
      a = minA + (problemIndex % range);
      return [`${a} + ${fixedB}`, String(a + fixedB)];
    }
    do {
      a = ri(rng, minA, maxA);
      b = fixedB !== undefined ? fixedB : ri(rng, minB, maxB);
      attempts++;
      if (attempts > 30) break;
      if (c.carry === true  && maxA > 9 && (a%10)+(b%10) < 10) continue;
      if (c.carry === false && maxA > 9 && (a%10)+(b%10) >= 10) continue;
    } while (true);
    return [`${a} + ${b}`, String(a + b)];
  }

  if (form === "missing-addend-a") {
    const fixedB = c.fixedB ?? c.minB ?? 1;
    // Sequential for independent practice stage (3): ___+1=2, ___+1=3... ___+1=10
    if (stageIndex === 3) {
      const minA = c.minA ?? 1;
      const a = minA + (problemIndex % (c.maxA ?? 9));
      return [`___ + ${fixedB} = ${a + fixedB}`, String(a)];
    }
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`___ + ${fixedB} = ${a + fixedB}`, String(a)];
  }

  if (form === "missing-addend-b") {
    const fixedB = c.fixedB ?? c.minB ?? 1;
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`${a} + ___ = ${a + fixedB}`, String(fixedB)];
  }

  if (form === "word-add") {
    const a = ri(rng, c.minA ?? 10, c.maxA ?? 49);
    const b = ri(rng, c.minB ?? 10, c.maxB ?? 49);
    const contexts = [
      [`There are ${a} red apples and ${b} green apples. How many apples in total?`, String(a+b)],
      [`A shop had ${a} books. They received ${b} more. How many books now?`, String(a+b)],
      [`${a} students are in the hall. ${b} more arrive. How many students?`, String(a+b)],
    ];
    const ctx = contexts[Math.floor(rng() * contexts.length)] as [string,string];
    return ctx;
  }
  // ── Subtraction forms ──
  if (form === "a-b") {
    const minA = c.minA ?? 1, maxA = c.maxA ?? 9;
    const minB = c.minB ?? 0, maxB = c.maxB ?? 9;
    const fixedB = c.fixedB;
    let a: number, b: number, attempts = 0;
    // Sequential presentation for early stages with a fixed subtrahend —
    // lets the student see the -n pattern in order: 9-1, 8-1, 7-1...
    if ((stageIndex === 0 || stageIndex === 1) && fixedB !== undefined) {
      const range = maxA - minA + 1;
      a = maxA - (problemIndex % range);
      return [`${a} - ${fixedB}`, String(a - fixedB)];
    }
    do {
      a = ri(rng, minA, maxA);
      b = fixedB !== undefined ? fixedB : ri(rng, minB, Math.min(maxB, a));
      attempts++;
      if (attempts > 30) break;
      if (a < b) { [a, b] = [b, a]; } // never produce a negative result
      if (c.borrow === true  && maxA > 9 && (a%10) >= (b%10)) continue;
      if (c.borrow === false && maxA > 9 && (a%10) < (b%10)) continue;
    } while (true);
    return [`${a} - ${b}`, String(a - b)];
  }

  if (form === "missing-subtrahend") {
    // a - ___ = c  →  solve for ___
    const minA = c.minA ?? 1, maxA = c.maxA ?? 9;
    const fixedB = c.fixedB ?? c.minB ?? 1;
    if (stageIndex === 3) {
      const range = maxA - minA + 1;
      const a = minA + fixedB + (problemIndex % Math.max(1, range - fixedB));
      return [`${a} - ___ = ${a - fixedB}`, String(fixedB)];
    }
    const a = ri(rng, minA + fixedB, maxA);
    return [`${a} - ___ = ${a - fixedB}`, String(fixedB)];
  }

  if (form === "missing-minuend") {
    // ___ - b = c  →  solve for ___
    const fixedB = c.fixedB ?? c.minB ?? 1;
    const result = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`___ - ${fixedB} = ${result}`, String(result + fixedB)];
  }

  if (form === "word-sub") {
    const a = ri(rng, c.minA ?? 10, c.maxA ?? 49);
    const b = ri(rng, c.minB ?? 1, Math.min(c.maxB ?? a, a));
    const contexts: [string,string][] = [
      [`There are ${a} apples in a basket. ${b} are eaten. How many are left?`, String(a-b)],
      [`A library has ${a} books. ${b} are checked out. How many remain on the shelf?`, String(a-b)],
      [`${a} students are on the bus. ${b} get off at the first stop. How many are still on board?`, String(a-b)],
      [`A baker made ${a} muffins. ${b} were sold. How many are left?`, String(a-b)],
    ];
    const ctx = contexts[Math.floor(rng() * contexts.length)];
    return ctx;
  }

  // ── Multiplication forms ──
  if (form === "a*b") {
    const minA = c.minA ?? 0, maxA = c.maxA ?? 9;
    const minB = c.minB ?? 0, maxB = c.maxB ?? 9;
    const fixedB = c.fixedB;
    let a: number, b: number;
    // Sequential presentation for early stages with a fixed factor —
    // lets the student see the times-table pattern in order: 1×3, 2×3, 3×3...
    if ((stageIndex === 0 || stageIndex === 1) && fixedB !== undefined) {
      const range = maxA - minA + 1;
      a = minA + (problemIndex % range);
      return [`${a} × ${fixedB}`, String(a * fixedB)];
    }
    a = ri(rng, minA, maxA);
    b = fixedB !== undefined ? fixedB : ri(rng, minB, maxB);
    return [`${a} × ${b}`, String(a * b)];
  }

  if (form === "missing-factor-a") {
    const fixedB = c.fixedB ?? c.minB ?? 1;
    if (stageIndex === 3) {
      const minA = c.minA ?? 1;
      const a = minA + (problemIndex % (c.maxA ?? 9));
      return [`___ × ${fixedB} = ${a * fixedB}`, String(a)];
    }
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`___ × ${fixedB} = ${a * fixedB}`, String(a)];
  }

  if (form === "missing-factor-b") {
    const fixedB = c.fixedB ?? c.minB ?? 1;
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`${a} × ___ = ${a * fixedB}`, String(fixedB)];
  }

  if (form === "word-mul") {
    const a = ri(rng, c.minA ?? 2, c.maxA ?? 9);
    const b = ri(rng, c.minB ?? 2, c.maxB ?? 9);
    const contexts: [string,string][] = [
      [`A box holds ${b} crayons. There are ${a} boxes. How many crayons in total?`, String(a*b)],
      [`Each shelf has ${b} books. There are ${a} shelves. How many books altogether?`, String(a*b)],
      [`A garden has ${a} rows with ${b} flowers in each row. How many flowers in total?`, String(a*b)],
      [`${a} students each bring ${b} pencils. How many pencils in total?`, String(a*b)],
    ];
    const ctx = contexts[Math.floor(rng() * contexts.length)];
    return ctx;
  }

  // ── Division forms ──
  if (form === "a/b") {
    const minB = c.minB ?? 1, maxB = c.maxB ?? 9;
    const fixedB = c.fixedB;
    const b = fixedB !== undefined ? fixedB : ri(rng, minB, maxB);
    // Sequential presentation for early stages — quotient counts up in order
    if ((stageIndex === 0 || stageIndex === 1) && fixedB !== undefined) {
      const minQ = c.minA ?? 1, maxQ = c.maxA ?? 9;
      const range = maxQ - minQ + 1;
      const q = minQ + (problemIndex % range);
      return [`${q * b} ÷ ${b}`, String(q)];
    }
    const q = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`${q * b} ÷ ${b}`, String(q)];
  }

  if (form === "div-remainder") {
    const b = c.fixedB ?? ri(rng, c.minB ?? 2, c.maxB ?? 9);
    const q = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    const r = ri(rng, 1, b - 1);
    return [`${q * b + r} ÷ ${b}`, `${q} r ${r}`];
  }

  if (form === "missing-dividend") {
    const b = c.fixedB ?? ri(rng, c.minB ?? 1, c.maxB ?? 9);
    const q = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`___ ÷ ${b} = ${q}`, String(q * b)];
  }

  if (form === "word-div") {
    const b = ri(rng, c.minB ?? 2, c.maxB ?? 9);
    const q = ri(rng, c.minA ?? 2, c.maxA ?? 9);
    const total = q * b;
    const contexts: [string,string][] = [
      [`There are ${total} apples shared equally among ${b} baskets. How many apples per basket?`, String(q)],
      [`A teacher has ${total} stickers to give equally to ${b} students. How many does each student get?`, String(q)],
      [`${total} chairs are arranged into ${b} equal rows. How many chairs per row?`, String(q)],
      [`A baker splits ${total} cookies evenly into ${b} boxes. How many cookies per box?`, String(q)],
    ];
    const ctx = contexts[Math.floor(rng() * contexts.length)];
    return ctx;
  }

  // ── Fraction forms ──
  const denoms = c.denominators ?? (c.denominator ? [c.denominator] : [2,3,4]);
  const maxD = c.maxDenominator;
  const dPool = maxD ? Array.from({length: maxD-1}, (_,i) => i+2) : denoms;
  const d = dPool[Math.floor(rng() * dPool.length)];

  // Fraction identification — DIRECT math only (no stories/contexts).
  // The task is stated as a plain mathematical instruction.
  if (form === "identify-frac-desc" || form === "identify-frac-context" ||
      form === "identify-frac" || form === "write-frac") {
    const n = ri(rng, 1, d-1);
    const prompts = [
      `Write the fraction: ${n} shaded out of ${d}`,
      `Write the fraction: ${n} out of ${d}`,
    ];
    return [prompts[Math.floor(rng() * prompts.length)], `\u005Cfrac{${n}}{${d}}`];
  }

  if (form === "simplify-frac") {
    let n: number, attempts = 0;
    do {
      n = ri(rng, 2, d-1);
      attempts++;
    } while (gcd(n,d) === 1 && attempts < 20);
    if (gcd(n,d) === 1) n = Math.floor(d/2);
    const g = gcd(n,d);
    return [`Simplify \u005Cfrac{${n}}{${d}}`, g===d?"1":`\u005Cfrac{${n/g}}{${d/g}}`];
  }

  if (form === "add-same-frac") {
    const safeD = Math.max(3, d);
    const n1 = ri(rng, 1, safeD-1);
    const n2 = ri(rng, 1, safeD-1);
    const sum = n1+n2;
    const g = gcd(sum, safeD);
    const ans = safeD/g===1?String(sum/g):g>1?`\u005Cfrac{${sum/g}}{${safeD/g}}`:`\u005Cfrac{${sum}}{${safeD}}`;
    return [`\u005Cfrac{${n1}}{${safeD}} + \u005Cfrac{${n2}}{${safeD}}`, ans];
  }

  if (form === "add-unlike-frac") {
    const d2pool = denoms.filter(x => x !== d);
    const d2 = d2pool.length > 0 ? d2pool[Math.floor(rng()*d2pool.length)] : d+1;
    const n1 = ri(rng, 1, d-1);
    const n2 = ri(rng, 1, d2-1);
    const lcm = (d*d2)/gcd(d,d2);
    const sumN = n1*(lcm/d) + n2*(lcm/d2);
    const g = gcd(sumN,lcm);
    const ans = g===lcm?"1":`\u005Cfrac{${sumN/g}}{${lcm/g}}`;
    return [`\u005Cfrac{${n1}}{${d}} + \u005Cfrac{${n2}}{${d2}}`, ans];
  }

  if (form === "mul-frac") {
    const d2 = dPool[Math.floor(rng()*dPool.length)];
    const n1 = ri(rng,1,d-1), n2 = ri(rng,1,Math.max(1,d2-1));
    const resN=n1*n2, resD=d*d2;
    const g=gcd(resN,resD);
    return [`\u005Cfrac{${n1}}{${d}} × \u005Cfrac{${n2}}{${d2}}`, g===resD?"1":`\u005Cfrac{${resN/g}}{${resD/g}}`];
  }

  if (form === "div-frac") {
    const d2 = dPool[Math.floor(rng()*dPool.length)];
    const n1 = ri(rng,1,d-1), n2 = ri(rng,1,Math.max(1,d2-1));
    const resN=n1*d2, resD=d*n2;
    const g=gcd(resN,resD);
    return [`\u005Cfrac{${n1}}{${d}} ÷ \u005Cfrac{${n2}}{${d2}}`, g===resD?"1":`\u005Cfrac{${resN/g}}{${resD/g}}`];
  }

  return [`Problem`, "—"];
}

// ── Worked examples from micro-skill ─────────────────────────────────────────

function buildWorkedExample(microSkill: MicroSkill): WorkedExample {
  const firstStage = microSkill.stages[0];
  const firstForm = firstStage.questionForms[0];
  const c = firstStage.constraints;

  switch (microSkill.id) {
    case "add-1": return { problem:`3 + 1 =`, steps:[`Start at 3`,`Count up 1: 3 → 4`,`The answer is 4`], answer:`4` };
    case "add-2": return { problem:`4 + 2 =`, steps:[`Start at 4`,`Count up 2: 4 → 5 → 6`,`The answer is 6`], answer:`6` };
    case "add-3": return { problem:`4 + 3 =`, steps:[`Start at 4`,`Count up 3: 4 → 5 → 6 → 7`,`The answer is 7`], answer:`7` };
    case "add-4": return { problem:`3 + 4 =`, steps:[`Start at 4 (bigger number)`,`Count up 3: 4 → 5 → 6 → 7`,`The answer is 7`], answer:`7` };
    case "add-5": return { problem:`3 + 5 =`, steps:[`Start at 5`,`Count up 3: 5 → 6 → 7 → 8`,`The answer is 8`], answer:`8` };
    case "add-6": return { problem:`4 + 6 =`, steps:[`Start at 6`,`Count up 4: 6 → 7 → 8 → 9 → 10`,`The answer is 10`], answer:`10` };
    case "add-7": return { problem:`3 + 7 =`, steps:[`7 needs 3 to reach 10`,`3 + 7 = 10`,`The answer is 10`], answer:`10` };
    case "add-8": return { problem:`4 + 8 =`, steps:[`8 is close to 10`,`8 + 2 = 10, then 2 more: 10 + 2 = 12`,`The answer is 12`], answer:`12` };
    case "add-9": return { problem:`5 + 9 =`, steps:[`9 is almost 10`,`5 + 10 = 15, then subtract 1: 15 - 1 = 14`,`The answer is 14`], answer:`14` };

    case "add-2d-1d-no-carry": return {
      problem:`23 + 5 =`,
      steps:[`Ones column: 3 + 5 = 8`,`Tens column stays the same: 2`,`Answer: 28`],
      answer:`28`,
    };
    case "add-2d-2d-no-carry": return {
      problem:`34 + 25 =`,
      steps:[`Ones column: 4 + 5 = 9`,`Tens column: 3 + 2 = 5`,`Answer: 59`],
      answer:`59`,
    };
    case "add-2d-2d-carry": return {
      problem:`37 + 45 =`,
      steps:[`Ones: 7 + 5 = 12 — write 2, carry 1`,`Tens: 3 + 4 + 1 (carried) = 8`,`Answer: 82`],
      answer:`82`,
    };
    case "add-3digit": return {
      problem:`234 + 153 =`,
      steps:[`Ones: 4 + 3 = 7`,`Tens: 3 + 5 = 8`,`Hundreds: 2 + 1 = 3`,`Answer: 387`],
      answer:`387`,
    };
    case "add-3digit-carry": return {
      problem:`357 + 245 =`,
      steps:[`Ones: 7 + 5 = 12 — write 2, carry 1`,`Tens: 5 + 4 + 1 = 10 — write 0, carry 1`,`Hundreds: 3 + 2 + 1 = 6`,`Answer: 602`],
      answer:`602`,
    };

    case "sub-1": return { problem:`4 - 1 =`, steps:[`Start at 4`,`Count back 1: 4 → 3`,`The answer is 3`], answer:`3` };
    case "sub-2": return { problem:`6 - 2 =`, steps:[`Start at 6`,`Count back 2: 6 → 5 → 4`,`The answer is 4`], answer:`4` };
    case "sub-3": return { problem:`7 - 3 =`, steps:[`Start at 7`,`Count back 3: 7 → 6 → 5 → 4`,`The answer is 4`], answer:`4` };
    case "sub-4": return { problem:`9 - 4 =`, steps:[`Start at 9`,`Count back 4: 9 → 8 → 7 → 6 → 5`,`The answer is 5`], answer:`5` };
    case "sub-5": return { problem:`9 - 5 =`, steps:[`9 is close to 10. 10-5=5`,`9 is 1 less than 10, so 9-5 is 1 less than 5`,`The answer is 4`], answer:`4` };
    case "sub-6": return { problem:`11 - 6 =`, steps:[`Think addition: 6 + ? = 11`,`6 + 5 = 11`,`The answer is 5`], answer:`5` };
    case "sub-7": return { problem:`12 - 7 =`, steps:[`Break 12 into 10 + 2`,`10 - 7 = 3, then add the 2: 3 + 2 = 5`,`The answer is 5`], answer:`5` };
    case "sub-8": return { problem:`13 - 8 =`, steps:[`Break 13 into 10 + 3`,`10 - 8 = 2, then add the 3: 2 + 3 = 5`,`The answer is 5`], answer:`5` };
    case "sub-9": return { problem:`14 - 9 =`, steps:[`9 is almost 10. 14 - 10 = 4`,`Subtracted 1 too many, so add 1 back: 4 + 1 = 5`,`The answer is 5`], answer:`5` };

    case "sub-2d-1d-no-borrow": return {
      problem:`28 - 5 =`,
      steps:[`Ones column: 8 - 5 = 3`,`Tens column stays the same: 2`,`Answer: 23`],
      answer:`23`,
    };
    case "sub-2d-2d-no-borrow": return {
      problem:`58 - 24 =`,
      steps:[`Ones column: 8 - 4 = 4`,`Tens column: 5 - 2 = 3`,`Answer: 34`],
      answer:`34`,
    };
    case "sub-2d-2d-borrow": return {
      problem:`52 - 27 =`,
      steps:[`Ones: 2 is less than 7 — borrow 1 ten from the 5`,`Now ones: 12 - 7 = 5. Tens: 4 - 2 = 2`,`Answer: 25`],
      answer:`25`,
    };
    case "sub-3digit": return {
      problem:`568 - 234 =`,
      steps:[`Ones: 8 - 4 = 4`,`Tens: 6 - 3 = 3`,`Hundreds: 5 - 2 = 3`,`Answer: 334`],
      answer:`334`,
    };
    case "sub-3digit-borrow": return {
      problem:`523 - 167 =`,
      steps:[`Ones: 3 is less than 7 — borrow from tens: 13 - 7 = 6`,`Tens: 1 (after lending) is less than 6 — borrow from hundreds: 11 - 6 = 5`,`Hundreds: 4 - 1 = 4`,`Answer: 356`],
      answer:`356`,
    };

    case "mul-0": return { problem:`3 × 0 =`, steps:[`Multiplying by 0 always gives 0 — there are 0 groups of 3`,`The answer is 0`], answer:`0` };
    case "mul-1": return { problem:`3 × 1 =`, steps:[`Multiplying by 1 keeps the number the same — 1 group of 3 is just 3`,`The answer is 3`], answer:`3` };
    case "mul-2": return { problem:`3 × 2 =`, steps:[`Think of it as doubling: 3 + 3 = 6`,`The answer is 6`], answer:`6` };
    case "mul-5": return { problem:`3 × 5 =`, steps:[`Skip count by 5s three times: 5, 10, 15`,`The answer is 15`], answer:`15` };
    case "mul-10": return { problem:`3 × 10 =`, steps:[`Multiplying by 10 appends a zero: 3 becomes 30`,`The answer is 30`], answer:`30` };
    case "mul-3": return { problem:`4 × 3 =`, steps:[`Skip count by 3s four times: 3, 6, 9, 12`,`The answer is 12`], answer:`12` };
    case "mul-4": return { problem:`4 × 4 =`, steps:[`Double-double: double 4 to get 8, then double 8 to get 16`,`The answer is 16`], answer:`16` };
    case "mul-6": return { problem:`4 × 6 =`, steps:[`Use ×5 plus one more group: (4 × 5) + 4 = 20 + 4`,`The answer is 24`], answer:`24` };
    case "mul-review-1": return { problem:`5 × 4 =`, steps:[`Recall the ×4 fact: 5 groups of 4`,`5 × 4 = 20`], answer:`20` };
    case "mul-7": return { problem:`6 × 7 =`, steps:[`Split 7 into 5 + 2: (6 × 5) + (6 × 2) = 30 + 12`,`The answer is 42`], answer:`42` };
    case "mul-8": return { problem:`3 × 8 =`, steps:[`Triple-double: 3 → 6 → 12 → 24`,`The answer is 24`], answer:`24` };
    case "mul-9": return { problem:`6 × 9 =`, steps:[`Use ×10 minus one group: (6 × 10) - 6 = 60 - 6`,`The answer is 54`], answer:`54` };
    case "mul-11": return { problem:`4 × 11 =`, steps:[`Use ×10 plus one more group: (4 × 10) + 4 = 40 + 4`,`The answer is 44`], answer:`44` };
    case "mul-12": return { problem:`4 × 12 =`, steps:[`Split 12 into 10 + 2: (4 × 10) + (4 × 2) = 40 + 8`,`The answer is 48`], answer:`48` };
    case "mul-review-2": return { problem:`7 × 8 =`, steps:[`Recall the ×8 fact: split 8 into 5 + 3: (7×5)+(7×3) = 35+21`,`The answer is 56`], answer:`56` };
    case "mul-2d-1d": return {
      problem:`27 × 4 =`,
      steps:[`Multiply ones: 7 × 4 = 28 — write 8, carry 2`,`Multiply tens: 2 × 4 = 8, plus carried 2 = 10`,`The answer is 108`],
      answer:`108`,
    };
    case "mul-review-3": return { problem:`34 × 6 =`, steps:[`Ones: 4 × 6 = 24 — write 4, carry 2`,`Tens: 3 × 6 = 18, plus carried 2 = 20`,`The answer is 204`], answer:`204` };
    case "mul-2d-2d": return {
      problem:`23 × 14 =`,
      steps:[`Multiply 23 × 4 = 92 (first partial product)`,`Multiply 23 × 10 = 230 (second partial product)`,`Add the partial products: 92 + 230 = 322`],
      answer:`322`,
    };
    case "mul-word": return {
      problem:`A baker makes 12 muffins per tray and bakes 8 trays. How many muffins in all?`,
      steps:[`Multiply trays by muffins per tray: 8 × 12`,`8 × 12 = 96`],
      answer:`96`,
    };

    case "div-1": return { problem:`7 ÷ 1 =`, steps:[`Dividing by 1 leaves the number unchanged`,`The answer is 7`], answer:`7` };
    case "div-2": return { problem:`8 ÷ 2 =`, steps:[`Think of it as halving: split 8 into 2 equal groups`,`Each group has 4 — the answer is 4`], answer:`4` };
    case "div-5": return { problem:`15 ÷ 5 =`, steps:[`Skip count by 5s: 5, 10, 15 — that's 3 groups`,`The answer is 3`], answer:`3` };
    case "div-10": return { problem:`30 ÷ 10 =`, steps:[`Dividing by 10 removes a trailing zero: 30 becomes 3`,`The answer is 3`], answer:`3` };
    case "div-3": return { problem:`12 ÷ 3 =`, steps:[`Think: what times 3 equals 12? 4 × 3 = 12`,`The answer is 4`], answer:`4` };
    case "div-4": return { problem:`16 ÷ 4 =`, steps:[`Think: what times 4 equals 16? 4 × 4 = 16`,`The answer is 4`], answer:`4` };
    case "div-review-1": return { problem:`20 ÷ 5 =`, steps:[`Recall the inverse fact: 4 × 5 = 20`,`The answer is 4`], answer:`4` };
    case "div-6": return { problem:`24 ÷ 6 =`, steps:[`Think: what times 6 equals 24? 4 × 6 = 24`,`The answer is 4`], answer:`4` };
    case "div-7": return { problem:`42 ÷ 7 =`, steps:[`Think: what times 7 equals 42? 6 × 7 = 42`,`The answer is 6`], answer:`6` };
    case "div-8": return { problem:`24 ÷ 8 =`, steps:[`Think: what times 8 equals 24? 3 × 8 = 24`,`The answer is 3`], answer:`3` };
    case "div-9": return { problem:`54 ÷ 9 =`, steps:[`Think: what times 9 equals 54? 6 × 9 = 54`,`The answer is 6`], answer:`6` };
    case "div-review-2": return { problem:`56 ÷ 7 =`, steps:[`Recall the inverse fact: 8 × 7 = 56`,`The answer is 8`], answer:`8` };
    case "div-remainder": return {
      problem:`23 ÷ 4 =`,
      steps:[`Find the largest multiple of 4 that fits in 23: 5 × 4 = 20`,`23 - 20 = 3 left over`,`The answer is 5 r 3`],
      answer:`5 r 3`,
    };
    case "div-2d-1d": return {
      problem:`72 ÷ 6 =`,
      steps:[`Tens: 7 ÷ 6 = 1, remainder 1`,`Bring down: 12 ÷ 6 = 2`,`The answer is 12`],
      answer:`12`,
    };
    case "div-review-3": return { problem:`81 ÷ 9 =`, steps:[`Recall the inverse fact: 9 × 9 = 81`,`The answer is 9`], answer:`9` };
    case "div-word": return {
      problem:`A teacher has 45 pencils to share equally among 6 students. How many pencils does each student get, and how many are left over?`,
      steps:[`Divide pencils by students: 45 ÷ 6`,`6 × 7 = 42, with 3 left over`,`Each student gets 7 pencils, with 3 left over`],
      answer:`7 r 3`,
    };

    case "frac-identify-halves": return {
      problem:`A ribbon is cut into 2 equal pieces. 1 piece is taken. What fraction is taken?`,
      steps:[`Count total equal pieces: 2`,`Count pieces taken: 1`,`Fraction = taken / total = 1 out of 2`],
      answer:`\u005Cfrac{1}{2}`,
    };
    case "frac-identify-thirds": return {
      problem:`A ribbon is cut into 3 equal pieces. 1 piece is taken. What fraction is taken?`,
      steps:[`Total equal parts: 3`,`Parts taken: 1`,`Fraction = 1 out of 3 = \u005Cfrac{1}{3}`],
      answer:`\u005Cfrac{1}{3}`,
    };
    case "frac-identify-fourths": return {
      problem:`A shape is divided into 4 equal parts. 3 parts are shaded. Write the fraction.`,
      steps:[`Total equal parts: 4`,`Parts shaded: 3`,`Fraction = 3 out of 4 = \u005Cfrac{3}{4}`],
      answer:`\u005Cfrac{3}{4}`,
    };
    case "frac-identify-fifths-sixths": return {
      problem:`A bar is divided into 5 equal sections. 2 sections are coloured. Write the fraction.`,
      steps:[`Total equal parts: 5`,`Parts coloured: 2`,`Fraction = 2 out of 5 = \u005Cfrac{2}{5}`],
      answer:`\u005Cfrac{2}{5}`,
    };
    case "frac-simplify-gcf2": return {
      problem:`Simplify \u005Cfrac{4}{8}`,
      steps:[`Find the GCF of 4 and 8`,`Factors of 4: 1, 2, 4 — Factors of 8: 1, 2, 4, 8 — GCF = 4`,`Divide both by 4: \u005Cfrac{4÷4}{8÷4} = \u005Cfrac{1}{2}`],
      answer:`\u005Cfrac{1}{2}`,
    };
    case "frac-simplify-gcf3": return {
      problem:`Simplify \u005Cfrac{6}{9}`,
      steps:[`Find the GCF of 6 and 9`,`Factors of 6: 1, 2, 3, 6 — Factors of 9: 1, 3, 9 — GCF = 3`,`Divide both by 3: \u005Cfrac{6÷3}{9÷3} = \u005Cfrac{2}{3}`],
      answer:`\u005Cfrac{2}{3}`,
    };
    case "frac-add-same": return {
      problem:`\u005Cfrac{2}{7} + \u005Cfrac{3}{7} =`,
      steps:[`Same denominator — add numerators only: 2 + 3 = 5`,`Keep the denominator: \u005Cfrac{5}{7}`,`GCF(5,7)=1 — already simplified`],
      answer:`\u005Cfrac{5}{7}`,
    };
    case "frac-add-unlike":
    case "frac-add-unlike-fluency": return {
      problem:`\u005Cfrac{1}{3} + \u005Cfrac{1}{4} =`,
      steps:[`Find LCM of 3 and 4: LCM = 12`,`Convert: \u005Cfrac{1}{3} = \u005Cfrac{4}{12} and \u005Cfrac{1}{4} = \u005Cfrac{3}{12}`,`Add: \u005Cfrac{4}{12} + \u005Cfrac{3}{12} = \u005Cfrac{7}{12}`],
      answer:`\u005Cfrac{7}{12}`,
    };
    case "frac-multiply":
    case "frac-multiply-fluency": return {
      problem:`\u005Cfrac{2}{3} × \u005Cfrac{3}{4} =`,
      steps:[`Multiply numerators: 2 x 3 = 6`,`Multiply denominators: 3 x 4 = 12`,`Simplify \u005Cfrac{6}{12}: GCF=6 → \u005Cfrac{1}{2}`],
      answer:`\u005Cfrac{1}{2}`,
    };
    case "frac-divide":
    case "frac-divide-fluency": return {
      problem:`\u005Cfrac{3}{4} ÷ \u005Cfrac{1}{2} =`,
      steps:[`Flip the second fraction: \u005Cfrac{1}{2} → \u005Cfrac{2}{1}`,`Multiply: \u005Cfrac{3}{4} × \u005Cfrac{2}{1} = \u005Cfrac{6}{4}`,`Simplify: \u005Cfrac{6}{4} = \u005Cfrac{3}{2}`],
      answer:`\u005Cfrac{3}{2}`,
    };
    case "frac-ops-mastery": return {
      problem:`\frac{2}{3} × \frac{3}{5} =`,
      steps:[`Identify the operation shown`,`For ×: multiply across — 2×3=6, 3×5=15`,`Simplify \frac{6}{15}: GCF=3 → \frac{2}{5}`],
      answer:`\frac{2}{5}`,
    };
  }

  return { problem:"Example", steps:["Work through step by step"], answer:"See above" };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateProgressiveSheet(
  skill: ShopSkill,
  sheetNumber: number,
  totalSheets: number,
  problemCount: number = 30,
  // When true (default), the question COUNT is chosen to fill one page based on
  // each question's visual weight (see layout-capacity). Pass false for cheap
  // meta-only lookups where the count is irrelevant.
  auto: boolean = true
): WorksheetData {
  // FRACTIONS and the four arithmetic skills now run on the clean
  // progression-first curriculum engines, which guarantee monotonic difficulty,
  // no duplicates, and within-sheet ascending difficulty by construction.
  const cleanEngine = (n: number): WorksheetData | null => {
    if (skill === "FRACTIONS") return generateFdpSheet(sheetNumber, totalSheets, n);
    if (isArithmeticSkill(skill)) return generateArithmeticSheet(skill, sheetNumber, totalSheets, n);
    if (isAdvancedSkill(skill)) return generateAdvancedSheet(skill, sheetNumber, totalSheets, n);
    if (isGeometrySkill(skill)) return generateGeometrySheet(sheetNumber, totalSheets, n);
    return null;
  };
  if (skill === "FRACTIONS" || isArithmeticSkill(skill) || isAdvancedSkill(skill) || isGeometrySkill(skill)) {
    if (!auto) return cleanEngine(problemCount)!;
    // Peek the sheet's question types with a cheap sample, then fill the page.
    const sample = cleanEngine(8)!.problems.map((p) => p.question);
    return cleanEngine(adaptiveCount(sample))!;
  }

  // Legacy micro-skill path — unreachable for clean-engine skills (incl. GEOMETRY),
  // which return above; cast for the older curriculum-graph skill typing.
  const legacySkill = skill as any;
  const microSkill = getMicroSkillForSheet(legacySkill, sheetNumber);
  const difficulty = getDifficultyForSheet(legacySkill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}-v6`);

  const problems: WorksheetProblem[] = [];
  const answerKey: { id: string; answer: string }[] = [];

  if (microSkill) {
    // CURRICULUM GRAPH PATH
    // Step 1: Build the full worksheet blueprint BEFORE generating questions —
    // difficulty targets, representation progression, question distribution,
    // forbidden concepts, and mastery metrics are all planned up front.
    const worksheetBlueprint = buildWorksheetBlueprint(microSkill);
    const blueprints = worksheetBlueprint.difficultyBlueprints;

    // Step 2: Generate questions constrained by blueprints
    // Regeneration loop — up to 10 attempts to pass validation
    const MAX_ATTEMPTS = 10;
    let attempt = 0;
    let validationPassed = false;

    while (attempt < MAX_ATTEMPTS && !validationPassed) {
      problems.length = 0;
      answerKey.length = 0;

      // Re-seed RNG per attempt so each attempt produces different questions
      const attemptRng = seedRng(`${skill}-${sheetNumber}-v6-attempt${attempt}`);

      for (let si = 0; si < microSkill.stages.length; si++) {
        const stage = microSkill.stages[si];
        const blueprint = blueprints[si];
        const constrainedStage = stage;

        // Use the blueprint's planned form distribution rather than picking
        // forms at random per problem — guarantees the generated sheet
        // matches the worksheet plan exactly (see distributionMatchesPlan).
        const formSequence = expandFormSequence(worksheetBlueprint.questionDistribution[si], attemptRng);

        // Novelty window: track how many times each exact question has appeared
        // within this stage. Limit identical questions to ≤2 per stage so the
        // student encounters genuine variety, not just shuffled repetition.
        const stageCount = new Map<string, number>();

        for (let pi = 0; pi < stage.problemCount; pi++) {
          const form = formSequence[pi] ?? constrainedStage.questionForms[0];
          let question: string, answer: string;
          let noveltyTries = 0;
          do {
            [question, answer] = generateFromForm(form, constrainedStage, attemptRng, si, pi + noveltyTries);
            noveltyTries++;
          } while ((stageCount.get(question) ?? 0) >= 2 && noveltyTries < 12);
          stageCount.set(question, (stageCount.get(question) ?? 0) + 1);

          const id = nanoid(8);
          problems.push({ id, type:"arithmetic", question, answer, points:1, zone:zoneForStageIndex(si) });
          answerKey.push({ id, answer });
        }
      }

      // Validate this attempt
      const allowedForms = microSkill.stages.flatMap(s => s.questionForms);
      const validation = validateWorksheet(problems.slice(0, problemCount), skill, microSkill.id, microSkill.stages, allowedForms, worksheetBlueprint.forbiddenConcepts);

      if (validation.passed) {
        validationPassed = true;
      } else {
        attempt++;
        if (attempt === MAX_ATTEMPTS) {
          console.warn(`[generator] Sheet ${sheetNumber} (${skill}) failed validation after ${MAX_ATTEMPTS} attempts. Using last attempt.`);
          validateAndLog(validation, skill, sheetNumber);
        }
      }
    }

    const workedExample = (microSkill.stages[0].type === "introduction" && sheetNumber === microSkill.sheetRange[0])
      ? buildWorkedExample(microSkill)
      : undefined;

    const finalProblems = problems.slice(0, problemCount);
    const finalAnswerKey = answerKey.slice(0, problemCount);

    // Validate and log — fail fast in development, log warnings in production
    const allowedForms = microSkill.stages.flatMap(s => s.questionForms);
    const validation = validateWorksheet(finalProblems, skill, microSkill.id, microSkill.stages, allowedForms, worksheetBlueprint.forbiddenConcepts);
    validateAndLog(validation, skill, sheetNumber);

    return {
      problems: finalProblems,
      answerKey: finalAnswerKey,
      workedExample,
      meta: {
        skill,
        skillCode: SKILL_LEVEL_CODE[legacySkill as keyof typeof SKILL_LEVEL_CODE] ?? "M1",
        sheetNumber,
        totalSheets,
        subSkillLabel: microSkill.name,
        gradeLevel: microSkill.gradeLevel,
        difficultyStars: microSkill.difficultyStars,
        learningObjective: microSkill.learningObjective,
        mode: sheetNumber === microSkill.sheetRange[0] ? "tutorial" : difficulty.mode,
        estimatedMinutes: worksheetBlueprint.masteryMetrics.targetCompletionMinutes,
      },
    };
  }

  // FALLBACK for sheets past the curriculum graph (e.g. FRACTIONS 47-100).
  // Route to the correct fraction form by sub-skill instead of emitting
  // integer addition. A synthetic stage carries the denominator ceiling, and a
  // novelty cap (≤2 identical questions per sheet) guarantees real variety.
  const FORM_BY_SUBSKILL: Record<string, string> = {
    "frac-identify": "identify-frac",
    "frac-simplify": "simplify-frac",
    "frac-add-same": "add-same-frac",
    "frac-add-unlike": "add-unlike-frac",
    "frac-multiply": "mul-frac",
    "frac-divide": "div-frac",
    "frac-mixed": "add-unlike-frac", // no dedicated mixed form — keep it fractional
  };
  const fallbackForm = FORM_BY_SUBSKILL[difficulty.subSkill] ?? null;

  const fallbackProblems: WorksheetProblem[] = [];
  const seenFallback = new Map<string, number>();
  for (let i = 0; i < problemCount; i++) {
    const id = nanoid(8);
    let question: string, answer: string;
    if (fallbackForm) {
      const synthStage = {
        constraints: { maxDenominator: Math.max(3, (difficulty as any).maxDenominator ?? 8) },
      } as unknown as Stage;
      let tries = 0;
      do {
        [question, answer] = generateFromForm(fallbackForm, synthStage, rng, 2, i + tries);
        tries++;
      } while ((seenFallback.get(question) ?? 0) >= 2 && tries < 12);
      seenFallback.set(question, (seenFallback.get(question) ?? 0) + 1);
    } else {
      const a = ri(rng, 1, 9), b = ri(rng, 1, 9);
      question = `${a} + ${b}`;
      answer = String(a + b);
    }
    answerKey.push({ id, answer });
    fallbackProblems.push({ id, type:"arithmetic", question, answer, points:1, zone:(i<6?1:i<12?2:i<18?3:i<24?4:5) as 1|2|3|4|5 });
  }

  return {
    problems: fallbackProblems,
    answerKey,
    meta: {
      skill, skillCode: SKILL_LEVEL_CODE[legacySkill as keyof typeof SKILL_LEVEL_CODE] ?? "M1",
      sheetNumber, totalSheets,
      subSkillLabel: difficulty.subSkillLabel,
      gradeLevel: difficulty.gradeLevel,
      difficultyStars: difficulty.difficultyStars,
      learningObjective: difficulty.learningObjective,
      mode: difficulty.mode,
      estimatedMinutes: 10,
    },
  };
}
