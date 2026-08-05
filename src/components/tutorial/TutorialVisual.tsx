// src/components/tutorial/TutorialVisual.tsx
// Animated concept visuals for the pre-practice tutorials.
// Pure SVG + CSS transitions driven by a simple step ticker — no animation libs.
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

// When the learner pauses the lesson, the narration AND the animation should
// freeze together. The modal feeds its paused state in via this context; every
// animated visual reads it through useTick.
const TutorialPaused = createContext(false);

const INK = "#1A1612";
const GOLD = "#C8902A";
const GOLD_SOFT = "#E8C87A";
const BLUE = "#1B4F8A";
const GREEN = "#2D6A3F";
const GREY = "#E8E0D0";
const MUTED = "#7A6E5F";

/** Cycles 0..steps-1 forever — but holds its current step while paused. */
function useTick(steps: number, ms: number): number {
  const paused = useContext(TutorialPaused);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) setStep((s) => (s + 1) % steps); // freeze on pause
    }, ms);
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
// ── Fact-strategy visuals (M3–M6) — the animation DEMONSTRATES the strategy the
// lesson is teaching, using numbers that match the lesson's example (a generic
// "3 + 2 = 5" taught nothing about near-doubles). Driven by the skill's
// strategy, resolved from its name by factStrategyForSkill(). ──
export type FactStrategy = "doubles" | "near-double" | "make-ten" | "count-on";

/** Map a fact skill name → the strategy its visual should demonstrate, or null
 *  (use the plain operation visual). */
export function factStrategyForSkill(skillName: string): FactStrategy | null {
  const s = (skillName || "").toLowerCase();
  if (/near.?double/.test(s)) return "near-double";
  if (/\bdouble/.test(s)) return "doubles";
  if (/make.?ten|bridg|friends of ten/.test(s)) return "make-ten";
  if (/count on|counting on/.test(s)) return "count-on";
  return null;
}

function Dot({ cx, cy, fill, r = 15, dashed = false, style }: { cx: number; cy: number; fill: string; r?: number; dashed?: boolean; style?: React.CSSProperties }) {
  return <circle cx={cx} cy={cy} r={r} fill={dashed ? "#fff" : fill} stroke={INK} strokeWidth={dashed ? 1.5 : 1} strokeDasharray={dashed ? "3 3" : undefined} style={style} />;
}

