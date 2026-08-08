"use client";

import { useEffect, useRef } from "react";

export type Phase =
  | "empty"
  | "bag1"
  | "grid20"
  | "bags3"
  | "wave1"
  | "wave2"
  | "wave3"
  | "rods"
  | "symbol";

/** Which row the counting beat is pointing at; the other row dims back. */
export type Highlight = "none" | "gold" | "blue" | "both";

interface MarbleStageProps {
  phase: Phase;
  onWave?: (n: 1 | 2 | 3) => void;
  highlight?: Highlight;
}

// ---- stage geometry ----------------------------------------------------
const STAGE_W = 640;
const STAGE_H = 360;

const GOLD = "#C8902A";
const BLUE = "#1B4F8A";

const MARBLE_R = 9;

// Pouch (bag) centers. The two closed bags live in a bottom band well clear
// of the 20-marble grid (grid bbox ≈ x 131-509, y 141-219) so "three bags"
// never reads as "two bags overlapping some marbles".
const BAG1 = { x: 150, y: 190 };
const BAG2 = { x: 430, y: 295 };
const BAG3 = { x: 560, y: 295 };
// Where bag 1 rests once it has spilled: tipped on its side beside the grid,
// mouth facing the marbles — the visual anchor that the grid IS bag 1.
const BAG1_TIPPED = { x: 62, y: 180 };

// Compact 2x10 grid used for the "grid20" guess phase.
const GRID_START_X = 140;
const GRID_COL_SPACING = 40;
const GRID_ROW_Y = [150, 210] as const;

// Wide 2x30 array used from "wave1" onward (60 marbles, 30 columns).
const ARR_START_X = 31;
const ARR_COL_SPACING = 20;
const ARR_ROW_Y = [150, 210] as const;

// Six 1x10 vertical rods for the "rods" (and "symbol") phase, laid out as
// THREE PAIRS — one pair per bag, each pair being that bag's 10 gold + 10 blue
// = 20. Evenly spaced rods read as 6 × 10, which contradicts the 20 × 3 on
// screen; paired, the same picture shows both readings at once (3 twenties,
// and six tens), which is exactly the bridge this unit teaches.
// Pair centres at 130 / 320 / 510, rods ±28 within a pair: the gap BETWEEN
// bags (134) has to be clearly bigger than the gap inside one (56), or the six
// rods just read as an even row again.
const ROD_X = [102, 158, 292, 348, 482, 538];
const ROD_LABEL_Y = 340;
const ROD_Y_START = 30;
// Stops short of the stage floor to leave clear room for the running totals.
const ROD_Y_END = 296;
const ROD_SPACING = (ROD_Y_END - ROD_Y_START) / 9;

type Pos = { x: number; y: number; opacity: number };

/** Deterministic small jitter so clustered marbles don't perfectly overlap. */
function clusterPos(bag: { x: number; y: number }, i: number): Pos {
  const dx = ((i * 37) % 40) - 20;
  const dy = ((i * 53) % 40) - 20;
  return { x: bag.x + dx, y: bag.y + dy, opacity: 0 };
}

function gridPos(col: number, row: number): Pos {
  return {
    x: GRID_START_X + col * GRID_COL_SPACING,
    y: GRID_ROW_Y[row],
    opacity: 1,
  };
}

function arrayPos(col: number, row: number): Pos {
  return {
    x: ARR_START_X + col * ARR_COL_SPACING,
    y: ARR_ROW_Y[row],
    opacity: 1,
  };
}

function rodPos(flatIndex: number): Pos {
  // Rods are ordered bag-by-bag (bag 1's gold rod, bag 1's blue rod, bag 2's…)
  // so each adjacent pair is one bag's twenty.
  const col = flatIndex % 30;
  const row = Math.floor(flatIndex / 30);
  const rod = bagGroupForCol(col) * 2 - 2 + row; // groups are 1..3 → rods 0..5
  const posInRod = col % 10;
  return {
    x: ROD_X[rod],
    y: ROD_Y_START + posInRod * ROD_SPACING,
    opacity: 1,
  };
}

