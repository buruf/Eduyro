// Gate: every math micro-lesson goal must read grammatically after friendlyGoal
// ("you'll be able to factoring…" class of bug, user-reported Aug 1).
import { getMathLevelSkills } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";
import { friendlyGoal } from "../src/lib/tutorials/lesson-extras";

const LEVELS = ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14","M15","M16","M17","M18"];
let flagged = 0, total = 0;
for (const code of LEVELS) {
  for (const u of getMathLevelSkills(code)) {
    const lesson = getMicroSkillLesson("MATH", code, u.label);
    if (!lesson?.goal) continue;
    total++;
    const out = friendlyGoal(lesson.goal, u.label);
    const bad = /able to \w+ing\b/i.test(out) || /able to \w+ (is|are|means)\b/i.test(out) || /able to (a|an|the)\b/i.test(out);
    if (bad) { flagged++; console.log(`⚠ ${code} [${u.label.slice(0, 30)}] → ${out.slice(0, 100)}`); }
  }
}
console.log(`goals checked: ${total}, ungrammatical: ${flagged}`);
process.exit(flagged ? 1 : 0);
