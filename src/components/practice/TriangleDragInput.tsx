// src/components/practice/TriangleDragInput.tsx
// Draggable-figure geometry: the student drags a TRIANGLE's three vertices on a
// coordinate plane to a target/image figure. Vertices snap to the integer grid.
// The composed answer is the three vertices, each "x,y", SORTED and joined by ";"
// so vertex order never matters — graded server-side by plain value match.
"use client";

import { useEffect } from "react";
import { Mafs, Coordinates, Polygon, useMovablePoint } from "mafs";
import "mafs/core.css";
import type { InteractiveSpec } from "@/types";

const snap = (v: number) => Math.round(v);
const fmt = (v: number) => String(Math.round(v));

export function TriangleDragInput({ spec, onChange }: { spec: InteractiveSpec; value: string; onChange: (v: string) => void }) {
  const c = ([x, y]: [number, number]): [number, number] => [snap(x), snap(y)];
  const p1 = useMovablePoint([0, 0], { constrain: c });
  const p2 = useMovablePoint([3, 0], { constrain: c });
  const p3 = useMovablePoint([0, 3], { constrain: c });
  const pts: [number, number][] = [p1.point, p2.point, p3.point];

  useEffect(() => {
    onChange(pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).sort().join(";"));
  }, [p1.point[0], p1.point[1], p2.point[0], p2.point[1], p3.point[0], p3.point[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs height={300} viewBox={{ x: spec.xRange, y: spec.yRange }} preserveAspectRatio="contain">
          <Coordinates.Cartesian />
          <Polygon points={pts} color="#1B4F8A" />
          {p1.element}{p2.element}{p3.element}
        </Mafs>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Drag the three vertices to form the triangle (they snap to the grid).</p>
    </div>
  );
}
