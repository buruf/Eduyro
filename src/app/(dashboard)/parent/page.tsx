// src/app/(dashboard)/parent/page.tsx
// UPDATED: Added "Add child" button and modal so parents can create
// child accounts directly from their dashboard.
// Children appear as cards with their level, streak, and accuracy.

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { DashboardSidebar, DashboardTopbar } from "@/components/layout";
import { ReportProblemButton } from "@/components/ReportProblemButton";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Badge, Modal, Input } from "@/components/ui";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import type { ParentDashboard, ChildSummary } from "@/types";

const CHILD_COLORS = ["#1B4F8A", "#2D6A3F", "#8A3F9F", "#C8902A", "#C23B22"];
const GRADES = [
  "Pre-K", "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

// The 10 primary sections (user spec): everything else nests inside these —
// no separate top-level pages for detailed reports.
const SECTIONS = [
  { id: "dashboard",    label: "Dashboard",         icon: "🏠" },
  { id: "subjects",     label: "Subjects",          icon: "📚" },
  { id: "path",         label: "Learning Path",     icon: "🛤" },
  { id: "progress",     label: "Progress",          icon: "📊" },
  { id: "improve",      label: "Skills to Improve", icon: "⚠️" },
  { id: "history",      label: "Practice History",  icon: "📝" },
  { id: "achievements", label: "Achievements",      icon: "🏆" },
  { id: "goals",        label: "Goals",             icon: "🎯" },
  { id: "controls",     label: "Parent Controls",   icon: "👨‍👩‍👧" },
  { id: "subscription", label: "Subscription",      icon: "💳" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function ParentDashboardInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showDemo = searchParams.get("demo") === "1";
  const section = (SECTIONS.some((s) => s.id === searchParams.get("section"))
    ? searchParams.get("section")
    : "dashboard") as SectionId;

  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addChildOpen, setAddChildOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return; }
    fetchDashboard();
    const handler = () => fetchDashboard();
    window.addEventListener("bs:notification", handler);
    return () => window.removeEventListener("bs:notification", handler);
  }, [session]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/parents/me/dashboard");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDashboard(data.data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading && !dashboard && !showDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-dark">
        <div className="text-muted text-sm">Loading your dashboard…</div>
      </div>
    );
  }

  // New parent with no children yet
  if (!dashboard && !showDemo) {
    return (
      <EmptyParentDashboard onAddChild={() => setAddChildOpen(true)} addChildOpen={addChildOpen} setAddChildOpen={setAddChildOpen} onChildAdded={fetchDashboard} />
    );
  }

  const data = dashboard!;
  const activeChild = data.children[activeChildIndex] ?? null;

  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen">
      <DashboardSidebar
        roleBadge="Parent"
        user={{
          name: data.parent.user.name ?? "Parent",
          subtitle: `${data.children.length} ${data.children.length === 1 ? "child" : "children"}`,
        }}
        items={[]}
        topContent={
          <div>
            <div className="text-[10px] uppercase tracking-wider text-cream/40 mb-2 px-1">My children</div>
            <div className="space-y-1" role="group" aria-label="Select child">
              {data.children.map((child, i) => {
                const name = child.student.user.firstName ?? child.student.user.name ?? "Child";
                return (
                  <button
                    key={i}
                    onClick={() => setActiveChildIndex(i)}
                    aria-pressed={i === activeChildIndex}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left",
                      i === activeChildIndex
                        ? "bg-brand-blue/30 border border-brand-blue/60"
                        : "border border-transparent hover:bg-white/5"
                    )}
                  >
                    <span
                      className="w-8 h-8 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                      style={{ background: CHILD_COLORS[i % CHILD_COLORS.length] }}
                    >
                      {initials(child.student.user.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-cream/90 font-medium truncate">{name}</span>
                      <span className="block text-[10px] text-cream/40 truncate">
                        {child.currentLevel ? `Level ${child.currentLevel.code}` : "Not placed"}
                      </span>
                    </span>
                    <span className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      child.status === "EXCELLENT" || child.status === "ON_TRACK" ? "bg-brand-green"
                        : child.status === "NEEDS_REVIEW" ? "bg-gold"
                        : "bg-brand-red"
                    )} />
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setAddChildOpen(true)}
              className="w-full mt-2 px-3 py-2 border border-dashed border-cream/20 rounded-md text-[11px] text-cream/50 hover:text-cream/80 hover:border-cream/40 transition-colors text-center"
            >
              + Add child
            </button>
          </div>
        }
      />

      <main className="flex flex-col overflow-hidden">
        <DashboardTopbar
          title={activeChild ? `${activeChild.student.user.name} — Progress overview` : "Parent Overview"}
          subtitle={
            activeChild?.student?.lastActiveDate
              ? `Last active: ${formatDate(activeChild.student.lastActiveDate, "PPP 'at' p")}`
              : "Welcome to Eduyro"
          }
          action={
            <div className="flex gap-2">
              {/* Keep only the everyday action here — everything else lives in
                  the Parent Controls section (10-section simplicity rule). */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(`/print/${data.children[activeChildIndex]?.student?.id}`, "_blank")}
              >
                Print today's packet
              </Button>
            </div>
          }
          notificationCount={data.notifications.filter((n) => !n.isRead).length}
        />

        {/* ── Section tabs across the top (children live in the left sidebar
            under the parent — the two swapped per user preference). ── */}
        <div className="border-b border-border bg-white px-6 flex gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={s.id === "dashboard" ? "/parent" : `/parent?section=${s.id}`}
              className={cn(
                "px-3 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                section === s.id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-muted hover:text-ink"
              )}
            >
              <span className="mr-1">{s.icon}</span>{s.label}
            </Link>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {showDemo && (
            <div className="bg-gold-light border border-gold/40 text-gold-dark rounded-md p-3 text-xs">
              <strong>Demo view.</strong> Sample data shown.
            </div>
          )}

          {data.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-4xl mb-4">👨‍👩‍👧</div>
              <h3 className="font-serif text-xl font-bold mb-2">Add your first child</h3>
              <p className="text-sm text-muted mb-4 max-w-sm">
                Create an account for your child to get started with their personalized learning path.
              </p>
              <Button variant="primary" onClick={() => setAddChildOpen(true)}>
                + Add child →
              </Button>
            </div>
          ) : (
            <>
              {section === "dashboard" && (
                <>
                  {activeChild && <ChildOverviewCard child={activeChild} colorIndex={activeChildIndex} />}
                  <NotificationsCard notifications={data.notifications} />
                </>
              )}

              {section === "subjects" && activeChild?.student?.id && (
                <SubjectsManagerCard
                  key={activeChild.student.id}
                  studentId={activeChild.student.id}
                  childName={activeChild.student.user.firstName ?? activeChild.student.user.name ?? "your child"}
                />
              )}

              {section === "path" && <LearningPathCard child={activeChild} />}

              {section === "progress" && (
                <div className="grid lg:grid-cols-2 gap-5">
                  {activeChild && <ChildOverviewCard child={activeChild} colorIndex={activeChildIndex} />}
                  <AttendanceCard child={activeChild} />
                </div>
              )}

              {section === "improve" && <WeaknessChartCard child={activeChild} />}

              {section === "history" && <PracticeHistoryCard child={activeChild} />}

              {section === "achievements" && <AchievementsCard child={activeChild} />}

              {section === "goals" && <GoalsCard child={activeChild} />}

              {section === "controls" && (
                <>
                  <ParentControlsCard
                    studentId={activeChild?.student?.id}
                    onAddChild={() => setAddChildOpen(true)}
                    onRefresh={fetchDashboard}
                  />
                  <div className="grid lg:grid-cols-2 gap-5">
                    <RecentPdfsCard pdfs={activeChild?.recentPdfs ?? []} />
                    <PrivacyCard />
                  </div>
                </>
              )}

              {section === "subscription" && (
                <BillingCard subscription={data.subscription} childCount={data.children.length} />
              )}
            </>
          )}
        </div>
      </main>

      <ReportProblemButton />

      {/* Add Child Modal */}
      <AddChildModal
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        onSuccess={() => {
          setAddChildOpen(false);
          fetchDashboard();
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Vacation pack — print the next N days ahead so a child can keep
// working on paper while away from interactive practice.
// ─────────────────────────────────────────────────────────────

function VacationPackButton({ studentId }: { studentId?: string }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(5);
  if (!studentId) return null;
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Print upcoming (vacation)</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Print upcoming sessions" description="Going away? Print the next several days of work so your child can keep practicing on paper. The work continues right where they left off." size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">How many days to print?</label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={14} value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} className="flex-1 accent-brand-blue" />
              <span className="text-sm font-semibold w-16 text-right">{days} day{days === 1 ? "" : "s"}</span>
            </div>
            <p className="text-[11px] text-muted mt-1">{days * 3} worksheets + {days * 3} answer keys = {days * 6} pages.</p>
          </div>
          <Button variant="primary" fullWidth onClick={() => { window.open(`/print/${studentId}/upcoming?days=${days}`, "_blank"); setOpen(false); }}>
            Open printable pack →
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Skip sessions — PARENT ONLY. Excuse a date range (e.g. vacation / sick days):
// no missed-day or streak penalty, and the curriculum advances so the skipped
// sheets aren't repeated. Students have no equivalent control.
// ─────────────────────────────────────────────────────────────

function SkipSessionsButton({ studentId, onDone }: { studentId?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!studentId) return null;

  const submit = async () => {
    setError(null);
    if (end < start) return setError("End date must be on or after the start date.");
    setBusy(true);
    try {
      const res = await fetch(`/api/parents/me/children/${studentId}/skip-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Couldn't skip those sessions."); setBusy(false); return; }
      setOpen(false); setBusy(false);
      onDone();
    } catch {
      setError("Network error — please try again."); setBusy(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Skip sessions</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Skip sessions" description="Excuse a range of days — for a vacation or a sick break. Those days won't count as missed and won't break the streak, and your child's curriculum simply continues where it left off afterwards." size="sm">
        {error && <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">{error}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="From" type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} />
            <Input label="To" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="bg-cream-dark rounded-lg p-3 text-xs text-muted leading-relaxed">
            Only you (the parent) can skip sessions — your child can't skip their own work. Past days can't be skipped.
          </div>
          <Button variant="primary" fullWidth onClick={submit} loading={busy}>Skip these days →</Button>
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Add Child Modal
// ─────────────────────────────────────────────────────────────

function AddChildModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live age (for the COPPA reassurance note shown to the parent).
  const age = (() => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  })();

  async function handleSubmit() {
    setError(null);
    if (!firstName.trim()) return setError("First name is required");
    if (!lastName.trim()) return setError("Last name is required");
    if (!dob) return setError("Date of birth is required");
    if (age === null) return setError("Please enter a valid date of birth");
    if (new Date(dob) > new Date()) return setError("Date of birth can't be in the future");
    if (age < 2 || age > 120) return setError("Please enter a realistic date of birth");
    if (!email.includes("@")) return setError("Valid email is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return setError("Password must have at least one uppercase letter");
    if (!/[0-9]/.test(password)) return setError("Password must have at least one number");
    if (!consent) return setError("Please confirm you are this child's parent/guardian and accept the Terms & Privacy Policy on their behalf");

    setLoading(true);
    try {
      const res = await fetch("/api/parents/me/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, grade: grade || undefined, dateOfBirth: dob, acceptedTerms: consent }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to create account");
        setLoading(false);
        return;
      }
      // Reset form
      setFirstName(""); setLastName(""); setEmail(""); setPassword(""); setGrade(""); setDob("");
      // Redirect to Stripe checkout for first child
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
        return;
      }
      onSuccess();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a child" description="Create a login for your child so they can access their daily worksheets." size="md">
      {error && (
        <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Kai" />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Liu" />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-ink">Grade / Year</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-md text-sm bg-white outline-none focus:border-brand-blue"
          >
            <option value="">Select grade…</option>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        <Input
          label="Child's date of birth"
          type="date"
          value={dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDob(e.target.value)}
          hint={age !== null && age < 13
            ? "Under 13 — by adding your child you're providing verifiable parental consent (COPPA)."
            : "Used to set age-appropriate content."}
        />

        <Input
          label="Child's email (used to sign in)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kai@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
        />

        <div className="bg-cream-dark rounded-lg p-3 text-xs text-muted leading-relaxed">
          💡 Share these login details with your child so they can sign in at <strong>eduyro.com</strong> and start their placement test.
        </div>

        <label className="flex items-start gap-2 text-xs text-ink leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-brand-blue"
          />
          <span>
            I confirm I am {firstName ? `${firstName}'s` : "this child's"} parent or legal guardian and, on their behalf, I agree to the{" "}
            <a href="/terms" target="_blank" className="text-brand-blue hover:underline">Terms of Service</a> and{" "}
            <a href="/privacy" target="_blank" className="text-brand-blue hover:underline">Privacy Policy</a>
            {age !== null && age < 16 ? ", and I provide verifiable parental consent to create their account." : "."}
          </span>
        </label>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          loading={loading}
          disabled={!consent}
        >
          Create child account →
        </Button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state for new parents
// ─────────────────────────────────────────────────────────────

function EmptyParentDashboard({ onAddChild, addChildOpen, setAddChildOpen, onChildAdded }: {
  onAddChild: () => void;
  addChildOpen: boolean;
  setAddChildOpen: (v: boolean) => void;
  onChildAdded: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream-dark flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center bg-white border border-border rounded-2xl p-8 shadow-card">
        <div className="w-16 h-16 mx-auto bg-gold-light rounded-full flex items-center justify-center text-2xl mb-4">
          👋
        </div>
        <h1 className="font-serif text-2xl font-bold mb-3">Welcome to Eduyro</h1>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Get started by creating an account for your child. They'll take a short placement test and get a personalized daily worksheet packet.
        </p>
        <Button variant="primary" fullWidth size="lg" onClick={onAddChild}>
          + Add your first child →
        </Button>
        <p className="text-xs text-muted mt-4">
          Questions? <a href="mailto:support@eduyro.com" className="text-brand-blue hover:underline">Email support</a>
        </p>
      </div>

      <AddChildModal
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        onSuccess={onChildAdded}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function ChildOverviewCard({ child, colorIndex }: { child: ChildSummary; colorIndex: number }) {
  // Each status explains ITSELF (user: "I don't know what on track means").
  const statusConfig = {
    EXCELLENT: { label: "Excellent", color: "green", explain: "Averaging 90%+ over the last 2 weeks." },
    ON_TRACK: { label: "On track", color: "blue", explain: "Averaging 85%+ and practising most days over the last 2 weeks." },
    NEEDS_REVIEW: { label: "Needs review", color: "gold", explain: "Recent average is below 85%, or several practice days were missed." },
    NEEDS_SUPPORT: { label: "Needs support", color: "red", explain: "Recent average is below 75% — worth sitting with them for the next session." },
  }[child.status];

  // Plain-language "what happened today → what happens tomorrow".
  const firstName = child.student.user.firstName ?? child.student.user.name?.split(" ")[0] ?? "Your child";
  const ts = child.todayStory;
  const story = (() => {
    if (!ts) return null;
    const lesson = ts.lessonLabel ? `“${ts.lessonLabel}”` : `this ${ts.subjectName ?? ""} lesson`;
    // Two different reasons a lesson repeats — saying "below the bar" when the
    // average is ABOVE it reads as a mistake to a parent.
    if (ts.outcome === "repeat" && (ts as any).slowToday) return {
      icon: "⏱️", tone: "text-gold-dark bg-gold-light/50 border-gold/40",
      text: `${firstName} got ${ts.avgToday}% on ${lesson} today — accuracy is there, speed isn't yet. Basic facts should be recalled in a few seconds, not worked out, so this lesson repeats tomorrow to build that speed.`,
    };
    if (ts.outcome === "repeat") return {
      icon: "🔁", tone: "text-gold-dark bg-gold-light/50 border-gold/40",
      text: `Today's average was ${ts.avgToday}% — below the ${ts.bar}% needed, so ${firstName} will repeat ${lesson} tomorrow. Repeat days are how mastery is built — nothing is wrong.`,
    };
    if (ts.outcome === "advance") return {
      icon: "✅", tone: "text-brand-green bg-brand-green/5 border-brand-green/30",
      text: `Cleared ${lesson} today at ${ts.avgToday}% — tomorrow unlocks the next lesson${ts.nextLessonLabel ? `: “${ts.nextLessonLabel}”` : ""}.`,
    };
    return {
      icon: "📘", tone: "text-ink/80 bg-cream-dark/40 border-border",
      text: `${ts.doneToday} of ${ts.perDay} sheets done today on ${lesson}${ts.avgToday != null ? ` (average so far ${ts.avgToday}%)` : ""}. ${firstName} needs ${ts.bar}%+ across all ${ts.perDay} to unlock the next lesson.`,
    };
  })();

  return (
    <Card className="grid grid-cols-[auto_1fr_auto] gap-6 items-center">
      <div
        className="w-14 h-14 rounded-full text-white text-lg font-semibold flex items-center justify-center"
        style={{ background: CHILD_COLORS[colorIndex % CHILD_COLORS.length] }}
      >
        {initials(child.student.user.name)}
      </div>
      <div>
        <h3 className="font-serif text-lg font-bold">{child.student.user.name}</h3>
        <p className="text-xs text-muted">
          {child.student.grade ?? "Grade"} ·{" "}
          {child.currentLevel
            ? `${child.currentLevel.subject?.name} · Level ${child.currentLevel.code} — ${child.currentLevel.name}`
            : "Not placed yet — take placement test"}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {child.currentLevel && <Badge variant="blue">Level {child.currentLevel.code}</Badge>}
          <Badge variant="gold">🔥 {child.streakDays}-day streak</Badge>
          {child.todayAccuracyPct != null && (
            <Badge variant={child.todayAccuracyPct >= 90 ? "green" : "gold"}>{Math.round(child.todayAccuracyPct)}% today</Badge>
          )}
          <span title={statusConfig.explain} className="cursor-help">
            <Badge variant={statusConfig.color as any}>{statusConfig.label} ⓘ</Badge>
          </span>
        </div>
        <p className="text-[11px] text-muted mt-1">{statusConfig.explain}</p>
        {child.todayStory?.lessonLabel && (
          <p className="text-[11px] text-muted mt-0.5">
            Current lesson: <span className="font-semibold text-ink/80">{child.todayStory.lessonLabel}</span>
            {child.todayStory.lessonPos ? ` — lesson ${child.todayStory.lessonPos} of ${child.todayStory.lessonTotal} in ${child.currentLevel?.code}` : ""}
          </p>
        )}
        {story && (
          <div className={`mt-2 flex items-start gap-2 text-sm rounded-lg border px-3 py-2 ${story.tone}`}>
            <span aria-hidden>{story.icon}</span>
            <span className="leading-snug">{story.text}</span>
          </div>
        )}
      </div>
      <div className="hidden md:flex gap-6">
        <div className="text-center">
          <div className="font-serif text-xl font-bold">{child.student.totalSheetsCompleted}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Sheets done</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-xl font-bold">{child.weeklyCompletionRate}%</div>
          <div className="text-[10px] text-muted uppercase tracking-wider mt-0.5">Weekly target</div>
        </div>
      </div>
    </Card>
  );
}

interface ManagedSubject {
  subjectId: string;
  slug: string;
  name: string;
  iconEmoji: string | null;
  enabled: boolean;
  placementStatus: string | null;
  placedLevelCode: string | null;
}

// Parent-only control over which subjects a child can see. Subjects are included
// in the subscription — toggling is free. All on by default; turning one OFF
// instantly removes it from the child's dashboard (Kumon-style focus). The child
// can never enrol themselves.
function SubjectsManagerCard({ studentId, childName }: { studentId: string; childName: string }) {
  const [subjects, setSubjects] = useState<ManagedSubject[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/parents/me/children/${studentId}/subjects`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j?.success) setSubjects(j.data.subjects); })
      .catch(() => { if (!cancelled) setError("Couldn't load subjects."); });
    return () => { cancelled = true; };
  }, [studentId]);

  async function toggle(s: ManagedSubject, next: boolean) {
    setSaving(s.slug);
    setError(null);
    // Optimistic update
    setSubjects((prev) => prev?.map((x) => (x.slug === s.slug ? { ...x, enabled: next } : x)) ?? prev);
    try {
      const res = await fetch(`/api/parents/me/children/${studentId}/subjects`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: s.slug, enabled: next }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error ?? "Failed");
    } catch (e: any) {
      // Roll back on failure
      setSubjects((prev) => prev?.map((x) => (x.slug === s.slug ? { ...x, enabled: !next } : x)) ?? prev);
      setError(e.message ?? "Couldn't update subject.");
    } finally {
      setSaving(null);
    }
  }

  const enabledCount = subjects?.filter((s) => s.enabled).length ?? 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Subjects</h3>
        {subjects && <span className="text-[11px] text-muted">{enabledCount} of {subjects.length} on</span>}
      </div>
      <p className="text-[11px] text-muted mb-3 leading-relaxed">
        Choose which subjects {childName} can access. All subjects are included in your plan — turn one off to help them focus.
      </p>

      {error && <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-xs rounded-md p-2 mb-3">{error}</div>}

      {!subjects ? (
        <div className="text-xs text-muted py-4 text-center">Loading subjects…</div>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => {
            const status = !s.enabled
              ? "Hidden from dashboard"
              : s.placedLevelCode
              ? `Placed · Level ${s.placedLevelCode}`
              : s.placementStatus === "IN_PROGRESS"
              ? "Placement in progress"
              : "Needs placement";
            return (
              <div
                key={s.subjectId}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 border rounded-lg transition-colors",
                  s.enabled ? "border-border bg-white" : "border-border bg-cream-dark opacity-70"
                )}
              >
                <span className="text-lg">{s.iconEmoji ?? "📚"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted">{status}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={s.enabled}
                  aria-label={`${s.enabled ? "Disable" : "Enable"} ${s.name} for ${childName}`}
                  disabled={saving === s.slug}
                  onClick={() => toggle(s, !s.enabled)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50",
                    s.enabled ? "bg-brand-green" : "bg-border"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      s.enabled && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            );
          })}
          {enabledCount === 0 && (
            <div className="text-[11px] text-gold-dark bg-gold-light border border-gold/30 rounded-md p-2 mt-1">
              ⚠ No subjects are enabled — {childName}'s dashboard will be empty until you turn one on.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function RecentPdfsCard({ pdfs }: { pdfs: any[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Recent PDFs</h3>
      </div>
      {pdfs.length === 0 ? (
        <EmptyState title="No PDFs yet" description="Generate your first packet to see it here." />
      ) : (
        <div className="space-y-2">
          {pdfs.slice(0, 4).map((p) => (
            <a key={p.id} href={p.fileUrl} className="flex items-center gap-2.5 px-3 py-2 border border-border rounded-lg hover:border-brand-blue transition-colors group">
              <div className="w-8 h-8 rounded bg-brand-red-light text-brand-red text-[9px] font-bold flex items-center justify-center flex-shrink-0">PDF</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{p.fileKey?.split("/").pop() ?? "Packet"}</div>
                <div className="text-[10px] text-muted">{formatDate(p.createdAt, "MMM d")} · {p.sheetCount} pages</div>
              </div>
              <span className="text-brand-blue text-sm group-hover:translate-x-0.5 transition-transform">↓</span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

function WeaknessChartCard({ child }: { child?: ChildSummary }) {
  const skills = child?.weakSkills ?? [];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-1">Skill accuracy breakdown</h3>
      <div className="text-[11px] text-muted mb-3">
        {child?.currentLevel ? `Level ${child.currentLevel.code} — ${child.currentLevel.name}` : "—"}
      </div>
      <div className="space-y-2">
        {skills.length === 0 ? (
          <EmptyState title="No data yet" description="Complete a few sheets to see skill analysis." className="py-6" />
        ) : (
          skills.map((s, i) => {
            const color = s.accuracyPct >= 90 ? "#2D6A3F" : s.accuracyPct >= 75 ? "#C8902A" : "#C23B22";
            return (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="min-w-[100px] truncate">{s.skillName}</span>
                <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.accuracyPct}%`, background: color }} />
                </div>
                <span className="font-semibold" style={{ color }}>{Math.round(s.accuracyPct)}%</span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function AttendanceCard({ child }: { child?: ChildSummary }) {
  const days = child?.attendanceLastMonth ?? [];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">
        Attendance — {new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
      </h3>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d, i) => (
          <div key={i} className="text-[10px] text-muted text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const color = d.status === "COMPLETE" ? "bg-brand-green"
            : d.status === "MISSED" ? "bg-brand-red"
            : d.status === "EXCUSED" ? "bg-brand-blue"
            : d.status === "WEEKEND" ? "bg-border"
            : "bg-cream-dark border border-border";
          return <div key={i} className={cn("aspect-square rounded-sm", color)} title={`${d.date}${d.status === "EXCUSED" ? " · excused" : ""}`} />;
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-muted flex-wrap items-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-brand-green rounded-sm" /> Complete</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-brand-red rounded-sm" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-brand-blue rounded-sm" /> Excused</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-border rounded-sm" /> Weekend</span>
      </div>
    </Card>
  );
}

function NotificationsCard({ notifications }: { notifications: any[] }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Notifications</h3>
      {notifications.length === 0 ? (
        <EmptyState title="All caught up" description="No new notifications" />
      ) : (
        <div className="space-y-2">
          {notifications.slice(0, 4).map((n) => {
            const color = n.type === "LEVEL_ADVANCED" || n.type === "PAYMENT_SUCCESS" ? "border-l-brand-green"
              : n.type === "PAYMENT_FAILED" ? "border-l-brand-red"
              : "border-l-brand-blue";
            const icon = n.type === "LEVEL_ADVANCED" ? "🎉"
              : n.type === "STREAK_MILESTONE" ? "🔥"
              : n.type === "PAYMENT_FAILED" ? "⚠️"
              : "📋";
            return (
              <div key={n.id} className={cn("flex gap-2.5 p-2.5 bg-cream-dark rounded-md border-l-[3px]", color)}>
                <span className="text-sm flex-shrink-0">{icon}</span>
                <div>
                  <div className="text-xs leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-muted mt-1">{formatDate(n.createdAt, "MMM d 'at' p")}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function BillingCard({ subscription, childCount }: { subscription: any; childCount: number }) {
  const plan = subscription?.plan ?? "FREE";
  const isPremium = plan !== "FREE";
  // Real pricing model (PLANS.PREMIUM): $9.99 first child + $5.99 each additional.
  // Compute in CENTS — float math printed "$39.940000000000005/mo" for 6 kids.
  const monthlyTotalCents = 999 + Math.max(0, childCount - 1) * 599;
  const planPrice = isPremium ? (monthlyTotalCents / 100).toFixed(2) : null;

  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Subscription & billing</h3>
      <div className={cn(
        "rounded-lg p-3 mb-3 flex justify-between items-center border",
        isPremium ? "bg-brand-green-light border-brand-green/30" : "bg-cream-dark border-border"
      )}>
        <div>
          <div className={cn("text-sm font-semibold", isPremium ? "text-brand-green" : "text-ink")}>
            {isPremium ? `${plan.charAt(0) + plan.slice(1).toLowerCase()} Plan` : "No active plan"} · {childCount} {childCount === 1 ? "child" : "children"}
          </div>
          <div className={cn("text-[11px] mt-0.5", isPremium ? "text-brand-green/80" : "text-muted")}>
            {subscription?.currentPeriodEnd
              ? `Next billing: ${formatDate(subscription.currentPeriodEnd, "MMM d, yyyy")}`
              : "Start your 7-day free trial"}
          </div>
        </div>
        <div className={cn("font-serif text-xl font-bold", isPremium ? "text-brand-green" : "text-ink")}>
          {planPrice ? `$${planPrice}/mo` : "Free trial"}
        </div>
      </div>

      {!isPremium && (
        <div className="mb-3">
          <button
            onClick={async () => {
              const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  plan: "PREMIUM",
                  successUrl: `${window.location.origin}/parent?subscribed=1`,
                  cancelUrl: `${window.location.origin}/parent`,
                }),
              });
              const data = await res.json();
              if (data.success && data.data.checkoutUrl) {
                window.location.href = data.data.checkoutUrl;
              } else {
                alert(data.error ?? "Couldn't start checkout. Please email support@eduyro.com.");
              }
            }}
            className="w-full flex justify-between items-center px-3 py-2.5 border border-border rounded-lg hover:border-brand-blue hover:bg-brand-blue-light transition-all text-sm text-left"
          >
            <span className="font-medium">
              Premium — fresh daily practice, every subject
              <span className="block text-[11px] text-muted font-normal mt-0.5">
                $9.99/mo first child · +$5.99 each additional · 7-day free trial
              </span>
            </span>
            <span className="text-brand-blue font-semibold whitespace-nowrap">
              {childCount > 1 ? `$${(monthlyTotalCents / 100).toFixed(2)}/mo` : "$9.99/mo"} →
            </span>
          </button>
        </div>
      )}

      {isPremium && (
        <Button
          variant="secondary"
          fullWidth
          onClick={async () => {
            try {
              const res = await fetch("/api/billing/portal", { method: "POST" });
              const data = await res.json();
              if (data.success && data.data.portalUrl) {
                window.location.href = data.data.portalUrl;
              } else {
                alert("Couldn't open billing portal. Please email support@eduyro.com.");
              }
            } catch {
              alert("Couldn't reach the billing portal. Please email support@eduyro.com.");
            }
          }}
        >
          Manage subscription →
        </Button>
      )}
    </Card>
  );
}

// Privacy & data rights (GDPR / CCPA / PIPEDA / APPI / PIPA / PIPL): every
// account can download its data and delete itself — worldwide requirements.
function PrivacyCard() {
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <h3 className="font-serif text-lg font-bold mb-1.5">Privacy & your data</h3>
      <p className="text-xs text-muted mb-3">
        Download everything we store about you and your children, or permanently delete your
        account and all of its data. See our <a href="/privacy" className="text-brand-blue hover:underline">privacy policy</a>.
      </p>
      <div className="flex flex-col gap-2">
        <a href="/api/account/export" download>
          <Button variant="secondary" size="sm" fullWidth>Download my data (JSON)</Button>
        </a>
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          disabled={busy}
          onClick={async () => {
            const phrase = prompt(
              'This permanently deletes your account, your children\'s accounts, and ALL learning history. Any subscription is cancelled immediately.\n\nType DELETE MY ACCOUNT to confirm:'
            );
            if (phrase !== "DELETE MY ACCOUNT") return;
            setBusy(true);
            try {
              const res = await fetch("/api/account/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirm: phrase }),
              });
              const j = await res.json();
              if (j.success) window.location.href = "/";
              else alert(j.error ?? "Deletion failed — please email support@eduyro.com.");
            } catch {
              alert("Deletion failed — please email support@eduyro.com.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <span className="text-brand-red">Delete my account…</span>
        </Button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// ── 🛤 Learning Path — the level's lesson map with the child's position ──────
function LearningPathCard({ child }: { child?: ChildSummary | null }) {
  const lp = child?.learningPath;
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-1">Learning path</h3>
      {!lp ? (
        <p className="text-sm text-muted">Take the placement test to start a learning path.</p>
      ) : (
        <>
          <p className="text-xs text-muted mb-4">
            Level <strong>{lp.levelCode}</strong> — {lp.levelName}
            {lp.lessons.length > 0 && <> · lesson {lp.currentIndex + 1} of {lp.lessons.length}</>}
          </p>
          {lp.lessons.length === 0 ? (
            <p className="text-sm text-muted">This subject progresses by mastering each skill (see the Subjects and Progress sections).</p>
          ) : (
            <ol className="space-y-1.5">
              {lp.lessons.map((label, i) => (
                <li key={i} className={cn(
                  "flex items-center gap-2.5 text-sm rounded-md px-2.5 py-1.5",
                  i < lp.currentIndex ? "text-muted" : i === lp.currentIndex ? "bg-brand-blue/10 border border-brand-blue/30 font-medium" : "text-muted/70"
                )}>
                  <span className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                    i < lp.currentIndex ? "bg-brand-green text-white" : i === lp.currentIndex ? "bg-brand-blue text-white" : "bg-cream-dark text-muted"
                  )}>
                    {i < lp.currentIndex ? "✓" : i + 1}
                  </span>
                  {label}
                  {i === lp.currentIndex && <Badge variant="blue">current</Badge>}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </Card>
  );
}

// ── 📝 Practice History — recent completed sheets with scores ────────────────
function PracticeHistoryCard({ child }: { child?: ChildSummary | null }) {
  const sheets = child?.recentSheets ?? [];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Practice history</h3>
      {sheets.length === 0 ? (
        <p className="text-sm text-muted">No completed sheets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="py-2">Date</th><th>Sheet</th><th>Level</th><th>Score</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sheets.map((s, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 text-xs text-muted whitespace-nowrap">{formatDate(s.completedAt as any, "MMM d, p")}</td>
                  <td className="text-xs">{s.title}</td>
                  <td className="text-xs text-muted">{s.levelCode}</td>
                  <td>
                    <span className={cn("text-xs font-semibold", s.accuracyPct >= 90 ? "text-brand-green" : s.accuracyPct >= 70 ? "text-gold-dark" : "text-brand-red")}>
                      {Math.round(s.accuracyPct)}%
                    </span>
                  </td>
                  <td className="text-xs text-muted">{s.timeSeconds ? `${Math.floor(s.timeSeconds / 60)}:${String(s.timeSeconds % 60).padStart(2, "0")}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── 🏆 Achievements — earned badges ──────────────────────────────────────────
function AchievementsCard({ child }: { child?: ChildSummary | null }) {
  const badges = child?.badges ?? [];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Achievements</h3>
      {badges.length === 0 ? (
        <p className="text-sm text-muted">No badges yet — they're earned through streaks, perfect scores and mastered lessons.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((b, i) => (
            <div key={i} className="flex items-start gap-3 border border-border rounded-lg p-3">
              <div className="text-2xl">{b.iconEmoji}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{b.name}</div>
                <div className="text-xs text-muted">{b.description}</div>
                <div className="text-[10px] text-muted mt-1">{formatDate(b.earnedAt as any, "MMM d, yyyy")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── 🎯 Goals — daily target, mastery bar, streaks ────────────────────────────
function GoalsCard({ child }: { child?: ChildSummary | null }) {
  const g = child?.goals;
  if (!g) return <Card><p className="text-sm text-muted">No goals yet — complete placement first.</p></Card>;
  const items = [
    { icon: "📄", label: "Daily practice", value: `${g.sheetsPerDay} sheets / day`, note: "Complete the daily packet to advance one lesson." },
    { icon: "🎯", label: "Mastery bar", value: `${g.masteryThresholdPct}%+ average`, note: "The daily average needed to unlock the next lesson." },
    { icon: "🔥", label: "Current streak", value: `${g.streakDays} day${g.streakDays === 1 ? "" : "s"}`, note: `Best ever: ${g.bestStreak} days.` },
  ];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Goals</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.label} className="border border-border rounded-lg p-4">
            <div className="text-2xl mb-1.5">{it.icon}</div>
            <div className="text-xs uppercase tracking-wider text-muted">{it.label}</div>
            <div className="font-serif text-xl font-bold mt-0.5">{it.value}</div>
            <div className="text-xs text-muted mt-1.5">{it.note}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 👨‍👩‍👧 Parent Controls — account/family actions in one place ────────────────
function ParentControlsCard({ studentId, onAddChild, onRefresh }: { studentId?: string; onAddChild: () => void; onRefresh: () => void }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Parent controls</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onAddChild}>+ Add child</Button>
        <Button variant="secondary" size="sm" onClick={() => window.open(`/print/${studentId}`, "_blank")} disabled={!studentId}>Print today's packet</Button>
        <Button variant="secondary" size="sm" onClick={() => window.open(`/print/writing-prompt`, "_blank")}>Writing prompts</Button>
        <Button variant="secondary" size="sm" onClick={() => window.open(`/print/handwriting`, "_blank")}>Handwriting (W0)</Button>
        <Button variant="secondary" size="sm" onClick={() => window.open(`/print/fluency`, "_blank")}>Reading fluency</Button>
        <VacationPackButton studentId={studentId} />
        <SkipSessionsButton studentId={studentId} onDone={onRefresh} />
      </div>
      <p className="text-xs text-muted mt-3">
        Vacation pack prints the next few days of sheets ahead of time; skip sessions excuses days so they don't break the streak.
      </p>
    </Card>
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// Suspense boundary required by Next.js 14 for useSearchParams
export default function ParentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ParentDashboardInner />
    </Suspense>
  );
}