export function FactStrategyVisual({ strategy }: { strategy: FactStrategy }) {
  const step = useTick(5, 1200);
  const row = (n: number, y: number, fill: string, startX = 70, gap = 42) =>
    Array.from({ length: n }, (_, i) => ({ cx: startX + i * gap, cy: y, fill }));

  if (strategy === "doubles" || strategy === "near-double") {
    // Two equal rows of 6 (the double you know) → then, for near-double, ONE
    // more gold dot appears (the "nudge"). Matches the rule 6+6=12 → 6+7=13.
    const n = 6, nudge = strategy === "near-double";
    const showBottom = step >= 1;
    const showNudge = nudge && step >= 2;
    const top = row(n, 66, BLUE);
    const bottom = row(n, 116, BLUE);
    const label = !showBottom ? `${n}` : !showNudge ? `${n} + ${n} = ${2 * n}` : `${n} + ${n + 1} = ${2 * n + 1}`;
    return (
      <svg viewBox="0 0 360 200" className="w-full">
        {top.map((d, i) => <Dot key={`t${i}`} cx={d.cx} cy={d.cy} fill={BLUE} />)}
        {bottom.map((d, i) => <Dot key={`b${i}`} cx={d.cx} cy={d.cy} fill={BLUE} style={fade(showBottom)} />)}
        <Dot cx={70 + n * 42} cy={116} fill={GOLD} style={fade(showNudge)} />
        {showBottom && !showNudge && (
          <text x={180} y={150} textAnchor="middle" fontSize={13} fill={MUTED}>the double you know</text>
        )}
        {showNudge && <text x={70 + n * 42} y={150} textAnchor="middle" fontSize={12} fill={GOLD} fontWeight={700}>+1 more</text>}
        <text x={180} y={186} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{label}</text>
      </svg>
    );
  }

  if (strategy === "make-ten") {
    // 8 + 5: a ten-frame fills to 10 first (8 blue + 2 gold), then 3 more below.
    const hi = 8, lo = 5, toTen = 10 - hi, rest = lo - toTen;
    const showFill = step >= 1, showRest = step >= 2;
    const frame = Array.from({ length: 10 }, (_, i) => ({ col: i % 5, r: Math.floor(i / 5) }));
    return (
      <svg viewBox="0 0 360 200" className="w-full">
        {frame.map((c, i) => {
          const cx = 90 + c.col * 40, cy = 40 + c.r * 40;
          if (i < hi) return <Dot key={i} cx={cx} cy={cy} fill={BLUE} />;
          return <Dot key={i} cx={cx} cy={cy} fill={GOLD} dashed={!showFill} style={fade(true)} />;
        })}
        {/* the 3 left over, below the frame */}
        {Array.from({ length: rest }, (_, i) => (
          <Dot key={`r${i}`} cx={90 + i * 40} cy={132} fill={GOLD} style={fade(showRest)} />
        ))}
        <text x={180} y={168} textAnchor="middle" fontSize={13} fill={MUTED} style={fade(showFill)}>
          {showRest ? `10 + ${rest} = ${hi + lo}` : `${hi} + ${toTen} makes 10`}
        </text>
        <text x={180} y={190} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{`${hi} + ${lo} = ${hi + lo}`}</text>
      </svg>
    );
  }

  // count-on: 8, then count on 3 → 9, 10, 11.
  const hi = 8, lo = 3;
  const revealed = Math.min(lo, Math.max(0, step)); // reveal one add-on per step
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {/* the big number as a solid block */}
      <rect x={40} y={54} width={120} height={60} rx={10} fill={BLUE} opacity={0.15} stroke={BLUE} />
      <text x={100} y={92} textAnchor="middle" fontSize={30} fontWeight={800} fill={BLUE} fontFamily="Georgia, serif">{hi}</text>
      {/* count on the small addend, one dot at a time, labelled 9,10,11 */}
      {Array.from({ length: lo }, (_, i) => (
        <g key={i} style={fade(i < revealed)}>
          <Dot cx={200 + i * 44} cy={84} fill={GOLD} />
          <text x={200 + i * 44} y={132} textAnchor="middle" fontSize={15} fontWeight={700} fill={GOLD}>{hi + i + 1}</text>
        </g>
      ))}
      <text x={180} y={172} textAnchor="middle" fontSize={13} fill={MUTED}>start at {hi}, count on {lo}</text>
      <text x={180} y={192} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK} fontFamily="Georgia, serif">{`${hi} + ${lo} = ${hi + lo}`}</text>
    </svg>
  );
}

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
// ── Tangent-line visual (calculus) ───────────────────────────
// A point slides along y = x² while its tangent line pivots with it; the slope
// readout updates live (slope = 2x) — the derivative IS the slope you see.
function TangentVisual() {
  const paused = useContext(TutorialPaused);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setT((v) => v + 0.02), 40);
    return () => clearInterval(id);
  }, [paused]);
  // x sweeps −1.6 … 1.6 and back (sine ease)
  const x = 1.6 * Math.sin(t);
  const y = x * x;
  const m = 2 * x; // the derivative of x²
  // Map math coords → SVG: x ∈ [−2, 2] → [20, 380], y ∈ [−0.6, 3.4] → [230, 20]
  const sx = (mx: number) => 200 + mx * 90;
  const sy = (my: number) => 230 - (my + 0.6) * 52.5;
  const px = sx(x), py = sy(y);
  // Tangent segment: Δx = ±0.8 around the point
  const x1 = x - 0.8, x2 = x + 0.8;
  const parabola = Array.from({ length: 81 }, (_, i) => {
    const mx = -2 + (i * 4) / 80;
    return `${i === 0 ? "M" : "L"}${sx(mx).toFixed(1)},${sy(mx * mx).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 400 250" className="w-full" role="img" aria-label="A tangent line sliding along the parabola y equals x squared; its slope equals 2x">
      {/* axes */}
      <line x1="20" y1={sy(0)} x2="380" y2={sy(0)} stroke="#9aa3af" strokeWidth="1.5" />
      <line x1={sx(0)} y1="14" x2={sx(0)} y2="240" stroke="#9aa3af" strokeWidth="1.5" />
      <text x="372" y={sy(0) - 6} fontSize="13" fill="#6b7280" fontStyle="italic">x</text>
      <text x={sx(0) + 7} y="24" fontSize="13" fill="#6b7280" fontStyle="italic">y</text>
      {/* curve */}
      <path d={parabola} fill="none" stroke="#1B4F8A" strokeWidth="2.5" />
      {/* label sits below the axis on the right — clear of the sweeping point */}
      <text x={sx(1.1)} y={sy(-0.35)} fontSize="12" fill="#1B4F8A" fontWeight="600">y = x²</text>
      {/* tangent line */}
      <line x1={sx(x1)} y1={sy(y + m * (x1 - x))} x2={sx(x2)} y2={sy(y + m * (x2 - x))} stroke="#C8902A" strokeWidth="2.5" strokeLinecap="round" />
      {/* the point */}
      <circle cx={px} cy={py} r="6" fill="#C8902A" stroke="#fff" strokeWidth="2" />
      {/* live slope readout */}
      <g>
        <rect x="24" y="20" rx="6" width="150" height="40" fill="#fff" stroke="#e5e0d5" />
        <text x="34" y="36" fontSize="12" fill="#4b5563">slope of the tangent</text>
        <text x="34" y="53" fontSize="14" fontWeight="700" fill="#C8902A">
          m = 2x = {m.toFixed(1)}
        </text>
      </g>
      <text x="200" y="247" fontSize="11" fill="#6b7280" textAnchor="middle">The derivative is the slope at every point — watch it change as the point moves.</text>
    </svg>
  );
}

// ── Area-under-curve visual (integrals) — thin bars fill in under y = 2x, then
// fuse into the shaded region: an integral ADDS UP tiny pieces to make a total.
function AreaUnderCurveVisual() {
  const step = useTick(5, 1200); // 0 line, 1-2 bars appear, 3 fuse, 4 hold
  const bars = 8, x0 = 60, x1 = 300, y0 = 210;
  const w = (x1 - x0) / bars;
  const yAt = (px: number) => y0 - (px - x0) * 0.55; // y = 2x scaled
  const showBars = step >= 1, fused = step >= 3;
  return (
    <svg viewBox="0 0 360 250" className="w-full" role="img" aria-label="Bars filling the area under a line, then fusing into the shaded region — an integral adds up tiny pieces">
      <line x1="40" y1={y0} x2="330" y2={y0} stroke="#9aa3af" strokeWidth="1.5" />
      <line x1={x0} y1="20" x2={x0} y2={y0 + 6} stroke="#9aa3af" strokeWidth="1.5" />
      {/* the region, fused */}
      <path d={`M${x0},${y0} L${x1},${y0} L${x1},${yAt(x1)} Z`} fill={GOLD} opacity={fused ? 0.45 : 0} style={{ transition: "opacity 700ms ease" }} />
      {/* the bars */}
      {Array.from({ length: bars }, (_, i) => {
        const bx = x0 + i * w, h = y0 - yAt(bx + w);
        return (
          <rect key={i} x={bx + 1} y={y0 - h} width={w - 2} height={h} rx={2}
            fill={GOLD} stroke={INK} strokeWidth={0.75}
            style={{ opacity: !showBars ? 0 : fused ? 0 : i <= step * 4 ? 0.8 : 0, transition: "opacity 500ms ease" }} />
        );
      })}
      <line x1={x0} y1={y0} x2={x1} y2={yAt(x1)} stroke={BLUE} strokeWidth="2.5" />
      <text x={x1 + 6} y={yAt(x1) + 4} fontSize="12" fill={BLUE} fontWeight={600}>y = 2x</text>
      <text x={180} y={238} textAnchor="middle" fontSize="12" fill={MUTED}>
        {fused ? "∫ adds all the little pieces — the AREA under the line" : "slice the area into thin pieces…"}
      </text>
    </svg>
  );
}

// ── Domain visual (rational functions) — the curve y = 1/(x−4) with its
// excluded x drawn as a dashed wall: the domain is every x EXCEPT the one that
// makes the denominator zero. The excluded value pulses so the eye lands on it.
function DomainRangeVisual() {
  const step = useTick(4, 1300); // 0 curve, 1 wall appears, 2 open circle + label, 3 hold
  const x0 = 40, x1 = 340, y0 = 210, xa = 200; // xa = the excluded x (x = 4)
  const showWall = step >= 1, showLabel = step >= 2;
  // y = 1/(x-4) scaled: two branches around the asymptote
  const branch = (from: number, to: number) => {
    const pts: string[] = [];
    for (let px = from; px <= to; px += 4) {
      const xv = (px - xa) / 30; // math x−4
      const yv = 1 / xv;
      const py = 115 - yv * 26;
      if (py > 18 && py < y0 - 4) pts.push(`${pts.length ? "L" : "M"}${px},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <svg viewBox="0 0 360 250" className="w-full" role="img" aria-label="The graph of one over x minus four: a dashed wall at x equals 4 shows the excluded value — the domain is every other x">
      <line x1={x0 - 10} y1={115} x2={x1 + 10} y2={115} stroke="#9aa3af" strokeWidth="1.5" />
      <line x1={x0} y1="16" x2={x0} y2={y0} stroke="#9aa3af" strokeWidth="1.5" />
      <path d={branch(x0 + 8, xa - 10)} fill="none" stroke={BLUE} strokeWidth="2.5" />
      <path d={branch(xa + 10, x1)} fill="none" stroke={BLUE} strokeWidth="2.5" />
      <text x={x1 - 4} y={92} fontSize="12" fill={BLUE} fontWeight={600} textAnchor="end">f(x) = 1/(x − 4)</text>
      {/* the forbidden wall */}
      <line x1={xa} y1="16" x2={xa} y2={y0} stroke={GOLD} strokeWidth="2" strokeDasharray="6 5" style={fade(showWall)} />
      <circle cx={xa} cy={115} r="6" fill="#fff" stroke={GOLD} strokeWidth="2.5" style={fade(showLabel)} />
      <text x={xa} y={y0 + 18} textAnchor="middle" fontSize="13" fontWeight={700} fill={GOLD} style={fade(showWall)}>x = 4</text>
      <text x={xa} y={36} textAnchor="middle" fontSize="12" fontWeight={700} fill={GOLD} style={fade(showLabel)}>✗ not allowed</text>
      <text x={180} y={244} textAnchor="middle" fontSize="12" fill={MUTED}>
        {showLabel ? "Domain: every x EXCEPT 4 — dividing by zero is impossible" : "the denominator hits 0 somewhere…"}
      </text>
    </svg>
  );
}

