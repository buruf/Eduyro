// src/app/(dashboard)/student/page.tsx
// FIXES IN THIS REVISION:
//   #S1  Demo data no longer leaks to authenticated users with empty data.
//        Demo only shown on explicit ?demo=1 query param. Empty real
//        accounts get an honest "take placement test" empty state.
//   #S2  Start Practice now fetches REAL problems from /api/worksheet/preview
//        for the IN_PROGRESS sheet (not hardcoded ×9 multiplication).
//   #S3  Finish Sheet now POSTs to /api/students/{id}/submit-sheet,
//        records the attempt, updates streaks/mastery/badges, and
//        refreshes the dashboard so the student sees the new state.
//   #S6  "NOT_STARTED" status now says "Up next" not "Locked" (less misleading).
//   #S7  Timer persisted to localStorage so a refresh doesn't lose progress.
//   #S8  Timer auto-stops when sheet is submitted.
//   #S9  Modal title now reflects the actual sheet being practiced.
//   #S14 Cleaned up encoding garbage in emoji.

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar, DashboardTopbar } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, StatCard, Progress, Modal, EmptyState } from "@/components/ui";
import { StudentRealtime } from "@/components/realtime/StudentRealtime";
import { TutorialModal } from "@/components/TutorialModal";
import { cn, formatTime } from "@/lib/utils";
import { getTutorial, type TutorialContent } from "@/lib/worksheet/tutorials";
import type { StudentDashboard, TodaySheet } from "@/types";

