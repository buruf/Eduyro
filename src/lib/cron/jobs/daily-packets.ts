// src/lib/cron/jobs/daily-packets.ts
// Runs every morning at 6am — generates each active student's daily packet
// PDF and emails the parent a download link.

import { db } from "@/lib/db";
import { generateWorksheetPdf, uploadToS3 } from "@/lib/pdf/generator";
import { sendDailyPacketEmail } from "@/lib/email";
import { batchProcess } from "../index";
import { startOfDay, subDays } from "date-fns";
import { nanoid } from "nanoid";

const BATCH_SIZE = 8; // generate 8 PDFs in parallel

export async function generateDailyPackets(): Promise<{
  recordsProcessed: number;
  metadata: Record<string, any>;
}> {
  const todayStart = startOfDay(new Date());
  const yesterday = subDays(todayStart, 1);

  // Find all active students with at least one IN_PROGRESS level
  const students = await db.student.findMany({
    where: {
      progress: { some: { status: "IN_PROGRESS" } },
      // Only students whose parent has an active subscription (PDF downloads are paid)
      OR: [
        { parentLinks: { some: { parent: { user: { subscription: { plan: { not: "FREE" }, status: { in: ["ACTIVE", "TRIALING"] } } } } } } },
        { schoolId: { not: null } }, // school students always get them
      ],
    },
    include: {
      user: true,
      school: true,
      parentLinks: {
        include: { parent: { include: { user: true } } },
      },
      progress: {
        where: { status: "IN_PROGRESS" },
        include: { level: true },
      },
    },
  });

  console.log(`[CRON daily-packets] Processing ${students.length} students…`);

  const { results, failures } = await batchProcess(
    students,
    BATCH_SIZE,
    async (student) => {
      // Pick the active level (first one for now — could expand to all)
      const activeProgress = student.progress[0];
      if (!activeProgress) return { studentId: student.id, skipped: true };

      // Find sheets already completed today for this level
      const completedToday = await db.completedSheet.findMany({
        where: {
          studentId: student.id,
          completedAt: { gte: todayStart },
          worksheet: { levelId: activeProgress.levelId },
        },
        select: { worksheetId: true },
      });

      // Pick the next 3 sheets (the daily target)
      const upcomingSheets = await db.worksheet.findMany({
        where: {
          levelId: activeProgress.levelId,
          id: { notIn: completedToday.map((c) => c.worksheetId) },
          isActive: true,
        },
        orderBy: [{ skill: { sortOrder: "asc" } }, { sheetNumber: "asc" }],
        take: activeProgress.level.sheetsPerDay,
      });

      if (upcomingSheets.length === 0) {
        return { studentId: student.id, skipped: true, reason: "no_sheets_remaining" };
      }

      // Generate PDF
      const { buffer, fileName } = await generateWorksheetPdf({
        studentId: student.id,
        worksheetIds: upcomingSheets.map((w) => w.id),
        options: {
          worksheetIds: upcomingSheets.map((w) => w.id),
          includeAnswerKey: false,
          includeSignatureLine: true,
          includeInstructions: true,
          schoolBranding: student.school
            ? {
                schoolName: student.school.name,
                logoUrl: student.school.worksheetLogoUrl ?? undefined,
                headerText: student.school.worksheetHeaderText ?? undefined,
                footerText: student.school.worksheetFooterText ?? undefined,
              }
            : undefined,
        },
      });

      // Upload to S3
      const key = `daily-packets/${student.id}/${nanoid()}_${fileName}`;
      const fileUrl = await uploadToS3(buffer, key, "application/pdf");

      // Persist export record
      const pdfExport = await db.pdfExport.create({
        data: {
          studentId: student.id,
          type: "DAILY_PACKET",
          worksheetIds: upcomingSheets.map((w) => w.id),
          sheetCount: upcomingSheets.length,
          fileUrl,
          fileKey: key,
          fileSizeBytes: buffer.length,
          includesAnswerKey: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Email parent(s) the link
      const parent = student.parentLinks[0]?.parent;
      if (parent?.user?.email) {
        await sendDailyPacketEmail({
          email: parent.user.email,
          firstName: parent.user.firstName ?? "there",
          studentName: student.user.name ?? "your child",
          pdfUrl: fileUrl,
          sheetCount: upcomingSheets.length,
        }).catch((e) => console.error(`[CRON] Failed to email ${parent.user.email}:`, e));
      }

      // In-app notification for the student
      await db.notification.create({
        data: {
          userId: student.userId,
          type: "SHEET_COMPLETED",
          title: "Today's packet is ready",
          message: `${upcomingSheets.length} sheets · ${activeProgress.level.timeLimitMinutes * upcomingSheets.length} minutes target`,
          linkUrl: fileUrl,
        },
      });

      return { studentId: student.id, pdfExportId: pdfExport.id, sheetCount: upcomingSheets.length };
    }
  );

  return {
    recordsProcessed: results.length,
    metadata: {
      totalStudents: students.length,
      packetsGenerated: results.filter((r: any) => !r.skipped).length,
      skipped: results.filter((r: any) => r.skipped).length,
      failures: failures.length,
      failureReasons: failures.slice(0, 5).map((f) => f.error),
    },
  };
}