// ── Right-triangle visual (Pythagorean theorem / right-triangle lessons) —
// the classic picture: squares grow on each side of a 3-4-5 triangle, then the
// areas add up: 9 + 16 = 25. The theorem, seen instead of stated.
function RightTriangleVisual() {
  const step = useTick(5, 1300); // 0 triangle, 1 leg squares, 2 hyp square, 3 sum, 4 hold
  // Right angle at A; legs 3 (vertical) and 4 (horizontal); unit = 22px.
  const u = 22;
  const A = { x: 150, y: 160 }, B = { x: 150 + 4 * u, y: 160 }, C = { x: 150, y: 160 - 3 * u };
  const legSq = step >= 1, hypSq = step >= 2, sum = step >= 3;
  // Hypotenuse square: BC has length 5u = 110, so the perpendicular (66, −88)
  // (BC rotated 90°, pointing away from the triangle) is already square-side long.
  const Q1 = { x: B.x + 66, y: B.y - 88 };
  const Q2 = { x: C.x + 66, y: C.y - 88 };
  return (
    <svg viewBox="0 0 400 260" className="w-full" role="img" aria-label="Squares drawn on the three sides of a right triangle: nine plus sixteen equals twenty-five">
      {/* leg squares */}
      <rect x={A.x} y={A.y} width={4 * u} height={4 * u} fill={BLUE} opacity={legSq ? 0.25 : 0} stroke={BLUE} style={{ transition: "opacity 600ms ease" }} />
      <rect x={A.x - 3 * u} y={C.y} width={3 * u} height={3 * u} fill={BLUE} opacity={legSq ? 0.25 : 0} stroke={BLUE} style={{ transition: "opacity 600ms ease" }} />
      {/* hypotenuse square */}
      <polygon points={`${B.x},${B.y} ${C.x},${C.y} ${Q2.x},${Q2.y} ${Q1.x},${Q1.y}`} fill={GOLD} opacity={hypSq ? 0.35 : 0} stroke={GOLD} style={{ transition: "opacity 600ms ease" }} />
      {/* the triangle on top */}
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#fff" stroke={INK} strokeWidth="2" />
      <rect x={A.x + 2} y={A.y - 12} width="10" height="10" fill="none" stroke={INK} strokeWidth="1.5" />
      {/* side labels */}
      <text x={A.x - 12} y={(A.y + C.y) / 2 + 4} fontSize="14" fontWeight={700} fill={INK}>a=3</text>
      <text x={(A.x + B.x) / 2 - 12} y={A.y + 16} fontSize="14" fontWeight={700} fill={INK}>b=4</text>
      <text x={(B.x + C.x) / 2 + 8} y={(B.y + C.y) / 2 - 6} fontSize="14" fontWeight={700} fill={GOLD}>c=5</text>
      {/* areas */}
      {legSq && <text x={A.x + 2 * u} y={A.y + 2 * u + 5} textAnchor="middle" fontSize="15" fontWeight={800} fill={BLUE}>16</text>}
      {legSq && <text x={A.x - 1.5 * u} y={C.y + 1.5 * u + 5} textAnchor="middle" fontSize="15" fontWeight={800} fill={BLUE}>9</text>}
      {hypSq && <text x={(B.x + Q2.x) / 2} y={(B.y + Q2.y) / 2} textAnchor="middle" fontSize="15" fontWeight={800} fill={GOLD}>25</text>}
      <text x={200} y={250} textAnchor="middle" fontSize="14" fontWeight={700} fill={sum ? INK : MUTED} style={{ transition: "fill 400ms" }}>
        {sum ? "9 + 16 = 25  →  a² + b² = c²" : "squares on every side…"}
      </text>
    </svg>
  );
}

