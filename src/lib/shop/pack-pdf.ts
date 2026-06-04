// src/lib/shop/pack-pdf.ts
// Renders a shop pack PDF (all sheets + final answer key) using the
// new auto-scaling layout. Each sheet's problem count drives its own layout.

import { renderSheetHtml, wrapDocument } from "@/lib/worksheet/render-sheet";
import type { SheetProblem } from "@/lib/worksheet/render-sheet";

export interface PackSheet {
  problems: SheetProblem[];
  skillBand: string; // e.g. "Adding 1-10"
}

export interface PackPdfInput {
  skillLabel: string; // e.g. "Addition Practice"
  skillCode: string;  // e.g. "ADDITION"
  levelCode: string;
  sheets: PackSheet[];
}

/**
 * Build the full HTML document for a shop pack PDF.
 * Layout:
 *   - One page per practice sheet (no answer key)
 *   - One combined answer key at the end covering all sheets
 */
export function renderPackHtml(input: PackPdfInput): string {
  const sheetHtmls: string[] = [];

  input.sheets.forEach((sheet, i) => {
    const html = renderSheetHtml(
      sheet.problems,
      {
        subjectLabel: "Mathematics",
        levelCode: input.levelCode,
        skillName: `${input.skillLabel} — ${sheet.skillBand}`,
        sheetNumber: i + 1,
        totalSheets: input.sheets.length,
        timeLimitMinutes: 10,
        showDisclaimer: true,
      },
      false /* not answer key */
    );
    sheetHtmls.push(html);
  });

  // One combined answer key at the end
  const allAnswers: SheetProblem[] = input.sheets.flatMap((sheet) => sheet.problems);
  const answerKeyHtml = renderSheetHtml(
    allAnswers,
    {
      subjectLabel: "Mathematics",
      levelCode: input.levelCode,
      skillName: `${input.skillLabel} — Complete Answer Key`,
    },
    true /* answer key */
  );

  return wrapDocument(
    [...sheetHtmls, answerKeyHtml],
    `${input.skillLabel} Pack`
  );
}