/**
 * 60 marbles are indexed 0..59 as flatIndex = row * 30 + col, row in {0,1},
 * col in {0..29}. col determines which "bag" (0-9 -> bag1, 10-19 -> bag2,
 * 20-29 -> bag3) the marble originates from, so it can sit at its source
 * pouch until its wave arrives.
 */
function bagGroupForCol(col: number): 1 | 2 | 3 {
  if (col < 10) return 1;
  if (col < 20) return 2;
  return 3;
}

function bagCenter(group: 1 | 2 | 3) {
  return group === 1 ? BAG1 : group === 2 ? BAG2 : BAG3;
}

/**
 * Per-marble transition delay for the current phase, in ms. Marbles that are
 * ARRIVING somewhere this phase leave their source one after another (a pour /
 * stream), instead of the whole group teleporting in one motion. Marbles not
 * moving this phase get 0 so nothing else feels laggy.
 */
function getMarbleDelay(phase: Phase, flatIndex: number): number {
  const col = flatIndex % 30;
  const row = Math.floor(flatIndex / 30);
  const group = bagGroupForCol(col);
  const within = col % 10; // position within its bag's ten
  const pour = within * 70 + row * 35;

  if (phase === "grid20" && group === 1) return pour;
  if (phase === "wave1" && group === 1) return pour;
  if (phase === "wave2" && group === 2) return pour;
  if (phase === "wave3" && group === 3) return pour;
  return 0;
}

// Longest stagger (9*70 + 1*35 = 665ms) + the .7s slide itself.
const POUR_TOTAL_MS = 665 + 700;

function getMarblePos(phase: Phase, flatIndex: number): Pos {
  const col = flatIndex % 30;
  const row = Math.floor(flatIndex / 30);
  const group = bagGroupForCol(col);

  switch (phase) {
    case "empty":
      return clusterPos(BAG1, flatIndex);

    case "bag1":
      // Marbles stay hidden inside the closed bag; they become visible as
      // they pour out (staggered) on the grid20 transition.
      return clusterPos(BAG1, flatIndex);

    case "grid20":
      if (group === 1) return gridPos(col, row);
      return clusterPos(bagCenter(group), flatIndex);

    case "bags3":
      if (group === 1) return gridPos(col, row);
      return clusterPos(bagCenter(group), flatIndex);

    case "wave1":
      if (group === 1) return arrayPos(col, row);
      return clusterPos(bagCenter(group), flatIndex);

    case "wave2":
      if (group === 1 || group === 2) return arrayPos(col, row);
      return clusterPos(bagCenter(group), flatIndex);

    case "wave3":
      return arrayPos(col, row);

    case "rods":
      return rodPos(flatIndex);

    case "symbol":
      return { ...rodPos(flatIndex), opacity: 0.15 };

    default:
      return clusterPos(bagCenter(group), flatIndex);
  }
}

// The "last to arrive" marble for each wave — used to fire onWave(n) once
// its transition completes.
const WAVE_LAST_INDEX: Record<1 | 2 | 3, number> = { 1: 39, 2: 49, 3: 59 };

/**
 * Pouch drawn centered on (0,0) and positioned via CSS transform, so both its
 * position AND tilt can transition smoothly — that's what makes bag 1 visibly
 * TIP OVER and pour (rather than one bag fading out and a tilted twin fading
 * in, which reads as two different bags).
 */