// ── SOH-CAH-TOA visual (right-triangle RATIOS) — label the sides FROM the
// angle (Opposite / Adjacent / Hypotenuse), then the three ratios appear with
// real numbers. This is the ratios lesson's actual skill; the squares proof
// belongs to the Pythagorean THEOREM lesson.
function SohCahToaVisual() {
  // Phases: 0 label all three sides · 1-2 SIN · 3-4 COS · 5-6 TAN (repeat).
  const step = useTick(7, 1500);
  const u = 26;
  const A = { x: 95, y: 185 }, B = { x: 95 + 4 * u, y: 185 }, C = { x: 95, y: 185 - 3 * u };
  // θ lives at B — Opposite = vertical leg (AC), Adjacent = horizontal (AB).
  const active: "none" | "sin" | "cos" | "tan" = step <= 0 ? "none" : step <= 2 ? "sin" : step <= 4 ? "cos" : "tan";
  const oppOn = active === "sin" || active === "tan";
  const adjOn = active === "cos" || active === "tan";
  const hypOn = active === "sin" || active === "cos";
  const side = (on: boolean, color: string) => ({ stroke: on || active === "none" ? color : "#c9c2b4", strokeWidth: on ? 5 : 2.5, transition: "all 400ms" });
  // One ratio row: name, stacked fraction (colored by the two sides), value.
  const Row = ({ y, name, num, den, numC, denC, val, on }: { y: number; name: string; num: string; den: string; numC: string; denC: string; val: string; on: boolean }) => (
    <g opacity={on ? 1 : 0.3} style={{ transition: "opacity 400ms" }}>
      <text x={248} y={y + 5} fontSize={on ? 16 : 13} fontWeight={800} fill={INK}>{name} θ =</text>
      <text x={322} y={y - 6} fontSize={on ? 13 : 11} fontWeight={700} fill={numC} textAnchor="middle">{num}</text>
      <line x1={300} y1={y} x2={344} y2={y} stroke={INK} strokeWidth="1.5" />
      <text x={322} y={y + 15} fontSize={on ? 13 : 11} fontWeight={700} fill={denC} textAnchor="middle">{den}</text>
      <text x={352} y={y + 5} fontSize={on ? 15 : 12} fontWeight={800} fill={INK}>= {val}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 400 265" className="w-full" role="img" aria-label="A right triangle labelled Opposite, Adjacent, Hypotenuse; sine, cosine and tangent each shown as a fraction of two highlighted sides">
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} fill="#fff" stroke="none" />
      <rect x={A.x + 2} y={A.y - 12} width="10" height="10" fill="none" stroke={INK} strokeWidth="1.5" />
      <path d={`M ${B.x - 26} ${B.y} A 26 26 0 0 0 ${B.x - 26 * Math.cos(Math.atan2(3, 4))} ${B.y - 26 * Math.sin(Math.atan2(3, 4))}`} fill="none" stroke={INK} strokeWidth="2" />
      <text x={B.x - 42} y={B.y - 8} fontSize="15" fontWeight={800} fill={INK}>θ</text>
      {/* sides — ALWAYS labelled; the pair the active ratio uses lights up */}
      <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} {...{ style: side(oppOn, BLUE) }} />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} {...{ style: side(adjOn, GREEN) }} />
      <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} {...{ style: side(hypOn, GOLD) }} />
      <text x={A.x - 8} y={(A.y + C.y) / 2 - 12} fontSize="12" fontWeight={700} fill={BLUE} textAnchor="end">Opposite</text>
      <text x={A.x - 8} y={(A.y + C.y) / 2 + 2} fontSize="12" fontWeight={700} fill={BLUE} textAnchor="end">= 3</text>
      <text x={(A.x + B.x) / 2} y={A.y + 18} fontSize="12" fontWeight={700} fill={GREEN} textAnchor="middle">Adjacent = 4</text>
      <text x={(B.x + C.x) / 2 + 12} y={(B.y + C.y) / 2 - 10} fontSize="12" fontWeight={700} fill={GOLD}>Hypotenuse = 5</text>
      {/* the three ratios as stacked fractions — active one full-strength */}
      <Row y={62} name="sin" num="Opposite" den="Hypotenuse" numC={BLUE} denC={GOLD} val="3/5" on={active === "sin"} />
      <Row y={124} name="cos" num="Adjacent" den="Hypotenuse" numC={GREEN} denC={GOLD} val="4/5" on={active === "cos"} />
      <Row y={186} name="tan" num="Opposite" den="Adjacent" numC={BLUE} denC={GREEN} val="3/4" on={active === "tan"} />
      <text x={200} y={256} textAnchor="middle" fontSize="12" fontWeight={600} fill={MUTED}>
        {active === "none" ? "Name the sides FROM the angle θ" :
         active === "sin" ? "SOH — Sine = Opposite over Hypotenuse" :
         active === "cos" ? "CAH — Cosine = Adjacent over Hypotenuse" :
                            "TOA — Tangent = Opposite over Adjacent"}
      </text>
    </svg>
  );
}

