// Every distinct M7 question shape × scaffold quality (real steps? visual? uses the numbers?)
import { generateProblems, getMathLevelSkills } from "../src/lib/worksheet/generator";
import { buildScaffold } from "../src/lib/tutor/scaffold";
const isBland = (s: string) => /^(answer|the correct|rule out|read the question|not quite)/i.test(s.trim());
const seen = new Set<string>();
const units = getMathLevelSkills("M7");
for (const u of units.slice(0, 17)) { // fraction units only
  const { problems, answerKey } = generateProblems({ subjectSlug: "MATH", levelCode: "M7", skillName: u.label, problemCount: 18, sheetNumber: u.range[0], totalSheets: 100 } as any);
  const am = new Map(answerKey.map((e) => [e.id, String(e.answer)]));
  for (const p of problems) {
    const shape = p.question.replace(/[0-9]/g, "#").slice(0, 44);
    if (seen.has(shape)) continue;
    seen.add(shape);
    const sc = buildScaffold(p.question, am.get(p.id) ?? "", "", { subjectSlug: "MATH", directive: u.label });
    const real = sc.hints.filter((h) => !isBland(h)).length;
    const usesNumbers = sc.hints.some((h) => /\d/.test(h));
    const flag = real < 2 || !usesNumbers ? "⚠" : sc.visual ? " " : "○"; // ○ = ok but no visual
    console.log(`${flag} [${u.label.slice(0, 20).padEnd(20)}] steps:${real} viz:${sc.visual ? "y" : "-"} nums:${usesNumbers ? "y" : "-"} | ${p.question.slice(0, 58).replace(/\n/g, " ")}`);
  }
}
