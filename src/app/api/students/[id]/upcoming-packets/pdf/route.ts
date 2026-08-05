// src/app/api/students/[id]/upcoming-packets/pdf/route.ts
// Vacation pack as a REAL PDF — same engine/renderer as the shop packs and the
// daily-packet PDF, so a printed vacation pack is pixel-identical to a purchased
// Eduyro worksheet. Math only (Reading/Writing/Science keep the HTML print
// layout, which the upcoming print page renders directly).
//
// GET /api/students/{id}/upcoming-packets/pdf?days=N&tz=America/Toronto
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, forbidden, handleRouteError, withAuth } from "@/lib/api/helpers";
import { renderPackToPdf } from "@/lib/pdf/renderer";
import { generateProblems, getMathSheetMeta, getMathLevelSkills } from "@/lib/worksheet/generator";
import type { ShopSkill, WorksheetData } from "@/lib/shop/progressive-generator";
import { DEFAULT_SHEETS_PER_DAY as SHEETS_PER_DAY } from "@/lib/curriculum-constants";

// Vacation packs render MANY days of sheets in one request — the heaviest
// user-facing PDF route. 300s is real now that the project is on Vercel Pro
// (Hobby silently clamped everything to 60).
export const maxDuration = 300;

const PROBLEMS_PER_SHEET = 30;
const MAX_DAYS = 14;

const LEVEL_TO_SKILL: Record<string, ShopSkill> = {
  M1: "ADDITION", M2: "ADDITION", M3: "ADDITION", M4: "SUBTRACTION",
  M5: "MULTIPLICATION", M6: "DIVISION", M7: "FRACTIONS", M8: "DECIMALS",
  M9: "RATIOS", M10: "PRE_ALGEBRA", M11: "LINEAR_EQUATIONS", M12: "POLYNOMIALS",
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (ctx) => {
    try {
      const days = Math.min(MAX_DAYS, Math.max(1, parseInt(new URL(req.url).searchParams.get("days") ?? "5", 10) || 5));

      const student = await db.student.findUnique({
        where: { id: params.id },
        include: {
          parentLinks: { include: { parent: true } },
          progress: {
            where: { status: "IN_PROGRESS" },
            include: { level: { include: { subject: true, skills: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      });
      if (!student) return notFound("Student");

      const isSelf = student.userId === ctx.userId;
      const isParent = student.parentLinks.some((l) => l.parent.userId === ctx.userId);
      if (!isSelf && !isParent && ctx.role !== "ADMIN" && ctx.role !== "SUPER_ADMIN") {
        // TEACHER must be linked to this student (security audit).
        const linkedTeacher =
          ctx.role === "TEACHER" &&
          (await db.teacherStudent.findFirst({
            where: { studentId: student.id, teacher: { userId: ctx.userId } },
            select: { id: true },
          })) !== null;
        if (!linkedTeacher) return forbidden();
      }

      const activeProgress = student.progress[0] ?? null;
      if (!activeProgress) return NextResponse.json({ error: "Child has not been placed yet." }, { status: 400 });

      const level = activeProgress.level;
      const subject = level.subject;
      const skill = level.skills[0];
      if (!skill) return NextResponse.json({ error: "No skill for this level." }, { status: 400 });
      if (subject.slug !== "MATH") {
        return NextResponse.json({ error: "PDF layout is available for math packets only." }, { status: 400 });
      }

      // Walk the SKILL MAP one lesson per day (matching the daily flow), spilling
      // into the next level(s) when this level's lessons run out — so a 14-day
      // pack covers MANY lessons instead of 14 days of the same one.
      const fwdLevels = await db.level.findMany({
        where: { subjectId: subject.id, sortOrder: { gte: level.sortOrder } },
        orderBy: { sortOrder: "asc" },
      });
      type PlanDay = { levelCode: string; levelName: string; skill: { id: string; label: string; range: [number, number] } };
      const plan: PlanDay[] = [];
      for (const lv of fwdLevels) {
        const lvSkills = getMathLevelSkills(lv.code);
        if (!lvSkills.length) continue;
        const startIdx = lv.id === level.id ? (activeProgress.currentSkillIndex ?? 0) : 0;
        for (let si = startIdx; si < lvSkills.length && plan.length < days; si++) {
          plan.push({ levelCode: lv.code, levelName: lv.name, skill: { id: lvSkills[si].id, label: lvSkills[si].label, range: lvSkills[si].range } });
        }
        if (plan.length >= days) break;
      }
      while (plan.length && plan.length < days) plan.push(plan[plan.length - 1]); // ran out of lessons → hold on the last
      if (!plan.length) return NextResponse.json({ error: "No lessons to project." }, { status: 400 });

      const totalSheets = days * SHEETS_PER_DAY;
      const sheets: any[] = [];
      let runningSheet = 0;
      for (let day = 1; day <= days; day++) {
        const pd = plan[day - 1];
        const rangeSize = Math.max(1, pd.skill.range[1] - pd.skill.range[0] + 1);
        for (let i = 1; i <= SHEETS_PER_DAY; i++) {
          runningSheet++;
          // A sheet WITHIN this lesson's range → the engine generates this lesson.
          const sheetNumber = pd.skill.range[0] + (((day - 1) * SHEETS_PER_DAY + i - 1) % rangeSize);
          const { problems, answerKey } = generateProblems({
            subjectSlug: "MATH", levelCode: pd.levelCode, skillName: pd.skill.label,
            problemCount: PROBLEMS_PER_SHEET, timeLimitMinutes: level.timeLimitMinutes,
            difficulty: 1.0, sheetNumber, totalSheets: 100,
          });
          const answerMap = new Map(answerKey.map((e) => [e.id, String(e.answer)]));
          const em = getMathSheetMeta(pd.levelCode, sheetNumber);
          const label = pd.skill.label;
          sheets.push({
            problems: problems.map((p) => ({ id: String(p.id), question: String(p.question), answer: answerMap.get(p.id) ?? String((p as any).answer ?? "") })),
            skillBand: label,
            meta: {
              skill: LEVEL_TO_SKILL[pd.levelCode] ?? ("ADDITION" as ShopSkill),
              skillCode: pd.levelCode,
              sheetNumber: runningSheet,
              totalSheets,
              levelName: `${pd.levelName} · Day ${day}`,
              subSkillLabel: label,
              gradeLevel: em?.gradeLevel ?? pd.levelName,
              difficultyStars: 3,
              learningObjective: `practice ${label.toLowerCase()}`,
              directive: em?.directive,
              mode: "practice" as const,
              estimatedMinutes: level.timeLimitMinutes,
            } satisfies WorksheetData["meta"],
          });
        }
      }

      const pdfBytes = await renderPackToPdf({
        skillLabel: `${skill.name} — ${days}-Day Vacation Pack`,
        skillCode: level.code,
        levelCode: level.code,
        sheets,
      });

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="eduyro-vacation-${level.code.toLowerCase()}-${days}d.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (e) {
      return handleRouteError(e);
    }
  });
}