// ── Simplify-fraction visual — 4/8 merges into 1/2 before the student's eyes:
// eight small cells (4 shaded) fuse pairwise into four bigger cells (2 shaded).
// The shaded AMOUNT never changes — only the size of the pieces. That's the
// whole idea of simplifying, shown rather than told.
function SimplifyFractionVisual() {
  const step = useTick(4, 1600); // 0 eighths · 1 hold · 2 fused quarters · 3 hold
  const fused = step >= 2;
  const W = 300, H = 64, x0 = 28;
  const cells = fused ? 4 : 8;
  const cw = (W - 2) / cells;
  const shaded = fused ? 2 : 4;
  return (
    <svg viewBox="0 0 400 150" className="w-full" role="img" aria-label="Four eighths merging into two quarters — the shaded amount stays the same">
      {Array.from({ length: cells }, (_, i) => (
        <rect key={`${cells}-${i}`} x={x0 + i * cw} y={28} width={cw} height={H} rx={4}
          fill={i < shaded ? GOLD : "#fff"} stroke={INK} strokeWidth={1.5}
          style={{ transition: "all 500ms ease" }} />
      ))}
      <text x={x0 + W + 14} y={64} fontSize="20" fontWeight={800} fill={INK} fontFamily="Georgia, serif">
        {fused ? "1/2" : "4/8"}
      </text>
      <text x={200} y={122} textAnchor="middle" fontSize="13" fontWeight={600} fill={MUTED}>
        {fused ? "…is the SAME amount as 1 of 2 big pieces — 4/8 = 1/2" : "4 of 8 small pieces shaded…"}
      </text>
      <text x={200} y={142} textAnchor="middle" fontSize="11" fill={MUTED}>
        Simplifying never changes the amount — only the size of the pieces.
      </text>
    </svg>
  );
}

