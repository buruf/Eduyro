// src/remotion/lesson/LinEqVideo.tsx
// The LINEAR EQUATIONS template (M11, Grade 8).
//
// Four of the five modes are the same picture: a LEDGER, where each line of
// working is one row and the operation applied sits between the rows, written
// once on each side. That layout is the argument — you can see that both
// sides got the same treatment, which is the only rule in the topic.
//
// The fifth, transformations, needs a coordinate plane instead: a point, its
// image, and a dashed line showing the journey.
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
import { linEqSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { linEqUnitById, linEqNumbers, type LinEqUnit } from "./units-lineq";

export type LinEqProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const RED = "#A8321E";
const MUTED = "#8A7A5E";

const STAGE_W = 1500;

interface SceneProps {
  dur: number;
  unit: LinEqUnit;
  sceneId: string;
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

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 62,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
        maxWidth: 1600,
      }}
    >
      {text}
    </div>
  );
}

/** One line of the working: left side, equals, right side. */
function EqRow({ left, right, colour = INK, opacity = 1 }: { left: string; right: string; colour?: string; opacity?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", opacity }}>
      <div style={{ width: 330, textAlign: "right", fontSize: 62, fontWeight: 800, color: colour }}>{left}</div>
      <div style={{ width: 90, textAlign: "center", fontSize: 62, fontWeight: 800, color: MUTED }}>=</div>
      <div style={{ width: 330, textAlign: "left", fontSize: 62, fontWeight: 800, color: colour }}>{right}</div>
    </div>
  );
}

/** The move applied to BOTH sides, written under each side so the symmetry
 *  is visible rather than claimed. */
function OpRow({ op, opacity = 1, colour = RED }: { op: string; opacity?: number; colour?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", opacity, height: 54 }}>
      <div style={{ width: 330, textAlign: "right", fontSize: 40, fontWeight: 800, color: colour }}>{op}</div>
      <div style={{ width: 90 }} />
      <div style={{ width: 330, textAlign: "left", fontSize: 40, fontWeight: 800, color: colour }}>{op}</div>
    </div>
  );
}

