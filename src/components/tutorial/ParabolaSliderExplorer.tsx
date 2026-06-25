// src/components/tutorial/ParabolaSliderExplorer.tsx
// Interactive lesson demo (no grading): students drag the a, b, c sliders and
// watch y = ax² + bx + c update live — discovering how each coefficient changes
// the parabola (opens up/down & width via a, shifts via b, vertical via c). The
// vertex and axis of symmetry update in real time. This is the "explore, don't
// memorize" centerpiece of the quadratics lesson.
"use client";

import { useState } from "react";
import { Mafs, Coordinates, Plot, Point } from "mafs";
import "mafs/core.css";

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
// Format a signed term, suppressing 0 terms: e.g. b=-3 → " − 3x".
const signed = (v: number, suffix: string) =>
  v === 0 ? "" : v > 0 ? ` + ${f1(v)}${suffix}` : ` − ${f1(Math.abs(v))}${suffix}`;

export function ParabolaSliderExplorer() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);

  const vx = a === 0 ? 0 : -b / (2 * a);
  const vy = a * vx * vx + b * vx + c;
  const eq = `y = ${a === 1 ? "" : a === -1 ? "−" : f1(a)}x²${signed(b, "x")}${signed(c, "")}`;

  const Slider = ({ label, value, min, max, step, set, color }: { label: string; value: number; min: number; max: number; step: number; set: (v: number) => void; color: string }) => (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 font-bold" style={{ color }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="flex-1 accent-current" style={{ color }} />
      <span className="w-8 text-right tabular-nums font-semibold">{f1(value)}</span>
    </div>
  );

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs height={260} viewBox={{ x: [-8, 8], y: [-8, 8] }} preserveAspectRatio={false}>
          <Coordinates.Cartesian />
          <Plot.OfX y={(x) => a * x * x + b * x + c} />
          {a !== 0 && <Point x={vx} y={vy} color="#C8902A" />}
        </Mafs>
      </div>

      <div className="mt-3 text-center font-serif text-lg font-bold text-ink">{eq}</div>
      <div className="mt-1 text-center text-xs text-muted">
        {a === 0 ? "a = 0 → this is a line, not a parabola" : <>Opens {a > 0 ? "up ▲" : "down ▼"} · Vertex ({f1(vx)}, {f1(vy)}) · Axis x = {f1(vx)}</>}
      </div>

      <div className="mt-3 space-y-2">
        <Slider label="a" value={a} min={-3} max={3} step={0.5} set={setA} color="#1B4F8A" />
        <Slider label="b" value={b} min={-6} max={6} step={1} set={setB} color="#2D6A3F" />
        <Slider label="c" value={c} min={-6} max={6} step={1} set={setC} color="#C8902A" />
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Drag the sliders and watch the parabola change.</p>
    </div>
  );
}
