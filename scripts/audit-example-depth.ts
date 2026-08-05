// scripts/audit-example-depth.ts — measure worked-example TEACHING DEPTH for
// every math micro-skill: (a) the unit's curated example step count, and
// (b) the scaffold-derived steps for that unit's real questions (what the
// modal's per-kind examples show). Flags units whose examples can't teach —
// fewer than 2 real steps ("Standard angle" is a label, not a lesson).
import { generateHigherMathSheet, higherMathUnits } from "../src/lib/shop/higher-math-engine";
import { getMathLevelSkills } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";
import { buildScaffold } from "../src/lib/tutor/scaffold";

const isBland = (s: string) => /^(answer|the correct|remember|think about|read the question)/i.test(s.trim());

async function main() {
  let flagged = 0, total = 0;
  for (const code of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
    console.log(`\n── ${code} ──`);
    const units = higherMathUnits(code);
    for (const u of units) {
      total++;
      // (a) curated example depth
      const lesson = getMicroSkillLesson("MATH", code, u.label);
      const curatedSteps = lesson?.example?.steps?.filter((s) => !isBland(s)).length ?? 0;
      // (b) scaffold depth on the unit's REAL questions (first sheet of unit)
      const sheet = generateHigherMathSheet(code, u.range[0], 100, 36);
      const seen = new Set<string>();
      let scSum = 0, scN = 0, scThin = 0;
      for (const p of sheet.problems) {
        const shape = p.question.replace(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "#").slice(0, 30);
        if (seen.has(shape)) continue;
        seen.add(shape);
        const sc = buildScaffold(p.question, p.answer, "", { subjectSlug: "MATH", directive: u.label });
        const good = sc.hints.filter((h) => !isBland(h)).length;
        scSum += good; scN++;
        if (good < 2) scThin++;
      }
      const scAvg = scN ? (scSum / scN).toFixed(1) : "-";
      const bad = curatedSteps < 2 || scThin > 0;
      if (bad) flagged++;
      console.log(`  ${bad ? "⚠" : " "} ${u.label.padEnd(36)} curated:${curatedSteps}  scaffold-avg:${scAvg}  thin-forms:${scThin}/${scN}`);
    }
  }
  console.log(`\nunits: ${total}, flagged (thin teaching): ${flagged}`);
  if (flagged) process.exit(1);
}
main();
