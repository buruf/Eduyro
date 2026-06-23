// src/components/tutorial/TutorialVisual.tsx
// Animated concept visuals for the pre-practice tutorials.
// Pure SVG + CSS transitions driven by a simple step ticker — no animation libs.
"use client";

import { useEffect, useState } from "react";

const INK = "#1A1612";
const GOLD = "#C8902A";
const GOLD_SOFT = "#E8C87A";
const BLUE = "#1B4F8A";
const GREEN = "#2D6A3F";
const GREY = "#E8E0D0";
const MUTED = "#7A6E5F";

/** Cycles 0..steps-1 forever. */
function useTick(steps: number, ms: number): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearInterval(id);
  }, [steps, ms]);
  return step;
}

const fade = (visible: boolean, ms = 500): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transition: `opacity ${ms}ms ease`,
});
const move = (x: number, y: number, ms = 700): React.CSSProperties => ({
  transform: `translate(${x}px, ${y}px)`,
  transition: `transform ${ms}ms ease`,
});

// ── M1 Counting — dots pop in one at a time ──────────────────────────────────
function CountingVisual() {
  const step = useTick(12, 750); // 0..9 = dots, 10-11 = hold
  const n = Math.min(step + 1, 10);
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={i}
          cx={42 + (i % 5) * 60}
          cy={i < 5 ? 60 : 120}
          r={16}
          fill={i < n ? GOLD : GREY}
          style={{ ...fade(true), transform: i < n ? "scale(1)" : "scale(0.6)", transformOrigin: `${42 + (i % 5) * 60}px ${i < 5 ? 60 : 120}px`, transition: "all 400ms ease" }}
        />
      ))}
      <text x={180} y={182} textAnchor="middle" fontSize={30} fontWeight={700} fill={INK} fontFamily="Georgia, serif">
        {n}
      </text>
    </svg>
  );
}

// ── M2 Place value — 47 as 4 ten-rods + 7 ones ───────────────────────────────
function PlaceValueVisual() {
  const step = useTick(14, 650); // rods 0-3, cubes 4-10, hold
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      <text x={180} y={32} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK} fontFamily="Georgia, serif">47</text>
      {/* tens rods */}
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={`t${i}`} x={50 + i * 28} y={55} width={18} height={100} rx={3}
          fill={GOLD} style={fade(step >= i)} />
      ))}
      <text x={86} y={178} textAnchor="middle" fontSize={12} fill={step >= 11 ? GOLD : MUTED} fontWeight={step >= 11 ? 700 : 400}>
        4 tens = 40
      </text>
      {/* ones cubes */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={`o${i}`} x={205 + (i % 4) * 26} y={i < 4 ? 80 : 110} width={18} height={18} rx={3}
          fill={BLUE} style={fade(step >= 4 + i)} />
      ))}
      <text x={252} y={178} textAnchor="middle" fontSize={12} fill={step >= 12 ? BLUE : MUTED} fontWeight={step >= 12 ? 700 : 400}>
        7 ones = 7
      </text>
    </svg>
  );
}

// ── M3 Addition — two groups slide together ──────────────────────────────────
function AdditionVisual() {
  const step = useTick(5, 1100); // 0 groups appear, 1 hold, 2 merge, 3 total, 4 hold
  const merged = step >= 2;
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* 3 blue dots — base 60,96,132; merged → 108,144,180 (+48) */}
      {[0, 1, 2].map((i) => (
        <g key={`b${i}`} style={move(merged ? 48 : 0, 0)}>
          <circle cx={60 + i * 36} cy={80} r={15} fill={BLUE} style={fade(true)} />
        </g>
      ))}
      {/* 2 gold dots — base 256,292; merged → 216,252 (−40) so all 5 dots sit
          evenly spaced (36px apart) with NO overlap onto the last blue dot. */}
      {[0, 1].map((i) => (
        <g key={`g${i}`} style={move(merged ? -40 : 0, 0)}>
          <circle cx={256 + i * 36} cy={80} r={15} fill={GOLD} />
        </g>
      ))}
      <text x={180} y={86} textAnchor="middle" fontSize={22} fontWeight={700} fill={MUTED} style={fade(!merged)}>+</text>
      <text x={180} y={170} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 3)}>
        3 + 2 = 5
      </text>
    </svg>
  );
}

