// src/app/(dashboard)/admin/platform/page.tsx
// Platform-owner admin (ADMIN / SUPER_ADMIN). Real data so it's never blank:
// business overview + Users / COPPA / Billing / System ops. Every privileged
// action hits an audited API.
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { DashboardTopbar } from "@/components/layout";
import { Card, StatCard, Badge, Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";

const TABS = ["Overview", "Insights", "Revenue", "Users", "Students", "Subjects", "Curriculum", "Schools", "COPPA", "Moderation", "Support", "Legal", "Webhooks", "Logs", "System"] as const;
type Tab = (typeof TABS)[number];

async function api(path: string, init?: RequestInit) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.success === false) throw new Error(j?.error ?? `Request failed (${r.status})`);
  return j.data ?? j;
}

export default function PlatformAdminPage() {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardTopbar title="Eduyro — Platform Admin" subtitle="Business · Users · Trust & Safety · Ops" />
      <div className="border-b border-border px-6 flex gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-3 text-sm font-medium border-b-2 -mb-px", tab === t ? "border-brand-blue text-brand-blue" : "border-transparent text-muted hover:text-ink")}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "Overview" && <Overview />}
        {tab === "Insights" && <Insights />}
        {tab === "Subjects" && <SubjectRelease />}
        {tab === "Curriculum" && <CurriculumBrowser />}
        {tab === "Logs" && <Logs />}
        {tab === "Revenue" && <Revenue />}
        {tab === "Users" && <Users />}
        {tab === "Students" && <Students />}
        {tab === "Schools" && <Schools />}
        {tab === "COPPA" && <Coppa />}
        {tab === "Moderation" && <Moderation />}
        {tab === "Support" && <Support />}
        {tab === "Legal" && <Legal />}
        {tab === "Webhooks" && <Webhooks />}
        {tab === "System" && <System />}
      </div>
    </div>
  );
}

// ── Tiny dependency-free bar chart ───────────────────────────────────────────
function TrendChart({ title, data, money }: { title: string; data: { date: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <Card>
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted">30d total: {money ? `$${(total / 100).toFixed(2)}` : total}</span>
      </div>
      <div className="flex items-end gap-[2px] h-20">
        {data.map((d) => (
          <div key={d.date} title={`${d.date}: ${money ? `$${(d.value / 100).toFixed(2)}` : d.value}`}
            className="flex-1 bg-brand-blue/70 rounded-t-sm min-h-[2px]"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
        ))}
      </div>
    </Card>
  );
}

// ── Insights: Progress Engine + Heat Map + subject analytics ─────────────────
function Insights() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api("/api/admin/insights").then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const e = d.engine;
  const heatColor = (pct: number) => pct >= 90 ? "bg-brand-green" : pct >= 80 ? "bg-gold" : "bg-brand-red";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Cleared their day today", e.passedToday, `of ${e.activeToday} active`],
          ["Repeating failed sheets (7d)", e.repeating7d, "below their level's bar"],
          ["Average mastery (30d)", `${e.avgMastery30d}%`, `${e.totalSheets30d} sheets`],
          ["Lowest-mastery skill", e.lowestMastery ? `${e.lowestMastery.skill}` : "—", e.lowestMastery ? `${e.lowestMastery.level} · ${e.lowestMastery.avgAccuracy}% avg` : ""],
        ].map(([t, v, s]) => (
          <Card key={String(t)}>
            <div className="text-xs uppercase tracking-wider text-muted">{t}</div>
            <div className="font-serif text-2xl font-bold mt-1">{v}</div>
            <div className="text-xs text-muted mt-0.5">{s}</div>
          </Card>
        ))}
      </div>
      {e.highestFailure && (
        <Card>
          <p className="text-sm"><strong>Highest failure rate:</strong> {e.highestFailure.skill} ({e.highestFailure.level}) — {e.highestFailure.failRatePct}% of {e.highestFailure.attempts} attempts land below the mastery bar.</p>
        </Card>
      )}
      <Card>
        <h3 className="text-sm font-semibold mb-1">Curriculum heat map <span className="font-normal text-muted">(last 30 days · red = students struggle)</span></h3>
        <div className="space-y-1.5 mt-3">
          {d.heatmap.slice(0, 40).map((h: any) => (
            <div key={`${h.level}-${h.skill}`} className="flex items-center gap-3 text-sm">
              <div className="w-64 truncate text-xs">{h.level} · {h.skill}</div>
              <div className="flex-1 bg-cream-dark rounded h-3.5 overflow-hidden">
                <div className={cn("h-full rounded", heatColor(h.avgAccuracy))} style={{ width: `${h.avgAccuracy}%` }} />
              </div>
              <div className="w-12 text-right text-xs font-semibold">{h.avgAccuracy}%</div>
              <div className="w-16 text-right text-[10px] text-muted">{h.attempts} att.</div>
            </div>
          ))}
          {d.heatmap.length === 0 && <p className="text-sm text-muted">No practice in the last 30 days.</p>}
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold mb-3">Subject analytics (30d)</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {d.subjects.map((s: any) => (
            <div key={s.slug} className="border border-border rounded-lg p-3">
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="text-xs text-muted mt-1 space-y-0.5">
                <div>Pass rate: <strong className="text-ink">{s.passRatePct}%</strong></div>
                <div>Avg accuracy: <strong className="text-ink">{s.avgAccuracy}%</strong></div>
                <div>Avg time: <strong className="text-ink">{s.avgMinutes ?? "—"} min</strong></div>
                <div>{s.sheets} sheets completed</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Read-only curriculum browser ─────────────────────────────────────────────
