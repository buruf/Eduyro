// src/lib/pdf/layout-engine.ts
// Mode-aware adaptive layout engine.
// Chrome constants calibrated to the v34+ renderer (flat list, no zone banners,
// no skill badges, no progress bars).

export interface PageLayout {
  columns: number;
  rowHeightPt: number;
  fontSizePt: number;
  answerLineWidthPt: number;
  rowPaddingPt: number;
}

const PAGE_HEIGHT_PT       = 792;
const MARGIN_TOP_PT        = 30;
const MARGIN_BOTTOM_PT     = 36;
const ANSWER_LINE_WIDTH_PT = 72;
const MIN_ROW_HEIGHT_PT    = 12;
const MAX_ROW_HEIGHT_PT    = 48; // cap used only for font-size selection heuristic

// ── Chrome heights (points) — what the renderer actually renders ──────────────
// Header bar: paddingVertical:8×2 + org/title/sub text rows
const CHROME_HEADER_BAR     = 60;
// Student info row (name / date / score) + gap below
const CHROME_STUDENT_INFO   = 30;
// "Today I will" objective box + gap below
const CHROME_OBJECTIVE      = 32;
// Mastery-check strip at the bottom of the problem area
const CHROME_MASTERY        = 20;
// Worked example box shown only in tutorial mode
const CHROME_WORKED_EXAMPLE = 95;
// Footer is position:absolute — already absorbed by MARGIN_BOTTOM_PT; no extra cost

export function computeLayout(
  problemCount: number,
  mode: "tutorial" | "practice" | "assessment" = "practice",
  avgQuestionLength: number = 10,
  // Sheets with stacked fractions render each row ~2 text-lines tall, so the
  // height estimate must reserve at least two lines per row or 30 fraction
  // problems silently overflow onto a second page.
  hasStacked: boolean = false
): PageLayout {
  // Total non-problem chrome for this mode
  let chrome = MARGIN_TOP_PT + MARGIN_BOTTOM_PT + CHROME_HEADER_BAR;

  if (mode !== "assessment") {
    chrome += CHROME_STUDENT_INFO + CHROME_OBJECTIVE + CHROME_MASTERY;
  }
  if (mode === "tutorial") {
    chrome += CHROME_WORKED_EXAMPLE;
  }

  const available = PAGE_HEIGHT_PT - chrome;
  const CONTENT_WIDTH  = 540; // page width minus horizontal margins
  const COL_GAP        = 8;
  // width consumed by number label + answer line + paddings (not text)
  const NON_TEXT_PER_ROW = 22 /* num label */ + 30 /* answer line */ + 14 /* gaps/padding */;
  const ROW_VPAD       = 3;  // paddingVertical×2 + slack

  let best: (PageLayout & { fitsOneLine: boolean }) | null = null;

  for (const cols of [1, 2, 3]) {
    // Flat list: simple global ceiling (no per-zone splitting any more)
    const rowsPerCol = Math.ceil(problemCount / cols);
    const colWidth   = (CONTENT_WIDTH - (cols - 1) * COL_GAP) / cols;
    const textWidth  = Math.max(40, colWidth - NON_TEXT_PER_ROW);

    // Find the largest font where estimated height fits.
    // Note: the renderer uses flex:1 to fill all available space, so
    // rowHeightPt here is really a minimum / wrapping-estimate target.
    // A stacked fraction occupies two text-lines of height, so that's the floor.
    const minLines = hasStacked ? 2 : 1;
    for (let fontSize = 11; fontSize >= 6.5; fontSize -= 0.25) {
      const charsPerLine = Math.max(8, textWidth / (fontSize * 0.52));
      const estLines     = Math.max(minLines, Math.ceil(avgQuestionLength / charsPerLine));
      const lineHeight   = fontSize * 1.2;
      const rowHeight    = Math.max(MIN_ROW_HEIGHT_PT, estLines * lineHeight + ROW_VPAD);
      const totalHeight  = rowsPerCol * rowHeight;

      if (totalHeight <= available) {
        const candidate = {
          columns:           cols,
          rowHeightPt:       Math.min(rowHeight, MAX_ROW_HEIGHT_PT),
          fontSizePt:        fontSize,
          answerLineWidthPt: ANSWER_LINE_WIDTH_PT,
          rowPaddingPt:      Math.max(1, (Math.min(rowHeight, MAX_ROW_HEIGHT_PT) - fontSize * 1.2) / 2),
          // "fits its target" = text doesn't wrap beyond the stacked-fraction height.
          fitsOneLine:       estLines <= minLines,
        };
        // Fill the page WIDTH: prefer MORE columns so the right half is never
        // left empty — but only while the question still fits on a single line
        // at a readable font (≥8pt). If a wider layout would wrap text or shrink
        // the font, fall back to the more readable (fewer-column) option.
        const readable = candidate.fontSizePt >= 8 && candidate.fitsOneLine;
        const better = !best
          || (readable && !(best.fontSizePt >= 8 && best.fitsOneLine))            // first readable wins
          || (readable && best.fontSizePt >= 8 && best.fitsOneLine
                && candidate.columns > best.columns)                              // among readable, more columns
          || (!readable && !(best.fontSizePt >= 8 && best.fitsOneLine)
                && candidate.fontSizePt > best.fontSizePt);                       // else largest font
        if (better) best = candidate;
        break;
      }
    }
  }

  if (best) {
    const { fitsOneLine, ...layout } = best;
    return layout;
  }

  // Nothing fit cleanly — fall back to smallest readable in 3 columns.
  return {
    columns: 3, rowHeightPt: MIN_ROW_HEIGHT_PT, fontSizePt: 6.5,
    answerLineWidthPt: ANSWER_LINE_WIDTH_PT, rowPaddingPt: 1,
  };
}

export { ANSWER_LINE_WIDTH_PT };
