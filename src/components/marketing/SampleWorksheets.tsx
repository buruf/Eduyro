// src/components/marketing/SampleWorksheets.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Subject = "math" | "reading" | "writing" | "science";

const TABS: { id: Subject; label: string; icon: string; color: string }[] = [
  { id: "math", label: "Mathematics", icon: "∑", color: "#1B4F8A" },
  { id: "reading", label: "Reading", icon: "📖", color: "#C8902A" },
  { id: "writing", label: "Writing", icon: "✍️", color: "#2D6A3F" },
  { id: "science", label: "Science", icon: "🔬", color: "#C23B22" },
];

export function SampleWorksheets() {
  const [active, setActive] = useState<Subject>("math");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all border-[1.5px]",
              active === tab.id
                ? "bg-ink text-cream border-ink"
                : "bg-white text-ink border-border hover:border-ink"
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {active === "math" && <MathSamples />}
        {active === "reading" && <ReadingSamples />}
        {active === "writing" && <WritingSamples />}
        {active === "science" && <ScienceSamples />}
      </div>
    </div>
  );
}

function WorksheetCard({
  title, subtitle, level, children,
}: { title: string; subtitle: string; level: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
      <div className="border-b-2 border-ink p-5 flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            Eduyro Education
          </div>
          <div className="font-serif text-base font-bold mt-1">{title}</div>
          <div className="text-xs text-muted mt-1">{subtitle}</div>
        </div>
        <div className="text-right">
          <span className="inline-block text-[10px] font-bold bg-brand-blue-light text-brand-blue px-2 py-1 rounded">
            Level {level}
          </span>
        </div>
      </div>
      <div className="p-5 font-serif">{children}</div>
    </div>
  );
}

