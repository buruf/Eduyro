// src/components/practice/AngleDragInput.tsx
// Graded interactive geometry: the student drags a point around the unit circle
// to a TARGET angle. The point snaps to standard angles (0°, 30°, 45°, … 330°)
// so grading is exact — the composed answer is the snapped angle in degrees,
// graded server-side by plain value match (the target lives only in the answer
// key). No live correctness feedback.
"use client";

import { useEffect } from "react";
import { Mafs, Coordinates, Circle, Line, useMovablePoint } from "mafs";
import "mafs/core.css";

const STD = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
// circular distance, then nearest standard angle
const circDist = (a: number, b: number) => Math.min((a - b + 360) % 360, (b - a + 360) % 360);
const nearestStd = (deg: number) => STD.reduce((best, s) => (circDist(deg, s) < circDist(deg, best) ? s : best), STD[0]);

export function AngleDragInput({ onChange }: { spec: unknown; value: string; onChange: (v: string) => void }) {
  const p = useMovablePoint([Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)], {
    // snap the dragged point to the nearest standard angle ON the unit circle
    constrain: ([x, y]) => {
      const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      const r = (nearestStd(deg) * Math.PI) / 180;
      return [Math.cos(r), Math.sin(r)];
    },
  });
  const [x, y] = p.point;
  const deg = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  useEffect(() => { onChange(String(deg)); }, [deg]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs height={280} viewBox={{ x: [-1.4, 1.4], y: [-1.4, 1.4] }} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={2} />
          <Circle center={[0, 0]} radius={1} />
          <Line.Segment point1={[0, 0]} point2={[x, y]} />
          {p.element}
        </Mafs>
      </div>
      <div className="mt-3 text-center font-serif text-lg font-bold text-ink">θ = {deg}°</div>
      <p className="mt-2 text-center text-[11px] text-muted">Drag the point around the circle to the target angle (it snaps to standard angles).</p>
    </div>
  );
}
