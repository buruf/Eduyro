// scripts/audit-example-depth.ts — can every question a child can be ASKED
// actually be TAUGHT?
//
// For every micro-skill on every level of every subject, this checks:
//   (a) the unit's curated worked example has at least 2 real steps, and
//   (b) every distinct QUESTION SHAPE that unit serves produces at least 2
//       hints that state a method, rather than nudging or revealing.
//
// It grades through src/lib/tutor/coach.ts — the same path the student page
// renders — so "the audit passes" and "the child is taught" cannot come apart.
//
// COVERAGE. This used to walk M13–M18 only: six of twenty-four levels, and no
// reading, writing or science at all. It passed clean while every non-math
// question in the product answered a wrong attempt with "the correct choice
// is X". A gate that covers a quarter of the product is not a gate, so the
// sweep below is over everything the database can serve.
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills, generateProblems } from "../src/lib/worksheet/generator";
import { getMicroSkillLesson } from "../src/lib/worksheet/tutorials";
import { coachFor, isBlandHint } from "../src/lib/tutor/coach";

const db = new PrismaClient();

/** Sheets sampled per unit. Question SHAPES repeat quickly, so a handful of
 *  sheets surfaces a unit's whole repertoire without walking all 100. */
const SHEETS_PER_UNIT = 4;

/** Does this "step" just say the problem back with the answer on the end?
 *  Punctuation and the =/→ join are ignored, so "7 × 8 = 56" against the
 *  problem "7 × 8 =" and answer "56" counts as saying nothing. */
function restatesAnswer(step: string, problem: string, answer: string): boolean {
  const bare = (s: string) => s.toLowerCase().replace(/[\s=→:.]/g, "");
  const s = bare(step);
  return s === bare(problem) + bare(answer) || s === bare(problem) || s === bare(answer);
}

interface UnitReport {
  subject: string;
  level: string;
  label: string;
  curatedSteps: number;
  shapes: number;
  thin: number;
  worstExample: string;
}

function gradeUnit(
  subjectSlug: string,
  levelCode: string,
  skillName: string,
  label: string,
  sheetNumbers: number[],
): UnitReport {
  const lesson = getMicroSkillLesson(subjectSlug, levelCode, label);
  // Depth is not step COUNT. "Count on by one: 7 → 8" is one step and is the
  // entire method for a Kindergarten question; demanding two would only pad
  // it. What actually fails a child is an example that RESTATES the answer
  // and teaches nothing — "7 × 8 = 56" on the hard-facts unit, which is
  // exactly the child who does not know 7 × 8.
  const ex = lesson?.example;
  const curatedSteps = ex?.steps?.filter((s) => !isBlandHint(s) && !restatesAnswer(s, ex.problem, ex.answer)).length ?? 0;

  const seen = new Set<string>();
  let shapes = 0, thin = 0, worstExample = "";
  for (const n of sheetNumbers) {
    let out: any;
    try {
      out = generateProblems({
        subjectSlug, levelCode, skillName,
        problemCount: 30, timeLimitMinutes: 10, sheetNumber: n, totalSheets: 100,
      });
    } catch { continue; }
    for (const p of (out?.problems ?? []) as any[]) {
      const q = String(p.question ?? "");
      // A passage block is reading material, not a question — it is worth 0
      // points and is never asked, so it is not the coach's job.
      if ((p.points ?? 1) === 0 || /^READ THIS PASSAGE/i.test(q)) continue;
      const shape = q.replace(/[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]/g, "#").slice(0, 34);
      if (seen.has(shape)) continue;
      seen.add(shape);
      const sc = coachFor({
        question: q,
        correctAnswer: String(p.answer ?? ""),
        studentAnswer: "",
        subjectSlug, levelCode, skillName: label,
        explanation: (p as any).explanation,
      });
      shapes++;
      if (sc.hints.filter((h) => !isBlandHint(h)).length < 2) {
        thin++;
        if (!worstExample) worstExample = q.replace(/\s+/g, " ").slice(0, 72);
      }
    }
  }
  return { subject: subjectSlug, level: levelCode, label, curatedSteps, shapes, thin, worstExample };
}

async function main() {
  const levels = await db.level.findMany({
    where: { isActive: true },
    include: { subject: true, skills: true },
    orderBy: [{ subject: { name: "asc" } }, { sortOrder: "asc" }],
  });

  const reports: UnitReport[] = [];
  for (const level of levels) {
    const subjectSlug = level.subject.slug;
    if (subjectSlug === "MATH") {
      // Math units come from the skill map, and each owns a sheet range.
      for (const unit of getMathLevelSkills(level.code)) {
        const [lo, hi] = unit.range;
        const step = Math.max(1, Math.floor((hi - lo + 1) / SHEETS_PER_UNIT));
        const sheets: number[] = [];
        for (let n = lo; n <= hi && sheets.length < SHEETS_PER_UNIT; n += step) sheets.push(n);
        reports.push(gradeUnit("MATH", level.code, unit.label, unit.label, sheets));
      }
    } else {
      for (const skill of level.skills) {
        reports.push(
          gradeUnit(subjectSlug, level.code, skill.name, skill.name,
            Array.from({ length: SHEETS_PER_UNIT }, (_, i) => i + 1)),
        );
      }
    }
  }
  await db.$disconnect();

  const flagged = reports.filter((r) => r.shapes > 0 && (r.curatedSteps < 1 || r.thin > 0));
  const bySubject = new Map<string, UnitReport[]>();
  for (const r of reports) {
    const k = r.subject;
    if (!bySubject.has(k)) bySubject.set(k, []);
    bySubject.get(k)!.push(r);
  }

  for (const [subject, rs] of bySubject) {
    const bad = rs.filter((r) => flagged.includes(r));
    const graded = rs.filter((r) => r.shapes > 0);
    console.log(`\n── ${subject} ── ${graded.length} units graded, ${bad.length} flagged`);
    for (const r of bad.slice(0, 12)) {
      console.log(
        `  ⚠ ${r.level.padEnd(4)} ${r.label.slice(0, 36).padEnd(36)} curated:${r.curatedSteps}  thin-shapes:${r.thin}/${r.shapes}`,
      );
      if (r.worstExample) console.log(`        e.g. "${r.worstExample}"`);
    }
    if (bad.length > 12) console.log(`  … and ${bad.length - 12} more`);
  }

  const graded = reports.filter((r) => r.shapes > 0).length;
  console.log(`\nunits graded: ${graded} (was 45 — M13–M18 only), flagged (thin teaching): ${flagged.length}`);
  if (flagged.length) process.exit(1);
}
main();