// ── Fact-family visual — the classic number triangle: the product (or sum) on
// top, the two partners below, and the FOUR related facts appearing one by one.
// mode "mult": 4·8·32 (÷ undoes ×, missing factor = divide); mode "add": 6·7·13.
function FactFamilyVisual({ mode }: { mode: "add" | "mult" }) {
  const step = useTick(6, 1300); // 0 triangle · 1-4 facts · 5 hold
  const [a, b, c] = mode === "mult" ? [4, 8, 32] : [6, 7, 13];
  const facts = mode === "mult"
    ? [`${a} × ${b} = ${c}`, `${b} × ${a} = ${c}`, `${c} ÷ ${a} = ${b}`, `${c} ÷ ${b} = ${a}`]
    : [`${a} + ${b} = ${c}`, `${b} + ${a} = ${c}`, `${c} − ${a} = ${b}`, `${c} − ${b} = ${a}`];
  return (
    <svg viewBox="0 0 400 210" className="w-full" role="img" aria-label={`Fact family triangle for ${a}, ${b} and ${c} with its four related facts`}>
      <polygon points="110,30 40,150 180,150" fill="#fff" stroke={INK} strokeWidth="2" />
      <text x={110} y={62} textAnchor="middle" fontSize="24" fontWeight={800} fill={GOLD} fontFamily="Georgia, serif">{c}</text>
      <text x={78} y={138} textAnchor="middle" fontSize="22" fontWeight={800} fill={BLUE} fontFamily="Georgia, serif">{a}</text>
      <text x={144} y={138} textAnchor="middle" fontSize="22" fontWeight={800} fill={GREEN} fontFamily="Georgia, serif">{b}</text>
      {facts.map((f, i) => (
        <text key={f} x={230} y={55 + i * 34} fontSize="17" fontWeight={700} fill={i < 2 ? INK : MUTED} fontFamily="Georgia, serif" style={fade(step >= i + 1)}>
          {f}
        </text>
      ))}
      <text x={200} y={196} textAnchor="middle" fontSize="12" fontWeight={600} fill={MUTED}>
        {step >= 4 ? (mode === "mult" ? "Know one fact → know all four. Missing factor? Just divide." : "Know one fact → know all four.") : `Three numbers, one family: ${a}, ${b}, ${c}`}
      </text>
    </svg>
  );
}

