// src/remotion/lesson/GraphVideo.tsx
// The COORDINATE GRAPH template — the workhorse of M11 through M18.
//
// One set of axes and one plotted curve, with a mode-specific MOVE performed
// on it. The moves are the lessons:
//
//   line/slope  points plotted then joined; the rise-over-run triangle stepped
//               along the line, so "slope" is something you count, not a rule
//   system      two lines drawn on the same axes; the crossing is the answer
//   parabola    a curve, and where it meets zero
//   roots       the same crossings, named as the equation's solutions —
//               "= 0" MEANS "where does it touch the x axis"
//   exponential a curve that barely moves, then bolts
//   log         the exponential mirrored in y = x, which is what inverse IS
//   limit       a genuine hole in the curve, approached from both sides
//   derivative  a secant whose second point slides in until the line becomes
//               a tangent — the limit, performed
//   integral    rectangles that get thinner until the gaps vanish
//
// Curves are evaluated from declared coefficients (units.ts), never parsed
// from strings, so a lesson cannot plot something its narration didn't say.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { graphSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import {
  graphUnitById,
  evalCurve,
  quadraticRoots,
  lineIntersection,
  type GraphUnit,
  type Curve,
} from "./units";
import { curveText } from "./script-graph";

export { FPS } from "./timeline";

export type GraphProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";
const GREEN = "#2F7D4F";
const RED = "#B23B2E";
const AXIS = "#9C8E72";
const GRID = "#E3DAC6";

const STAGE_W = 1180;
const STAGE_H = 660;
const PAD = 56;

interface SceneProps {
  dur: number;
  unit: GraphUnit;
  /** Scene-local frame at which the narrator says a number (timeline.ts
   *  `saidFor`). Every reveal that shows a value she says — a point, a table
   *  row, the rise and run, the intercept, a root — is timed with this, never
   *  with a fraction of the scene. A coordinate pair is bound to its SECOND
   *  number so the point lands once both have been said; a negative is
   *  aligned as its absolute value. */
  said: SaidFn;
}

/** How many times `n` was already said among `earlier` — the occurrence index
 *  to hand `said` when a line repeats a value ("7 minus 3 is 4… 3 minus 1 is 2"). */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Walks a line's numbers in the order the script says them, so a scene that
 *  reveals values in narration order (a table, "x gives y" lists, the slope
 *  formula) never counts occurrences by hand: `next(n, fallback)` is the k-th
 *  time n is said, k = how many earlier next()/skip() calls named n. `skip`
 *  registers a number that is said but reveals nothing (an x before its y).
 *  Negatives and decimals: alignment carries "-3" as 3 and "1.5" as 1 then 5. */
function spokenOrder(said: SaidFn) {
  const earlier: number[] = [];
  const next = (n: number, fallback: number) => {
    const a = Math.abs(n);
    const at = said(a, fallback, before(a, earlier));
    earlier.push(a);
    return at;
  };
  const skip = (n: number) => {
    earlier.push(Math.abs(n));
  };
  return { next, skip };
}

