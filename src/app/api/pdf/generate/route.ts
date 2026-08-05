// src/app/api/pdf/generate/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { GeneratePdfSchema } from "@/lib/validation/schemas";
import { generateWorksheetPdf, uploadToS3 } from "@/lib/pdf/generator";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, GeneratePdfSchema);
    if ("status" in parsed) return parsed;
    const { studentId, worksheetIds, includeAnswerKey, includeSignatureLine, includeInstructions } = parsed.data;

    try {
      // Verify access
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { parentLinks: { include: { parent: true } } },
      });
      if (!student) return err("Student not found", 404);

      const isOwn = student.userId === ctx.userId;
      const isParent = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      const isAdmin = ctx.role === "ADMIN" || ctx.role === "SUPER_ADMIN";
      // TEACHER must be linked to this student (security audit).
      const isLinkedTeacher =
        ctx.role === "TEACHER" &&
        (await db.teacherStudent.findFirst({
          where: { studentId: student.id, teacher: { userId: ctx.userId } },
          select: { id: true },
        })) !== null;
      if (!isOwn && !isParent && !isAdmin && !isLinkedTeacher) return err("Forbidden", 403);

      // Generate
      const { buffer, fileName } = await generateWorksheetPdf({
        studentId,
        worksheetIds,
        options: {
          worksheetIds,
          includeAnswerKey,
          includeSignatureLine,
          includeInstructions,
        },
      });

      // Upload to S3
      const key = `pdfs/${studentId}/${nanoid()}_${fileName}`;
      const fileUrl = await uploadToS3(buffer, key, "application/pdf");

      // Record export
      const pdfExport = await db.pdfExport.create({
        data: {
          studentId,
          type: worksheetIds.length === 1 ? "SINGLE_SHEET" : "DAILY_PACKET",
          worksheetIds,
          sheetCount: worksheetIds.length,
          fileUrl,
          fileKey: key,
          fileSizeBytes: buffer.length,
          includesAnswerKey: includeAnswerKey,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return ok({
        pdfExportId: pdfExport.id,
        downloadUrl: fileUrl,
        fileName,
        fileSizeBytes: buffer.length,
        expiresAt: pdfExport.expiresAt,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
