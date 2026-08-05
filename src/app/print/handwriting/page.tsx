// src/app/print/handwriting/page.tsx
// W0 Handwriting & Mechanics — the PRINTABLE side of the level (pencil strokes
// can't be auto-graded; the in-app W0 skills carry the knowledge-MC side).
// Three sections mirror the W0 sub-skills:
//   1. Letter Formation — trace big grey letters on 4-line guides, then write.
//   2. Spatial Awareness — trace whole words, keeping size/spacing/baseline.
//   3. Basic Copying — copy sentences, then a short paragraph, onto ruled lines.
// Self-contained (no backend); a selector picks the letter group so a parent
// can print exactly what the child is practising this week.
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";

const LETTER_GROUPS: Record<string, string[]> = {
  "A–F": ["Aa", "Bb", "Cc", "Dd", "Ee", "Ff"],
  "G–L": ["Gg", "Hh", "Ii", "Jj", "Kk", "Ll"],
  "M–R": ["Mm", "Nn", "Oo", "Pp", "Qq", "Rr"],
  "S–Z": ["Ss", "Tt", "Uu", "Vv", "Ww", "Xx", "Yy", "Zz"],
};

const TRACE_WORDS: Record<string, string[]> = {
  "A–F": ["cab", "bed", "face", "dad"],
  "G–L": ["hill", "jig", "lake", "girl"],
  "M–R": ["moon", "rain", "pond", "quip"],
  "S–Z": ["sun", "wave", "zoo", "yes"],
};

const COPY_SENTENCES = [
  "The cat sat on the mat.",
  "I can run and jump.",
  "We like to read books.",
];

const COPY_PARAGRAPH =
  "My name is Sam. I have a small dog. His name is Rex. We play in the park.";

// One 4-line handwriting row: top line, dashed midline, BASE line (bold),
// descender line. Content (trace letters) sits on the baseline.
function GuideRow({ children, tall = false }: { children?: React.ReactNode; tall?: boolean }) {
  return (
    <div className={`guide-row${tall ? " tall" : ""}`}>
      <div className="gl top" />
      <div className="gl mid" />
      <div className="gl base" />
      <div className="row-content">{children}</div>
    </div>
  );
}