function useEnter(atFrame: number, durFrames = 14) {
  const frame = useCurrentFrame();
  return {
    opacity: interpolate(frame, [atFrame, atFrame + durFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translateY: interpolate(frame, [atFrame, atFrame + durFrames], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
  };
}

/** Maths coords → stage pixels. */
function makeScale(u: GraphUnit) {
  const w = STAGE_W - PAD * 2;
  const h = STAGE_H - PAD * 2;
  const sx = (x: number) => PAD + ((x - u.xMin) / (u.xMax - u.xMin)) * w;
  const sy = (y: number) => PAD + h - ((y - u.yMin) / (u.yMax - u.yMin)) * h;
  return { sx, sy };
}

function Axes({ unit }: { unit: GraphUnit }) {
  const { sx, sy } = makeScale(unit);
  const xTicks: number[] = [];
  for (let x = Math.ceil(unit.xMin); x <= Math.floor(unit.xMax); x++) xTicks.push(x);
  const yStep = unit.yMax - unit.yMin > 12 ? 2 : 1;
  const yTicks: number[] = [];
  for (let y = Math.ceil(unit.yMin); y <= Math.floor(unit.yMax); y += yStep) yTicks.push(y);
  return (
    <>
      {xTicks.map((x) => (
        <div
          key={`gx${x}`}
          style={{
            position: "absolute",
            left: sx(x),
            top: PAD,
            width: 1,
            height: STAGE_H - PAD * 2,
            backgroundColor: GRID,
          }}
        />
      ))}
      {yTicks.map((y) => (
        <div
          key={`gy${y}`}
          style={{
            position: "absolute",
            left: PAD,
            top: sy(y),
            width: STAGE_W - PAD * 2,
            height: 1,
            backgroundColor: GRID,
          }}
        />
      ))}
      {/* axes */}
      <div style={{ position: "absolute", left: PAD, top: sy(0) - 2, width: STAGE_W - PAD * 2, height: 4, backgroundColor: AXIS }} />
      <div style={{ position: "absolute", left: sx(0) - 2, top: PAD, width: 4, height: STAGE_H - PAD * 2, backgroundColor: AXIS }} />
      {xTicks.filter((x) => x !== 0).map((x) => (
        <div
          key={`lx${x}`}
          style={{
            position: "absolute",
            left: sx(x) - 30,
            top: sy(0) + 8,
            width: 60,
            textAlign: "center",
            fontSize: 26,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          {x}
        </div>
      ))}
      {yTicks.filter((y) => y !== 0).map((y) => (
        <div
          key={`ly${y}`}
          style={{
            position: "absolute",
            left: sx(0) - 62,
            top: sy(y) - 16,
            width: 52,
            textAlign: "right",
            fontSize: 26,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          {y}
        </div>
      ))}
    </>
  );
}

/**
 * A plotted curve, drawn as a series of short segments so any curve shape
 * works. `progress` (0-1) draws it left-to-right, which is what makes a graph
 * feel traced rather than stamped. Segments spanning an undefined point are
 * skipped, which is how the hole in the limit curve stays a hole.
 */
function Plot({
  unit,
  curve,
  colour = BLUE,
  progress = 1,
  width = 5,
  samples = 160,
}: {
  unit: GraphUnit;
  curve: Curve;
  colour?: string;
  progress?: number;
  width?: number;
  samples?: number;
}) {
  const { sx, sy } = makeScale(unit);
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const upTo = unit.xMin + (unit.xMax - unit.xMin) * progress;
  for (let i = 0; i < samples; i++) {
    const xa = unit.xMin + ((unit.xMax - unit.xMin) * i) / samples;
    const xb = unit.xMin + ((unit.xMax - unit.xMin) * (i + 1)) / samples;
    if (xa > upTo) break;
    // A segment that STRADDLES a hole must be dropped, not just one that lands
    // exactly on it. Sampling almost never hits the undefined x precisely, so
    // without this the limit lesson drew a continuous line through the very
    // hole the narration is about.
    if (curve.kind === "hole") {
      const h = curve.h ?? 2;
      if (xa <= h && xb >= h) continue;
    }
    const ya = evalCurve(curve, xa);
    const yb = evalCurve(curve, xb);
    if (ya === null || yb === null) continue;
    if (ya < unit.yMin - 2 || ya > unit.yMax + 2 || yb < unit.yMin - 2 || yb > unit.yMax + 2) continue;
    segs.push({ x1: sx(xa), y1: sy(ya), x2: sx(xb), y2: sy(yb) });
  }
  return (
    <>
      {segs.map((s, i) => {
        const dx = s.x2 - s.x1;
        const dy = s.y2 - s.y1;
        const len = Math.hypot(dx, dy);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: s.x1,
              top: s.y1 - width / 2,
              width: len + 1,
              height: width,
              backgroundColor: colour,
              borderRadius: width / 2,
              transformOrigin: "0 50%",
              rotate: `${ang}deg`,
            }}
          />
        );
      })}
    </>
  );
}

function Dot({
  unit,
  x,
  y,
  colour = GOLD,
  size = 22,
  hollow = false,
  opacity = 1,
  label,
}: {
  unit: GraphUnit;
  x: number;
  y: number;
  colour?: string;
  size?: number;
  hollow?: boolean;
  opacity?: number;
  label?: string;
}) {
  const { sx, sy } = makeScale(unit);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: sx(x) - size / 2,
          top: sy(y) - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: hollow ? CREAM : colour,
          border: hollow ? `4px solid ${colour}` : "none",
          opacity,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            left: sx(x) + size,
            top: sy(y) - size,
            fontSize: 30,
            fontWeight: 800,
            color: colour,
            opacity,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

/** A straight segment between two maths points (secants, tangents, triangles). */
function Seg({
  unit,
  x1,
  y1,
  x2,
  y2,
  colour = GREEN,
  width = 4,
  dashed = false,
  opacity = 1,
}: {
  unit: GraphUnit;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colour?: string;
  width?: number;
  dashed?: boolean;
  opacity?: number;
}) {
  const { sx, sy } = makeScale(unit);
  const ax = sx(x1);
  const ay = sy(y1);
  const bx = sx(x2);
  const by = sy(y2);
  const len = Math.hypot(bx - ax, by - ay);
  const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  return (
    <div
      style={{
        position: "absolute",
        left: ax,
        top: ay - width / 2,
        width: len,
        height: width,
        backgroundColor: dashed ? "transparent" : colour,
        backgroundImage: dashed
          ? `repeating-linear-gradient(90deg, ${colour} 0 12px, transparent 12px 22px)`
          : undefined,
        borderRadius: width / 2,
        transformOrigin: "0 50%",
        rotate: `${ang}deg`,
        opacity,
      }}
    />
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 76,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
      }}
    >
      {text}
    </div>
  );
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  // The equation card is the first thing she says ("y = x² − 4. Here's the
  // twist…"), and speech starts at frame 0 — so the card lands with the first
  // syllable, not on its last digit. The question below names no number.
  const a = useEnter(6); // not-speech-bound: opens with the line
  const b = useEnter(40); // not-speech-bound
  const sub: Record<GraphUnit["mode"], string> = {
    line: "What does that look like?",
    slope: "What do the numbers do?",
    system: "Can one pair satisfy both?",
    parabola: "What does squaring do?",
    roots: "Where does it equal zero?",
    exponential: "What shape is doubling?",
    log: "The exponent question, backwards.",
    limit: "Undefined — but not unanswerable.",
    derivative: "How steep, at one exact point?",
    integral: "How much area underneath?",
    range: "Which heights does it reach?",
    endbehavior: "What happens at the edges?",
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 130,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {curveText(unit.curve)}
      </div>
      <div style={{ fontSize: 54, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {sub[unit.mode]}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: axes and the curve appearing -------------------------------
function ScenePlot({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  // Line/parabola modes plot the sample POINTS first, then join them — the
  // graph should look derived from the equation, not conjured.
  const showPoints = unit.mode === "line" || unit.mode === "parabola" || unit.mode === "exponential";
  const ptXs =
    unit.mode === "parabola" ? [-2, -1, 0, 1, 2] : unit.mode === "exponential" ? [0, 1, 2, 3] : [0, 1, 2];
  const ptAt = Math.round(dur * 0.12); // not-speech-bound: fallback only
  // Each point lands as she says its VALUE, the second number of the pair:
  //   parabola     "Minus 2 gives 0. Minus 1 gives -3. Zero gives -4. Now cross
  //                to the plus side… 1 gives -3 — the same as minus 1 did. And
  //                2 gives 0 — the same as minus 2." ("Zero" is a word, so the
  //                x of the vertex is not aligned; the aside repeats 1.)
  //   exponential  "At 0 it's 1. At 1, 2. At 2, 4. At 3, 8. At 4… 16."
  const order = spokenOrder(said);
  const pointAt = ptXs.map((x, i) => {
    const y = evalCurve(unit.curve, x) ?? 0;
    if (unit.mode !== "parabola" || x !== 0) order.skip(x);
    const at = order.next(y, ptAt + i * 12);
    if (unit.mode === "parabola" && x === 1) order.skip(1);
    return at;
  });
  const lastPointAt = pointAt[pointAt.length - 1];
  // The curve: after the last point for the point-first modes; on the last
  // digit of the equation where the line opens by reading it ("Graph the left
  // side: y = x² − 5x + 6", "Here's y equals 2 to the x", "y = x² minus 4, all
  // over x minus 2"); otherwise the line says no number the curve could follow
  // ("Watch the lowest point…", "Walk right…", "Pick two points…").
  const eqNums = curveText(unit.curve).match(/\d+/g)?.map(Number) ?? [];
  const eqLast = eqNums[eqNums.length - 1];
  const eqOpensLine = unit.mode === "roots" || unit.mode === "log" || unit.mode === "limit";
  const drawFallback = Math.round(dur * 0.3); // not-speech-bound: fallback only
  const drawAt = showPoints
    ? lastPointAt + 10
    : eqOpensLine && eqLast !== undefined
      ? said(eqLast, drawFallback, before(eqLast, eqNums.slice(0, -1)))
      : drawFallback;
  const progress = interpolate(frame, [drawAt, drawAt + 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={showPoints ? "Work out some points" : curveText(unit.curve)} enter={title} />
      <Stage>
        <Axes unit={unit} />
        {showPoints &&
          ptXs.map((x, i) => {
            const y = evalCurve(unit.curve, x);
            if (y === null) return null;
            return (
              <Dot
                key={x}
                unit={unit}
                x={x}
                y={y}
                opacity={interpolate(frame, [pointAt[i], pointAt[i] + 10], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}
                label={`(${x}, ${y})`}
              />
            );
          })}
        <Plot unit={unit} curve={unit.curve} progress={progress} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the move ----------------------------------------------------
function SceneAction({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const { sx, sy } = makeScale(unit);

  const titles: Record<GraphUnit["mode"], string> = {
    line: "Join them up",
    slope: "Count the climb",
    system: "Where do they cross?",
    parabola: "A curve, and it's symmetric",
    roots: "Zero means: on the x axis",
    exponential: "Barely moves… then bolts",
    log: "Mirror it in y = x",
    limit: "Walk in from both sides",
    derivative: "Slide the second point in",
    integral: "Chop it into strips",
    range: "Sweep up from the bottom",
    endbehavior: "Both ends climb",
  };

  const common = (
    <>
      <Axes unit={unit} />
      <Plot unit={unit} curve={unit.curve} />
    </>
  );

  // The slope, system and line branches below are UNREACHABLE: those modes run
  // their bespoke scenes (graphLineIds names no "action" for them). Kept as the
  // generic fallback shape; nothing to bind to speech.
  if (unit.mode === "slope") {
    const m = unit.curve.m ?? 1;
    const c = unit.curve.c ?? 0;
    const stepAt = Math.round(dur * 0.28); // not-speech-bound: unreachable (slope runs slope:* scenes)
    const steps = Math.max(0, Math.min(3, Math.floor((frame - stepAt) / 34) + 1));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          <Dot unit={unit} x={0} y={c} colour={RED} label={`starts at ${c}`} />
          {Array.from({ length: steps }, (_, i) => (
            <div key={i}>
              {/* run then rise: the triangle, stepped along the line */}
              <Seg unit={unit} x1={i} y1={m * i + c} x2={i + 1} y2={m * i + c} colour={GOLD} />
              <Seg unit={unit} x1={i + 1} y1={m * i + c} x2={i + 1} y2={m * (i + 1) + c} colour={GREEN} />
              <div
                style={{
                  position: "absolute",
                  left: sx(i + 1) + 12,
                  top: (sy(m * i + c) + sy(m * (i + 1) + c)) / 2 - 20,
                  fontSize: 32,
                  fontWeight: 800,
                  color: GREEN,
                }}
              >
                +{m}
              </div>
            </div>
          ))}
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "system") {
    const p = lineIntersection(unit.curve, unit.curve2 ?? unit.curve);
    const drawAt = Math.round(dur * 0.16); // not-speech-bound: unreachable (system runs system:* scenes)
    const prog2 = interpolate(frame, [drawAt, drawAt + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const markAt = Math.round(dur * 0.62); // not-speech-bound: unreachable (system runs system:* scenes)
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          <Plot unit={unit} curve={unit.curve2 ?? unit.curve} colour={GOLD} progress={prog2} />
          {p && frame >= markAt && (
            <Dot
              unit={unit}
              x={p.x}
              y={p.y}
              colour={GREEN}
              size={30}
              label={`(${p.x}, ${p.y})`}
              opacity={interpolate(frame, [markAt, markAt + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          )}
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "roots" || unit.mode === "parabola") {
    const roots = quadraticRoots(unit.curve);
    const markAt = Math.round(dur * 0.42); // not-speech-bound: fallback only
    // Each crossing lands on its own number — roots: "There… and there. At 2,
    // and at 3."; parabola: "minus 2 and plus 2 square to the SAME number"
    // (the second "2" is the second root — a negative aligns as its absolute
    // value, so the occurrence tells them apart).
    const order = spokenOrder(said);
    const rootAt = roots.map((r, i) => order.next(r, markAt + i * 26));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          {roots.map((r, i) => (
            <Dot
              key={r}
              unit={unit}
              x={r}
              y={0}
              colour={GREEN}
              size={30}
              label={`x = ${r}`}
              opacity={interpolate(frame, [rootAt[i], rootAt[i] + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          ))}
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "range" || unit.mode === "endbehavior") {
    const cq = unit.curve.c ?? 0;
    // range: "Now sweep upward. From -4, the two arms climb… Every height from
    // -4 on up gets touched. Everything below -4… never." — the vertex dot and
    // the band start on the first "-4", the "never below" tag on the last.
    // endbehavior: "Minus 100, squared, is still ten thousand" — the arrows
    // show no number she says.
    const sweepFallback = Math.round(dur * 0.2); // not-speech-bound: fallback only
    const sweepAt = unit.mode === "range" ? said(Math.abs(cq), sweepFallback, 0) : sweepFallback;
    const vertexAt = said(Math.abs(cq), 0, 0);
    const neverAt = said(Math.abs(cq), 0, -1);
    const fadeIn = (at: number) =>
      interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    // range: a band rises from the vertex height; endbehavior: arrows on arms.
    const sweep = interpolate(frame, [sweepAt, sweepAt + 70], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const bandTopY = sy(cq) - (sy(cq) - sy(unit.yMax)) * sweep;
    const armX = 0.82 * (unit.xMax - unit.xMin) * 0.5;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {unit.mode === "range" && (
            <div
              style={{
                position: "absolute",
                left: PAD,
                top: bandTopY,
                width: STAGE_W - PAD * 2,
                height: Math.max(0, sy(cq) - bandTopY),
                backgroundColor: GREEN,
                opacity: 0.12,
              }}
            />
          )}
          {common}
          {unit.mode === "range" && (
            <>
              <div style={{ position: "absolute", left: PAD, top: sy(cq) - 2, width: STAGE_W - PAD * 2, height: 4, backgroundImage: `repeating-linear-gradient(90deg, ${RED} 0 14px, transparent 14px 26px)`, opacity: fadeIn(vertexAt) }} />
              <Dot unit={unit} x={0} y={cq} colour={RED} size={26} label={`lowest: ${cq}`} opacity={fadeIn(vertexAt)} />
              <div style={{ position: "absolute", left: PAD + 14, top: sy(cq) + 14, fontSize: 34, fontWeight: 800, color: RED, opacity: fadeIn(neverAt) }}>never below</div>
            </>
          )}
          {unit.mode === "endbehavior" &&
            [-armX, armX].map((x) => {
              const y = evalCurve(unit.curve, x) ?? 0;
              return (
                <div
                  key={x}
                  style={{ position: "absolute", left: sx(x) - 24, top: sy(y) - 66, fontSize: 54, fontWeight: 800, color: GREEN, opacity: sweep }}
                >
                  ↑
                </div>
              );
            })}
          {unit.mode === "endbehavior" && (
            <>
              <div style={{ position: "absolute", left: PAD + 6, top: PAD + 6, fontSize: 32, fontWeight: 800, color: GREEN, opacity: sweep }}>x → −∞, y → +∞</div>
              <div style={{ position: "absolute", right: PAD + 6, top: PAD + 6, fontSize: 32, fontWeight: 800, color: GREEN, opacity: sweep }}>x → +∞, y → +∞</div>
            </>
          )}
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "log") {
    const mirrorAt = Math.round(dur * 0.3); // not-speech-bound: "Swap x and y — mirror the whole curve" names no number
    const prog = interpolate(frame, [mirrorAt, mirrorAt + 44], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          {/* the mirror line */}
          <Seg
            unit={unit}
            x1={Math.max(unit.xMin, unit.yMin)}
            y1={Math.max(unit.xMin, unit.yMin)}
            x2={Math.min(unit.xMax, unit.yMax)}
            y2={Math.min(unit.xMax, unit.yMax)}
            colour={MUTED}
            dashed
            width={3}
          />
          <Plot unit={unit} curve={unit.curve2 ?? unit.curve} colour={GREEN} progress={prog} />
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "limit") {
    const h = unit.at ?? 2;
    const target = 2 * h;
    const walkAt = Math.round(dur * 0.24); // not-speech-bound: fallback only
    // "Walk in from the left. At 1 it's 3. At 1.5, 3.5. Closer… it's heading
    // for 4. Now come in from the right — also heading for 4." The left dot
    // sits at x = h−1 on "3", reaches x = h−0.5 on "3.5" (aligned as 3 then
    // 5 — the second 5) and is nearly at the hole on the first "4"; the right
    // dot walks in between the two "4"s. The tag lands on the first "4".
    // Keyframes are kept strictly increasing in case alignment is partial.
    const order = spokenOrder(said);
    order.skip(h - 1);
    const leftStart = order.next(target - 1, walkAt);
    order.skip(h - 1);
    order.skip(5);
    order.skip(target - 1);
    const leftMid = Math.max(leftStart + 1, order.next(5, walkAt + 58));
    const leftEnd = Math.max(leftMid + 1, order.next(target, walkAt + 90));
    const rightEnd = Math.max(leftEnd + 1, order.next(target, walkAt + 90));
    const rightStart = Math.max(leftEnd, rightEnd - 90);
    // Stop short of the hole: the dots must approach it, never cover it —
    // the gap is the thing being taught.
    const tLeft = interpolate(frame, [leftStart, leftMid, leftEnd], [1, 0.5, 0.22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const tRight = interpolate(frame, [rightStart, rightEnd], [1, 0.22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const leftX = h - tLeft;
    const rightX = h + tRight;
    const tagAt = said(target, 0, 0);
    const tagOpacity = interpolate(frame, [tagAt, tagAt + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          <Dot unit={unit} x={leftX} y={leftX + h} colour={GOLD} size={22} />
          <Dot unit={unit} x={rightX} y={rightX + h} colour={BLUE} size={22} />
          {/* the hole, drawn LAST so the approaching dots can't hide it */}
          <Dot unit={unit} x={h} y={target} colour={RED} size={30} hollow />
          <div
            style={{
              position: "absolute",
              left: sx(h) - 130,
              top: sy(target) - 78,
              width: 260,
              textAlign: "center",
              fontSize: 34,
              fontWeight: 800,
              color: RED,
              opacity: tagOpacity,
            }}
          >
            heading for {target}
          </div>
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "derivative") {
    const at = unit.at ?? 1;
    const a = unit.curve.a ?? 1;
    const f = (x: number) => a * x * x;
    const slideAt = Math.round(dur * 0.24); // not-speech-bound: "slide the second point closer" names no number
    const gap = interpolate(frame, [slideAt, slideAt + 96], [1.6, 0.05], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const x2 = at + gap;
    const secantSlope = (f(x2) - f(at)) / (x2 - at);
    // Extend the secant across the frame so it reads as a line, not a chord.
    const ext = 2.2;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          {common}
          <Seg
            unit={unit}
            x1={at - ext}
            y1={f(at) - secantSlope * ext}
            x2={at + ext}
            y2={f(at) + secantSlope * ext}
            colour={GREEN}
            width={5}
          />
          <Dot unit={unit} x={at} y={f(at)} colour={RED} size={26} />
          <Dot unit={unit} x={x2} y={f(x2)} colour={GOLD} size={24} />
          <div
            style={{
              position: "absolute",
              right: PAD + 20,
              top: PAD + 10,
              fontSize: 40,
              fontWeight: 800,
              color: GREEN,
            }}
          >
            slope {secantSlope.toFixed(2)}
          </div>
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "integral") {
    const from = unit.from ?? 0;
    const to = unit.to ?? 4;
    const m = unit.curve.m ?? 1;
    const stageAt = Math.round(dur * 0.2); // not-speech-bound: "Four fat ones… eight thinner ones" are words, not aligned digits
    const stage = frame < stageAt ? 0 : frame < stageAt + 60 ? 1 : frame < stageAt + 120 ? 2 : 3;
    const nRects = stage === 0 ? 0 : stage === 1 ? 4 : stage === 2 ? 8 : 32;
    const wMath = (to - from) / Math.max(nRects, 1);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Title text={titles[unit.mode]} enter={title} />
        <Stage>
          <Axes unit={unit} />
          {Array.from({ length: nRects }, (_, i) => {
            const x0 = from + i * wMath;
            const hMath = m * (x0 + wMath); // right-endpoint height
            const left = sx(x0);
            const right = sx(x0 + wMath);
            const top = sy(hMath);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: Math.max(right - left - 1, 1),
                  height: sy(0) - top,
                  backgroundColor: GOLD,
                  opacity: 0.55,
                  border: `1px solid ${INK}22`,
                }}
              />
            );
          })}
          <Plot unit={unit} curve={unit.curve} />
          {nRects > 0 && (
            <div
              style={{
                position: "absolute",
                right: PAD + 20,
                top: PAD + 10,
                fontSize: 40,
                fontWeight: 800,
                color: MUTED,
              }}
            >
              {nRects} strips
            </div>
          )}
        </Stage>
      </AbsoluteFill>
    );
  }

  // line / exponential: the curve, now complete.
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={titles[unit.mode]} enter={title} />
      <Stage>
        {common}
        {unit.mode === "line" &&
          [0, 1, 2].map((x) => {
            const y = evalCurve(unit.curve, x);
            return y === null ? null : <Dot key={x} unit={unit} x={x} y={y} />;
          })}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound

  const roots = unit.curve.kind === "quadratic" ? quadraticRoots(unit.curve) : [];
  const inter = unit.curve2 ? lineIntersection(unit.curve, unit.curve2) : null;
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const base = unit.curve.base ?? 2;
  const lim = 2 * (unit.at ?? 2);
  const dAt = unit.at ?? 1;
  const dSlope = 2 * (unit.curve.a ?? 1) * dAt;
  // The headline is split where its numbers are said, so each piece lands on
  // its word (fallback 0 = on screen from the start, as before):
  //   slope      "the 2 is m, the slope… The 1 is b, the y-intercept" (second
  //              mention of each — the equation is read first)
  //   parabola   "At -2, and at 2."     roots  "So x is 2, or x is 3."
  //   log        "So log base 2 of 8 is 3"     limit  "So the limit is 4" (last)
  //   derivative "And its slope is 2. That's the derivative at x = 1."
  //   integral   "you get 8"                   range  "greater than or equal to -4"
  //   line / exponential / endbehavior say no number; system never reaches
  //   this scene (it ends on system:check).
  type Part = { text: string; at: number };
  const order = spokenOrder(said);
  const parts: Record<GraphUnit["mode"], Part[]> = {
    line: [{ text: curveText(unit.curve), at: 0 }],
    slope: [
      { text: `m = ${m}`, at: said(Math.abs(m), 0, 1) },
      { text: ` · b = ${c}`, at: said(Math.abs(c), 0, -1) },
    ],
    system: [{ text: inter ? `x = ${inter.x},  y = ${inter.y}` : curveText(unit.curve), at: 0 }],
    parabola: roots.length
      ? [
          { text: `crosses at ${roots[0]}`, at: order.next(roots[0], 0) },
          { text: ` and ${roots[1]}`, at: order.next(roots[1], 0) },
        ]
      : [{ text: curveText(unit.curve), at: 0 }],
    roots: roots.length
      ? [
          { text: `x = ${roots[0]}`, at: order.next(roots[0], 0) },
          { text: `  or  x = ${roots[1]}`, at: order.next(roots[1], 0) },
        ]
      : [{ text: curveText(unit.curve), at: 0 }],
    exponential: [{ text: curveText(unit.curve), at: 0 }],
    log: [
      { text: `log base ${base} of ${base ** 3}`, at: said(base ** 3, 0, 0) },
      { text: ` = 3`, at: said(3, 0, 0) },
    ],
    limit: [{ text: `limit = ${lim}`, at: said(lim, 0, -1) }],
    derivative: [
      { text: `slope = ${dSlope}`, at: said(dSlope, 0, 0) },
      { text: `  at x = ${dAt}`, at: said(dAt, 0, -1) },
    ],
    integral: [{ text: `area = ${(m * ((unit.to ?? 4) ** 2 - (unit.from ?? 0) ** 2)) / 2}`, at: said((m * ((unit.to ?? 4) ** 2 - (unit.from ?? 0) ** 2)) / 2, 0, 0) }],
    range: [{ text: `y ≥ ${c}`, at: said(Math.abs(c), 0, 0) }],
    endbehavior: [{ text: "both ends → up", at: 0 }],
  };
  const headline = parts[unit.mode];
  const headlineDone = Math.max(...headline.map((p) => p.at));
  // The tip closes the line and names no number; it follows the headline.
  const tipAt = Math.max(Math.round(dur * 0.55), headlineDone + 12); // not-speech-bound

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title text="So" enter={title} />
      <div style={{ fontSize: 120, fontWeight: 800, color: GREEN, whiteSpace: "pre" }}>
        {headline.map((p, i) => (
          <span
            key={i}
            style={{
              opacity: interpolate(frame, [p.at, p.at + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {p.text}
          </span>
        ))}
      </div>
      <div
        style={{
          fontSize: 52,
          color: BLUE,
          fontWeight: 700,
          opacity: interpolate(frame, [tipAt, tipAt + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {unit.tip}
      </div>
    </AbsoluteFill>
  );
}

// ===========================================================================
// Bespoke linear-family scenes (expert-council redesign). The line video
// BUILDS y = mx + b in three moves (y = x, stretch by m, lift by c), then
// derives the plot from an x/y table. The slope video names m and b and
// computes m from two labelled points with the slope formula. The systems
// video draws each line from its own table, one after the other.
// ===========================================================================

/** An x/y table whose rows light up one at a time. */
function XYTable({
  rows,
  colour,
  litRows,
  header = true,
}: {
  rows: { x: number; y: number }[];
  colour: string;
  litRows: number; // how many rows are highlighted so far
  header?: boolean;
}) {
  const cell: React.CSSProperties = {
    width: 96,
    padding: "10px 0",
    textAlign: "center",
    fontSize: 40,
    fontWeight: 800,
  };
  return (
    <div style={{ border: `4px solid ${colour}`, borderRadius: 18, overflow: "hidden", backgroundColor: CREAM }}>
      {header && (
        <div style={{ display: "flex", backgroundColor: colour, color: CREAM }}>
          <div style={cell}>x</div>
          <div style={cell}>y</div>
        </div>
      )}
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            color: INK,
            backgroundColor: i < litRows ? `${colour}22` : "transparent",
            opacity: i < litRows ? 1 : 0.35,
            borderTop: `2px solid ${GRID}`,
          }}
        >
          <div style={cell}>{r.x}</div>
          <div style={cell}>{r.y}</div>
        </div>
      ))}
    </div>
  );
}

/** Big equation card used across the linear scenes. */
function EquationCard({
  text,
  colour = INK,
  size = 96,
  enter,
  dimmed = false,
}: {
  text: string;
  colour?: string;
  size?: number;
  enter?: { opacity: number; translateY: number };
  dimmed?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        color: colour,
        opacity: (enter?.opacity ?? 1) * (dimmed ? 0.3 : 1),
        translate: `0 ${enter?.translateY ?? 0}px`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

// ---- line: beat 1 — the simplest line, y = x ------------------------------
function SceneLineSimple({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  // "Zero gives zero. One gives one. Two gives two." — the points are said as
  // WORDS, which alignment does not carry; the only digits in this line are
  // the target equation's ("y = 2x + 1"), which nothing here shows.
  const drawAt = Math.round(dur * 0.42); // not-speech-bound: counted in words
  const prog = interpolate(frame, [drawAt, drawAt + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const identity: Curve = { kind: "linear", m: 1, c: 0 };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="Start with the simplest line" enter={title} />
      <EquationCard text="y = x" colour={BLUE} size={72} enter={useEnter(14)} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={identity} colour={BLUE} progress={prog} />
        {[0, 1, 2].map((x, i) => (
          <Dot
            key={x}
            unit={unit}
            x={x}
            y={x}
            colour={BLUE}
            label={`(${x}, ${x})`}
            opacity={interpolate(frame, [drawAt + 44 + i * 14, drawAt + 54 + i * 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- line: beat 2 — multiply by m: heights stretch ------------------------
function SceneLineStretch({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const m = unit.curve.m ?? 1;
  const identity: Curve = { kind: "linear", m: 1, c: 0 };
  const stretched: Curve = { kind: "linear", m, c: 0 };
  // "Now multiply the x by 2. That's y equals 2 x. Every height gets 2 times
  // bigger. One becomes 2… two becomes 4. Watch the line swing up…" — the
  // title on the first m, the card on the second; each point rides up to its
  // new height on that height (the LAST time it is said: "becomes 2" is the
  // last "2", "becomes 4" the only 4); the line swings up after the last point.
  const title = useEnter(said(Math.abs(m), 4, 0));
  const card = useEnter(said(Math.abs(m), 14, 1));
  const moveAt = Math.round(dur * 0.3); // not-speech-bound: fallback only
  const arriveAt = [1, 2].map((x, i) => said(Math.abs(m * x), moveAt + i * 22 + 8, -1) + 6);
  const lineAt = arriveAt[arriveAt.length - 1] + 14; // not-speech-bound: follows the last point
  const lineProg = interpolate(frame, [lineAt, lineAt + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={`Multiply x by ${m}`} enter={title} />
      <EquationCard text={`y = ${m}x`} colour={GREEN} size={72} enter={card} />
      <Stage>
        <Axes unit={unit} />
        {/* ghost of where we came from */}
        <Plot unit={unit} curve={identity} colour={GRID} width={4} />
        {[1, 2].map((x, i) => {
          // The ride starts a beat before the word and lands 6 frames after it,
          // so the label "(1, 2)" is up 0.2 s after "2".
          const t = interpolate(frame, [arriveAt[i] - 14, arriveAt[i]], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          const y = x + (m * x - x) * t; // rides from y=x up to y=mx
          return (
            <React.Fragment key={x}>
              <Seg unit={unit} x1={x} y1={x} x2={x} y2={y} colour={GREEN} dashed width={4} opacity={t > 0 ? 1 : 0} />
              <Dot unit={unit} x={x} y={y} colour={GREEN} label={t === 1 ? `(${x}, ${m * x})` : undefined} />
              {t > 0.15 && t < 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: makeScale(unit).sx(x) + 26,
                    top: makeScale(unit).sy(y) - 8,
                    fontSize: 34,
                    fontWeight: 800,
                    color: GREEN,
                  }}
                >
                  ×{m}
                </div>
              )}
            </React.Fragment>
          );
        })}
        <Plot unit={unit} curve={stretched} colour={GREEN} progress={lineProg} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- line: beat 3 — plus c lifts every point UP ---------------------------
function SceneLineLift({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const stretched: Curve = { kind: "linear", m, c: 0 };
  // "Last piece: plus 1. Careful — adding 1 doesn't push the line sideways.
  // It lifts every point UP, by 1. So 0, 2 and 4 become 1, 3 and 5. Same
  // steepness… higher start." — title and card on the first c; the caption
  // on the third c ("by 1"); each point lifts to its new height on that
  // height (the LAST time it is said — "become 1" is the fourth 1); the
  // lifted line follows the last point.
  const title = useEnter(said(Math.abs(c), 4, 0));
  const card = useEnter(said(Math.abs(c), 14, 0) + 6);
  const liftAt = Math.round(dur * 0.34); // not-speech-bound: fallback only
  const arriveAt = [0, 1, 2].map((x, i) => said(Math.abs(m * x + c), liftAt + i * 18 + 8, -1) + 6);
  const lineAt = arriveAt[arriveAt.length - 1] + 14; // not-speech-bound: follows the last point
  const lineProg = interpolate(frame, [lineAt, lineAt + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const capAt = said(Math.abs(c), Math.round(dur * 0.55), 2); // not-speech-bound: fallback only
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={`Add ${c} — the line lifts UP`} enter={title} />
      <EquationCard text={curveText(unit.curve)} colour={GOLD} size={72} enter={card} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={stretched} colour={GRID} width={4} />
        {[0, 1, 2].map((x, i) => {
          const t = interpolate(frame, [arriveAt[i] - 14, arriveAt[i]], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          const y = m * x + c * t;
          return (
            <React.Fragment key={x}>
              <Seg unit={unit} x1={x} y1={m * x} x2={x} y2={y} colour={GOLD} width={5} opacity={t > 0 ? 1 : 0} />
              <Dot unit={unit} x={x} y={y} colour={GOLD} label={t === 1 ? `(${x}, ${m * x + c})` : undefined} />
            </React.Fragment>
          );
        })}
        <Plot unit={unit} curve={unit.curve} colour={GOLD} progress={lineProg} />
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 30,
            fontSize: 40,
            fontWeight: 800,
            color: GOLD,
            opacity: interpolate(frame, [capAt, capAt + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          +{c} → up {c}
        </div>
      </Stage>
    </AbsoluteFill>
  );
}

// ---- line: beat 4 — the x/y table fires points onto the grid --------------
function SceneLineTable({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const rows = [0, 1, 2].map((x) => ({ x, y: m * x + c }));
  // "When x is 0, y is 1. When x is 1, y is 3. When x is 2, y is 5." — each
  // row (and its point) lights on its y, the second number of the pair; the
  // join follows the last row ("Each row of the table is one point").
  const rowFallback = Math.round(dur * 0.24); // not-speech-bound: fallback only
  const rowGap = Math.round(dur * 0.18); // not-speech-bound: fallback only
  const order = spokenOrder(said);
  const rowLitAt = rows.map((r, i) => {
    order.skip(r.x);
    return order.next(r.y, rowFallback + i * rowGap);
  });
  const litRows = rowLitAt.filter((t) => frame >= t).length;
  const joinAt = rowLitAt[rowLitAt.length - 1] + 30; // not-speech-bound: follows the last row
  const prog = interpolate(frame, [joinAt, joinAt + 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="Or build it from a table" enter={title} />
      <div style={{ display: "flex", alignItems: "center", gap: 46 }}>
        <XYTable rows={rows} colour={BLUE} litRows={litRows} />
        <Stage>
          <Axes unit={unit} />
          {rows.map((r, i) => (
            <Dot
              key={r.x}
              unit={unit}
              x={r.x}
              y={r.y}
              colour={BLUE}
              label={`(${r.x}, ${r.y})`}
              opacity={i < litRows ? 1 : 0}
            />
          ))}
          <Plot unit={unit} curve={unit.curve} colour={BLUE} progress={prog} />
        </Stage>
      </div>
    </AbsoluteFill>
  );
}

// ---- slope: beat 1 — name the parts of y = mx + b -------------------------
function SceneSlopeName({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  // "The m is called the slope. The b is called the y-intercept." — words,
  // no digits to follow. "In ours — y = 2x + 1 — the slope is 2, and the
  // y-intercept is 1." — the equation on its last digit, then m and b each
  // on their own (second) mention.
  const labelAt = Math.round(dur * 0.3); // not-speech-bound: names no number
  const oursFallback = Math.round(dur * 0.62); // not-speech-bound: fallback only
  const order = spokenOrder(said);
  const eqNums = curveText(unit.curve).match(/\d+/g)?.map(Number) ?? [];
  eqNums.slice(0, -1).forEach((n) => order.skip(n));
  const eqAt = eqNums.length ? order.next(eqNums[eqNums.length - 1], oursFallback) : oursFallback;
  const mAt = order.next(m, oursFallback);
  const bAt = order.next(c, oursFallback);
  const fade = (at: number) =>
    interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 42 }}>
      <Title text="This form has a name" enter={title} />
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        y = <span style={{ color: GREEN }}>m</span>x + <span style={{ color: GOLD }}>b</span>
      </div>
      <div style={{ display: "flex", gap: 90 }}>
        <div style={{ fontSize: 54, fontWeight: 700, color: GREEN, opacity: fade(labelAt) }}>m = the slope</div>
        <div style={{ fontSize: 54, fontWeight: 700, color: GOLD, opacity: fade(labelAt + 20) }}>
          b = the y-intercept
        </div>
      </div>
      <div style={{ fontSize: 66, fontWeight: 800, color: INK, opacity: fade(eqAt) }}>
        {curveText(unit.curve)} → <span style={{ color: GREEN, opacity: fade(mAt) }}>m = {m}</span>
        <span style={{ opacity: fade(bAt) }}>
          , <span style={{ color: GOLD }}>b = {c}</span>
        </span>
      </div>
    </AbsoluteFill>
  );
}

// ---- slope: beat 2 — find b where the line cuts the y axis ----------------
function SceneSlopeIntercept({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const c = unit.curve.c ?? 0;
  // "Look… right there, at a height of 1. That's your b." — the intercept
  // dot lands on the height.
  const markAt = said(Math.abs(c), Math.round(dur * 0.45), 0); // not-speech-bound: fallback only
  const pulse = 1 + 0.18 * Math.sin((frame - markAt) / 5);
  const on = frame >= markAt;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="b: where it cuts the y axis" enter={title} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={unit.curve} colour={BLUE} />
        {/* the y axis glows while we hunt along it */}
        <Seg unit={unit} x1={0} y1={unit.yMin} x2={0} y2={unit.yMax} colour={GOLD} width={3} dashed opacity={0.7} />
        <Dot
          unit={unit}
          x={0}
          y={c}
          colour={GOLD}
          size={on ? 26 * pulse : 0}
          label={`(0, ${c})   b = ${c}`}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- slope: beat 3 — two labelled points and the rise/run triangle --------
function SceneSlopePoints({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const x1 = 1, x2 = 3;
  const p1 = { x: x1, y: m * x1 + c };
  const p2 = { x: x2, y: m * x2 + c };
  // "Here's one at 1, 3… and another at 3, 7. The slope measures the climb
  // between them." — each point lands on the second number of its pair (the
  // x of the second point repeats the y of the first, so occurrences are
  // walked in order); the triangle follows the second point.
  const dotFallback = Math.round(dur * 0.28); // not-speech-bound: fallback only
  const order = spokenOrder(said);
  order.skip(p1.x);
  const dot1At = order.next(p1.y, dotFallback);
  order.skip(p2.x);
  const dot2At = order.next(p2.y, dotFallback + 24);
  const triAt = Math.max(Math.round(dur * 0.62), dot2At + 16); // not-speech-bound: follows the second point
  const fade = (at: number) =>
    interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { sx, sy } = makeScale(unit);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="Pick two points on the line" enter={title} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={unit.curve} colour={BLUE} />
        <Dot unit={unit} x={p1.x} y={p1.y} colour={GREEN} size={26} label={`(x₁, y₁) = (${p1.x}, ${p1.y})`} opacity={fade(dot1At)} />
        <Dot unit={unit} x={p2.x} y={p2.y} colour={GREEN} size={26} label={`(x₂, y₂) = (${p2.x}, ${p2.y})`} opacity={fade(dot2At)} />
        {/* run first, then rise — the triangle the formula will read from */}
        <Seg unit={unit} x1={p1.x} y1={p1.y} x2={p2.x} y2={p1.y} colour={GOLD} width={5} opacity={fade(triAt)} />
        <Seg unit={unit} x1={p2.x} y1={p1.y} x2={p2.x} y2={p2.y} colour={GOLD} width={5} dashed opacity={fade(triAt + 16)} />
        <div style={{ position: "absolute", left: (sx(p1.x) + sx(p2.x)) / 2 - 80, top: sy(p1.y) + 12, fontSize: 32, fontWeight: 800, color: GOLD, opacity: fade(triAt) }}>
          across {x2 - x1}
        </div>
        <div style={{ position: "absolute", left: sx(p2.x) + 14, top: (sy(p1.y) + sy(p2.y)) / 2 - 18, fontSize: 32, fontWeight: 800, color: GOLD, opacity: fade(triAt + 16) }}>
          up {p2.y - p1.y}
        </div>
      </Stage>
    </AbsoluteFill>
  );
}

// ---- slope: beat 4 — the slope formula, computed step by step -------------
function SceneSlopeFormula({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const x1 = 1, x2 = 3;
  const y1 = m * x1 + c, y2 = m * x2 + c;
  const rise = y2 - y1, run = x2 - x1;
  // Steps appear as spoken: formula → plug in → top → bottom → answer.
  // "m equals y two minus y one… over x two minus x one" is words (the
  // symbolic row has nothing aligned). Then every digit lands on its word:
  // "Top: 7 minus 3 is 4. Bottom: 3 minus 1 is 2. 4 over 2… the slope is 2.
  // Up 2 for every 1 across." — walked in narration order, since 3 and 2
  // each come round more than once.
  const stepAt = (k: number) => Math.round(dur * (0.16 + k * 0.16)); // not-speech-bound: fallback only
  const order = spokenOrder(said);
  const at = {
    y2: order.next(y2, stepAt(1)),
    y1: order.next(y1, stepAt(1)),
    rise: order.next(rise, stepAt(2)),
    x2: order.next(x2, stepAt(1)),
    x1: order.next(x1, stepAt(1)),
    run: order.next(run, stepAt(2)),
  };
  order.skip(rise);
  order.skip(run);
  const slopeAt = order.next(m, stepAt(3));
  const upAt = order.next(m, stepAt(3));
  const fadeAt = (f: number) =>
    interpolate(frame, [f, f + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const row: React.CSSProperties = { fontSize: 72, fontWeight: 800, color: INK, whiteSpace: "nowrap" };
  const frac = (top: React.ReactNode, bottom: React.ReactNode, colour: string) => (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 14px" }}>
      <span style={{ color: colour, padding: "0 10px" }}>{top}</span>
      <span style={{ height: 5, alignSelf: "stretch", backgroundColor: INK }} />
      <span style={{ color: colour, padding: "0 10px" }}>{bottom}</span>
    </span>
  );
  const piece = (text: string, f: number) => <span style={{ opacity: fadeAt(f) }}>{text}</span>;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
      <Title text="The slope formula" enter={title} />
      <div style={{ ...row, opacity: fadeAt(stepAt(0)) }}>m = {frac("y₂ − y₁", "x₂ − x₁", GREEN)}</div>
      <div style={{ ...row, opacity: fadeAt(at.y2) }}>
        m ={" "}
        {frac(
          <>
            {piece(`${y2}`, at.y2)}
            {piece(` − ${y1}`, at.y1)}
          </>,
          <>
            {piece(`${x2}`, at.x2)}
            {piece(` − ${x1}`, at.x1)}
          </>,
          GREEN,
        )}
      </div>
      <div style={{ ...row, opacity: fadeAt(at.rise) }}>m = {frac(piece(String(rise), at.rise), piece(String(run), at.run), GOLD)}</div>
      <div style={{ ...row, fontSize: 96, color: GREEN, opacity: fadeAt(slopeAt) }}>
        m = {m}
        {piece(` — up ${m} for every 1 across`, upAt)}
      </div>
    </AbsoluteFill>
  );
}

// ---- system: beat 1 — two equations, one puzzle ---------------------------
function SceneSysAsk({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  // "The first says y = 2x + 1. The second says y = −x + 7. Could ONE pair…"
  // — each card lands on the last digit of its equation (a coefficient of
  // ±1 is not spoken as a digit, so the digits come from the on-screen text).
  const order = spokenOrder(said);
  const cardAt = (cv: Curve, fallback: number) => {
    const nums = curveText(cv).match(/\d+/g)?.map(Number) ?? [];
    nums.slice(0, -1).forEach((n) => order.skip(n));
    return nums.length ? order.next(nums[nums.length - 1], fallback) : fallback;
  };
  const firstAt = cardAt(unit.curve, 16);
  const secondAt = cardAt(unit.curve2 ?? unit.curve, Math.round(dur * 0.4)); // not-speech-bound: fallback only
  const first = useEnter(firstAt);
  const second = useEnter(secondAt);
  const qAt = Math.max(Math.round(dur * 0.68), secondAt + 14); // not-speech-bound: "Could ONE pair" names no number
  const qOp = interpolate(frame, [qAt, qAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Title text="Two equations, one puzzle" enter={title} />
      <EquationCard text={curveText(unit.curve)} colour={BLUE} size={110} enter={first} />
      <EquationCard text={curveText(unit.curve2 ?? unit.curve)} colour={GOLD} size={110} enter={second} />
      <div style={{ fontSize: 72, fontWeight: 800, color: GREEN, opacity: qOp }}>
        one pair for BOTH?
      </div>
    </AbsoluteFill>
  );
}

/** Shared body for the two draw-a-line-from-its-table system beats. */
function SysLineScene({
  dur,
  unit,
  said,
  which,
  titleText,
}: SceneProps & { which: 1 | 2; titleText: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const c1 = unit.curve;
  const c2 = unit.curve2 ?? unit.curve;
  const target = which === 1 ? c1 : c2;
  const colour = which === 1 ? BLUE : GOLD;
  const rows = [0, 1, 2].map((x) => ({ x, y: (target.m ?? 1) * x + (target.c ?? 0) }));
  // "Quick table: when x is 0, y is 1. At 1, it's 3. At 2, it's 5. Plot them,
  // join them…" — each row and its point light on the y; the join follows
  // the last row.
  const rowFallback = Math.round(dur * 0.2); // not-speech-bound: fallback only
  const rowGap = Math.round(dur * 0.16); // not-speech-bound: fallback only
  const order = spokenOrder(said);
  const rowLitAt = rows.map((r, i) => {
    order.skip(r.x);
    return order.next(r.y, rowFallback + i * rowGap);
  });
  const litRows = rowLitAt.filter((t) => frame >= t).length;
  const joinAt = rowLitAt[rowLitAt.length - 1] + 30; // not-speech-bound: follows the last row
  const prog = interpolate(frame, [joinAt, joinAt + 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={titleText} enter={title} />
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          <EquationCard text={curveText(target)} colour={colour} size={52} />
          <XYTable rows={rows} colour={colour} litRows={litRows} />
        </div>
        <Stage>
          <Axes unit={unit} />
          {/* line one stays put while line two is drawn — never alone on screen */}
          {which === 2 && <Plot unit={unit} curve={c1} colour={BLUE} />}
          {rows.map((r, i) => (
            <Dot key={r.x} unit={unit} x={r.x} y={r.y} colour={colour} label={`(${r.x}, ${r.y})`} opacity={i < litRows ? 1 : 0} />
          ))}
          <Plot unit={unit} curve={target} colour={colour} progress={prog} />
        </Stage>
      </div>
    </AbsoluteFill>
  );
}

function SceneSysLine1(props: SceneProps) {
  return <SysLineScene {...props} which={1} titleText="Draw the first line — from its table" />;
}
function SceneSysLine2(props: SceneProps) {
  return <SysLineScene {...props} which={2} titleText="Now the second, same grid" />;
}

// ---- system: beat 4 — the crossing ----------------------------------------
function SceneSysCross({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const p = lineIntersection(unit.curve, unit.curve2 ?? unit.curve);
  // "The lines cross exactly once. That point sits on the blue line AND the
  // gold line… x is 2… y is 5." — the crossing dot marks the sentence about
  // the crossing (no number to follow); its coordinates land on the y.
  const markAt = Math.round(dur * 0.3); // not-speech-bound: "cross exactly once"
  const order = spokenOrder(said);
  order.skip(p?.x ?? 0);
  const labelAt = order.next(p?.y ?? 0, markAt);
  const pulse = 1 + 0.16 * Math.sin((frame - markAt) / 5);
  const { sx, sy } = makeScale(unit);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="They cross exactly once" enter={title} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={unit.curve} colour={BLUE} />
        <Plot unit={unit} curve={unit.curve2 ?? unit.curve} colour={GOLD} />
        {p && frame >= markAt && <Dot unit={unit} x={p.x} y={p.y} colour={GREEN} size={30 * pulse} />}
        {p && (
          <div
            style={{
              position: "absolute",
              left: sx(p.x) + 30,
              top: sy(p.y) - 30,
              fontSize: 30,
              fontWeight: 800,
              color: GREEN,
              whiteSpace: "nowrap",
              opacity: interpolate(frame, [labelAt, labelAt + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            ({p.x}, {p.y})
          </div>
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- system: beat 5 — substitute back and check ---------------------------
function SceneSysCheck({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  const c1 = unit.curve;
  const c2 = unit.curve2 ?? unit.curve;
  const p = lineIntersection(c1, c2);
  const x = p?.x ?? 0;
  const y = p?.y ?? 0;
  const term = (m: number, xv: number) =>
    m === 1 ? `${xv}` : m === -1 ? `−(${xv})` : `${m}(${xv})`;
  const expr = (c: Curve) => `${term(c.m ?? 1, x)} + ${c.c ?? 0}`;
  // "First equation: 2 times 2 plus 1… 5. Yes. Second: minus 2 plus 7… 5
  // again." — each card's expression lands on its last spoken digit (a
  // coefficient of ±1 is not a digit), the "= 5" on the result.
  const order = spokenOrder(said);
  const cardAt = (c: Curve, fallback: number) => {
    const mm = c.m ?? 1;
    if (Math.abs(mm) !== 1) order.skip(mm);
    order.skip(x);
    const exprAt = order.next(c.c ?? 0, fallback);
    const resultAt = Math.max(exprAt, order.next(y, fallback));
    return { exprAt, resultAt };
  };
  const one = cardAt(c1, Math.round(dur * 0.2)); // not-speech-bound: fallback only
  const two = cardAt(c2, Math.round(dur * 0.44)); // not-speech-bound: fallback only
  const fade = (at: number) =>
    interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card: React.CSSProperties = {
    fontSize: 84,
    fontWeight: 800,
    padding: "18px 44px",
    borderRadius: 22,
    backgroundColor: CREAM,
  };
  const tipAt = Math.max(Math.round(dur * 0.66), two.resultAt + 14); // not-speech-bound: names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Title text={`Check (${x}, ${y}) in both`} enter={title} />
      <div style={{ ...card, color: BLUE, border: `5px solid ${BLUE}`, opacity: fade(one.exprAt) }}>
        {expr(c1)}
        <span style={{ opacity: fade(one.resultAt) }}> = {y} ✓</span>
      </div>
      <div style={{ ...card, color: GOLD, border: `5px solid ${GOLD}`, opacity: fade(two.exprAt) }}>
        {expr(c2)}
        <span style={{ opacity: fade(two.resultAt) }}> = {y} ✓</span>
      </div>
      <div style={{ fontSize: 50, color: GREEN, fontWeight: 700, opacity: fade(tipAt) }}>{unit.tip}</div>
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  plot: ScenePlot,
  action: SceneAction,
  record: SceneRecord,
  // linear build-up (line mode)
  "line:simple": SceneLineSimple,
  "line:stretch": SceneLineStretch,
  "line:lift": SceneLineLift,
  "line:table": SceneLineTable,
  // slope-intercept
  "slope:name": SceneSlopeName,
  "slope:intercept": SceneSlopeIntercept,
  "slope:points": SceneSlopePoints,
  "slope:formula": SceneSlopeFormula,
  // systems
  "system:ask": SceneSysAsk,
  "system:line1": SceneSysLine1,
  "system:line2": SceneSysLine2,
  "system:cross": SceneSysCross,
  "system:check": SceneSysCheck,
};

export const GraphVideo: React.FC<GraphProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = graphUnitById(unitId);
  const scenes = graphSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const Body = SCENE_BODIES[`${unit.mode}:${scene.id}`] ?? SCENE_BODIES[scene.id];
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {/* Voice and picture share this Sequence's clock, so the line
                always starts exactly when its scene does. */}
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
