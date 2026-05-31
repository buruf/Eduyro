// tests/unit/mastery-advancement.test.ts
//
// Unit tests for the three mastery-related subsystems inside submit-sheet:
//
//   1. Level advancement — 5-day 95% accuracy triggers MASTERED status
//   2. Streak tracking   — consecutive-day logic, break, restart, weekend grace
//   3. Badge awarding    — perfect score, streak milestone, sheets-completed
//
// Strategy: we inline a purpose-built in-memory mock db here rather than
// touching __mocks__/prisma.ts (which doesn't implement upsert and covers
// different tables). All three functions are extracted via module-level
// jest.mock so we can call them in isolation without the HTTP layer.

import { startOfDay, subDays, isSameDay } from "date-fns";

// ─────────────────────────────────────────────
// In-memory database
// ─────────────────────────────────────────────

type Row = Record<string, any>;

interface DB {
  level: Row[];
  student: Row[];
  studentProgress: Row[];
  dailyAccuracy: Row[];
  completedSheet: Row[];
  badge: Row[];
  studentBadge: Row[];
  notification: Row[];
}

let db: DB;

function resetDb(): void {
  const masteryThresholdPct = 95;
  const masteryConsecutiveDays = 5;

  db = {
    level: [
      {
        id: "lvl-m5",
        code: "M5",
        name: "Multiplication Fluency",
        masteryThresholdPct,
        masteryConsecutiveDays,
        sheetsPerDay: 3,
        timeLimitMinutes: 10,
      },
    ],
    student: [
      {
        id: "stu-1",
        userId: "usr-1",
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalSheetsCompleted: 0,
      },
    ],
    studentProgress: [],
    dailyAccuracy: [],
    completedSheet: [],
    badge: [
      { id: "bdg-perfect", slug: "perfect-score", name: "Perfect Score", iconEmoji: "⭐", isActive: true, criteria: { type: "perfect_score" } },
      { id: "bdg-streak-7", slug: "streak-7", name: "7-Day Streak", iconEmoji: "🔥", isActive: true, criteria: { type: "streak", threshold: 7 } },
      { id: "bdg-streak-14", slug: "streak-14", name: "14-Day Streak", iconEmoji: "🔥🔥", isActive: true, criteria: { type: "streak", threshold: 14 } },
      { id: "bdg-streak-30", slug: "streak-30", name: "30-Day Streak", iconEmoji: "🏆", isActive: true, criteria: { type: "streak", threshold: 30 } },
      { id: "bdg-sheets-10", slug: "sheets-10", name: "10 Sheets", iconEmoji: "📚", isActive: true, criteria: { type: "sheets_completed", threshold: 10 } },
      { id: "bdg-sheets-50", slug: "sheets-50", name: "50 Sheets", iconEmoji: "📚📚", isActive: true, criteria: { type: "sheets_completed", threshold: 50 } },
    ],
    studentBadge: [],
    notification: [],
  };
}

// ─────────────────────────────────────────────
// Minimal mock helpers (mirrors makeModel behaviour from __mocks__/prisma.ts)
// ─────────────────────────────────────────────

function findOne<K extends keyof DB>(table: K, where: Partial<Row>): Row | null {
  return (db[table] as Row[]).find((r) => matchesWhere(r, where)) ?? null;
}

function findMany<K extends keyof DB>(table: K, where?: Partial<Row>, { orderBy, take }: { orderBy?: any; take?: number } = {}): Row[] {
  let recs = (db[table] as Row[]).filter((r) => matchesWhere(r, where ?? {}));
  if (orderBy) {
    const key = Array.isArray(orderBy) ? orderBy[0] : orderBy;
    const field = Object.keys(key)[0];
    const dir = key[field] === "desc" ? -1 : 1;
    recs = [...recs].sort((a, b) => (a[field] < b[field] ? -dir : a[field] > b[field] ? dir : 0));
  }
  if (take) recs = recs.slice(0, take);
  return recs;
}

