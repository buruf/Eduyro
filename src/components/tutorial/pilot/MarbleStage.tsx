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

interface MarbleStageProps {
  phase: Phase;
  onWave?: (n: 1 | 2 | 3) => void;
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

// Six 1x10 vertical rods used for the "rods" (and "symbol") phase.
const ROD_X = [80, 180, 280, 380, 480, 580];
const ROD_Y_START = 40;
const ROD_Y_END = 320;
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
  const rod = Math.floor(flatIndex / 10);
  const posInRod = flatIndex % 10;
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
      <path
        d={`M -34,-8
            Q -36,42 0,46
            Q 36,42 34,-8
            Q 34,-32 0,-28
            Q -34,-32 -34,-8
            Z`}
        fill="#F5E8C8"
        stroke="#8A5E10"
        strokeWidth={2.5}
      />
      <path
        d={`M -14,-27 Q 0,-40 14,-27`}
        fill="none"
        stroke="#8A5E10"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </g>
  );
}

export default function MarbleStage({ phase, onWave }: MarbleStageProps) {
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
  const pouch1Tilt = bag1Spilled ? -75 : 0;
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

      {marbles.map((flatIndex) => {
        const row = Math.floor(flatIndex / 30);
        const { x, y, opacity } = getMarblePos(phase, flatIndex);
        const delay = getMarbleDelay(phase, flatIndex);
        return (
          <circle
            key={flatIndex}
            cx={x}
            cy={y}
            r={MARBLE_R}
            fill={row === 0 ? GOLD : BLUE}
            opacity={opacity}
            style={{
              transition: `cx .7s ease ${delay}ms, cy .7s ease ${delay}ms, opacity .5s ease ${delay}ms`,
            }}
            onTransitionEnd={(e) => handleTransitionEnd(flatIndex, e)}
          />
        );
      })}
    </svg>
  );
}
