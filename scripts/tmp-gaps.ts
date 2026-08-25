import { getMathSheetMeta } from "../src/lib/worksheet/generator";
import { videoForSkillLabel } from "../src/remotion/lesson/units";
const EXEMPT = /mixed review|mastery$|& mixed review/i;
const served = new Map<string, string>();
for (let n = 1; n <= 18; n++) {
  for (let s = 1; s <= 100; s++) {
    try { const l = getMathSheetMeta(`M${n}`, s)?.subSkillLabel; if (l && !served.has(l)) served.set(l, `M${n}`); } catch {}
  }
}
console.log("DECIMAL/PERCENT gaps:");
for (const [label, code] of served) {
  if (videoForSkillLabel(label) || EXEMPT.test(label)) continue;
  if (/decimal|percent|round/i.test(label)) console.log(`  ${code}: ${label}`);
}