function HandwritingInner() {
  const params = useSearchParams();
  const [group, setGroup] = useState<keyof typeof LETTER_GROUPS>("A–F");

  useEffect(() => {
    const g = params.get("letters");
    if (g && g in LETTER_GROUPS) setGroup(g as keyof typeof LETTER_GROUPS);
  }, [params]);

  useEffect(() => {
    document.title = `Eduyro Handwriting — Letters ${group}`;
  }, [group]);

  const letters = LETTER_GROUPS[group];
  const words = TRACE_WORDS[group];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media screen {
          body { background: #e5e7eb; }
          .toolbar { position: sticky; top: 0; z-index: 100; background: white; border-bottom: 1px solid #E8E0D0; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
          .sheet-wrapper { width: 8.5in; min-height: 11in; background: white; margin: 24px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 0.55in 0.65in; }
        }
        @media print {
          @page { size: letter portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .toolbar { display: none !important; }
          .sheet-wrapper { width: 8.5in; min-height: 11in; padding: 0.55in 0.65in; page-break-after: always; }
          .sheet-wrapper:last-child { page-break-after: auto; }
        }
        .hw-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 3px solid #1A1612; padding-bottom: 8px; margin-bottom: 4px; }
        .hw-title { font: 700 20px Georgia, serif; color: #1A1612; }
        .hw-sub { font: 600 11px system-ui; color: #7A6E5F; text-transform: uppercase; letter-spacing: 0.1em; }
        .name-line { font: 500 12px system-ui; color: #7A6E5F; margin: 8px 0 14px; }
        .sec-label { font: 700 12px system-ui; color: #C8902A; text-transform: uppercase; letter-spacing: 0.08em; margin: 14px 0 6px; }
        .tip { font: 500 11px system-ui; color: #7A6E5F; margin-bottom: 8px; }

        .guide-row { position: relative; height: 0.62in; margin-bottom: 0.16in; }
        .guide-row.tall { height: 0.72in; }
        .gl { position: absolute; left: 0; right: 0; }
        .gl.top  { top: 0; border-top: 1.5px solid #b9c3d0; }
        .gl.mid  { top: 50%; border-top: 1.5px dashed #b9c3d0; }
        .gl.base { bottom: 0; border-top: 2px solid #6b7280; }
        .row-content { position: absolute; left: 6px; right: 0; bottom: -0.17in; height: 100%; display: flex; align-items: flex-end; gap: 28px; overflow: hidden; }
        .trace { font: 400 0.62in/0.79in "Comic Sans MS", "Segoe Print", cursive; color: #c9c2b4; letter-spacing: 10px; }
        .trace.word { letter-spacing: 4px; }
        .copy-line { border-bottom: 1.5px solid #9aa3af; height: 0.42in; }
        .copy-text { font: 500 15px/1.5 Georgia, serif; color: #1A1612; margin-bottom: 4px; }
        .footer { margin-top: 18px; display: flex; justify-content: space-between; font: 500 10px system-ui; color: #7A6E5F; }
      `}</style>

      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandLogo size="sm" />
          <strong>W0 Handwriting printables</strong>
          <label style={{ fontSize: 13 }}>
            Letters:{" "}
            <select value={group} onChange={(e) => setGroup(e.target.value as keyof typeof LETTER_GROUPS)}>
              {Object.keys(LETTER_GROUPS).map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/parent" style={{ fontSize: 13 }}>← Back</Link>
          <button onClick={() => window.print()} style={{ padding: "6px 16px", background: "#1B4F8A", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>Print</button>
        </div>
      </div>

      {/* ── Page 1: Letter Formation ── */}
      <div className="sheet-wrapper">
        <div className="hw-head"><span className="hw-title">Letter Formation — {group}</span><span className="hw-sub">W0 · Handwriting</span></div>
        <div className="name-line">Name: ______________________ &nbsp;&nbsp; Date: ____________</div>
        <div className="sec-label">Trace each letter, then write your own on the rest of the line</div>
        <p className="tip">Tall letters touch the top line · small letters start at the dashed line · every letter sits on the dark bottom line.</p>
        {letters.map((pair) => (
          <GuideRow key={pair} tall>
            <span className="trace">{pair} {pair}</span>
          </GuideRow>
        ))}
        <div className="footer"><span>W0 · Letter Formation · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
      </div>

      {/* ── Page 2: Spatial Awareness ── */}
      <div className="sheet-wrapper">
        <div className="hw-head"><span className="hw-title">Size & Spacing — {group}</span><span className="hw-sub">W0 · Handwriting</span></div>
        <div className="name-line">Name: ______________________ &nbsp;&nbsp; Date: ____________</div>
        <div className="sec-label">Trace each word, then write it two more times</div>
        <p className="tip">Keep letters the right size, leave a finger space between words, and stay on the bottom line.</p>
        {words.map((w) => (
          <GuideRow key={w} tall>
            <span className="trace word">{w}</span>
          </GuideRow>
        ))}
        <div className="sec-label">Now write a word of your own on each line</div>
        <GuideRow /><GuideRow />
        <div className="footer"><span>W0 · Spatial Awareness · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
      </div>

      {/* ── Page 3: Basic Copying ── */}
      <div className="sheet-wrapper">
        <div className="hw-head"><span className="hw-title">Copy It Carefully</span><span className="hw-sub">W0 · Handwriting</span></div>
        <div className="name-line">Name: ______________________ &nbsp;&nbsp; Date: ____________</div>
        <div className="sec-label">Copy each sentence on the line below it</div>
        {COPY_SENTENCES.map((s) => (
          <div key={s} style={{ marginBottom: "0.18in" }}>
            <div className="copy-text">{s}</div>
            <div className="copy-line" />
          </div>
        ))}
        <div className="sec-label">Copy the whole paragraph</div>
        <div className="copy-text" style={{ marginBottom: 8 }}>{COPY_PARAGRAPH}</div>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="copy-line" />)}
        <div className="footer"><span>W0 · Basic Copying · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
      </div>
    </>
  );
}

export default function PrintHandwritingPage() {
  return <Suspense fallback={null}><HandwritingInner /></Suspense>;
}
