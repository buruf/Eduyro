// src/lib/shop/difficulty-blueprint.ts
// Creates difficulty blueprints BEFORE question generation.
// Each blueprint defines exact target ranges and constraints per stage.
// Generator uses blueprints to constrain output — never invents progression.

import { type Stage } from "./curriculum-graph";
import { scoreAddition, scoreSubtraction, scoreMultiplication, scoreDivision, scoreFraction, type ProblemFeatures } from "./difficulty-scorer";

export interface DifficultyBlueprint {
  stage: 1 | 2 | 3 | 4 | 5;
  stageName: string;
  targetMin: number;        // minimum acceptable difficulty score
  targetMax: number;        // maximum acceptable difficulty score
  targetMid: number;        // ideal midpoint score
  allowedForms: string[];
  allowedConcepts: string[];
  forbiddenConcepts: string[];
  // Explicit feature constraints — generator MUST satisfy these
  constraints: {
    isMissingAddend: boolean;
    isWordProblem: boolean;
    carryRequired?: boolean;
    maxOperand?: number;
    minOperand?: number;
    denominator?: number;
    maxDenominator?: number;
    maxConceptDepth?: number;
    minConceptDepth?: number;
  };
}

// Stage separation requirement: each stage must be at least 5% harder than previous
const MIN_STAGE_INCREASE = 1.05;

// ── Build blueprints from a micro-skill's stage definitions ──────────────────

export function buildBlueprints(
  stages: Stage[],
  skill: string
): DifficultyBlueprint[] {
  const blueprints: DifficultyBlueprint[] = [];

  // Calculate base difficulty for each stage from its constraints
  const baseScores = stages.map(stage => {
    return estimateStageBaseDifficulty(stage, skill);
  });

  // Enforce minimum 5% increase between stages
  const adjustedScores: number[] = [baseScores[0]];
  for (let i = 1; i < baseScores.length; i++) {
    const minRequired = adjustedScores[i - 1] * MIN_STAGE_INCREASE;
    adjustedScores.push(Math.max(baseScores[i], minRequired));
  }

  // Build blueprint for each stage
  stages.forEach((stage, i) => {
    const mid = adjustedScores[i];
    const spread = mid * 0.2; // ±20% of midpoint

    // Derive forbidden concepts from stage constraints
    const forbiddenConcepts: string[] = [];
    const allowedConcepts: string[] = [stage.cognitiveChange ?? stage.label];

    // Introduction stage: most restrictive
    if (stage.type === "introduction") {
      forbiddenConcepts.push("missing_addend", "word_problem", "carry");
    }
    // Guided: no word problems yet
    if (stage.type === "guided") {
      forbiddenConcepts.push("word_problem");
    }
    // Mastery: same concepts only, different representations allowed
    if (stage.type === "mastery") {
      // Mastery inherits all allowedConcepts from previous stages
      stages.slice(0, i).forEach(s => allowedConcepts.push(s.cognitiveChange ?? s.label));
    }

    blueprints.push({
      stage: (i + 1) as 1|2|3|4|5,
      stageName: stage.label,
      targetMin: Math.max(1, mid - spread),
      targetMax: mid + spread,
      targetMid: mid,
      allowedForms: stage.questionForms,
      allowedConcepts,
      forbiddenConcepts,
      constraints: {
        isMissingAddend: stage.questionForms.some(f => f.includes("missing")),
        isWordProblem: stage.questionForms.some(f => f.includes("word")),
        carryRequired: stage.constraints.carry,
        maxOperand: stage.constraints.maxA,
        minOperand: stage.constraints.minA,
        denominator: stage.constraints.denominator,
        maxDenominator: stage.constraints.maxDenominator,
        maxConceptDepth: getConceptDepth(stage.questionForms),
        minConceptDepth: getConceptDepth(stage.questionForms),
      },
    });
  });

  return blueprints;
}

function getConceptDepth(forms: string[]): number {
  const depthMap: Record<string, number> = {
    "identify-frac": 1, "write-frac": 1,
    "simplify-frac": 2,
    "add-same-frac": 3,
    "add-unlike-frac": 4,
    "mul-frac": 5,
    "div-frac": 6,
    "a+b": 1, "a+1": 1, "a+2": 1,
    "missing-addend-a": 2, "missing-addend-b": 2,
    "word-add": 3,
  };
  const depths = forms.map(f => depthMap[f] ?? 1);
  return Math.max(...depths);
}

