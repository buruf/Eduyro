// src/components/practice/VertexDragInput.tsx
// Interactive (graphing) answer input. Three interactions, chosen by spec.kind:
//   • vertex-drag — drag a parabola's vertex; the curve y=a(x−h)²+k follows.
//   • plot-point  — drag ONE point to a target (optionally reading a shown curve).
//   • plot-line   — drag TWO points; the line through them is graded by canonical
//                   slope+intercept ("m,b"), so any two correct lattice points match.
// On release points snap to the spec's grid. The composed answer is a canonical
// string graded server-side by plain value match (the target lives only in the
// answer key — never on the client).
//
// Council guardrails: snap-to-grid (precision + fair grading), a numeric fine-tune
// fallback for single-point kinds (touch/accessibility), and NO live correctness.
"use client";

import { useEffect } from "react";
import { Mafs, Coordinates, Plot, useMovablePoint } from "mafs";
import "mafs/core.css";
import type { InteractiveSpec } from "@/types";

const snapTo = (v: number, step: number) => Math.round(v / step) * step;
// Trim float noise so "2" not "2.0000001" and "2.5" stays "2.5".
const fmt = (v: number) => String(Math.round(v * 1000) / 1000);

export function VertexDragInput({
  spec,
  onChange,
}: {
  spec: InteractiveSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  const step = spec.snap || 0.5;
  const isLine = spec.kind === "plot-line";
  const constrain = ([x, y]: [number, number]): [number, number] => [snapTo(x, step), snapTo(y, step)];
  // Hooks must run unconditionally — always create both points; the second is
  // only used/rendered for plot-line.
  const pA = useMovablePoint([0, 0], { constrain });
  const pB = useMovablePoint([2, 1], { constrain });
  const [ax, ay] = pA.point;
  const [bx, by] = pB.point;

  // line through the two points (undefined slope → "vertical", never matches)
  const vertical = isLine && ax === bx;
  const m = vertical ? 0 : (by - ay) / (bx - ax);
  const b = ay - m * ax;

  useEffect(() => {
    if (isLine) onChange(vertical ? "vertical" : `${fmt(m)},${fmt(b)}`);
    else onChange(`${fmt(ax)},${fmt(ay)}`);
  }, [ax, ay, bx, by]); // eslint-disable-line react-hooks/exhaustive-deps

  const nudge = (dx: number, dy: number) => pA.setPoint([snapTo(ax + dx, step), snapTo(ay + dy, step)]);

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs height={300} viewBox={{ x: spec.xRange, y: spec.yRange }} preserveAspectRatio={false}>
          <Coordinates.Cartesian />
          {spec.kind === "vertex-drag" && <Plot.OfX y={(x) => (spec.a ?? 1) * (x - ax) ** 2 + ay} />}
          {spec.kind === "plot-point" && spec.curve && (
            <Plot.OfX y={(x) => spec.curve!.a * (x - spec.curve!.h) ** 2 + spec.curve!.k} />
          )}
          {isLine && !vertical && <Plot.OfX y={(x) => m * x + b} />}
          {pA.element}
          {isLine && pB.element}
        </Mafs>
      </div>

      {isLine ? (
        <p className="mt-3 text-center text-[11px] text-muted">Drag the two orange points so the line matches the equation.</p>
      ) : (
        <>
          {/* Numeric fine-tune (touch / accessibility precision fallback) */}
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted">x</span>
              <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(-step, 0)} aria-label="Move point left">−</button>
              <span className="w-10 text-center font-semibold tabular-nums">{fmt(ax)}</span>
              <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(step, 0)} aria-label="Move point right">+</button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted">y</span>
              <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(0, -step)} aria-label="Move point down">−</button>
              <span className="w-10 text-center font-semibold tabular-nums">{fmt(ay)}</span>
              <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(0, step)} aria-label="Move point up">+</button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">Drag the orange point, or use the + / − buttons.</p>
        </>
      )}
    </div>
  );
}
