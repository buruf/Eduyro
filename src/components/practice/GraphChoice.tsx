// src/components/practice/GraphChoice.tsx
// "Match the equation to its graph" — a multiple-choice item whose OPTIONS are
// graphs, not text. Each option is a compact descriptor string:
//   "parab:a,h,k"  → y = a(x − h)² + k
//   "line:m,b"     → y = mx + b
// rendered as a small inline SVG thumbnail. The selected descriptor IS the
// answer, so grading stays a plain value match (no bespoke grader). Lightweight
// SVG (not Mafs) so several thumbnails render cheaply inside option buttons.
"use client";

const W = 116, H = 88, R = 5; // plot range [-R, R] on both axes
const PX = (x: number) => ((x + R) / (2 * R)) * W;
const PY = (y: number) => H - ((y + R) / (2 * R)) * H;

function curvePoints(spec: string): string {
  const [kind, nums] = spec.split(":");
  const n = (nums ?? "").split(",").map(Number);
  const pts: string[] = [];
  for (let x = -R; x <= R; x += 0.25) {
    let y: number;
    if (kind === "parab") y = n[0] * (x - n[1]) ** 2 + n[2];
    else y = n[0] * x + n[1]; // line:m,b
    if (y < -R - 1 || y > R + 1) continue; // skip far-off-screen samples
    pts.push(`${PX(x).toFixed(1)},${PY(y).toFixed(1)}`);
  }
  return pts.join(" ");
}

export function GraphThumb({ spec, height = 84 }: { spec: string; height?: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: "hidden" }} aria-hidden>
      {/* axes */}
      <line x1={PX(-R)} y1={PY(0)} x2={PX(R)} y2={PY(0)} stroke="#B8AC9C" strokeWidth={1} />
      <line x1={PX(0)} y1={PY(-R)} x2={PX(0)} y2={PY(R)} stroke="#B8AC9C" strokeWidth={1} />
      <polyline points={curvePoints(spec)} fill="none" stroke="#1B4F8A" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function GraphChoice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={selected}
            className={
              "rounded-xl border-2 bg-white p-1.5 transition-colors " +
              (selected ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-border hover:border-brand-blue/50")
            }
          >
            <GraphThumb spec={opt} />
          </button>
        );
      })}
    </div>
  );
}
