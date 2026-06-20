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
      if (student.userId !== ctx.userId && ctx.role !== "ADMIN" && ctx.role !== "TEACHER") {
        return forbidden();
      }

      const worksheet = await db.worksheet.findUnique({
        where: { id: parsed.data.worksheetId },
        select: { answerKey: true },
      });
      if (!worksheet) return notFound("Worksheet");

      const entry = (worksheet.answerKey as any[])?.find((k) => k.id === parsed.data.problemId);
      if (!entry) return notFound("Problem");

      const correctAnswer = String(entry.answer ?? "");
      return ok({
        isCorrect: answersMatch(parsed.data.answer, correctAnswer),
        correctAnswer,
      });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
