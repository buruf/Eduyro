// scripts/test-fluency-gate.ts — verify the fact-fluency gate + repeat logic.
import { factPaceTargetSec, isSheetFluent, isAccurateButSlow } from "../src/lib/mastery/fluency";

let fail = 0;
const chk = (name: string, cond: boolean) => { if (!cond) { fail++; console.log(`FAIL ${name}`); } else console.log(`ok   ${name}`); };

// Pace target applies to fact levels' single-fact skills only.
chk("M3 doubles has pace", factPaceTargetSec("M3", "Doubles (1+1 … 9+9)") === 6);
chk("M5 x2x5x10 has pace", factPaceTargetSec("M5", "×2, ×5, ×10 (skip counting)") === 6);
chk("M5 2-digit×1 NO pace", factPaceTargetSec("M5", "2-digit × 1-digit") === null);
chk("M5 mixed review NO pace", factPaceTargetSec("M5", "Mixed review") === null);
chk("M10 (pre-alg) NO pace", factPaceTargetSec("M10", "Evaluate (+/−)") === null);
chk("M1 counting NO pace", factPaceTargetSec("M1", "Which is greater?") === null);

const base = { levelCode: "M3", skillLabel: "Near-doubles (use the double you know)", thresholdPct: 90, problemCount: 30 };
// 30 problems, 6s target → goal 180s.
chk("accurate + fast = fluent",       isSheetFluent({ ...base, accuracyPct: 95, timeSeconds: 120 }) === true);
chk("accurate + on-goal = fluent",    isSheetFluent({ ...base, accuracyPct: 90, timeSeconds: 180 }) === true);
chk("accurate + slow = NOT fluent",   isSheetFluent({ ...base, accuracyPct: 95, timeSeconds: 400 }) === false);
chk("accurate+slow flagged",          isAccurateButSlow({ ...base, accuracyPct: 95, timeSeconds: 400 }) === true);
chk("accurate+fast NOT slow-flagged", isAccurateButSlow({ ...base, accuracyPct: 95, timeSeconds: 120 }) === false);
chk("inaccurate = NOT fluent",        isSheetFluent({ ...base, accuracyPct: 70, timeSeconds: 120 }) === false);
chk("inaccurate NOT slow-flagged (it just fails)", isAccurateButSlow({ ...base, accuracyPct: 70, timeSeconds: 400 }) === false);

// Non-fact skill: slow is fine (no pace gate).
chk("multidigit slow still fluent", isSheetFluent({ levelCode: "M5", skillLabel: "2-digit × 2-digit", accuracyPct: 92, thresholdPct: 90, timeSeconds: 600, problemCount: 20 }) === true);
// Tiny sheet not pace-gated.
chk("tiny sheet not gated", isSheetFluent({ levelCode: "M3", skillLabel: "Doubles", accuracyPct: 95, thresholdPct: 90, timeSeconds: 300, problemCount: 6 }) === true);

console.log(fail ? `\n${fail} FAILED` : "\nPASS");
process.exit(fail ? 1 : 0);
