// src/lib/shop/progressive-generator.ts
// Curriculum-graph-driven worksheet generator.
// Reads from curriculum-graph.ts for progression plan.
// Generates questions only AFTER the progression plan exists.

import { nanoid } from "nanoid";
import { getMicroSkillForSheet, type MicroSkill, type Stage } from "./curriculum-graph";
import { validateWorksheet, validateAndLog } from "./worksheet-validator";
import { buildBlueprints, problemFitsBlueprint, type DifficultyBlueprint } from "./difficulty-blueprint";
import { getDifficultyForSheet, SKILL_LEVEL_CODE } from "./difficulty-curve";

export type ShopSkill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" |
  "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

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
    // Sequential for independent practice stage (3): □+1=2, □+1=3... □+1=10
    if (stageIndex === 3) {
      const minA = c.minA ?? 1;
      const a = minA + (problemIndex % (c.maxA ?? 9));
      return [`□ + ${fixedB} = ${a + fixedB}`, String(a)];
    }
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`□ + ${fixedB} = ${a + fixedB}`, String(a)];
  }

  if (form === "missing-addend-b") {
    const fixedB = c.fixedB ?? c.minB ?? 1;
    const a = ri(rng, c.minA ?? 1, c.maxA ?? 9);
    return [`${a} + □ = ${a + fixedB}`, String(fixedB)];
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

  // ── Fraction forms ──
  const denoms = c.denominators ?? (c.denominator ? [c.denominator] : [2,3,4]);
  const maxD = c.maxDenominator;
  const dPool = maxD ? Array.from({length: maxD-1}, (_,i) => i+2) : denoms;
  const d = dPool[Math.floor(rng() * dPool.length)];

  // Description form — simple structural description
  if (form === "identify-frac-desc") {
    const n = ri(rng, 1, d-1);
    const descs = [
      `A shape has ${d} equal parts. ${n} ${n===1?"part is":"parts are"} shaded. Write the fraction.`,
      `${n} out of ${d} equal sections filled. Write the fraction.`,
      `${n} out of ${d} equal parts. Write the fraction.`,
    ];
    return [descs[Math.floor(rng() * descs.length)], `\\frac{${n}}{${d}}`];
  }

  // Context form — real-world objects
  if (form === "identify-frac-context") {
    const n = ri(rng, 1, d-1);
    const contexts = [
      `A pizza has ${d} equal slices. ${n} ${n===1?"slice is":"slices are"} eaten. What fraction was eaten?`,
      `A ribbon is cut into ${d} equal pieces. ${n} ${n===1?"piece":"pieces"} ${n===1?"is":"are"} taken. What fraction is taken?`,
      `A chocolate bar: ${d} equal pieces, ${n} broken off. Write the fraction.`,
      `A garden: ${d} equal plots, ${n} planted. Write the fraction.`,
    ];
    return [contexts[Math.floor(rng() * contexts.length)], `\\frac{${n}}{${d}}`];
  }

  if (form === "identify-frac" || form === "write-frac") {
    const n = ri(rng, 1, d-1);
    const contexts = [
      `A shape has ${d} equal parts. ${n} ${n===1?"part is":"parts are"} shaded. Write the fraction.`,
      `${n} out of ${d} equal parts are coloured. Write the fraction.`,
      `A pizza has ${d} equal slices. ${n} ${n===1?"slice is":"slices are"} eaten. What fraction was eaten?`,
      `A ribbon is cut into ${d} equal pieces. ${n} ${n===1?"piece is":"pieces are"} taken. What fraction?`,
      `Write the fraction for ${n} parts out of ${d} equal parts.`,
    ];
    return [contexts[Math.floor(rng() * contexts.length)], `\\frac{${n}}{${d}}`];
  }

  if (form === "simplify-frac") {
    let n: number, attempts = 0;
    do {
      n = ri(rng, 2, d-1);
      attempts++;
    } while (gcd(n,d) === 1 && attempts < 20);
    if (gcd(n,d) === 1) n = Math.floor(d/2);
    const g = gcd(n,d);
    return [`Simplify \\frac{${n}}{${d}}`, g===d?"1":`\\frac{${n/g}}{${d/g}}`];
  }

  if (form === "add-same-frac") {
    const safeD = Math.max(3, d);
    const n1 = ri(rng, 1, Math.floor(safeD/2));
    const n2 = ri(rng, 1, Math.max(1, safeD-n1-1));
    const sum = n1+n2;
    const g = gcd(sum, safeD);
    const ans = g===safeD?"1":g>1?`\\frac{${sum/g}}{${safeD/g}}`:`\\frac{${sum}}{${safeD}}`;
    return [`\\frac{${n1}}{${safeD}} + \\frac{${n2}}{${safeD}}`, ans];
  }

  if (form === "add-unlike-frac") {
    const d2pool = denoms.filter(x => x !== d);
    const d2 = d2pool.length > 0 ? d2pool[Math.floor(rng()*d2pool.length)] : d+1;
    const n1 = ri(rng, 1, d-1);
    const n2 = ri(rng, 1, d2-1);
    const lcm = (d*d2)/gcd(d,d2);
    const sumN = n1*(lcm/d) + n2*(lcm/d2);
    const g = gcd(sumN,lcm);
    const ans = g===lcm?"1":`\\frac{${sumN/g}}{${lcm/g}}`;
    return [`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d2}}`, ans];
  }

  if (form === "mul-frac") {
    const d2 = dPool[Math.floor(rng()*dPool.length)];
    const n1 = ri(rng,1,d-1), n2 = ri(rng,1,Math.max(1,d2-1));
    const resN=n1*n2, resD=d*d2;
    const g=gcd(resN,resD);
    return [`\\frac{${n1}}{${d}} x \\frac{${n2}}{${d2}}`, g===resD?"1":`\\frac{${resN/g}}{${resD/g}}`];
  }

  if (form === "div-frac") {
    const d2 = dPool[Math.floor(rng()*dPool.length)];
    const n1 = ri(rng,1,d-1), n2 = ri(rng,1,Math.max(1,d2-1));
    const resN=n1*d2, resD=d*n2;
    const g=gcd(resN,resD);
    return [`\\frac{${n1}}{${d}} / \\frac{${n2}}{${d2}}`, g===resD?"1":`\\frac{${resN/g}}{${resD/g}}`];
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

    case "frac-identify-halves": return {
      problem:`A ribbon is cut into 2 equal pieces. 1 piece is taken. What fraction is taken?`,
      steps:[`Count total equal pieces: 2`,`Count pieces taken: 1`,`Fraction = taken / total = 1 out of 2`],
      answer:`\\frac{1}{2}`,
    };
    case "frac-identify-thirds": return {
      problem:`A ribbon is cut into 3 equal pieces. 1 piece is taken. What fraction is taken?`,
      steps:[`Total equal parts: 3`,`Parts taken: 1`,`Fraction = 1 out of 3 = \\frac{1}{3}`],
      answer:`\\frac{1}{3}`,
    };
    case "frac-identify-fourths": return {
      problem:`A shape is divided into 4 equal parts. 3 parts are shaded. Write the fraction.`,
      steps:[`Total equal parts: 4`,`Parts shaded: 3`,`Fraction = 3 out of 4 = \\frac{3}{4}`],
      answer:`\\frac{3}{4}`,
    };
    case "frac-identify-fifths-sixths": return {
      problem:`A bar is divided into 5 equal sections. 2 sections are coloured. Write the fraction.`,
      steps:[`Total equal parts: 5`,`Parts coloured: 2`,`Fraction = 2 out of 5 = \\frac{2}{5}`],
      answer:`\\frac{2}{5}`,
    };
    case "frac-simplify-gcf2": return {
      problem:`Simplify \\frac{4}{8}`,
      steps:[`Find the GCF of 4 and 8`,`Factors of 4: 1, 2, 4 — Factors of 8: 1, 2, 4, 8 — GCF = 4`,`Divide both by 4: \\frac{4÷4}{8÷4} = \\frac{1}{2}`],
      answer:`\\frac{1}{2}`,
    };
    case "frac-simplify-gcf3": return {
      problem:`Simplify \\frac{6}{9}`,
      steps:[`Find the GCF of 6 and 9`,`Factors of 6: 1, 2, 3, 6 — Factors of 9: 1, 3, 9 — GCF = 3`,`Divide both by 3: \\frac{6÷3}{9÷3} = \\frac{2}{3}`],
      answer:`\\frac{2}{3}`,
    };
    case "frac-add-same": return {
      problem:`\\frac{2}{7} + \\frac{3}{7} =`,
      steps:[`Same denominator — add numerators only: 2 + 3 = 5`,`Keep the denominator: \\frac{5}{7}`,`GCF(5,7)=1 — already simplified`],
      answer:`\\frac{5}{7}`,
    };
    case "frac-add-unlike": return {
      problem:`\\frac{1}{3} + \\frac{1}{4} =`,
      steps:[`Find LCM of 3 and 4: LCM = 12`,`Convert: \\frac{1}{3} = \\frac{4}{12} and \\frac{1}{4} = \\frac{3}{12}`,`Add: \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}`],
      answer:`\\frac{7}{12}`,
    };
    case "frac-multiply": return {
      problem:`\\frac{2}{3} x \\frac{3}{4} =`,
      steps:[`Multiply numerators: 2 x 3 = 6`,`Multiply denominators: 3 x 4 = 12`,`Simplify \\frac{6}{12}: GCF=6 → \\frac{1}{2}`],
      answer:`\\frac{1}{2}`,
    };
    case "frac-divide": return {
      problem:`\\frac{3}{4} / \\frac{1}{2} =`,
      steps:[`Flip the second fraction: \\frac{1}{2} → \\frac{2}{1}`,`Multiply: \\frac{3}{4} x \\frac{2}{1} = \\frac{6}{4}`,`Simplify: \\frac{6}{4} = \\frac{3}{2}`],
      answer:`\\frac{3}{2}`,
    };
  }

  return { problem:"Example", steps:["Work through step by step"], answer:"See above" };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateProgressiveSheet(
  skill: ShopSkill,
  sheetNumber: number,
  totalSheets: number,
  problemCount: number = 30
): WorksheetData {
  const microSkill = getMicroSkillForSheet(skill, sheetNumber);
  const difficulty = getDifficultyForSheet(skill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}-v6`);

  const problems: WorksheetProblem[] = [];
  const answerKey: { id: string; answer: string }[] = [];

  if (microSkill) {
    // CURRICULUM GRAPH PATH
    // Step 1: Build difficulty blueprints BEFORE generating questions
    const blueprints = buildBlueprints(microSkill.stages, skill);

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

        for (let pi = 0; pi < stage.problemCount; pi++) {
          const form = constrainedStage.questionForms[Math.floor(attemptRng() * constrainedStage.questionForms.length)];
          const [question, answer] = generateFromForm(form, constrainedStage, attemptRng, si, pi);
          const id = nanoid(8);
          problems.push({ id, type:"arithmetic", question, answer, points:1, zone:zoneForStageIndex(si) });
          answerKey.push({ id, answer });
        }
      }

      // Validate this attempt
      const allowedForms = microSkill.stages.flatMap(s => s.questionForms);
      const validation = validateWorksheet(problems.slice(0, problemCount), skill, microSkill.id, microSkill.stages, allowedForms);

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
    const validation = validateWorksheet(finalProblems, skill, microSkill.id, microSkill.stages, allowedForms);
    validateAndLog(validation, skill, sheetNumber);

    return {
      problems: finalProblems,
      answerKey: finalAnswerKey,
      workedExample,
      meta: {
        skill,
        skillCode: SKILL_LEVEL_CODE[skill] ?? "M1",
        sheetNumber,
        totalSheets,
        subSkillLabel: microSkill.name,
        gradeLevel: microSkill.gradeLevel,
        difficultyStars: microSkill.difficultyStars,
        learningObjective: microSkill.learningObjective,
        mode: sheetNumber === microSkill.sheetRange[0] ? "tutorial" : difficulty.mode,
        estimatedMinutes: 10,
      },
    };
  }

  // FALLBACK for skills not yet in curriculum graph
  const fallbackProblems: WorksheetProblem[] = Array.from({length: problemCount}, (_, i) => {
    const id = nanoid(8);
    const q = `${ri(rng, 1, 9)} + ${ri(rng, 1, 9)}`;
    const [a, b] = q.split(" + ").map(Number);
    const answer = String(a + b);
    answerKey.push({ id, answer });
    return { id, type:"arithmetic", question:q, answer, points:1, zone:i<6?1:i<12?2:i<18?3:i<24?4:5 };
  });

  return {
    problems: fallbackProblems,
    answerKey,
    meta: {
      skill, skillCode: SKILL_LEVEL_CODE[skill] ?? "M1",
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
