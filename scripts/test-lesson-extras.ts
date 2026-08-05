// scripts/test-lesson-extras.ts — empirical check of the lesson enrichment.
import { friendlyGoal, getLessonExtras } from "../src/lib/tutorials/lesson-extras";

const goals = ["Differentiates axⁿ", "Student differentiates axⁿ", "Applies the power rule", "Solves x² = k", "Matches shapes", "Understand place value", "Adds within 20"];
for (const g of goals) console.log(JSON.stringify(g), "->", friendlyGoal(g, "x"));

const skills = ["Differentiate monomials", "Factor quadratics", "Plot linear equations", "Equivalent fractions", "Angles on a line", "Letter sounds", "Multiply 2-digit numbers", "Sine & cosine ratios", "Percent of a number", "Long division", "Rounding to tens"];
for (const s of skills) {
  const e = getLessonExtras(s);
  console.log(s.padEnd(26), "=>", e.rule[0] ?? "(generic)", "| mistakes:", e.mistakes.length);
}
