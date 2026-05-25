// src/app/api/worksheet/by-id/[worksheetId]/route.ts
// GET /api/worksheet/by-id/:worksheetId
// Returns the stored problems for a specific worksheet DB record.
// Used by the student practice modal so problem IDs match the answer key
// stored in the DB — enabling correct scoring via submit-sheet.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, notFound, handleRouteError, withAuth } from "@/lib/api/helpers";

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

      // Return problems WITHOUT the answer key — answers are checked
      // server-side by submit-sheet, never exposed to the client.
      const problems = (worksheet.problems as any[]).map((p) => ({
        id: p.id,
        question: p.question,
        type: p.type,
        points: p.points,
      }));

      return ok({
        worksheetId: worksheet.id,
        skillName: worksheet.skill.name,
        levelCode: worksheet.level.code,
        subjectName: worksheet.level.subject.name,
        problemCount: problems.length,
        problems,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
