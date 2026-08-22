// src/app/api/students/[id]/check-answer/route.ts
// Per-question grading for the optional "check as I go" practice mode. Returns
// whether one answer is correct (and the correct answer, so the client can show
// engine-driven coaching). Does NOT record a completion — the full sheet is still
// submitted at the end via submit-sheet.
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, notFound, forbidden, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { answersMatch } from "@/lib/grading";

const CheckSchema = z.object({
  worksheetId: z.string().min(1),
  problemId: z.string().min(1),
  answer: z.string().max(200),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, CheckSchema);
    if ("status" in parsed) return parsed;

    try {
      const student = await db.student.findUnique({ where: { id: params.id } });
      if (!student) return notFound("Student");
      // AuthZ: student self, ADMIN, or a TEACHER linked to THIS student (blanket
      // TEACHER access was a cross-tenant IDOR — see submit-sheet).
      if (student.userId !== ctx.userId && ctx.role !== "ADMIN" && ctx.role !== "SUPER_ADMIN") {
        const isLinkedTeacher =
          ctx.role === "TEACHER" &&
          (await db.teacherStudent.findFirst({
            where: { studentId: student.id, teacher: { userId: ctx.userId } },
            select: { id: true },
          })) !== null;
        if (!isLinkedTeacher) return forbidden();
      }

      const worksheet = await db.worksheet.findUnique({
        where: { id: parsed.data.worksheetId },
        select: { answerKey: true, problems: true },
      });
      if (!worksheet) return notFound("Worksheet");

      const entry = (worksheet.answerKey as any[])?.find((k) => k.id === parsed.data.problemId);
      if (!entry) return notFound("Problem");

      // Must grade identically to submit-sheet, options included — otherwise a
      // capitalization item says "correct" here and "wrong" on submission.
      const options = (worksheet.problems as any[])?.find(
        (p) => p?.id === parsed.data.problemId,
      )?.options as string[] | undefined;
      const correctAnswer = String(entry.answer ?? "");
      return ok({
        isCorrect: answersMatch(parsed.data.answer, correctAnswer, options),
        correctAnswer,
      });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
