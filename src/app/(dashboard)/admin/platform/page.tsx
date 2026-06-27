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

const TABS = ["Overview", "Users", "COPPA", "System"] as const;
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
        {tab === "Users" && <Users />}
        {tab === "COPPA" && <Coppa />}
        {tab === "System" && <System />}
      </div>
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
      <Card>
        <h3 className="text-sm font-semibold mb-3">⚠ Needs attention</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Watch label="Pending COPPA consent" n={d.watch.pendingCoppa} danger={d.watch.pendingCoppa > 0} />
          <Watch label="Past-due subscriptions" n={d.watch.pastDueSubs} danger={d.watch.pastDueSubs > 0} />
          <Watch label="Failed/queued PDF exports" n={d.watch.failedPdfExports} danger={d.watch.failedPdfExports > 0} />
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
