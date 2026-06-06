// src/lib/worksheet/layout.ts
// Auto-scaling layout logic for worksheets.
// Goal: any problem count from 5 to 200 fits on one letter-size page.

export interface LayoutConfig {
  columns: 1 | 2 | 3 | 4 | 5;
  fontSize: string; // CSS value, e.g. "11pt"
  rowPadding: string; // CSS padding-y on each problem row
  headerScale: number; // multiplier for header size (1 = normal, 0.8 = compact)
  showBorders: boolean; // bottom-border per row (off for very dense layouts)
}

/**
 * Pick a layout that fits the requested problem count on ONE letter-size page.
 * Tuned for ~9.5" vertical print area (after margins) and ~7" horizontal.
 *
 * Tiers were tested at print preview. Tightening any further hurts legibility.
 */
export function getLayoutForCount(count: number): LayoutConfig {
  // Very roomy — short worksheet for young kids or open-ended problems
  if (count <= 10) {
    return {
      columns: 1,
      fontSize: "16pt",
      rowPadding: "0.4rem",
      headerScale: 1.1,
      showBorders: true,
    };
  }

  // Standard worksheet — 2 columns, comfortable spacing
  if (count <= 20) {
    return {
      columns: 2,
      fontSize: "12pt",
      rowPadding: "0.2rem",
      headerScale: 1.0,
      showBorders: true,
    };
  }

  // Dense — fits ~25 to 32 problems
  if (count <= 32) {
    return {
      columns: 2,
      fontSize: "10pt",
      rowPadding: "0.12rem",
      headerScale: 0.85,
      showBorders: true,
    };
  }

  // Very dense — 3 columns, smaller font (~40 problems)
  if (count <= 45) {
    return {
      columns: 3,
      fontSize: "10pt",
      rowPadding: "0.15rem",
      headerScale: 0.85,
      showBorders: true,
    };
  }

  // Maximum density — 4 columns, tight (~50 problems)
  if (count <= 60) {
    return {
      columns: 4,
      fontSize: "9pt",
      rowPadding: "0.1rem",
      headerScale: 0.8,
      showBorders: true,
    };
  }

  // Extreme — 5 columns, no row borders, tiny font (~100 problems)
  if (count <= 120) {
    return {
      columns: 5,
      fontSize: "8pt",
      rowPadding: "0.08rem",
      headerScale: 0.75,
      showBorders: false,
    };
  }

  // Beyond ~120 problems, you really should split into multiple sheets.
  // Return the densest layout and let the renderer add a warning.
  return {
    columns: 5,
    fontSize: "7pt",
    rowPadding: "0.06rem",
    headerScale: 0.7,
    showBorders: false,
  };
}

/** Returns true if the count is over the single-page comfort limit. */
export function isOverflowRisk(count: number): boolean {
  return count > 120;
}
