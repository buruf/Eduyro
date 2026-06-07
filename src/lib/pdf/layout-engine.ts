// src/lib/pdf/layout-engine.ts
// Adaptive layout engine for PDF worksheets.
// Calculates exact dimensions to fit ALL problems on ONE page — always.

export interface PageLayout {
  columns: number;           // 1, 2, or 3
  rowHeightPt: number;       // exact height per problem row in points
  fontSizePt: number;        // question font size
  answerLineWidthPt: number; // fixed width of answer line at right
  questionPaddingPt: number; // left padding for question number
  rowPaddingPt: number;      // vertical padding within each row
}

// Fixed page dimensions (Letter, points)
const PAGE_HEIGHT_PT   = 792;
const PAGE_WIDTH_PT    = 612;
const MARGIN_TOP_PT    = 36;   // 0.5in
const MARGIN_BOTTOM_PT = 36;
const MARGIN_LEFT_PT   = 36;
const MARGIN_RIGHT_PT  = 36;
const HEADER_HEIGHT_PT = 95;   // title + student info area (conservative)
const FOOTER_HEIGHT_PT = 30;   // footer with padding

const AVAILABLE_HEIGHT = PAGE_HEIGHT_PT - MARGIN_TOP_PT - MARGIN_BOTTOM_PT - HEADER_HEIGHT_PT - FOOTER_HEIGHT_PT;
const AVAILABLE_WIDTH  = PAGE_WIDTH_PT - MARGIN_LEFT_PT - MARGIN_RIGHT_PT;

const ANSWER_LINE_WIDTH_PT = 80; // fixed right-aligned answer line
const MIN_ROW_HEIGHT_PT    = 20; // minimum — accounts for KaTeX stacked fraction height
const MAX_ROW_HEIGHT_PT    = 72; // maximum — don't waste space

export function computeLayout(problemCount: number): PageLayout {
  // Choose starting column count based on problem count
  // 1-12 problems: start with 1 col (spacious)
  // 13-40 problems: start with 2 cols (standard worksheet)
  // 41+ problems: start with 3 cols (dense drill)
  const startCols = problemCount <= 12 ? 1 : problemCount <= 40 ? 2 : 3;

  for (const columns of [startCols, startCols + 1, startCols + 2].filter(c => c <= 3)) {
    const rowsPerColumn = Math.ceil(problemCount / columns);
    const rowHeight = AVAILABLE_HEIGHT / rowsPerColumn;

    if (rowHeight >= MIN_ROW_HEIGHT_PT) {
      // This column count works — compute font size from row height
      const clampedRowHeight = Math.min(rowHeight, MAX_ROW_HEIGHT_PT);
      const fontSizePt = Math.min(
        Math.max(7, clampedRowHeight * 0.45), // 45% of row height for font
        12 // cap at 12pt for readability
      );

      return {
        columns,
        rowHeightPt: clampedRowHeight,
        fontSizePt,
        answerLineWidthPt: ANSWER_LINE_WIDTH_PT,
        questionPaddingPt: 16,
        rowPaddingPt: Math.max(1, (clampedRowHeight - fontSizePt * 1.2) / 2),
      };
    }
  }

  // Fallback: 3 columns, minimum size
  return {
    columns: 3,
    rowHeightPt: MIN_ROW_HEIGHT_PT,
    fontSizePt: 7,
    answerLineWidthPt: ANSWER_LINE_WIDTH_PT,
    questionPaddingPt: 12,
    rowPaddingPt: 1,
  };
}

export { AVAILABLE_WIDTH, AVAILABLE_HEIGHT, MARGIN_LEFT_PT, MARGIN_TOP_PT };