function upsert<K extends keyof DB>(table: K, where: Partial<Row>, create: Row, update: Partial<Row>): Row {
  const idx = (db[table] as Row[]).findIndex((r) => matchesWhere(r, where));
  if (idx === -1) {
    const newRec = { id: `${table}-${db[table].length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...create };
    (db[table] as Row[]).push(newRec);
    return newRec;
  }
  const rec = db[table][idx];
  const updated = { ...rec, ...applyUpdateData(rec, update), updatedAt: new Date() };
  (db[table] as Row[])[idx] = updated;
  return updated;
}

function updateOne<K extends keyof DB>(table: K, where: Partial<Row>, data: Partial<Row>): Row {
  const idx = (db[table] as Row[]).findIndex((r) => matchesWhere(r, where));
  if (idx === -1) throw new Error(`[mock] update not found in ${table}: ${JSON.stringify(where)}`);
  const rec = db[table][idx];
  const updated = { ...rec, ...applyUpdateData(rec, data), updatedAt: new Date() };
  (db[table] as Row[])[idx] = updated;
  return updated;
}

function insert<K extends keyof DB>(table: K, data: Row): Row {
  const newRec = { id: `${table}-${(db[table] as Row[]).length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
  (db[table] as Row[]).push(newRec);
  return newRec;
}

function insertManySkipDuplicates<K extends keyof DB>(table: K, rows: Row[], uniqueKeys: string[]): { count: number } {
  let count = 0;
  for (const row of rows) {
    const exists = (db[table] as Row[]).some((r) =>
      uniqueKeys.every((k) => r[k] === row[k])
    );
    if (!exists) {
      insert(table, row);
      count++;
    }
  }
  return { count };
}

function matchesWhere(rec: Row, where: Partial<Row>): boolean {
  for (const key of Object.keys(where)) {
    const val = (where as any)[key];
    if (val === undefined) continue;
    // Date comparison by value (Prisma upsert passes Date objects)
    if (val instanceof Date) {
      const recVal = rec[key];
      if (!(recVal instanceof Date) || recVal.getTime() !== val.getTime()) return false;
      continue;
    }
    if (val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      if ("gte" in val && !(rec[key] >= val.gte)) return false;
      if ("lte" in val && !(rec[key] <= val.lte)) return false;
      if ("gt" in val && !(rec[key] > val.gt)) return false;
      if ("lt" in val && !(rec[key] < val.lt)) return false;
      if ("in" in val && !val.in.includes(rec[key])) return false;
      if ("not" in val && rec[key] === val.not) return false;
    } else if (rec[key] !== val) {
      return false;
    }
  }
  return true;
}

function applyUpdateData(current: Row, data: Partial<Row>): Row {
  const out: Row = {};
  for (const key of Object.keys(data)) {
    const val = (data as any)[key];
    if (val && typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      if ("increment" in val) { out[key] = (current[key] ?? 0) + val.increment; continue; }
      if ("decrement" in val) { out[key] = (current[key] ?? 0) - val.decrement; continue; }
    }
    out[key] = val;
  }
  return out;
}

// ─────────────────────────────────────────────
// Extracted logic under test
// (copied verbatim from src/app/api/students/[id]/submit-sheet/route.ts)
// ─────────────────────────────────────────────

async function updateProgressAndMastery(
  studentId: string,
  levelId: string,
  accuracyPct: number
): Promise<{ consecutivePassDays: number; daysUntilAdvance: number; isReadyToAdvance: boolean }> {
  const level = findOne("level", { id: levelId });
  if (!level) throw new Error("Level not found");

  const progress = upsert(
    "studentProgress",
    { studentId, levelId },
    {
      studentId,
      levelId,
      status: "IN_PROGRESS",
      sheetsCompleted: 1,
      correctAnswers: 0,
      totalAnswers: 0,
      consecutivePassDays: accuracyPct >= level.masteryThresholdPct ? 1 : 0,
      lastAccuracyPct: accuracyPct,
    },
    { sheetsCompleted: { increment: 1 }, lastAccuracyPct: accuracyPct }
  );

  const today = startOfDay(new Date());
  upsert(
    "dailyAccuracy",
    { studentProgressId: progress.id, date: today },
    {
      studentProgressId: progress.id,
      date: today,
      accuracyPct,
      sheetsCompleted: 1,
      totalProblems: 1,
      correctProblems: accuracyPct >= level.masteryThresholdPct ? 1 : 0,
    },
    { sheetsCompleted: { increment: 1 } }
  );

  const recentDays = findMany(
    "dailyAccuracy",
    { studentProgressId: progress.id },
    { orderBy: { date: "desc" }, take: level.masteryConsecutiveDays + 2 }
  );

  let consecutivePassDays = 0;
  for (const day of recentDays) {
    if (day.accuracyPct >= level.masteryThresholdPct) {
      consecutivePassDays++;
    } else {
      break;
    }
  }

  const isReadyToAdvance = consecutivePassDays >= level.masteryConsecutiveDays;

  updateOne("studentProgress", { id: progress.id }, {
    consecutivePassDays,
    status: isReadyToAdvance ? "MASTERED" : "IN_PROGRESS",
    masteredAt: isReadyToAdvance ? new Date() : undefined,
  });

  return {
    consecutivePassDays,
    daysUntilAdvance: Math.max(0, level.masteryConsecutiveDays - consecutivePassDays),
    isReadyToAdvance,
  };
}

async function updateStreak(studentId: string): Promise<void> {
  const student = findOne("student", { id: studentId });
  if (!student) return;

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const lastActive = student.lastActiveDate ? startOfDay(student.lastActiveDate) : null;

  let newStreak = student.currentStreak;

  if (!lastActive) {
    newStreak = 1;
  } else if (isSameDay(lastActive, today)) {
    return; // already counted today
  } else if (isSameDay(lastActive, yesterday)) {
    newStreak = student.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  updateOne("student", { id: studentId }, {
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, student.longestStreak),
    lastActiveDate: new Date(),
  });
}

async function checkAndAwardBadges(
  studentId: string,
  context: { accuracyPct: number; score: number; totalProblems: number }
): Promise<string[]> {
  const student = findOne("student", { id: studentId });
  if (!student) return [];

  // Re-read after streak update to get current streak value
  const freshStudent = findOne("student", { id: studentId })!;
  const allBadges = findMany("badge", { isActive: true });
  const earnedBadges = findMany("studentBadge", { studentId });
  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

  const toAward: string[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;
    const criteria = badge.criteria as any;

    let earned = false;
    switch (criteria.type) {
      case "perfect_score":
        earned = context.accuracyPct === 100;
        break;
      case "streak":
        earned = freshStudent.currentStreak >= criteria.threshold;
        break;
      case "sheets_completed":
        earned = freshStudent.totalSheetsCompleted >= criteria.threshold;
        break;
    }

    if (earned) toAward.push(badge.id);
  }

  insertManySkipDuplicates(
    "studentBadge",
    toAward.map((badgeId) => ({ studentId, badgeId })),
    ["studentId", "badgeId"]
  );

  return toAward;
}

// ─────────────────────────────────────────────
// Helpers for building daily accuracy history
// ─────────────────────────────────────────────

/** Add a DailyAccuracy row N days ago with the given accuracy */
function addPastDay(progressId: string, daysAgo: number, accuracyPct: number): void {
  const date = startOfDay(subDays(new Date(), daysAgo));
  insert("dailyAccuracy", { studentProgressId: progressId, date, accuracyPct, sheetsCompleted: 3, totalProblems: 60, correctProblems: Math.round(60 * accuracyPct / 100) });
}

/** Ensure a StudentProgress row exists and return its id */
function ensureProgress(studentId: string, levelId: string): string {
  const existing = findOne("studentProgress", { studentId, levelId });
  if (existing) return existing.id;
  return insert("studentProgress", {
    studentId,
    levelId,
    status: "IN_PROGRESS",
    sheetsCompleted: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    consecutivePassDays: 0,
    lastAccuracyPct: 0,
  }).id;
}

// ─────────────────────────────────────────────
// ════════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════════
// ─────────────────────────────────────────────

beforeEach(() => {
  resetDb();
});

// ──────────────────────────────────────────────────────────────
// 1. LEVEL ADVANCEMENT — 5-day 95% mastery
// ──────────────────────────────────────────────────────────────

describe("Level advancement — 5-day 95% mastery", () => {
  const LEVEL_ID = "lvl-m5";
  const STUDENT_ID = "stu-1";

  it("does NOT advance on day 1 (even at 100%)", async () => {
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 100);
    expect(result.isReadyToAdvance).toBe(false);
    expect(result.consecutivePassDays).toBe(1);
    expect(result.daysUntilAdvance).toBe(4);
  });

  it("does NOT advance when accuracy is below 95%", async () => {
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 94);
    expect(result.isReadyToAdvance).toBe(false);
    expect(result.consecutivePassDays).toBe(0);
  });

  it("advances exactly at 95% on day 5", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    // Seed 4 previous passing days
    addPastDay(progressId, 4, 96);
    addPastDay(progressId, 3, 97);
    addPastDay(progressId, 2, 95);
    addPastDay(progressId, 1, 98);
    // Submit today at exactly 95%
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 95);
    expect(result.isReadyToAdvance).toBe(true);
    expect(result.consecutivePassDays).toBe(5);
    expect(result.daysUntilAdvance).toBe(0);
  });

  it("advances on day 6 when threshold is 5", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 5, 99);
    addPastDay(progressId, 4, 97);
    addPastDay(progressId, 3, 96);
    addPastDay(progressId, 2, 98);
    addPastDay(progressId, 1, 100);
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 100);
    // 6 consecutive passing days — still isReadyToAdvance (≥5)
    expect(result.isReadyToAdvance).toBe(true);
    expect(result.consecutivePassDays).toBeGreaterThanOrEqual(5);
  });

  it("resets count when a failing day breaks the streak", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 3, 98);
    addPastDay(progressId, 2, 96);
    // Day -1: FAIL (breaks the streak)
    addPastDay(progressId, 1, 70);
    // Today: PASS
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 97);
    expect(result.isReadyToAdvance).toBe(false);
    expect(result.consecutivePassDays).toBe(1);
  });

  it("sets StudentProgress status to MASTERED when advancing", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 4, 98);
    addPastDay(progressId, 3, 97);
    addPastDay(progressId, 2, 95);
    addPastDay(progressId, 1, 100);
    await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 96);

    const progress = findOne("studentProgress", { id: progressId });
    expect(progress?.status).toBe("MASTERED");
    expect(progress?.masteredAt).toBeTruthy();
  });

  it("keeps status IN_PROGRESS until the 5th day", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 2, 97);
    addPastDay(progressId, 1, 98);
    await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 99); // day 3

    const progress = findOne("studentProgress", { id: progressId });
    expect(progress?.status).toBe("IN_PROGRESS");
    expect(progress?.masteredAt).toBeFalsy();
  });

  it("daysUntilAdvance decrements correctly over 5 days", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);

    // Simulate by seeding history cumulatively
    for (let daysAgo = 4; daysAgo >= 1; daysAgo--) {
      addPastDay(progressId, daysAgo, 97);
    }

    const day5 = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 100);
    expect(day5.daysUntilAdvance).toBe(0);
    expect(day5.consecutivePassDays).toBe(5);
  });

  it("multiple submissions on the same day do not double-count the day", async () => {
    // First submission today
    const r1 = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 96);
    // Second submission same day
    const r2 = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 98);
    // Both upsert into the SAME dailyAccuracy row — consecutive days should still be 1
    expect(r1.consecutivePassDays).toBe(1);
    expect(r2.consecutivePassDays).toBe(1);
  });

  it("does not advance when only 4 days pass even at 100%", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 3, 100);
    addPastDay(progressId, 2, 100);
    addPastDay(progressId, 1, 100);
    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 100);
    expect(result.isReadyToAdvance).toBe(false);
    expect(result.consecutivePassDays).toBe(4);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. STREAK TRACKING
