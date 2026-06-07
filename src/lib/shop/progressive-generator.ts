// src/lib/shop/progressive-generator.ts
// Curriculum State Machine generator.
// Follows SheetSpec stages exactly — no random progression invention.

import { nanoid } from "nanoid";
import { getSheetSpec, flattenToProblems, type ShopSkill, type Stage } from "./progression-paths";
import { getDifficultyForSheet, SKILL_LEVEL_CODE } from "./difficulty-curve";

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

// ── Problem generators ────────────────────────────────────────────────────────

function generateFromStage(stage: Stage, rng: () => number): [string, string] {
  const form = stage.forms[Math.floor(rng() * stage.forms.length)];

  // ── Arithmetic forms ──
  if (form === "a+b" || form === "a+1" || form === "a+2" || form === "a+3") {
    const minA = stage.minA ?? 1, maxA = stage.maxA ?? 9;
    const minB = form === "a+1" ? 1 : form === "a+2" ? 2 : form === "a+3" ? 3 : (stage.minB ?? 1);
    const maxB = form === "a+1" ? 1 : form === "a+2" ? 2 : form === "a+3" ? 3 : (stage.maxB ?? 9);
    let a: number, b: number, attempts = 0;
    do {
      a = ri(rng, minA, maxA);
      b = ri(rng, minB, maxB);
      attempts++;
      if (attempts > 30) break;
      if (stage.carry === true  && maxA > 9 && (a%10)+(b%10) < 10) continue;
      if (stage.carry === false && maxA > 9 && (a%10)+(b%10) >= 10) continue;
    } while (true);
    return [`${a} + ${b}`, String(a+b)];
  }

  if (form === "a-b") {
    const minA = stage.minA ?? 2, maxA = stage.maxA ?? 9;
    const minB = stage.minB ?? 1, maxB = stage.maxB ?? 4;
    let a: number, b: number, attempts = 0;
    do {
      a = ri(rng, minA, maxA);
      b = ri(rng, minB, Math.min(maxB, a-1));
      if (b < 1) b = 1;
      attempts++;
      if (attempts > 30) break;
      if (stage.borrow === true  && (a%10) >= (b%10)) continue;
      if (stage.borrow === false && maxA > 9 && (a%10) < (b%10)) continue;
    } while (true);
    return [`${a} - ${b}`, String(a-b)];
  }

  if (form === "box+b=c" || form === "a+box=c") {
    const minA = stage.minA ?? 1, maxA = stage.maxA ?? 5;
    const minB = stage.minB ?? 1, maxB = stage.maxB ?? 5;
    const a = ri(rng, minA, maxA);
    const b = ri(rng, minB, maxB);
    if (form === "box+b=c") return [`□ + ${b} = ${a+b}`, String(a)];
    return [`${a} + □ = ${a+b}`, String(b)];
  }

  if (form === "a+b+1") {
    const a = ri(rng, stage.minA ?? 1, stage.maxA ?? 3);
    const b = ri(rng, stage.minB ?? 1, stage.maxB ?? 3);
    return [`${a} + ${b} + 1`, String(a+b+1)];
  }

  // ── Fraction forms ──
  const denoms = stage.denominators ?? (stage.denominator ? [stage.denominator] : [2,3,4]);
  const d = denoms[Math.floor(rng() * denoms.length)];

  if (form === "identify-frac") {
    const n = ri(rng, 1, d-1);
    const contexts = [
      `A shape has ${d} equal parts. ${n} ${n===1?"part is":"parts are"} shaded. Write the fraction.`,
      `${n} out of ${d} equal parts are coloured. Write the fraction.`,
      `A ribbon cut into ${d} equal pieces. ${n} ${n===1?"piece is":"pieces are"} taken. What fraction?`,
      `A pizza has ${d} equal slices. ${n} ${n===1?"slice is":"slices are"} eaten. What fraction was eaten?`,
      `Draw a fraction: ${n} parts out of ${d} equal parts.`,
    ];
    return [contexts[Math.floor(rng() * contexts.length)], `\\frac{${n}}{${d}}`];
  }

  if (form === "simplify-frac") {
    let n: number, attempts = 0;
    do {
      n = ri(rng, 2, d-1);
      attempts++;
    } while (gcd(n,d) === 1 && attempts < 20);
    if (gcd(n,d) === 1) n = Math.floor(d/2); // fallback
    const g = gcd(n,d);
    return [`Simplify \\frac{${n}}{${d}}`, g===d?"1":`\\frac{${n/g}}{${d/g}}`];
  }

  if (form === "add-same-frac") {
    const n1 = ri(rng, 1, Math.floor(d/2));
    const n2 = ri(rng, 1, Math.max(1, d-n1-1));
    const sum = n1+n2;
    const g = gcd(sum,d);
    const ans = g===d?"1":g>1?`\\frac{${sum/g}}{${d/g}}`:`\\frac{${sum}}{${d}}`;
    return [`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}}`, ans];
  }

  if (form === "add-unlike-frac") {
    const denoms2 = stage.denominators ?? [2,3,4,6];
    let d1 = denoms2[Math.floor(rng()*denoms2.length)];
    let d2 = denoms2[Math.floor(rng()*denoms2.length)];
    if (d1 === d2) d2 = d1===2 ? 3 : 2; // ensure different
    const n1 = ri(rng, 1, d1-1);
    const n2 = ri(rng, 1, d2-1);
    const lcm = (d1*d2)/gcd(d1,d2);
    const sumN = n1*(lcm/d1) + n2*(lcm/d2);
    const g = gcd(sumN,lcm);
    const ans = g===lcm?"1":`\\frac{${sumN/g}}{${lcm/g}}`;
    return [`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`, ans];
  }

  if (form === "mul-frac") {
    const denoms2 = stage.denominators ?? [2,3,4];
    const d1 = denoms2[Math.floor(rng()*denoms2.length)];
    const d2 = denoms2[Math.floor(rng()*denoms2.length)];
    const n1 = ri(rng,1,d1-1), n2 = ri(rng,1,d2-1);
    const resN=n1*n2, resD=d1*d2;
    const g=gcd(resN,resD);
    const ans = g===resD?"1":`\\frac{${resN/g}}{${resD/g}}`;
    return [`\\frac{${n1}}{${d1}} x \\frac{${n2}}{${d2}}`, ans];
  }

  if (form === "div-frac") {
    const denoms2 = stage.denominators ?? [2,3,4];
    const d1 = denoms2[Math.floor(rng()*denoms2.length)];
    const d2 = denoms2[Math.floor(rng()*denoms2.length)];
    const n1 = ri(rng,1,d1-1), n2 = ri(rng,1,d2-1);
    const resN=n1*d2, resD=d1*n2;
    const g=gcd(resN,resD);
    const ans = g===resD?"1":`\\frac{${resN/g}}{${resD/g}}`;
    return [`\\frac{${n1}}{${d1}} / \\frac{${n2}}{${d2}}`, ans];
  }

  return [`Problem`, "—"];
}

