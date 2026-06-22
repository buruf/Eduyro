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

function ParentDashboardInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const showDemo = searchParams.get("demo") === "1";

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

  if (loading && !showDemo) {
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
        items={[
          { href: "/parent", label: "Overview", icon: "📊", active: true },
        ]}
        footerContent={
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-cream/40 mb-2">My children</div>
              <div className="space-y-1">
                {data.children.map((child, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChildIndex(i)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left",
                      i === activeChildIndex
                        ? "bg-brand-blue/30 border border-brand-blue/50"
                        : "border border-transparent hover:bg-white/5"
                    )}
                  >
                    <div
                      className="w-7 h-7 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                      style={{ background: CHILD_COLORS[i % CHILD_COLORS.length] }}
                    >
                      {initials(child.student.user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-cream/80 truncate">{child.student.user.firstName ?? child.student.user.name}</div>
                      <div className="text-[9px] text-cream/40 truncate">
                        {child.currentLevel ? `Lvl ${child.currentLevel.code}` : "Not placed"}
                      </div>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      child.status === "EXCELLENT" || child.status === "ON_TRACK" ? "bg-brand-green"
                        : child.status === "NEEDS_REVIEW" ? "bg-gold"
                        : "bg-brand-red"
                    )} />
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setAddChildOpen(true)}
              className="w-full px-3 py-2 border border-dashed border-cream/20 rounded-md text-[11px] text-cream/50 hover:text-cream/80 hover:border-cream/40 transition-colors text-center"
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAddChildOpen(true)}
              >
                + Add child
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`/print/writing-prompt`, "_blank")}
              >
                Writing prompts
              </Button>
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
              {activeChild && <ChildOverviewCard child={activeChild} colorIndex={activeChildIndex} />}

              {activeChild?.student?.id && (
                <SubjectsManagerCard
                  key={activeChild.student.id}
                  studentId={activeChild.student.id}
                  childName={activeChild.student.user.firstName ?? activeChild.student.user.name ?? "your child"}
                />
              )}

              <div className="grid lg:grid-cols-3 gap-5">
                <RecentPdfsCard pdfs={activeChild?.recentPdfs ?? []} />
                <WeaknessChartCard child={activeChild} />
                <AttendanceCard child={activeChild} />
              </div>

              <div className="grid lg:grid-cols-2 gap-5">
                <NotificationsCard notifications={data.notifications} />
                <BillingCard subscription={data.subscription} childCount={data.children.length} />
              </div>
            </>
          )}
        </div>
      </main>

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
// Add Child Modal
// ─────────────────────────────────────────────────────────────

function AddChildModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [dob, setDob] = useState("");
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

    setLoading(true);
    try {
      const res = await fetch("/api/parents/me/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, grade: grade || undefined, dateOfBirth: dob }),
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

        <Button
          variant="primary"
          fullWidth
          onClick={handleSubmit}
          loading={loading}
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
  const statusConfig = {
    EXCELLENT: { label: "Excellent", color: "green" },
    ON_TRACK: { label: "On track", color: "blue" },
    NEEDS_REVIEW: { label: "Needs review", color: "gold" },
    NEEDS_SUPPORT: { label: "Needs support", color: "red" },
  }[child.status];

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
            <Badge variant={child.todayAccuracyPct >= 95 ? "green" : "gold"}>{Math.round(child.todayAccuracyPct)}% today</Badge>
          )}
          <Badge variant={statusConfig.color as any}>{statusConfig.label}</Badge>
        </div>
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
            : d.status === "WEEKEND" ? "bg-border"
            : "bg-cream-dark border border-border";
          return <div key={i} className={cn("aspect-square rounded-sm", color)} title={d.date} />;
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-muted flex-wrap items-center">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-brand-green rounded-sm" /> Complete</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-brand-red rounded-sm" /> Missed</span>
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
  const monthlyTotal = 9.99 + Math.max(0, childCount - 1) * 5.99;
  const planPrice = isPremium ? monthlyTotal : 0;

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
          {planPrice > 0 ? `$${planPrice}/mo` : "Free trial"}
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
              Premium — unlimited daily practice
              <span className="block text-[11px] text-muted font-normal mt-0.5">
                $9.99/mo first child · +$5.99 each additional · 7-day free trial
              </span>
            </span>
            <span className="text-brand-blue font-semibold whitespace-nowrap">
              {childCount > 1 ? `$${monthlyTotal.toFixed(2)}/mo` : "$9.99/mo"} →
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

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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
