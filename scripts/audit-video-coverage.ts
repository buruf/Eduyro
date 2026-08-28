// scripts/audit-video-coverage.ts
// Every math label a sheet can SERVE either has a lesson video, is exempt by
// design, or is a pinned gap that may only shrink.
//
// The lookup chain is exactly the player's: worksheet titles carry these
// labels, and videoForSkillLabel resolves them (directly or via the honest
// alias layer - an alias is only added when the video genuinely teaches that
// label's skill). Mixed-review and mastery units are exempt by decision:
// every skill they revise already has its own video, so a review video would
// re-teach instead of reviewing.
import { getMathSheetMeta } from "../src/lib/worksheet/generator";
import { videoForSkillLabel } from "../src/remotion/lesson/units";

const EXEMPT = /mixed review|mastery$|& mixed review/i;

const served = new Map<string, string>();
for (let n = 1; n <= 18; n++) {
  const code = `M${n}`;
  for (let s = 1; s <= 100; s++) {
    try {
      const label = getMathSheetMeta(code, s)?.subSkillLabel ?? null;
      if (label && !served.has(label)) served.set(label, code);
    } catch { /* not generatable */ }
  }
}

let covered = 0, exempt = 0;
const gaps: string[] = [];
for (const [label, code] of served) {
  if (videoForSkillLabel(label)) covered++;
  else if (EXEMPT.test(label)) exempt++;
  else gaps.push(`${code}: ${label}`);
}

// RATCHET. The genuine video backlog after the alias reconciliation - skills
// with no honest video yet (subtract/multiply/divide fractions, place value,
// polynomial technique drills, ...). New videos shrink it; it may never grow:
// growth means a new unit shipped without a video plan, or an alias was lost.
const PINNED_GAPS = 38;
console.log(`served labels: ${served.size} = ${covered} with video + ${exempt} exempt (review/mastery) + ${gaps.length} gaps (pinned ceiling ${PINNED_GAPS})`);
if (gaps.length > PINNED_GAPS) {
  console.log("FAIL - the video gap GREW:");
  for (const g of gaps) console.log("  " + g);
  process.exit(1);
}
if (gaps.length < PINNED_GAPS) {
  console.log(`NOTE: gaps dropped - ratchet PINNED_GAPS down to ${gaps.length}.`);
}
console.log("PASS");
