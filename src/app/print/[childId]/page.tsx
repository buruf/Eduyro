// src/app/print/[childId]/page.tsx
"use client";
import { MathText } from "@/components/MathText";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";

type Problem = {
  id: string; type: string; question: string;
  answer: string | number; options?: string[];
  explanation?: string; points: number;
};
type AnswerKeyEntry = { id: string; answer: string | number; explanation?: string };
type Sheet = { sheetNumber: number; problems: Problem[]; answerKey: AnswerKeyEntry[] };
type Packet = {
  id: string; studentId: string; date: string;
  levelCode: string; levelName: string; skillName: string;
  subjectSlug: string; sheets: Sheet[];
  problemsPerSheet: number; timeLimitMinutes: number; printCount: number;
};
type FetchState =
  | { status: "loading" }
  | { status: "no_placement" }
  | { status: "skipped" }
  | { status: "error"; message: string }
  | { status: "ready"; packet: Packet; date: string };

export default function PrintPage() {
  const { childId } = useParams<{ childId: string }>();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/students/${childId}/daily-packet`, {
        headers: {
          "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { setState({ status: "error", message: data.error ?? "Failed" }); return; }
        if (!data.data.packet) {
          const reason = data.data.reason;
          setState({ status: reason === "no_placement" ? "no_placement" : reason === "skipped" ? "skipped" : "error", message: "No packet" });
          return;
        }
        setState({ status: "ready", packet: data.data.packet, date: data.data.date });
      })
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [childId]);

  useEffect(() => {
    // Auto-print only applies to the HTML layout (non-math). Math packets
    // embed the real PDF, whose viewer has its own print UI.
    if (state.status === "ready" && state.packet.subjectSlug !== "MATH" && !printTriggered.current) {
      printTriggered.current = true;
      const t = setTimeout(() => window.print(), 900);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (state.status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#7A6E5F", fontSize: "14px" }}>Preparing today's packet…</p>
    </div>
  );

  if (state.status === "no_placement") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ maxWidth: "400px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "12px" }}>Placement test needed</h1>
        <p style={{ color: "#7A6E5F", fontSize: "14px", marginBottom: "20px" }}>Your child hasn't taken the placement test yet. It takes 15 minutes and is free.</p>
        <Link href="/placement" style={{ background: "#1A1612", color: "white", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", textDecoration: "none" }}>Take placement test</Link>
      </div>
    </div>
  );

  if (state.status === "skipped") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ maxWidth: "400px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌴</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "12px" }}>Today is a rest day</h1>
        <p style={{ color: "#7A6E5F", fontSize: "14px", marginBottom: "20px" }}>This session was skipped. Enjoy the break — practice picks up right where it left off.</p>
        <Link href="/parent" style={{ color: "#1B4F8A", fontSize: "14px" }}>← Back to dashboard</Link>
      </div>
    </div>
  );

  if (state.status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#7A6E5F", fontSize: "14px", marginBottom: "12px" }}>Something went wrong: {(state as any).message}</p>
        <Link href="/parent" style={{ color: "#1B4F8A", fontSize: "14px" }}>← Back to dashboard</Link>
      </div>
    </div>
  );

  const { packet, date } = state;
  const sheets: Sheet[] = Array.isArray(packet.sheets) ? packet.sheets : [];

  // ── MATH: embed the REAL PDF (same engine + same renderer as shop packs) ──
  // so what parents print is identical to a purchased Eduyro worksheet.
  if (packet.subjectSlug === "MATH") {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const pdfUrl = `/api/students/${packet.studentId}/daily-packet/pdf?tz=${encodeURIComponent(tz)}`;
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#e5e7eb" }}>
        <div style={{ background: "white", borderBottom: "1px solid #E8E0D0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <BrandLogo size="sm" />
            <div style={{ width: "1px", height: "20px", background: "#E8E0D0" }} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1A1612" }}>{packet.skillName} · {packet.levelCode}</div>
              <div style={{ fontSize: "10px", color: "#7A6E5F" }}>{date} · {sheets.length} worksheets + answer key · same layout as Eduyro shop packs</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{ background: "#1A1612", color: "white", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
            >
              🖨 Open & print PDF
            </a>
            <Link href="/parent" style={{ fontSize: "12px", color: "#7A6E5F", textDecoration: "none" }}>← Dashboard</Link>
          </div>
        </div>
        <iframe
          src={pdfUrl}
          title="Today's worksheet packet"
          style={{ flex: 1, border: "none", width: "100%" }}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @media screen {
          body { background: #e5e7eb; }
          .toolbar { position: sticky; top: 0; z-index: 100; background: white; border-bottom: 1px solid #E8E0D0; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; }
          .sheet-wrapper { width: 8.5in; min-height: 11in; background: white; margin: 24px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0.6in 0.7in; }
        }

        @media print {
          @page { size: letter portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .toolbar { display: none !important; }
          .sheet-wrapper {
            width: 100vw;
            height: 100vh;
            padding: 0.5in 0.6in;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            /* Scale down to guarantee fit — zoom is supported in Chrome/Edge,
               transform fallback for Firefox */
            transform-origin: top left;
          }
          .sheet-wrapper:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <BrandLogo size="sm" />
          <div style={{ width: "1px", height: "20px", background: "#E8E0D0" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#1A1612" }}>{packet.skillName} · {packet.levelCode}</div>
            <div style={{ fontSize: "10px", color: "#7A6E5F" }}>{date} · {sheets.length} worksheets + {sheets.length} answer keys = {sheets.length * 2} pages total</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.print()}
            style={{ background: "#1A1612", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            🖨 Print / Save PDF
          </button>
          <Link href="/parent" style={{ fontSize: "12px", color: "#7A6E5F", textDecoration: "none" }}>← Dashboard</Link>
        </div>
      </div>

      {/* Worksheet pages first, then answer key pages */}
      {sheets.map((sheet) => <SheetPage key={`s${sheet.sheetNumber}`} sheet={sheet} packet={packet} date={date} isAnswerKey={false} />)}
      {sheets.map((sheet) => <SheetPage key={`ak${sheet.sheetNumber}`} sheet={sheet} packet={packet} date={date} isAnswerKey={true} />)}
    </>
  );
}

function SheetPage({ sheet, packet, date, isAnswerKey }: {
  sheet: Sheet; packet: Packet; date: string; isAnswerKey: boolean;
}) {
  const isMath = packet.subjectSlug === "MATH";
  const problems = sheet.problems ?? [];
  const answerMap = Object.fromEntries((sheet.answerKey ?? []).map((e) => [e.id, String(e.answer)]));
  const count = problems.length;

  // Dynamic sizing: shrink everything proportionally based on problem count
  const scale = count <= 20 ? 1 : count <= 30 ? 0.88 : count <= 40 ? 0.78 : 0.68;
  const baseFontPt = Math.round(11 * scale);
  const rowPadPt   = count <= 20 ? 5 : count <= 30 ? 3 : 2;

  return (
    <div className="sheet-wrapper" style={{ fontFamily: "Georgia, serif" }}>
      {/* Apply scale via inline style for both screen and print */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${100/scale}%`, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ borderBottom: `2.5px solid ${isAnswerKey ? "#2D6A3F" : "#1A1612"}`, paddingBottom: "6pt", marginBottom: "6pt", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#7A6E5F", fontFamily: "DM Sans, sans-serif" }}>Eduyro Education · eduyro.com</div>
            <div style={{ fontWeight: "bold", fontSize: "14pt", marginTop: "2pt", color: isAnswerKey ? "#2D6A3F" : "#1A1612" }}>
              {packet.skillName}{isAnswerKey && <span style={{ fontSize: "11pt" }}> — ANSWER KEY</span>}
            </div>
            <div style={{ fontSize: "9pt", color: "#7A6E5F", marginTop: "1pt", fontFamily: "DM Sans, sans-serif" }}>
              {packet.levelCode} · {packet.levelName} · {isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${packet.sheets.length}`} · Target: {packet.timeLimitMinutes} min · {count} problems
            </div>
          </div>
          <div style={{ fontSize: "8pt", color: "#aaa", textAlign: "right", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>Eduyro<br />Education</div>
        </div>

        {/* Name / Date / Score */}
        {!isAnswerKey && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12pt", marginBottom: "6pt", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
            {[{ label: "Student Name", val: "" }, { label: "Date", val: date }, { label: `Score  / ${count}`, val: "" }].map((f) => (
              <div key={f.label}>
                <div style={{ fontSize: "7pt", textTransform: "uppercase", letterSpacing: "0.07em", color: "#bbb", marginBottom: "2pt" }}>{f.label}</div>
                <div style={{ borderBottom: "1px solid #D0C8B8", minHeight: "14pt", fontSize: "9pt" }}>{f.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {!isAnswerKey && (
          <div style={{ background: "#F5F0E8", borderLeft: "3px solid #C8902A", padding: "4pt 8pt", marginBottom: "6pt", fontSize: "9pt", color: "#7A6E5F", fontStyle: "italic", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
            Write only the answer in each box. Aim to finish in {packet.timeLimitMinutes} minutes. Skip and come back if stuck.
          </div>
        )}

        {/* Problems */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {isMath
            ? <MathGrid problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} rowPadPt={rowPadPt} fontPt={baseFontPt} />
            : <ProseList problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} fontPt={baseFontPt} />
          }
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px dashed #E8E0D0", paddingTop: "4pt", marginTop: "4pt", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#bbb", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
          <span>{packet.levelCode} · Eduyro · {date}</span>
          <span>{isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${packet.sheets.length}`}</span>
        </div>

        {!isAnswerKey && (
          <div style={{ borderTop: "1px solid #F5F0E8", paddingTop: "3pt", marginTop: "3pt", fontSize: "9pt", color: "#bbb", fontFamily: "DM Sans, sans-serif", flexShrink: 0 }}>
            Parent/Guardian Signature: ___________________________________ Date checked: _______________
          </div>
        )}
      </div>
    </div>
  );
}

