// src/app/print/fluency/page.tsx
// Reading-fluency PRINTABLES for R3 (Grade 1), R12 (Grade 2) and the reading
// log used by R60's stamina unit. Fluency is read-ALOUD work — words correct
// per minute — which can't be screen-graded (council amendment), so like W0
// handwriting it lives as parent-guided print pages:
//   • word/phrase/sentence sheets with per-line word counts for easy WPM math
//   • a 1-minute timed passage with a words-per-minute progress chart
// Self-contained; a selector picks the level.
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";

const G1_WORDS = [
  "the", "and", "see", "can", "run", "big", "red", "top", "sun", "map",
  "hat", "leg", "pig", "box", "cup", "bed", "dog", "sit", "ten", "wet",
  "jump", "play", "stop", "fast", "hand", "ship", "lunch", "black", "tree", "frog",
  "rain", "boat", "cake", "ride", "seed", "moon", "light", "found", "small", "start",
];
const G1_PHRASES = [
  "the big dog", "on the mat", "in the sun", "ran to me", "a red hat",
  "we can go", "at the top", "up the hill", "my best friend", "into the box",
  "under the bed", "after the rain", "by the tree", "with a smile", "over the moon",
  "come and see", "look at that", "time to play", "off we go", "one more time",
];
const G1_SENTENCES = [
  "The cat sat on the mat.", "I can run fast.", "We like to play outside.",
  "The sun is hot today.", "My dog can jump high.", "She has a red hat.",
  "We went to the park.", "Look at the big tree!",
];
const G1_PASSAGE: [string, number][] = [
  ["Sam has a little dog named Rex.", 7],
  ["Rex likes to run and jump all day.", 15],
  ["One day Rex saw a frog by the pond.", 24],
  ["The frog hopped and Rex ran after it.", 32],
  ["The frog jumped into the water with a splash.", 41],
  ["Rex barked and barked at the pond.", 48],
  ["Sam laughed and called his dog home.", 55],
  ["Rex ran back with his tail wagging fast.", 63],
];
const G2_SENTENCES = [
  "After breakfast, we walked to the library together.", "The little boat floated slowly across the quiet lake.",
  "My sister found a shiny rock near the garden gate.", "Before bed, Dad reads us one chapter of our book.",
  "The hungry birds waited on the fence for their seeds.", "When it rains, we play board games in the kitchen.",
  "The bus stopped at the corner right on time.", "Everyone clapped when the magician finished his trick.",
  "Grandma's cookies smell better than anything in the world.", "At the museum, we saw bones from a real dinosaur.",
];
const G2_PASSAGE: [string, number][] = [
  ["Maya wanted to grow a garden of her own.", 9],
  ["In March she planted tiny seeds in paper cups.", 18],
  ["Every morning she gave each cup a little water.", 27],
  ["Soon small green shoots pushed up through the soil.", 36],
  ["When spring came, Maya moved the plants outside.", 44],
  ["She pulled weeds and chased away the hungry rabbits.", 53],
  ["By summer the garden was full of red tomatoes.", 62],
  ["Maya shared them with every neighbor on her street.", 71],
  ["Growing things, she learned, takes patience and care.", 79],
];

const LEVELS = { R3: "Grade 1 — Reading Fluency", R12: "Grade 2 — Reading Fluency II", LOG: "Reading Log (any level)" } as const;
type LevelKey = keyof typeof LEVELS;

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <div className="fl-head"><span className="fl-title">{title}</span><span className="fl-sub">{sub}</span></div>
      <div className="name-line">Name: ______________________ &nbsp;&nbsp; Date: ____________</div>
    </>
  );
}

