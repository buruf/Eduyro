// scripts/audit-tutorial-visuals.ts — does every micro-skill lesson get a
// visual that matches its topic? Prints the full mapping and FAILS on any
// forbidden pairing (e.g. a trig unit showing the fractions animation).
import { visualForSkill } from "../src/components/tutorial/TutorialVisual";
import { getMathLevelSkills } from "../src/lib/worksheet/generator";

const LEVELS = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18"];

const describe = (sv: ReturnType<typeof visualForSkill>): string =>
  !sv ? "(hidden)" : sv.kind === "explorer" ? `explorer:${sv.which}` : sv.kind === "factStrategy" ? `fact:${sv.strategy}` : sv.name;

// Forbidden pairings: unit keyword → visuals that would be a MISMATCH.
const RULES: { match: RegExp; mustBe: RegExp; label: string }[] = [
  { match: /derivat|differenti|power rule|d\/dx/i, mustBe: /^tangent$/, label: "derivative→tangent" },
  { match: /integral|integrat|∫/i, mustBe: /^areaUnderCurve$/, label: "integral→area" },
  { match: /sine|cosine|radian|unit.circle|sohcahtoa/i, mustBe: /unitCircle/, label: "trig→unitCircle" },
  { match: /pythagor/i, mustBe: /rightTriangle|unitCircle/, label: "pythagorean→rightTriangle" },
  { match: /right.triangle/i, mustBe: /sohcahtoa/, label: "ratios→sohcahtoa" },
  // "Equations with a fraction" is an equation lesson (balance is honest);
  // conversion units span fractions/decimals/percents (any of the three ok);
  // "Factor quadratic trinomials" is a factoring lesson (polynomials ok).
  { match: /fraction/i, mustBe: /^(fraction|balance|simplifyFraction)/, label: "fraction→fraction*" },
  { match: /decimal/i, mustBe: /^(decimals|percents|fraction)/, label: "decimal→decimals" },
  { match: /quadratic|parabol|vertex/i, mustBe: /parabola|polynomials/, label: "quadratic→parabola" },
];

let fails = 0, hidden = 0, total = 0;
for (const code of LEVELS) {
  const units = getMathLevelSkills(code);
  console.log(`\n── ${code} ──`);
  for (const u of units) {
    const sv = visualForSkill(u.label);
    const d = describe(sv);
    total++;
    if (!sv) hidden++;
    let bad = "";
    for (const r of RULES) {
      if (r.match.test(u.label) && (!sv || !r.mustBe.test(d))) { bad = ` ← FAIL (${r.label})`; fails++; break; }
    }
    console.log(`  ${d.padEnd(22)} ${u.label}${bad}`);
  }
}
console.log(`\ntotal units: ${total}, hidden (no honest visual): ${hidden}, rule failures: ${fails}`);
process.exit(fails ? 1 : 0);