// ── M4 Subtraction — dots fade away ──────────────────────────────────────────
function SubtractionVisual() {
  const step = useTick(5, 1100);
  const taken = step >= 2;
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {Array.from({ length: 7 }, (_, i) => {
        const isTaken = i >= 4;
        return (
          <g key={i}>
            <circle cx={48 + i * 44} cy={84} r={16} fill={isTaken ? GOLD : BLUE}
              style={{ opacity: isTaken && taken ? 0.15 : 1, transition: "opacity 600ms ease" }} />
            {isTaken && taken && (
              <text x={48 + i * 44} y={90} textAnchor="middle" fontSize={18} fontWeight={700} fill={MUTED} style={fade(taken)}>✕</text>
            )}
          </g>
        );
      })}
      <text x={180} y={170} textAnchor="middle" fontSize={26} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 3)}>
        7 − 3 = 4
      </text>
    </svg>
  );
}

// ── M5 Multiplication — array builds row by row ──────────────────────────────
function MultiplicationVisual() {
  const step = useTick(6, 900); // rows 0-2, then total
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={110 + c * 48} cy={48 + r * 42} r={15}
            fill={r === 1 ? GOLD : BLUE} style={fade(step >= r)} />
        ))
      )}
      <text x={48} y={92} textAnchor="middle" fontSize={13} fill={MUTED} style={fade(step >= 3)}>3 rows</text>
      <text x={206} y={22} textAnchor="middle" fontSize={13} fill={MUTED} style={fade(step >= 3)}>4 in each row</text>
      <text x={180} y={186} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 4)}>
        3 × 4 = 12
      </text>
    </svg>
  );
}

// ── M6 Division — dots sort into equal groups ────────────────────────────────
function DivisionVisual() {
  const step = useTick(5, 1200);
  const sorted = step >= 2;
  const groupX = [70, 180, 290];
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {groupX.map((gx, g) => (
        <circle key={`ring${g}`} cx={gx} cy={95} r={42} fill="none" stroke={GREY} strokeWidth={2} strokeDasharray="5 4" style={fade(sorted, 400)} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const g = i % 3;             // target group
        const k = Math.floor(i / 3); // position within group
        const homeX = 60 + (i % 6) * 48, homeY = i < 6 ? 60 : 120;
        const tx = groupX[g] + (k % 2 === 0 ? -14 : 14);
        const ty = 78 + Math.floor(k / 2) * 30;
        return (
          <g key={i} style={move(sorted ? tx - homeX : 0, sorted ? ty - homeY : 0, 900)}>
            <circle cx={homeX} cy={homeY} r={11} fill={[BLUE, GOLD, GREEN][g]} />
          </g>
        );
      })}
      <text x={180} y={188} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 3)}>
        12 ÷ 3 = 4 each
      </text>
    </svg>
  );
}

// ── M7 Fraction basics — INTERACTIVE numerator slider on a pie ───────────────
function slicePath(cx: number, cy: number, r: number, i: number, d: number): string {
  const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
  const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
  const large = 1 / d > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
}

function FractionBasicsVisual() {
  const d = 4;
  const [n, setN] = useState(3);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 360 190" className="w-full">
        {Array.from({ length: d }, (_, i) => (
          <path key={i} d={slicePath(120, 95, 78, i, d)}
            fill={i < n ? GOLD : "#FFFFFF"} stroke={INK} strokeWidth={2}
            style={{ transition: "fill 350ms ease" }} />
        ))}
        <text x={262} y={78} textAnchor="middle" fontSize={40} fontWeight={700} fill={GOLD} fontFamily="Georgia, serif">{n}</text>
        <rect x={232} y={90} width={60} height={3} fill={INK} />
        <text x={262} y={134} textAnchor="middle" fontSize={40} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{d}</text>
        <text x={262} y={166} textAnchor="middle" fontSize={12} fill={MUTED}>{n} of {d} slices</text>
      </svg>
      <label className="flex items-center gap-3 text-xs text-muted mt-1 w-full max-w-[280px]">
        <span className="font-semibold whitespace-nowrap">Slices shaded</span>
        <input type="range" min={0} max={d} value={n} onChange={(e) => setN(parseInt(e.target.value))}
          className="w-full accent-[#C8902A]" aria-label="Number of shaded slices" />
        <span className="font-bold text-ink w-4 text-center">{n}</span>
      </label>
    </div>
  );
}

