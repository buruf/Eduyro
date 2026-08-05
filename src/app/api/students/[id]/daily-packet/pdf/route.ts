// src/app/api/students/[id]/daily-packet/pdf/route.ts
// Today's daily packet as a REAL PDF — rendered by the exact same engine and
// react-pdf renderer as the shop packs, so what a parent prints at home is
// pixel-identical to a purchased Eduyro worksheet (ink/gold layout, worksheets
// first, consolidated answer key at the end).
//
// GET /api/students/{id}/daily-packet/pdf?tz=America/Toronto
// Math packets only — Reading/Writing/Science keep the HTML print layout
// (they need multiple-choice options the math renderer doesn't draw).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { renderPackToPdf } from "@/lib/pdf/renderer";
import { getMathSheetMeta } from "@/lib/worksheet/generator";
import type { ShopSkill, WorksheetData } from "@/lib/shop/progressive-generator";

export const maxDuration = 120; // Pro plan — real headroom for a cold multi-sheet render

const LEVEL_TO_SKILL: Record<string, ShopSkill> = {
  M1: "ADDITION", M2: "ADDITION", // early levels render fine under any skill tag
  M3: "ADDITION", M4: "SUBTRACTION", M5: "MULTIPLICATION", M6: "DIVISION",
  M7: "FRACTIONS", M8: "DECIMALS", M9: "RATIOS", M10: "PRE_ALGEBRA",
  M11: "LINEAR_EQUATIONS", M12: "POLYNOMIALS",
};

function todayUTC(tz: string): Date {
  let timezone = tz;
  try { Intl.DateTimeFormat(undefined, { timeZone: tz }); } catch { timezone = "UTC"; }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (ctx) => {
    try {
      const student = await db.student.findUnique({
        where: { id: params.id },
        include: { parentLinks: { include: { parent: true } } },
      });
      if (!student) return notFound("Student");
      const isSelf = student.userId === ctx.userId;
      const isParent = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isSelf && !isParent && ctx.role !== "ADMIN" && ctx.role !== "SUPER_ADMIN") {
        // TEACHER must be linked to this student (security audit: blanket
        // teacher access exposed any child's worksheets to any teacher account).
        const linkedTeacher =
          ctx.role === "TEACHER" &&
          (await db.teacherStudent.findFirst({
            where: { studentId: student.id, teacher: { userId: ctx.userId } },
            select: { id: true },
          })) !== null;
        if (!linkedTeacher) return forbidden();
      }

      const tz = new URL(req.url).searchParams.get("tz") ?? "UTC";
      const dateUTC = todayUTC(tz);

      // Today's packet (created by the daily-packet GET the print page calls
      // first); fall back to the most recent one so the link never dead-ends.
      const packet =
        (await db.dailyPacket.findUnique({
          where: { studentId_date: { studentId: params.id, date: dateUTC } },
        })) ??
        (await db.dailyPacket.findFirst({
          where: { studentId: params.id },
          orderBy: { date: "desc" },
        }));

      if (!packet) return notFound("Daily packet");
      if (packet.subjectSlug !== "MATH") {
        return NextResponse.json(
          { error: "PDF layout is available for math packets only." },
          { status: 400 }
        );
      }

      const rawSheets = (packet.sheets as any[]) ?? [];
      const sheets = rawSheets.map((s, i) => {
        const answerMap = new Map(
          (s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)])
        );
        const sheetNo = s.sheetNumber ?? i + 1;
        // Title each sheet by the engine's REAL unit (e.g. "Arithmetic sequences")
        // rather than the parent skill name ("Limits") stored on the packet.
        const em = getMathSheetMeta(packet.levelCode, sheetNo);
        const label = em?.subSkillLabel ?? packet.skillName;
        return {
          problems: (s.problems ?? []).map((p: any) => ({
            id: String(p.id),
            question: String(p.question),
            answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
          })),
          skillBand: label,
          meta: {
            skill: LEVEL_TO_SKILL[packet.levelCode] ?? ("ADDITION" as ShopSkill),
            skillCode: packet.levelCode,
            sheetNumber: sheetNo,
            totalSheets: rawSheets.length,
            levelName: packet.levelName,
            subSkillLabel: label,
            gradeLevel: em?.gradeLevel ?? packet.levelName,
            difficultyStars: 3,
            learningObjective: `practice ${label.toLowerCase()}`,
            directive: em?.directive,
            mode: "practice" as const,
            estimatedMinutes: packet.timeLimitMinutes,
          } satisfies WorksheetData["meta"],
        };
      });

      const pdfBytes = await renderPackToPdf({
        skillLabel: `${packet.skillName} — Daily Packet`,
        skillCode: packet.levelCode,
        levelCode: packet.levelCode,
        sheets,
      });

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="eduyro-daily-${packet.levelCode.toLowerCase()}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
