// scripts/qa-army.ts
// QA agent army: logs in as a dedicated test student and PRACTICES EVERY LEVEL
// end-to-end through the real HTTP APIs (dashboard → packet → problems →
// check-answer → submit-sheet → grading/advancement), one battalion per subject
// running in parallel. Prints a machine-readable report.
//
//   npx tsx scripts/qa-army.ts [--base http://localhost:3000]
//
// The QA account (qa-army@eduyro.test) is created/reset automatically.

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";
const EMAIL = "qa-army@eduyro.test";
const PASSWORD = "QaArmy!2026-secret";

// ── tiny cookie-jar fetch ─────────────────────────────────────────────────────
function makeClient() {
  const jar = new Map<string, string>();
  const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  const absorb = (res: Response) => {
    const set = (res.headers as any).getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  };
  return async (path: string, init: RequestInit = {}) => {
    // follow same-origin redirects (/students/me/* 307s to /students/{id}/*);
    // cookies are already in the jar and undici re-sends headers same-origin.
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      redirect: "follow",
      headers: { ...(init.headers ?? {}), cookie: cookieHeader() },
    });
    absorb(res);
    return res;
  };
}

async function login(fetchC: ReturnType<typeof makeClient>) {
  const csrfRes = await fetchC("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const body = new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: "true" });
  const res = await fetchC("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (res.status >= 400) throw new Error(`login failed: ${res.status}`);
  const me = await (await fetchC("/api/auth/session")).json();
  if (!me?.user?.id) throw new Error("no session after login");
  return me.user.id as string;
}

// ── report types ──────────────────────────────────────────────────────────────
interface LevelResult {
  level: string; name: string; subject: string;
  skillServed?: string; problems?: number;
  checks: { name: string; ok: boolean; note?: string }[];
}
const results: LevelResult[] = [];
const check = (r: LevelResult, name: string, ok: boolean, note?: string) => r.checks.push({ name, ok, note });

// ── one battalion: run every level of a subject sequentially ─────────────────
async function battalion(subjectSlug: string, studentId: string) {
  const fetchC = makeClient();
  await login(fetchC);

  const levels = await db.level.findMany({
    where: { subject: { slug: subjectSlug as any }, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { subject: true },
  });

  for (const level of levels) {
    const r: LevelResult = { level: level.code, name: level.name, subject: subjectSlug, checks: [] };
    results.push(r);
    try {
      // Activate ONLY this level for the subject (direct DB — test harness).
      const sibling = await db.level.findMany({ where: { subjectId: level.subjectId }, select: { id: true } });
      await db.studentProgress.updateMany({
        where: { studentId, levelId: { in: sibling.map((l) => l.id) }, status: "IN_PROGRESS" },
        data: { status: "NOT_STARTED" },
      });
      await db.studentProgress.upsert({
        where: { studentId_levelId: { studentId, levelId: level.id } },
        update: { status: "IN_PROGRESS", currentSkillIndex: 0, skillUnlockedAt: new Date() },
        create: { studentId, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date() },
      });

      // 1. Dashboard serves a packet for this level
      const dash = await (await fetchC(`/api/students/me/dashboard?subject=${subjectSlug}`)).json();
      const lp = dash?.data?.levelProgress;
      check(r, "dashboard responds", !!dash?.success, dash?.error);
      check(r, "active level matches", lp?.levelCode === level.code, `got ${lp?.levelCode}`);
      const sheets = dash?.data?.todayPacket?.sheets ?? [];
      const open = sheets.find((s: any) => s.status === "IN_PROGRESS") ?? sheets[0];
      check(r, "packet has sheets", sheets.length > 0, `${sheets.length} sheets`);
      if (!open) continue;
      r.skillServed = open.skillName;

      // 2. Load the worksheet's problems (the modal's exact endpoint)
      const ws = await (await fetchC(`/api/worksheet/by-id/${open.worksheetId}`)).json();
      const probs: any[] = ws?.data?.problems ?? [];
      r.problems = probs.length;
      check(r, "problems load", ws?.success && probs.length > 0, `${probs.length} problems`);
      if (!probs.length) continue;
      const empty = probs.filter((p) => !String(p.question ?? "").trim()).length;
      check(r, "no empty questions", empty === 0, empty ? `${empty} empty` : undefined);

      // Answer key from DB (harness-side only — never exposed by the API)
      const row = await db.worksheet.findUnique({ where: { id: open.worksheetId }, select: { answerKey: true } });
      const key = new Map(((row?.answerKey as any[]) ?? []).map((e) => [e.id, String(e.answer)]));
      check(r, "answer key covers problems", probs.every((p) => key.has(p.id)));

      // 3. check-answer: wrong first (coaching path), then correct
      const p0 = probs[0];
      const wrong = await (await fetchC(`/api/students/${studentId}/check-answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId: open.worksheetId, problemId: p0.id, answer: "999999" }),
      })).json();
      check(r, "wrong answer marked wrong", wrong?.success && wrong.data?.isCorrect === false);
      const right = await (await fetchC(`/api/students/${studentId}/check-answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId: open.worksheetId, problemId: p0.id, answer: key.get(p0.id) ?? "" }),
      })).json();
      check(r, "correct answer marked correct", right?.success && right.data?.isCorrect === true, `key="${key.get(p0.id)}"`);

      // 4. Submit the whole sheet with all-correct answers → expect 100%
      const submit = await (await fetchC(`/api/students/${studentId}/submit-sheet`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheetId: open.worksheetId,
          answers: probs.map((p) => ({ problemId: p.id, answer: key.get(p.id) ?? "" })),
          timeSeconds: 300,
          firstTryAccuracyPct: 100,
        }),
      })).json();
      check(r, "submit succeeds", !!submit?.success, submit?.error);
      check(r, "graded 100%", submit?.data?.accuracyPct === 100, `got ${submit?.data?.accuracyPct}%`);
    } catch (e: any) {
      check(r, "no exception", false, e.message);
    }
  }
}