function estimateStageBaseDifficulty(stage: Stage, skill: string): number {
  const c = stage.constraints;

  if (skill === "ADDITION" || skill === "SUBTRACTION") {
    const features: ProblemFeatures = {
      maxOperand: c.maxA ?? 9,
      minOperand: c.minA ?? 1,
      carryCount: c.carry ? 1 : 0,
      isMissingAddend: stage.questionForms.some(f => f.includes("missing")),
      isWordProblem: stage.questionForms.some(f => f.includes("word")),
      addendCount: 2,
    };
    return skill === "ADDITION"
      ? scoreAddition(features).total
      : scoreSubtraction(features).total;
  }

  if (skill === "MULTIPLICATION") {
    const features: ProblemFeatures = {
      maxOperand: c.maxA ?? 9,
      minOperand: c.minA ?? 1,
      digitCount: String(c.maxA ?? 9).length,
      isMissingAddend: stage.questionForms.some(f => f.includes("missing")),
      isWordProblem: stage.questionForms.some(f => f.includes("word")),
    };
    return scoreMultiplication(features).total;
  }

  if (skill === "DIVISION") {
    const features: ProblemFeatures = {
      maxOperand: c.maxA ?? 9,
      minOperand: c.minB ?? 1,
      digitCount: String(c.maxA ?? 9).length,
      carryCount: c.operation === "remainder" ? 1 : 0,
      isWordProblem: stage.questionForms.some(f => f.includes("word")),
    };
    return scoreDivision(features).total;
  }

  if (skill === "FRACTIONS") {
    const features: ProblemFeatures = {
      denominator: c.denominator ?? c.maxDenominator ?? 4,
      conceptDepth: getConceptDepth(stage.questionForms),
      isWordProblem: stage.questionForms.some(f => f.includes("word")),
      requiresLCM: stage.questionForms.includes("add-unlike-frac"),
    };
    return scoreFraction(features).total;
  }

  return 10 * (stage.type === "introduction" ? 1 :
               stage.type === "guided" ? 2 :
               stage.type === "fluency" ? 3 :
               stage.type === "independent" ? 4 : 5);
}

// ── Validate a single problem against its blueprint ──────────────────────────

export function problemFitsBlueprint(
  score: number,
  blueprint: DifficultyBlueprint
): boolean {
  return score >= blueprint.targetMin && score <= blueprint.targetMax;
}

// ── Cognitive demand comparison between adjacent stages ──────────────────────

export interface CognitiveDemandProfile {
  hasMissingAddend: boolean;
  hasWordProblem: boolean;
  hasCarry: boolean;
  conceptDepth: number;
  maxOperand: number;
}

export function extractCognitiveDemand(blueprint: DifficultyBlueprint): CognitiveDemandProfile {
  return {
    hasMissingAddend: blueprint.constraints.isMissingAddend,
    hasWordProblem: blueprint.constraints.isWordProblem,
    hasCarry: blueprint.constraints.carryRequired ?? false,
    conceptDepth: blueprint.constraints.maxConceptDepth ?? 1,
    maxOperand: blueprint.constraints.maxOperand ?? 9,
  };
}

export function countNewDemands(
  prev: CognitiveDemandProfile,
  curr: CognitiveDemandProfile
): string[] {
  const newDemands: string[] = [];

  if (curr.hasMissingAddend && !prev.hasMissingAddend) newDemands.push("missing_addend");
  if (curr.hasWordProblem && !prev.hasWordProblem) newDemands.push("word_problem");
  if (curr.hasCarry && !prev.hasCarry) newDemands.push("carry");
  if (curr.conceptDepth > prev.conceptDepth) newDemands.push(`concept_depth_${prev.conceptDepth}_to_${curr.conceptDepth}`);
  // Large operand jump (more than 2x) counts as a new demand
  if (curr.maxOperand > prev.maxOperand * 2.5) newDemands.push(`operand_jump_${prev.maxOperand}_to_${curr.maxOperand}`);

  return newDemands;
}
