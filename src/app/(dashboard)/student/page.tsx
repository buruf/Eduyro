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
import { MathText } from "@/components/MathText";
import { QuestionWithViz } from "@/components/FractionViz";
import { buildScaffold } from "@/lib/tutor/scaffold";
import { parseColumnar, parseLongDivision } from "@/lib/math/columnar";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar, DashboardTopbar } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, StatCard, Progress, Modal, EmptyState } from "@/components/ui";
import { StudentRealtime } from "@/components/realtime/StudentRealtime";
import { ConceptTutorialModal } from "@/components/tutorial/ConceptTutorialModal";
import { cn, formatTime } from "@/lib/utils";
import type { AnswerType, InteractiveSpec } from "@/types";
import dynamic from "next/dynamic";
// Mafs touches the DOM — load the graphing input client-only (no SSR).
const VertexDragInput = dynamic(
  () => import("@/components/practice/VertexDragInput").then((m) => m.VertexDragInput),
  { ssr: false, loading: () => <div className="py-10 text-center text-muted text-sm">Loading graph…</div> },
);
import {
  NumberInput, FractionInput, MixedFractionInput, ComparisonSelector,
  TrueFalse, MultipleChoice, ShortTextInput,
} from "@/components/practice/MathInputs";
import { GraphChoice } from "@/components/practice/GraphChoice";
import { OrderingInput } from "@/components/practice/OrderingInput";
import { MultiSelectInput } from "@/components/practice/MultiSelectInput";
import { EquationBuilder } from "@/components/practice/EquationBuilder";
import { AngleDragInput } from "@/components/practice/AngleDragInput";
import { AreaModelInput } from "@/components/practice/AreaModelInput";

