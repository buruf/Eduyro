// src/components/practice/EquationBuilder.tsx
// "Build the equation" constructor: a line y = mx + b is shown, and the student
// constructs its equation by selecting the slope and intercept with steppers
// (rather than typing). The composed answer is the canonical "m,b" string,
// graded server-side by plain value match. Reuses GraphThumb to draw the line.
"use client";

import { useEffect, useState } from "react";
import { GraphThumb } from "./GraphChoice";
import type { InteractiveSpec } from "@/types";

const f = (v: number) => String(v);

export function EquationBuilder({ spec, onChange }: { spec: InteractiveSpec; value: string; onChange: (v: string) => void }) {
  const [m, setM] = useState(0);
  const [b, setB] = useState(0);
  useEffect(() => { onChange(`${f(m)},${f(b)}`); }, [m, b]); // eslint-disable-line react-hooks/exhaustive-deps

  const mTerm = m === 1 ? "x" : m === -1 ? "−x" : `${m}x`;
  const bTerm = b === 0 ? "" : b < 0 ? ` − ${-b}` : ` + ${b}`;

  const Stepper = ({ label, value, set, min, max }: { label: string; value: number; set: (v: number) => void; min: number; max: number }) => (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark disabled:opacity-30" disabled={value <= min} onClick={() => set(value - 1)} aria-label={`Decrease ${label}`}>−</button>
        <span className="w-9 text-center font-serif font-bold text-lg tabular-nums">{value}</span>
        <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark disabled:opacity-30" disabled={value >= max} onClick={() => set(value + 1)} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto">
      <div className="rounded-xl overflow-hidden border border-border bg-white px-2 py-1">
        <GraphThumb spec={`line:${spec.line?.m ?? 0},${spec.line?.b ?? 0}`} height={150} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 font-serif text-lg font-bold text-ink">
        <span>y =</span>
        <Stepper label="slope" value={m} set={setM} min={-5} max={5} />
        <span>x</span>
        <Stepper label="intercept" value={b} set={setB} min={-8} max={8} />
      </div>

      <div className="mt-3 text-center font-serif text-xl font-bold text-brand-blue">y = {mTerm}{bTerm}</div>
      <p className="mt-2 text-center text-[11px] text-muted">Set the slope and intercept to match the line shown.</p>
    </div>
  );
}
