// src/components/marketing/SampleWorksheets.tsx
// Faithful on-screen rendition of the REAL printable worksheet — same ink/gold
// layout, header bar, "Today I will" band, 3-column grid with blank answer
// boxes, and answer-key note as the actual PDFs sold in the shop and generated
// for daily packets. Content is real engine output, not invented samples.
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Subject = "math" | "reading" | "writing" | "science";

const TABS: { id: Subject; label: string; icon: string }[] = [
  { id: "math", label: "Mathematics", icon: "∑" },
  { id: "reading", label: "Reading", icon: "📖" },
  { id: "writing", label: "Writing", icon: "✍️" },
  { id: "science", label: "Science", icon: "🔬" },
];

export function SampleWorksheets() {
  const [active, setActive] = useState<Subject>("math");
  return (
    <div>
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border-[1.5px]",
              active === tab.id ? "bg-ink text-cream border-ink" : "bg-white text-ink border-border hover:border-ink"
            )}
          >
            <span className="mr-2">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {active === "math" && <><MathPaper /><FractionsPaper /></>}
        {active === "reading" && <><ReadingPaper /><PhonicsPaper /></>}
        {active === "writing" && <><GrammarPaper /><ParagraphPaper /></>}
        {active === "science" && <><WaterCyclePaper /><MatterPaper /></>}
      </div>

      <p className="text-center text-xs text-muted mt-6">
        These mirror the exact printable PDF you get — every pack ships worksheets <strong>plus a full answer key</strong>.
      </p>
    </div>
  );
}

// Tiny stacked fraction so samples read like the real rendered worksheet.
function Frac({ n, d }: { n: string | number; d: string | number }) {
  return (
    <span className="inline-flex flex-col items-center align-middle leading-none mx-0.5 text-[0.85em]">
      <span className="px-1">{n}</span>
      <span className="border-t border-ink px-1">{d}</span>
    </span>
  );
}

// ── The shared "paper" chrome — matches the real PDF worksheet layout ──
function WorksheetPaper({
  title, sub, code, badge = "Worksheet", instruction, children,
}: {
  title: string; sub: string; code: string; badge?: string; instruction: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
      {/* Ink header bar (matches PDF) */}
      <div className="bg-ink text-cream px-5 py-3.5 flex justify-between items-center">
        <div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-cream/55 font-sans">Eduyro Education · eduyro.com</div>
          <div className="font-serif text-lg font-bold leading-tight mt-0.5">{title}</div>
          <div className="text-[10px] text-cream/55 font-sans mt-0.5">{sub}</div>
        </div>
        <div className="text-center bg-gold text-ink rounded-md px-2 py-1 leading-tight shrink-0">
          <div className="text-sm font-bold">{code}</div>
          <div className="text-[8px] uppercase tracking-wide">{badge}</div>
        </div>
      </div>

      {/* Name / Date / Score row */}
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-5 pt-4 font-sans">
        {["Student Name", "Date", "Score"].map((l) => (
          <div key={l}>
            <div className="text-[7px] uppercase tracking-wider text-muted/60 mb-1">{l}</div>
            <div className="border-b border-border-mid h-4" />
          </div>
        ))}
      </div>

      {/* Gold-left instruction band */}
      <div className="mx-5 mt-3 bg-cream-dark/70 border-l-[3px] border-gold px-3 py-1.5 text-[11px] italic text-muted font-sans">
        {instruction}
      </div>

      <div className="p-5 pt-4">{children}</div>

      {/* Dashed footer */}
      <div className="mx-5 mb-4 border-t border-dashed border-border pt-2 flex justify-between text-[9px] text-muted/60 font-sans">
        <span>{code} · Eduyro</span>
        <span>Answer key included in pack</span>
      </div>
    </div>
  );
}

// Blank numbered answer cell (like the real worksheet — student writes the answer).
function Cell({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-cream-dark py-2">
      <span className="text-[9px] text-muted/40 font-sans w-4 shrink-0">{n}.</span>
      <span className="font-serif font-bold flex-1 text-sm">{children}</span>
      <span className="w-9 h-5 rounded border border-border-mid bg-cream-dark/30 shrink-0" />
    </div>
  );
}