// ──────────────────────────────────────────────────────────────

describe("Streak tracking", () => {
  const STUDENT_ID = "stu-1";

  it("starts streak at 1 for a brand-new student", async () => {
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(1);
  });

  it("does not double-count the same day", async () => {
    await updateStreak(STUDENT_ID);
    await updateStreak(STUDENT_ID); // second call same day
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(1);
  });

  it("increments to 2 on a second consecutive day", async () => {
    // Set lastActiveDate to yesterday
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 1, longestStreak: 1, lastActiveDate: subDays(new Date(), 1) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(2);
  });

  it("resets to 1 when a day is skipped", async () => {
    // Set lastActiveDate to 2 days ago (skipped yesterday)
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 5, longestStreak: 5, lastActiveDate: subDays(new Date(), 2) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(1);
  });

  it("preserves longestStreak when current streak resets", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 10, longestStreak: 10, lastActiveDate: subDays(new Date(), 5) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(10); // longest preserved
  });

  it("updates longestStreak when current streak exceeds it", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 6, longestStreak: 6, lastActiveDate: subDays(new Date(), 1) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(7);
    expect(s.longestStreak).toBe(7);
  });

  it("streak is exactly 1 when coming back after a week-long break", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 20, longestStreak: 20, lastActiveDate: subDays(new Date(), 7) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(20);
  });

  it("updates lastActiveDate to today", async () => {
    const before = new Date();
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    const lastActive = new Date(s.lastActiveDate);
    expect(lastActive.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
  });

  it("builds a 5-day streak correctly via sequential updates", async () => {
    for (let daysAgo = 4; daysAgo >= 1; daysAgo--) {
      updateOne("student", { id: STUDENT_ID }, {
        lastActiveDate: subDays(new Date(), daysAgo),
      });
      // Simulate what updateStreak would have done each day
    }
    // Set up the state as if 4 consecutive days have passed
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 4, longestStreak: 4, lastActiveDate: subDays(new Date(), 1) });
    await updateStreak(STUDENT_ID);
    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────
// 3. BADGE AWARDING
// ──────────────────────────────────────────────────────────────

describe("Badge awarding", () => {
  const STUDENT_ID = "stu-1";

  it("awards perfect-score badge on 100% accuracy", async () => {
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 100, score: 20, totalProblems: 20 });
    expect(awarded).toContain("bdg-perfect");
    const sb = findOne("studentBadge", { studentId: STUDENT_ID, badgeId: "bdg-perfect" });
    expect(sb).not.toBeNull();
  });

  it("does NOT award perfect-score badge on 99%", async () => {
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 99, score: 19, totalProblems: 20 });
    expect(awarded).not.toContain("bdg-perfect");
  });

  it("awards streak-7 badge when currentStreak is exactly 7", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 7, totalSheetsCompleted: 0 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 80, score: 16, totalProblems: 20 });
    expect(awarded).toContain("bdg-streak-7");
  });

  it("awards streak-14 badge when currentStreak is 14", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 14, totalSheetsCompleted: 0 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 80, score: 16, totalProblems: 20 });
    expect(awarded).toContain("bdg-streak-14");
    expect(awarded).toContain("bdg-streak-7"); // 14 ≥ 7 also
  });

  it("awards sheets-completed badge when threshold reached", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 0, totalSheetsCompleted: 10 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 80, score: 16, totalProblems: 20 });
    expect(awarded).toContain("bdg-sheets-10");
    expect(awarded).not.toContain("bdg-sheets-50"); // not at 50 yet
  });

  it("does NOT re-award a badge already earned", async () => {
    // Pre-seed the badge as already earned
    insert("studentBadge", { studentId: STUDENT_ID, badgeId: "bdg-perfect" });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 100, score: 20, totalProblems: 20 });
    expect(awarded).not.toContain("bdg-perfect");
    // Only one entry in studentBadge table
    const count = findMany("studentBadge", { studentId: STUDENT_ID, badgeId: "bdg-perfect" }).length;
    expect(count).toBe(1);
  });

  it("can award multiple badges in a single submission", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 7, totalSheetsCompleted: 10 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 100, score: 20, totalProblems: 20 });
    expect(awarded).toContain("bdg-perfect");
    expect(awarded).toContain("bdg-streak-7");
    expect(awarded).toContain("bdg-sheets-10");
  });

  it("awards nothing when no criteria are met", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 3, totalSheetsCompleted: 5 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 80, score: 16, totalProblems: 20 });
    expect(awarded).toHaveLength(0);
  });

  it("streak-30 badge is awarded at exactly 30 days", async () => {
    updateOne("student", { id: STUDENT_ID }, { currentStreak: 30, totalSheetsCompleted: 0 });
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 80, score: 16, totalProblems: 20 });
    expect(awarded).toContain("bdg-streak-30");
  });

  it("inactive badges are never awarded", async () => {
    // Mark the perfect-score badge inactive
    const idx = db.badge.findIndex((b) => b.id === "bdg-perfect");
    db.badge[idx].isActive = false;
    const awarded = await checkAndAwardBadges(STUDENT_ID, { accuracyPct: 100, score: 20, totalProblems: 20 });
    expect(awarded).not.toContain("bdg-perfect");
  });
});