// ── M7 Fraction operations — bars combine ────────────────────────────────────
function FractionOpsVisual() {
  const step = useTick(5, 1200);
  const merged = step >= 2;
  const cell = 60;
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* bar A: 1/4 */}
      <g style={move(merged ? 60 : 0, merged ? 50 : 0, 800)}>
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x={20 + i * cell / 2} y={50} width={cell / 2 - 3} height={34} rx={3}
            fill={i < 1 ? BLUE : "#fff"} stroke={INK} strokeWidth={1.5} />
        ))}
      </g>
      {/* bar B: 2/4 */}
      <g style={move(merged ? -103 : 0, merged ? 50 : 0, 800)}>
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x={213 + i * cell / 2} y={50} width={cell / 2 - 3} height={34} rx={3}
            fill={i < 2 ? GOLD : "#fff"} stroke={INK} strokeWidth={1.5} />
        ))}
      </g>
      <text x={180} y={73} textAnchor="middle" fontSize={20} fontWeight={700} fill={MUTED} style={fade(!merged)}>+</text>
      <text x={180} y={36} textAnchor="middle" fontSize={14} fill={MUTED} style={fade(!merged)}>
        1/4  +  2/4
      </text>
      <text x={180} y={175} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 3)}>
        1/4 + 2/4 = 3/4
      </text>
    </svg>
  );
}

// ── M8 Decimals — hundredths grid fills to 0.30 ──────────────────────────────
function HundredGrid({ filled, fillColor, label }: { filled: number; fillColor: string; label: string }) {
  const size = 15;
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {Array.from({ length: 100 }, (_, i) => {
        const r = Math.floor(i / 10), c = i % 10;
        return (
          <rect key={i} x={60 + c * size} y={20 + r * size} width={size - 1.5} height={size - 1.5}
            fill={i < filled ? fillColor : "#fff"} stroke={GREY} strokeWidth={1}
            style={{ transition: `fill 200ms ease ${i * 12}ms` }} />
        );
      })}
      <text x={285} y={105} fontSize={20} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{label}</text>
    </svg>
  );
}

function DecimalsVisual() {
  const step = useTick(4, 1600);
  const filled = step >= 1 ? 30 : 0;
  return (
    <div>
      <HundredGrid filled={filled} fillColor={BLUE} label={step >= 2 ? "0.30" : ""} />
      <p className="text-center text-xs text-muted -mt-1" style={fade(step >= 2)}>
        30 of 100 squares = <strong>0.30</strong> = 3 tenths
      </p>
    </div>
  );
}

// ── M8 Percents — grid fills to 25% ──────────────────────────────────────────
function PercentsVisual() {
  const step = useTick(4, 1600);
  const filled = step >= 1 ? 25 : 0;
  return (
    <div>
      <HundredGrid filled={filled} fillColor={GOLD} label={step >= 2 ? "25%" : ""} />
      <p className="text-center text-xs text-muted -mt-1" style={fade(step >= 2)}>
        25 out of 100 = <strong>25%</strong> = 1/4 = 0.25
      </p>
    </div>
  );
}

// ── M9 Ratios — 2:3 doubles to 4:6 ───────────────────────────────────────────
function RatiosVisual() {
  const step = useTick(5, 1300);
  const doubled = step >= 2;
  const Dot = ({ x, y, color, show }: { x: number; y: number; color: string; show: boolean }) => (
    <circle cx={x} cy={y} r={14} fill={color} style={fade(show, 450)} />
  );
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* base 2 gold : 3 blue */}
      {[0, 1].map((i) => <Dot key={`g${i}`} x={60 + i * 38} y={60} color={GOLD} show={true} />)}
      {[0, 1, 2].map((i) => <Dot key={`b${i}`} x={190 + i * 38} y={60} color={BLUE} show={true} />)}
      {/* doubled row */}
      {[0, 1].map((i) => <Dot key={`g2${i}`} x={60 + i * 38} y={112} color={GOLD} show={doubled} />)}
      {[0, 1, 2].map((i) => <Dot key={`b2${i}`} x={190 + i * 38} y={112} color={BLUE} show={doubled} />)}
      <text x={330} y={92} textAnchor="middle" fontSize={16} fontWeight={700} fill={GREEN} style={fade(doubled)}>×2</text>
      <text x={180} y={178} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK} fontFamily="Georgia, serif">
        {doubled ? "2 : 3  =  4 : 6" : "2 : 3"}
      </text>
    </svg>
  );
}

