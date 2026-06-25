// src/components/tutorial/UnitCircleExplorer.tsx
// Interactive M15 (Trigonometry) lesson demo (no grading): the student drags a
// point around the unit circle and watches the angle θ and its sine/cosine
// update live — discovering that cos θ is the x-coordinate and sin θ the
// y-coordinate. The "explore, don't memorize" centerpiece for trig, mirroring
// the quadratics slider explorer.
"use client";

import { Mafs, Coordinates, Circle, Line, useMovablePoint } from "mafs";
import "mafs/core.css";

const f2 = (v: number) => (Math.round(v * 100) / 100).toFixed(2);
const deg = (r: number) => Math.round(((r * 180) / Math.PI + 360) % 360);
// Nearest standard angle label, when close — helps connect drag → known values.
const STD: Record<number, string> = { 0: "0", 30: "30°", 45: "45°", 60: "60°", 90: "90°", 120: "120°", 135: "135°", 150: "150°", 180: "180°", 210: "210°", 225: "225°", 240: "240°", 270: "270°", 300: "300°", 315: "315°", 330: "330°" };

export function UnitCircleExplorer() {
  const p = useMovablePoint([Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)], {
    // keep the point ON the unit circle as it's dragged
    constrain: ([x, y]) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; },
  });
  const [x, y] = p.point;
  const d = deg(Math.atan2(y, x));
  const nearStd = Object.keys(STD).map(Number).find((s) => Math.abs(((d - s + 540) % 360) - 180) > 178);

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        {/* preserveAspectRatio "contain" keeps the unit circle ROUND (a square
            math region must not be stretched into the wide pixel box). */}
        <Mafs height={280} viewBox={{ x: [-1.4, 1.4], y: [-1.4, 1.4] }} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={2} />
          <Circle center={[0, 0]} radius={1} />
          <Line.Segment point1={[0, 0]} point2={[x, y]} />
          <Line.Segment point1={[x, 0]} point2={[x, y]} />{/* sin leg (vertical) */}
          <Line.Segment point1={[0, 0]} point2={[x, 0]} />{/* cos leg (horizontal) */}
          {p.element}
        </Mafs>
      </div>

      <div className="mt-3 text-center font-serif text-base font-bold text-ink">
        θ = {d}°{nearStd !== undefined ? "" : ""}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-sm max-w-xs mx-auto">
        <div className="rounded-lg bg-cream-dark px-3 py-1.5 text-center" style={{ color: "#1B4F8A" }}>cos θ = <span className="font-semibold tabular-nums">{f2(x)}</span></div>
        <div className="rounded-lg bg-cream-dark px-3 py-1.5 text-center" style={{ color: "#2D6A3F" }}>sin θ = <span className="font-semibold tabular-nums">{f2(y)}</span></div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Drag the point around the circle — cos θ is the x-coordinate, sin θ is the y-coordinate.</p>
    </div>
  );
}