function Pouch({
  x,
  y,
  opacity,
  tilt = 0,
}: {
  x: number;
  y: number;
  opacity: number;
  /** Degrees of tilt — animated for bag 1's tip-over. */
  tilt?: number;
}) {
  return (
    <g
      style={{
        transition: "opacity .7s ease, transform .7s ease",
        transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)`,
      }}
      opacity={opacity}
      aria-hidden="true"
    >
      {/* sack body — heavy at the bottom where the marbles sit, gathered in
          at the neck, with the seam and fabric folds that make cloth read as
          cloth rather than as a rounded blob */}
      <path
        d="M -18,-20
           Q -38,-6 -38,18
           Q -38,46 0,50
           Q 38,46 38,18
           Q 38,-6 18,-20 Z"
        fill="#E6D3A4"
        stroke="#8A5E10"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* shaded side, so the sack has volume */}
      <path
        d="M 12,-19 Q 34,-4 34,18 Q 34,42 4,48 Q 30,38 29,17 Q 28,-2 12,-19 Z"
        fill="#CDB176"
        opacity={0.85}
      />
      {/* fabric folds radiating from the cinch */}
      <path d="M -10,-16 Q -16,6 -12,30" fill="none" stroke="#C2A468" strokeWidth={2} strokeLinecap="round" />
      <path d="M 2,-16 Q 0,8 3,34" fill="none" stroke="#C2A468" strokeWidth={2} strokeLinecap="round" />
      {/* gathered neck above the drawstring */}
      <path
        d="M -18,-20 Q -20,-34 -15,-40 L 15,-40 Q 20,-34 18,-20 Z"
        fill="#EFE0BC"
        stroke="#8A5E10"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* pleats in the gathered neck */}
      <path d="M -8,-38 L -7,-21" fill="none" stroke="#C2A468" strokeWidth={1.6} />
      <path d="M 0,-39 L 0,-21" fill="none" stroke="#C2A468" strokeWidth={1.6} />
      <path d="M 8,-38 L 7,-21" fill="none" stroke="#C2A468" strokeWidth={1.6} />
      {/* open mouth of the sack */}
      <ellipse cx={0} cy={-40} rx={15} ry={5} fill="#7A5A24" stroke="#8A5E10" strokeWidth={2} />
      <ellipse cx={0} cy={-40.5} rx={11} ry={3} fill="#5C4318" />
      {/* drawstring cinching the neck, with two loose ends */}
      <path d="M -19,-22 Q 0,-16 19,-22" fill="none" stroke="#6B4A12" strokeWidth={3} strokeLinecap="round" />
      <path d="M 19,-22 q 7,3 5,10" fill="none" stroke="#6B4A12" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M -19,-22 q -7,3 -5,10" fill="none" stroke="#6B4A12" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export default function MarbleStage({ phase, onWave, highlight = "none" }: MarbleStageProps) {
  const firedForPhaseRef = useRef<Phase | null>(null);

  useEffect(() => {
    firedForPhaseRef.current = null;
  }, [phase]);

  // Fallback for onWave: `transitionend` on SVG geometry attributes (cx/cy)
  // is unreliable across browser engines and in background tabs, and a
  // marble that doesn't move on a given phase entry fires no transition at
  // all. So alongside the transitionend listener below, schedule a one-shot
  // timer slightly after the .7s CSS transition duration that fires the same
  // once-per-phase-entry-guarded onWave(n). This is ONLY animation-completion
  // bookkeeping (letting narration know the marbles have visually settled) —
  // it is NOT a beat-advance timer; the tutorial still waits for a child tap
  // to move past this beat.
  useEffect(() => {
    const waveForPhase: 1 | 2 | 3 | null =
      phase === "wave1" ? 1 : phase === "wave2" ? 2 : phase === "wave3" ? 3 : null;
    if (!onWave || waveForPhase === null) return;

    const timer = setTimeout(() => {
      if (firedForPhaseRef.current === phase) return;
      firedForPhaseRef.current = phase;
      onWave(waveForPhase);
    }, POUR_TOTAL_MS + 100);

    return () => clearTimeout(timer);
  }, [phase, onWave]);

  // Bag 1 is ONE element through its whole story: upright center-stage, then
  // it visibly tips over and slides beside the grid as its marbles pour out,
  // and its empty shell stays there (so "three bags" still counts three).
  const bag1Spilled = phase === "grid20" || phase === "bags3";
  const pouch1Opacity = phase === "bag1" || bag1Spilled ? 1 : 0;
  const pouch1X = bag1Spilled ? BAG1_TIPPED.x : BAG1.x;
  const pouch1Y = bag1Spilled ? BAG1_TIPPED.y : BAG1.y;
  // Positive = clockwise, which swings the sack's mouth to the RIGHT — toward
  // the marbles it is pouring out. (Tipping the other way pointed the opening
  // away from the spill, so the marbles appeared to come out of its base.)
  const pouch1Tilt = bag1Spilled ? 78 : 0;
  const pouch2Opacity = phase === "bags3" || phase === "wave1" ? 1 : 0;
  const pouch3Opacity =
    phase === "bags3" || phase === "wave1" || phase === "wave2" ? 1 : 0;

  const waveForPhase: 1 | 2 | 3 | null =
    phase === "wave1" ? 1 : phase === "wave2" ? 2 : phase === "wave3" ? 3 : null;

  function handleTransitionEnd(
    flatIndex: number,
    e: React.TransitionEvent<SVGCircleElement>,
  ) {
    if (!onWave || waveForPhase === null) return;
    if (flatIndex !== WAVE_LAST_INDEX[waveForPhase]) return;
    if (e.propertyName !== "cx" && e.propertyName !== "cy") return;
    if (firedForPhaseRef.current === phase) return;
    firedForPhaseRef.current = phase;
    onWave(waveForPhase);
  }

  const marbles = Array.from({ length: 60 }, (_, i) => i);

  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      width="100%"
      height="auto"
      style={{ display: "block", background: "#FDFAF4" }}
      role="img"
      aria-label="Marble stage animation"
    >
      <Pouch x={pouch1X} y={pouch1Y} opacity={pouch1Opacity} tilt={pouch1Tilt} />
      <Pouch x={BAG2.x} y={BAG2.y} opacity={pouch2Opacity} />
      <Pouch x={BAG3.x} y={BAG3.y} opacity={pouch3Opacity} />

      {/* Running total under each rod — the skip-count made visible, so the
          last label IS the answer sitting under the sixth ten. */}
      {ROD_X.map((x, i) => (
        <text
          key={x}
          x={x}
          y={ROD_LABEL_Y}
          textAnchor="middle"
          fontWeight={700}
          // Every second label closes a bag's pair, so 20 / 40 / 60 are the
          // bag totals — emphasised, they make "20, three times" readable in
          // the same picture as "six tens".
          fill={i % 2 === 1 ? "#1B4F8A" : "#A99977"}
          fontSize={i % 2 === 1 ? 28 : 22}
          opacity={phase === "rods" ? 1 : 0}
          // `visibility` (not just opacity) so the labels are absent from the
          // accessibility tree on every other phase, instead of being read out
          // as a stray "10 20 30 40 50 60" during the hook.
          style={{
            transition: "opacity .4s ease",
            transitionDelay: `${i * 120}ms`,
            visibility: phase === "rods" ? "visible" : "hidden",
          }}
        >
          {(i + 1) * 10}
        </text>
      ))}

      {marbles.map((flatIndex) => {
        const row = Math.floor(flatIndex / 30);
        const { x, y, opacity } = getMarblePos(phase, flatIndex);
        const delay = getMarbleDelay(phase, flatIndex);
        // Counting beat: the row being counted swells slightly and the other
        // one recedes, so "ten yellow" has something to point at.
        const rowName = row === 0 ? "gold" : "blue";
        const lit = highlight === "none" || highlight === "both" || highlight === rowName;
        return (
          <circle
            key={flatIndex}
            cx={x}
            cy={y}
            r={lit && highlight === rowName ? MARBLE_R * 1.25 : MARBLE_R}
            fill={row === 0 ? GOLD : BLUE}
            opacity={opacity * (lit ? 1 : 0.22)}
            style={{
              transition: `cx .7s ease ${delay}ms, cy .7s ease ${delay}ms, opacity .5s ease ${delay}ms, r .35s ease`,
            }}
            onTransitionEnd={(e) => handleTransitionEnd(flatIndex, e)}
          />
        );
      })}
    </svg>
  );
}