// ── Skill → visual resolver ──────────────────────────────────────────────────
// The lesson modal teaches a MICRO-skill, but concepts map one visual per LEVEL
// — so "Composition of functions" was getting the generic level animation
// (user-reported mismatch, M14). This resolver picks a visual that actually
// demonstrates the unit's topic, and returns null when nothing genuinely fits:
// the modal then HIDES the visual (no animation beats a wrong one).
export type SkillVisual =
  | { kind: "explorer"; which: "parabola" | "unitCircle" }
  | { kind: "factStrategy"; strategy: FactStrategy }
  | { kind: "visual"; name: string }
  | null;

export function visualForSkill(skillName: string): SkillVisual {
  const s = (skillName || "").toLowerCase();
  const fact = factStrategyForSkill(skillName);
  if (fact) return { kind: "factStrategy", strategy: fact };
  // Fact families FIRST — "missing FACTOR" was leaking into the polynomials
  // /factor/ route (user-reported: ×/÷ lesson showed the 2x+3x=5x animation).
  if (/fact famil.*(missing factor|missing dividend|missing divisor|×|÷)|missing factor|missing dividend|missing divisor/.test(s)) return { kind: "visual", name: "factFamilyMult" };
  if (/fact famil|number bond/.test(s)) return { kind: "visual", name: "factFamilyAdd" };
  // Topics with NO honest visual yet — bail out FIRST so substrings don't leak
  // into wrong families ("multiplicity"→multiplication, "complex"→addition,
  // "limits of polynomials"→polynomials — all real audit catches).
  if (/limit|multiplicity|powers of i|complex number|sequence|series|vector|matri|end behavior|turning point|fundamental theorem|composition|inverse function|logarithm|exponential|transformation/.test(s)) return null;
  // Domain of a function → the excluded-value graph
  if (/domain/.test(s)) return { kind: "visual", name: "domainRange" };
  // Calculus
  if (/derivat|differenti|power rule|d\/dx|slope as a derivative|tangent/.test(s)) return { kind: "visual", name: "tangent" };
  if (/∫|integral|integrat|area under/.test(s)) return { kind: "visual", name: "areaUnderCurve" };
  // Pythagorean identity lives on the unit circle; the THEOREM and
  // right-triangle lessons get the squares-on-the-sides picture.
  if (/pythagorean identity/.test(s)) return { kind: "explorer", which: "unitCircle" };
  // Ratios lessons label sides from the angle (SOH-CAH-TOA); the THEOREM
  // lesson gets the squares proof.
  if (/right.triangle|sohcahtoa/.test(s)) return { kind: "visual", name: "sohcahtoa" };
  if (/pythagor|hypotenuse/.test(s)) return { kind: "visual", name: "rightTriangle" };
  // Trig
  if (/trig|sine|cosine|sohcahtoa|unit.circle|radian/.test(s)) return { kind: "explorer", which: "unitCircle" };
  // Polynomials & factoring BEFORE quadratics ("Factor quadratic trinomials"
  // is a factoring lesson, not a parabola lesson).
  if (/polynomial|monomial|binomial|foil|factor|trinomial|like terms|degree|leading coefficient|constant term|standard form|synthetic|zero.?product|box method|partial products|difference of squares|difference of cubes|sum & difference/.test(s)) return { kind: "visual", name: "polynomials" };
  // Quadratics / parabolas
  if (/quadratic|parabol|vertex|axis of symmetry|discriminant|complet.*square|x² =|x²=/.test(s)) return { kind: "explorer", which: "parabola" };
  // Lines & plotting
  if (/slope|intercept|mx \+ b|y = mx|plot|graph.*line|linear (equation|function)|coordinate/.test(s)) return { kind: "visual", name: "linearGraph" };
  // Equations / inequalities → the balance idea
  if (/equation|solve for|inequal|balance|unknown/.test(s)) return { kind: "visual", name: "balance" };
  // Fractions / decimals / percents / ratios
  // Simplifying gets its own animation (pieces fuse, amount stays) — the
  // identify-pie slider was the wrong topic for it (user report).
  if (/simplify.*fraction|reduce.*fraction|lowest terms/.test(s)) return { kind: "visual", name: "simplifyFraction" };
  if (/fraction|numerator|denominator|mixed number|part of a whole/.test(s))
    return { kind: "visual", name: /add|subtract|multiply|divide|×|÷/.test(s) ? "fractionOps" : "fractionBasics" };
  if (/decimal/.test(s)) return { kind: "visual", name: "decimals" };
  if (/percent/.test(s)) return { kind: "visual", name: "percents" };
  if (/\bratios?\b|proportion|scale up/.test(s)) return { kind: "visual", name: "ratios" };
  // Early math
  if (/count/.test(s)) return { kind: "visual", name: "counting" };
  if (/place value|round|expanded|tens|hundreds|compare.*number|greater|less/.test(s)) return { kind: "visual", name: "placeValue" };
  if (/divide|division|÷|quotient|remainder/.test(s)) return { kind: "visual", name: "division" };
  if (/multipl|times|×|product|array/.test(s)) return { kind: "visual", name: "multiplication" };
  if (/subtract|minus|difference|take away/.test(s)) return { kind: "visual", name: "subtraction" };
  if (/add|plus|sum/.test(s)) return { kind: "visual", name: "addition" };
  // Functions, matrices, logs, limits, complex numbers, transformations… no
  // honest animation exists yet — show nothing rather than something wrong.
  return null;
}

export function TutorialVisual({ visual, paused = false, strategy }: { visual: string; paused?: boolean; strategy?: FactStrategy }) {
  return (
    <TutorialPaused.Provider value={paused}>
      {visual === "factStrategy" && strategy ? <FactStrategyVisual strategy={strategy} /> : renderVisual(visual)}
    </TutorialPaused.Provider>
  );
}

function renderVisual(visual: string) {
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
    case "tangent":        return <TangentVisual />;
    case "areaUnderCurve": return <AreaUnderCurveVisual />;
    case "domainRange":    return <DomainRangeVisual />;
    case "simplifyFraction": return <SimplifyFractionVisual />;
    case "factFamilyMult":  return <FactFamilyVisual mode="mult" />;
    case "factFamilyAdd":   return <FactFamilyVisual mode="add" />;
    case "rightTriangle":  return <RightTriangleVisual />;
    case "sohcahtoa":      return <SohCahToaVisual />;
    default:               return null;
  }
}