// "Match the equation to its graph" options are encoded graph descriptors
// (e.g. "parab:1,2,1" / "line:2,-3") → render as graph thumbnails, not text.
const isGraphOptions = (opts?: string[] | null) => !!opts?.length && opts.every((o) => /^(parab|line):/.test(o));
import { conceptForSkill, type ConceptTutorial } from "@/lib/tutorials/concepts";
import { getMicroSkillLesson, type MicroLesson } from "@/lib/worksheet/tutorials";
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

  // Parent-enabled subjects for the "My subjects" switcher. The child can only
  // ever see/switch among subjects the parent enabled; enrollment is not
  // self-serve. `activeSubjectRef` keeps the chosen subject sticky across the
  // no-arg refreshes triggered by notifications / sheet completion.
  const [subjects, setSubjects] = useState<SubjectCard[] | null>(null);
  const activeSubjectRef = useRef<string | null>(null);

  // Concept tutorials — DB-tracked per student (localStorage as offline/demo fallback)
  const [completedConcepts, setCompletedConcepts] = useState<Set<string>>(new Set());
  const [conceptModal, setConceptModal] = useState<{
    concept: ConceptTutorial;
    sheet: TodaySheet | null;
    mode: "first" | "review";
    microLesson?: MicroLesson | null;
    key?: string; // per-micro-skill completion key
  } | null>(null);

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

  async function fetchDashboard(subject?: string) {
    setLoading(true);
    const slug = subject ?? activeSubjectRef.current;
    try {
      const url = slug
        ? `/api/students/me/dashboard?subject=${encodeURIComponent(slug)}`
        : "/api/students/me/dashboard";
      const res = await fetch(url).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data.success) {
          setDashboard(data.data);
          // Seed the sticky active subject from the first load so refreshes stay
          // on the same subject the child is currently working in.
          if (!activeSubjectRef.current && data.data?.levelProgress?.subjectName) {
            activeSubjectRef.current = data.data.levelProgress.subjectName;
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Load the parent-enabled subjects for the switcher.
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/students/me/subjects")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.success) setSubjects(j.data.subjects); })
      .catch(() => {});
  }, [session]);

  // Switch the dashboard to a different (placed) subject.
  function switchSubject(slug: string) {
    if (activeSubjectRef.current === slug) return;
    activeSubjectRef.current = slug;
    fetchDashboard(slug);
  }

  // Load which concept tutorials this student has already completed (DB),
  // falling back to localStorage for demo/offline sessions.
  useEffect(() => {
    const sid = dashboard?.student?.id;
    const localSet = () => {
      try {
        const raw = localStorage.getItem("eduyro:tutorials-done");
        if (raw) setCompletedConcepts(new Set(JSON.parse(raw)));
      } catch { /* ignore */ }
    };
    if (!sid) { localSet(); return; }
    fetch(`/api/students/${sid}/tutorials`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.success && Array.isArray(j.data?.completed)) {
          setCompletedConcepts(new Set<string>(j.data.completed));
        } else {
          localSet();
        }
      })
      .catch(localSet);
  }, [dashboard?.student?.id]);

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

  // Concept for the sheet currently up next (drives the "Review tutorial" link)
  const currentConcept = currentSheet
    ? conceptForSkill(data.levelProgress?.levelCode, currentSheet.skillName)
    : null;

  function beginPractice(sheet: TodaySheet) {
    setPracticeSheet(sheet);
    setPracticeOpen(true);
    if (!timerRunning) setTimerRunning(true);
  }

  // Per-MICRO-SKILL tutorial key, so each micro-skill teaches once (council rule:
  // a fresh lesson fires when the student first reaches each micro-skill's sheets,
  // not once per whole level).
  const microKey = (levelCode: string | undefined, microSkillLabel: string) =>
    `${levelCode ?? "?"}::${microSkillLabel}`;

  function openPractice(sheet: TodaySheet) {
    if (sheet.status !== "IN_PROGRESS") return;
    const levelCode = data.levelProgress?.levelCode;
    const concept = conceptForSkill(levelCode, sheet.skillName);
    const subjectSlug = subjectNameToSlug(data.levelProgress?.subjectName);
    const microLesson = getMicroSkillLesson(subjectSlug, levelCode ?? "", sheet.skillName);
    const key = microKey(levelCode, sheet.skillName);
    // First visit to THIS micro-skill → teach the matching lesson before questions.
    if (concept && !completedConcepts.has(key)) {
      setConceptModal({ concept, sheet, mode: "first", microLesson, key });
    } else {
      beginPractice(sheet);
    }
  }

  function openTutorialReview() {
    if (!currentConcept) return;
    const levelCode = data.levelProgress?.levelCode;
    const label = currentSheet?.skillName ?? "";
    const microLesson = getMicroSkillLesson(subjectNameToSlug(data.levelProgress?.subjectName), levelCode ?? "", label);
    setConceptModal({ concept: currentConcept, sheet: null, mode: "review", microLesson, key: microKey(levelCode, label) });
  }

  async function onConceptTutorialDone() {
    if (!conceptModal) return;
    const { concept, sheet, mode } = conceptModal;
    setConceptModal(null);

    if (mode === "first") {
      // Mark THIS micro-skill's lesson done (composite key), persist (DB first,
      // localStorage fallback). Falls back to concept.id if no key was set.
      const doneId = conceptModal.key ?? concept.id;
      const next = new Set(completedConcepts).add(doneId);
      setCompletedConcepts(next);
      try { localStorage.setItem("eduyro:tutorials-done", JSON.stringify([...next])); } catch { /* ignore */ }
      const sid = data.student?.id;
      if (sid) {
        fetch(`/api/students/${sid}/tutorials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conceptId: doneId }),
        }).catch(() => { /* localStorage already has it */ });
      }
      if (sheet) beginPractice(sheet);
    }
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

          {/* My subjects — parent-enabled subjects only. Placed subjects switch
              the dashboard; not-yet-placed subjects link to placement. */}
          {subjects && subjects.length > 0 && (
            <SubjectSwitcher
              subjects={subjects}
              activeSlug={data.levelProgress?.subjectName ?? null}
              onSwitch={switchSubject}
            />
          )}

          {/* Today's packet + skill tree */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-sans text-sm font-semibold">
                    Today's packet {data.levelProgress && `— Level ${data.levelProgress.levelCode}`}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {currentConcept && completedConcepts.has(currentConcept.id) && (
                    <button
                      onClick={openTutorialReview}
                      className="text-xs text-brand-blue hover:underline whitespace-nowrap"
                    >
                      ↻ Review tutorial
                    </button>
                  )}
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => currentSheet && openPractice(currentSheet)}
                    disabled={!currentSheet}
                  >
                    Start practice →
                  </Button>
                </div>
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

              {/* All of today's sheets are done — celebrate and point forward, so
                  finishing the packet never feels like a dead end. */}
              {data.todayPacket.sheets.length > 0 && !currentSheet && (
                <div className="mt-3 rounded-lg bg-brand-green-light border border-brand-green/30 p-3.5 text-center">
                  <div className="font-sans text-sm font-semibold text-brand-green">🎉 All done for today — great work!</div>
                  <div className="text-xs text-muted mt-1">
                    Come back tomorrow for the next sheets. Keep your streak going to master{" "}
                    {data.skillTree?.find((s) => s.status === "IN_PROGRESS")?.skillName ?? "this skill"} and unlock what's next.
                  </div>
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

      {/* Concept tutorial — auto-opens before a skill's FIRST practice;
          reachable later via the "Review tutorial" link */}
      {conceptModal && (
        <ConceptTutorialModal
          open={true}
          concept={conceptModal.concept}
          subjectSlug={subjectNameToSlug(data.levelProgress?.subjectName)}
          // The lesson must teach the MICRO-SKILL the student is about to practise
          // (the unit label, e.g. "Perfect squares & square roots"), not the broad
          // skill-tree node — so the worked example matches the upcoming questions.
          skillName={conceptModal.sheet?.skillName ?? currentSheet?.skillName ?? ""}
          microLesson={conceptModal.microLesson}
          mode={conceptModal.mode}
          onStart={onConceptTutorialDone}
          onClose={() => setConceptModal(null)}
        />
      )}

      {/* Practice modal — wired to real APIs */}
      {practiceOpen && practiceSheet && (
        <PracticeModal
          open={practiceOpen}
          onClose={closePractice}
          sheet={practiceSheet}
          studentId={data.student.id}
          subjectSlug={subjectNameToSlug(data.levelProgress?.subjectName)}
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

interface SubjectCard {
  subjectId: string;
  slug: string;
  name: string;
  iconEmoji: string | null;
  colorHex: string | null;
  placed: boolean;
  activeLevelCode: string | null;
  activeLevelName: string | null;
  placementStatus: string | null;
}

// "My subjects" — the parent-enabled subjects. Placed subjects switch the
// dashboard view; not-yet-placed subjects deep-link into the placement test.
// The child can never add a subject here; enrollment is parent-controlled.
function SubjectSwitcher({
  subjects,
  activeSlug,
  onSwitch,
}: {
  subjects: SubjectCard[];
  activeSlug: string | null;
  onSwitch: (slug: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">My subjects</div>
      <div className="flex flex-wrap gap-2.5">
        {subjects.map((s) => {
          const isActive = activeSlug === s.slug;
          if (!s.placed) {
            return (
              <a
                key={s.subjectId}
                href={`/placement?subject=${s.slug}`}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-brand-blue/40 bg-brand-blue-light/40 hover:bg-brand-blue-light transition-colors"
              >
                <span className="text-lg">{s.iconEmoji ?? "📚"}</span>
                <span className="text-left">
                  <span className="block text-sm font-semibold text-ink">{s.name}</span>
                  <span className="block text-[11px] text-brand-blue font-medium">Take placement →</span>
                </span>
              </a>
            );
          }
          return (
            <button
              key={s.subjectId}
              onClick={() => onSwitch(s.slug)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-left",
                isActive
                  ? "border-brand-blue bg-brand-blue-light ring-1 ring-brand-blue/30"
                  : "border-border bg-white hover:border-brand-blue/50"
              )}
            >
              <span className="text-lg">{s.iconEmoji ?? "📚"}</span>
              <span>
                <span className="block text-sm font-semibold text-ink">{s.name}</span>
                <span className="block text-[11px] text-muted">
                  {s.activeLevelCode ? `Level ${s.activeLevelCode}` : "In progress"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  type?: string;        // "short_answer" | "multiple_choice" | "written_response"
  options?: string[] | null;
  answerType?: AnswerType; // drives which input component renders
  interactive?: InteractiveSpec; // render spec for graphing items (answerType "point")
  points?: number;
  // The correct answer is NOT returned by the preview API to the student.
  // Grading happens server-side via submit-sheet.
}

// Big tap-friendly number pad for young learners on tablets (numeric math answers).
// `extras` adds only the symbols the current question actually needs (e.g. "/"
// for fractions, "." for decimals) so early numeric sheets stay a clean 0–9 pad.
function NumberPad({ onKey, extras = [] }: { onKey: (k: string) => void; extras?: string[] }) {
  const digits = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
  const keys = [...digits, ...(extras.length ? [extras[0]] : []), "0", "del", ...extras.slice(1)];
  return (
    <div className="grid grid-cols-3 gap-2.5 mt-3 w-full max-w-[22rem] mx-auto">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k === "del" ? "del" : k)}
          className={cn(
            "h-14 rounded-xl border border-border-mid bg-white text-2xl font-bold font-serif hover:bg-cream-dark/40 active:bg-cream-dark transition-colors",
            k === "del" && "text-brand-red"
          )}
          aria-label={k === "del" ? "Delete" : k}
        >
          {k === "del" ? "⌫" : k}
        </button>
      ))}
    </div>
  );
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
  // Per-problem grading (drives the "fix your misses" coaching review).
  const [graded, setGraded] = useState<{ problemId: string; answer: string; correctAnswer: string; isCorrect: boolean; explanation?: string }[]>([]);
  // Coaching-review state.
  const [reviewing, setReviewing] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [retry, setRetry] = useState("");
  const [retryResult, setRetryResult] = useState<"correct" | "wrong" | null>(null);
  // One-question-at-a-time navigation + per-question coaching.
  const [idx, setIdx] = useState(0);
  const [live, setLive] = useState<Record<string, { isCorrect: boolean; correctAnswer: string }>>({});
  const [liveHints, setLiveHints] = useState<Record<string, number>>({});
  const [liveChecking, setLiveChecking] = useState<string | null>(null);
  // First-try correctness (recorded the FIRST time a question is checked) so the
  // results screen can show honest first-try accuracy, separate from mastery.
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});

  // Load the STORED problems for this exact worksheet so their IDs match the
  // answer key in the DB — without this, submit-sheet can't grade and every
  // sheet scores 0%. (Do NOT regenerate via /api/worksheet/preview: that mints
  // fresh random IDs that never match the stored answer key.)
  useEffect(() => {
    if (!open || !sheet.worksheetId) return;
    setLoading(true);
    setLoadError(null);
    setIdx(0); setAnswers({}); setLive({}); setLiveHints({}); setFirstTry({});
    setResult(null); setReviewing(false);

    fetch(`/api/worksheet/by-id/${sheet.worksheetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setLoadError(data.error ?? "Could not load problems");
          return;
        }
        const probs: any[] = data.data.problems ?? [];
        setProblems(probs.map((p) => ({
          id: p.id,
          question: p.question ?? "",
          type: p.type,
          options: p.options ?? null,
          answerType: p.answerType,
          interactive: p.interactive,
          points: p.points,
        })));
      })
      .catch(() => setLoadError("Network error — please try again"))
      .finally(() => setLoading(false));
  }, [open, sheet.worksheetId]);

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
          // Clamp to the server's 2h cap so a long-open session never gets rejected.
          timeSeconds: Math.min(Math.max(0, Math.round(timerSeconds)), 7200),
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
      setGraded(data.data.gradedAnswers ?? []);
    } catch (e: any) {
      setSubmitError(e?.message ?? "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function finish() {
    onSubmitted();
  }

  // "Check as I go": grade ONE answer server-side (no completion recorded) so the
  // student gets coaching at the moment of error.
  async function checkOne(p: PracticeProblem) {
    const ans = answers[p.id];
    if (!ans || liveChecking) return;
    setLiveChecking(p.id);
    try {
      const res = await fetch(`/api/students/${studentId}/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId: sheet.worksheetId, problemId: p.id, answer: ans }),
      });
      const data = await res.json();
      if (data.success) {
        setLive((m) => ({ ...m, [p.id]: { isCorrect: data.data.isCorrect, correctAnswer: data.data.correctAnswer } }));
        if (!data.data.isCorrect) setLiveHints((h) => ({ ...h, [p.id]: 0 }));
        // Record first-try result once (used for honest accuracy on the results screen).
        setFirstTry((f) => (p.id in f ? f : { ...f, [p.id]: data.data.isCorrect }));
      }
    } catch {
      /* ignore — student can retry */
    } finally {
      setLiveChecking(null);
    }
  }

  // ── One-question-at-a-time derived state ──
  const isPassage = (p: PracticeProblem) =>
    (p.points ?? 0) === 0 || p.question.startsWith("READ THIS PASSAGE");
  const answerable = problems.filter((p) => !isPassage(p));
  const total = answerable.length;
  const safeIdx = Math.min(idx, Math.max(0, total - 1));
  const cur: PracticeProblem | undefined = answerable[safeIdx];
  const curLive = cur ? live[cur.id] : undefined;
  const isLast = safeIdx >= total - 1;
  // Reading: the nearest passage block before the current question is its context.
  let passage: PracticeProblem | null = null;
  if (cur) {
    const pos = problems.indexOf(cur);
    for (let i = pos - 1; i >= 0; i--) { if (isPassage(problems[i])) { passage = problems[i]; break; } }
  }

  // Number pad writes into the current question's answer.
  const padKey = (k: string) => {
    if (!cur) return;
    const v = answers[cur.id] ?? "";
    setAnswers((a) => ({ ...a, [cur.id]: k === "del" ? v.slice(0, -1) : v + k }));
  };
  // The on-screen number pad is only for SINGLE-FIELD numeric answers. Fractions,
  // comparisons, choices, true/false and algebraic expressions have their own
  // typed controls (or a keyboard), so the pad would be wrong there.
  const padType = cur?.answerType;
  const showPad = !!cur && subjectSlug === "MATH" &&
    (padType === "integer" || padType === "decimal" || padType === "percent");
  const padExtras = padType === "decimal" ? ["."] : [];

  // Renders the answer body for a problem — reused stacked / long-division / MC /
  // visual / plain renderers, sized up for the focused single-question card.
  const renderBody = (p: PracticeProblem) => {
    const opts = p.options ?? null;
    const isBareExpr = !opts && !p.question.includes("=") && !p.question.includes("___") && /^[\dx(]/i.test(p.question.trim());
    const questionText = isBareExpr ? `${p.question} =` : p.question;
    const stack = opts ? null : parseColumnar(p.question);
    const ld = opts || stack ? null : parseLongDivision(p.question);
    const set = (v: string) => setAnswers((a) => ({ ...a, [p.id]: v }));

    // Interactive graphing item — dispatch by the spec's kind.
    if (p.interactive && p.answerType === "point") {
      return (
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <QuestionWithViz text={p.question} size={64} className="font-serif font-semibold text-lg leading-snug" />
          </div>
          {p.interactive.kind === "equation-builder"
            ? <EquationBuilder spec={p.interactive} value={answers[p.id] ?? ""} onChange={set} />
            : p.interactive.kind === "angle-drag"
            ? <AngleDragInput spec={p.interactive} value={answers[p.id] ?? ""} onChange={set} />
            : p.interactive.kind === "area-model"
            ? <AreaModelInput spec={p.interactive} value={answers[p.id] ?? ""} onChange={set} />
            : <VertexDragInput spec={p.interactive} value={answers[p.id] ?? ""} onChange={set} />}
        </div>
      );
    }

    if (stack) {
      return (
        <div className="inline-block min-w-[6rem] mx-auto">
          <div className="font-serif font-bold text-3xl text-right tabular-nums leading-tight">{stack.top}</div>
          <div className="flex items-end justify-between gap-5 font-serif font-bold text-3xl tabular-nums leading-tight">
            <span>{stack.op}</span><span>{stack.bottom}</span>
          </div>
          <div className="border-t-2 border-ink/80 mt-1" />
          <input type="text" inputMode="numeric" value={answers[p.id] ?? ""} onChange={(e) => set(e.target.value)} placeholder="="
            className="mt-2 w-full h-12 border-[1.5px] rounded-md text-2xl text-right px-2 font-bold font-serif tabular-nums outline-none border-border-mid bg-cream-dark/30 focus:border-brand-blue" />
        </div>
      );
    }
    if (ld) {
      return (
        <div className="flex items-start gap-1.5 justify-center pt-1">
          <span className="font-serif font-bold text-3xl tabular-nums mt-9">{ld.divisor}</span>
          <span className="font-serif font-bold text-3xl mt-9">)</span>
          <div className="inline-block min-w-[5rem]">
            <input type="text" inputMode="numeric" value={answers[p.id] ?? ""} onChange={(e) => set(e.target.value)} placeholder="?"
              className="w-full h-10 text-center text-2xl font-bold font-serif tabular-nums outline-none bg-transparent text-brand-blue placeholder:text-muted/40" />
            <div className="border-t-2 border-ink/80" />
            <div className="font-serif font-bold text-3xl text-center tabular-nums pt-1">{ld.dividend}</div>
          </div>
        </div>
      );
    }
    // Pick the input component purely from answerType (classified server-side).
    const at = p.answerType;
    const val = answers[p.id] ?? "";
    const isChoice = !!(opts && opts.length) && at !== "trueFalse";
    const control = (() => {
      if (opts && opts.length) {
        if (at === "ordering") return <OrderingInput items={opts} value={val} onChange={set} />;
        if (at === "multiSelect") return <MultiSelectInput options={opts} value={val} onChange={set} />;
        if (isGraphOptions(opts)) return <GraphChoice options={opts} value={val} onChange={set} />;
        return at === "trueFalse"
          ? <TrueFalse value={val} onChange={set} />
          : <MultipleChoice options={opts} value={val} onChange={set} />;
      }
      switch (at) {
        case "comparison":    return <ComparisonSelector value={val} onChange={set} />;
        case "trueFalse":     return <TrueFalse value={val} onChange={set} />;
        case "fraction":      return <FractionInput value={val} onChange={set} />;
        case "mixedFraction": return <MixedFractionInput value={val} onChange={set} />;
        case "percent":       return <NumberInput value={val} onChange={set} mode="percent" />;
        case "decimal":       return <NumberInput value={val} onChange={set} mode="decimal" />;
        case "integer":       return <NumberInput value={val} onChange={set} mode="integer" />;
        case "expression":    return <ShortTextInput value={val} onChange={set} mode="expression" />;
        default:              return <ShortTextInput value={val} onChange={set} mode={subjectSlug === "MATH" ? "expression" : "text"} />;
      }
    })();
    return (
      <div className="text-center">
        <div className="flex justify-center">
          <QuestionWithViz text={questionText} size={96} className="font-serif font-semibold text-xl leading-snug" />
        </div>
        {isChoice
          ? <div className="mt-5">{control}</div>
          : <div className="mt-6 flex justify-center">{control}</div>}
      </div>
    );
  };

  const title = `Sheet ${sheet.index} — ${sheet.skillName}`;
  const description = total ? `Question ${safeIdx + 1} of ${total} · Timer: ${formatTime(timerSeconds)}` : `Timer: ${formatTime(timerSeconds)}`;

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

      {!loading && !loadError && !result && cur && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
              <div className="h-full bg-brand-green transition-all" style={{ width: `${(safeIdx / total) * 100}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted shrink-0">{safeIdx + 1}/{total}</span>
          </div>

          {passage && (
            <div className="bg-cream-dark/40 border border-border-mid rounded-lg p-3 mb-3 max-h-[26vh] overflow-y-auto">
              <div className="text-[10px] font-sans font-bold uppercase tracking-wide text-muted/60 mb-1">Read the passage</div>
              <p className="text-sm leading-relaxed whitespace-pre-line font-serif">
                {passage.question.replace(/^READ THIS PASSAGE:\s*/i, "").replace(/\s*Now answer the questions below\.?\s*$/i, "").trim()}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border-mid bg-white px-4 py-7 min-h-[150px] flex items-center justify-center">
            {renderBody(cur)}
          </div>

          {showPad && !curLive && <NumberPad onKey={padKey} extras={padExtras} />}

          {curLive && !curLive.isCorrect && (() => {
            const sc = buildScaffold(cur.question, curLive.correctAnswer, answers[cur.id] ?? "", { subjectSlug, directive: sheet.skillName });
            const shown = liveHints[cur.id] ?? 0;
            return (
              <div className="mt-3 space-y-1.5">
                <div className="text-sm font-bold text-brand-red">Not quite — let&apos;s work through it 💪</div>
                <div className="bg-cream-dark/40 rounded-md p-2.5 text-sm"><MathText>{sc.explanation}</MathText></div>
                {sc.hints.slice(0, shown).map((h, hi) => (
                  <div key={hi} className="flex gap-2 text-sm bg-gold-light/60 rounded-md p-2">
                    <span className="font-bold text-gold-dark shrink-0">Hint {hi + 1}</span><MathText className="flex-1">{h}</MathText>
                  </div>
                ))}
                {shown < sc.hints.length && (
                  <button type="button" onClick={() => setLiveHints((m) => ({ ...m, [cur.id]: (m[cur.id] ?? 0) + 1 }))}
                    className="text-xs font-bold text-brand-blue hover:underline">{shown === 0 ? "Show a hint →" : "Next hint →"}</button>
                )}
              </div>
            );
          })()}

          {curLive?.isCorrect && <div className="mt-3 text-sm font-bold text-brand-green text-center">✓ Correct! Nice work.</div>}

          {submitError && <div className="mt-3 bg-brand-red-light border border-brand-red/30 text-brand-red text-xs rounded-md p-2.5">{submitError}</div>}

          <div className="flex items-center gap-2 mt-4">
            {safeIdx > 0 && (
              <Button variant="ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Back</Button>
            )}
            {!curLive ? (
              <Button variant="primary" fullWidth onClick={() => checkOne(cur)}
                disabled={!(answers[cur.id] ?? "").trim() || liveChecking === cur.id} loading={liveChecking === cur.id}>
                {liveChecking === cur.id ? "Checking…" : "Check answer"}
              </Button>
            ) : curLive.isCorrect ? (
              <Button variant="green" fullWidth loading={submitting}
                onClick={() => { if (isLast) submit(); else setIdx((i) => i + 1); }}>
                {isLast ? "Finish →" : "Next question →"}
              </Button>
            ) : (
              <Button variant="secondary" fullWidth onClick={() => setLive((m) => { const n = { ...m }; delete n[cur.id]; return n; })}>
                Try again
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (() => {
        const misses = graded
          .filter((g) => !g.isCorrect)
          .map((g) => ({ g, p: problems.find((p) => p.id === g.problemId) }))
          .filter((x): x is { g: typeof x.g; p: PracticeProblem } => !!x.p);
        const norm = (s: string) => String(s).trim().toLowerCase().replace(/\s+/g, "");

        // ── Coaching review of a single missed problem ──────────────────────
        if (reviewing && misses[reviewIdx]) {
          const { g, p } = misses[reviewIdx];
          const sc = buildScaffold(p.question, g.correctAnswer, g.answer, { subjectSlug, explanation: g.explanation, directive: sheet.skillName });
          const allHints = hintsShown >= sc.hints.length;
          const isMC = !!(p.options && p.options.length);

          return (
            <div className="py-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted">Coaching · {reviewIdx + 1} of {misses.length}</span>
                <span className="text-[11px] text-muted">Let's rebuild this one 💪</span>
              </div>

              <div className="rounded-lg border border-border-mid bg-white p-3.5 space-y-3">
                <QuestionWithViz text={p.question} size={56} className="font-serif font-semibold text-base" />
                {g.answer ? (
                  <div className="text-xs flex items-center gap-1">
                    <span className="text-muted">You answered </span>
                    <span className="font-bold text-brand-red"><MathText>{g.answer}</MathText></span>
                  </div>
                ) : null}

                <div className="bg-cream-dark/40 rounded-md p-2.5 text-sm">
                  <MathText>{sc.explanation}</MathText>
                </div>

                {/* progressive hints, revealed one at a time */}
                <div className="space-y-1.5">
                  {sc.hints.slice(0, hintsShown).map((h, i) => (
                    <div key={i} className="flex gap-2 text-sm bg-gold-light/60 rounded-md p-2">
                      <span className="font-bold text-gold-dark shrink-0">Hint {i + 1}</span>
                      <MathText className="flex-1">{h}</MathText>
                    </div>
                  ))}
                  {!allHints && (
                    <button
                      type="button"
                      onClick={() => setHintsShown((n) => n + 1)}
                      className="text-xs font-bold text-brand-blue hover:underline"
                    >
                      {hintsShown === 0 ? "Show me a hint →" : "Next hint →"}
                    </button>
                  )}
                </div>

                {/* once all hints are shown, the student re-attempts it */}
                {allHints && (
                  <div className="border-t border-border-mid/60 pt-3">
                    <div className="text-xs font-bold text-muted mb-1.5">Now you try it:</div>
                    {isMC ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {p.options!.map((opt) => {
                          const picked = retry === opt;
                          const right = norm(opt) === norm(g.correctAnswer);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => { setRetry(opt); setRetryResult(right ? "correct" : "wrong"); }}
                              className={cn(
                                "text-left text-sm rounded-md border-[1.5px] px-3 py-2 font-medium transition-colors",
                                picked && right ? "border-brand-green bg-brand-green-light text-brand-green"
                                  : picked ? "border-brand-red bg-brand-red-light text-brand-red"
                                  : "border-border-mid bg-cream-dark/20 hover:border-brand-blue/50"
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          value={retry}
                          onChange={(e) => { setRetry(e.target.value); setRetryResult(null); }}
                          placeholder="Your answer"
                          className="w-32 h-9 border-[1.5px] rounded-md text-sm text-center font-bold font-serif outline-none border-border-mid bg-cream-dark/30 focus:border-brand-blue"
                        />
                        <Button variant="secondary" onClick={() => setRetryResult(norm(retry) === norm(g.correctAnswer) ? "correct" : "wrong")}>
                          Check
                        </Button>
                        {retryResult === "correct" && <span className="text-brand-green font-bold text-sm">✓ You've got it!</span>}
                        {retryResult === "wrong" && (
                          <span className="text-brand-red font-bold text-sm flex items-center gap-1">
                            Not yet — it's <MathText>{g.correctAnswer}</MathText>
                          </span>
                        )}
                      </div>
                    )}
                    {isMC && retryResult === "correct" && <div className="text-brand-green font-bold text-sm mt-1.5">✓ You've got it!</div>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    if (reviewIdx + 1 < misses.length) {
                      setReviewIdx((i) => i + 1);
                      setHintsShown(0); setRetry(""); setRetryResult(null);
                    } else {
                      setReviewing(false);
                    }
                  }}
                >
                  {reviewIdx + 1 < misses.length ? "Next problem →" : "Finish review"}
                </Button>
              </div>
            </div>
          );
        }

        // ── Score summary — leads with EFFORT + first-try accuracy, never a bare 0 ──
        const ftKeys = Object.keys(firstTry);
        const firstRight = ftKeys.filter((k) => firstTry[k]).length;
        const ftTotal = ftKeys.length || result.total;
        const ftPct = Math.round((firstRight / Math.max(1, ftTotal)) * 100);
        return (
          <div className="py-4 text-center">
            <div className="text-4xl mb-1">🎉</div>
            <div className="font-serif text-xl font-bold leading-tight mb-1">You finished all {result.total}!</div>
            <div
              className={cn(
                "font-serif text-4xl font-bold leading-none my-2",
                ftPct >= 80 ? "text-brand-green" : ftPct >= 50 ? "text-gold" : "text-brand-blue"
              )}
            >
              {firstRight}/{ftTotal}
            </div>
            <div className="text-sm text-muted mb-4">right on the first try ({ftPct}%)</div>
            <div className="text-center text-sm font-medium mb-4 px-4 py-3 rounded-lg bg-brand-green-light text-brand-green">
              {firstRight === ftTotal
                ? "Perfect — every one on the first try! 🌟"
                : "Great work — you stuck with it and got them all. That's how mastery is built. 💪"}
            </div>
            {misses.length > 0 && (
              <Button
                variant="green"
                fullWidth
                className="mb-2"
                onClick={() => { setReviewing(true); setReviewIdx(0); setHintsShown(0); setRetry(""); setRetryResult(null); }}
              >
                Review the {misses.length} you needed help on →
              </Button>
            )}
            <Button variant={misses.length > 0 ? "secondary" : "primary"} fullWidth onClick={finish}>
              Done →
            </Button>
          </div>
        );
      })()}
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