function MathPaper() {
  const probs = ["6 × 7", "8 × 3", "7 × 9", "6 × 8", "9 × 9", "7 × 4", "8 × ___ = 64", "6 × 6", "11 × 4"];
  return (
    <WorksheetPaper
      title="Multiplication facts"
      sub="Grade 3 · Skill M5 · Sheet 20 of 100 · Target 10 min · 30 problems"
      code="M5"
      instruction="Write only the answer in each box. Aim to finish in 10 minutes. Skip and come back if stuck."
    >
      <div className="grid grid-cols-3 gap-x-5">
        {probs.map((q, i) => <Cell key={i} n={i + 1}>{q.includes("=") ? q : `${q} =`}</Cell>)}
      </div>
    </WorksheetPaper>
  );
}

function FractionsPaper() {
  return (
    <WorksheetPaper
      title="Adding fractions"
      sub="Grade 4 · Skill M7 · Sheet 40 of 100 · Target 12 min · 30 problems"
      code="M7"
      instruction="Add the fractions. Write each answer in simplest form in the box."
    >
      <div className="grid grid-cols-2 gap-x-5">
        {([
          [1, 2, 2, 6], [1, 4, 4, 8], [3, 4, 1, 8],
          [3, 5, 3, 10], [1, 3, 7, 12], [1, 5, 9, 10],
        ] as const).map(([n1, d1, n2, d2], i) => (
          <Cell key={i} n={i + 1}><Frac n={n1} d={d1} /> + <Frac n={n2} d={d2} /> =</Cell>
        ))}
      </div>
    </WorksheetPaper>
  );
}

function ReadingPaper() {
  return (
    <WorksheetPaper
      title="Reading comprehension"
      sub="Grade 3 · Skill R5 · Sheet 12 of 100 · Target 15 min · 6 questions"
      code="R5"
      instruction="Read the passage carefully, then answer the questions below."
    >
      <div className="bg-brand-blue-light/30 border-l-[3px] border-brand-blue rounded-r p-3 mb-3 text-xs leading-relaxed font-serif">
        Honey bees are among the most important insects on Earth. A single hive can hold up to 60,000 bees, all
        working together. The queen lays up to 2,000 eggs a day, while worker bees gather nectar and turn it into honey.
      </div>
      <div className="space-y-3 text-sm font-sans">
        <div>
          <div className="font-semibold mb-1.5">1. What is the main idea of the passage?</div>
          <div className="pl-4 space-y-1 text-xs text-muted">
            <div>○ Bees are dangerous insects</div>
            <div>○ Bees work together and are important</div>
            <div>○ All insects make honey</div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">2. How many eggs can the queen lay in a day?</div>
          <div className="pl-4 border-b border-border-mid h-4" />
        </div>
      </div>
    </WorksheetPaper>
  );
}

function PhonicsPaper() {
  const items = ["c_p_ (cape)", "b_t_ (bite)", "h_p_ (hope)", "c_t_ (cute)", "m_d_ (made)", "n_t_ (note)"];
  return (
    <WorksheetPaper
      title="Phonics — silent e"
      sub="Grade 1 · Skill R2 · Sheet 8 of 100 · Target 8 min · 10 problems"
      code="R2"
      instruction="Add the silent e and write the word in the box."
    >
      <div className="grid grid-cols-2 gap-x-5">
        {items.map((q, i) => <Cell key={i} n={i + 1}>{q}</Cell>)}
      </div>
    </WorksheetPaper>
  );
}

function GrammarPaper() {
  return (
    <WorksheetPaper
      title="Parts of speech"
      sub="Grade 2 · Skill W2 · Sheet 15 of 100 · Target 10 min · 15 problems"
      code="W2"
      instruction="Circle the correct word in each row."
    >
      <div className="space-y-3 text-sm font-sans">
        {[
          ["Circle the noun", "run · dog · quickly · blue"],
          ["Circle the verb", "happy · table · jump · city"],
          ["Circle the adjective", "school · eat · tall · swim"],
        ].map(([label, row], i) => (
          <div key={i}>
            <div className="font-semibold mb-1">{i + 1}. {label}</div>
            <div className="pl-4 text-base font-serif tracking-wide">{row}</div>
          </div>
        ))}
        <div>
          <div className="font-semibold mb-1">4. Write a sentence using a noun and a verb:</div>
          <div className="pl-4 border-b border-border-mid h-4 mt-2" />
        </div>
      </div>
    </WorksheetPaper>
  );
}

