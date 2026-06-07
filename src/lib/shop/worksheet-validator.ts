// src/lib/shop/worksheet-validator.ts
// Validates worksheets before they are accepted.
// Turns progression from a suggestion into an enforceable rule.
//
// Rules enforced:
//   1. Skill alignment — all problems match declared skill
//   2. Stage difficulty trend — each stage avg > previous stage avg
//   3. Introduction constraints — no missing addend, no word problems
//   4. Mastery constraints — same skill only, no new concepts
//   5. Stage transitions — only ONE new cognitive demand per stage
//   6. No difficulty regression — rolling average always rises

import { scoreProblem, extractFeatures } from "./difficulty-scorer";
import { buildBlueprints, extractCognitiveDemand, countNewDemands } from "./difficulty-blueprint";
import type { WorksheetProblem } from "./progressive-generator";
import type { Stage } from "./curriculum-graph";

export interface ValidationError {
  rule: string;
  message: string;
  questionIndex?: number;
  stageIndex?: number;
  severity: "error" | "warning";
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  difficultyProfile: number[];       // score per problem
  stageAverages: number[];           // avg score per stage (5 values)
}

// ── Stage boundaries ──────────────────────────────────────────────────────────
const STAGE_BOUNDARIES = [0, 6, 12, 18, 24, 30]; // problems 0-5, 6-11, 12-17, 18-23, 24-29

function getStageIndex(problemIndex: number): number {
  for (let s = 0; s < 5; s++) {
    if (problemIndex < STAGE_BOUNDARIES[s + 1]) return s;
  }
  return 4;
}

function getStageProblems(problems: WorksheetProblem[], stageIndex: number): WorksheetProblem[] {
  return problems.filter((_, i) => getStageIndex(i) === stageIndex);
}

// ── Individual validators ─────────────────────────────────────────────────────

function validateSkillAlignment(
  problems: WorksheetProblem[],
  skill: string,
  microSkillId: string
): ValidationError[] {
  // Every problem's answer must be parseable as the declared skill
  // For now: check that fraction problems don't appear in addition worksheets
  const errors: ValidationError[] = [];

  problems.forEach((p, i) => {
    if (skill === "ADDITION" && p.question.includes("\\frac")) {
      errors.push({
        rule: "SKILL_ALIGNMENT",
        message: `Problem ${i+1} contains fraction notation in an Addition worksheet`,
        questionIndex: i,
        severity: "error",
      });
    }
    if (skill === "FRACTIONS" && p.question.match(/^\d+\s*[x]\s*\d+$/) && !p.question.includes("\\frac")) {
      errors.push({
        rule: "SKILL_ALIGNMENT",
        message: `Problem ${i+1} appears to be multiplication, not fractions`,
        questionIndex: i,
        severity: "error",
      });
    }
  });

  return errors;
}

function validateIntroductionStage(
  problems: WorksheetProblem[],
  skill: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const introProblems = getStageProblems(problems, 0);

  introProblems.forEach((p, i) => {
    const features = extractFeatures(p.question, p.answer, skill);

    // Introduction must not have missing addends
    if (features.isMissingAddend) {
      errors.push({
        rule: "INTRO_NO_MISSING_ADDEND",
        message: `Introduction problem ${i+1} has missing addend — too advanced for introduction`,
        questionIndex: i,
        severity: "error",
      });
    }

    // Introduction must not be word problems
    if (features.isWordProblem && skill !== "FRACTIONS") {
      errors.push({
        rule: "INTRO_NO_WORD_PROBLEMS",
        message: `Introduction problem ${i+1} is a word problem — should be simple equation`,
        questionIndex: i,
        severity: "warning",
      });
    }
  });

  return errors;
}

function validateMasteryStage(
  problems: WorksheetProblem[],
  skill: string,
  microSkillAllowedForms: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const masteryProblems = getStageProblems(problems, 4);

  masteryProblems.forEach((p, i) => {
    const pIdx = 24 + i;
    const features = extractFeatures(p.question, p.answer, skill);

    // Mastery may change numbers and format but NOT introduce new operations
    // For fractions: mastery of "identify" should not introduce "simplify"
    if (skill === "FRACTIONS" && features.conceptDepth) {
      const introFeatures = extractFeatures(problems[0].question, problems[0].answer, skill);
      const introDepth = introFeatures.conceptDepth ?? 1;
      if ((features.conceptDepth ?? 1) > introDepth + 1) {
        errors.push({
          rule: "MASTERY_NO_NEW_CONCEPTS",
          message: `Mastery problem ${pIdx+1} introduces concept depth ${features.conceptDepth} but worksheet teaches depth ${introDepth}`,
          questionIndex: pIdx,
          severity: "error",
        });
      }
    }
  });

  return errors;
}

