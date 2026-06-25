// src/app/api/worksheet/by-id/[worksheetId]/route.ts
// GET /api/worksheet/by-id/:worksheetId
// Returns the stored problems for a specific worksheet DB record.
// Used by the student practice modal so problem IDs match the answer key
// stored in the DB — enabling correct scoring via submit-sheet.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems } from "@/lib/worksheet/generator";
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
        const fresh = generateProblems({
          subjectSlug: slug,
          levelCode: worksheet.level.code,
          skillName: worksheet.skill.name,
          problemCount: worksheet.problemCount || 20,
          timeLimitMinutes: worksheet.estimatedMinutes || 10,
          sheetNumber: Math.min(100, worksheet.sheetNumber),
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
          if (ansItems.length === optItems.length && ansItems.every((v, k) => v === optItems[k])) {
            return { id: p.id, question: p.question, type: p.type, options, points: p.points, answerType: "ordering" };
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
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
