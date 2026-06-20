// src/app/print/writing-prompt/page.tsx
// Companion PRINTABLE writing-prompt worksheets for Writing levels W1–W8.
// Composition (paragraphs, narratives, essays) cannot be auto-graded, so these
// live outside the interactive mastery flow: a parent prints them and the child
// writes by hand. Self-contained — content comes from writing-prompts.ts, no
// backend call, with an on-page level selector.
"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import {
  ALL_PROMPTS,
  WRITING_LEVEL_NAMES,
  getPromptsByLevel,
  type WritingPrompt,
} from "@/lib/content/writing-prompts";

const LEVELS = Object.keys(ALL_PROMPTS); // W1..W8

function linesFor(type: WritingPrompt["type"]): number {
  switch (type) {
    case "sentence": return 8;
    case "paragraph": return 15;
    default: return 20; // essay / narrative / persuasive fill the page
  }
}

function PrintWritingPromptInner() {
  const params = useSearchParams();
  // Start from a constant default so server and client first render match
  // (avoids a hydration mismatch); apply the ?level= query after mount.
  const [level, setLevel] = useState("W5");

  useEffect(() => {
    const q = (params.get("level") || "").toUpperCase();
    if (q && LEVELS.includes(q)) setLevel(q);
  }, [params]);

  // Keep the document title useful for "Save as PDF" filenames.
  useEffect(() => {
    document.title = `Eduyro Writing Prompts — ${level} ${WRITING_LEVEL_NAMES[level] ?? ""}`.trim();
  }, [level]);

  const prompts = getPromptsByLevel(level);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media screen {
          body { background: #e5e7eb; }
          .toolbar { position: sticky; top: 0; z-index: 100; background: white; border-bottom: 1px solid #E8E0D0; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
          .sheet-wrapper { width: 8.5in; min-height: 11in; background: white; margin: 24px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0.6in 0.7in; }
        }
        @media print {
          @page { size: letter portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .toolbar { display: none !important; }
          .sheet-wrapper {
            width: 100vw; height: 100vh; padding: 0.5in 0.6in;
            page-break-after: always; break-after: page;
            overflow: hidden; display: flex; flex-direction: column;
          }
          .sheet-wrapper:last-child { page-break-after: auto; break-after: auto; }
        }
        .lvlchip { border: 1px solid #D0C8B8; background: white; color: #7A6E5F; border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
        .lvlchip.active { background: #1A1612; color: white; border-color: #1A1612; }
      `}</style>

      {/* Screen toolbar */}
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <BrandLogo size="sm" />
          <div style={{ width: "1px", height: "20px", background: "#E8E0D0" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1612" }}>Printable Writing Prompts</div>
            <div style={{ fontSize: "10px", color: "#7A6E5F" }}>
              {level} · {WRITING_LEVEL_NAMES[level]} · {prompts.length} prompt{prompts.length === 1 ? "" : "s"} · hand-written practice (not auto-graded)
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {LEVELS.map((lv) => (
            <button key={lv} className={`lvlchip${lv === level ? " active" : ""}`} onClick={() => setLevel(lv)} title={WRITING_LEVEL_NAMES[lv]}>
              {lv}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.print()}
            style={{ background: "#1A1612", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            🖨 Print / Save PDF
          </button>
          <Link href="/parent" style={{ fontSize: "12px", color: "#7A6E5F", textDecoration: "none" }}>← Dashboard</Link>
        </div>
      </div>

      {prompts.length === 0 ? (
        <div className="sheet-wrapper"><p style={{ fontFamily: "Georgia, serif" }}>No prompts for this level yet.</p></div>
      ) : (
        prompts.map((p) => <PromptSheet key={p.id} prompt={p} level={level} />)
      )}
    </>
  );
}

function PromptSheet({ prompt, level }: { prompt: WritingPrompt; level: string }) {
  const lineCount = linesFor(prompt.type);
  return (
    <div className="sheet-wrapper" style={{ fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "2.5px solid #2D6A3F", paddingBottom: "6pt", marginBottom: "8pt", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#7A6E5F", fontFamily: "DM Sans, sans-serif" }}>Eduyro Education · eduyro.com</div>
          <div style={{ fontWeight: "bold", fontSize: "15pt", marginTop: "2pt", color: "#1A1612" }}>{prompt.title}</div>
          <div style={{ fontSize: "9pt", color: "#7A6E5F", marginTop: "1pt", fontFamily: "DM Sans, sans-serif" }}>
            {level} · {WRITING_LEVEL_NAMES[level]} · Writing Practice
            {prompt.wordCountTarget && ` · Aim for ${prompt.wordCountTarget.min}–${prompt.wordCountTarget.max} words`}
          </div>
        </div>
        <div style={{ fontSize: "8pt", color: "#aaa", textAlign: "right", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>Eduyro<br />Education</div>
      </div>

      {/* Name / Date */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12pt", marginBottom: "8pt", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
        {[{ label: "Name" }, { label: "Date" }].map((f) => (
          <div key={f.label}>
            <div style={{ fontSize: "7pt", textTransform: "uppercase", letterSpacing: "0.07em", color: "#bbb", marginBottom: "2pt" }}>{f.label}</div>
            <div style={{ borderBottom: "1px solid #D0C8B8", minHeight: "14pt" }} />
          </div>
        ))}
      </div>

      {/* Prompt */}
      <div style={{ background: "#F0F5F1", borderLeft: "3px solid #2D6A3F", padding: "6pt 10pt", marginBottom: "8pt", fontSize: "10.5pt", color: "#1A1612", lineHeight: 1.4, whiteSpace: "pre-line", flexShrink: 0 }}>
        {prompt.prompt}
      </div>

      {/* Sentence starters */}
      {prompt.scaffolding && prompt.scaffolding.length > 0 && (
        <div style={{ marginBottom: "8pt", fontFamily: "DM Sans, sans-serif", fontSize: "9pt", color: "#7A6E5F", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "7.5pt", color: "#bbb", marginBottom: "3pt" }}>Sentence starters (optional)</div>
          <ul style={{ paddingLeft: "16pt", lineHeight: 1.5 }}>
            {prompt.scaffolding.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Writing lines */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "0", overflow: "hidden" }}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} style={{ borderBottom: "1px solid #D8D0C0", height: `${22}pt`, flexShrink: 0 }} />
        ))}
      </div>

      {/* Rubric */}
      {prompt.rubricCriteria && prompt.rubricCriteria.length > 0 && (
        <div style={{ marginTop: "8pt", border: "1px solid #E8E0D0", borderRadius: "4pt", padding: "6pt 8pt", fontFamily: "DM Sans, sans-serif", fontSize: "8pt", color: "#7A6E5F", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "7.5pt", color: "#2D6A3F", marginBottom: "3pt" }}>How your writing will be checked</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2pt 16pt" }}>
            {prompt.rubricCriteria.map((c, i) => (
              <div key={i}>✓ <strong>{c.name}:</strong> {c.description}</div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px dashed #E8E0D0", paddingTop: "4pt", marginTop: "6pt", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#bbb", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
        <span>{level} · Eduyro · Writing practice (not auto-graded)</span>
        <span>Parent/Guardian review: ____________________</span>
      </div>
    </div>
  );
}

export default function PrintWritingPromptPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: "Georgia, serif", color: "#7A6E5F" }}>Loading prompts…</div>}>
      <PrintWritingPromptInner />
    </Suspense>
  );
}