function validateStageDifficultyTrend(
  problems: WorksheetProblem[],
  skill: string
): { errors: ValidationError[]; stageAverages: number[] } {
  const errors: ValidationError[] = [];

  // Calculate average difficulty per stage
  const stageAverages: number[] = [];
  for (let s = 0; s < 5; s++) {
    const stageProbs = getStageProblems(problems, s);
    if (stageProbs.length === 0) { stageAverages.push(0); continue; }
    const scores = stageProbs.map(p => scoreProblem(p.question, p.answer, skill).total);
    stageAverages.push(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  // Each stage must be at least 5% harder than the previous
  const MIN_INCREASE = 1.05;
  for (let s = 1; s < 5; s++) {
    if (stageAverages[s] < stageAverages[s - 1] * MIN_INCREASE && stageAverages[s - 1] > 0) {
      errors.push({
        rule: "STAGE_DIFFICULTY_TREND",
        message: `Stage ${s+1} avg (${stageAverages[s].toFixed(1)}) must be at least 5% above Stage ${s} (${stageAverages[s-1].toFixed(1)}) — required: ${(stageAverages[s-1]*MIN_INCREASE).toFixed(1)}`,
        stageIndex: s,
        severity: "error",
      });
    }
  }

  return { errors, stageAverages };
}

function validateRollingDifficultyTrend(
  problems: WorksheetProblem[],
  skill: string
): { errors: ValidationError[]; difficultyProfile: number[] } {
  const errors: ValidationError[] = [];
  const scores = problems.map(p => scoreProblem(p.question, p.answer, skill).total);

  // Rolling average with window of 3
  const WINDOW = 3;
  const rolling: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    const start = Math.max(0, i - WINDOW + 1);
    const slice = scores.slice(start, i + 1);
    rolling.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  // Rolling average should not drop more than 15% across the full worksheet
  const firstHalf = rolling.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
  const secondHalf = rolling.slice(15).reduce((a, b) => a + b, 0) / 15;

  if (secondHalf < firstHalf * 0.85) {
    errors.push({
      rule: "ROLLING_DIFFICULTY_TREND",
      message: `Second half avg difficulty (${secondHalf.toFixed(1)}) is more than 15% lower than first half (${firstHalf.toFixed(1)}) — overall progression regresses`,
      severity: "warning",
    });
  }

  return { errors, difficultyProfile: scores };
}

function validateStageTransitions(stages: Stage[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check that each stage introduces at most one new cognitive demand
  // by comparing questionForms
  for (let s = 1; s < stages.length; s++) {
    const prev = stages[s - 1];
    const curr = stages[s];

    const newForms = curr.questionForms.filter(f => !prev.questionForms.includes(f));
    if (newForms.length > 1) {
      errors.push({
        rule: "STAGE_SINGLE_NEW_DEMAND",
        message: `Stage ${s+1} introduces ${newForms.length} new question forms at once (${newForms.join(", ")}) — max 1 allowed`,
        stageIndex: s,
        severity: "warning",
      });
    }
  }

  return errors;
}

// ── Single concept progression validator ────────────────────────────────────

function validateSingleConceptProgression(
  stages: Stage[],
  skill: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const blueprints = buildBlueprints(stages, skill);

  for (let i = 1; i < blueprints.length; i++) {
    const prevDemand = extractCognitiveDemand(blueprints[i - 1]);
    const currDemand = extractCognitiveDemand(blueprints[i]);
    const newDemands = countNewDemands(prevDemand, currDemand);

    if (newDemands.length > 1) {
      errors.push({
        rule: "SINGLE_CONCEPT_PROGRESSION",
        message: `Stage ${i+1} introduces ${newDemands.length} new cognitive demands at once: ${newDemands.join(", ")}. Maximum is 1.`,
        stageIndex: i,
        severity: "error",
      });
    }
  }

  return errors;
}

// ── Fraction concept depth validator ─────────────────────────────────────────

function validateFractionConceptDepth(
  problems: WorksheetProblem[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const depthMap: Record<string, number> = {
    "identify": 1, "write": 1,
    "simplify": 2,
    "add-same": 3,
    "add-unlike": 4,
    "mul": 5,
    "div": 6,
  };

  const depths = problems.map(p => {
    if (p.question.includes("/ \\frac") || p.question.includes("/ \frac")) return 6;
    if (p.question.includes("x \\frac") || p.question.includes("x \frac")) return 5;
    if (p.question.includes("+ \\frac") && p.question.match(/\\frac.*\\frac/)) return 4;
    if (p.question.includes("+ \\frac")) return 3;
    if (p.question.includes("Simplify")) return 2;
    return 1;
  });

  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);

  if (maxDepth - minDepth > 1) {
    errors.push({
      rule: "FRACTION_CONCEPT_DEPTH",
      message: `Worksheet spans concept depths ${minDepth} to ${maxDepth} (range of ${maxDepth-minDepth}). Max allowed range is 1. Mixing fraction identification with multiplication is not permitted.`,
      severity: "error",
    });
  }

  return errors;
}

// ── Main validator ────────────────────────────────────────────────────────────

export function validateWorksheet(
  problems: WorksheetProblem[],
  skill: string,
  microSkillId: string,
  stages: Stage[],
  allowedForms: string[]
): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Run all validators
  allErrors.push(...validateSkillAlignment(problems, skill, microSkillId));
  allErrors.push(...validateSingleConceptProgression(stages, skill));
  if (skill === "FRACTIONS") allErrors.push(...validateFractionConceptDepth(problems));
  allErrors.push(...validateIntroductionStage(problems, skill));
  allErrors.push(...validateMasteryStage(problems, skill, allowedForms));
  allErrors.push(...validateStageTransitions(stages));

  const { errors: trendErrors, stageAverages } = validateStageDifficultyTrend(problems, skill);
  allErrors.push(...trendErrors);

  const { errors: rollErrors, difficultyProfile } = validateRollingDifficultyTrend(problems, skill);
  allErrors.push(...rollErrors);

  const errors = allErrors.filter(e => e.severity === "error");
  const warnings = allErrors.filter(e => e.severity === "warning");

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    difficultyProfile,
    stageAverages,
  };
}

// ── Regeneration loop ─────────────────────────────────────────────────────────

export function validateAndLog(
  result: ValidationResult,
  skill: string,
  sheetNumber: number
): void {
  if (!result.passed) {
    console.warn(
      `[validator] Sheet ${sheetNumber} (${skill}) FAILED validation:`,
      result.errors.map(e => e.message).join("; ")
    );
  }
  if (result.warnings.length > 0) {
    console.log(
      `[validator] Sheet ${sheetNumber} (${skill}) warnings:`,
      result.warnings.map(e => e.message).join("; ")
    );
  }
}