function MathGrid({ problems, answerMap, isAnswerKey, rowPadPt, fontPt }: {
  problems: Problem[]; answerMap: Record<string, string>;
  isAnswerKey: boolean; rowPadPt: number; fontPt: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: "16pt", height: "100%" }}>
      {problems.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F0E8", paddingTop: `${rowPadPt}pt`, paddingBottom: `${rowPadPt}pt`, pageBreakInside: "avoid", breakInside: "avoid" }}>
          <span style={{ fontSize: "8pt", color: "#ccc", fontFamily: "DM Sans, sans-serif", width: "14pt", flexShrink: 0 }}>{i + 1}.</span>
          <span style={{ fontWeight: "bold", flex: 1, fontSize: `${fontPt}pt`, padding: "0 4pt" }}>
            <MathText>{p.question.trim().endsWith("=") ? p.question : `${p.question} =`}</MathText>
          </span>
          <div style={{ width: "34pt", height: "14pt", border: `1px solid ${isAnswerKey ? "#2D6A3F" : "#D0C8B8"}`, borderRadius: "3pt", background: isAnswerKey ? "#E3F2E8" : "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", fontWeight: "bold", color: isAnswerKey ? "#2D6A3F" : "transparent", flexShrink: 0 }}>
            {isAnswerKey ? answerMap[p.id] ?? "" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProseList({ problems, answerMap, isAnswerKey, fontPt }: {
  problems: Problem[]; answerMap: Record<string, string>;
  isAnswerKey: boolean; fontPt: number;
}) {
  let qNum = 0;
  return (
    <div style={{ fontSize: `${fontPt}pt`, fontFamily: "DM Sans, sans-serif", height: "100%", overflow: "hidden" }}>
      {problems.map((p) => {
        const isPassage = answerMap[p.id] === "(passage — no answer required)" || p.question.startsWith("READ THIS PASSAGE");
        if (isPassage) {
          const txt = p.question.replace(/^READ THIS PASSAGE:\s*/i, "").replace(/\n\nNow answer the questions below\.?/i, "").trim();
          return (
            <div key={p.id} style={{ background: "#E4EEF8", borderLeft: "3px solid #1B4F8A", padding: "5pt 8pt", marginBottom: "5pt", lineHeight: 1.4, pageBreakInside: "avoid", breakInside: "avoid" }}>
              <strong>Read carefully:</strong> {txt}
            </div>
          );
        }
        qNum++;
        const isMC = p.type === "multiple_choice" && Array.isArray(p.options) && p.options.length > 0;
        return (
          <div key={p.id} style={{ marginBottom: "4pt", pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div style={{ fontWeight: "600", marginBottom: "2pt" }}>{qNum}. {p.question}</div>
            {isMC ? (
              <div style={{ paddingLeft: "10pt", display: "flex", flexWrap: "wrap", gap: "3pt 14pt" }}>
                {p.options!.map((opt, oi) => {
                  const correct = isAnswerKey && opt === answerMap[p.id];
                  return <span key={oi} style={{ color: correct ? "#2D6A3F" : "#7A6E5F", fontWeight: correct ? "bold" : "normal" }}>{correct ? "●" : "○"} {opt}</span>;
                })}
              </div>
            ) : isAnswerKey ? (
              <div style={{ paddingLeft: "10pt", color: "#2D6A3F", fontWeight: "bold" }}>{answerMap[p.id]}</div>
            ) : (
              <div style={{ paddingLeft: "10pt" }}><div style={{ borderBottom: "1px solid #D0C8B8", minHeight: "13pt" }} /></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