// ── M10 Balance scale — solve x + 3 = 7 ──────────────────────────────────────
function BalanceVisual() {
  const step = useTick(6, 1300); // 0-1 setup, 2 remove 3 both sides, 4 reveal x=4
  const removed = step >= 2;
  const Box = ({ x, y, label, color, show }: { x: number; y: number; label: string; color: string; show: boolean }) => (
    <g style={fade(show, 500)}>
      <rect x={x} y={y} width={26} height={26} rx={4} fill={color} />
      <text x={x + 13} y={y + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* stand + beam */}
      <rect x={176} y={60} width={8} height={110} fill={INK} rx={2} />
      <rect x={150} y={166} width={60} height={8} fill={INK} rx={2} />
      <rect x={60} y={56} width={240} height={6} fill={INK} rx={3} />
      {/* pans */}
      <path d="M 70 62 L 50 96 L 130 96 L 110 62" fill="none" stroke={MUTED} strokeWidth={2} />
      <path d="M 250 62 L 230 96 L 310 96 L 290 62" fill="none" stroke={MUTED} strokeWidth={2} />
      {/* left: x + 3 */}
      <Box x={58} y={100} label="x" color={GOLD} show={true} />
      <Box x={88} y={100} label="1" color={BLUE} show={!removed} />
      <Box x={58} y={130} label="1" color={BLUE} show={!removed} />
      <Box x={88} y={130} label="1" color={BLUE} show={!removed} />
      {/* right: 7 → 4 */}
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={i} x={238 + (i % 3) * 30} y={100 + Math.floor(i / 3) * 30}
          label="1" color={BLUE} show={i < 4 || !removed} />
      ))}
      <text x={180} y={34} textAnchor="middle" fontSize={20} fontWeight={700} fill={INK} fontFamily="Georgia, serif">
        {step >= 4 ? "x = 4" : removed ? "take 3 from BOTH sides…" : "x + 3 = 7"}
      </text>
    </svg>
  );
}

// ── M11 Linear graph — INTERACTIVE m & b sliders ─────────────────────────────
function LinearGraphVisual() {
  const [m, setM] = useState(1);
  const [b, setB] = useState(1);
  // viewport: x,y ∈ [-5,5] → svg 240×240 (origin 120,120; 24px per unit)
  const X = (x: number) => 120 + x * 24;
  const Y = (y: number) => 120 - y * 24;
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const eq = `y = ${fmt(m)}x ${b >= 0 ? "+ " + fmt(b) : "− " + fmt(Math.abs(b))}`;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 360 250" className="w-full">
        <g transform="translate(60,0)">
          {/* grid */}
          {Array.from({ length: 11 }, (_, i) => {
            const t = (i - 5) * 24;
            return (
              <g key={i}>
                <line x1={120 + t} y1={0} x2={120 + t} y2={240} stroke={GREY} strokeWidth={i === 5 ? 0 : 1} />
                <line x1={0} y1={120 + t} x2={240} y2={120 + t} stroke={GREY} strokeWidth={i === 5 ? 0 : 1} />
              </g>
            );
          })}
          {/* axes */}
          <line x1={0} y1={120} x2={240} y2={120} stroke={INK} strokeWidth={2} />
          <line x1={120} y1={0} x2={120} y2={240} stroke={INK} strokeWidth={2} />
          {/* the line: drawn well past the viewport, clipped by SVG */}
          <line x1={X(-6)} y1={Y(m * -6 + b)} x2={X(6)} y2={Y(m * 6 + b)}
            stroke={GOLD} strokeWidth={4} strokeLinecap="round"
            style={{ transition: "all 250ms ease" }} />
          {/* y-intercept dot */}
          <circle cx={X(0)} cy={Y(b)} r={6} fill={BLUE} style={{ transition: "all 250ms ease" }} />
        </g>
        <text x={180} y={14} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{eq}</text>
      </svg>
      <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] mt-1">
        <label className="text-xs text-muted">
          <span className="font-semibold text-ink">m (slope): {fmt(m)}</span>
          <input type="range" min={-3} max={3} step={0.5} value={m}
            onChange={(e) => setM(parseFloat(e.target.value))}
            className="w-full accent-[#C8902A]" aria-label="Slope m" />
        </label>
        <label className="text-xs text-muted">
          <span className="font-semibold text-ink">b (intercept): {fmt(b)}</span>
          <input type="range" min={-4} max={4} step={1} value={b}
            onChange={(e) => setB(parseFloat(e.target.value))}
            className="w-full accent-[#1B4F8A]" aria-label="Intercept b" />
        </label>
      </div>
    </div>
  );
}