// Subject release switch — control which subjects parents can be offered.
// Maths is polished and public; the rest are released as each is finished.
function SubjectRelease() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => api("/api/admin/subjects").then(setD).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const toggle = async (sub: any) => {
    setBusy(sub.id); setErr(null);
    try {
      await api("/api/admin/subjects", { method: "PATCH", body: JSON.stringify({ id: sub.id, isPublic: !sub.isPublic }) });
      await load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  };
  if (err && !d) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs text-muted">Turning a subject off hides it from parents — it disappears from the subjects you can offer, from placement tests and from adding a child. <strong>Children already enrolled keep their subject and all their work</strong>, so this is safe to switch on and off while you polish a subject.</p>
      </Card>
      {err && <Card><p className="text-sm text-brand-red">{err}</p></Card>}
      {d.subjects.map((s: any) => (
        <Card key={s.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{s.iconEmoji} {s.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {s.isPublic ? "Offered to parents" : "Hidden from parents"}
                {s.enrolledStudents > 0 && ` · ${s.enrolledStudents} student${s.enrolledStudents === 1 ? "" : "s"} already enrolled (unaffected)`}
              </p>
            </div>
            <Button variant={s.isPublic ? "secondary" : "primary"} disabled={busy === s.id} onClick={() => toggle(s)}>
              {busy === s.id ? "Saving…" : s.isPublic ? "Hide from parents" : "Offer to parents"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CurriculumBrowser() {
  const [d, setD] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api("/api/admin/curriculum").then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const bySubject: Record<string, any[]> = {};
  for (const l of d.levels) (bySubject[l.subject] ??= []).push(l);
  return (
    <div className="space-y-5">
      <Card><p className="text-xs text-muted">Read-only: the curriculum is generated by validated, version-controlled engines — content changes happen in code with automated answer audits, never live edits.</p></Card>
      {Object.entries(bySubject).map(([subject, levels]) => (
        <Card key={subject}>
          <h3 className="text-sm font-semibold mb-3">{subject}</h3>
          <div className="space-y-1.5">
            {levels.map((l: any) => (
              <div key={l.code} className="border border-border rounded-lg">
                <button onClick={() => setOpen(open === l.code ? null : l.code)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left">
                  <span className="text-muted w-4">{open === l.code ? "▾" : "▸"}</span>
                  <span className="font-medium w-14">{l.code}</span>
                  <span className="flex-1">{l.name}</span>
                  <span className="text-xs text-muted">{l.unitCount} units · {l.sheetsPerDay}/day · bar {l.masteryThresholdPct}%</span>
                </button>
                {open === l.code && (
                  <div className="border-t border-border px-4 py-2 bg-cream-dark/40">
                    <ol className="text-xs space-y-1 list-decimal list-inside">
                      {l.units.map((u: any, i: number) => (
                        <li key={i}>{u.label}{u.sheets ? <span className="text-muted"> — {u.sheets} sheets{u.range ? ` (${u.range[0]}–${u.range[1]})` : ""}</span> : null}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Audit-log viewer ─────────────────────────────────────────────────────────
function Logs() {
  const [d, setD] = useState<any>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  // Turn a raw audit row ("admin.student.set_skill · Student cmrk… · target
  // email") into a plain-English sentence the owner can actually read.
  const describeLog = (l: any): string => {
    const md = (l.metadata as any) ?? {};
    const who = md.email ? `${md.email}` : l.entityType === "Student" ? "a student" : (l.entityId ?? "");
    switch (String(l.action).replace(/^admin\./, "")) {
      case "student.set_skill": return `Reassigned ${who} to the lesson "${md.skillLabel ?? `#${md.skillIndex}`}" in level ${md.levelCode ?? "?"} — their next worksheets come from that lesson.`;
      case "student.assign_level": return `Moved ${who} to level ${md.levelCode ?? "?"} (fresh start on that level).`;
      case "student.reset_practice": return `Reset practice for ${who} (${md.levelCode === "ALL" || !md.levelCode ? "all levels" : `level ${md.levelCode}`}) — completed sheets cleared, fresh questions.`;
      case "student.set_daily_sheets": return md.dailySheets === "default"
        ? `Removed the extra-practice limit for ${who} (back to the level default).`
        : `Allowed ${who} up to ${md.dailySheets} practice sheets per day (${md.levelCode === "ALL" || !md.levelCode ? "all levels" : `level ${md.levelCode}`}).`;
      case "student.reset_placement": return `Cleared the placement test for ${who} — they'll be asked to place again.`;
      case "student.change_grade": return `Changed ${who}'s grade to ${md.grade ?? "?"}.`;
      case "user.suspend": return `Suspended the account ${who}.`;
      case "user.unsuspend": return `Re-activated the account ${who}.`;
      case "bug_report.resolve": return `Marked a bug report as resolved.`;
      case "bug_report.reopen": return `Reopened a bug report.`;
      default: {
        // Unknown action: prettify "admin.foo.bar_baz" → "foo: bar baz" + any email.
        const pretty = String(l.action).replace(/^admin\./, "").replace(/[._]/g, " ");
        return md.email ? `${pretty} — ${md.email}` : pretty;
      }
    }
  };
  const load = useCallback((query: string) => { api(`/api/admin/logs?q=${encodeURIComponent(query)}`).then(setD).catch(e => setErr(e.message)); }, []);
  useEffect(() => { load(""); }, [load]);
  if (err) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-md">
        <Input placeholder="Filter by action or entity id…" value={q} onChange={(e: any) => setQ(e.target.value)} />
        <Button size="sm" variant="secondary" onClick={() => load(q)}>Filter</Button>
      </div>
      <Card>
        {!d ? <p className="text-sm text-muted">Loading…</p> : d.logs.length === 0 ? <p className="text-sm text-muted">No log entries.</p> : (
          <div className="space-y-1.5">
            {d.logs.map((l: any) => {
              const s = describeLog(l);
              return (
                <div key={l.id} className="flex items-start gap-3 text-xs border-b border-border/60 pb-1.5">
                  <div className="w-36 text-muted whitespace-nowrap">{formatDate(l.createdAt, "MMM d, p")}</div>
                  <div className="flex-1">
                    <span className="font-medium">{s}</span>
                    {(l.metadata as any)?.actorEmail && <span className="text-muted"> — by {(l.metadata as any).actorEmail}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Overview() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api("/api/admin/platform/overview").then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="MRR (est.)" value={`$${d.revenue.mrrEstimate.toLocaleString()}`} />
        <StatCard label="Active subs" value={d.revenue.activeSubs} />
        <StatCard label="Trialing" value={d.revenue.trialingSubs} />
        <StatCard label="Trial→Paid" value={`${d.revenue.trialToPaidPct}%`} />
        <StatCard label="Total users" value={d.users.total} />
        <StatCard label="Students" value={d.users.students} />
        <StatCard label="Parents" value={d.users.parents} />
        <StatCard label="New (30d)" value={d.users.newLast30} />
        <StatCard label="Shop orders" value={d.shop.paidOrders} />
        <StatCard label="Shop revenue" value={`$${d.shop.revenue.toLocaleString()}`} />
        <StatCard label="Sheets today" value={d.activity.sheetsToday} />
        <StatCard label="Suspended" value={d.users.suspended} />
      </div>
      {d.trends && (
        <div className="grid md:grid-cols-3 gap-4">
          <TrendChart title="New registrations" data={d.trends.registrations} />
          <TrendChart title="Practice sheets / day" data={d.trends.practice} />
          <TrendChart title="Shop revenue / day" data={d.trends.shopRevenueCents} money />
        </div>
      )}
      {d.health && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">System health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ["Database", d.health.database],
              ["Stripe webhooks", d.health.stripeWebhooks, d.health.lastWebhookAt],
              ["PDF generation", d.health.pdfGeneration, d.health.lastPdfAt],
              ["Practice pipeline", d.health.lastPracticeAt ? "OK" : "IDLE", d.health.lastPracticeAt],
            ].map(([label, status, at]) => (
              <div key={String(label)} className="border border-border rounded-lg p-2.5">
                <div className="text-xs text-muted">{label}</div>
                <div className={cn("font-semibold", status === "OK" ? "text-brand-green" : status === "IDLE" ? "text-muted" : "text-brand-red")}>
                  {status === "OK" ? "✓ Healthy" : status === "IDLE" ? "— Idle" : "⚠ Degraded"}
                </div>
                {at ? <div className="text-[10px] text-muted mt-0.5">last: {formatDate(at as any, "MMM d, p")}</div> : null}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <h3 className="text-sm font-semibold mb-3">⚠ Needs attention</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Watch label="Pending COPPA consent" n={d.watch.pendingCoppa} danger={d.watch.pendingCoppa > 0} />
          <Watch label="Past-due subscriptions" n={d.watch.pastDueSubs} danger={d.watch.pastDueSubs > 0} />
          <Watch label="Failed/queued PDF exports" n={d.watch.failedPdfExports} danger={d.watch.failedPdfExports > 0} />
          <Watch label="Failed Stripe webhooks" n={d.watch.failedWebhooks ?? 0} danger={(d.watch.failedWebhooks ?? 0) > 0} />
        </div>
      </Card>
    </div>
  );
}
function Watch({ label, n, danger }: { label: string; n: number; danger: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3 flex justify-between items-center", danger ? "border-brand-red/30 bg-brand-red-light" : "border-border bg-cream-dark")}>
      <span>{label}</span><span className={cn("font-bold", danger ? "text-brand-red" : "text-ink")}>{n}</span>
    </div>
  );
}

function Revenue() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api("/api/admin/revenue").then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Card><p className="text-sm text-brand-red">Failed to load: {err}</p></Card>;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const maxSub = Math.max(1, ...d.trends.subscriptions.map((m: any) => Math.max(m.added, m.churned)));
  const maxShop = Math.max(1, ...d.trends.shop.map((m: any) => m.revenue));
  const net = d.subs.netLast30;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="MRR" value={`$${d.mrr.toLocaleString()}`} />
        <StatCard label="ARR (run-rate)" value={`$${d.arr.toLocaleString()}`} />
        <StatCard label="ARPU" value={`$${d.arpu.toLocaleString()}`} />
        <StatCard label="Billed children" value={d.billedChildren} />
        <StatCard label="Active subs" value={d.subs.active} />
        <StatCard label="Trialing" value={d.subs.trialing} />
        <StatCard label="Monthly churn" value={`${d.subs.churnRatePct}%`} />
        <StatCard label="Net subs (30d)" value={`${net >= 0 ? "+" : ""}${net}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold mb-1">Subscriber movement</h3>
          <p className="text-xs text-muted mb-3">New vs churned per month (last 6)</p>
          <div className="flex items-end gap-3 h-40">
            {d.trends.subscriptions.map((m: any) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 h-32 w-full justify-center">
                  <div className="w-2.5 rounded-t bg-brand-green" style={{ height: `${(m.added / maxSub) * 100}%` }} title={`${m.added} added`} />
                  <div className="w-2.5 rounded-t bg-brand-red" style={{ height: `${(m.churned / maxSub) * 100}%` }} title={`${m.churned} churned`} />
                </div>
                <span className="text-[10px] text-muted">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-muted mt-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-green inline-block" /> Added</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-brand-red inline-block" /> Churned</span>
            <span className="ml-auto">{d.subs.newLast30} new · {d.subs.churnedLast30} churned (30d)</span>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-1">Shop revenue</h3>
          <p className="text-xs text-muted mb-3">Per month (last 6)</p>
          <div className="flex items-end gap-3 h-40">
            {d.trends.shop.map((m: any) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="h-32 w-full flex items-end justify-center">
                  <div className="w-6 rounded-t bg-brand-blue" style={{ height: `${(m.revenue / maxShop) * 100}%` }} title={`$${m.revenue} · ${m.orders} orders`} />
                </div>
                <span className="text-[10px] text-muted">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-muted mt-2">
            <span>${d.shop.revenue30.toLocaleString()} last 30d</span>
            <span className="ml-auto">${d.shop.revenueTotal.toLocaleString()} all-time · AOV ${d.shop.aov}</span>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Active subscriptions by plan</h3>
        {Object.keys(d.planMix).length === 0 ? <p className="text-sm text-muted">No active subscriptions.</p> : (
          <div className="space-y-2">
            {Object.entries(d.planMix).sort((a: any, b: any) => b[1] - a[1]).map(([plan, n]: any) => (
              <div key={plan} className="flex items-center gap-3 text-sm">
                <span className="w-36 truncate">{plan}</span>
                <div className="flex-1 h-2 rounded-full bg-cream-dark overflow-hidden">
                  <div className="h-full bg-brand-blue" style={{ width: `${(n / d.subs.active) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-muted">{n}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const search = useCallback(async (query: string) => {
    try { const d = await api(`/api/admin/users?q=${encodeURIComponent(query)}`); setList(d.users); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { search(""); }, [search]);
  const openUser = async (id: string) => { try { const d = await api(`/api/admin/users/${id}`); setSel(d.user); } catch (e: any) { toast.error(e.message); } };
  const act = async (action: string, extra?: any) => {
    if (!sel) return;
    if ((action === "delete") && !confirm(`PERMANENTLY delete ${sel.email} and all their data? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const d = await api(`/api/admin/users/${sel.id}`, { method: "POST", body: JSON.stringify({ action, ...extra }) });
      if (d.tempPassword) toast.success(`Temp password: ${d.tempPassword}`, { duration: 12000 });
      else toast.success("Done");
      if (action === "delete") { setSel(null); }
      await openUser(sel.id).catch(() => {});
      await search(q);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const billing = async (action: string, extra?: any) => {
    if (!sel) return;
    if (action === "refund" && !confirm(`Refund the latest payment for ${sel.email}?`)) return;
    if (action === "cancel" && !confirm(`Cancel subscription for ${sel.email}?`)) return;
    setBusy(true);
    try { await api(`/api/admin/billing`, { method: "POST", body: JSON.stringify({ userId: sel.id, action, ...extra }) }); toast.success("Done"); await openUser(sel.id); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
      <Card>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Search email / name / id…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search(q)} />
          <Button size="sm" onClick={() => search(q)}>Search</Button>
        </div>
        <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
          {list.map(u => (
            <button key={u.id} onClick={() => openUser(u.id)} className="w-full text-left py-2.5 px-1 hover:bg-cream-dark flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{u.name ?? "—"} <span className="text-muted font-normal">{u.email}</span></div>
                <div className="text-[11px] text-muted">{u.role}{u.subscription ? ` · ${u.subscription.status}` : ""}{u.parent ? ` · ${u.parent._count.children} child(ren)` : ""}</div>
              </div>
              {u.suspendedAt && <Badge variant="red">suspended</Badge>}
            </button>
          ))}
          {list.length === 0 && <p className="text-sm text-muted py-4">No users.</p>}
        </div>
      </Card>
      <Card>
        {!sel ? <p className="text-sm text-muted">Select a user to view details & actions.</p> : (
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold">{sel.name ?? sel.email}</h3>
                <p className="text-xs text-muted">{sel.email} · {sel.role} · joined {formatDate(sel.createdAt, "MMM d, yyyy")}</p>
              </div>
              {sel.suspendedAt ? <Badge variant="red">Suspended</Badge> : <Badge variant="green">Active</Badge>}
            </div>
            {sel.subscription && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="font-medium mb-1">Subscription — {sel.subscription.plan} · {sel.subscription.status}{sel.subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => billing("cancel", { immediately: false })}>Cancel at period end</Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => billing("cancel", { immediately: true })}>Cancel now</Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => billing("refund")}>Refund latest</Button>
                </div>
              </div>
            )}
            {sel.student && <div className="text-xs text-muted">Student · grade {sel.student.grade ?? "—"} · {sel.student.totalSheetsCompleted} sheets · {sel.student.currentStreak}-day streak</div>}
            {sel.parent?.children?.length > 0 && <div className="text-xs text-muted">Parent of: {sel.parent.children.map((c: any) => c.student.user.name ?? c.student.user.email).join(", ")}</div>}
            <div className="border-t border-border pt-3 flex gap-2 flex-wrap">
              {sel.suspendedAt
                ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => act("unsuspend")}>Unsuspend</Button>
                : <Button size="sm" variant="secondary" disabled={busy} onClick={() => act("suspend", { reason: prompt("Reason for suspension?") ?? undefined })}>Suspend</Button>}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => act("reset-password")}>Reset password</Button>
              {/* Complimentary access — beta testers / friends & family use the
                  whole product free (no card) until the chosen date. */}
              {sel.role === "PARENT" && !sel.subscription?.stripeSubscriptionId && (
                sel.subscription?.status === "TRIALING" && sel.subscription?.trialEndsAt ? (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => act("revoke-comp")}>
                    End free access (until {formatDate(sel.subscription.trialEndsAt, "MMM d")})
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => {
                    const days = parseInt(prompt("Free access for how many days?", "30") ?? "", 10);
                    if (!days || days < 1) return;
                    act("grant-comp", { compUntil: new Date(Date.now() + days * 86400000).toISOString() });
                  }}>Grant free access</Button>
                )
              )}
              <Button size="sm" variant="red" disabled={busy} onClick={() => act("delete", { reason: prompt("Reason for deletion (DSAR/COPPA)?") ?? undefined })}>Delete account</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Coppa() {
  const [d, setD] = useState<any>(null);
  const load = useCallback(() => { api("/api/admin/coppa").then(setD).catch(e => toast.error(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const decide = async (requestId: string, action: "verify" | "revoke") => {
    try { await api("/api/admin/coppa", { method: "POST", body: JSON.stringify({ requestId, action }) }); toast.success("Updated"); load(); } catch (e: any) { toast.error(e.message); }
  };
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">Parental-consent queue · {d.pending} pending</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Child</th><th>Parent</th><th>Method</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {d.requests.map((r: any) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="py-2">{r.childFirstName}</td>
                <td>{r.parentFullName}<div className="text-[11px] text-muted">{r.parentEmail}</div></td>
                <td className="text-xs">{r.consentMethod}</td>
                <td><Badge variant={r.status === "VERIFIED" ? "green" : r.status === "PENDING" ? "gold" : "red"}>{r.status}</Badge></td>
                <td className="text-xs text-muted">{formatDate(r.createdAt, "MMM d")}</td>
                <td className="text-right whitespace-nowrap">
                  {r.status !== "VERIFIED" && <Button size="sm" variant="secondary" onClick={() => decide(r.id, "verify")}>Verify</Button>}{" "}
                  {r.status === "VERIFIED" && <Button size="sm" variant="secondary" onClick={() => decide(r.id, "revoke")}>Revoke</Button>}
                </td>
              </tr>
            ))}
            {d.requests.length === 0 && <tr><td colSpan={6} className="py-4 text-muted">No consent requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Students() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "struggling" | "inactive">("all");
  const [d, setD] = useState<any>(null);
  const [mng, setMng] = useState<any>(null);     // { id, name } being managed
  const [mngData, setMngData] = useState<any>(null); // { student, levels }
  const [selLevel, setSelLevel] = useState("");
  const [dailyN, setDailyN] = useState("");
  const [selSkill, setSelSkill] = useState(""); // "levelCode:index"
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (query: string, f: string) => {
    try { setD(await api(`/api/admin/students?q=${encodeURIComponent(query)}&filter=${f}`)); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { load(q, filter); /* eslint-disable-next-line */ }, [filter]);
  const openManage = async (s: any) => {
    setMng(s); setMngData(null); setSelLevel(""); setSelSkill("");
    try { setMngData(await api(`/api/admin/students/${s.id}`)); } catch (e: any) { toast.error(e.message); }
  };
  const doAction = async (action: "reset-practice" | "assign-level" | "set-daily-sheets" | "set-skill" | "reset-placement" | "change-grade", levelCode?: string, dailySheets?: number, skillIndex?: number, grade?: string) => {
    if (!mng) return;
    if (action === "reset-practice" && !confirm(`Reset ${mng.name ?? "this student"}'s practice${levelCode ? ` for ${levelCode}` : " (ALL levels)"}? Their completed sheets and progress for that scope are cleared; they'll get fresh questions.`)) return;
    if (action === "reset-placement" && !confirm(`Reset ${mng.name ?? "this student"}'s placement test? They'll retake it from scratch (practice progress is untouched).`)) return;
    setBusy(true);
    try {
      await api(`/api/admin/students/${mng.id}`, { method: "POST", body: JSON.stringify({ action, ...(levelCode ? { levelCode } : {}), ...(dailySheets !== undefined ? { dailySheets } : {}), ...(skillIndex !== undefined ? { skillIndex } : {}), ...(grade ? { grade } : {}) }) });
      toast.success(
        action === "assign-level" ? `Assigned to ${levelCode}`
        : action === "set-skill" ? `Skill unlocked on ${levelCode}`
        : action === "set-daily-sheets" ? (dailySheets ? `Daily practice set to ${dailySheets} sheets` : "Reverted to level default")
        : action === "reset-placement" ? "Placement test reset"
        : action === "change-grade" ? `Grade set to ${grade}`
        : `Practice reset (${levelCode ?? "ALL"})`);
      setMngData(await api(`/api/admin/students/${mng.id}`));
      await load(q, filter);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Students" value={d.summary.total} />
        <StatCard label="Active this week" value={d.summary.activeThisWeek} />
        <StatCard label="Struggling" value={d.summary.struggling} />
        <StatCard label="Inactive 7d+" value={d.summary.inactive} />
      </div>
      <Card>
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          <Input placeholder="Search name / email…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load(q, filter)} />
          <Button size="sm" onClick={() => load(q, filter)}>Search</Button>
          <div className="flex-1" />
          {(["all", "struggling", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 text-xs rounded-md border", filter === f ? "bg-ink text-cream border-ink" : "bg-white border-border hover:border-ink")}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Student</th><th>Grade</th><th>Sheets</th><th>Mastered</th><th>Avg acc.</th><th>Streak</th><th>Last active</th><th></th></tr></thead>
            <tbody>
              {d.students.map((s: any) => (
                <tr key={s.id} className={cn("border-b border-border/60", s.struggling && "bg-brand-red-light/40")}>
                  <td className="py-2"><div className="font-medium">{s.name ?? "—"}</div><div className="text-[11px] text-muted">{s.email}</div></td>
                  <td className="text-xs">{s.grade ?? "—"}</td>
                  <td className="text-xs">{s.totalSheets}</td>
                  <td className="text-xs">{s.mastered}<span className="text-muted"> / {s.mastered + s.inProgress}</span></td>
                  <td className="text-xs">{s.avgAccuracy == null ? "—" : <span className={cn(s.avgAccuracy < 60 ? "text-brand-red font-semibold" : s.avgAccuracy >= 85 ? "text-brand-green" : "")}>{s.avgAccuracy}%</span>}</td>
                  <td className="text-xs">{s.currentStreak}🔥</td>
                  <td className="text-xs text-muted">{s.lastActiveDate ? formatDate(s.lastActiveDate, "MMM d") : "never"}</td>
                  <td className="text-right whitespace-nowrap">{s.struggling && <Badge variant="red">struggling</Badge>}{s.inactive && !s.struggling && <Badge variant="gold">inactive</Badge>} <Button size="sm" variant="secondary" onClick={() => openManage(s)}>Manage</Button></td>
                </tr>
              ))}
              {d.students.length === 0 && <tr><td colSpan={8} className="py-4 text-muted">No students match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manage panel — reset practice / assign to a level */}
      {mng && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setMng(null)}>
          <div className="bg-white rounded-2xl shadow-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div><div className="font-serif text-lg font-bold">{mng.name ?? "Student"}</div><div className="text-xs text-muted">{mng.email}</div></div>
              <button className="text-muted hover:text-ink text-xl leading-none" onClick={() => setMng(null)}>×</button>
            </div>
            {!mngData ? <p className="text-sm text-muted">Loading…</p> : (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Current active levels</div>
                  {mngData.student.progress.length === 0 ? <p className="text-sm text-muted">None active.</p> : (
                    <ul className="text-sm space-y-1">{mngData.student.progress.map((p: any, i: number) => (
                      <li key={i}>{p.level.subject.name} · <strong>{p.level.code}</strong> {p.level.name} — {p.sheetsCompleted} sheets, {Math.round(p.lastAccuracyPct)}% · <span className="text-muted">{p.dailySheetsOverride ?? p.level.sheetsPerDay ?? 3}/day{p.dailySheetsOverride ? " (override)" : ""}</span></li>
                    ))}</ul>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Assign to a level</div>
                  <div className="flex gap-2">
                    <select value={selLevel} onChange={(e) => setSelLevel(e.target.value)} className="flex-1 border border-border rounded-md px-2 py-2 text-sm">
                      <option value="">Choose a level…</option>
                      {mngData.levels.map((l: any) => <option key={l.code} value={l.code}>{l.subject.name} · {l.code} — {l.name}</option>)}
                    </select>
                    <Button size="sm" disabled={!selLevel || busy} onClick={() => doAction("assign-level", selLevel)}>Assign</Button>
                  </div>
                  <p className="text-[11px] text-muted mt-1">Places the student on this level (starts fresh) and makes it their active level for that subject.</p>
                </div>

                {Object.keys(mngData.skillMaps ?? {}).length > 0 && (
                  <div className="border-t border-border pt-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Unlock a skill (math lesson)</div>
                    <div className="flex gap-2">
                      <select value={selSkill} onChange={(e) => setSelSkill(e.target.value)} className="flex-1 border border-border rounded-md px-2 py-2 text-sm">
                        <option value="">Choose a skill…</option>
                        {Object.entries(mngData.skillMaps as Record<string, { index: number; label: string }[]>).map(([code, units]) => {
                          const cur = mngData.student.progress.find((p: any) => p.level.code === code)?.currentSkillIndex ?? 0;
                          return (
                            <optgroup key={code} label={`${code} — current: ${units[cur]?.label ?? `#${cur + 1}`}`}>
                              {units.map((u) => (
                                <option key={`${code}:${u.index}`} value={`${code}:${u.index}`}>
                                  {u.index + 1}. {u.label}{u.index === cur ? "  ← current" : u.index < cur ? "  (done)" : ""}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      <Button size="sm" disabled={!selSkill || busy} onClick={() => { const [code, idx] = selSkill.split(":"); doAction("set-skill", code, undefined, parseInt(idx, 10)); }}>Unlock</Button>
                    </div>
                    <p className="text-[11px] text-muted mt-1">Jumps the student to this lesson immediately — today&apos;s packet serves it without waiting a day per lesson. Works forward (skip ahead) or backward (revisit).</p>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Daily practice sheets</div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input type="number" min={1} max={30} placeholder="e.g. 6" value={dailyN} onChange={(e) => setDailyN(e.target.value)} className="w-24 border border-border rounded-md px-2 py-2 text-sm" />
                    <Button size="sm" disabled={busy || !dailyN} onClick={() => doAction("set-daily-sheets", selLevel || undefined, Math.max(1, Math.min(30, parseInt(dailyN, 10) || 0)))}>{selLevel ? `Set for ${selLevel}` : "Set (ALL levels)"}</Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setDailyN(""); doAction("set-daily-sheets", selLevel || undefined, 0); }}>Reset to default</Button>
                  </div>
                  <p className="text-[11px] text-muted mt-1">How many practice sheets this student may do per day {selLevel ? `on ${selLevel}` : "across all levels"}. Raise-only: values below the level default (normally 3) are ignored, since advancing requires completing the default quota. "Reset to default" removes the override.</p>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Reset practice questions</div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => doAction("reset-practice", selLevel || undefined)}>{selLevel ? `Reset ${selLevel}` : "Reset ALL levels"}</Button>
                  </div>
                  <p className="text-[11px] text-muted mt-1">Clears this student's completed sheets + progress {selLevel ? `for ${selLevel}` : "across all levels"} so they get fresh questions. (Choose a level above to scope it; leave blank for all.) Shared worksheets are not deleted.</p>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Placement & grade</div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => doAction("reset-placement")}>Reset placement test</Button>
                    <select className="border border-border rounded-md px-2 py-1.5 text-sm bg-white" defaultValue="" onChange={(e) => { if (e.target.value) doAction("change-grade", undefined, undefined, undefined, e.target.value); }}>
                      <option value="" disabled>Change grade…</option>
                      {["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="text-[11px] text-muted">current: {mngData?.student?.grade ?? "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Schools() {
  const [q, setQ] = useState("");
  const [d, setD] = useState<any>(null);
  const load = useCallback(async (query: string) => {
    try { setD(await api(`/api/admin/schools?q=${encodeURIComponent(query)}`)); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { load(""); }, [load]);
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Schools" value={d.summary.total} />
        <StatCard label="Students (schools)" value={d.summary.totalStudents} />
        <StatCard label="Teachers" value={d.summary.totalTeachers} />
        <StatCard label="Over seat limit" value={d.summary.overSeat} />
      </div>
      <Card>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Search school name / slug…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load(q)} />
          <Button size="sm" onClick={() => load(q)}>Search</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">School</th><th>Plan</th><th>Students</th><th>Seats</th><th>Teachers</th><th>Subscription</th><th>Renews</th></tr></thead>
            <tbody>
              {d.schools.map((s: any) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-2"><div className="font-medium">{s.name}</div><div className="text-[11px] text-muted">{[s.city, s.province].filter(Boolean).join(", ") || s.slug}</div></td>
                  <td className="text-xs">{s.plan}</td>
                  <td className="text-xs">{s.students}</td>
                  <td className="text-xs">{s.seats == null ? "—" : <span className={cn(s.overSeat && "text-brand-red font-semibold")}>{s.seats}{s.overSeat ? " ⚠" : ""}</span>}</td>
                  <td className="text-xs">{s.teachers}</td>
                  <td>{s.subStatus ? <Badge variant={s.subStatus === "ACTIVE" ? "green" : s.subStatus === "TRIALING" ? "gold" : "red"}>{s.subStatus}</Badge> : <span className="text-xs text-muted">none</span>}</td>
                  <td className="text-xs text-muted">{s.renewsAt ? formatDate(s.renewsAt, "MMM d, yyyy") : "—"}</td>
                </tr>
              ))}
              {d.schools.length === 0 && <tr><td colSpan={7} className="py-4 text-muted">No schools.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Moderation() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api("/api/admin/moderation").then(setD).catch(e => toast.error(e.message)); }, []);
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending review" value={d.counts.PENDING_REVIEW} />
        <StatCard label="Approved" value={d.counts.APPROVED} />
        <StatCard label="Rejected" value={d.counts.REJECTED} />
        <StatCard label="Needs revision" value={d.counts.NEEDS_REVISION} />
      </div>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Oldest pending worksheets</h3>
          <a href="/admin/content-review" className="text-xs text-brand-blue hover:underline">Open full review queue →</a>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Worksheet</th><th>Subject · Level</th><th>Skill</th><th>Problems</th><th>Waiting since</th></tr></thead>
          <tbody>
            {d.pending.map((r: any) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="py-2 text-xs font-medium">{r.worksheet?.title ?? "Untitled"}</td>
                <td className="text-xs">{r.worksheet?.level?.subject?.name} · {r.worksheet?.level?.code}</td>
                <td className="text-xs">{r.worksheet?.skill?.name ?? "—"}</td>
                <td className="text-xs">{r.worksheet?.problemCount ?? 0}</td>
                <td className="text-xs text-muted">{formatDate(r.createdAt, "MMM d")}</td>
              </tr>
            ))}
            {d.pending.length === 0 && <tr><td colSpan={5} className="py-4 text-muted">All caught up — nothing pending review.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// Bug reports submitted from the student/parent dashboards ("Report a problem").
function BugReports() {
  const [d, setD] = useState<any>(null);
  const load = useCallback(async () => {
    try { setD(await api("/api/admin/bug-reports")); } catch (e: any) { toast.error(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (id: string, action: "resolve" | "reopen") => {
    try { await api("/api/admin/bug-reports", { method: "POST", body: JSON.stringify({ id, action }) }); load(); } catch (e: any) { toast.error(e.message); }
  };
  const open = d?.reports?.filter((r: any) => r.status === "NEW") ?? [];
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-3">🐞 Bug reports {open.length > 0 && <Badge variant="red">{open.length} open</Badge>}</h3>
      {!d ? <p className="text-sm text-muted">Loading…</p> : d.reports.length === 0 ? <p className="text-sm text-muted">No reports — nice and quiet.</p> : (
        <div className="space-y-2">
          {d.reports.map((r: any) => (
            <div key={r.id} className={cn("border rounded-lg p-3", r.status === "NEW" ? "border-brand-red/40 bg-brand-red-light/20" : "border-border opacity-70")}>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={r.status === "NEW" ? "red" : "green"}>{r.status}</Badge>
                <span className="font-medium">{r.category}</span>
                <span className="text-muted">{r.reporter?.email ?? "unknown"} ({r.role ?? "?"})</span>
                {r.page && <span className="text-muted">· {r.page}</span>}
                <span className="text-muted ml-auto">{formatDate(r.createdAt, "MMM d, p")}</span>
                <Button size="sm" variant="secondary" onClick={() => act(r.id, r.status === "NEW" ? "resolve" : "reopen")}>{r.status === "NEW" ? "Resolve" : "Reopen"}</Button>
              </div>
              <p className="text-sm mt-1.5 whitespace-pre-wrap">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Support() {
  const [email, setEmail] = useState("");
  const [res, setRes] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  // Recent purchases across ALL customers — visible at a glance, no email needed.
  const loadRecent = useCallback(async () => {
    try { const r = await api("/api/admin/support"); setRecent(r.purchases ?? []); } catch { /* non-blocking */ }
  }, []);
  useEffect(() => { loadRecent(); }, [loadRecent]);
  const lookup = async () => {
    if (!email.trim()) return;
    setBusy(true); setRes(null);
    try { setRes(await api(`/api/admin/support?email=${encodeURIComponent(email.trim())}`)); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const act = async (body: any, label: string) => {
    setBusy(true);
    try {
      const r = await api("/api/admin/support", { method: "POST", body: JSON.stringify(body) });
      if (r.downloadUrl) { await navigator.clipboard?.writeText(r.downloadUrl).catch(() => {}); toast.success("New link copied to clipboard", { duration: 8000 }); }
      else toast.success(label);
      await lookup();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-5">
      <BugReports />
      <Card>
        <h3 className="text-sm font-semibold mb-3">Customer lookup</h3>
        <div className="flex gap-2">
          <Input placeholder="Customer email…" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && lookup()} />
          <Button size="sm" onClick={lookup} disabled={busy}>Look up</Button>
        </div>
      </Card>
      {res && (
        <>
          <Card>
            <h3 className="text-sm font-semibold mb-2">Account</h3>
            {!res.user ? <p className="text-sm text-muted">No account for this email (shop-only customer is fine — see purchases below).</p> : (
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2"><span className="font-medium">{res.user.name ?? res.user.email}</span><Badge variant="neutral">{res.user.role}</Badge>{res.user.emailVerified ? <Badge variant="green">verified</Badge> : <Badge variant="gold">unverified</Badge>}{res.user.suspendedAt && <Badge variant="red">suspended</Badge>}</div>
                <div className="text-xs text-muted">{res.user.email} · joined {formatDate(res.user.createdAt, "MMM d, yyyy")}{res.user.subscription ? ` · ${res.user.subscription.plan}/${res.user.subscription.status}` : ""}</div>
                {res.user.student && <div className="text-xs text-muted">Student · grade {res.user.student.grade ?? "—"} · {res.user.student.totalSheetsCompleted} sheets</div>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {!res.user.emailVerified && <Button size="sm" variant="secondary" disabled={busy} onClick={() => act({ action: "resend-verification", email: res.user.email }, "Verification email sent")}>Resend verification</Button>}
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => act({ action: "send-reset", email: res.user.email }, "Password-reset email sent")}>Send password reset</Button>
                </div>
              </div>
            )}
          </Card>
          <Card>
            <h3 className="text-sm font-semibold mb-2">Shop purchases</h3>
            <p className="text-[11px] text-muted mb-3">For disputes: open/preview the exact PDFs the parent received, or re-send them by email.</p>
            {res.purchases.length === 0 ? <p className="text-sm text-muted">No shop purchases.</p> : (
              <div className="space-y-2">
                {res.purchases.map((p: any) => <PurchaseRow key={p.id} p={p} onChanged={lookup} />)}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Recent purchases across all customers — what was bought & downloaded,
          with open/preview, re-email to the buyer, and new-link actions. */}
      <Card>
        <h3 className="text-sm font-semibold mb-2">Recent purchases (all customers)</h3>
        <p className="text-[11px] text-muted mb-3">The last 20 shop orders. Expand one to open/preview its PDFs, e-mail them to the parent who bought them, or issue a fresh download link.</p>
        {recent.length === 0 ? <p className="text-sm text-muted">No purchases yet.</p> : (
          <div className="space-y-2">
            {recent.map((p: any) => <PurchaseRow key={p.id} p={p} onChanged={loadRecent} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function PurchaseRow({ p, onChanged }: { p: any; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    const next = !open; setOpen(next);
    if (next && !detail) {
      try { setDetail(await api(`/api/admin/shop-purchases/${p.id}`)); } catch (e: any) { toast.error(e.message); }
    }
  };
  const post = async (action: "email" | "regenerate") => {
    setBusy(true);
    try {
      const r = await api(`/api/admin/shop-purchases/${p.id}`, { method: "POST", body: JSON.stringify({ action }) });
      if (r.downloadUrl) { await navigator.clipboard?.writeText(r.downloadUrl).catch(() => {}); toast.success("New link copied to clipboard", { duration: 8000 }); }
      else if (r.emailed) toast.success(`PDFs emailed to ${r.to}`);
      onChanged();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="border border-border rounded-lg">
      <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
        <button onClick={toggle} className="text-muted hover:text-ink w-4">{open ? "▾" : "▸"}</button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{p.skillsCsv}</div>
          <div className="text-[11px] text-muted">{p.customerEmail ? `${p.customerEmail} · ` : ""}{formatDate(p.createdAt, "MMM d, yyyy")} · {p._count.files} file(s) · {p.downloadCount} downloads · expires {formatDate(p.expiresAt, "MMM d")}</div>
        </div>
        <Badge variant={p.status === "COMPLETED" || p.status === "PAID" ? "green" : p.status === "PENDING" ? "gold" : "red"}>{p.status}</Badge>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => post("email")}>Email PDFs</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => post("regenerate")}>New link</Button>
      </div>
      {open && (
        <div className="border-t border-border px-3 py-2.5 bg-cream-dark/40">
          {!detail ? <p className="text-xs text-muted">Loading files…</p> : detail.files.length === 0 ? <p className="text-xs text-muted">No generated files yet (run fulfillment from the System tab).</p> : (
            <div className="space-y-1.5">
              {detail.files.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded bg-brand-red-light text-brand-red text-[8px] font-bold flex items-center justify-center flex-shrink-0">PDF</div>
                  <div className="flex-1 min-w-0"><div className="font-medium truncate">{f.label}</div><div className="text-[10px] text-muted">{f.sheetCount} sheets · {(f.fileSizeBytes / 1024).toFixed(0)} KB</div></div>
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">Open / preview →</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Legal() {
  const [d, setD] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: "TERMS", version: "", title: "", url: "", summary: "" });
  const load = useCallback(() => { api("/api/admin/legal").then(setD).catch(e => toast.error(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const publish = async () => {
    if (!form.version.trim() || !form.title.trim()) { toast.error("Version and title are required"); return; }
    setBusy(true);
    try {
      await api("/api/admin/legal", { method: "POST", body: JSON.stringify({ action: "publish", type: form.type, version: form.version.trim(), title: form.title.trim(), url: form.url.trim() || undefined, summary: form.summary.trim() || undefined }) });
      toast.success("Published & set current"); setForm({ ...form, version: "", title: "", url: "", summary: "" }); load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const setCurrent = async (id: string) => {
    setBusy(true);
    try { await api("/api/admin/legal", { method: "POST", body: JSON.stringify({ action: "set-current", id }) }); toast.success("Set as current"); load(); } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
      <div className="space-y-5">
        <Card>
          <h3 className="text-sm font-semibold mb-3">Current versions · acceptance</h3>
          {d.current.length === 0 ? <p className="text-sm text-muted">No documents published yet.</p> : (
            <div className="space-y-3">
              {d.current.map((c: any) => (
                <div key={c.id} className="text-sm">
                  <div className="flex justify-between"><span className="font-medium">{c.type.replace("_", " ")} · v{c.version}</span><span className="text-muted">{c.accepted}/{c.totalUsers} accepted ({c.acceptedPct}%)</span></div>
                  <div className="h-2 rounded-full bg-cream-dark overflow-hidden mt-1"><div className="h-full bg-brand-green" style={{ width: `${c.acceptedPct}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-semibold mb-3">All versions</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Type</th><th>Version</th><th>Accepted</th><th>Effective</th><th></th></tr></thead>
            <tbody>
              {d.documents.map((doc: any) => (
                <tr key={doc.id} className="border-b border-border/60">
                  <td className="py-2 text-xs">{doc.type.replace("_", " ")}</td>
                  <td className="text-xs font-medium">v{doc.version} {doc.isCurrent && <Badge variant="green">current</Badge>}</td>
                  <td className="text-xs">{doc._count.acceptances}</td>
                  <td className="text-xs text-muted">{formatDate(doc.effectiveAt, "MMM d, yyyy")}</td>
                  <td className="text-right">{!doc.isCurrent && <Button size="sm" variant="secondary" disabled={busy} onClick={() => setCurrent(doc.id)}>Make current</Button>}</td>
                </tr>
              ))}
              {d.documents.length === 0 && <tr><td colSpan={5} className="py-4 text-muted">No documents.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
      <Card>
        <h3 className="text-sm font-semibold mb-3">Publish new version</h3>
        <div className="space-y-3">
          <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="TERMS">Terms of Service</option>
            <option value="PRIVACY">Privacy Policy</option>
            <option value="COPPA_CONSENT">COPPA Consent</option>
          </select>
          <Input placeholder="Version (e.g. 2026-06-27 or 1.2)" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="URL to hosted doc (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <textarea className="w-full border border-border rounded-md px-3 py-2 text-sm" rows={3} placeholder="What changed in this version? (optional)" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <Button size="sm" onClick={publish} disabled={busy} className="w-full">Publish & set current</Button>
          <p className="text-[11px] text-muted">Publishing marks this the current version for its type. Acceptance is recorded per user as they accept.</p>
        </div>
      </Card>
    </div>
  );
}

function Webhooks() {
  const [d, setD] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(() => { api("/api/admin/webhooks").then(setD).catch(e => toast.error(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const replay = async (eventId: string) => {
    setBusy(eventId);
    try {
      const r = await api("/api/admin/webhooks", { method: "POST", body: JSON.stringify({ action: "replay", eventId }) });
      if (r.status === "FAILED") toast.error(`Replay failed again: ${r.error ?? "handler error"}`);
      else toast.success(`Replayed → ${r.status}`);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const rows = showAll ? d.recent : d.failed;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Failed (7d)" value={d.counts.FAILED} />
        <StatCard label="Processed (7d)" value={d.counts.PROCESSED} />
        <StatCard label="Duplicates skipped" value={d.counts.SKIPPED} />
        <StatCard label="Ignored types" value={d.counts.IGNORED} />
      </div>
      {d.counts.FAILED > 0 && (
        <div className="rounded-lg border border-brand-red/30 bg-brand-red-light p-3 text-sm text-brand-red">
          ⚠ {d.counts.FAILED} webhook{d.counts.FAILED === 1 ? "" : "s"} failed in the last 7 days — subscription state may be stale until replayed.
        </div>
      )}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{showAll ? "Recent webhook events" : "Failed webhook events"}</h3>
          <div className="flex items-center gap-3">
            {d.lastEventAt && <span className="text-[11px] text-muted">last event {formatDate(d.lastEventAt, "MMM d, p")}</span>}
            <button className="text-xs text-brand-blue hover:underline" onClick={() => setShowAll(s => !s)}>{showAll ? "Show failures only" : "Show all recent"}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Type</th><th>Status</th><th>Attempts</th><th>Error</th><th>When</th><th></th></tr></thead>
            <tbody>
              {rows.map((e: any) => (
                <tr key={e.id} className="border-b border-border/60 align-top">
                  <td className="py-2"><div className="font-mono text-xs">{e.type}</div><div className="text-[10px] text-muted">{e.eventId}</div></td>
                  <td><Badge variant={e.status === "PROCESSED" ? "green" : e.status === "FAILED" ? "red" : "gold"}>{e.status}</Badge></td>
                  <td className="text-xs">{e.attempts}</td>
                  <td className="text-xs text-brand-red max-w-[22ch] truncate" title={e.error ?? ""}>{e.error ?? "—"}</td>
                  <td className="text-xs text-muted whitespace-nowrap">{formatDate(e.createdAt, "MMM d, p")}</td>
                  <td className="text-right">{e.status === "FAILED" && <Button size="sm" variant="secondary" disabled={busy === e.eventId} onClick={() => replay(e.eventId)}>Replay</Button>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="py-4 text-muted">{showAll ? "No webhook events recorded yet." : "No failed webhooks — all good."}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function System() {
  const [d, setD] = useState<any>(null);
  const load = useCallback(() => { api("/api/admin/system").then(setD).catch(e => toast.error(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const retry = async (purchaseId: string) => { try { await api("/api/admin/system", { method: "POST", body: JSON.stringify({ action: "retry-shop", purchaseId }) }); toast.success("Re-ran fulfillment"); load(); } catch (e: any) { toast.error(e.message); } };
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="text-sm font-semibold mb-3">Shop purchases — fulfillment</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="py-2">Email</th><th>Packs</th><th>Status</th><th>Files</th><th>When</th><th></th></tr></thead>
          <tbody>
            {d.shopPurchases.map((p: any) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="py-2">{p.customerEmail}</td>
                <td className="text-xs">{p.skillsCsv}</td>
                <td><Badge variant={p.status === "PAID" ? "green" : p.status === "PENDING" ? "gold" : "red"}>{p.status}</Badge></td>
                <td>{p._count.files}</td>
                <td className="text-xs text-muted">{formatDate(p.createdAt, "MMM d, p")}</td>
                <td className="text-right">{p.status === "PAID" && p._count.files === 0 && <Button size="sm" variant="secondary" onClick={() => retry(p.id)}>Retry</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold mb-3">Recent admin actions (audit log)</h3>
        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
          {d.audit.map((a: any) => (
            <div key={a.id} className="text-xs flex justify-between gap-3 border-b border-border/50 py-1.5">
              <span><span className="font-mono text-brand-blue">{a.action.replace("admin.", "")}</span> {a.entityType ? `· ${a.entityType}` : ""} <span className="text-muted">{a.metadata?.email ?? a.metadata?.actorEmail ?? ""}</span></span>
              <span className="text-muted whitespace-nowrap">{formatDate(a.createdAt, "MMM d, p")}</span>
            </div>
          ))}
          {d.audit.length === 0 && <p className="text-sm text-muted">No admin actions yet.</p>}
        </div>
      </Card>
    </div>
  );
}
