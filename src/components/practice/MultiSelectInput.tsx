// src/components/practice/MultiSelectInput.tsx
// "Select all that apply" input. The student toggles any number of options; the
// composed answer is the chosen subset SORTED and comma-joined, graded
// server-side by plain value match against the stored correct subset (also
// sorted the same way), so selection order never matters.
"use client";
import { MathText } from "@/components/MathText";

import { useState } from "react";

export function MultiSelectInput({ options, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const emit = (next: Set<string>) => onChange([...next].sort().join(","));
  const toggle = (opt: string) => {
    const next = new Set(sel);
    if (next.has(opt)) next.delete(opt); else next.add(opt);
    setSel(next);
    emit(next);
  };
  return (
    <div className="max-w-md mx-auto">
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const on = sel.has(opt);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={on}
              className={
                "flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left font-serif font-semibold transition-colors " +
                (on ? "border-brand-blue bg-brand-blue/5 text-ink" : "border-border bg-white text-ink hover:border-brand-blue/40")
              }
            >
              <span className={"w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center text-[11px] " + (on ? "border-brand-blue bg-brand-blue text-white" : "border-border")}>{on ? "✓" : ""}</span>
              <span className="flex-1"><MathText>{opt}</MathText></span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Select all that apply, then check.</p>
    </div>
  );
}
