// src/components/dashboard/ScheduledJobsPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

const JOBS = [
  { id: "daily-packets", name: "Daily packets", schedule: "Every day at 6:00 am", desc: "Generates PDFs and emails parents" },
  { id: "streak-maintenance", name: "Streak maintenance", schedule: "Every day at 11:59 pm", desc: "Resets dropped streaks, awards milestones" },
  { id: "dunning", name: "Dunning emails", schedule: "Every day at 9:00 am", desc: "Payment retry reminders, auto-downgrade" },
];

export function ScheduledJobsPanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/admin/audit-log?action=cron.&limit=20");
      const data = await res.json();
      if (data.success) setLogs(data.data.logs);
    } catch {}
  }

  async function runJob(jobId: string) {
    setRunning(jobId);
    try {
      const res = await fetch("/api/admin/run-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobId }),
      });
      const data = await res.json();
      if (data.success) {
        const r = data.data;
        toast.success(
          `${jobId} done: ${r.recordsProcessed} processed in ${r.durationMs}ms`
        );
        await fetchLogs();
      } else {
        toast.error(data.error || "Job failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="text-sm font-semibold mb-3">Scheduled jobs</h3>
        <div className="space-y-2">
          {JOBS.map((job) => {
            const lastRun = logs.find((l) => l.action === `cron.${job.id}`);
            const lastStatus = (lastRun?.metadata as any)?.status;
            return (
              <div key={job.id} className="border border-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {job.name}
                      {lastStatus === "success" && <Badge variant="green">Last: ok</Badge>}
                      {lastStatus === "failure" && <Badge variant="red">Last: failed</Badge>}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">{job.schedule}</div>
                    <div className="text-[11px] text-muted">{job.desc}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={running === job.id}
                    onClick={() => runJob(job.id)}
                  >
                    Run now
                  </Button>
                </div>
                {lastRun && (
                  <div className="text-[10px] text-muted">
                    Last run: {formatDate(lastRun.createdAt, "MMM d 'at' p")} ·{" "}
                    {(lastRun.metadata as any)?.recordsProcessed ?? 0} records ·{" "}
                    {(lastRun.metadata as any)?.durationMs ?? 0}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-3">Recent cron runs</h3>
        {logs.length === 0 ? (
          <EmptyState title="No runs yet" description="Trigger a job to see history here." />
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {logs.map((log) => {
              const meta = (log.metadata as any) ?? {};
              const status = meta.status ?? "unknown";
              return (
                <div
                  key={log.id}
                  className={cn(
                    "px-3 py-2 rounded-md border text-xs",
                    status === "success" ? "border-brand-green/30 bg-brand-green-light/50"
                      : status === "failure" ? "border-brand-red/30 bg-brand-red-light/50"
                      : "border-border bg-cream-dark"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{log.action.replace("cron.", "")}</span>
                    <span className="text-[10px] text-muted">
                      {formatDate(log.createdAt, "MMM d HH:mm")}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">
                    {meta.recordsProcessed ?? 0} processed · {meta.durationMs ?? 0}ms
                    {meta.errors?.length > 0 && (
                      <span className="text-brand-red ml-2">· {meta.errors.length} errors</span>
                    )}
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
