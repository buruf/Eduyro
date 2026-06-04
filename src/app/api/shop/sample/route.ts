// src/app/api/shop/sample?skill=ADDITION
// Returns 2 sample sheets as HTML for in-browser preview — no PDF, no download.

import { NextRequest } from "next/server";
import { ok, validationError, withRateLimit } from "@/lib/api/helpers";
import { generateShopSampleProblems, type Skill } from "@/lib/shop/sample-problems";
import { renderSheetHtml } from "@/lib/worksheet/render-sheet";

const SKILLS = ["ADDITION","SUBTRACTION","MULTIPLICATION","DIVISION","FRACTIONS","DECIMALS","RATIOS","PRE_ALGEBRA","LINEAR_EQUATIONS","POLYNOMIALS"] as const;

const SKILL_LABEL: Record<Skill, string> = {
  ADDITION: "Addition", SUBTRACTION: "Subtraction",
  MULTIPLICATION: "Multiplication", DIVISION: "Division",
  FRACTIONS: "Fractions", DECIMALS: "Decimals & Percentages",
  RATIOS: "Ratios & Proportions", PRE_ALGEBRA: "Pre-Algebra",
  LINEAR_EQUATIONS: "Linear Equations", POLYNOMIALS: "Polynomials",
};

const SKILL_LEVEL: Record<Skill, string> = {
  ADDITION: "M3", SUBTRACTION: "M4", MULTIPLICATION: "M5", DIVISION: "M6",
  FRACTIONS: "M7", DECIMALS: "M8", RATIOS: "M9", PRE_ALGEBRA: "M10",
  LINEAR_EQUATIONS: "M11", POLYNOMIALS: "M12",
};

const SAMPLE_SHEET_COUNT = 2;

export async function GET(req: NextRequest) {
  const rateLimited = await withRateLimit(req, 60, 60_000);
  if (rateLimited) return rateLimited;

  const skillParam = new URL(req.url).searchParams.get("skill")?.toUpperCase();
  if (!skillParam || !SKILLS.includes(skillParam as Skill)) {
    return validationError({ skill: [`Skill must be one of: ${SKILLS.join(", ")}`] });
  }
  const skill = skillParam as Skill;

  const sheets: string[] = [];
  for (let s = 1; s <= SAMPLE_SHEET_COUNT; s++) {
    const problems = generateShopSampleProblems(skill, s);
    const html = renderSheetHtml(
      problems,
      {
        subjectLabel: "Mathematics",
        levelCode: SKILL_LEVEL[skill],
        skillName: `${SKILL_LABEL[skill]} Practice — Sample`,
        sheetNumber: s,
        totalSheets: SAMPLE_SHEET_COUNT,
        timeLimitMinutes: 10,
        watermark: "SAMPLE — NOT FOR PRINTING",
      },
      false
    );
    sheets.push(html);
  }

  return ok({
    skill,
    label: SKILL_LABEL[skill],
    sheetCount: SAMPLE_SHEET_COUNT,
    sheetsHtml: sheets,
    note: "Sample previews are view-only. Purchase the pack to download printable PDFs.",
  });
}
