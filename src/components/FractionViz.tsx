// src/components/FractionViz.tsx
// Web counterpart of the PDF fraction visuals (src/lib/pdf/renderer.tsx).
// The FDP engine prefixes visual questions with a marker:
//   [[viz pie n d]]  [[viz bar n d]]  [[viz grid n d]]  [[viz cmp n1 d1 n2 d2]]
// QuestionWithViz draws the shape inline and renders the rest via MathText.
"use client";

import { MathText } from "./MathText";
import { polygonSlicePaths, POLY_SIDES } from "@/lib/math/fraction-shapes";
import { figureDiagram, isFigureKind } from "@/lib/math/angle-shapes";

const GOLD = "#C8902A";
const SOFT = "#FBF4E4";
const INK = "#1A1612";

interface Viz { kind: string; nums: number[]; text: string; }
function parseViz(q: string): Viz | null {
  const m = q.match(/^\[\[viz (\w+)((?: \d+)+)\]\]\s*(.*)$/);
  if (!m) return null;
  return { kind: m[1], nums: m[2].trim().split(/\s+/).map(Number), text: m[3] };
}

function Pie({ n, d, size = 72 }: { n: number; d: number; size?: number }) {
  const r = size / 2;
  const slices = [];
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
    const x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    slices.push(
      <path key={i} d={`M ${r} ${r} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
        fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={1} />
    );
  }
  return <svg width={size} height={size} className="shrink-0">{slices}</svg>;
}

function Bar({ n, d, w = 132, h = 34 }: { n: number; d: number; w?: number; h?: number }) {
  const cw = w / d;
  return (
    <svg width={w} height={h} className="shrink-0">
      {Array.from({ length: d }, (_, i) => (
        <rect key={i} x={i * cw} y={0} width={cw} height={h}
          fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={1} />
      ))}
    </svg>
  );
}

function Grid({ n, d, size = 72 }: { n: number; d: number; size?: number }) {
  const cols = d === 100 ? 10 : Math.min(d, Math.max(1, Math.ceil(Math.sqrt(d))));
  const rows = Math.ceil(d / cols);
  const cell = size / Math.max(cols, rows);
  return (
    <svg width={cols * cell} height={rows * cell} className="shrink-0">
      {Array.from({ length: d }, (_, i) => (
        <rect key={i} x={(i % cols) * cell} y={Math.floor(i / cols) * cell} width={cell} height={cell}
          fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={0.6} />
      ))}
    </svg>
  );
}

function Cmp({ nums, w = 150 }: { nums: number[]; w?: number }) {
  const [n1, d1, n2, d2] = nums;
  const h = 16, gap = 8;
  const bars = (n: number, d: number, y: number) =>
    Array.from({ length: d }, (_, i) => (
      <rect key={`${y}-${i}`} x={(w / d) * i} y={y} width={w / d} height={h}
        fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={1} />
    ));
  return <svg width={w} height={h * 2 + gap} className="shrink-0">{bars(n1, d1, 0)}{bars(n2, d2, h + gap)}</svg>;
}

function VBar({ n, d, w = 36, h = 72 }: { n: number; d: number; w?: number; h?: number }) {
  const ch = h / d;
  return (
    <svg width={w} height={h} className="shrink-0">
      {Array.from({ length: d }, (_, i) => (
        <rect key={i} x={0} y={i * ch} width={w} height={ch}
          fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={1} />
      ))}
    </svg>
  );
}

function Poly({ sides, n, d, size = 72 }: { sides: number; n: number; d: number; size?: number }) {
  const paths = polygonSlicePaths(sides, d, size / 2);
  return (
    <svg width={size} height={size} className="shrink-0">
      {paths.map((dd, i) => (
        <path key={i} d={dd} fill={i < n ? GOLD : SOFT} stroke={INK} strokeWidth={1} />
      ))}
    </svg>
  );
}

function Angle({ kind, nums, size = 72 }: { kind: string; nums: number[]; size?: number }) {
  const prims = figureDiagram(kind, nums, size);
  return (
    <svg width={size} height={size} className="shrink-0">
      {prims.map((p, i) => {
        if (p.t === "line") return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={INK} strokeWidth={1.3} strokeDasharray={p.dash ? "3 3" : undefined} />;
        if (p.t === "poly") return <polygon key={i} points={p.pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={INK} strokeWidth={1.3} />;
        if (p.t === "rect") return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke={INK} strokeWidth={1.3} />;
        if (p.t === "circle") return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="none" stroke={INK} strokeWidth={1.3} />;
        return <text key={i} x={p.x} y={p.y} fontSize={11} fontWeight="bold" textAnchor="middle" fill={INK}>{p.s}</text>;
      })}
    </svg>
  );
}

// Ten-frame counters for early addition. Renders circles in rows of five (two
// rows = a ten-frame), so a child can SEE and count instead of using fingers.
//   [[viz adddots a b]]     → a gold + b blue filled circles ("count them all")
//   [[viz missdots k total]]→ k gold filled + (total−k) empty ("count the empties")
function Dots({ kind, nums }: { kind: string; nums: number[] }) {
  const [x, y] = nums;
  const BLUE = "#1B4F8A";
  type Dot = { fill: string; outline: boolean };
  let dots: Dot[] = [];
  if (kind === "missdots") {
    const known = x, total = y;
    dots = [
      ...Array.from({ length: known }, () => ({ fill: GOLD, outline: false })),
      ...Array.from({ length: Math.max(0, total - known) }, () => ({ fill: "#fff", outline: true })),
    ];
  } else {
    dots = [
      ...Array.from({ length: x }, () => ({ fill: GOLD, outline: false })),
      ...Array.from({ length: y }, () => ({ fill: BLUE, outline: false })),
    ];
  }
  const perRow = 5, r = 9, gap = 6, cell = r * 2 + gap;
  const rows = Math.ceil(dots.length / perRow);
  const w = perRow * cell, h = rows * cell;
  return (
    <svg width={w} height={h} className="shrink-0" role="img" aria-label="counting dots">
      {dots.map((d, i) => {
        const col = i % perRow, row = Math.floor(i / perRow);
        return <circle key={i} cx={col * cell + r + 1} cy={row * cell + r + 1} r={r}
          fill={d.fill} stroke={INK} strokeWidth={d.outline ? 1.4 : 1} strokeDasharray={d.outline ? "2 2" : undefined} />;
      })}
    </svg>
  );
}

// Multiplication ARRAY: [[viz mularray rows cols]] — rows groups of cols dots,
// each row labelled with the running total so a child can skip-count down the
// side (the multiplication equivalent of the addition ten-frame).
function MulArray({ rows, cols }: { rows: number; cols: number }) {
  const BLUE = "#1B4F8A";
  const r = 8, gap = 6, cell = r * 2 + gap;
  const labelW = 34;
  const w = cols * cell + labelW, h = rows * cell;
  return (
    <svg width={w} height={h} className="shrink-0" role="img" aria-label={`${rows} rows of ${cols} dots`}>
      {Array.from({ length: rows }, (_, ri) => (
        <g key={ri}>
          {Array.from({ length: cols }, (_, ci) => (
            <circle key={ci} cx={ci * cell + r + 1} cy={ri * cell + r + 1} r={r}
              fill={ri % 2 === 0 ? GOLD : BLUE} stroke={INK} strokeWidth={1} />
          ))}
          <text x={cols * cell + 6} y={ri * cell + r + 5} fontSize={11} fontWeight={700} fill="#7A6E5F">
            {(ri + 1) * cols}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Shape({ viz, size }: { viz: Viz; size: number }) {
  const [a, b] = viz.nums;
  if (viz.kind === "mularray") return <MulArray rows={a} cols={b} />;
  if (viz.kind === "adddots" || viz.kind === "missdots") return <Dots kind={viz.kind} nums={viz.nums} />;
  if (isFigureKind(viz.kind)) return <Angle kind={viz.kind} nums={viz.nums} size={size} />;
  if (viz.kind === "pie") return <Pie n={a} d={b} size={size} />;
  if (viz.kind === "bar") return <Bar n={a} d={b} w={size * 1.8} h={size * 0.46} />;
  if (viz.kind === "vbar") return <VBar n={a} d={b} w={size * 0.5} h={size} />;
  if (viz.kind === "grid") return <Grid n={a} d={b} size={size} />;
  if (viz.kind === "cmp") return <Cmp nums={viz.nums} w={size * 2} />;
  if (viz.kind in POLY_SIDES) return <Poly sides={POLY_SIDES[viz.kind]} n={a} d={b} size={size} />;
  return null;
}

/** Renders a (possibly visual) practice question. Falls back to MathText. */
export function QuestionWithViz({ text, className = "", size = 72 }: { text: string; className?: string; size?: number }) {
  const viz = parseViz(text);
  if (!viz) return <MathText className={className}>{text}</MathText>;
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Shape viz={viz} size={size} />
      <MathText>{viz.text}</MathText>
    </span>
  );
}
