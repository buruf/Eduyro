// src/components/dashboard/IntegrationsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Select, Badge, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface GcCourse {
  id: string;
  name: string;
  section?: string | null;
}

interface IntegrationsPanelProps {
  schoolId: string;
  connected: boolean;
  googleEmail?: string | null;
}

export function IntegrationsPanel({ schoolId, connected, googleEmail }: IntegrationsPanelProps) {
  const [courses, setCourses] = useState<GcCourse[] | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  useEffect(() => {
    if (connected) loadCourses();
  }, [connected]);

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const res = await fetch("/api/integrations/google-classroom/courses");
      const data = await res.json();
      if (data.success) {
        setCourses(data.data.courses);
        if (data.data.courses.length > 0) setSelectedCourse(data.data.courses[0].id);
      } else if (data.code === "NOT_CONNECTED") {
        setCourses(null);
      } else {
        toast.error(data.error || "Couldn't load courses");
      }
    } catch {
      toast.error("Network error loading courses");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function runSync() {
    if (!selectedCourse) return;
    setSyncing(true);
    setLastSyncResult(null);
    try {
      const res = await fetch("/api/integrations/google-classroom/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomCourseId: selectedCourse, schoolId }),
      });
      const data = await res.json();
      if (data.success) {
        setLastSyncResult(data.data);
        toast.success(`Synced — ${data.data.studentsImported} new, ${data.data.studentsUpdated} updated`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Network error during sync");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-blue-light flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#1B4F8A" d="M21.5 6.5h-3v-3a1.5 1.5 0 00-3 0v3h-3a1.5 1.5 0 000 3h3v3a1.5 1.5 0 003 0v-3h3a1.5 1.5 0 000-3zM8 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm0 1.5c-2.99 0-9 1.5-9 4.5V20h18v-2.5c0-3-6.01-4.5-9-4.5z"/></svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Google Classroom</h3>
          <p className="text-xs text-muted leading-relaxed mt-0.5">
            Import students from Classroom and post daily worksheets as assignments.
          </p>
        </div>
        {connected && <Badge variant="green">Connected</Badge>}
      </div>

      {!connected ? (
        <div className="text-center py-3">
          <p className="text-xs text-muted mb-3">Connect your Google Classroom account to start syncing.</p>
          <a href="/api/integrations/google-classroom/connect">
            <Button variant="primary" size="sm">Connect Google Classroom</Button>
          </a>
        </div>
      ) : (
        <div>
          <div className="text-xs text-muted mb-3">
            Signed in as <strong className="text-ink">{googleEmail}</strong>
          </div>

          {loadingCourses ? (
            <div className="text-xs text-muted py-2">Loading courses…</div>
          ) : !courses || courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="You don't have any active Google Classroom courses to sync."
              className="py-4"
            />
          ) : (
            <div className="space-y-2">
              <Select label="Course to sync" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` · ${c.section}` : ""}
                  </option>
                ))}
              </Select>
              <Button variant="primary" fullWidth size="sm" onClick={runSync} loading={syncing} disabled={!selectedCourse}>
                Sync roster now
              </Button>
            </div>
          )}

          {lastSyncResult && (
            <div className="bg-brand-green-light border border-brand-green/30 rounded-lg p-3 mt-3 text-xs space-y-1">
              <div className="font-semibold text-brand-green mb-1">Last sync</div>
              <div>📥 Imported: {lastSyncResult.studentsImported}</div>
              <div>✏️ Updated: {lastSyncResult.studentsUpdated}</div>
              {lastSyncResult.studentsSkipped > 0 && (
                <div>⏭ Skipped: {lastSyncResult.studentsSkipped}</div>
              )}
              {lastSyncResult.errors?.length > 0 && (
                <div className="text-brand-red mt-1">
                  {lastSyncResult.errors.length} errors — see audit log
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
