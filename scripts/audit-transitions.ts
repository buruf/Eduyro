// scripts/audit-transitions.ts — can a child walk from one lesson into the next?
//
// A six-reviewer audit of all 193 math lesson boundaries (Sep 2026) found 13
// boundaries a child could not cross from the lesson alone, and the parent had
// already watched it happen. The causes that can be checked by machine are
// checked here, for every unit on every math level, so they cannot return:
//
//   1. The micro-lesson that fires on day one resolves, and its worked example
//      has at least one step that is a method rather than the answer restated.
//   2. The lesson belongs to the level it fires on. "Mixed review" existed on
//      M5 and M6, and the M6 division review fired the M5 multiplication lesson.
//      For M3–M6 the example must use the level's operation sign.
//   3. Arithmetic (M3–M6): the OPENING sheet of a unit holds the direct form
//      the lesson taught — no "a − ___ = c" — unless the unit is about the
//      missing number; and before the fact-family lesson, which introduces the
//      missing number, no sheet has one at all.
//   4. Every opening sheet generates, non-empty, with an answer on every item.
//
// Judgement calls (is the worked example the same TASK as the sheet?) stay
// with the reviewers; their full findings are in docs/TRANSITION-AUDIT.md.
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";

const LEVELS = Array.from({ length: 18 }, (_, i) => `M${i + 1}`);
const OP_SIGN: Record<string, RegExp> = { M3: /\+/, M4: /[-−]/, M5: /[×x]/, M6: /÷/ };

function restates(step: string, problem: string, answer: string): boolean {
  const bare = (s: string) => s.toLowerCase().replace(/[\s=→:.]/g, "");
  const s = bare(step);
  return s === bare(problem) + bare(answer) || s === bare(problem) || s === bare(answer);
}

function sheet(level: string, skillName: string, n: number): any[] {
  const out: any = generateProblems({
    subjectSlug: "MATH", levelCode: level, skillName,
    problemCount: 30, timeLimitMinutes: 10, sheetNumber: n, totalSheets: 100,
  });
  return (out?.problems ?? []) as any[];
}

const issues: string[] = [];
let units = 0;
for (const level of LEVELS) {
  const list = getMathLevelSkills(level);
  const factFamily = list.findIndex((u) => /fact famil/i.test(u.label));
  for (const u of list) {
    units++;
    const tag = `${level} "${u.label}"`;
    // 1. lesson resolves and teaches
    const lesson = getMicroSkillLesson("MATH", level, u.label);
    if (!lesson) { issues.push(`${tag}: no micro-lesson resolves`); continue; }
    const ex = lesson.example;
    const teaching = (ex?.steps ?? []).filter((s) => !restates(s, ex.problem, ex.answer));
    if (teaching.length < 1) issues.push(`${tag}: worked example has no step beyond restating the answer ("${ex?.problem}" → "${ex?.answer}")`);
    // 2. lesson belongs to this level's operation
    const sign = OP_SIGN[level];
    if (sign && !sign.test(ex.problem)) issues.push(`${tag}: lesson example "${ex.problem}" is not a ${level} operation — wrong lesson resolved`);
    // 3/4. opening sheet
    let first: any[];
    try { first = sheet(level, u.label, u.range[0]); } catch (e: any) { issues.push(`${tag}: opening sheet failed to generate: ${e?.message ?? e}`); continue; }
    if (!first.length) issues.push(`${tag}: opening sheet is empty`);
    for (const p of first) if (p.answer === undefined || p.answer === "") { issues.push(`${tag}: opening sheet item without an answer: "${p.question}"`); break; }
    if (sign) {
      const missingUnit = /missing|fact famil/i.test(u.label);
      const missing = first.filter((p) => /___/.test(String(p.question)));
      if (!missingUnit && missing.length) issues.push(`${tag}: opening sheet has ${missing.length} missing-number items the lesson did not teach, e.g. "${missing[0].question}"`);
      if (factFamily !== -1 && u.index < factFamily) {
        const mid = sheet(level, u.label, Math.round((u.range[0] + u.range[1]) / 2));
        const leak = [...first, ...mid].filter((p) => /___/.test(String(p.question)));
        if (leak.length) issues.push(`${tag}: missing-number form appears before fact families teach it, e.g. "${leak[0].question}"`);
      }
    }
  }
}

for (const i of issues) console.log(`  ⚠ ${i}`);
console.log(`\n${issues.length ? "❌" : "✅"} transitions: ${units} math units checked, ${issues.length} issue(s)`);
if (issues.length) process.exit(1);
