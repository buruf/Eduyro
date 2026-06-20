// src/lib/shop/worksheet-blueprint.ts
// Phase 2 — Curriculum Compiler: Worksheet Blueprint Engine.
// Produces a full worksheet spec BEFORE any question is generated, so the
// generator never has to invent distribution, representation, or scope on
// the fly. Wraps and extends the existing per-stage DifficultyBlueprint.

import { type MicroSkill, type Stage } from "./curriculum-graph";
import { buildBlueprints, extractCognitiveDemand, type DifficultyBlueprint } from "./difficulty-blueprint";

// ── Representation progression (briefing Phase 2 spec) ───────────────────────
// Stage 1=description, Stage 2=context, Stage 3=symbolic, Stage 4=production, Stage 5=mixed
export type Representation = "description" | "context" | "symbolic" | "production" | "mixed";

const STAGE_REPRESENTATION: Representation[] = [
  "description",
  "context",
  "symbolic",
  "production",
  "mixed",
];

export interface RepresentationProgression {
  stage: 1 | 2 | 3 | 4 | 5;
  representation: Representation;
  rationale: string;
}

function buildRepresentationProgression(stages: Stage[]): RepresentationProgression[] {
  return stages.map((stage, i) => ({
    stage: (i + 1) as 1 | 2 | 3 | 4 | 5,
    representation: STAGE_REPRESENTATION[i] ?? "mixed",
    rationale: `Stage ${i + 1} (${stage.label}) introduces "${stage.cognitiveChange}" — ` +
      `presented via ${STAGE_REPRESENTATION[i] ?? "mixed"} representation.`,
  }));
}

// ── Question distribution ────────────────────────────────────────────────────
// How many problems of each allowed form land in each stage, derived directly
// from Stage.problemCount and Stage.questionForms (no guessing at runtime).

export interface FormAllocation {
  form: string;
  count: number;
}

export interface StageDistribution {
  stage: 1 | 2 | 3 | 4 | 5;
  stageName: string;
  totalProblems: number;
  forms: FormAllocation[];
}

function buildQuestionDistribution(stages: Stage[]): StageDistribution[] {
  return stages.map((stage, i) => {
    const forms = stage.questionForms.length > 0 ? stage.questionForms : ["default"];
    const base = Math.floor(stage.problemCount / forms.length);
    let remainder = stage.problemCount - base * forms.length;

    const allocation: FormAllocation[] = forms.map(form => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      return { form, count: base + extra };
    });

    return {
      stage: (i + 1) as 1 | 2 | 3 | 4 | 5,
      stageName: stage.label,
      totalProblems: stage.problemCount,
      forms: allocation,
    };
  });
}

// ── Forbidden concepts at the worksheet level ────────────────────────────────
// A concept is truly forbidden for the WHOLE worksheet only if no stage ever
// introduces it (per its actual constraint flags — not free-text matching
// against cognitiveChange descriptions, which use inconsistent vocabulary).
// This is a guardrail for concepts that should NEVER appear, e.g. a worksheet
// whose final stage still never uses word problems.

function buildWorksheetForbiddenConcepts(blueprints: DifficultyBlueprint[]): string[] {
  const forbidden = new Set<string>();
  let everMissingAddend = false;
  let everWordProblem = false;
  let everCarry = false;

  for (const bp of blueprints) {
    bp.forbiddenConcepts.forEach(c => forbidden.add(c));
    const demand = extractCognitiveDemand(bp);
    if (demand.hasMissingAddend) everMissingAddend = true;
    if (demand.hasWordProblem) everWordProblem = true;
    if (demand.hasCarry) everCarry = true;
  }

  return [...forbidden].filter(c => {
    if (c === "missing_addend") return !everMissingAddend;
    if (c === "word_problem") return !everWordProblem;
    if (c === "carry") return !everCarry;
    return true;
  });
}

// ── Mastery metrics ───────────────────────────────────────────────────────────
// Target accuracy and completion-time bands per worksheet, scaled by the
// micro-skill's declared difficulty and the worksheet's stage range.

export interface MasteryMetrics {
  targetAccuracyPct: number;       // % correct expected for "mastered"
  minPassAccuracyPct: number;      // % correct to advance
  targetCompletionMinutes: number; // expected time to complete all stages
}

function buildMasteryMetrics(microSkill: MicroSkill, stages: Stage[]): MasteryMetrics {
  const totalProblems = stages.reduce((sum, s) => sum + s.problemCount, 0);
  // Harder skills (more stars) get slightly lower pass thresholds and more time per problem.
  const starFactor = microSkill.difficultyStars; // 1-5
  const secondsPerProblem = 25 + starFactor * 8; // ranges ~33s (1★) to ~65s (5★)

  return {
    targetAccuracyPct: Math.max(75, 95 - starFactor * 2),
    minPassAccuracyPct: Math.max(60, 80 - starFactor * 3),
    targetCompletionMinutes: Math.round((totalProblems * secondsPerProblem) / 60),
  };
}

// ── The full worksheet blueprint ──────────────────────────────────────────────

export interface WorksheetBlueprint {
  microSkillId: string;
  skill: string;
  levelCode: string;
  difficultyBlueprints: DifficultyBlueprint[];
  representations: RepresentationProgression[];
  questionDistribution: StageDistribution[];
  forbiddenConcepts: string[];
  masteryMetrics: MasteryMetrics;
  totalProblems: number;
}

export function buildWorksheetBlueprint(microSkill: MicroSkill): WorksheetBlueprint {
  const stages = microSkill.stages;
  const difficultyBlueprints = buildBlueprints(stages, microSkill.skill);

  return {
    microSkillId: microSkill.id,
    skill: microSkill.skill,
    levelCode: microSkill.levelCode,
    difficultyBlueprints,
    representations: buildRepresentationProgression(stages),
    questionDistribution: buildQuestionDistribution(stages),
    forbiddenConcepts: buildWorksheetForbiddenConcepts(difficultyBlueprints),
    masteryMetrics: buildMasteryMetrics(microSkill, stages),
    totalProblems: stages.reduce((sum, s) => sum + s.problemCount, 0),
  };
}

// ── Validation: does a planned form allocation match the blueprint? ──────────
// Used by the generator/validator to confirm it produced exactly what was
// planned — no silent drift between blueprint and output.

export function distributionMatchesPlan(
  planned: StageDistribution,
  actualCountsByForm: Record<string, number>
): boolean {
  return planned.forms.every(f => (actualCountsByForm[f.form] ?? 0) === f.count)
    && Object.values(actualCountsByForm).reduce((a, b) => a + b, 0) === planned.totalProblems;
}