function MathSamples() {
  const problems = [
    ["6 × 7 =", "42"], ["8 × 3 =", "24"], ["7 × 9 =", "63"], ["6 × 8 =", "48"],
    ["8 × 7 =", "56"], ["7 × 4 =", "28"], ["6 × 9 =", "54"], ["8 × 6 =", "48"],
    ["7 × 7 =", "49"], ["6 × 6 =", "36"], ["8 × 8 =", "64"], ["7 × 5 =", "35"],
  ];
  return (
    <>
      <WorksheetCard
        title="Multiplication — ×6, ×7, ×8 Tables"
        subtitle="20 problems · Target: 10 min · Mastery: 95%"
        level="M5"
      >
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {problems.map(([q, a], i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-cream-dark py-1.5">
              <span className="text-[10px] text-muted/50 font-sans mr-2">{i + 1}.</span>
              <span className="font-bold flex-1">{q}</span>
              <div className="w-10 h-5 bg-brand-green-light border border-brand-green rounded flex items-center justify-center text-[11px] font-bold text-brand-green">
                {a}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-2 border-t border-dashed border-border text-[10px] text-muted/60 text-center font-sans">
          ✓ Answer key shown (green) · Real student worksheet hides answers
        </div>
      </WorksheetCard>

      <WorksheetCard
        title="Fractions — Simplifying"
        subtitle="15 problems · Level M7 · Target: 12 min"
        level="M7"
      >
        <div className="space-y-2 text-sm">
          {[
            ["Simplify ⁶⁄₈", "³⁄₄"],
            ["Simplify ¹⁰⁄₁₅", "²⁄₃"],
            ["A pizza has 8 slices. Maria eats 3. What fraction did she eat?", "³⁄₈"],
            ["¹⁄₄ + ²⁄₄ =", "³⁄₄"],
            ["Which is larger: ²⁄₃ or ³⁄₅?", "²⁄₃"],
            ["Simplify ¹²⁄₁₆", "³⁄₄"],
          ].map(([q, a], i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-cream-dark">
              <span className="text-[10px] text-muted/50 font-sans">{i + 1}.</span>
              <span className="flex-1 text-sm">{q}</span>
              <div className="px-2 py-0.5 bg-brand-green-light border border-brand-green rounded text-[11px] font-bold text-brand-green">
                {a}
              </div>
            </div>
          ))}
        </div>
      </WorksheetCard>
    </>
  );
}

function ReadingSamples() {
  return (
    <>
      <WorksheetCard
        title="Reading Comprehension — The Honey Bee"
        subtitle="6 questions · Level R5 · Target: 15 min"
        level="R5"
      >
        <div className="bg-brand-blue-light/30 border-l-4 border-brand-blue rounded-r-lg p-3 mb-4 text-sm leading-relaxed">
          <strong>Read carefully:</strong> Honey bees are one of the most important insects on Earth. A single hive can contain up to 60,000 bees, all working together. The queen bee lays up to 2,000 eggs per day. Worker bees gather nectar from flowers and turn it into honey. A single bee produces only one twelfth of a teaspoon of honey in its entire lifetime…
        </div>
        <div className="space-y-3 text-sm font-sans">
          <div>
            <div className="font-semibold mb-1">1. What is the main idea?</div>
            <div className="pl-4 text-xs space-y-1 text-muted">
              <div>○ Bees are dangerous</div>
              <div className="text-brand-green font-medium">● Bees are important insects that work together</div>
              <div>○ All bees make honey</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">2. How much honey does one bee make in its lifetime?</div>
            <div className="pl-4 text-xs text-brand-green font-medium">● One twelfth of a teaspoon</div>
          </div>
          <div>
            <div className="font-semibold mb-1">3. What is the waggle dance used for?</div>
            <div className="pl-4 border-b border-border min-h-[20px]" />
            <div className="pl-4 border-b border-border min-h-[20px] mt-1" />
          </div>
        </div>
      </WorksheetCard>

      <WorksheetCard
        title="Phonics — Silent E"
        subtitle="10 problems · Level R2 · Target: 8 min"
        level="R2"
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["c_p_ (cape)", "cape"], ["b_t_ (bite)", "bite"],
            ["h_p_ (hope)", "hope"], ["c_t_ (cute)", "cute"],
            ["m_d_ (made)", "made"], ["r_d_ (ride)", "ride"],
            ["n_t_ (note)", "note"], ["c_b_ (cube)", "cube"],
          ].map(([q, a], i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-cream-dark">
              <span className="text-[10px] text-muted/50 font-sans mr-2">{i + 1}.</span>
              <span className="flex-1 font-bold">{q}</span>
              <div className="px-2 py-0.5 bg-brand-green-light border border-brand-green rounded text-[11px] font-bold text-brand-green">
                {a}
              </div>
            </div>
          ))}
        </div>
      </WorksheetCard>
    </>
  );
}

function WritingSamples() {
  return (
    <>
      <WorksheetCard
        title="Grammar — Nouns, Verbs, Adjectives"
        subtitle="15 problems · Level W2 · Target: 10 min"
        level="W2"
      >
        <div className="space-y-3 text-sm font-sans">
          <div>
            <div className="font-semibold mb-1">1. Circle the noun</div>
            <div className="pl-4 text-base">
              run · <span className="bg-brand-green-light text-brand-green px-1 rounded font-bold">dog</span> · quickly · blue
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">2. Circle the verb</div>
            <div className="pl-4 text-base">
              happy · table · <span className="bg-brand-green-light text-brand-green px-1 rounded font-bold">jump</span> · city
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">3. Circle the adjective</div>
            <div className="pl-4 text-base">
              school · eat · <span className="bg-brand-green-light text-brand-green px-1 rounded font-bold">tall</span> · swim
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">4. Underline the nouns, circle the verbs:</div>
            <div className="pl-4 text-base italic">
              The <u>dog</u> <span className="text-brand-green font-bold">ran</span> across the green <u>field</u>.
            </div>
          </div>
        </div>
      </WorksheetCard>

      <WorksheetCard
        title="Paragraph Writing — Topic Sentences"
        subtitle="8 problems · Level W5 · Target: 15 min"
        level="W5"
      >
        <div className="space-y-3 text-sm font-sans">
          <div>
            <div className="font-semibold mb-1">1. Which is the best topic sentence?</div>
            <div className="pl-4 text-xs space-y-1 text-muted">
              <div>○ Dogs are good.</div>
              <div className="text-brand-green font-medium">● Dogs make excellent pets for many reasons.</div>
              <div>○ I have a dog.</div>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1">2. Write a topic sentence about your favourite season:</div>
            <div className="pl-4 border-b border-border min-h-[20px]" />
            <div className="pl-4 border-b border-border min-h-[20px] mt-1" />
          </div>
          <div>
            <div className="font-semibold mb-1">3. Write a topic sentence about an animal you find interesting:</div>
            <div className="pl-4 border-b border-border min-h-[20px]" />
            <div className="pl-4 border-b border-border min-h-[20px] mt-1" />
          </div>
        </div>
      </WorksheetCard>
    </>
  );
}

function ScienceSamples() {
  return (
    <>
      <WorksheetCard
        title="Earth Science — The Water Cycle"
        subtitle="8 questions · Level S3 · Target: 12 min"
        level="S3"
      >
        <div className="bg-cream-dark border border-border rounded-lg p-3 mb-4 text-center">
          <svg viewBox="0 0 280 130" className="w-full max-w-xs mx-auto">
            <circle cx="40" cy="35" r="12" fill="#1B4F8A" opacity="0.3" />
            <circle cx="60" cy="30" r="14" fill="#1B4F8A" opacity="0.3" />
            <circle cx="50" cy="40" r="12" fill="#1B4F8A" opacity="0.3" />
            <path d="M70 50 Q130 80 180 60" stroke="#1B4F8A" strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
            <text x="100" y="55" fontSize="9" fill="#1B4F8A">condensation</text>
            <path d="M200 100 L130 100" stroke="#2D6A3F" strokeWidth="1.5" markerEnd="url(#arr)" />
            <text x="155" y="95" fontSize="9" fill="#2D6A3F">evaporation</text>
            <ellipse cx="200" cy="110" rx="60" ry="6" fill="#1B4F8A" opacity="0.4" />
            <text x="195" y="125" fontSize="9" fill="#1B4F8A">ocean</text>
            <defs><marker id="arr" markerWidth="5" markerHeight="5" refX="4" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill="#2D6A3F" /></marker></defs>
          </svg>
        </div>
        <div className="space-y-2 text-sm font-sans">
          <div>1. What turns water into vapor? <span className="text-brand-green font-semibold">Evaporation</span></div>
          <div>2. What is it called when water vapor becomes droplets? <span className="text-brand-green font-semibold">Condensation</span></div>
          <div>3. What drives the water cycle? <span className="text-brand-green font-semibold">The Sun</span></div>
          <div className="pt-2 border-t border-cream-dark">
            <div className="font-semibold mb-1">4. Label the diagram above with these stages:</div>
            <div className="pl-4 text-xs text-muted">evaporation · condensation · precipitation · runoff</div>
          </div>
        </div>
      </WorksheetCard>

      <WorksheetCard
        title="Chemistry — States of Matter"
        subtitle="10 questions · Level S4 · Target: 12 min"
        level="S4"
      >
        <div className="space-y-2 text-sm font-sans">
          <div className="grid grid-cols-3 gap-2 text-xs text-center mb-3">
            <div className="bg-cream-dark border border-border rounded p-2">
              <div className="text-2xl mb-1">🧊</div>
              <div className="font-semibold">Solid</div>
              <div className="text-[10px] text-muted">fixed shape</div>
            </div>
            <div className="bg-cream-dark border border-border rounded p-2">
              <div className="text-2xl mb-1">💧</div>
              <div className="font-semibold">Liquid</div>
              <div className="text-[10px] text-muted">fixed volume</div>
            </div>
            <div className="bg-cream-dark border border-border rounded p-2">
              <div className="text-2xl mb-1">💨</div>
              <div className="font-semibold">Gas</div>
              <div className="text-[10px] text-muted">fills container</div>
            </div>
          </div>
          <div>1. Which state has definite shape AND volume? <span className="text-brand-green font-semibold">Solid</span></div>
          <div>2. What is melting? <span className="text-brand-green font-semibold">Solid → Liquid</span></div>
          <div>3. Water boils at __°C. <span className="text-brand-green font-semibold">100</span></div>
          <div>4. What is dry ice subliming? <span className="text-brand-green font-semibold">Solid → Gas directly</span></div>
        </div>
      </WorksheetCard>
    </>
  );
}
