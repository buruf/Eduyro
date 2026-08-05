// src/app/api/worksheet/by-id/[worksheetId]/route.ts
// GET /api/worksheet/by-id/:worksheetId
// Returns the stored problems for a specific worksheet DB record.
// Used by the student practice modal so problem IDs match the answer key
// stored in the DB — enabling correct scoring via submit-sheet.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems, getMathLevelSkills } from "@/lib/worksheet/generator";
import { classifyAnswerType } from "@/lib/practice/answer-type";

export async function GET(
  req: NextRequest,
  { params }: { params: { worksheetId: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      const worksheet = await db.worksheet.findUnique({
        where: { id: params.worksheetId },
        include: { skill: true, level: { include: { subject: true } } },
      });

      if (!worksheet) return notFound("Worksheet");

      // Access control: a STUDENT may only load worksheets for a level they are
      // actually enrolled in (StudentProgress) — otherwise any signed-in user
      // could enumerate arbitrary worksheets by id (and trigger the self-heal
      // regeneration/write below). Parents/teachers/admins are allowed through
      // for monitoring and printing.
      if (ctx.role === "STUDENT") {
        const student = await db.student.findUnique({
          where: { userId: ctx.userId },
          select: { id: true },
        });
        if (!student) return forbidden();
        const enrolled = await db.studentProgress.findFirst({
          where: { studentId: student.id, levelId: worksheet.levelId },
          select: { id: true },
        });
        if (!enrolled) return forbidden();
      }

      // ── Self-heal stale content ─────────────────────────────────────────────
      // Some seeded worksheets predate the current generators:
      //   • MATH sheets held content that no longer matched their skill label
      //     (e.g. multiplication under a "Quadratic equations" sheet).
      //   • Reading/Writing/Science sheets held free-text questions; the app now
      //     answers those as multiple choice, so they need stored options.
      // We regenerate from the current engine, but only for sheets that have NOT
      // been completed, so grading history and answered problem IDs are safe.
      const slug = worksheet.level.subject.slug;
      let storedProblems = worksheet.problems as any[];
      const done = await db.completedSheet.findFirst({
        where: { worksheetId: worksheet.id },
        select: { id: true },
      });
      if (!done) {
        // Both MATH and non-math are now deterministic by (levelCode, skillName,
        // sheetNumber), so regenerate and compare the QUESTION SET. This heals
        // stale seeds — old multiplication-under-quadratics, repeated science
        // banks, skills that lacked dedicated content — and applies the per-sheet
        // partitioning so consecutive sheets differ. Distractors are kept stable
        // when the questions already match.
        // Map the CONTENT sheet number into the lesson's range. For skill-map math
        // sheets the stored `sheetNumber` is a global RUNNING counter, NOT the
        // content index — the unit that owns the content is carried by the TITLE
        // ("<unit label> — Sheet N"). Regenerating from the raw running number
        // produces the WRONG unit (e.g. "What number comes after 19?" under a
        // "Missing number in a sequence" title) AND would clobber a correct row.
        let contentSheet = Math.min(100, worksheet.sheetNumber);
        if (slug === "MATH") {
          const label = worksheet.title?.split(" — Sheet")[0]?.trim();
          const unit = label ? getMathLevelSkills(worksheet.level.code).find((s) => s.label === label) : undefined;
          if (unit) {
            const size = unit.range[1] - unit.range[0] + 1;
            contentSheet = unit.range[0] + ((worksheet.sheetNumber - 1) % size);
          }
        }
        const fresh = generateProblems({
          subjectSlug: slug,
          levelCode: worksheet.level.code,
          skillName: worksheet.skill.name,
          problemCount: worksheet.problemCount || 20,
          timeLimitMinutes: worksheet.estimatedMinutes || 10,
          sheetNumber: contentSheet,
          totalSheets: 100,
        });
        const sig = (ps: any[]) => ps.map((p) => p.question).sort().join("§");
        const missingOpts = slug !== "MATH" && storedProblems.some((p) => (p.points ?? 0) > 0 && !(p.options?.length));
        const stale = missingOpts || sig(storedProblems) !== sig(fresh.problems);
        if (stale) {
          await db.worksheet.update({
            where: { id: worksheet.id },
            data: {
              problems: fresh.problems as any,
              answerKey: fresh.answerKey as any,
              problemCount: fresh.problems.length,
            },
          });
          storedProblems = fresh.problems as any[];
        }
      }

      // Return problems WITHOUT the answer key — answers are checked
      // server-side by submit-sheet, never exposed to the client. `type` and
      // `options` are surfaced so the practice UI can size inputs per answer
      // shape (number vs. long text) and render multiple-choice as buttons.
      const subjectSlug2 = worksheet.level.subject.slug;
      const levelCode2 = worksheet.level.code;

      // ── Worked examples for the pre-practice tutorial ──
      // Built from THIS sheet's own problems (one per distinct question FORM,
      // numbers masked), so the tutorial demonstrates every kind of question the
      // student is about to practice and always matches the content. Steps come
      // from the scaffold engine. This deliberately reveals the solution to a
      // handful of the sheet's problems — same trade-off as the printed lesson
      // page, which teaches with solved examples from the sheet.
      const { buildScaffold } = await import("@/lib/tutor/scaffold");
      const formOf = (q: string) => q.replace(/-?\d+(\.\d+)?/g, "#");
      const seenForms = new Set<string>();
      const workedExamples: { problem: string; steps: string[]; answer: string }[] = [];
      // Everything AFTER a passage header is a question about that passage.
      // Such a question cannot be a worked example: without the text it is
      // meaningless ("Where was the ant's nest?" — what ant?), and showing its
      // answer up front spoils the reading the child is about to do. Word work
      // that appears BEFORE the header is still fair game.
      let inPassage = false;
      for (const p of storedProblems) {
        const q = String(p.question ?? "");
        const a = String(p.answer ?? "");
        if (q.startsWith("READ THIS PASSAGE") || q.startsWith("LEARN THESE WORDS")) { inPassage = true; continue; }
        if (inPassage) continue;
        // Skip figure-marker and interactive items — their prompts don't render
        // as plain text in the tutorial modal.
        if (!q || !a || q.includes("[[viz") || p.interactive) continue;
        const f = formOf(q);
        if (seenForms.has(f)) continue;
        seenForms.add(f);
        try {
          const sc = buildScaffold(q, a, "", { subjectSlug: subjectSlug2, directive: worksheet.skill?.name ?? "" });
          // Never show a step-less "example" — if the scaffold has no real
          // teaching for this form, leave it out (the curated lesson example
          // still covers the unit).
          // A "worked example" whose only step is generic test-taking advice
          // ("Re-read the question and rule out the choices that clearly don't
          // fit") teaches nothing — it just spends the answer. Require at least
          // one step that actually works the problem.
          const GENERIC_STEP = /^(the correct answer is|re-?read |rule out|look (carefully|closely|again)|think about what|eliminate |check each (option|choice)|consider each)/i;
          const bland = !sc.hints.some((h) => !GENERIC_STEP.test(h.trim()));
          if (!bland) workedExamples.push({ problem: q, steps: sc.hints, answer: a });
        } catch { /* skip unbuildable example */ }
        if (workedExamples.length >= 6) break;
      }
      // Distractor pool for making symbolic math answers answerable as multiple
      // choice: the distinct answers already on this sheet (similar shape, so the
      // wrong options are plausible). Sorted for determinism, then sampled.
      const sheetAnswers = Array.from(
        new Set(storedProblems.map((p) => String(p.answer ?? "").trim()).filter((a) => a && a.length <= 28)),
      ).sort();
      const pick3 = (correct: string, seed: number): string[] => {
        const pool = sheetAnswers.filter((a) => a !== correct);
        // Deterministic rotating sample so a re-fetch is stable per problem.
        const out: string[] = [];
        for (let i = 0; i < pool.length && out.length < 3; i++) out.push(pool[(seed + i) % pool.length]);
        return Array.from(new Set(out)).slice(0, 3);
      };

      const problems = storedProblems.map((p, i) => {
        const ans = String(p.answer ?? "").trim();
        let options: string[] | null = p.options ?? null;
        // Interactive graphing items declare their own answer type and carry a
        // render spec (never the answer). Serve as-is — no number pad / MC.
        if (p.interactive) {
          return { id: p.id, question: p.question, type: p.type, options: null, points: p.points, answerType: "point", interactive: p.interactive };
        }
        // Drag-and-drop ORDERING items: the options are the items to arrange and
        // the answer is their correct order joined by commas — i.e. the answer is
        // a permutation of the options. Detect that server-side (the client gets
        // the items but never the correct order) and serve as an ordering input.
        if (options && options.length >= 3 && ans.includes(",")) {
          const ansItems = ans.split(",").map((s) => s.trim()).sort();
          const optItems = [...options].map((s) => s.trim()).sort();
          const optSet = new Set(optItems);
          if (ansItems.length === optItems.length && ansItems.every((v, k) => v === optItems[k])) {
            // answer is a permutation of ALL options → drag-to-order
            return { id: p.id, question: p.question, type: p.type, options, points: p.points, answerType: "ordering" };
          }
          if (ansItems.every((v) => optSet.has(v)) && ansItems.length < optItems.length) {
            // answer is a proper SUBSET of options → select-all-that-apply
            return { id: p.id, question: p.question, type: p.type, options, points: p.points, answerType: "multiSelect" };
          }
        }
        let answerType = classifyAnswerType({
          question: p.question,
          options,
          answer: ans,
          subjectSlug: subjectSlug2,
          levelCode: levelCode2,
        });
        // Symbolic math answers (±7, √2/2, 3x², y ≥ 2 …) can't be typed on a
        // number pad — serve them as multiple choice using sibling answers as
        // distractors so the student can always respond. (PDFs are unaffected;
        // this is the interactive-practice serving layer only. The correct answer
        // is one of the options but never flagged — grading stays server-side.)
        if (subjectSlug2 === "MATH" && answerType === "expression" && !options) {
          const distractors = pick3(ans, i);
          if (distractors.length === 3) {
            options = [ans, ...distractors].sort();
            answerType = "multipleChoice";
          }
        }
        return { id: p.id, question: p.question, type: p.type, options, points: p.points, answerType };
      });

      return ok({
        worksheetId: worksheet.id,
        skillName: worksheet.skill.name,
        levelCode: worksheet.level.code,
        subjectName: worksheet.level.subject.name,
        subjectSlug: worksheet.level.subject.slug,
        problemCount: problems.length,
        problems,
        workedExamples,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
