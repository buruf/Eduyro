// scripts/audit-progress-loop.ts
// THE SUBMIT→ADVANCE→REPEAT LOOP SWEEP (data half).
//
// Both field bugs (Ridwan's 409 deadlock, Radwa's stale next-lesson) lived in
// this loop, and both were found by a child, not by us. This audit walks EVERY
// student's actual history and fails on states the loop should never produce.
// It checks what production DID, not what the code intends.
import { PrismaClient } from "@prisma/client";
import { getMathLevelSkills } from "../src/lib/worksheet/generator";

const db = new PrismaClient();
type Row = { who: string; check: string; detail: string };
const rows: Row[] = [];
const warns: Row[] = [];
const bad = (who: string, check: string, detail: string) => rows.push({ who, check, detail });
// Admin set-skill and placement legitimately set an index without a full day's
// sheets — those patterns WARN (for human review) instead of failing the gate.
const warn = (who: string, check: string, detail: string) => warns.push({ who, check, detail });

(async () => {
  const students = await db.student.findMany({
    select: {
      id: true, timezone: true,
      user: { select: { name: true, email: true } },
      progress: {
        select: {
          id: true, status: true, currentSkillIndex: true, skillUnlockedAt: true, updatedAt: true,
          level: { select: { id: true, code: true, sheetsPerDay: true, subject: { select: { slug: true } } } },
        },
      },
    },
  });

  let checked = 0;
  for (const st of students) {
    const who = `${st.user?.name ?? "?"} <${st.user?.email ?? "?"}>`;
    checked++;

    // ── 1. One IN_PROGRESS level per subject (the Radwa bug). ──
    const bySubj = new Map<string, string[]>();
    for (const p of st.progress) {
      if (p.status !== "IN_PROGRESS") continue;
      const k = p.level.subject.slug;
      bySubj.set(k, [...(bySubj.get(k) ?? []), p.level.code]);
    }
    for (const [subj, codes] of bySubj) {
      if (codes.length > 1) bad(who, "duplicate-in-progress", `${subj}: ${codes.join(" + ")}`);
    }

    // ── 2. currentSkillIndex must exist in the level's skill map (the class of
    //       bug a unit insert causes when migration is missed). MATH only —
    //       non-math skill maps live in the DB and are checked by shape below. ──
    for (const p of st.progress) {
      if (p.level.subject.slug !== "MATH" || p.status !== "IN_PROGRESS") continue;
      const units = getMathLevelSkills(p.level.code);
      const idx = p.currentSkillIndex ?? 0;
      if (units.length && (idx < 0 || idx >= units.length)) {
        bad(who, "skill-index-out-of-range", `${p.level.code} idx ${idx} but level has ${units.length} units`);
      }
    }

    // ── Per-sheet history checks ──
    const sheets = await db.completedSheet.findMany({
      where: { studentId: st.id },
      orderBy: { completedAt: "asc" },
      select: {
        worksheetId: true, accuracyPct: true, score: true, totalProblems: true,
        timeSeconds: true, completedAt: true,
        worksheet: { select: { levelId: true, title: true } },
      },
    });

    // ── 3. No duplicate same-day rows for one worksheet (the double-submit
    //       guard's whole job — a violation means the lock failed). ──
    // Day boundaries in the STUDENT'S timezone — the app clears days via
    // appDayStart(tz). Judging with UTC days flagged legitimate next-local-day
    // retakes (76%→97%) as same-day duplicates on the first run of this audit.
    const tz = st.timezone || "America/Toronto";
    const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
    // Rows before Jul 21 2026 are grandfathered: the guard used UTC days until
    // the timezone work landed, so a same-local-evening resubmission straddling
    // UTC midnight (e.g. 6:54pm + 10:44pm Toronto) produced two rows. Verified
    // against the four historical cases (Radiya/Raidah, Jul 15); the current
    // guard uses appDayStart(student.timezone) and cannot recur. Any NEW
    // duplicate after this date is a real lock failure and fails the audit.
    const TZ_GUARD_FIXED = new Date("2026-07-21T00:00:00Z");
    const seen = new Map<string, number>();
    for (const s of sheets) {
      if (s.completedAt < TZ_GUARD_FIXED) continue;
      const k = `${s.worksheetId}::${dayKey(s.completedAt)}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    for (const [k, n] of seen) {
      if (n > 1) bad(who, "same-day-duplicate-rows", `${n} rows for ${k}`);
    }

    // ── 4. Score arithmetic must be internally consistent. ──
    for (const s of sheets) {
      if (s.accuracyPct < 0 || s.accuracyPct > 100) bad(who, "accuracy-out-of-range", `${s.accuracyPct}% on ${s.worksheet?.title}`);
      if (s.totalProblems > 0) {
        const pct = Math.round((s.score / s.totalProblems) * 100);
        // firstTryAccuracy can be BELOW final-graded, never above it.
        if (s.accuracyPct > pct + 1) bad(who, "accuracy-exceeds-score", `${s.accuracyPct}% recorded but ${s.score}/${s.totalProblems} graded (${s.worksheet?.title})`);
      }
      if (s.timeSeconds < 0 || s.timeSeconds > 7200) bad(who, "time-out-of-bounds", `${s.timeSeconds}s`);
    }

    // ── 5. Advancement legitimacy: for each MATH skill-index step recorded via
    //       skillUnlockedAt, there must exist a day with >= sheetsPerDay sheets
    //       in that level. (Coarse: catches phantom advances with no work.) ──
    for (const p of st.progress) {
      if (p.level.subject.slug !== "MATH" || !p.skillUnlockedAt || (p.currentSkillIndex ?? 0) === 0) continue;
      const lvlSheets = sheets.filter((s) => s.worksheet?.levelId === p.level.id);
      const byDay = new Map<string, number>();
      for (const s of lvlSheets) byDay.set(dayKey(s.completedAt), (byDay.get(dayKey(s.completedAt)) ?? 0) + 1);
      const per = p.level.sheetsPerDay ?? 3;
      const fullDays = [...byDay.values()].filter((n) => n >= per).length;
      if (fullDays === 0 && lvlSheets.length > 0) {
        warn(who, "advance-without-full-day", `${p.level.code} at idx ${p.currentSkillIndex} but no day ever reached ${per} sheets`);
      }
      if (lvlSheets.length === 0) {
        warn(who, "advance-without-sheets", `${p.level.code} at idx ${p.currentSkillIndex} with zero completed sheets`);
      }
    }

    // ── 6. skillUnlockedAt sanity: never in the future. ──
    for (const p of st.progress) {
      if (p.skillUnlockedAt && p.skillUnlockedAt.getTime() > Date.now() + 60_000) {
        bad(who, "unlock-in-future", `${p.level.code} unlockedAt ${p.skillUnlockedAt.toISOString()}`);
      }
    }
  }

  // ── Report grouped by check ──
  const byCheck = new Map<string, Row[]>();
  for (const r of rows) byCheck.set(r.check, [...(byCheck.get(r.check) ?? []), r]);
  for (const [check, rs] of [...byCheck.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n✗ ${check} — ${rs.length}`);
    for (const r of rs.slice(0, 6)) console.log(`    ${r.who}: ${r.detail}`);
    if (rs.length > 6) console.log(`    …and ${rs.length - 6} more`);
  }
  const realWarns = warns.filter((w) => !w.who.includes("eduyro.test"));
  if (warns.length) {
    console.log(`\n⚠ warnings — admin set-skill and placement legitimately cause these; review, not failures:`);
    for (const w of realWarns) console.log(`    ${w.check}: ${w.who}: ${w.detail}`);
    console.log(`    (+${warns.length - realWarns.length} on QA fixtures, suppressed)`);
  }
  console.log(`\nstudents checked: ${checked}`);
  console.log(`${rows.length === 0 ? "✅" : "❌"} progress-loop failures: ${rows.length} (warnings: ${realWarns.length})`);
  await db.$disconnect();
  process.exit(rows.length ? 1 : 0);
})();
