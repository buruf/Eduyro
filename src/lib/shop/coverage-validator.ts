// src/lib/shop/coverage-validator.ts
// Phase 2 — Curriculum Compiler: Coverage Validator.
// Checks an entire skill's micro-skill sequence (all ~100 sheets) for:
//   - gaps in sheet-range coverage
//   - duplicate / overlapping sheet ranges
//   - concept jumps that skip a difficulty step between consecutive micro-skills
//
// This runs at the curriculum-graph level — BEFORE any pack is generated —
// so a broken progression is caught at authoring time, not discovered by a
// student halfway through a 100-sheet pack.

import { getMicroSkills, type MicroSkill } from "./curriculum-graph";
import { buildBlueprints, extractCognitiveDemand, countNewDemands } from "./difficulty-blueprint";

export interface CoverageIssue {
  rule: "GAP" | "DUPLICATE" | "CONCEPT_JUMP" | "EMPTY_GRAPH";
  message: string;
  sheetRange?: [number, number];
  microSkillIds?: string[];
  severity: "error" | "warning";
}

export interface CoverageReport {
  skill: string;
  totalSheets: number;
  microSkillCount: number;
  passed: boolean;
  issues: CoverageIssue[];
}

// Maximum number of *new* cognitive demands allowed to appear between the
// last stage of one micro-skill and the first stage of the next. More than
// this means the student is being asked to leap too far at once.
const MAX_CROSS_SKILL_NEW_DEMANDS = 2;

export function validateCoverage(skill: string, expectedTotalSheets: number = 100): CoverageReport {
  const microSkills = getMicroSkills(skill);
  const issues: CoverageIssue[] = [];

  if (microSkills.length === 0) {
    return {
      skill,
      totalSheets: 0,
      microSkillCount: 0,
      passed: false,
      issues: [{
        rule: "EMPTY_GRAPH",
        message: `No micro-skills defined for ${skill} — curriculum graph entry missing`,
        severity: "error",
      }],
    };
  }

  // Sort by sheet range start so gap/overlap detection walks in order
  const sorted = [...microSkills].sort((a, b) => a.sheetRange[0] - b.sheetRange[0]);

  // ── Gaps and duplicates/overlaps ──────────────────────────────────────────
  let cursor = 1;
  for (const ms of sorted) {
    const [start, end] = ms.sheetRange;

    if (start > cursor) {
      issues.push({
        rule: "GAP",
        message: `Sheets ${cursor}-${start - 1} are not covered by any micro-skill (gap before "${ms.name}")`,
        sheetRange: [cursor, start - 1],
        microSkillIds: [ms.id],
        severity: "error",
      });
    } else if (start < cursor) {
      issues.push({
        rule: "DUPLICATE",
        message: `"${ms.name}" (sheets ${start}-${end}) overlaps the previous micro-skill's range (overlap starts at sheet ${start}, expected ${cursor})`,
        sheetRange: [start, Math.min(end, cursor - 1)],
        microSkillIds: [ms.id],
        severity: "error",
      });
    }

    if (end < start) {
      issues.push({
        rule: "DUPLICATE",
        message: `"${ms.name}" has an invalid sheet range [${start}, ${end}] — end before start`,
        sheetRange: ms.sheetRange,
        microSkillIds: [ms.id],
        severity: "error",
      });
    }

    cursor = Math.max(cursor, end + 1);
  }

  if (cursor - 1 < expectedTotalSheets) {
    issues.push({
      rule: "GAP",
      message: `Sheets ${cursor}-${expectedTotalSheets} are not covered — curriculum graph ends early (last covered sheet: ${cursor - 1})`,
      sheetRange: [cursor, expectedTotalSheets],
      severity: "error",
    });
  } else if (cursor - 1 > expectedTotalSheets) {
    issues.push({
      rule: "DUPLICATE",
      message: `Curriculum graph extends to sheet ${cursor - 1}, beyond the expected ${expectedTotalSheets}-sheet pack`,
      sheetRange: [expectedTotalSheets + 1, cursor - 1],
      severity: "warning",
    });
  }

  // Exact duplicate ID check (same micro-skill referenced twice)
  const seenIds = new Set<string>();
  for (const ms of microSkills) {
    if (seenIds.has(ms.id)) {
      issues.push({
        rule: "DUPLICATE",
        message: `Micro-skill id "${ms.id}" appears more than once in the curriculum graph`,
        microSkillIds: [ms.id],
        severity: "error",
      });
    }
    seenIds.add(ms.id);
  }

  // ── Concept jumps between consecutive micro-skills ───────────────────────
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Reviews are explicitly allowed to revisit easier ground — skip jump check
    if (curr.isReview) continue;

    const prevBlueprints = buildBlueprints(prev.stages, skill);
    const currBlueprints = buildBlueprints(curr.stages, skill);
    if (prevBlueprints.length === 0 || currBlueprints.length === 0) continue;

    const prevDemand = extractCognitiveDemand(prevBlueprints[prevBlueprints.length - 1]);
    const currDemand = extractCognitiveDemand(currBlueprints[0]);
    const newDemands = countNewDemands(prevDemand, currDemand);

    if (newDemands.length > MAX_CROSS_SKILL_NEW_DEMANDS) {
      issues.push({
        rule: "CONCEPT_JUMP",
        message: `"${prev.name}" → "${curr.name}" introduces ${newDemands.length} new demands at once ` +
          `(${newDemands.join(", ")}) — exceeds the max of ${MAX_CROSS_SKILL_NEW_DEMANDS}. Consider an intermediate micro-skill.`,
        microSkillIds: [prev.id, curr.id],
        severity: "error",
      });
    }

    // Difficulty must not regress across micro-skill boundaries either
    if (currBlueprints[0].targetMid < prevBlueprints[prevBlueprints.length - 1].targetMid * 0.95) {
      issues.push({
        rule: "CONCEPT_JUMP",
        message: `"${curr.name}" starts easier than "${prev.name}" ends (${currBlueprints[0].targetMid.toFixed(1)} < ${prevBlueprints[prevBlueprints.length - 1].targetMid.toFixed(1)}) — difficulty regresses across the boundary`,
        microSkillIds: [prev.id, curr.id],
        severity: "warning",
      });
    }
  }

  const errors = issues.filter(i => i.severity === "error");

  return {
    skill,
    totalSheets: cursor - 1,
    microSkillCount: microSkills.length,
    passed: errors.length === 0,
    issues,
  };
}

// Convenience: validate every skill currently in the curriculum graph.
export function validateAllCoverage(skills: string[], expectedTotalSheets: number = 100): CoverageReport[] {
  return skills.map(skill => validateCoverage(skill, expectedTotalSheets));
}

export function logCoverageReport(report: CoverageReport): void {
  if (report.passed) {
    console.log(`[coverage] ${report.skill}: OK — ${report.microSkillCount} micro-skills covering sheets 1-${report.totalSheets}`);
  } else {
    console.warn(`[coverage] ${report.skill}: FAILED —`, report.issues.map(i => `[${i.rule}] ${i.message}`).join(" | "));
  }
  const warnings = report.issues.filter(i => i.severity === "warning");
  if (warnings.length > 0) {
    console.log(`[coverage] ${report.skill} warnings:`, warnings.map(w => w.message).join(" | "));
  }
}
