// scripts/audit-shop-lesson-depth.ts — the shop-PDF twin of audit-example-depth:
// for EVERY shop skill, walk every tutorial (first-of-unit) sheet, build the
// exact lesson-page examples the PDF renders (buildExamples — curated example +
// scaffold-derived extras), and flag any example that can't teach (<2 real
// steps) or any lesson page left with <2 usable examples.
import { SHOP_SKILLS, generatePackForSkill, type ShopSkill } from "../src/lib/shop/pack-generator";
import { buildExamples } from "../src/lib/pdf/renderer";

const isBland = (s: string) => /^(answer|the correct|remember|think about|read the question)/i.test(s.trim());

let flaggedExamples = 0, flaggedPages = 0, pages = 0, examples = 0;
const detail: string[] = [];

for (const skill of Object.keys(SHOP_SKILLS) as ShopSkill[]) {
  const pack = generatePackForSkill(skill);
  let skillFlags = 0;
  let tutorialPages = 0;
  for (const sheet of pack.sheets) {
    if (sheet.metaData?.mode !== "tutorial") continue;
    tutorialPages++; pages++;
    // Rebuild the WorksheetData shape buildExamples expects.
    const wsd = { problems: sheet.problems, answerKey: sheet.answerKey, workedExample: sheet.workedExampleData, meta: sheet.metaData } as any;
    const exs = buildExamples(wsd);
    let usable = 0;
    const label = sheet.metaData?.subSkillLabel ?? sheet.bandLabel ?? "?";
    for (const ex of exs) {
      examples++;
      const real = (ex.steps ?? []).filter((s) => !isBland(s)).length;
      if (real < 2) {
        flaggedExamples++; skillFlags++;
        detail.push(`${skill} [${label.slice(0, 30).padEnd(30)}] (${real}) ${String(ex.problem).slice(0, 70)}`);
      } else usable++;
    }
    if (usable < 2) { flaggedPages++; detail.push(`${skill} [${label.slice(0, 30).padEnd(30)}] PAGE has only ${usable} usable example(s)`); }
  }
  console.log(`${skill.padEnd(14)} tutorialPages:${String(tutorialPages).padStart(3)}  thin:${skillFlags}`);
}

console.log(`\nlesson pages: ${pages}, examples: ${examples}, thin examples: ${flaggedExamples}, weak pages(<2 usable): ${flaggedPages}`);
if (detail.length) { console.log("\n=== details ==="); for (const d of detail.slice(0, 80)) console.log(" ", d); }
if (flaggedExamples || flaggedPages) process.exit(1);
