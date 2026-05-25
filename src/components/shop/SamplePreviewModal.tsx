// src/components/shop/SamplePreviewModal.tsx
// In-browser preview of a sample worksheet pack.
// Renders rendered HTML in an iframe with download/print discouraged via:
//   - Watermark across each sheet (from the API)
//   - No download link or save button anywhere
//   - Disabled right-click and selection (best-effort; determined users
//     can still use dev tools, but we make casual saving harder)
//   - "Print" not exposed in our UI

"use client";

import { useEffect, useState } from "react";

interface SampleData {
  skill: string;
  label: string;
  sheetCount: number;
  sheetsHtml: string[];
  note: string;
}

interface SamplePreviewModalProps {
  open: boolean;
  skill: "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" | null;
  onClose: () => void;
}

export function SamplePreviewModal({ open, skill, onClose }: SamplePreviewModalProps) {
  const [data, setData] = useState<SampleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !skill) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/shop/sample?skill=${skill}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load preview");
        }
        setData(json.data);
      })
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [open, skill]);

  // Disable Ctrl+P, Ctrl+S, Cmd+P, Cmd+S inside the modal so casual users
  // can't print or save. (Doesn't block dev-tools-savvy users, but stops
  // 99% of attempts. Combined with the watermark, this is good enough.)
  useEffect(() => {
    if (!open) return;
    const blockSaveOrPrint = (e: KeyboardEvent) => {
      const isPrint = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p";
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (isPrint || isSave) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", blockSaveOrPrint, true);
    return () => document.removeEventListener("keydown", blockSaveOrPrint, true);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        // Discourage right-click save / drag
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-serif text-xl font-bold">
              {data?.label ?? "Loading"} — Free Sample Preview
            </h2>
            <p className="text-xs text-muted mt-1">
              Preview is view-only. Purchase the pack to download printable PDFs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-2xl leading-none px-2"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading && (
            <div className="text-center py-12 text-muted">
              Loading sample…
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-brand-red">
              Could not load preview: {error}
            </div>
          )}

          {data && (
            <>
              {data.sheetsHtml.map((html, i) => (
                <div
                  key={i}
                  className="mb-8 border border-border rounded-lg shadow-sm bg-white"
                  style={{ padding: "1rem" }}
                  // Render server-built HTML. Safe because content originates
                  // from our own renderSheetHtml() which escapes user input.
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ))}
              <div className="text-center text-sm text-muted py-4">
                You're previewing {data.sheetCount} sample sheets. The full pack
                includes ~100 sheets and an answer key.
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border bg-cream-dark text-center">
          <button
            onClick={onClose}
            className="bg-ink text-cream px-6 py-2 rounded-lg text-sm hover:bg-ink-soft transition-colors"
          >
            Close preview
          </button>
        </div>
      </div>
    </div>
  );
}