// ── Worked examples ───────────────────────────────────────────────────────────

function getWorkedExample(skill: ShopSkill, spec: ReturnType<typeof getSheetSpec>): WorkedExample {
  const firstStage = spec.stages[0];
  const firstForm = firstStage.forms[0];

  if (skill === "ADDITION") {
    const maxA = firstStage.maxA ?? 9;
    if (maxA <= 5 && firstForm === "a+1") return {
      problem: `3 + 1 =`,
      steps: [`Start at 3`, `Count up 1: 3 → 4`, `The answer is 4`],
      answer: `4`,
    };
    if (maxA <= 5) return {
      problem: `2 + 2 =`,
      steps: [`Start at 2`, `Count up 2: 2 → 3 → 4`, `The answer is 4`],
      answer: `4`,
    };
    if (maxA <= 19) return {
      problem: `13 + 5 =`,
      steps: [`Start with 13`, `Add the ones: 3 + 5 = 8`, `The tens stay: 1 ten`, `Answer: 18`],
      answer: `18`,
    };
    if (firstStage.carry) return {
      problem: `37 + 45 =`,
      steps: [`Add ones: 7 + 5 = 12 — write 2, carry 1`, `Add tens: 3 + 4 + 1 = 8`, `Answer: 82`],
      answer: `82`,
    };
    return {
      problem: `34 + 25 =`,
      steps: [`Add ones: 4 + 5 = 9`, `Add tens: 3 + 2 = 5`, `Answer: 59`],
      answer: `59`,
    };
  }

  if (skill === "FRACTIONS") {
    if (firstForm === "identify-frac") return {
      problem: `A pizza has 4 equal slices. 1 slice is eaten. What fraction was eaten?`,
      steps: [
        `Count the total equal parts: 4 slices`,
        `Count the parts eaten: 1 slice`,
        `Write as a fraction: parts eaten / total parts`,
        `Answer: \\frac{1}{4}`,
      ],
      answer: `\\frac{1}{4}`,
    };
    if (firstForm === "simplify-frac") return {
      problem: `Simplify \\frac{6}{9}`,
      steps: [
        `Find the GCF of 6 and 9`,
        `Factors of 6: 1, 2, 3, 6 — Factors of 9: 1, 3, 9 — GCF = 3`,
        `Divide both by 3: \\frac{6/3}{9/3} = \\frac{2}{3}`,
      ],
      answer: `\\frac{2}{3}`,
    };
    if (firstForm === "add-same-frac") return {
      problem: `\\frac{2}{7} + \\frac{3}{7} =`,
      steps: [
        `Same denominator — add numerators only: 2 + 3 = 5`,
        `Keep the denominator: \\frac{5}{7}`,
      ],
      answer: `\\frac{5}{7}`,
    };
    if (firstForm === "add-unlike-frac") return {
      problem: `\\frac{1}{3} + \\frac{1}{4} =`,
      steps: [
        `Find LCM of 3 and 4: LCM = 12`,
        `Convert: \\frac{1}{3} = \\frac{4}{12} and \\frac{1}{4} = \\frac{3}{12}`,
        `Add: \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}`,
      ],
      answer: `\\frac{7}{12}`,
    };
    if (firstForm === "mul-frac") return {
      problem: `\\frac{2}{3} x \\frac{3}{4} =`,
      steps: [
        `Multiply numerators: 2 x 3 = 6`,
        `Multiply denominators: 3 x 4 = 12`,
        `Simplify \\frac{6}{12} = \\frac{1}{2}`,
      ],
      answer: `\\frac{1}{2}`,
    };
    return {
      problem: `\\frac{3}{4} / \\frac{1}{2} =`,
      steps: [
        `Flip the second fraction: \\frac{1}{2} → \\frac{2}{1}`,
        `Multiply: \\frac{3}{4} x \\frac{2}{1} = \\frac{6}{4} = \\frac{3}{2}`,
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
  const spec = getSheetSpec(skill, sheetNumber);
  const stages = flattenToProblems(spec);
  const difficulty = getDifficultyForSheet(skill, sheetNumber);
  const rng = seedRng(`${skill}-${sheetNumber}-v5`);

  const problems: WorksheetProblem[] = [];
  const answerKey: { id: string; answer: string }[] = [];

  for (let i = 0; i < Math.min(problemCount, stages.length); i++) {
    const [question, answer] = generateFromStage(stages[i], rng);
    const id = nanoid(8);
    problems.push({ id, type: "arithmetic", question, answer, points: 1, zone: zoneForIndex(i) });
    answerKey.push({ id, answer });
  }

  // Use spec title for sub-skill label
  const workedExample = difficulty.mode === "tutorial"
    ? getWorkedExample(skill, spec)
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
      subSkillLabel: spec.title,
      gradeLevel: difficulty.gradeLevel,
      difficultyStars: difficulty.difficultyStars,
      learningObjective: difficulty.learningObjective,
      mode: difficulty.mode,
      estimatedMinutes: skill === "FRACTIONS" || skill === "PRE_ALGEBRA" ? 15 : 10,
    },
  };
}
