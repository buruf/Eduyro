// src/components/worksheet/DownloadBundleButton.tsx
// Single-button "Save as PDF" for the worksheet generator.
// Hits /api/worksheet/preview-bundle which returns ONE PDF containing
// all sheets + a single answer key at the end (not per-sheet).

"use client";

import { useState } from "react";

interface DownloadBundleButtonProps {
  subjectSlug: "MATH" | "READING" | "WRITING" | "SCIENCE";
  levelCode: string;
  skillName: string;
  problemCount: number;
  timeLimitMinutes: number;
  totalSheets: number;
  difficulty?: number;
  /** Optional label override. Defaults to "Save as PDF". */
  label?: string;
}

export function DownloadBundleButton(props: DownloadBundleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const download = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/worksheet/preview-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectSlug: props.subjectSlug,
          levelCode: props.levelCode,
          skillName: props.skillName,
          problemCount: props.problemCount,
          timeLimitMinutes: props.timeLimitMinutes,
          totalSheets: props.totalSheets,
          difficulty: props.difficulty,
        }),
      });

      if (!res.ok) {
        // Try to read JSON error if present, otherwise show generic message
        try {
          const j = await res.json();
          throw new Error(j.error ?? `HTTP ${res.status}`);
        } catch {
          throw new Error(`HTTP ${res.status}`);
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName(props.skillName)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={download}
        disabled={loading}
        className="bg-ink text-cream font-medium px-5 py-2.5 rounded-lg hover:bg-ink-soft transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Building PDF…" : (props.label ?? "Save as PDF")}
      </button>
      {err && (
        <div className="mt-2 text-xs text-brand-red">
          Could not build PDF: {err}
        </div>
      )}
    </div>
  );
}

function safeName(s: string): string {
  return s.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60);
}