/** A small coordinate plane for the transformation mode. */
function Plane({
  points,
}: {
  points: {
    x: number;
    y: number;
    colour: string;
    label: string;
    /** Where the label sits relative to its point. Chosen per point rather
     *  than by a rule, because four labels on one small plane collide the
     *  moment two points share a row or a column. */
    anchor: "above" | "below" | "left" | "right";
    dashFrom?: { x: number; y: number };
  }[];
}) {
  const R = 6; // shown range, -R..R
  const S = 46; // pixels per unit
  const W = 2 * R * S;
  const ox = (STAGE_W - W) / 2 + R * S;
  const oy = 20 + R * S;
  const px = (v: number) => ox + v * S;
  const py = (v: number) => oy - v * S;
  const ticks: number[] = [];
  for (let v = -R; v <= R; v++) ticks.push(v);
  return (
    <>
      {/* grid */}
      {ticks.map((v) => (
        <React.Fragment key={`g${v}`}>
          <div style={{ position: "absolute", left: px(-R), top: py(v), width: W, height: 2, backgroundColor: "rgba(138,122,94,0.22)" }} />
          <div style={{ position: "absolute", left: px(v), top: py(R), width: 2, height: W, backgroundColor: "rgba(138,122,94,0.22)" }} />
        </React.Fragment>
      ))}
      {/* axes */}
      <div style={{ position: "absolute", left: px(-R), top: py(0) - 2, width: W, height: 5, backgroundColor: INK }} />
      <div style={{ position: "absolute", left: px(0) - 2, top: py(R), width: 5, height: W, backgroundColor: INK }} />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          {p.dashFrom && (
            <svg style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: 2 * R * S + 60, pointerEvents: "none" }}>
              <line
                x1={px(p.dashFrom.x)}
                y1={py(p.dashFrom.y)}
                x2={px(p.x)}
                y2={py(p.y)}
                stroke={p.colour}
                strokeWidth={4}
                strokeDasharray="10 8"
              />
            </svg>
          )}
          <div
            style={{
              position: "absolute",
              left: px(p.x) - 13,
              top: py(p.y) - 13,
              width: 26,
              height: 26,
              borderRadius: "50%",
              backgroundColor: p.colour,
            }}
          />
          <div
            style={{
              position: "absolute",
              left:
                p.anchor === "right" ? px(p.x) + 24 : p.anchor === "left" ? px(p.x) - 264 : px(p.x) - 120,
              top:
                p.anchor === "above" ? py(p.y) - 60 : p.anchor === "below" ? py(p.y) + 24 : py(p.y) - 20,
              width: 240,
              textAlign: p.anchor === "right" ? "left" : p.anchor === "left" ? "right" : "center",
              fontSize: 32,
              fontWeight: 800,
              color: p.colour,
              whiteSpace: "nowrap",
            }}
          >
            {p.label}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const n = linEqNumbers(unit);
  const step = (f: number) => Math.floor(dur * f);
  const at = (f: number) => interpolate(frame, [step(f), step(f) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stage = { alignItems: "center", justifyContent: "center", gap: 10 } as const;
  const tipLine = (
    <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500, marginTop: 26 }}>
      {unit.tip}
    </div>
  );

  if (unit.mode === "transform") {
    const shown =
      sceneId === "ask" ? 0 : sceneId === "work" ? 1 : sceneId === "twist" ? 2 : 3;
    const pts: Parameters<typeof Plane>[0]["points"] = [
      { x: n.px, y: n.py, colour: INK, label: `(${n.px}, ${n.py})`, anchor: "above" },
    ];
    if (shown >= 1) {
      pts.push({ x: n.reflectXx, y: n.reflectXy, colour: BLUE, label: `reflect (${n.reflectXx}, ${n.reflectXy})`, anchor: "below", dashFrom: { x: n.px, y: n.py } });
    }
    if (shown >= 2) {
      pts.push({ x: n.translatedX, y: n.translatedY, colour: GOLD, label: `slide (${n.translatedX}, ${n.translatedY})`, anchor: "right", dashFrom: { x: n.px, y: n.py } });
      pts.push({ x: n.rotatedX, y: n.rotatedY, colour: GREEN, label: `turn (${n.rotatedX}, ${n.rotatedY})`, anchor: "left", dashFrom: { x: n.px, y: n.py } });
    }
    const headline =
      sceneId === "ask"
        ? `(${n.px}, ${n.py})`
        : sceneId === "work"
          ? "Reflect — flip one coordinate"
          : sceneId === "twist"
            ? "Slide adds. Quarter turn swaps."
            : "Three rules, three images";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 640 }}>
          <Plane points={pts} />
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // ---- the ledger modes ---------------------------------------------------
  // Each entry is either an equation row or the operation applied to both
  // sides. Built per mode, then revealed in step with the narration.
  type Step = { kind: "eq"; left: string; right: string; colour?: string } | { kind: "op"; op: string };
  let steps: Step[] = [];
  let headline = "";

  if (unit.mode === "two-step") {
    steps = [
      { kind: "eq", left: `${n.a}x − ${n.b}`, right: `${n.c}` },
      { kind: "op", op: `+ ${n.b}` },
      { kind: "eq", left: `${n.a}x`, right: `${n.afterAdd}`, colour: BLUE },
      { kind: "op", op: `÷ ${n.a}` },
      { kind: "eq", left: `x`, right: `${n.twoStepX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? "Two things were done to x"
        : sceneId === "work"
          ? "Undo the LAST thing first"
          : sceneId === "twist"
            ? `Now divide by ${n.a}`
            : "Reverse order, both sides";
  } else if (unit.mode === "distribute-eq") {
    steps = [
      { kind: "eq", left: `${n.a}(x + ${n.b})`, right: `${n.c}` },
      { kind: "op", op: `÷ ${n.a}` },
      { kind: "eq", left: `x + ${n.b}`, right: `${n.afterDivide}`, colour: BLUE },
      { kind: "op", op: `− ${n.b}` },
      { kind: "eq", left: `x`, right: `${n.distributeX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? `${n.a}(x + ${n.b}) = ${n.c}`
        : sceneId === "work"
          ? "Divide first — the bracket falls away"
          : sceneId === "twist"
            ? "The long way agrees"
            : "Divide first when it divides neatly";
  } else if (unit.mode === "both-sides") {
    steps = [
      { kind: "eq", left: `${n.a}x + ${n.b}`, right: `${n.c}x + ${n.d}` },
      { kind: "op", op: `− ${n.c}x` },
      { kind: "eq", left: `${n.xDiff}x + ${n.b}`, right: `${n.d}`, colour: BLUE },
      { kind: "op", op: `− ${n.b}` },
      { kind: "eq", left: `${n.xDiff}x`, right: `${n.constDiff}`, colour: BLUE },
      { kind: "op", op: `÷ ${n.xDiff}` },
      { kind: "eq", left: `x`, right: `${n.bothSidesX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? "x on BOTH sides"
        : sceneId === "work"
          ? `Take ${n.c}x off both sides`
          : sceneId === "twist"
            ? "Now it is an ordinary two-step"
            : "Collect the x’s, then finish as normal";
  } else {
    steps = [
      { kind: "eq", left: `x / ${n.a}`, right: `${n.b}` },
      { kind: "op", op: `× ${n.a}` },
      { kind: "eq", left: `x`, right: `${n.fractionX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? `x / ${n.a} = ${n.b}`
        : sceneId === "work"
          ? `One part out of ${n.a} is ${n.b}`
          : sceneId === "twist"
            ? `Multiply both sides by ${n.a}`
            : "Multiplying undoes dividing";
  }

  // How much of the ledger has been earned by this point in the lesson.
  const eqCount = steps.filter((s) => s.kind === "eq").length;
  const target = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : eqCount;
  let seenEq = 0;
  const visible = steps.map((s) => {
    if (s.kind === "eq") seenEq++;
    return seenEq <= target;
  });

  // The expand-route proof, shown only where the narration walks it.
  const showAltRoute = unit.mode === "distribute-eq" && sceneId === "twist";

  return (
    <AbsoluteFill style={stage}>
      <Title text={headline} enter={title} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18 }}>
        {steps.map((s, i) =>
          !visible[i] ? null : s.kind === "eq" ? (
            <EqRow key={i} left={s.left} right={s.right} colour={s.colour ?? INK} opacity={at(0.1 + i * 0.11)} />
          ) : (
            <OpRow key={i} op={s.op} opacity={at(0.1 + i * 0.11)} />
          ),
        )}
      </div>
      {showAltRoute && (
        <div style={{ marginTop: 24, opacity: at(0.55), textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: MUTED }}>expanding instead</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: GOLD }}>
            {n.a}x + {n.expanded} = {n.c} → {n.a}x = {n.c - n.expanded} → x = {n.distributeX}
          </div>
        </div>
      )}
      {sceneId === "record" && tipLine}
    </AbsoluteFill>
  );
}

export const LinEqVideo: React.FC<LinEqProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = linEqUnitById(unitId);
  const scenes = linEqSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
          {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
