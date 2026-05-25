// src/app/api/pdf/bulk/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withRole, parseRequest } from "@/lib/api/helpers";
import { BulkExportSchema } from "@/lib/validation/schemas";
import { generateBulkPdfs, uploadToS3 } from "@/lib/pdf/generator";
import { nanoid } from "nanoid";
import { startOfDay, subDays } from "date-fns";

export async function POST(req: NextRequest) {
  return withRole(req, ["TEACHER", "ADMIN", "SUPER_ADMIN"], async (ctx) => {
    const parsed = await parseRequest(req, BulkExportSchema);
    if ("status" in parsed) return parsed;
    const { schoolId, exportType, classFilter, includeAnswerKey, outputFormat } = parsed.data;

    try {
      // Verify access to school
      const teacher = await db.teacher.findFirst({
        where: { userId: ctx.userId, schoolId },
      });
      if (!teacher && ctx.role !== "SUPER_ADMIN") return err("Not authorized for this school", 403);

      const school = await db.school.findUnique({ where: { id: schoolId } });
      if (!school) return err("School not found", 404);

      // Get all students for the school (or class)
      const where: any = { schoolId };
      if (classFilter && classFilter !== "ALL") {
        where.teacherLinks = { some: { teacherId: classFilter } };
      }

      const students = await db.student.findMany({
        where,
        include: {
          user: true,
          progress: { where: { status: "IN_PROGRESS" } },
        },
      });

      if (students.length === 0) return err("No students found", 404);

      // For each student, determine which worksheets to include
      const studentWorksheets = await Promise.all(
        students.map(async (student) => {
          const activeProgress = student.progress[0];
          if (!activeProgress) return null;

          let dateFilter: Date;
          if (exportType === "TODAY") dateFilter = startOfDay(new Date());
          else if (exportType === "THIS_WEEK") dateFilter = subDays(new Date(), 7);
          else dateFilter = startOfDay(new Date());

          // Get next 3 worksheets the student should work on (excluding completed today)
          const completedToday = await db.completedSheet.findMany({
            where: {
              studentId: student.id,
              completedAt: { gte: dateFilter },
              worksheet: { levelId: activeProgress.levelId },
            },
            select: { worksheetId: true },
          });

          const upcoming = await db.worksheet.findMany({
            where: {
              levelId: activeProgress.levelId,
              id: { notIn: completedToday.map((c) => c.worksheetId) },
              isActive: true,
            },
            orderBy: [{ skill: { sortOrder: "asc" } }, { sheetNumber: "asc" }],
            take: exportType === "THIS_WEEK" ? 15 : 3,
          });

          return {
            studentId: student.id,
            worksheetIds: upcoming.map((w) => w.id),
            studentName: student.user.name ?? "Student",
          };
        })
      );

      const validJobs = studentWorksheets.filter(
        (sw): sw is NonNullable<typeof sw> => sw !== null && sw.worksheetIds.length > 0
      );

      if (validJobs.length === 0) return err("No worksheets to export", 400);

      // Generate bulk
      const { zipBuffer, fileName, pdfCount } = await generateBulkPdfs({
        studentWorksheets: validJobs,
        options: {
          worksheetIds: [],
          includeAnswerKey,
          includeSignatureLine: true,
          includeInstructions: true,
          schoolBranding: {
            schoolName: school.name,
            logoUrl: school.worksheetLogoUrl ?? undefined,
            headerText: school.worksheetHeaderText ?? undefined,
            footerText: school.worksheetFooterText ?? undefined,
          },
        },
      });

      // Upload zip
      const key = `bulk-exports/${schoolId}/${nanoid()}_${fileName}`;
      const zipUrl = await uploadToS3(zipBuffer, key, "application/zip");

      // Record export
      const exportRecord = await db.pdfExport.create({
        data: {
          schoolId,
          type: "BULK_SCHOOL",
          worksheetIds: validJobs.flatMap((j) => j.worksheetIds),
          sheetCount: pdfCount,
          fileUrl: zipUrl,
          fileKey: key,
          zipUrl,
          fileSizeBytes: zipBuffer.length,
          includesAnswerKey: includeAnswerKey,
          customBranding: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return ok({
        exportId: exportRecord.id,
        downloadUrl: zipUrl,
        fileName,
        pdfCount,
        totalSizeBytes: zipBuffer.length,
        expiresAt: exportRecord.expiresAt,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