const TIMER_STORAGE_KEY = "bs:practice-timer";

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showDemo = searchParams.get("demo") === "1";

  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceSheet, setPracticeSheet] = useState<TodaySheet | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialSheet, setTutorialSheet] = useState<TodaySheet | null>(null);
  const [tutorialContent, setTutorialContent] = useState<TutorialContent | null>(null);

  // Timer state — persisted across refreshes
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Restore timer from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const { elapsed, running, savedAt } = JSON.parse(saved);
        // If timer was running, add elapsed time since it was saved
        const delta = running ? Math.floor((Date.now() - savedAt) / 1000) : 0;
        setTimerElapsed(elapsed + delta);
        setTimerRunning(running);
      }
    } catch {
      // Corrupted state — ignore
    }
  }, []);

  // Persist timer to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({ elapsed: timerElapsed, running: timerRunning, savedAt: Date.now() })
      );
    } catch {
      // Storage full or blocked — non-critical
    }
  }, [timerElapsed, timerRunning]);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    fetchDashboard();

    const handler = () => fetchDashboard();
    window.addEventListener("bs:notification", handler);
    window.addEventListener("bs:sheet_completed", handler);
    return () => {
      window.removeEventListener("bs:notification", handler);
      window.removeEventListener("bs:sheet_completed", handler);
    };
  }, [session]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setTimerElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/students/me/dashboard").catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data.success) setDashboard(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  // #S1 FIX: Only show demo on explicit request. Loading shows a loader.
  // Authenticated users with no data get a proper empty state.
  if (loading && !showDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-dark">
        <div className="text-muted text-sm">Loading your dashboard…</div>
      </div>
    );
  }

  // No dashboard data and not explicitly in demo mode → honest empty state
  if (!dashboard && !showDemo) {
    return <EmptyStudentDashboard isSignedIn={!!session?.user?.id} />;
  }

  const data = dashboard ?? demoDashboard();
  const firstName = data.student.user.firstName ?? data.student.user.name?.split(" ")[0] ?? "there";

  // Find the next sheet to practice (first IN_PROGRESS sheet)
  const currentSheet = data.todayPacket.sheets.find((s) => s.status === "IN_PROGRESS") ?? null;

  function openPractice(sheet: TodaySheet) {
    if (sheet.status !== "IN_PROGRESS") return;
    // Check if tutorial has been seen for this skill
    const tutorialKey = `eduyro:tutorial:${sheet.skillName.toLowerCase().replace(/\s+/g, '-')}`;
    const seen = typeof window !== 'undefined' && localStorage.getItem(tutorialKey) === '1';
    if (!seen) {
      const subjectSlug = data?.levelProgress?.subjectName?.toUpperCase() as string ?? "MATH";
      const content = getTutorial(subjectSlug, sheet.skillName);
      setTutorialContent(content);
      setTutorialSheet(sheet);
      setTutorialOpen(true);
    } else {
      setPracticeSheet(sheet);
      setPracticeOpen(true);
      if (!timerRunning) setTimerRunning(true);
    }
  }

  function onTutorialComplete(sheet: TodaySheet) {
    const tutorialKey = `eduyro:tutorial:${sheet.skillName.toLowerCase().replace(/\s+/g, '-')}`;
    if (typeof window !== 'undefined') localStorage.setItem(tutorialKey, '1');
    setTutorialOpen(false);
    setTutorialSheet(null);
    setTutorialContent(null);
    setPracticeSheet(sheet);
    setPracticeOpen(true);
    if (!timerRunning) setTimerRunning(true);
  }

  function closePractice() {
    setPracticeOpen(false);
    setPracticeSheet(null);
  }

  // Called when a sheet is successfully submitted
  async function onSheetSubmitted() {
    setTimerRunning(false);
    setTimerElapsed(0);
    closePractice();
    // Refetch dashboard to show updated streak/mastery/etc.
    await fetchDashboard();
  }

  return (
    <div className="grid grid-cols-[224px_1fr] min-h-screen">
      <StudentRealtime studentId={data.student.id} />
      <DashboardSidebar
        user={{
          name: data.student.user.name ?? "Student",
          subtitle: data.levelProgress
            ? `Level ${data.levelProgress.levelCode} · ${data.levelProgress.subjectName}`
            : "Not placed yet",
        }}
        items={[
          // Only "Dashboard" is real. Other links removed until those pages exist.
          { href: "/student", label: "Dashboard", icon: "📊", active: true },
        ]}
        footerContent={
          <div className="bg-gold/10 border border-gold/25 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-gold-mid">🔥 {data.streakDays}</div>
            <div className="text-[10px] text-cream/40 uppercase tracking-wider mt-0.5">Day streak</div>
          </div>
        }
      />

      <main className="flex flex-col overflow-hidden">
        <DashboardTopbar
          title={`Good ${getGreeting()}, ${firstName} 👋`}
          subtitle={new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showDemo && (
            <div className="bg-gold-light border border-gold/40 text-gold-dark rounded-md p-3 text-xs">
              <strong>Demo view.</strong> You're seeing sample data so you can preview the dashboard.
              Sign in and take the placement test to see your real progress.
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Day streak" value={data.streakDays} sub={`Best: ${data.longestStreak} days`} color="gold" />
            <StatCard
              label="Accuracy today"
              value={data.todayAccuracyPct != null ? `${Math.round(data.todayAccuracyPct)}%` : "—"}
              sub="Target: 95% to advance"
              color="green"
            />
            <StatCard
              label="Level progress"
              value={data.levelProgress ? `${data.levelProgress.progressPct}%` : "—"}
              sub={data.levelProgress ? `${data.levelProgress.sheetsCompleted} sheets done` : ""}
              color="blue"
            />
            <StatCard
              label="Days to advance"
              value={data.levelProgress?.daysUntilAdvance ?? "—"}
              sub="At 95% accuracy"
              color="red"
            />
          </div>

          {/* Today's packet + skill tree */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-sans text-sm font-semibold">
                    Today's packet {data.levelProgress && `— Level ${data.levelProgress.levelCode}`}
                  </h3>
                </div>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={() => currentSheet && openPractice(currentSheet)}
                  disabled={!currentSheet}
                >
                  Start practice →
                </Button>
              </div>

              {data.todayPacket.sheets.length === 0 ? (
                <NotPlacedEmptyState hasLevel={!!data.levelProgress} />
              ) : (
                <div className="space-y-2.5">
                  {data.todayPacket.sheets.map((sheet) => (
                    <SheetRow key={sheet.worksheetId} sheet={sheet} onClick={() => openPractice(sheet)} />
                  ))}
                </div>
              )}

              {/* Timer */}
              <div className="mt-4 bg-cream-dark border border-border rounded-lg p-4 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted">Practice timer</div>
                <div
                  className={cn(
                    "font-serif text-3xl font-bold leading-none mt-1 tabular-nums",
                    timerRunning ? "text-brand-blue" : "text-ink"
                  )}
                >
                  {formatTime(timerElapsed)}
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    variant={timerRunning ? "secondary" : "blue"}
                    size="sm"
                    onClick={() => setTimerRunning(!timerRunning)}
                  >
                    {timerRunning ? "Pause" : "Start"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setTimerRunning(false); setTimerElapsed(0); }}>
                    Reset
                  </Button>
                </div>
              </div>

              {/* Mastery progress */}
              {data.levelProgress && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold">Advancement progress</span>
                    <span className="text-muted">
                      {data.levelProgress.consecutivePassDays} / {data.levelProgress.consecutivePassDays + data.levelProgress.daysUntilAdvance} days at 95%+
                    </span>
                  </div>
                  <Progress
                    value={
                      data.levelProgress.consecutivePassDays /
                      Math.max(data.levelProgress.consecutivePassDays + data.levelProgress.daysUntilAdvance, 1) *
                      100
                    }
                    color="gold"
                  />
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-3">
                Skills {data.levelProgress && `— ${data.levelProgress.levelCode}`}
              </h3>
              {data.skillTree.length === 0 ? (
                <EmptyState title="No skills tracked yet" description="Complete the placement test to unlock your skill tree." />
              ) : (
                <div className="space-y-1.5">
                  {data.skillTree.map((skill) => (
                    <SkillNode key={skill.skillId} skill={skill} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Weekly accuracy + badges */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-semibold mb-3">Accuracy this week</h3>
              <WeekChart data={data.weeklyAccuracy} />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-3">Badges earned</h3>
              <div className="grid grid-cols-4 gap-2">
                {data.recentBadges.length === 0 && (
                  <div className="col-span-4 py-6 text-center text-sm text-muted">
                    Complete sheets to earn your first badge
                  </div>
                )}
                {data.recentBadges.map((b: any, i) => (
                  <div
                    key={i}
                    className="bg-gold-light border border-gold/30 rounded-lg p-3 text-center"
                  >
                    <div className="text-xl mb-1">{b.badge?.iconEmoji ?? "🏆"}</div>
                    <div className="text-[10px] font-medium text-gold-dark leading-tight">
                      {b.badge?.name ?? "Badge"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Tutorial modal — shown once per skill */}
      {tutorialOpen && tutorialSheet && tutorialContent && (
        <TutorialModal
          open={tutorialOpen}
          onClose={() => { setTutorialOpen(false); setTutorialSheet(null); setTutorialContent(null); }}
          sheet={tutorialSheet}
          content={tutorialContent}
          onComplete={() => onTutorialComplete(tutorialSheet)}
        />
      )}

      {/* Practice modal — wired to real APIs */}
      {practiceOpen && practiceSheet && (
        <PracticeModal
          open={practiceOpen}
          onClose={closePractice}
          sheet={practiceSheet}
          studentId={data.student.id}
          subjectSlug={data.levelProgress?.subjectName?.toUpperCase() as any ?? "MATH"}
          levelCode={data.levelProgress?.levelCode ?? "M5"}
          timerSeconds={timerElapsed}
          onSubmitted={onSheetSubmitted}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Honest empty state for new students
// ─────────────────────────────────────────────────────────────

function EmptyStudentDashboard({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="min-h-screen bg-cream-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center bg-white border border-border rounded-2xl p-8 shadow-card">
        <div className="w-16 h-16 mx-auto bg-gold-light rounded-full flex items-center justify-center text-2xl mb-4">
          🎯
        </div>
        <h1 className="font-serif text-2xl font-bold mb-3">
          Let's find your starting level
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Take the 15-minute placement test to set up your personalized daily packet.
          We'll figure out exactly where mastery should begin.
        </p>
        <Link href="/placement">
          <Button variant="primary" fullWidth size="lg">
            Take placement test →
          </Button>
        </Link>
        {!isSignedIn && (
          <p className="text-xs text-muted mt-4">
            Already taken it? <Link href="/signin" className="text-brand-blue hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SheetRow({ sheet, onClick }: { sheet: TodaySheet; onClick: () => void }) {
  // #S6 FIX: "NOT_STARTED" is "Up next" (or sheet number), not "Locked"
  const config = {
    COMPLETED: { bg: "bg-brand-green-light border-brand-green/30", ic: "✓", icBg: "bg-brand-green/20 text-brand-green", badge: `${sheet.accuracyPct}%`, badgeColor: "bg-brand-green-light text-brand-green" },
    IN_PROGRESS: { bg: "bg-brand-blue-light border-brand-blue/30", ic: "→", icBg: "bg-brand-blue/20 text-brand-blue", badge: "Up next", badgeColor: "bg-brand-blue-light text-brand-blue" },
    NOT_STARTED: { bg: "bg-cream-dark border-border", ic: "○", icBg: "bg-border text-muted", badge: "Not started", badgeColor: "bg-border text-muted" },
  }[sheet.status as "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"];

  return (
    <div
      onClick={sheet.status === "IN_PROGRESS" ? onClick : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-3 border rounded-lg transition-all",
        config.bg,
        sheet.status === "IN_PROGRESS" && "cursor-pointer hover:scale-[1.01]"
      )}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0", config.icBg)}>
        {config.ic}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">Sheet {sheet.index} — {sheet.skillName}</div>
        <div className="text-[11px] text-muted">
          {sheet.problemCount} problems
          {sheet.status === "COMPLETED" && sheet.completedAt && (
            <> · Completed {new Date(sheet.completedAt).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}
              {sheet.timeSeconds && ` · ${formatTime(sheet.timeSeconds)}`}
            </>
          )}
        </div>
      </div>
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", config.badgeColor)}>
        {config.badge}
      </span>
    </div>
  );
}

function SkillNode({ skill }: { skill: any }) {
  const config = {
    MASTERED: { bg: "bg-brand-green-light border-brand-green/30", ic: "✓", icBg: "bg-brand-green/30 text-brand-green", color: "text-brand-green" },
    IN_PROGRESS: { bg: "bg-brand-blue-light border-brand-blue/30", ic: "→", icBg: "bg-brand-blue/30 text-brand-blue", color: "text-brand-blue" },
    LOCKED: { bg: "", ic: "○", icBg: "bg-border text-muted", color: "text-muted" },
  }[skill.status as "MASTERED" | "IN_PROGRESS" | "LOCKED"];

  return (
    <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border border-transparent", config.bg, skill.status === "LOCKED" && "opacity-45")}>
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs", config.icBg)}>
        {config.ic}
      </div>
      <span className="flex-1 text-sm font-medium">{skill.skillName}</span>
      <span className={cn("text-xs font-semibold", config.color)}>
        {skill.status === "LOCKED" ? "—" : `${skill.progressPct}%`}
      </span>
    </div>
  );
}

function WeekChart({ data }: { data: { date: string; pct: number }[] }) {
  const maxH = 80;
  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {data.map((d, i) => {
        const day = new Date(d.date + "T00:00:00").toLocaleDateString("en-CA", { weekday: "short" }).slice(0, 1);
        const h = d.pct > 0 ? Math.max(8, Math.round((d.pct / 100) * maxH)) : 4;
        const color = d.pct >= 95 ? "bg-brand-green" : d.pct >= 75 ? "bg-brand-blue" : d.pct > 0 ? "bg-gold" : "bg-border";
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="text-[10px] text-muted">{d.pct ? `${d.pct}%` : ""}</div>
            <div className={cn("w-full rounded-t-md transition-all", color)} style={{ height: `${h}px` }} />
            <div className="text-[10px] text-muted">{day}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Practice Modal — wired to real APIs (#S2 + #S3)
// ─────────────────────────────────────────────────────────────

interface PracticeProblem {
  id: string;
  question: string;
  // The correct answer is NOT returned by the preview API to the student.
  // Grading happens server-side via submit-sheet.
}

function PracticeModal({
  open,
  onClose,
  sheet,
  studentId,
  subjectSlug,
  levelCode,
  timerSeconds,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  sheet: TodaySheet;
  studentId: string;
  subjectSlug: "MATH" | "READING" | "WRITING" | "SCIENCE";
  levelCode: string;
  timerSeconds: number;
  onSubmitted: () => void;
}) {
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; accuracyPct: number; feedback: string } | null>(null);

  // #S2 FIX: fetch REAL problems for the current sheet's skill
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);

    fetch("/api/worksheet/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectSlug,
        levelCode,
        skillName: sheet.skillName,
        problemCount: sheet.problemCount,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setLoadError(data.error ?? "Could not load problems");
          return;
        }
        const probs: any[] = data.data.problems ?? [];
        setProblems(probs.map((p) => ({
          id: p.id ?? `p-${Math.random()}`,
          question: p.question ?? p.prompt ?? "",
        })));
      })
      .catch(() => setLoadError("Network error — please try again"))
      .finally(() => setLoading(false));
  }, [open, subjectSlug, levelCode, sheet.skillName, sheet.problemCount]);

  // #S3 FIX: real submit to backend
  async function submit() {
    setSubmitting(true);
    setSubmitError(null);

    const submissionAnswers = problems.map((p) => ({
      problemId: p.id,
      answer: answers[p.id] ?? "",
    }));

    try {
      const res = await fetch(`/api/students/${studentId}/submit-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheetId: sheet.worksheetId,
          answers: submissionAnswers,
          timeSeconds: timerSeconds,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSubmitError(data.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }
      setResult({
        score: data.data.score,
        total: data.data.totalProblems,
        accuracyPct: data.data.accuracyPct,
        feedback: data.data.feedback,
      });
    } catch (e: any) {
      setSubmitError(e?.message ?? "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function finish() {
    onSubmitted();
  }

  // #S9 FIX: title uses real sheet info
  const title = `Sheet ${sheet.index} — ${sheet.skillName}`;
  const description = `${sheet.problemCount} problems · Timer: ${formatTime(timerSeconds)}`;

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="md">
      {loading && (
        <div className="py-12 text-center text-muted text-sm">Loading problems…</div>
      )}

      {loadError && !loading && (
        <div className="py-8 text-center">
          <div className="text-brand-red text-sm mb-3">{loadError}</div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      )}

      {!loading && !loadError && !result && (
        <>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {problems.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <span className="text-[10px] text-muted/40 w-5 font-sans">{i + 1}.</span>
                <span className="font-serif font-bold flex-1 text-base">{p.question}</span>
                <input
                  type="text"
                  value={answers[p.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [p.id]: e.target.value })}
                  className="w-20 h-8 border-[1.5px] rounded-md text-sm text-center font-bold font-serif outline-none transition-colors border-border-mid bg-cream-dark/30 focus:border-brand-blue"
                />
              </div>
            ))}
          </div>

          {submitError && (
            <div className="mt-3 bg-brand-red-light border border-brand-red/30 text-brand-red text-xs rounded-md p-2.5">
              {submitError}
            </div>
          )}

          <Button
            variant="green"
            fullWidth
            className="mt-4"
            onClick={submit}
            disabled={submitting || Object.keys(answers).length === 0}
            loading={submitting}
          >
            {submitting ? "Submitting…" : "Submit answers"}
          </Button>
        </>
      )}

      {result && (
        <div className="py-4">
          <div className="text-center mb-4">
            <div
              className={cn(
                "font-serif text-5xl font-bold leading-none mb-2",
                result.accuracyPct >= 95 ? "text-brand-green" : result.accuracyPct >= 70 ? "text-gold" : "text-brand-red"
              )}
            >
              {result.score}/{result.total}
            </div>
            <div className="text-sm text-muted">
              {Math.round(result.accuracyPct)}% accuracy
            </div>
          </div>
          <div
            className={cn(
              "text-center text-sm font-medium mb-4 px-4 py-3 rounded-lg",
              result.accuracyPct >= 95 ? "bg-brand-green-light text-brand-green"
                : result.accuracyPct >= 70 ? "bg-gold-light text-gold-dark"
                : "bg-brand-red-light text-brand-red"
            )}
          >
            {result.feedback}
          </div>
          <Button variant="primary" fullWidth onClick={finish}>
            Done →
          </Button>
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function subjectNameToSlug(name?: string | null): "MATH" | "READING" | "WRITING" | "SCIENCE" {
  switch (name?.toLowerCase()) {
    case "mathematics": return "MATH";
    case "reading": return "READING";
    case "writing": return "WRITING";
    case "science": return "SCIENCE";
    default: return "MATH";
  }
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}


function NotPlacedEmptyState({ hasLevel }: { hasLevel: boolean }) {
  if (hasLevel) {
    return (
      <div className="py-8 text-center text-sm text-muted">
        <div className="mb-2">No sheets assigned yet.</div>
        <div className="text-xs">Your daily packet will appear here shortly.</div>
      </div>
    );
  }
  return (
    <div className="py-6 text-center">
      <div className="text-2xl mb-3">🎯</div>
      <div className="font-semibold text-sm mb-1">Take your placement test</div>
      <div className="text-xs text-muted mb-4 leading-relaxed max-w-xs mx-auto">
        Your daily worksheet packet will be set up automatically after the 15-minute placement test.
      </div>
      <a
        href="/placement"
        className="inline-flex items-center gap-1.5 bg-brand-blue text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
      >
        Start placement test →
      </a>
    </div>
  );
}

// Demo data only shown when explicitly requested via ?demo=1
function demoDashboard(): StudentDashboard {
  const today = new Date();
  const weeklyAccuracy = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    weeklyAccuracy.push({
      date: d.toISOString().split("T")[0],
      pct: isWeekend ? 0 : 85 + Math.floor(Math.random() * 15),
    });
  }

  return {
    student: {
      id: "demo",
      userId: "demo",
      grade: "Grade 4",
      currentStreak: 18,
      longestStreak: 24,
      totalSheetsCompleted: 136,
      user: { firstName: "Kai", name: "Kai Liu", id: "demo", email: "demo@eduyro.com" } as any,
    } as any,
    streakDays: 18,
    longestStreak: 24,
    todayAccuracyPct: 94,
    weeklyAccuracy,
    levelProgress: {
      levelCode: "M5",
      levelName: "Multiplication Fluency",
      subjectName: "Mathematics",
      sheetsCompleted: 136,
      totalSheets: 200,
      progressPct: 68,
      consecutivePassDays: 4,
      daysUntilAdvance: 1,
      status: "IN_PROGRESS",
    },
    todayPacket: {
      sheets: [
        { index: 1, worksheetId: "w1", title: "Sheet 1 — ×7 Multiplication", skillName: "×7 Multiplication", problemCount: 20, status: "COMPLETED", score: 20, accuracyPct: 100, timeSeconds: 442, completedAt: new Date().toISOString() },
        { index: 2, worksheetId: "w2", title: "Sheet 2 — ×8 Multiplication", skillName: "×8 Multiplication", problemCount: 20, status: "COMPLETED", score: 18, accuracyPct: 90, timeSeconds: 485, completedAt: new Date().toISOString() },
        { index: 3, worksheetId: "w3", title: "Sheet 3 — ×9 Multiplication", skillName: "×9 Multiplication", problemCount: 20, status: "IN_PROGRESS" },
      ],
      allComplete: false,
      canPrint: true,
    },
    recentBadges: [
      { id: "1", studentId: "demo", badgeId: "b1", earnedAt: new Date(), badge: { iconEmoji: "⚡", name: "Speed demon" } } as any,
      { id: "2", studentId: "demo", badgeId: "b2", earnedAt: new Date(), badge: { iconEmoji: "🎯", name: "Perfect score" } } as any,
      { id: "3", studentId: "demo", badgeId: "b3", earnedAt: new Date(), badge: { iconEmoji: "🔥", name: "2-week streak" } } as any,
      { id: "4", studentId: "demo", badgeId: "b4", earnedAt: new Date(), badge: { iconEmoji: "📈", name: "Level climber" } } as any,
    ] as any,
    skillTree: [
      { skillId: "1", skillName: "×2–×5 Fluency", sortOrder: 0, status: "MASTERED", progressPct: 100, sheetsCompleted: 40, totalSheets: 40 },
      { skillId: "2", skillName: "×6 Multiplication", sortOrder: 1, status: "MASTERED", progressPct: 100, sheetsCompleted: 40, totalSheets: 40 },
      { skillId: "3", skillName: "×7 Multiplication", sortOrder: 2, status: "MASTERED", progressPct: 100, sheetsCompleted: 40, totalSheets: 40 },
      { skillId: "4", skillName: "×8–×9 Fluency", sortOrder: 3, status: "IN_PROGRESS", progressPct: 70, sheetsCompleted: 28, totalSheets: 40 },
      { skillId: "5", skillName: "×10–×12 Fluency", sortOrder: 4, status: "LOCKED", progressPct: 0, sheetsCompleted: 0, totalSheets: 40 },
      { skillId: "6", skillName: "Division Intro", sortOrder: 5, status: "LOCKED", progressPct: 0, sheetsCompleted: 0, totalSheets: 40 },
    ],
  };
}
