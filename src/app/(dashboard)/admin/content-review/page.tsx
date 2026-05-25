// src/app/(dashboard)/admin/content-review/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { DashboardSidebar, DashboardTopbar } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Select, EmptyState, Textarea } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "PENDING_REVIEW", label: "Pending review", color: "gold" as const },
  { id: "APPROVED", label: "Approved", color: "green" as const },
  { id: "REJECTED", label: "Rejected", color: "red" as const },
  { id: "NEEDS_REVISION", label: "Needs revision", color: "blue" as const },
  { id: "ALL", label: "All", color: "neutral" as const },
];

export default function ContentReviewPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openReview, setOpenReview] = useState<any | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, subjectFilter, levelFilter]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (subjectFilter) params.set("subject", subjectFilter);
      if (levelFilter) params.set("level", levelFilter);

      const res = await fetch(`/api/content/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews ?? []);
        setSummary(data.data.summary ?? {});
        setSelected(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  async function bulkAction(status: "APPROVED" | "REJECTED" | "NEEDS_REVISION") {
    if (selected.size === 0) return;
    const verb = status === "APPROVED" ? "Approve" : status === "REJECTED" ? "Reject" : "Mark for revision";
    if (!confirm(`${verb} ${selected.size} worksheet${selected.size !== 1 ? "s" : ""}?`)) return;

    try {
      const res = await fetch("/api/content/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: Array.from(selected),
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.data.updated} updated`);
        fetchReviews();
      } else {
        toast.error(data.error || "Bulk action failed");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    if (selected.size === reviews.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviews.map((r) => r.id)));
    }
  }

  return (
    <div className="grid grid-cols-[210px_1fr] min-h-screen">
      <DashboardSidebar
        roleBadge="Curriculum"
        user={{ name: "Content review", subtitle: "Curriculum specialist" }}
        items={[
          { href: "/admin", label: "← Admin home", icon: "🏠" },
          { href: "/admin/content-review", label: "Content review", icon: "✏️", active: true },
          { href: "/admin/content-review?status=APPROVED", label: "Approved", icon: "✓" },
          { href: "/admin/content-review?status=REJECTED", label: "Rejected", icon: "✗" },
        ]}
        footerContent={
          <div className="space-y-1">
            {STATUS_FILTERS.slice(0, 4).map((f) => (
              <div key={f.id} className="flex justify-between text-[10px] text-cream/55">
                <span>{f.label}</span>
                <span className="font-semibold text-cream/80">{summary[f.id] ?? 0}</span>
              </div>
            ))}
          </div>
        }
      />

      <main className="flex flex-col overflow-hidden">
        <DashboardTopbar
          title="Content Review Queue"
          subtitle={`${reviews.length} worksheets · ${summary.PENDING_REVIEW ?? 0} awaiting review`}
          action={
            selected.size > 0 ? (
              <div className="flex gap-2">
                <span className="text-xs text-muted self-center mr-2">{selected.size} selected</span>
                <Button variant="green" size="sm" onClick={() => bulkAction("APPROVED")}>
                  ✓ Approve {selected.size}
                </Button>
                <Button variant="red" size="sm" onClick={() => bulkAction("REJECTED")}>
                  ✗ Reject
                </Button>
                <Button variant="secondary" size="sm" onClick={() => bulkAction("NEEDS_REVISION")}>
                  ↻ Revision
                </Button>
              </div>
            ) : null
          }
        />

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted">Filter:</span>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-md border-[1.5px] transition-colors",
                    statusFilter === f.id
                      ? "bg-ink text-cream border-ink"
                      : "bg-white text-ink border-border hover:border-ink"
                  )}
                >
                  {f.label}
                  {summary[f.id] != null && f.id !== "ALL" && (
                    <span className="ml-1.5 opacity-60">{summary[f.id]}</span>
                  )}
                </button>
              ))}
              <div className="flex-1" />
              <div className="w-32">
                <Select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="">All subjects</option>
                  <option value="MATH">Math</option>
                  <option value="READING">Reading</option>
                  <option value="WRITING">Writing</option>
                  <option value="SCIENCE">Science</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Review list */}
          <Card padding="none">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted">Loading…</div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No worksheets to review"
                description={
                  statusFilter === "PENDING_REVIEW"
                    ? "All caught up — no worksheets in the queue."
                    : "No worksheets match this filter."
                }
                className="py-16"
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-[10px] text-muted uppercase tracking-wider">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === reviews.length && reviews.length > 0}
                        onChange={selectAll}
                        className="accent-brand-blue"
                      />
                    </th>
                    <th className="py-3">Worksheet</th>
                    <th className="py-3">Subject · Level</th>
                    <th className="py-3">Skill</th>
                    <th className="py-3">Problems</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className={cn("border-b border-border last:border-none hover:bg-cream-dark/30", selected.has(r.id) && "bg-brand-blue-light/40")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="accent-brand-blue"
                        />
                      </td>
                      <td className="py-3 font-medium text-xs">{r.worksheet?.title ?? "Untitled"}</td>
                      <td className="py-3 text-xs">
                        {r.worksheet?.level?.subject?.name} · <strong>{r.worksheet?.level?.code}</strong>
                      </td>
                      <td className="py-3 text-xs">{r.worksheet?.skill?.name ?? "—"}</td>
                      <td className="py-3 text-xs">{r.worksheet?.problemCount ?? 0}</td>
                      <td className="py-3"><StatusBadge status={r.status} /></td>
                      <td className="py-3 text-xs text-muted">{formatDate(r.createdAt, "MMM d")}</td>
                      <td className="py-3 text-right pr-3">
                        <Button variant="secondary" size="sm" onClick={() => setOpenReview(r)}>
                          Review →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </main>

      {openReview && (
        <ReviewModal review={openReview} onClose={() => setOpenReview(null)} onUpdate={() => { fetchReviews(); setOpenReview(null); }} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, any> = {
    PENDING_REVIEW: { v: "gold" as const, label: "Pending" },
    APPROVED: { v: "green" as const, label: "Approved" },
    REJECTED: { v: "red" as const, label: "Rejected" },
    NEEDS_REVISION: { v: "blue" as const, label: "Revision" },
    DRAFT: { v: "neutral" as const, label: "Draft" },
  };
  const c = config[status] ?? { v: "neutral", label: status };
  return <Badge variant={c.v}>{c.label}</Badge>;
}

function ReviewModal({ review, onClose, onUpdate }: any) {
  const [notes, setNotes] = useState(review.notes ?? "");
  const [issues, setIssues] = useState<any[]>(review.issuesFound ?? []);
  const [processing, setProcessing] = useState(false);

  const problems = useMemo(() => {
    const p = review.worksheet?.problems;
    return Array.isArray(p) ? p : [];
  }, [review]);

  const answers = useMemo(() => {
    const a = review.worksheet?.answerKey;
    return Array.isArray(a) ? a : [];
  }, [review]);

  async function submitReview(status: "APPROVED" | "REJECTED" | "NEEDS_REVISION") {
    setProcessing(true);
    try {
      const res = await fetch(`/api/content/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes, issuesFound: issues }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Marked ${status.toLowerCase().replace("_", " ")}`);
        onUpdate();
      } else {
        toast.error(data.error || "Action failed");
      }
    } finally {
      setProcessing(false);
    }
  }

  function flagProblem(idx: number, note: string) {
    setIssues((prev) => [...prev.filter((i) => i.problemIdx !== idx), { type: "issue", problemIdx: idx, note }]);
  }

  function unflagProblem(idx: number) {
    setIssues((prev) => prev.filter((i) => i.problemIdx !== idx));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/55 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-elev w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex justify-between items-start sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-serif text-lg font-bold">{review.worksheet?.title}</h3>
            <p className="text-xs text-muted mt-0.5">
              {review.worksheet?.level?.subject?.name} · Level {review.worksheet?.level?.code} · {review.worksheet?.skill?.name}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-xs uppercase tracking-wider text-muted font-semibold">Problems & answer key</h4>
          <div className="space-y-2 border border-border rounded-lg p-4 bg-cream-dark/30">
            {problems.map((prob: any, idx: number) => {
              const flagged = issues.find((i) => i.problemIdx === idx);
              const ans = answers[idx];
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-md border",
                    flagged ? "border-brand-red bg-brand-red-light/40" : "border-border bg-white"
                  )}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-muted mb-0.5">Q{idx + 1}</div>
                      <div className="font-serif text-base font-bold">{prob.question}</div>
                      {prob.options && (
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                          {prob.options.map((o: string, i: number) => (
                            <div
                              key={i}
                              className={cn(
                                "px-2 py-1 rounded",
                                ans?.answer === o
                                  ? "bg-brand-green-light text-brand-green font-semibold"
                                  : "text-muted"
                              )}
                            >
                              {String.fromCharCode(65 + i)}. {o}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-brand-green mt-2">
                        <strong>Answer:</strong> {ans?.answer ?? "—"}
                      </div>
                    </div>
                    <div>
                      {flagged ? (
                        <Button variant="secondary" size="sm" onClick={() => unflagProblem(idx)}>
                          Unflag
                        </Button>
                      ) : (
                        <Button
                          variant="red"
                          size="sm"
                          onClick={() => {
                            const note = prompt("Note for this problem:");
                            if (note) flagProblem(idx, note);
                          }}
                        >
                          ⚠ Flag
                        </Button>
                      )}
                    </div>
                  </div>
                  {flagged && (
                    <div className="mt-2 text-xs text-brand-red italic">⚠ {flagged.note}</div>
                  )}
                </div>
              );
            })}
          </div>

          <Textarea
            label="Review notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Problem 7 has ambiguous wording. Otherwise great."
            rows={3}
          />
        </div>

        <div className="p-6 border-t border-border bg-cream-dark/50 flex gap-2 sticky bottom-0">
          <Button variant="secondary" onClick={onClose} className="mr-auto">
            Cancel
          </Button>
          <Button variant="red" onClick={() => submitReview("REJECTED")} loading={processing}>
            ✗ Reject
          </Button>
          <Button variant="blue" onClick={() => submitReview("NEEDS_REVISION")} loading={processing}>
            ↻ Needs revision
          </Button>
          <Button variant="green" onClick={() => submitReview("APPROVED")} loading={processing}>
            ✓ Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