async function main() {
  // ── QA account (idempotent) ──
  const hash = await bcrypt.hash(PASSWORD, 10);
  const user = await db.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash: hash, role: "STUDENT", emailVerified: new Date() },
    create: { email: EMAIL, name: "QA Army", passwordHash: hash, role: "STUDENT", emailVerified: new Date() },
  });
  const student = await db.student.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, grade: "Grade 5" },
  });
  // Reset any prior test history so runs are repeatable.
  await db.completedSheet.deleteMany({ where: { studentId: student.id } });
  await db.dailyPacket.deleteMany({ where: { studentId: student.id } });
  await db.studentProgress.deleteMany({ where: { studentId: student.id } });
  console.log(`QA student ready: ${student.id} (${EMAIL})`);

  // ── the army: one battalion per subject, in parallel ──
  const t = Date.now();
  await Promise.all(["MATH", "READING", "WRITING", "SCIENCE"].map((s) => battalion(s, student.id)));
  console.log(`\nRan ${results.length} levels in ${((Date.now() - t) / 1000).toFixed(0)}s\n`);

  // ── report ──
  let pass = 0, fail = 0;
  for (const r of results.sort((a, b) => a.subject.localeCompare(b.subject) || a.level.localeCompare(b.level, undefined, { numeric: true }))) {
    const bad = r.checks.filter((c) => !c.ok);
    if (bad.length === 0) { pass++; console.log(`✓ ${r.subject} ${r.level} ${r.name} — skill "${r.skillServed}" · ${r.problems} problems · all ${r.checks.length} checks passed`); }
    else { fail++; console.log(`✗ ${r.subject} ${r.level} ${r.name} — FAILED: ${bad.map((c) => `${c.name}${c.note ? ` (${c.note})` : ""}`).join("; ")}`); }
  }
  console.log(`\nTOTAL: ${pass} levels passed, ${fail} failed of ${results.length}`);
  await db.$disconnect();
}

main().catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
