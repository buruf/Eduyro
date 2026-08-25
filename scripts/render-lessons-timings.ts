// scripts/render-lessons-timings.ts
// Expected total frames for any (unit × voice) — the same numbers Remotion's
// calculateMetadata uses, so the validator can assert a rendered MP4 matches
// its audio-derived timeline (a mismatch means a stale render).
import {
  totalFrames,
  columnTotalFrames,
  tenFrameTotalFrames,
  dealingTotalFrames,
  factFamilyTotalFrames,
  areaTotalFrames,
  countTotalFrames,
  compareTotalFrames,
  numberLineTotalFrames,
  fractionBarTotalFrames,
  hundredGridTotalFrames,
  ratioTotalFrames,
  balanceTotalFrames,
  graphTotalFrames,
  functionTotalFrames,
  trigTotalFrames,
  polyTotalFrames,
  advancedTotalFrames,
  fracOpsTotalFrames,
  decimalOpsTotalFrames,
} from "../src/remotion/lesson/timeline";
import { ALL_LESSON_UNITS } from "../src/remotion/lesson/registry";

const BY_COMP: Record<string, (unitId: string, voice: string) => number> = {
  EqualGroups: totalFrames,
  Column: columnTotalFrames,
  TenFrame: tenFrameTotalFrames,
  Dealing: dealingTotalFrames,
  FactFamily: factFamilyTotalFrames,
  Area: areaTotalFrames,
  Count: countTotalFrames,
  Compare: compareTotalFrames,
  NumberLine: numberLineTotalFrames,
  FractionBar: fractionBarTotalFrames,
  HundredGrid: hundredGridTotalFrames,
  RatioTable: ratioTotalFrames,
  Balance: balanceTotalFrames,
  Graph: graphTotalFrames,
  FunctionMachine: functionTotalFrames,
  Trig: trigTotalFrames,
  Poly: polyTotalFrames,
  Advanced: advancedTotalFrames,
  FractionOps: fracOpsTotalFrames,
  DecimalOps: decimalOpsTotalFrames,
};

export function timingsFor(unitId: string, voice: string): number {
  const unit = ALL_LESSON_UNITS.find((u) => u.id === unitId);
  if (!unit) throw new Error(`Unknown unit "${unitId}"`);
  const fn = BY_COMP[unit.comp];
  if (!fn) throw new Error(`No timing function for composition "${unit.comp}"`);
  return fn(unitId, voice);
}