function WpmChart() {
  return (
    <>
      <div className="sec-label">Words-per-minute chart — one row per try</div>
      <table className="wpm">
        <thead><tr><th>Try</th><th>Words read</th><th>Errors</th><th>WPM (words − errors)</th><th>How did it sound?</th></tr></thead>
        <tbody>{[1, 2, 3].map((i) => <tr key={i}><td>{i}</td><td /><td /><td /><td /></tr>)}</tbody>
      </table>
      <p className="tip">Parent: time exactly 1 minute. Mark the last word read, count errors (skipped or wrong words — self-corrections don't count). Rereading the SAME passage across tries is the point: watch the number climb.</p>
    </>
  );
}

function FluencyInner() {
  const params = useSearchParams();
  const [level, setLevel] = useState<LevelKey>("R3");
  useEffect(() => {
    const q = (params.get("level") || "").toUpperCase();
    if (q && q in LEVELS) setLevel(q as LevelKey);
  }, [params]);
  useEffect(() => { document.title = `Eduyro Fluency — ${LEVELS[level]}`; }, [level]);

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
        .fl-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 3px solid #1A1612; padding-bottom: 8px; }
        .fl-title { font: 700 20px Georgia, serif; color: #1A1612; }
        .fl-sub { font: 600 11px system-ui; color: #7A6E5F; text-transform: uppercase; letter-spacing: 0.1em; }
        .name-line { font: 500 12px system-ui; color: #7A6E5F; margin: 8px 0 12px; }
        .sec-label { font: 700 12px system-ui; color: #C8902A; text-transform: uppercase; letter-spacing: 0.08em; margin: 14px 0 6px; }
        .tip { font: 500 11px/1.5 system-ui; color: #7A6E5F; margin: 6px 0 8px; }
        .word-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px 10px; }
        .word-grid span { font: 500 17px Georgia, serif; color: #1A1612; padding: 5px 8px; border: 1px solid #E8E0D0; border-radius: 6px; text-align: center; }
        .phrase-list span { display: inline-block; font: 500 16px Georgia, serif; color: #1A1612; border: 1px solid #E8E0D0; border-radius: 6px; padding: 5px 10px; margin: 4px 6px 4px 0; }
        .sent { font: 500 17px/1.9 Georgia, serif; color: #1A1612; }
        .sent li { margin-bottom: 6px; }
        .passage-row { display: flex; justify-content: space-between; font: 500 17px/1.9 Georgia, serif; color: #1A1612; }
        .passage-row .wc { color: #b0a798; font: 600 11px/1.9 system-ui; padding-left: 12px; }
        table.wpm { border-collapse: collapse; width: 100%; margin-top: 4px; }
        table.wpm th, table.wpm td { border: 1.5px solid #9aa3af; padding: 7px 8px; font: 500 12px system-ui; height: 30px; }
        table.wpm th { background: #F5F1E6; text-align: left; }
        table.log { border-collapse: collapse; width: 100%; }
        table.log th, table.log td { border: 1.5px solid #9aa3af; padding: 7px 8px; font: 500 12px system-ui; height: 34px; }
        table.log th { background: #F5F1E6; text-align: left; }
        .footer { margin-top: 16px; display: flex; justify-content: space-between; font: 500 10px system-ui; color: #7A6E5F; }
      `}</style>

      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandLogo size="sm" />
          <strong>Reading fluency printables</strong>
          <label style={{ fontSize: 13 }}>
            Level:{" "}
            <select value={level} onChange={(e) => setLevel(e.target.value as LevelKey)}>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/parent" style={{ fontSize: 13 }}>← Back</Link>
          <button onClick={() => window.print()} style={{ padding: "6px 16px", background: "#1B4F8A", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>Print</button>
        </div>
      </div>

      {level === "R3" && (
        <>
          <div className="sheet-wrapper">
            <Head title="Smooth Words & Phrases" sub="R3 · Fluency · Grade 1" />
            <div className="sec-label">1 · Read the words across each row — smooth, not letter by letter</div>
            <div className="word-grid">{G1_WORDS.map((w) => <span key={w}>{w}</span>)}</div>
            <div className="sec-label">2 · Read each phrase like one chunk</div>
            <div className="phrase-list">{G1_PHRASES.map((p) => <span key={p}>{p}</span>)}</div>
            <p className="tip">Parent: model one row first. If a word is missed, say it, have your child repeat it, and circle it for tomorrow.</p>
            <div className="footer"><span>R3 · Smooth Word & Phrase Reading · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
          </div>
          <div className="sheet-wrapper">
            <Head title="Sentences with Expression" sub="R3 · Fluency · Grade 1" />
            <div className="sec-label">Read each sentence twice — once smooth, once with feeling</div>
            <ol className="sent">{G1_SENTENCES.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="tip">Voice goes UP for question marks, gets EXCITED for exclamation marks, and STOPS at periods.</p>
            <div className="sec-label">1-minute timed passage</div>
            {G1_PASSAGE.map(([line, wc]) => <div className="passage-row" key={wc}><span>{line}</span><span className="wc">{wc}</span></div>)}
            <WpmChart />
            <div className="footer"><span>R3 · Sentence Fluency & Expression · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
          </div>
        </>
      )}

      {level === "R12" && (
        <>
          <div className="sheet-wrapper">
            <Head title="Longer Sentences" sub="R12 · Fluency II · Grade 2" />
            <div className="sec-label">Read each sentence in TWO chunks at most — find the natural pause</div>
            <ol className="sent">{G2_SENTENCES.map((s) => <li key={s}>{s}</li>)}</ol>
            <p className="tip">Parent: listen for robot-reading. If it sounds flat, model the sentence once and have your child echo it.</p>
            <div className="footer"><span>R12 · Longer Sentence Fluency · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
          </div>
          <div className="sheet-wrapper">
            <Head title="Paragraph Fluency — Timed" sub="R12 · Fluency II · Grade 2" />
            <div className="sec-label">1-minute timed passage — reread it on three different days</div>
            {G2_PASSAGE.map(([line, wc]) => <div className="passage-row" key={wc}><span>{line}</span><span className="wc">{wc}</span></div>)}
            <WpmChart />
            <div className="footer"><span>R12 · Paragraph Fluency & Expression · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
          </div>
        </>
      )}

      {level === "LOG" && (
        <div className="sheet-wrapper">
          <Head title="My Reading Log" sub="Independent Reading · any level" />
          <div className="sec-label">Track every reading session — build the stamina streak</div>
          <table className="log">
            <thead><tr><th>Date</th><th>Book / text</th><th>Pages</th><th>Minutes</th><th>One thing I noticed</th></tr></thead>
            <tbody>{Array.from({ length: 14 }, (_, i) => <tr key={i}><td /><td /><td /><td /><td /></tr>)}</tbody>
          </table>
          <p className="tip">Goal: same time, same place, a few more minutes each week. Stamina is built, not born.</p>
          <div className="footer"><span>Independent Reading Log · Eduyro</span><span>For personal and household use only. © 2026 Eduyro Education Inc.</span></div>
        </div>
      )}
    </>
  );
}

export default function PrintFluencyPage() {
  return <Suspense fallback={null}><FluencyInner /></Suspense>;
}