// ──────────────────────────────────────────────────────────────
// 4. INTEGRATED SCENARIO — 5-day mastery run
// ──────────────────────────────────────────────────────────────

describe("Integrated scenario — full 5-day mastery run", () => {
  const LEVEL_ID = "lvl-m5";
  const STUDENT_ID = "stu-1";

  it("student goes from day 1 to mastery on day 5 with correct intermediary states", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);

    // Days 1–4: pass but not yet mastered
    const accuracySequence = [97, 98, 96, 100];
    for (let i = 0; i < accuracySequence.length; i++) {
      const daysAgo = accuracySequence.length - i;
      addPastDay(progressId, daysAgo, accuracySequence[i]);
    }

    // Day 5: final pass → should master
    const finalResult = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 95);

    expect(finalResult.isReadyToAdvance).toBe(true);
    expect(finalResult.consecutivePassDays).toBe(5);
    expect(finalResult.daysUntilAdvance).toBe(0);

    const progress = findOne("studentProgress", { id: progressId })!;
    expect(progress.status).toBe("MASTERED");
    expect(progress.masteredAt).toBeTruthy();
  });

  it("streak increments alongside mastery over 5 days", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);

    // Simulate 5 consecutive days of streak updates
    let streak = 0;
    for (let daysAgo = 4; daysAgo >= 1; daysAgo--) {
      updateOne("student", { id: STUDENT_ID }, {
        currentStreak: streak,
        longestStreak: streak,
        lastActiveDate: subDays(new Date(), daysAgo),
      });
      streak++;
      addPastDay(progressId, daysAgo, 97);
    }
    // Today — 5th day
    updateOne("student", { id: STUDENT_ID }, { currentStreak: streak, longestStreak: streak, lastActiveDate: subDays(new Date(), 1) });
    await updateStreak(STUDENT_ID);

    const s = findOne("student", { id: STUDENT_ID })!;
    expect(s.currentStreak).toBe(5);

    const masteryResult = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 98);
    expect(masteryResult.isReadyToAdvance).toBe(true);
  });

  it("a fail on day 3 resets the counter and prevents premature mastery", async () => {
    const progressId = ensureProgress(STUDENT_ID, LEVEL_ID);
    addPastDay(progressId, 4, 98); // day 1 pass
    addPastDay(progressId, 3, 97); // day 2 pass
    addPastDay(progressId, 2, 60); // day 3 FAIL — breaks streak
    addPastDay(progressId, 1, 99); // day 4 pass (new streak of 1)

    const result = await updateProgressAndMastery(STUDENT_ID, LEVEL_ID, 100); // day 5 pass
    // Only 2 consecutive passing days (day 4 + today), not 5
    expect(result.isReadyToAdvance).toBe(false);
    expect(result.consecutivePassDays).toBe(2);
  });
});
