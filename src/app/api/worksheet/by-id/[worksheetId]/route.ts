// src/app/api/worksheet/by-id/[worksheetId]/route.ts
// GET /api/worksheet/by-id/:worksheetId
// Returns the stored problems for a specific worksheet DB record.
// Used by the student practice modal so problem IDs match the answer key
// stored in the DB — enabling correct scoring via submit-sheet.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleRouteError, withAuth } from "@/lib/api/helpers";
import { generateProblems } from "@/lib/worksheet/generator";

export async function GET(
  req: NextRequest,
  { params }: { params: { worksheetId: string } }
) {
  return withAuth(req, async () => {
    try {
      const worksheet = await db.worksheet.findUnique({
        where: { id: params.worksheetId },
        include: { skill: true, level: { include: { subject: true } } },
      });

      if (!worksheet) return notFound("Worksheet");

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
      const problems = storedProblems.map((p) => ({
        id: p.id,
        question: p.question,
        type: p.type,
        options: p.options ?? null,
        points: p.points,
      }));

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
