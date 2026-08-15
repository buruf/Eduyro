// src/remotion/lesson/registry.ts
// THE list of lesson units: id → its Remotion composition and its narration.
//
// This exists because the same list had been copy-pasted into four scripts
// (generate, render, check, preview) and immediately drifted: render-lessons
// exited silently on unit ids it hadn't been taught about, and the preview
// script couldn't see the M7+ units at all. Adding a template now means adding
// one entry HERE, and every tool picks it up.
import {
  EQUAL_GROUP_UNITS,
  COLUMN_UNITS,
  TEN_FRAME_UNITS,
  CURRICULUM_TEN_FRAME_UNITS,
  DEALING_UNITS,
  FACT_FAMILY_UNITS,
  CURRICULUM_FACT_FAMILY_UNITS,
  AREA_UNITS,
  FRACTION_BAR_UNITS,
  HUNDRED_GRID_UNITS,
  RATIO_UNITS,
  BALANCE_UNITS,
  GRAPH_UNITS,
  COUNT_UNITS,
  COMPARE_UNITS,
  NUMBER_LINE_UNITS,
} from "./units";
import {
  lessonLines,
  columnLines,
  tenFrameLines,
  dealingLines,
  factFamilyLines,
  areaLines,
  fractionBarLines,
  hundredGridLines,
  ratioLines,
  balanceLines,
  countLines,
  compareLines,
  numberLineLines,
  type LessonLine,
} from "./script";
import { graphLines } from "./script-graph";
import { FUNCTION_UNITS } from "./units-functions";
import { functionLines } from "./script-functions";
import { TRIG_UNITS } from "./units-trig";
import { trigLines } from "./script-trig";
import { POLY_UNITS } from "./units-poly";
import { polyLines } from "./script-poly";
import { ADVANCED_UNITS } from "./units-advanced";
import { advancedLines } from "./script-advanced";

export interface RegisteredUnit {
  id: string;
  label: string;
  /** Remotion composition id that renders it. */
  comp: string;
  lines: () => LessonLine[];
}

export const ALL_LESSON_UNITS: RegisteredUnit[] = [
  ...EQUAL_GROUP_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "EqualGroups", lines: () => lessonLines(u) })),
  ...COLUMN_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Column", lines: () => columnLines(u) })),
  ...[...TEN_FRAME_UNITS, ...CURRICULUM_TEN_FRAME_UNITS].map((u) => ({
    id: u.id, label: u.label, comp: "TenFrame", lines: () => tenFrameLines(u),
  })),
  ...DEALING_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Dealing", lines: () => dealingLines(u) })),
  ...[...FACT_FAMILY_UNITS, ...CURRICULUM_FACT_FAMILY_UNITS].map((u) => ({
    id: u.id, label: u.label, comp: "FactFamily", lines: () => factFamilyLines(u),
  })),
  ...AREA_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Area", lines: () => areaLines(u) })),
  ...FRACTION_BAR_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "FractionBar", lines: () => fractionBarLines(u) })),
  ...HUNDRED_GRID_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "HundredGrid", lines: () => hundredGridLines(u) })),
  ...RATIO_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "RatioTable", lines: () => ratioLines(u) })),
  ...BALANCE_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Balance", lines: () => balanceLines(u) })),
  ...GRAPH_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Graph", lines: () => graphLines(u) })),
  ...FUNCTION_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "FunctionMachine", lines: () => functionLines(u) })),
  ...TRIG_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Trig", lines: () => trigLines(u) })),
  ...POLY_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Poly", lines: () => polyLines(u) })),
  ...ADVANCED_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Advanced", lines: () => advancedLines(u) })),
  ...COUNT_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Count", lines: () => countLines(u) })),
  ...COMPARE_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "Compare", lines: () => compareLines(u) })),
  ...NUMBER_LINE_UNITS.map((u) => ({ id: u.id, label: u.label, comp: "NumberLine", lines: () => numberLineLines(u) })),
];

/** Filter by ids, failing loudly on any that don't exist. */
export function selectUnits(ids: string[]): RegisteredUnit[] {
  if (!ids.length) return ALL_LESSON_UNITS;
  const known = new Set(ALL_LESSON_UNITS.map((u) => u.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) {
    throw new Error(`Unknown unit id(s): ${unknown.join(", ")}`);
  }
  return ALL_LESSON_UNITS.filter((u) => ids.includes(u.id));
}