// ── M12 Polynomials — like tiles combine ─────────────────────────────────────
function PolynomialsVisual() {
  const step = useTick(5, 1200);
  const merged = step >= 2;
  const Tile = ({ x, y, dx }: { x: number; y: number; dx: number }) => (
    <g style={move(merged ? dx : 0, merged ? 0 : 0, 800)}>
      <rect x={x} y={y} width={20} height={56} rx={4} fill={GOLD} stroke={INK} strokeWidth={1.5} />
      <text x={x + 10} y={y + 33} textAnchor="middle" fontSize={13} fontWeight={700} fill={INK}>x</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* 2x group */}
      <Tile x={52} y={45} dx={64} />
      <Tile x={80} y={45} dx={64} />
      {/* 3x group */}
      <Tile x={216} y={45} dx={-44} />
      <Tile x={244} y={45} dx={-44} />
      <Tile x={272} y={45} dx={-44} />
      <text x={172} y={78} textAnchor="middle" fontSize={20} fontWeight={700} fill={MUTED} style={fade(!merged)}>+</text>
      <text x={120} y={30} textAnchor="middle" fontSize={13} fill={MUTED} style={fade(!merged)}>2x</text>
      <text x={244} y={30} textAnchor="middle" fontSize={13} fill={MUTED} style={fade(!merged)}>3x</text>
      <text x={180} y={178} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK} fontFamily="Georgia, serif" style={fade(step >= 3)}>
        2x + 3x = 5x
      </text>
    </svg>
  );
}

// ── Subject lesson illustrations (Reading / Writing / Science) ──────────────────
// Calm, static illustrations shown behind the narrated lesson for non-math skills
// (which don't have bespoke animations). They give the lesson card a clear,
// on-topic visual without implying interactivity.
function LessonFrame({ children, tint }: { children: React.ReactNode; tint: string }) {
  return (
    <svg viewBox="0 0 360 150" width="100%" style={{ display: "block" }} role="img">
      <rect x={0} y={0} width={360} height={150} rx={12} fill={tint} />
      {children}
    </svg>
  );
}

function ReadingLessonVisual() {
  return (
    <LessonFrame tint="rgba(27,79,138,0.06)">
      {/* open book */}
      <path d="M180 38 C150 26 110 26 86 36 L86 112 C110 102 150 102 180 114 Z" fill="#fff" stroke="#1B4F8A" strokeWidth={2.5} />
      <path d="M180 38 C210 26 250 26 274 36 L274 112 C250 102 210 102 180 114 Z" fill="#fff" stroke="#1B4F8A" strokeWidth={2.5} />
      <line x1={180} y1={38} x2={180} y2={114} stroke="#1B4F8A" strokeWidth={2.5} />
      {[52, 64, 76, 88].map((y) => <line key={`l${y}`} x1={100} y1={y} x2={166} y2={y - 4} stroke="#9DB4CE" strokeWidth={3} strokeLinecap="round" />)}
      {[52, 64, 76, 88].map((y) => <line key={`r${y}`} x1={194} y1={y - 4} x2={260} y2={y} stroke="#9DB4CE" strokeWidth={3} strokeLinecap="round" />)}
    </LessonFrame>
  );
}

