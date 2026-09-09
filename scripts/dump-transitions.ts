// scripts/dump-transitions.ts — what a child meets at every lesson boundary.
//
// The skill map advances one lesson per day (day cleared at ≥90–95%). The next
// morning the child is shown the NEW unit's micro-lesson (once), then its first
// sheet. A parent has watched children get lost at exactly this point, more
// than once. This dumps, for every consecutive pair of units on every math
// level (and the last→first pair across level boundaries), the material the
// child actually sees, so a reviewer can judge whether the step is walkable:
//
//   A.last  — a sample of the last sheet of the unit just cleared
//   B.lesson — the micro-lesson that fires (goal, big idea, worked example)
//   B.first — the whole first sheet of the new unit
//   B.video — whether a lesson video exists for the new unit
//
// Output: one markdown file per level in the given directory, plus index.json.
//   npx tsx scripts/dump-transitions.ts <outDir>
import * as fs from "fs";
import * as path from "path";
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";
import { videoForSkillLabel } from "../src/remotion/lesson/units";

const LEVELS = Array.from({ length: 18 }, (_, i) => `M${i + 1}`);
const outDir = process.argv[2];
if (!outDir) { console.error("usage: tsx scripts/dump-transitions.ts <outDir>"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

function sheet(levelCode: string, skillName: string, n: number) {
  try {
    const out: any = generateProblems({
      subjectSlug: "MATH", levelCode, skillName,
      problemCount: 30, timeLimitMinutes: 10, sheetNumber: n, totalSheets: 100,
    });
    return (out?.problems ?? []) as any[];
  } catch (e: any) {
    return [{ question: `!! GENERATION FAILED: ${e?.message ?? e}`, answer: "", type: "error", points: 1 }];
  }
}

function fmt(p: any): string {
  const q = String(p.question ?? "").replace(/\s+/g, " ").trim();
  const opts = p.options?.length ? `  [options: ${p.options.join(" | ")}]` : "";
  const kind = p.type && p.type !== "short_answer" ? ` (${p.type}${p.answerType ? "/" + p.answerType : ""})` : "";
  return `- ${q}${opts}  → **${p.answer}**${kind}`;
}

const index: any[] = [];
let prevLevelLast: { level: string; label: string; problems: any[] } | null = null;

for (const level of LEVELS) {
  const units = getMathLevelSkills(level);
  if (!units.length) continue;
  const lines: string[] = [`# ${level} — ${units.length} lessons, ${units.length - 1 + (prevLevelLast ? 1 : 0)} transitions\n`];
  lines.push(`Lesson order (a child does one per day, advancing when the day clears):`);
  units.forEach((u) => lines.push(`${u.index + 1}. **${u.label}** — sheets ${u.range[0]}–${u.range[1]} — ${u.objective}`));
  lines.push("");

  const firstSheets = units.map((u) => sheet(level, u.label, u.range[0]));
  const lastSheets = units.map((u) => sheet(level, u.label, u.range[1]));

  const pairs: Array<{ A: { level: string; label: string; problems: any[] }; B: typeof units[number]; Bfirst: any[]; cross: boolean }> = [];
  if (prevLevelLast) pairs.push({ A: prevLevelLast, B: units[0], Bfirst: firstSheets[0], cross: true });
  for (let i = 1; i < units.length; i++) {
    pairs.push({ A: { level, label: units[i - 1].label, problems: lastSheets[i - 1] }, B: units[i], Bfirst: firstSheets[i], cross: false });
  }

  for (const { A, B, Bfirst, cross } of pairs) {
    const lesson = getMicroSkillLesson("MATH", level, B.label);
    const video = videoForSkillLabel(B.label);
    const id = `${A.level}:${A.label} → ${level}:${B.label}`;
    lines.push(`\n---\n## TRANSITION${cross ? " (ACROSS LEVELS)" : ""}: ${id}\n`);
    lines.push(`### A. Last sheet of the lesson just cleared — "${A.label}" (${A.level})`);
    lines.push(...A.problems.slice(0, 12).map(fmt));
    lines.push(`\n### B. What fires next morning — micro-lesson for "${B.label}"`);
    if (!lesson) lines.push(`!! NO MICRO-LESSON RESOLVES FOR THIS LABEL`);
    else {
      lines.push(`- goal: ${lesson.goal}`);
      lines.push(`- big idea: ${lesson.bigIdea}`);
      lines.push(`- worked example: ${lesson.example?.problem}  → ${lesson.example?.answer}`);
      for (const s of lesson.example?.steps ?? []) lines.push(`    - ${s}`);
    }
    lines.push(`- lesson video: ${video ? `yes (${video.id})` : "NONE"}`);
    lines.push(`\n### B. First sheet of the new lesson — "${B.label}" sheet ${B.range[0]} (all ${Bfirst.length} questions)`);
    lines.push(...Bfirst.map(fmt));
    index.push({ id, level, cross, A: A.label, B: B.label, hasLesson: !!lesson, hasVideo: !!video, firstSheetCount: Bfirst.length, failed: Bfirst.some((p) => p.type === "error") });
  }
  fs.writeFileSync(path.join(outDir, `${level}.md`), lines.join("\n"), "utf8");
  prevLevelLast = { level, label: units[units.length - 1].label, problems: lastSheets[units.length - 1] };
  console.log(`${level}: ${units.length} lessons, ${pairs.length} transitions → ${level}.md`);
}
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2), "utf8");
console.log(`\n${index.length} transitions dumped; no lesson: ${index.filter((t) => !t.hasLesson).length}; no video: ${index.filter((t) => !t.hasVideo).length}; generation failures: ${index.filter((t) => t.failed).length}`);
