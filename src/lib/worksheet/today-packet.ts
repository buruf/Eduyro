// src/lib/worksheet/today-packet.ts
// THE single source of truth for "today's packet" — which worksheets a student
// works on today. Used by BOTH the student dashboard (on-screen practice) and
// the parent PRINT routes, so what's printed always matches what's practised:
// same skill-map lesson (currentSkillIndex), same repeat-on-fail retirement,
// same daily quota window (admin skill-unlock restarts it), same admin
// daily-sheets override, same auto-minted worksheet rows.
//
// Extracted from the dashboard route when the print route was found running a
// DIVERGENT counter-based pipeline (it regenerated content from
// priorPackets × SHEETS_PER_DAY and ignored the skill map entirely).

import { appDayStart } from "@/lib/time";
import { db } from "@/lib/db";
import { startOfDay } from "date-fns";
import {
  generateProblems,
  getMathSheetMeta,
  nonMathDistinctSheets,
  nonMathBankQuestions,
  getMathLevelSkills,
} from "@/lib/worksheet/generator";
import { computeItemMastery, type ItemMastery } from "@/lib/worksheet/item-mastery";
import { isSkillMastered } from "@/lib/mastery";
import { isSheetFluent, skillLabelFromTitle } from "@/lib/mastery/fluency";
import type { TodaySheet } from "@/types";

