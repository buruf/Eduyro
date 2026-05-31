// src/app/print/[childId]/page.tsx
// Clean print page — parent lands here after clicking "Print today's packet"
// on their dashboard. Auto-triggers window.print() on load.
// No navigation, no sidebar, just 3 print-ready sheets.

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout";

// ─── Types ───────────────────────────────────────────────────────────────────

type Problem = {
  id: string;
  type: string;
  question: string;
  answer: string | number;
  options?: string[];
  explanation?: string;
  points: number;
};

type AnswerKeyEntry = { id: string; answer: string | number; explanation?: string };

type Sheet = {
  sheetNumber: number;
  problems: Problem[];
  answerKey: AnswerKeyEntry[];
};

type Packet = {
  id: string;
  studentId: string;
  date: string;
  levelCode: string;
  levelName: string;
  skillName: string;
  subjectSlug: string;
  sheets: Sheet[];
  problemsPerSheet: number;
  timeLimitMinutes: number;
  printCount: number;
};

type FetchState =
  | { status: "loading" }
  | { status: "no_placement" }
  | { status: "error"; message: string }
  | { status: "ready"; packet: Packet; date: string; studentName: string };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PrintPage() {
  const { childId } = useParams<{ childId: string }>();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/students/${childId}/daily-packet`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setState({ status: "error", message: data.error ?? "Failed to load packet" });
          return;
        }
        if (!data.data.packet) {
          setState({ status: data.data.reason === "no_placement" ? "no_placement" : "error", message: "No packet available" });
          return;
        }
        setState({
          status: "ready",
          packet: data.data.packet,
          date:   data.data.date,
          studentName: "", // will be set by a separate fetch if needed
        });
      })
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [childId]);

  // Auto-trigger print once sheets are in DOM
  useEffect(() => {
    if (state.status === "ready" && !printTriggered.current) {
      printTriggered.current = true;
      // Small delay to ensure DOM is fully painted
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [state.status]);

  // ── Loading / error / no-placement states ──
  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Preparing today's packet…</p>
        </div>
      </div>
    );
  }

  if (state.status === "no_placement") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-8">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-gold fill-none stroke-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 7 2 2 4-4"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold mb-3">Placement test needed</h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Your child hasn't taken the placement test yet. The test places them at
            exactly the right level — it takes 15 minutes and is free.
          </p>
          <Link href="/placement" className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3 rounded-lg text-sm font-medium hover:bg-ink-soft transition-colors">
            Take placement test
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current"><path d="M10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 11H5a1 1 0 1 1 0-2h7.586l-2.293-2.293a1 1 0 0 1 0-1.414z"/></svg>
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-8">
        <div className="max-w-md text-center">
          <p className="text-muted text-sm mb-4">Something went wrong: {state.message}</p>
          <Link href="/parent" className="text-sm text-brand-blue underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const { packet, date } = state;
  const sheets: Sheet[] = Array.isArray(packet.sheets) ? packet.sheets : [];

  return (
    <div className="min-h-screen bg-cream-dark">

      {/* ── Screen-only toolbar ─────────────────────────────────────────── */}
      <div className="print:hidden bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size="sm" />
            <div className="h-5 w-px bg-border" />
            <div>
              <div className="text-xs font-semibold text-ink">
                {packet.skillName} · {packet.levelCode}
              </div>
              <div className="text-[10px] text-muted">{date} · {sheets.length} sheets · {packet.problemsPerSheet} problems each</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAnswerKey}
                onChange={(e) => setShowAnswerKey(e.target.checked)}
                className="rounded"
              />
              Include answer key
            </label>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-ink text-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink-soft transition-colors"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1zm2 0h6v3H7V4zm-1 9v-1h8v4H6v-3zm8-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              Print / Save PDF
            </button>
            <Link href="/parent" className="text-xs text-muted hover:text-ink transition-colors">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tip bar — screen only ────────────────────────────────────────── */}
      <div className="print:hidden max-w-4xl mx-auto px-6 py-3">
        <div className="bg-brand-blue-light text-brand-blue text-xs rounded-lg px-4 py-2.5 flex items-center gap-2">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9z"/>
          </svg>
          <span>
            <strong>To save as PDF:</strong> Print dialog → change destination to "Save as PDF" → Save.
            All {sheets.length} sheets print in one file.{" "}
            {packet.printCount > 1 && <span className="opacity-70">Reprinted {packet.printCount - 1} time{packet.printCount > 2 ? "s" : ""} today — same problems each time.</span>}
          </span>
        </div>
      </div>

      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-12 print:p-0 print:max-w-none space-y-6 print:space-y-0">
        {sheets.map((sheet, si) => (
          <div
            key={sheet.sheetNumber}
            className={cn(
              "bg-white rounded-xl shadow-card print:shadow-none print:rounded-none",
              si > 0 && "print:break-before-page"
            )}
          >
            <WorksheetSheet
              sheet={sheet}
              levelCode={packet.levelCode}
              levelName={packet.levelName}
              skillName={packet.skillName}
              subjectSlug={packet.subjectSlug}
              totalSheets={sheets.length}
              timeLimitMinutes={packet.timeLimitMinutes}
              date={date}
              isAnswerKey={false}
            />
          </div>
        ))}

        {/* Answer key sheets — only if toggled on screen, always last */}
        {showAnswerKey && sheets.map((sheet, si) => (
          <div
            key={`ak-${sheet.sheetNumber}`}
            className={cn(
              "bg-white rounded-xl shadow-card print:shadow-none print:rounded-none print:break-before-page"
            )}
          >
            <WorksheetSheet
              sheet={sheet}
              levelCode={packet.levelCode}
              levelName={packet.levelName}
              skillName={packet.skillName}
              subjectSlug={packet.subjectSlug}
              totalSheets={sheets.length}
              timeLimitMinutes={packet.timeLimitMinutes}
              date={date}
              isAnswerKey={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WorksheetSheet ───────────────────────────────────────────────────────────

function WorksheetSheet({
  sheet, levelCode, levelName, skillName, subjectSlug,
  totalSheets, timeLimitMinutes, date, isAnswerKey,
}: {
  sheet: Sheet;
  levelCode: string;
  levelName: string;
  skillName: string;
  subjectSlug: string;
  totalSheets: number;
  timeLimitMinutes: number;
  date: string;
  isAnswerKey: boolean;
}) {
  const isMath    = subjectSlug === "MATH";
  const problems  = sheet.problems ?? [];
  const answerMap = Object.fromEntries(
    (sheet.answerKey ?? []).map((e) => [e.id, String(e.answer)])
  );

  return (
    <div className="p-8 print:p-[1.5cm_2cm]" style={{ fontFamily: "Georgia, serif" }}>

      {/* Header */}
      <div className={cn(
        "border-b-[2.5px] pb-3 mb-4 flex justify-between items-end",
        isAnswerKey ? "border-brand-green" : "border-ink"
      )}>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-sans">
            Eduyro Education · eduyro.com
          </div>
          <div className={cn("font-bold text-lg mt-0.5", isAnswerKey && "text-brand-green")}>
            {skillName}
            {isAnswerKey && <span className="ml-2 text-brand-green text-base"> — ANSWER KEY</span>}
          </div>
          <div className="text-xs text-muted mt-0.5 font-sans">
            {levelCode} · {levelName} ·{" "}
            {isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${totalSheets}`} ·
            Target: {timeLimitMinutes} min · {problems.length} problems
          </div>
        </div>
        <div className="text-xs text-muted/60 text-right font-sans shrink-0">
          Eduyro<br />Education
        </div>
      </div>

      {/* Name / Date / Score row */}
      {!isAnswerKey && (
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 mb-4 font-sans">
          {[
            { label: "Student Name", value: "" },
            { label: "Date", value: date },
            { label: "Score", value: `\u00a0/ ${problems.length}` },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[9px] uppercase tracking-wider text-muted/60 mb-1">{f.label}</div>
              <div className="border-b border-border-mid min-h-[20px] text-xs text-ink py-0.5">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {!isAnswerKey && (
        <div className="bg-cream-dark border-l-[3px] border-gold rounded-r-md text-[11px] text-muted italic px-3 py-2 mb-4 font-sans leading-relaxed">
          Write only the answer in each box. Try to finish in under {timeLimitMinutes} minutes. If stuck, skip and come back.
        </div>
      )}

      {/* Problems */}
      {isMath ? (
        <MathProblems problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} />
      ) : (
        <ProseProblems problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} />
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-dashed border-border flex justify-between text-[10px] text-muted/60 font-sans">
        <span>{levelCode} · Eduyro · {date}</span>
        <span>{isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${totalSheets}`}</span>
      </div>

      {!isAnswerKey && (
        <div className="mt-2 pt-2 border-t border-cream-dark text-[11px] text-muted/70 font-sans">
          Parent/Guardian Signature: ___________________________________&nbsp;&nbsp;Date checked: _______________
        </div>
      )}
    </div>
  );
}

// ─── Math grid layout ─────────────────────────────────────────────────────────

function MathProblems({
  problems, answerMap, isAnswerKey,
}: {
  problems: Problem[];
  answerMap: Record<string, string>;
  isAnswerKey: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-0.5 print:gap-y-0">
      {problems.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center justify-between py-1.5 border-b border-cream-dark/70 break-inside-avoid"
        >
          <span className="text-[10px] text-border font-sans w-5 flex-shrink-0">{i + 1}.</span>
          <span className="font-bold flex-1 text-base px-1">
            {p.question.trim().endsWith("=") ? p.question : `${p.question} =`}
          </span>
          <div className={cn(
            "w-12 h-5 border rounded text-xs font-bold flex items-center justify-center flex-shrink-0",
            isAnswerKey
              ? "bg-brand-green-light border-brand-green text-brand-green"
              : "border-border-mid bg-cream-dark/40"
          )}>
            {isAnswerKey ? answerMap[p.id] ?? "" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Prose problems (Reading / Writing / Science) ─────────────────────────────

function ProseProblems({
  problems, answerMap, isAnswerKey,
}: {
  problems: Problem[];
  answerMap: Record<string, string>;
  isAnswerKey: boolean;
}) {
  let qNum = 0;
  return (
    <div className="space-y-4 text-sm font-sans">
      {problems.map((p, i) => {
        const isPassage =
          answerMap[p.id] === "(passage — no answer required)" ||
          p.question.startsWith("READ THIS PASSAGE");

        if (isPassage) {
          const passageText = p.question
            .replace(/^READ THIS PASSAGE:\s*/i, "")
            .replace(/\n\nNow answer the questions below\.?/i, "")
            .trim();
          return (
            <div
              key={p.id}
              className="bg-brand-blue-light/40 border-l-[3px] border-brand-blue rounded-r-md px-4 py-3 text-sm leading-relaxed break-inside-avoid"
            >
              <strong>Read carefully:</strong> {passageText}
            </div>
          );
        }

        qNum++;
        const isMC = p.type === "multiple_choice" && Array.isArray(p.options) && p.options.length > 0;

        return (
          <div key={p.id} className="py-1 break-inside-avoid">
            <div className="font-semibold mb-1">{qNum}. {p.question}</div>
            {isMC ? (
              <div className="pl-4 space-y-1 text-xs text-muted">
                {p.options!.map((opt, oi) => {
                  const correct = isAnswerKey && opt === answerMap[p.id];
                  return (
                    <div key={oi} className={correct ? "text-brand-green font-semibold" : ""}>
                      {correct ? "●" : "○"} {opt}
                    </div>
                  );
                })}
              </div>
            ) : isAnswerKey ? (
              <div className="pl-4 text-brand-green font-semibold text-xs">{answerMap[p.id]}</div>
            ) : (
              <div className="space-y-1 pl-4">
                <div className="border-b border-border-mid min-h-[18px]" />
                <div className="border-b border-border-mid min-h-[18px]" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
