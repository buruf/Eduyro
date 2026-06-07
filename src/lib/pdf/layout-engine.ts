// src/lib/pdf/layout-engine.ts
// Mode-aware adaptive layout engine.
// Calculates available height after subtracting all chrome elements.

export interface PageLayout {
  columns: number;
  rowHeightPt: number;
  fontSizePt: number;
  answerLineWidthPt: number;
  rowPaddingPt: number;
}

const PAGE_HEIGHT_PT   = 792;
const MARGIN_TOP_PT    = 30;
const MARGIN_BOTTOM_PT = 36;
const ANSWER_LINE_WIDTH_PT = 72;
const MIN_ROW_HEIGHT_PT    = 14;
const MAX_ROW_HEIGHT_PT    = 56;

// Chrome heights in points
const CHROME_HEADER_BAR    = 62;
const CHROME_STUDENT_INFO  = 32;
const CHROME_SKILL_BADGE   = 34;
const CHROME_OBJECTIVE     = 26;
const CHROME_WORKED_EXAMPLE = 115;
const CHROME_ZONE_HEADER   = 20; // per zone
const CHROME_PROGRESS_BAR  = 32;
const CHROME_REFLECTION    = 38;
const CHROME_FOOTER        = 22;

export function computeLayout(
  problemCount: number,
  mode: "tutorial" | "practice" | "assessment" = "practice"
): PageLayout {
  // Calculate total chrome
  let chrome = CHROME_HEADER_BAR + CHROME_FOOTER + MARGIN_TOP_PT + MARGIN_BOTTOM_PT;

  if (mode !== "assessment") {
    chrome += CHROME_STUDENT_INFO;
    chrome += CHROME_SKILL_BADGE;
    chrome += CHROME_OBJECTIVE;
    chrome += CHROME_ZONE_HEADER * 5;
    chrome += CHROME_PROGRESS_BAR;
    chrome += CHROME_REFLECTION;
  }

  if (mode === "tutorial") {
    chrome += CHROME_WORKED_EXAMPLE;
  }

  const available = PAGE_HEIGHT_PT - chrome;
  const startCols = problemCount <= 12 ? 1 : problemCount <= 40 ? 2 : 3;

  for (const cols of [startCols, startCols + 1, 3].filter((c, i, a) => c <= 3 && a.indexOf(c) === i)) {
    const rowsPerCol = Math.ceil(problemCount / cols);
    const rowHeight = available / rowsPerCol;

    if (rowHeight >= MIN_ROW_HEIGHT_PT) {
      const clamped = Math.min(rowHeight, MAX_ROW_HEIGHT_PT);
      const fontSize = Math.min(Math.max(7.5, clamped * 0.48), 11);
      return {
        columns: cols,
        rowHeightPt: clamped,
        fontSizePt: fontSize,
        answerLineWidthPt: ANSWER_LINE_WIDTH_PT,
        rowPaddingPt: Math.max(1, (clamped - fontSize * 1.2) / 2),
      };
    }
  }

  return {
    columns: 3,
    rowHeightPt: MIN_ROW_HEIGHT_PT,
    fontSizePt: 7.5,
    answerLineWidthPt: ANSWER_LINE_WIDTH_PT,
    rowPaddingPt: 1,
  };
}

export { ANSWER_LINE_WIDTH_PT };
