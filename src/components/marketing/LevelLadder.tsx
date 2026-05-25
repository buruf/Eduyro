// src/components/marketing/LevelLadder.tsx
"use client";

const LEVELS = [
  { code: "M1", name: "Counting", grade: "Pre-K", color: "blue" },
  { code: "M2", name: "Number sense", grade: "Pre-K", color: "blue" },
  { code: "M3", name: "Addition", grade: "K", color: "blue" },
  { code: "M4", name: "Add/Subtract", grade: "Gr 1", color: "blue" },
  { code: "M5", name: "Multiplication", grade: "Gr 2–4", color: "gold", featured: true },
  { code: "M6", name: "Division", grade: "Gr 3–5", color: "gold" },
  { code: "M7", name: "Fractions", grade: "Gr 4–6", color: "gold" },
  { code: "M8", name: "Decimals & %", grade: "Gr 5–6", color: "gold" },
  { code: "M9", name: "Ratios", grade: "Gr 6–7", color: "green" },
  { code: "M10", name: "Pre-Algebra", grade: "Gr 7–8", color: "green" },
  { code: "M11", name: "Linear eq.", grade: "Gr 8–9", color: "green" },
  { code: "M12", name: "Polynomials", grade: "Gr 9–10", color: "green" },
  { code: "M13", name: "Quadratics", grade: "Gr 9–10", color: "red" },
  { code: "M14", name: "Functions", grade: "Gr 10–11", color: "red" },
  { code: "M15", name: "Trigonometry", grade: "Gr 11–12", color: "red" },
  { code: "M16", name: "Algebra II", grade: "Gr 11–12", color: "red" },
  { code: "M17", name: "Pre-Calc", grade: "Gr 12", color: "ink" },
  { code: "M18", name: "Calculus", grade: "Gr 12", color: "ink" },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-brand-blue-light border-brand-blue text-brand-blue",
  gold: "bg-gold-light border-gold text-gold-dark",
  green: "bg-brand-green-light border-brand-green text-brand-green",
  red: "bg-brand-red-light border-brand-red text-brand-red",
  ink: "bg-ink/10 border-ink text-ink",
};

export function LevelLadder() {
  return (
    <div className="relative">
      {/* Scrollable container */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex items-end gap-2 min-w-max">
          {LEVELS.map((level, i) => {
            const height = 60 + i * 14; // staircase effect
            return (
              <div key={level.code} className="flex flex-col items-center">
                <div
                  className={`border-[1.5px] rounded-t-lg px-3 pt-3 pb-2 transition-transform hover:-translate-y-1 cursor-default ${COLOR_MAP[level.color]} ${
                    level.featured ? "shadow-lg scale-105 ring-2 ring-gold/30" : ""
                  }`}
                  style={{ height: `${height}px`, minWidth: "82px" }}
                >
                  <div className="font-serif text-base font-bold text-center">{level.code}</div>
                  <div className="text-[10px] mt-1 text-center font-medium opacity-80">{level.name}</div>
                </div>
                <div className="text-[10px] text-muted mt-2">{level.grade}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-6 flex-wrap text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-brand-blue-light border border-brand-blue" />
          Pre-K to Grade 1
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gold-light border border-gold" />
          Elementary (Gr 2–6)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-brand-green-light border border-brand-green" />
          Middle school
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-brand-red-light border border-brand-red" />
          High school
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-ink/10 border border-ink" />
          Advanced placement
        </div>
      </div>
    </div>
  );
}
