// src/components/practice/VertexDragInput.tsx
// First interactive (graphing) answer input: the student DRAGS a parabola's
// vertex on a coordinate plane. The curve y = a(x−h)² + k follows the vertex
// live. On release the vertex snaps to the spec's grid; the composed answer is
// the canonical "x,y" string, graded server-side by plain value match (the
// target lives only in the answer key — never on the client).
//
// Council guardrails baked in: snap-to-grid (precision + fair grading), a numeric
// fine-tune fallback for touch/accessibility, and NO live correctness feedback.
"use client";

import { useEffect, useState } from "react";
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
  const point = useMovablePoint([0, 0], {
    constrain: ([x, y]) => [snapTo(x, step), snapTo(y, step)],
  });
  const [hx, hy] = [point.point[0], point.point[1]];

  // Publish the snapped point as the answer whenever it moves.
  useEffect(() => { onChange(`${fmt(hx)},${fmt(hy)}`); }, [hx, hy]); // eslint-disable-line react-hooks/exhaustive-deps

  const nudge = (dx: number, dy: number) => point.setPoint([snapTo(hx + dx, step), snapTo(hy + dy, step)]);

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs
          height={300}
          viewBox={{ x: spec.xRange, y: spec.yRange }}
          preserveAspectRatio={false}
        >
          <Coordinates.Cartesian />
          {/* vertex-drag: the parabola follows the dragged vertex.
              plot-point: optionally show a fixed read-only reference curve. */}
          {spec.kind === "vertex-drag" && (
            <Plot.OfX y={(x) => (spec.a ?? 1) * (x - hx) ** 2 + hy} />
          )}
          {spec.kind === "plot-point" && spec.curve && (
            <Plot.OfX y={(x) => spec.curve!.a * (x - spec.curve!.h) ** 2 + spec.curve!.k} />
          )}
          {point.element}
        </Mafs>
      </div>

      {/* Numeric fine-tune (touch / accessibility precision fallback) */}
      <div className="mt-3 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted">x</span>
          <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(-step, 0)} aria-label="Move vertex left">−</button>
          <span className="w-10 text-center font-semibold tabular-nums">{fmt(hx)}</span>
          <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(step, 0)} aria-label="Move vertex right">+</button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted">y</span>
          <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(0, -step)} aria-label="Move vertex down">−</button>
          <span className="w-10 text-center font-semibold tabular-nums">{fmt(hy)}</span>
          <button className="w-8 h-8 rounded-md border border-border hover:bg-cream-dark" onClick={() => nudge(0, step)} aria-label="Move vertex up">+</button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Drag the orange point, or use the + / − buttons.</p>
    </div>
  );
}
