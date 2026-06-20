// src/components/shop/SamplePreviewModal.tsx
// In-browser preview of sample worksheets.
// Embeds the REAL PDF from /api/shop/preview-sheet — the exact engine and
// renderer a buyer receives — so the preview is pixel-identical to the
// product (stamped with a translucent SAMPLE watermark server-side).
// Download/print is discouraged: watermark, no save UI, Ctrl+P/S blocked.

"use client";

import { useEffect, useState } from "react";

interface SamplePreviewModalProps {
  open: boolean;
  skill: string | null;
  onClose: () => void;
}

const SAMPLE_SHEETS = [1, 2];

export function SamplePreviewModal({ open, skill, onClose }: SamplePreviewModalProps) {
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (!open) setLoadedCount(0);
  }, [open, skill]);

  // Disable Ctrl+P / Ctrl+S inside the modal so casual users can't print or
  // save. (Doesn't stop dev-tools users, but with the watermark it's enough.)
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

  if (!open || !skill) return null;

  const label = skill
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-serif text-xl font-bold">
              {label} — Free Sample Preview
            </h2>
            <p className="text-xs text-muted mt-1">
              These are the actual worksheets from the pack (watermarked).
              Purchase to download all 100 sheets, clean and printable.
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

        <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4">
          {loadedCount < SAMPLE_SHEETS.length && (
            <div className="text-center py-3 text-muted text-sm">
              Loading sample worksheets…
            </div>
          )}
          {SAMPLE_SHEETS.map((n) => (
            <iframe
              key={`${skill}-${n}`}
              src={`/api/shop/preview-sheet?skill=${skill}&sheet=${n}#toolbar=0&navpanes=0`}
              title={`${label} sample worksheet ${n}`}
              className="w-full rounded-lg border border-border bg-white"
              style={{ height: "70vh", minHeight: 480 }}
              onLoad={() => setLoadedCount((c) => c + 1)}
            />
          ))}
          <div className="text-center text-sm text-muted py-2">
            You&rsquo;re previewing {SAMPLE_SHEETS.length} of 100 sheets. The full
            pack includes every difficulty level plus a consolidated answer key.
          </div>
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
