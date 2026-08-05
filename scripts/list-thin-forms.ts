// scripts/list-thin-forms.ts — print the exact question forms whose scaffold
// steps can't teach (<2 real steps), so handlers can be written for each.
import { generateHigherMathSheet, higherMathUnits } from "../src/lib/shop/higher-math-engine";
import { buildScaffold } from "../src/lib/tutor/scaffold";

const isBland = (s: string) => /^(answer|the correct|remember|think about|read the question)/i.test(s.trim());

for (const code of ["M13", "M14", "M15", "M16", "M17", "M18"]) {
  for (const u of higherMathUnits(code)) {
    const sheet = generateHigherMathSheet(code, u.range[0], 100, 36);
    const seen = new Set<string>();
    for (const p of sheet.problems) {
      const shape = p.question.replace(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "#").slice(0, 30);
      if (seen.has(shape)) continue;
      seen.add(shape);
      const sc = buildScaffold(p.question, p.answer, "", { subjectSlug: "MATH", directive: u.label });
      const good = sc.hints.filter((h) => !isBland(h)).length;
      if (good < 2) console.log(`${code} [${u.label.slice(0, 24).padEnd(24)}] (${good}) ${p.question.slice(0, 90)}`);
    }
  }
}
