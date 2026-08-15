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
import { graphSceneTimings } from "./timeline";
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
  const a = useEnter(6);
  const b = useEnter(40);
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
function ScenePlot({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const drawAt = Math.round(dur * 0.3);
  const progress = interpolate(frame, [drawAt, drawAt + 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  // Line/parabola modes plot the sample POINTS first, then join them — the
  // graph should look derived from the equation, not conjured.
  const showPoints = unit.mode === "line" || unit.mode === "parabola" || unit.mode === "exponential";
  const ptXs =
    unit.mode === "parabola" ? [-2, -1, 0, 1, 2] : unit.mode === "exponential" ? [0, 1, 2, 3] : [0, 1, 2];
  const ptAt = Math.round(dur * 0.12);
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
                opacity={interpolate(frame, [ptAt + i * 12, ptAt + i * 12 + 10], [0, 1], {
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
function SceneAction({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
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

  if (unit.mode === "slope") {
    const m = unit.curve.m ?? 1;
    const c = unit.curve.c ?? 0;
    const stepAt = Math.round(dur * 0.28);
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
    const drawAt = Math.round(dur * 0.16);
    const prog2 = interpolate(frame, [drawAt, drawAt + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const markAt = Math.round(dur * 0.62);
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
    const markAt = Math.round(dur * 0.42);
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
              opacity={interpolate(frame, [markAt + i * 26, markAt + i * 26 + 14], [0, 1], {
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
    const sweepAt = Math.round(dur * 0.2);
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
              <div style={{ position: "absolute", left: PAD, top: sy(cq) - 2, width: STAGE_W - PAD * 2, height: 4, backgroundImage: `repeating-linear-gradient(90deg, ${RED} 0 14px, transparent 14px 26px)` }} />
              <Dot unit={unit} x={0} y={cq} colour={RED} size={26} label={`lowest: ${cq}`} />
              <div style={{ position: "absolute", left: PAD + 14, top: sy(cq) + 14, fontSize: 34, fontWeight: 800, color: RED }}>never below</div>
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
    const mirrorAt = Math.round(dur * 0.3);
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
    const walkAt = Math.round(dur * 0.24);
    // Stop short of the hole: the dots must approach it, never cover it —
    // the gap is the thing being taught.
    const t = interpolate(frame, [walkAt, walkAt + 90], [1, 0.22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const leftX = h - t;
    const rightX = h + t;
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
    const slideAt = Math.round(dur * 0.24);
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
    const stageAt = Math.round(dur * 0.2);
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
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.55);

  const roots = unit.curve.kind === "quadratic" ? quadraticRoots(unit.curve) : [];
  const inter = unit.curve2 ? lineIntersection(unit.curve, unit.curve2) : null;
  const headline: Record<GraphUnit["mode"], string> = {
    line: curveText(unit.curve),
    slope: `m = ${unit.curve.m ?? 1} · b = ${unit.curve.c ?? 0}`,
    system: inter ? `x = ${inter.x},  y = ${inter.y}` : curveText(unit.curve),
    parabola: roots.length ? `crosses at ${roots[0]} and ${roots[1]}` : curveText(unit.curve),
    roots: roots.length ? `x = ${roots[0]}  or  x = ${roots[1]}` : curveText(unit.curve),
    exponential: curveText(unit.curve),
    log: `log base ${unit.curve.base ?? 2} of ${(unit.curve.base ?? 2) ** 3} = 3`,
    limit: `limit = ${2 * (unit.at ?? 2)}`,
    derivative: `slope at x = ${unit.at ?? 1}  is  ${2 * (unit.curve.a ?? 1) * (unit.at ?? 1)}`,
    integral: `area = ${((unit.curve.m ?? 1) * ((unit.to ?? 4) ** 2 - (unit.from ?? 0) ** 2)) / 2}`,
    range: `y ≥ ${unit.curve.c ?? 0}`,
    endbehavior: "both ends → up",
  };

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title text="So" enter={title} />
      <div style={{ fontSize: 120, fontWeight: 800, color: GREEN }}>{headline[unit.mode]}</div>
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
  const title = useEnter(4);
  const drawAt = Math.round(dur * 0.42);
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
function SceneLineStretch({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const identity: Curve = { kind: "linear", m: 1, c: 0 };
  const stretched: Curve = { kind: "linear", m, c: 0 };
  const moveAt = Math.round(dur * 0.3);
  const lineAt = Math.round(dur * 0.62);
  const lineProg = interpolate(frame, [lineAt, lineAt + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={`Multiply x by ${m}`} enter={title} />
      <EquationCard text={`y = ${m}x`} colour={GREEN} size={72} enter={useEnter(14)} />
      <Stage>
        <Axes unit={unit} />
        {/* ghost of where we came from */}
        <Plot unit={unit} curve={identity} colour={GRID} width={4} />
        {[1, 2].map((x, i) => {
          const t = interpolate(frame, [moveAt + i * 22, moveAt + i * 22 + 20], [0, 1], {
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
function SceneLineLift({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const stretched: Curve = { kind: "linear", m, c: 0 };
  const liftAt = Math.round(dur * 0.34);
  const lineAt = Math.round(dur * 0.68);
  const lineProg = interpolate(frame, [lineAt, lineAt + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const capAt = Math.round(dur * 0.55);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text={`Add ${c} — the line lifts UP`} enter={title} />
      <EquationCard text={curveText(unit.curve)} colour={GOLD} size={72} enter={useEnter(14)} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={stretched} colour={GRID} width={4} />
        {[0, 1, 2].map((x, i) => {
          const t = interpolate(frame, [liftAt + i * 18, liftAt + i * 18 + 18], [0, 1], {
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
function SceneLineTable({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const rows = [0, 1, 2].map((x) => ({ x, y: m * x + c }));
  const rowAt = Math.round(dur * 0.24);
  const rowGap = Math.round(dur * 0.18);
  const litRows = Math.max(0, Math.min(rows.length, Math.floor((frame - rowAt) / rowGap) + 1));
  const joinAt = rowAt + rows.length * rowGap;
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
function SceneSlopeName({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const labelAt = Math.round(dur * 0.3);
  const oursAt = Math.round(dur * 0.62);
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
      <div style={{ fontSize: 66, fontWeight: 800, color: INK, opacity: fade(oursAt) }}>
        {curveText(unit.curve)} → <span style={{ color: GREEN }}>m = {m}</span>,{" "}
        <span style={{ color: GOLD }}>b = {c}</span>
      </div>
    </AbsoluteFill>
  );
}

// ---- slope: beat 2 — find b where the line cuts the y axis ----------------
function SceneSlopeIntercept({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const c = unit.curve.c ?? 0;
  const markAt = Math.round(dur * 0.45);
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
function SceneSlopePoints({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const x1 = 1, x2 = 3;
  const p1 = { x: x1, y: m * x1 + c };
  const p2 = { x: x2, y: m * x2 + c };
  const dotAt = Math.round(dur * 0.28);
  const triAt = Math.round(dur * 0.62);
  const fade = (at: number) =>
    interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { sx, sy } = makeScale(unit);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="Pick two points on the line" enter={title} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={unit.curve} colour={BLUE} />
        <Dot unit={unit} x={p1.x} y={p1.y} colour={GREEN} size={26} label={`(x₁, y₁) = (${p1.x}, ${p1.y})`} opacity={fade(dotAt)} />
        <Dot unit={unit} x={p2.x} y={p2.y} colour={GREEN} size={26} label={`(x₂, y₂) = (${p2.x}, ${p2.y})`} opacity={fade(dotAt + 24)} />
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
function SceneSlopeFormula({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const m = unit.curve.m ?? 1;
  const c = unit.curve.c ?? 0;
  const x1 = 1, x2 = 3;
  const y1 = m * x1 + c, y2 = m * x2 + c;
  const rise = y2 - y1, run = x2 - x1;
  // Steps appear as spoken: formula → plug in → top → bottom → answer.
  const stepAt = (k: number) => Math.round(dur * (0.16 + k * 0.16));
  const fade = (k: number) =>
    interpolate(frame, [stepAt(k), stepAt(k) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const row: React.CSSProperties = { fontSize: 72, fontWeight: 800, color: INK, whiteSpace: "nowrap" };
  const frac = (top: string, bottom: string, colour: string) => (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 14px" }}>
      <span style={{ color: colour, padding: "0 10px" }}>{top}</span>
      <span style={{ height: 5, alignSelf: "stretch", backgroundColor: INK }} />
      <span style={{ color: colour, padding: "0 10px" }}>{bottom}</span>
    </span>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
      <Title text="The slope formula" enter={title} />
      <div style={{ ...row, opacity: fade(0) }}>m = {frac("y₂ − y₁", "x₂ − x₁", GREEN)}</div>
      <div style={{ ...row, opacity: fade(1) }}>m = {frac(`${y2} − ${y1}`, `${x2} − ${x1}`, GREEN)}</div>
      <div style={{ ...row, opacity: fade(2) }}>m = {frac(String(rise), String(run), GOLD)}</div>
      <div style={{ ...row, fontSize: 96, color: GREEN, opacity: fade(3) }}>
        m = {m} — up {m} for every 1 across
      </div>
    </AbsoluteFill>
  );
}

// ---- system: beat 1 — two equations, one puzzle ---------------------------
function SceneSysAsk({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const second = useEnter(Math.round(dur * 0.4));
  const qOp = interpolate(frame, [Math.round(dur * 0.68), Math.round(dur * 0.68) + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Title text="Two equations, one puzzle" enter={title} />
      <EquationCard text={curveText(unit.curve)} colour={BLUE} size={110} enter={useEnter(16)} />
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
  which,
  titleText,
}: SceneProps & { which: 1 | 2; titleText: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const c1 = unit.curve;
  const c2 = unit.curve2 ?? unit.curve;
  const target = which === 1 ? c1 : c2;
  const colour = which === 1 ? BLUE : GOLD;
  const rows = [0, 1, 2].map((x) => ({ x, y: (target.m ?? 1) * x + (target.c ?? 0) }));
  const rowAt = Math.round(dur * 0.2);
  const rowGap = Math.round(dur * 0.16);
  const litRows = Math.max(0, Math.min(rows.length, Math.floor((frame - rowAt) / rowGap) + 1));
  const joinAt = rowAt + rows.length * rowGap;
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
function SceneSysCross({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const p = lineIntersection(unit.curve, unit.curve2 ?? unit.curve);
  const markAt = Math.round(dur * 0.3);
  const pulse = 1 + 0.16 * Math.sin((frame - markAt) / 5);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title text="They cross exactly once" enter={title} />
      <Stage>
        <Axes unit={unit} />
        <Plot unit={unit} curve={unit.curve} colour={BLUE} />
        <Plot unit={unit} curve={unit.curve2 ?? unit.curve} colour={GOLD} />
        {p && frame >= markAt && (
          <Dot unit={unit} x={p.x} y={p.y} colour={GREEN} size={30 * pulse} label={`(${p.x}, ${p.y})`} />
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- system: beat 5 — substitute back and check ---------------------------
function SceneSysCheck({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const c1 = unit.curve;
  const c2 = unit.curve2 ?? unit.curve;
  const p = lineIntersection(c1, c2);
  const x = p?.x ?? 0;
  const y = p?.y ?? 0;
  const term = (m: number, xv: number) =>
    m === 1 ? `${xv}` : m === -1 ? `−(${xv})` : `${m}(${xv})`;
  const line = (c: Curve) => `${term(c.m ?? 1, x)} + ${c.c ?? 0} = ${y}`;
  const fade = (at: number) =>
    interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card: React.CSSProperties = {
    fontSize: 84,
    fontWeight: 800,
    padding: "18px 44px",
    borderRadius: 22,
    backgroundColor: CREAM,
  };
  const tipAt = Math.round(dur * 0.66);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Title text={`Check (${x}, ${y}) in both`} enter={title} />
      <div style={{ ...card, color: BLUE, border: `5px solid ${BLUE}`, opacity: fade(Math.round(dur * 0.2)) }}>
        {line(c1)} ✓
      </div>
      <div style={{ ...card, color: GOLD, border: `5px solid ${GOLD}`, opacity: fade(Math.round(dur * 0.44)) }}>
        {line(c2)} ✓
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
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
