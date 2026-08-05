// src/components/tutorial/UnitCircleExplorer.tsx
// Interactive M15 (Trigonometry) lesson demo (no grading): the student drags a
// point around the unit circle. The drag SNAPS to the 16 special angles, and
// for each one the reference RIGHT TRIANGLE is drawn inside the circle with its
// exact side lengths (1/2, √2/2, √3/2) — so values are read as fractions
// derived from a triangle, never as mystery decimals (user feedback).
"use client";

import { Mafs, Coordinates, Circle, Line, Text as MafsText, Polygon, useMovablePoint } from "mafs";
import "mafs/core.css";
import { MathText } from "@/components/MathText";

const BLUE = "#1B4F8A", GREEN = "#2D6A3F";

// The 16 special angles (degrees).
const SPECIALS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

// Exact |cos|/|sin| by reference angle, as display + LaTeX strings.
const EXACT: Record<number, { c: string; s: string; cTex: string; sTex: string }> = {
  0:  { c: "1",   s: "0",   cTex: "1", sTex: "0" },
  30: { c: "√3/2", s: "1/2", cTex: "\\frac{\\sqrt{3}}{2}", sTex: "\\frac{1}{2}" },
  45: { c: "√2/2", s: "√2/2", cTex: "\\frac{\\sqrt{2}}{2}", sTex: "\\frac{\\sqrt{2}}{2}" },
  60: { c: "1/2", s: "√3/2", cTex: "\\frac{1}{2}", sTex: "\\frac{\\sqrt{3}}{2}" },
  90: { c: "0",   s: "1",   cTex: "0", sTex: "1" },
};

// Reference angle (0–90) for a standard angle d.
const refAngle = (d: number) => (d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d);
const sign = (v: number) => (v < -1e-9 ? "−" : "");

export function UnitCircleExplorer() {
  const p = useMovablePoint([Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)], {
    // Snap the drag to the nearest SPECIAL angle on the unit circle — the whole
    // lesson is about the special angles, so every stop is a teachable one.
    constrain: ([x, y]) => {
      const d = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      const best = SPECIALS.reduce((a, b) => (Math.abs(((d - b + 540) % 360) - 180) > Math.abs(((d - a + 540) % 360) - 180) ? a : b));
      const r = (best * Math.PI) / 180;
      return [Math.cos(r), Math.sin(r)];
    },
  });
  const [x, y] = p.point;
  const d = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360) % 360;
  const ref = refAngle(d);
  const ex = EXACT[ref as keyof typeof EXACT] ?? EXACT[0];
  const onAxis = ref === 0 || ref === 90;
  const cosStr = ex.c === "0" ? "0" : `${sign(x)}${ex.c}`;
  const sinStr = ex.s === "0" ? "0" : `${sign(y)}${ex.s}`;
  const cosTex = ex.cTex === "0" ? "0" : `${x < -1e-9 ? "-" : ""}${ex.cTex}`;
  const sinTex = ex.sTex === "0" ? "0" : `${y < -1e-9 ? "-" : ""}${ex.sTex}`;
  const triangleName = ref === 45 ? "45-45-90 triangle — both legs are √2/2" :
    ref === 30 || ref === 60 ? "30-60-90 triangle — short leg 1/2, long leg √3/2, hypotenuse 1" :
    "The point sits ON an axis — no triangle needed";

  return (
    <div className="select-none" style={{ touchAction: "none" }}>
      <div className="rounded-xl overflow-hidden border border-border bg-white">
        <Mafs height={280} viewBox={{ x: [-1.4, 1.4], y: [-1.4, 1.4] }} preserveAspectRatio="contain">
          <Coordinates.Cartesian subdivisions={2} />
          <Circle center={[0, 0]} radius={1} />
          {/* the reference right triangle, filled so it reads as a SHAPE */}
          {!onAxis && <Polygon points={[[0, 0], [x, 0], [x, y]]} color={BLUE} fillOpacity={0.12} />}
          <Line.Segment point1={[0, 0]} point2={[x, y]} />
          {!onAxis && <Line.Segment point1={[x, 0]} point2={[x, y]} color={GREEN} weight={3} />}
          {!onAxis && <Line.Segment point1={[0, 0]} point2={[x, 0]} color={BLUE} weight={3} />}
          {/* exact side labels, derived from the triangle */}
          {!onAxis && <MafsText x={x / 2} y={y > 0 ? -0.14 : 0.14} size={14} color={BLUE}>{sign(x)}{ex.c}</MafsText>}
          {!onAxis && <MafsText x={x + (x >= 0 ? 0.2 : -0.2)} y={y / 2} size={14} color={GREEN}>{sign(y)}{ex.s}</MafsText>}
          <MafsText x={x / 2 - (y >= 0 ? 0.12 : -0.12) * Math.sign(x || 1)} y={y / 2 + (y >= 0 ? 0.12 : -0.12)} size={13}>1</MafsText>
          {p.element}
        </Mafs>
      </div>

      <div className="mt-3 text-center font-serif text-base font-bold text-ink">θ = {d}°</div>
      {/* exact values as REAL stacked fractions (decimals only as a whisper) */}
      <div className="mt-1 grid grid-cols-2 gap-2 text-sm max-w-sm mx-auto">
        <div className="rounded-lg bg-cream-dark px-3 py-2 text-center" style={{ color: BLUE }}>
          cos θ = <MathText className="font-semibold">{`$${cosTex}$`}</MathText>
          <span className="block text-[10px] text-muted">≈ {(Math.round(x * 100) / 100).toFixed(2)}</span>
        </div>
        <div className="rounded-lg bg-cream-dark px-3 py-2 text-center" style={{ color: GREEN }}>
          sin θ = <MathText className="font-semibold">{`$${sinTex}$`}</MathText>
          <span className="block text-[10px] text-muted">≈ {(Math.round(y * 100) / 100).toFixed(2)}</span>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[11px] font-semibold text-gold-dark">{triangleName}</p>
      <p className="mt-1 text-center text-[11px] text-muted">
        Drag the point — it snaps to the special angles. The triangle&rsquo;s <span style={{ color: BLUE }}>horizontal leg is cos θ</span>, its <span style={{ color: GREEN }}>vertical leg is sin θ</span>, and the hypotenuse is always 1.
      </p>
    </div>
  );
}
