// src/app/print/[childId]/upcoming/page.tsx
// Parent "vacation pack" — prints the next N days of practice ahead of time so a
// child can keep working on paper while away. Renders every day's worksheets +
// answer keys with day separators; one sheet per printed page.
"use client";
import { MathText } from "@/components/MathText";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";

type Problem = { id: string; type: string; question: string; answer: string | number; options?: string[]; points: number };
type AnswerKeyEntry = { id: string; answer: string | number };
type Sheet = { sheetNumber: number; problems: Problem[]; answerKey: AnswerKeyEntry[] };
type DayPacket = { day: number; sheets: Sheet[] };
type Data = {
  student: { id: string; name: string | null };
  levelCode: string; levelName: string; skillName: string; subjectSlug: string;
  problemsPerSheet: number; timeLimitMinutes: number; days: number; packets: DayPacket[];
};
type State = { status: "loading" } | { status: "no_placement" } | { status: "error"; message: string } | { status: "ready"; data: Data };

export default function UpcomingPrintPage() {
  const { childId } = useParams<{ childId: string }>();
  const sp = useSearchParams();
  const days = sp.get("days") ?? "5";
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/students/${childId}/upcoming-packets?days=${encodeURIComponent(days)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return setState({ status: "error", message: d.error ?? "Failed" });
        if (!d.data.packets?.length) return setState({ status: d.data.reason === "no_placement" ? "no_placement" : "error", message: "No upcoming work" });
        setState({ status: "ready", data: d.data });
      })
      .catch((e) => setState({ status: "error", message: e.message }));
  }, [childId, days]);

  if (state.status === "loading") return <Centered>Preparing the next {days} days…</Centered>;
  if (state.status === "no_placement") return (
    <Centered>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, marginBottom: 12 }}>Placement test needed</h1>
        <p style={{ color: "#7A6E5F", fontSize: 14, marginBottom: 20 }}>Your child hasn't been placed yet, so there's no curriculum to print ahead.</p>
        <Link href="/placement" style={{ background: "#1A1612", color: "white", padding: "12px 24px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}>Take placement test</Link>
      </div>
    </Centered>
  );
  if (state.status === "error") return (
    <Centered><div style={{ textAlign: "center" }}><p style={{ color: "#7A6E5F", fontSize: 14, marginBottom: 12 }}>Something went wrong: {state.message}</p><Link href="/parent" style={{ color: "#1B4F8A", fontSize: 14 }}>← Back to dashboard</Link></div></Centered>
  );

  const { data } = state;
  const meta = { skillName: data.skillName, levelCode: data.levelCode, levelName: data.levelName, timeLimitMinutes: data.timeLimitMinutes, subjectSlug: data.subjectSlug, totalSheets: data.packets[0]?.sheets.length ?? 3 };

  // ── MATH: embed the REAL PDF (same engine + renderer as shop packs and the
  // "print today's packet" flow) so the vacation pack is identical to a
  // purchased Eduyro worksheet. R/W/S fall through to the HTML layout below
  // (they need multiple-choice options the math renderer doesn't draw).
  if (data.subjectSlug === "MATH") {
    const pdfUrl = `/api/students/${data.student.id}/upcoming-packets/pdf?days=${encodeURIComponent(String(data.days))}`;
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#e5e7eb" }}>
        <div style={{ background: "white", borderBottom: "1px solid #E8E0D0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <BrandLogo size="sm" />
            <div style={{ width: 1, height: 20, background: "#E8E0D0" }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1612" }}>{data.student.name ?? "Student"} · {data.skillName} · {data.levelCode}</div>
              <div style={{ fontSize: 10, color: "#7A6E5F" }}>Vacation pack · {data.days} days × {meta.totalSheets} sheets · same layout as Eduyro shop packs</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ background: "#1A1612", color: "white", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>🖨 Open &amp; print PDF</a>
            <Link href="/parent" style={{ fontSize: 12, color: "#7A6E5F", textDecoration: "none" }}>← Dashboard</Link>
          </div>
        </div>
        <iframe src={pdfUrl} title={`${data.days}-day vacation pack`} style={{ flex: 1, border: "none", width: "100%" }} />
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
          .day-banner { width: 8.5in; margin: 28px auto 0; font-family: 'DM Sans', sans-serif; font-weight: 700; color: #1A1612; font-size: 13px; }
          .sheet-wrapper { width: 8.5in; min-height: 11in; background: white; margin: 12px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0.6in 0.7in; }
        }
        @media print {
          @page { size: letter portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .toolbar, .day-banner { display: none !important; }
          .sheet-wrapper { width: 100vw; height: 100vh; padding: 0.5in 0.6in; page-break-after: always; break-after: page; overflow: hidden; display: flex; flex-direction: column; }
          .sheet-wrapper:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>

      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandLogo size="sm" />
          <div style={{ width: 1, height: 20, background: "#E8E0D0" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1612" }}>{data.student.name ?? "Student"} · {data.skillName} · {data.levelCode}</div>
            <div style={{ fontSize: 10, color: "#7A6E5F" }}>Vacation pack · {data.days} days × {meta.totalSheets} sheets = {data.days * meta.totalSheets} worksheets + answer keys</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => window.print()} style={{ background: "#1A1612", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🖨 Print / Save PDF</button>
          <Link href="/parent" style={{ fontSize: 12, color: "#7A6E5F", textDecoration: "none" }}>← Dashboard</Link>
        </div>
      </div>

      {data.packets.map((dp) => (
        <div key={dp.day}>
          <div className="day-banner">Day {dp.day}</div>
          {dp.sheets.map((s) => <SheetPage key={`d${dp.day}s${s.sheetNumber}`} sheet={s} meta={meta} dayLabel={`Day ${dp.day}`} isAnswerKey={false} />)}
          {dp.sheets.map((s) => <SheetPage key={`d${dp.day}ak${s.sheetNumber}`} sheet={s} meta={meta} dayLabel={`Day ${dp.day}`} isAnswerKey={true} />)}
        </div>
      ))}
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}><p style={{ color: "#7A6E5F", fontSize: 14 }}>{children}</p></div>;
}

type Meta = { skillName: string; levelCode: string; levelName: string; timeLimitMinutes: number; subjectSlug: string; totalSheets: number };

function SheetPage({ sheet, meta, dayLabel, isAnswerKey }: { sheet: Sheet; meta: Meta; dayLabel: string; isAnswerKey: boolean }) {
  const isMath = meta.subjectSlug === "MATH";
  const problems = sheet.problems ?? [];
  const answerMap = Object.fromEntries((sheet.answerKey ?? []).map((e) => [e.id, String(e.answer)]));
  const count = problems.length;
  const scale = count <= 20 ? 1 : count <= 30 ? 0.88 : count <= 40 ? 0.78 : 0.68;
  const fontPt = Math.round(11 * scale);
  const rowPadPt = count <= 20 ? 5 : count <= 30 ? 3 : 2;

  return (
    <div className="sheet-wrapper" style={{ fontFamily: "Georgia, serif" }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${100 / scale}%`, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ borderBottom: `2.5px solid ${isAnswerKey ? "#2D6A3F" : "#1A1612"}`, paddingBottom: "6pt", marginBottom: "6pt", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#7A6E5F", fontFamily: "DM Sans, sans-serif" }}>Eduyro Education · eduyro.com</div>
            <div style={{ fontWeight: "bold", fontSize: "14pt", marginTop: "2pt", color: isAnswerKey ? "#2D6A3F" : "#1A1612" }}>{meta.skillName}{isAnswerKey && <span style={{ fontSize: "11pt" }}> — ANSWER KEY</span>}</div>
            <div style={{ fontSize: "9pt", color: "#7A6E5F", marginTop: "1pt", fontFamily: "DM Sans, sans-serif" }}>{meta.levelCode} · {meta.levelName} · {dayLabel} · {isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${meta.totalSheets}`} · Target: {meta.timeLimitMinutes} min · {count} problems</div>
          </div>
          <div style={{ fontSize: "8pt", color: "#aaa", textAlign: "right", fontFamily: "DM Sans, sans-serif" }}>Eduyro<br />Education</div>
        </div>

        {!isAnswerKey && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12pt", marginBottom: "6pt", fontFamily: "DM Sans, sans-serif" }}>
            {[{ label: "Student Name", val: "" }, { label: dayLabel, val: "" }, { label: `Score  / ${count}`, val: "" }].map((f) => (
              <div key={f.label}><div style={{ fontSize: "7pt", textTransform: "uppercase", letterSpacing: "0.07em", color: "#bbb", marginBottom: "2pt" }}>{f.label}</div><div style={{ borderBottom: "1px solid #D0C8B8", minHeight: "14pt", fontSize: "9pt" }}>{f.val}</div></div>
            ))}
          </div>
        )}

        {!isAnswerKey && (
          <div style={{ background: "#F5F0E8", borderLeft: "3px solid #C8902A", padding: "4pt 8pt", marginBottom: "6pt", fontSize: "9pt", color: "#7A6E5F", fontStyle: "italic", fontFamily: "DM Sans, sans-serif" }}>Write only the answer in each box. Aim to finish in {meta.timeLimitMinutes} minutes. Skip and come back if stuck.</div>
        )}

        <div style={{ flex: 1, overflow: "hidden" }}>
          {isMath
            ? <MathGrid problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} rowPadPt={rowPadPt} fontPt={fontPt} />
            : <ProseList problems={problems} answerMap={answerMap} isAnswerKey={isAnswerKey} fontPt={fontPt} />}
        </div>

        <div style={{ borderTop: "1px dashed #E8E0D0", paddingTop: "4pt", marginTop: "4pt", display: "flex", justifyContent: "space-between", fontSize: "8pt", color: "#bbb", fontFamily: "DM Sans, sans-serif" }}>
          <span>{meta.levelCode} · Eduyro · {dayLabel}</span>
          <span>{isAnswerKey ? `Answer Key — Sheet ${sheet.sheetNumber}` : `Sheet ${sheet.sheetNumber} of ${meta.totalSheets}`}</span>
        </div>
      </div>
    </div>
  );
}

function MathGrid({ problems, answerMap, isAnswerKey, rowPadPt, fontPt }: { problems: Problem[]; answerMap: Record<string, string>; isAnswerKey: boolean; rowPadPt: number; fontPt: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: "16pt", height: "100%" }}>
      {problems.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F5F0E8", paddingTop: `${rowPadPt}pt`, paddingBottom: `${rowPadPt}pt`, breakInside: "avoid" }}>
          <span style={{ fontSize: "8pt", color: "#ccc", fontFamily: "DM Sans, sans-serif", width: "14pt", flexShrink: 0 }}>{i + 1}.</span>
          <span style={{ fontWeight: "bold", flex: 1, fontSize: `${fontPt}pt`, padding: "0 4pt" }}><MathText>{p.question.trim().endsWith("=") ? p.question : `${p.question} =`}</MathText></span>
          <div style={{ width: "34pt", height: "14pt", border: `1px solid ${isAnswerKey ? "#2D6A3F" : "#D0C8B8"}`, borderRadius: "3pt", background: isAnswerKey ? "#E3F2E8" : "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8pt", fontWeight: "bold", color: isAnswerKey ? "#2D6A3F" : "transparent", flexShrink: 0 }}>{isAnswerKey ? answerMap[p.id] ?? "" : ""}</div>
        </div>
      ))}
    </div>
  );
}

function ProseList({ problems, answerMap, isAnswerKey, fontPt }: { problems: Problem[]; answerMap: Record<string, string>; isAnswerKey: boolean; fontPt: number }) {
  let qNum = 0;
  return (
    <div style={{ fontSize: `${fontPt}pt`, fontFamily: "DM Sans, sans-serif", height: "100%", overflow: "hidden" }}>
      {problems.map((p) => {
        const isPassage = answerMap[p.id] === "(passage — no answer required)" || p.question.startsWith("READ THIS PASSAGE");
        if (isPassage) {
          const txt = p.question.replace(/^READ THIS PASSAGE:\s*/i, "").replace(/\n\nNow answer the questions below\.?/i, "").trim();
          return <div key={p.id} style={{ background: "#E4EEF8", borderLeft: "3px solid #1B4F8A", padding: "5pt 8pt", marginBottom: "5pt", lineHeight: 1.4, breakInside: "avoid" }}><strong>Read carefully:</strong> {txt}</div>;
        }
        qNum++;
        const isMC = p.type === "multiple_choice" && Array.isArray(p.options) && p.options.length > 0;
        return (
          <div key={p.id} style={{ marginBottom: "4pt", breakInside: "avoid" }}>
            <div style={{ fontWeight: "600", marginBottom: "2pt" }}>{qNum}. {p.question}</div>
            {isMC ? (
              <div style={{ paddingLeft: "10pt", display: "flex", flexWrap: "wrap", gap: "3pt 14pt" }}>
                {p.options!.map((opt, oi) => { const correct = isAnswerKey && opt === answerMap[p.id]; return <span key={oi} style={{ color: correct ? "#2D6A3F" : "#7A6E5F", fontWeight: correct ? "bold" : "normal" }}>{correct ? "●" : "○"} {opt}</span>; })}
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