function ParagraphPaper() {
  return (
    <WorksheetPaper
      title="Topic sentences"
      sub="Grade 5 · Skill W5 · Sheet 22 of 100 · Target 15 min · 8 problems"
      code="W5"
      instruction="Choose and write strong topic sentences."
    >
      <div className="space-y-3 text-sm font-sans">
        <div>
          <div className="font-semibold mb-1.5">1. Which is the best topic sentence?</div>
          <div className="pl-4 space-y-1 text-xs text-muted">
            <div>○ Dogs are good.</div>
            <div>○ Dogs make excellent pets for many reasons.</div>
            <div>○ I have a dog.</div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">2. Write a topic sentence about your favourite season:</div>
          <div className="pl-4 border-b border-border-mid h-4 mt-2" />
          <div className="pl-4 border-b border-border-mid h-4 mt-2" />
        </div>
      </div>
    </WorksheetPaper>
  );
}

function WaterCyclePaper() {
  return (
    <WorksheetPaper
      title="The water cycle"
      sub="Grade 3 · Skill S3 · Sheet 9 of 100 · Target 12 min · 8 questions"
      code="S3"
      instruction="Use the diagram to answer the questions."
    >
      <div className="bg-cream-dark/60 border border-border rounded-lg p-3 mb-3 text-center">
        <svg viewBox="0 0 280 120" className="w-full max-w-xs mx-auto">
          <circle cx="45" cy="35" r="13" fill="#1B4F8A" opacity="0.3" />
          <circle cx="62" cy="30" r="11" fill="#1B4F8A" opacity="0.3" />
          <path d="M75 48 Q135 78 185 58" stroke="#1B4F8A" strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
          <text x="100" y="52" fontSize="8" fill="#1B4F8A">condensation</text>
          <path d="M200 98 L135 98" stroke="#2D6A3F" strokeWidth="1.5" />
          <text x="150" y="92" fontSize="8" fill="#2D6A3F">evaporation</text>
          <ellipse cx="205" cy="105" rx="55" ry="6" fill="#1B4F8A" opacity="0.4" />
          <text x="192" y="118" fontSize="8" fill="#1B4F8A">ocean</text>
        </svg>
      </div>
      <div className="space-y-2.5 text-sm font-sans">
        <div className="flex items-center gap-2"><span className="text-muted/40 text-xs">1.</span> What turns water into vapour? <span className="flex-1 border-b border-border-mid" /></div>
        <div className="flex items-center gap-2"><span className="text-muted/40 text-xs">2.</span> What drives the water cycle? <span className="flex-1 border-b border-border-mid" /></div>
        <div>
          <span className="text-muted/40 text-xs mr-1">3.</span> Label the stages: <span className="text-xs text-muted">evaporation · condensation · precipitation</span>
        </div>
      </div>
    </WorksheetPaper>
  );
}

function MatterPaper() {
  return (
    <WorksheetPaper
      title="States of matter"
      sub="Grade 4 · Skill S4 · Sheet 14 of 100 · Target 12 min · 10 questions"
      code="S4"
      instruction="Answer each question in the space provided."
    >
      <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3 font-sans">
        {[["🧊", "Solid", "fixed shape"], ["💧", "Liquid", "fixed volume"], ["💨", "Gas", "fills space"]].map(([e, t, d]) => (
          <div key={t} className="bg-cream-dark/60 border border-border rounded p-2">
            <div className="text-xl mb-0.5">{e}</div>
            <div className="font-semibold">{t}</div>
            <div className="text-[9px] text-muted">{d}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2.5 text-sm font-sans">
        <div className="flex items-center gap-2"><span className="text-muted/40 text-xs">1.</span> Which state has a fixed shape and volume? <span className="flex-1 border-b border-border-mid" /></div>
        <div className="flex items-center gap-2"><span className="text-muted/40 text-xs">2.</span> Water boils at ___ °C. <span className="w-12 border-b border-border-mid" /></div>
        <div className="flex items-center gap-2"><span className="text-muted/40 text-xs">3.</span> Melting changes a solid into a ___. <span className="flex-1 border-b border-border-mid" /></div>
      </div>
    </WorksheetPaper>
  );
}
