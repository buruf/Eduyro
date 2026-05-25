// src/app/api/shop/sample/route.ts
// GET /api/shop/sample?skill=ADDITION
//
// CHANGED: This endpoint no longer returns a downloadable PDF URL.
// It now returns sheet HTML rendered with a watermark, designed for
// in-browser preview only. Customers can SEE the sheets but cannot
// SAVE them, since no PDF file is generated.

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, validationError, withRateLimit } from "@/lib/api/helpers";
import { generateShopSampleProblems } from "@/lib/shop/sample-problems";
import { renderSheetHtml } from "@/lib/worksheet/render-sheet";

const SKILLS = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"] as const;
type Skill = typeof SKILLS[number];

const SKILL_LABEL: Record<Skill, string> = {
  ADDITION: "Addition",
  SUBTRACTION: "Subtraction",
  MULTIPLICATION: "Multiplication",
  DIVISION: "Division",
};

const SKILL_LEVEL: Record<Skill, string> = {
  ADDITION: "M3",
  SUBTRACTION: "M4",
  MULTIPLICATION: "M5",
  DIVISION: "M6",
};

const SAMPLE_SHEET_COUNT = 2; // was 3 — now 2 per product spec

export async function GET(req: NextRequest) {
  const rateLimited = await withRateLimit(req, 60, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const skillParam = url.searchParams.get("skill")?.toUpperCase();

  if (!skillParam || !SKILLS.includes(skillParam as Skill)) {
    return validationError({
      skill: [
        `Skill must be one of: ${SKILLS.join(", ")}`,
      ],
    });
  }
  const skill = skillParam as Skill;

  // Build 2 sample sheets. Each is the warmup (easiest) tier of that skill,
  // about 50 problems — enough that a casual viewer sees the format but the
  // problems aren't worth screen-capping for actual practice.
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
      false /* no answer key in samples */
    );
    sheets.push(html);
  }

  return ok({
    skill,
    label: SKILL_LABEL[skill],
    sheetCount: SAMPLE_SHEET_COUNT,
    sheetsHtml: sheets,
    // No downloadUrl on purpose. Front-end renders sheetsHtml inline.
    note: "Sample previews are view-only. Purchase the pack to download printable PDFs.",
  });
}