function WritingLessonVisual() {
  return (
    <LessonFrame tint="rgba(45,106,63,0.06)">
      {/* lined paper */}
      <rect x={92} y={28} width={130} height={96} rx={6} fill="#fff" stroke="#2D6A3F" strokeWidth={2.5} />
      {[48, 64, 80, 96, 112].map((y) => <line key={y} x1={104} y1={y} x2={210} y2={y} stroke="#BcD3C2" strokeWidth={2.5} strokeLinecap="round" />)}
      {/* pencil */}
      <g transform="rotate(38 250 78)">
        <rect x={232} y={44} width={20} height={70} fill="#C8902A" stroke="#1A1612" strokeWidth={2} />
        <polygon points="232,114 252,114 242,132" fill="#F5E6C8" stroke="#1A1612" strokeWidth={2} />
        <polygon points="237,126 247,126 242,132" fill="#1A1612" />
        <rect x={232} y={44} width={20} height={10} fill="#C23B22" stroke="#1A1612" strokeWidth={2} />
      </g>
    </LessonFrame>
  );
}

function ScienceLessonVisual() {
  return (
    <LessonFrame tint="rgba(194,59,34,0.06)">
      {/* flask */}
      <path d="M168 34 L168 64 L140 110 A8 8 0 0 0 147 122 L213 122 A8 8 0 0 0 220 110 L192 64 L192 34 Z" fill="#fff" stroke="#C23B22" strokeWidth={2.5} />
      <path d="M152 96 L208 96 A8 8 0 0 1 213 122 L147 122 A8 8 0 0 1 152 96 Z" fill="rgba(45,106,63,0.35)" stroke="#C23B22" strokeWidth={2} />
      <line x1={162} y1={34} x2={198} y2={34} stroke="#C23B22" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={170} cy={108} r={3} fill="#fff" /><circle cx={188} cy={112} r={2.5} fill="#fff" /><circle cx={196} cy={104} r={2} fill="#fff" />
      {/* sparkle */}
      <text x={232} y={60} fontSize={22}>✨</text>
    </LessonFrame>
  );
}

function AdvancedMathLessonVisual() {
  // Coordinate plane with a parabola — a calm, on-topic backdrop for the
  // advanced-math lessons (quadratics → calculus) that don't have bespoke
  // animations yet.
  return (
    <LessonFrame tint="rgba(27,79,138,0.06)">
      <line x1={40} y1={75} x2={320} y2={75} stroke="#9DB4CE" strokeWidth={2} />
      <line x1={180} y1={18} x2={180} y2={132} stroke="#9DB4CE" strokeWidth={2} />
      <path d="M96 28 Q180 150 264 28" fill="none" stroke="#1B4F8A" strokeWidth={3} strokeLinecap="round" />
      <circle cx={180} cy={118} r={4} fill="#C8902A" />
      <text x={300} y={70} fontSize={13} fill="#7A6E5F" fontFamily="Georgia, serif">x</text>
      <text x={186} y={28} fontSize={13} fill="#7A6E5F" fontFamily="Georgia, serif">y</text>
    </LessonFrame>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function TutorialVisual({ visual }: { visual: string }) {
  switch (visual) {
    case "readingLesson":  return <ReadingLessonVisual />;
    case "writingLesson":  return <WritingLessonVisual />;
    case "scienceLesson":  return <ScienceLessonVisual />;
    case "mathAdvanced":   return <AdvancedMathLessonVisual />;
    case "counting":       return <CountingVisual />;
    case "placeValue":     return <PlaceValueVisual />;
    case "addition":       return <AdditionVisual />;
    case "subtraction":    return <SubtractionVisual />;
    case "multiplication": return <MultiplicationVisual />;
    case "division":       return <DivisionVisual />;
    case "fractionBasics": return <FractionBasicsVisual />;
    case "fractionOps":    return <FractionOpsVisual />;
    case "decimals":       return <DecimalsVisual />;
    case "percents":       return <PercentsVisual />;
    case "ratios":         return <RatiosVisual />;
    case "balance":        return <BalanceVisual />;
    case "linearGraph":    return <LinearGraphVisual />;
    case "polynomials":    return <PolynomialsVisual />;
    default:               return null;
  }
}