export async function buildTodayPacket(
  studentId: string,
  progress: any
): Promise<{ sheets: TodaySheet[]; allComplete: boolean; canPrint: boolean }> {
  if (!progress) {
    return { sheets: [], allComplete: false, canPrint: false };
  }

  // Day boundary in the STUDENT'S timezone (worldwide students — "today" must
  // roll at their local midnight, not a fixed region's).
  const stz = await db.student.findUnique({ where: { id: studentId }, select: { timezone: true } });
  const todayStart = appDayStart(new Date(), stz?.timezone);
  // Admin per-student override is RAISE-ONLY: max(override, level default).
  // (An override below the daily quota would make day-clearing — which requires
  // exactly sheetsPerDay sheets — impossible, stalling advancement forever.)
  const levelPerDay = progress.level.sheetsPerDay ?? 3;
  const sheetsPerDay = progress.dailySheetsOverride
    ? Math.max(progress.dailySheetsOverride, levelPerDay)
    : levelPerDay;

  // Daily quota window: starts at midnight, OR at the moment an admin unlocked
  // a skill today (set-skill stamps skillUnlockedAt). The unlock restarts the
  // quota so the new lesson is served immediately — otherwise a student who
  // already finished today's packet would see nothing until tomorrow.
  const unlockedAt = (progress as any).skillUnlockedAt as Date | null;
  const quotaStart = unlockedAt && unlockedAt > todayStart ? unlockedAt : todayStart;

  // Get today's completed sheets for this student + level (quota window)
  const completedToday = await db.completedSheet.findMany({
    where: {
      studentId,
      completedAt: { gte: quotaStart },
      worksheet: { levelId: progress.levelId },
    },
    include: { worksheet: { include: { skill: true } } },
    orderBy: { completedAt: "asc" },
  });

  // Skip worksheets the student has EVER completed in this level — not just
  // today's. (Excluding only today's meant every new day re-served the same
  // first sheets of the level, so students never saw new material.)
  // REPEAT-ON-FAIL: a sheet is only retired once it was completed at ≥ the
  // mastery threshold. A sheet failed below threshold is RE-SERVED the next day
  // so the student repeats the same material instead of moving on past it.
  // (Anything completed today is also excluded — the double-submit guard blocks
  // same-day resubmission of the same worksheet, so re-serving it today would
  // dead-end in a 409.)
  // FLUENCY (fact levels M3–M6): a fact sheet that was accurate but too SLOW is
  // NOT retired — it repeats so the facts become automatic (speed, not just
  // correctness, is mastery). We can't express the pace test in SQL, so we pull
  // the candidate passed sheets with time+title and filter in code.
  const masteryBar = progress.level.masteryThresholdPct ?? 90;
  const levelCode = progress.level?.code ?? "";
  const passedSheets = await db.completedSheet.findMany({
    where: {
      studentId,
      worksheet: { levelId: progress.levelId },
      accuracyPct: { gte: masteryBar },
    },
    select: { worksheetId: true, accuracyPct: true, timeSeconds: true, totalProblems: true, worksheet: { select: { title: true } } },
  });
  const retiredIds = passedSheets
    .filter((c) => isSheetFluent({
      levelCode, skillLabel: skillLabelFromTitle(c.worksheet?.title),
      accuracyPct: c.accuracyPct, thresholdPct: masteryBar,
      timeSeconds: c.timeSeconds, problemCount: c.totalProblems,
    }))
    .map((c) => c.worksheetId);
  // Anything completed TODAY is also excluded regardless of fluency — the
  // double-submit guard blocks same-day resubmission (re-serving it today would
  // dead-end in a 409). A slow sheet comes back TOMORROW.
  const todayDoneIds = await db.completedSheet.findMany({
    where: { studentId, worksheet: { levelId: progress.levelId }, completedAt: { gte: todayStart } },
    select: { worksheetId: true },
  });
  const completedWorksheetIds = [...new Set([...retiredIds, ...todayDoneIds.map((c) => c.worksheetId)])];

  // The daily cap is exactly `sheetsPerDay` (the level default, or the admin's
  // per-student override). The old "+2 bonus on a streak" was removed — the bonus
  // sheets re-served the same content the next day, so they wasted the child's
  // time. An admin who wants a student to do more per day raises the override.
  const dailyCap = sheetsPerDay;
  const needed = Math.max(0, dailyCap - completedToday.length);

  // Which skill is the packet currently working on?
  //  • MATH levels are sheet-number-driven (the engine raises difficulty by sheet
  //    number; the named "skills" are cosmetic) → always the first skill.
  //  • Reading/Writing/Science have DISTINCT content per skill, so the packet must
  //    stay on the first not-yet-mastered skill until it's mastered, then advance —
  //    otherwise the student spreads thin across skills and never unlocks the next.
  const isMath = progress.level?.subject?.slug === "MATH";
  const skills = progress.level?.skills ?? [];
  let activeSkill = skills[0];
  if (!isMath && skills.length > 1) {
    const subjectSlug = progress.level?.subject?.slug ?? "";
    const levelCode = progress.level?.code ?? "";
    const stats = await skillCompletionStats(studentId, progress.levelId);
    const itemStats = await itemMasteryBySkill(studentId, progress.level);
    activeSkill = skills.find((sk: any) => {
      const st = stats[sk.id];
      const n = st?.sheetsCompleted ?? 0;
      const avg = n > 0 ? st.totalAccuracy / n : 0;
      return !isSkillMastered({
        isMath: false,
        sheetsCompleted: n,
        avgAccuracy: avg,
        distinctSheets: nonMathDistinctSheets(subjectSlug, levelCode, sk.name),
        item: itemStats[sk.id],
      });
    }) ?? skills[skills.length - 1];
  }

  // MATH skill-map: the CURRENT lesson (advances one per day at threshold). Content
  // is generated from THIS skill's sheet range so the daily packet stays on the
  // current lesson, instead of a global running sheet number.
  const mathSkills = isMath ? getMathLevelSkills(progress.level?.code ?? "") : [];
  const mathSkillIdx = Math.min(Math.max(0, progress.currentSkillIndex ?? 0), Math.max(0, mathSkills.length - 1));
  const curMathSkill = mathSkills[mathSkillIdx];

  let nextWorksheets = await db.worksheet.findMany({
    where: {
      levelId: progress.levelId,
      id: { notIn: completedWorksheetIds },
      isActive: true,
      // MATH: only serve sheets minted for the CURRENT lesson (title carries the
      // unit label). Without this, leftover sheets minted under a previous
      // lesson keep being served after the skill index advances — the student
      // sees "Counting on" sheets while the skill map says "Missing number".
      ...(isMath
        ? (curMathSkill ? { title: { startsWith: `${curMathSkill.label} — ` } } : {})
        : (activeSkill ? { skillId: activeSkill.id } : {})),
    },
    include: { skill: true },
    orderBy: [{ skill: { sortOrder: "asc" } }, { sheetNumber: "asc" }],
    take: needed,
  });

  // AUTO-MINT: the seeded bank is small (a handful of sheets per skill). When
  // a student works past it, mint the next sheets on the fly from the clean
  // curriculum engine — sheetNumber keeps advancing, so difficulty rises
  // day over day exactly like the shop packs (Kumon pacing). Problems AND the
  // answer key are stored on the row, so grading stays consistent.
  const deficit = needed - nextWorksheets.length;
  const skill = activeSkill;
  if (deficit > 0 && skill) {
    // Worksheets are shared per-skill content, so two concurrent requests (two
    // tabs, or two students on the same skill) could otherwise create duplicate
    // (skillId, sheetNumber) rows. Serialize minting per (level, skill) with a
    // Postgres advisory lock and re-read the max sheet number INSIDE the lock so
    // numbers can never collide. The lock auto-releases at transaction end.
    const minted = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${progress.levelId}), hashtext(${skill.id}))`;
      const maxSheet = await tx.worksheet.aggregate({
        where: { levelId: progress.levelId, skillId: skill.id },
        _max: { sheetNumber: true },
      });
      let nextNum = (maxSheet._max.sheetNumber ?? 0) + 1;
      const created: typeof nextWorksheets = [];
      for (let i = 0; i < deficit; i++) {
        // For MATH, map the CONTENT sheet number into the current skill's range so
        // the packet serves the current lesson; otherwise use the running number.
        const contentSheet = curMathSkill
          ? curMathSkill.range[0] + ((nextNum - 1) % (curMathSkill.range[1] - curMathSkill.range[0] + 1))
          : Math.min(100, nextNum);
        const { problems, answerKey } = generateProblems({
          subjectSlug: progress.level?.subject?.slug ?? "MATH",
          levelCode: progress.level?.code ?? "M3",
          skillName: skill.name,
          problemCount: 30,
          timeLimitMinutes: progress.level?.timeLimitMinutes ?? 10,
          sheetNumber: contentSheet,
          totalSheets: 100,
        });
        created.push(await tx.worksheet.create({
          data: {
            levelId: progress.levelId,
            skillId: skill.id,
            sheetNumber: nextNum,
            title: curMathSkill ? `${curMathSkill.label} — Sheet ${nextNum}` : `${skill.name} — Sheet ${nextNum}`,
            problems: problems as any,
            answerKey: answerKey as any,
            problemCount: problems.length,
            estimatedMinutes: progress.level?.timeLimitMinutes ?? 10,
          },
          include: { skill: true },
        }));
        nextNum++;
      }
      return created;
    }, { timeout: 20_000 });
    nextWorksheets.push(...minted);
  }

  // SELF-HEAL stale math rows: some sheets were minted in an earlier window where
  // the TITLE was written from the current lesson label but the CONTENT came from
  // the raw running sheet number (→ the wrong unit — e.g. a "Missing number in a
  // sequence" sheet that actually served "What number comes after 19?"). Content
  // is deterministic from (level, contentSheet), so regenerate the expected
  // problems for each served math row and, if the stored content is a different
  // question TYPE than the title's lesson, re-mint it in place so the questions
  // match the lesson. A correctly-minted row regenerates identically → no write.
  if (isMath && curMathSkill && nextWorksheets.length) {
    const rangeSize = curMathSkill.range[1] - curMathSkill.range[0] + 1;
    const formOf = (probs: any[]) =>
      probs.slice(0, 3).map((p) => String(p?.question ?? "").replace(/-?\d+/g, "#")).join(" | ");
    for (const ws of nextWorksheets) {
      const stored = Array.isArray(ws.problems) ? (ws.problems as any[]) : [];
      if (!stored.length) continue;
      const contentSheet = curMathSkill.range[0] + ((ws.sheetNumber - 1) % rangeSize);
      const expected = generateProblems({
        subjectSlug: progress.level?.subject?.slug ?? "MATH",
        levelCode: progress.level?.code ?? "M3",
        skillName: ws.skill.name,
        problemCount: 30,
        timeLimitMinutes: progress.level?.timeLimitMinutes ?? 10,
        sheetNumber: contentSheet,
        totalSheets: 100,
      });
      // Re-mint when the stored content is the wrong LESSON (shape differs)
      // OR the wrong LENGTH. The length case is the sheet-size cap: long
      // multiplication moved to 10 problems, but the cap only applies when a
      // row is generated, so rows minted before it kept 24 forever - and a
      // failed sheet is re-served from its stored row, so a child could redo
      // a 24-problem sheet indefinitely. Reported as "why is Ridwan still
      // getting 24 questions" after his pending sheets were fixed by hand.
      const sameLesson = formOf(stored) === formOf(expected.problems);
      const sameLength = stored.length === expected.problems.length;
      if (sameLesson && sameLength) continue;
      await db.worksheet.update({
        where: { id: ws.id },
        data: {
          problems: expected.problems as any,
          answerKey: expected.answerKey as any,
          problemCount: expected.problems.length,
        },
      });
      (ws as any).problems = expected.problems;
      (ws as any).answerKey = expected.answerKey;
      (ws as any).problemCount = expected.problems.length;
    }
  }

  const sheets: TodaySheet[] = [];

  // A sheet's honest skill label. The stored TITLE ("<unit label> — Sheet N") is
  // authoritative — it was written at mint time from the lesson that actually
  // generated the content. Recomputing from the row's RUNNING sheetNumber is
  // wrong for skill-map sheets (content comes from a range-mapped number), so
  // getMathSheetMeta is only a fallback for legacy rows without the title form.
  const unitOf = (sheetNumber: number, fallback: string, title?: string | null) => {
    const fromTitle = title?.split(" — Sheet")[0]?.trim();
    if (fromTitle) return fromTitle;
    return getMathSheetMeta(progress.level.code, sheetNumber)?.subSkillLabel ?? fallback;
  };

  // Add completed sheets
  completedToday.forEach((cs, i) => {
    sheets.push({
      index: i + 1,
      worksheetId: cs.worksheetId,
      title: cs.worksheet.title,
      skillName: unitOf(cs.worksheet.sheetNumber, cs.worksheet.skill.name, cs.worksheet.title),
      problemCount: cs.totalProblems,
      status: "COMPLETED",
      score: cs.score,
      accuracyPct: cs.accuracyPct,
      timeSeconds: cs.timeSeconds,
      completedAt: cs.completedAt.toISOString(),
    });
  });

  // Add pending sheets
  nextWorksheets.forEach((ws, i) => {
    sheets.push({
      index: completedToday.length + i + 1,
      worksheetId: ws.id,
      title: ws.title,
      skillName: unitOf(ws.sheetNumber, ws.skill.name, ws.title),
      // Use the actual stored content length — the cached `problemCount` field can
      // be stale (e.g. a seeded "10" when the sheet really has 7), which showed a
      // wrong count on the card before the sheet was opened.
      problemCount: Array.isArray(ws.problems) ? (ws.problems as any[]).length : ws.problemCount,
      status: i === 0 ? "IN_PROGRESS" : "NOT_STARTED",
    });
  });

  const allComplete = sheets.length > 0 && sheets.every((s) => s.status === "COMPLETED");

  return { sheets, allComplete, canPrint: true };
}

export async function skillCompletionStats(
  studentId: string,
  levelId: string
): Promise<Record<string, { sheetsCompleted: number; totalAccuracy: number }>> {
  const grouped = await db.completedSheet.groupBy({
    by: ["worksheetId"],
    where: { studentId, worksheet: { levelId } },
    _avg: { accuracyPct: true },
    _count: true,
  });
  const ws = await db.worksheet.findMany({
    where: { id: { in: grouped.map((g) => g.worksheetId) } },
    select: { id: true, skillId: true },
  });
  const out: Record<string, { sheetsCompleted: number; totalAccuracy: number }> = {};
  for (const g of grouped) {
    const w = ws.find((x) => x.id === g.worksheetId);
    if (!w) continue;
    const b = (out[w.skillId] ??= { sheetsCompleted: 0, totalAccuracy: 0 });
    b.sheetsCompleted += g._count;
    b.totalAccuracy += (g._avg.accuracyPct ?? 0) * g._count;
  }
  return out;
}

/**
 * Per-skill item-level mastery for a NON-MATH level. Loads each completed sheet
 * with its stored problems so answers (which carry only per-generation problem
 * ids) can be resolved back to question text, then dedupes across sheets by
 * question. Returns {} for MATH (engine = unbounded items, item coverage N/A).
 */
export async function itemMasteryBySkill(
  studentId: string,
  level: any,
): Promise<Record<string, ItemMastery>> {
  const subjectSlug = level?.subject?.slug ?? "";
  const levelCode = level?.code ?? "";
  if (subjectSlug === "MATH") return {};

  // BOUNDED: item mastery only needs the LATEST attempt per question, and any
  // question a student still practises reappears within recent sheets — so the
  // most recent window is sufficient. Unbounded, this loaded every sheet a
  // student ever completed (with full answers + problems JSON) on every
  // dashboard hit, growing forever.
  const sheets = await db.completedSheet.findMany({
    where: { studentId, worksheet: { levelId: level.id } },
    orderBy: { completedAt: "desc" },
    take: 150, // ≈ 50 practice days at 3 sheets/day, per level
    select: {
      completedAt: true,
      answers: true,
      worksheet: { select: { skillId: true, problems: true } },
    },
  });

  const bySkill: Record<string, { completedAt: Date; answers: unknown; problems: unknown }[]> = {};
  for (const s of sheets) {
    const sid = s.worksheet?.skillId;
    if (!sid) continue;
    (bySkill[sid] ??= []).push({ completedAt: s.completedAt, answers: s.answers, problems: s.worksheet?.problems });
  }

  const out: Record<string, ItemMastery> = {};
  for (const skill of level.skills ?? []) {
    const bank = nonMathBankQuestions(subjectSlug, levelCode, skill.name);
    out[skill.id] = computeItemMastery(bySkill[skill.id] ?? [], bank);
  }
  return out;
}
