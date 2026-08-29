// src/remotion/lesson/PreAlgVideo.tsx
// The PRE-ALGEBRA template (M10, Grade 6-7) — a child's first letter.
//
// Everything here leans on ONE idea: x is a container, and algebra is what
// you do to containers. So x is drawn as an actual box with a value that can
// be poured into it, boxes get counted for like terms, a rectangle makes
// distribution impossible to under-count, a balance makes "do it to both
// sides" visible, and integers walk a number line where the signs are
// directions rather than decorations.
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
import { preAlgSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { preAlgUnitById, preAlgNumbers, type PreAlgUnit } from "./units-prealg";

export type PreAlgProps = {
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
  unit: PreAlgUnit;
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
        fontSize: 64,
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

function Line({
  children,
  at,
  frame,
  size = 62,
  colour = INK,
  weight = 800,
}: {
  children: React.ReactNode;
  at: number;
  frame: number;
  size?: number;
  colour?: string;
  weight?: number;
}) {
  const o = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dy = interpolate(frame, [at, at + 12], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div style={{ fontSize: size, fontWeight: weight, color: colour, opacity: o, translate: `0 ${dy}px`, whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

/** The x-box: a container that either shows the letter or the value inside. */
function XBox({ value, size = 118, colour = BLUE }: { value?: number | string; size?: number; colour?: string }) {
  const filled = value !== undefined;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        border: `6px solid ${colour}`,
        backgroundColor: filled ? colour : "#FFF",
        color: filled ? "#FFF" : colour,
        fontSize: size * 0.5,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontStyle: filled ? "normal" : "italic",
      }}
    >
      {filled ? value : "x"}
    </div>
  );
}

/** A number line from `from` to `to`, with a walker and its trail. */
function IntegerLine({ from, to, at, start }: { from: number; to: number; at: number; start: number }) {
  const W = 1240;
  const lx = (STAGE_W - W) / 2;
  const ly = 170;
  const posOf = (v: number) => lx + (W * (v - from)) / (to - from);
  const ticks: number[] = [];
  for (let v = from; v <= to; v++) ticks.push(v);
  const lo = Math.min(start, at);
  const hi = Math.max(start, at);
  return (
    <>
      {/* the walk so far */}
      {hi > lo && (
        <div
          style={{
            position: "absolute",
            left: posOf(lo),
            top: ly - 8,
            width: posOf(hi) - posOf(lo),
            height: 20,
            backgroundColor: GREEN,
            opacity: 0.28,
            borderRadius: 10,
          }}
        />
      )}
      <div style={{ position: "absolute", left: lx, top: ly, width: W, height: 6, backgroundColor: INK, borderRadius: 3 }} />
      {ticks.map((v) => (
        <React.Fragment key={v}>
          <div
            style={{
              position: "absolute",
              left: posOf(v) - 2,
              top: ly - (v === 0 ? 22 : 13),
              width: 4,
              height: v === 0 ? 50 : 32,
              backgroundColor: v === 0 ? GOLD : INK,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: posOf(v) - 50,
              top: ly + 34,
              width: 100,
              textAlign: "center",
              fontSize: 30,
              fontWeight: 800,
              color: v === 0 ? GOLD : MUTED,
            }}
          >
            {v}
          </div>
        </React.Fragment>
      ))}
      {/* the walker */}
      <div
        style={{
          position: "absolute",
          left: posOf(at) - 17,
          top: ly - 14,
          width: 34,
          height: 34,
          borderRadius: "50%",
          backgroundColor: GREEN,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: posOf(at) - 90,
          top: ly - 92,
          width: 180,
          textAlign: "center",
          fontSize: 46,
          fontWeight: 800,
          color: GREEN,
        }}
      >
        {at}
      </div>
    </>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const x = preAlgNumbers(unit);
  const step = (f: number) => Math.floor(dur * f);
  const stage = { alignItems: "center", justifyContent: "center", gap: 38 } as const;
  const tip = (
    <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>
  );

  if (unit.mode === "evaluate-add") {
    // The same rule, run twice with different x, side by side in the twist —
    // that comparison IS the lesson.
    const headline =
      sceneId === "ask"
        ? "A rule, not an answer"
        : sceneId === "work"
          ? `x = ${x.at}`
          : sceneId === "twist"
            ? "Change x, and the answer moves"
            : "Substitute, then work it out";
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "twist" ? (
          <div style={{ display: "flex", gap: 110 }}>
            {[
              { v: x.at, r: x.sum, c: BLUE },
              { v: x.at2, r: x.sum2, c: GOLD },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  opacity: i === 0 || frame >= step(0.35) ? 1 : 0.15,
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 800, color: MUTED }}>x = {c.v}</div>
                <div style={{ fontSize: 66, fontWeight: 800, color: c.c, marginTop: 12 }}>
                  {c.v} + {x.a}
                </div>
                <div style={{ fontSize: 80, fontWeight: 800, color: c.c }}>= {c.r}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <XBox value={sceneId === "ask" ? undefined : x.at} />
            <div style={{ fontSize: 76, fontWeight: 800, color: INK }}>+ {x.a}</div>
            {sceneId !== "ask" && (
              <>
                <div style={{ fontSize: 76, fontWeight: 800, color: MUTED }}>=</div>
                <Line at={step(0.45)} frame={frame} size={90} colour={GREEN}>
                  {x.sum}
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "ask" && (
          <Line at={step(0.5)} frame={frame} size={40} colour={MUTED}>
            nothing to work out until x has a value
          </Line>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "evaluate-mul") {
    const groups = Array.from({ length: x.a }, (_, i) => i);
    const shown = sceneId === "twist" ? Math.min(x.a, Math.floor((frame - step(0.15)) / Math.max(1, step(0.2))) + 1) : x.a;
    const headline =
      sceneId === "ask"
        ? `${x.a}x`
        : sceneId === "work"
          ? `${x.a}x means ${x.a} × x`
          : sceneId === "twist"
            ? `x = ${x.at}`
            : `${x.a}x, when x is ${x.at}, is ${x.product}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "work" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
            <Line at={0} frame={frame} size={56} colour={RED}>
              not {x.a} next to x
            </Line>
            <Line at={step(0.3)} frame={frame} size={56} colour={RED}>
              not {x.a} + x
            </Line>
            <Line at={step(0.55)} frame={frame} size={76} colour={GREEN}>
              {x.a} × x
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
            {groups.map((i) => (
              <div key={i} style={{ opacity: i < shown ? 1 : 0.14 }}>
                <XBox value={sceneId === "ask" ? undefined : x.at} colour={GOLD} />
              </div>
            ))}
            {sceneId !== "ask" && (
              <>
                <div style={{ fontSize: 70, fontWeight: 800, color: MUTED }}>=</div>
                <Line at={step(0.6)} frame={frame} size={92} colour={GREEN}>
                  {x.product}
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "like-terms") {
    const headline =
      sceneId === "ask"
        ? `${x.a}x + ${x.b}x`
        : sceneId === "work"
          ? "Count the boxes"
          : sceneId === "twist"
            ? `${x.a}x + ${x.b} — different things`
            : `${x.a}x + ${x.b}x = ${x.combined}x`;
    const Boxes = ({ n, colour, dim = false }: { n: number; colour: string; dim?: boolean }) => (
      <div style={{ display: "flex", gap: 14, opacity: dim ? 0.15 : 1 }}>
        {Array.from({ length: n }, (_, i) => (
          <XBox key={i} size={92} colour={colour} />
        ))}
      </div>
    );
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "twist" ? (
          <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
            <Boxes n={x.a} colour={BLUE} />
            <div style={{ fontSize: 66, fontWeight: 800, color: MUTED }}>+</div>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 16,
                border: `6px solid ${GOLD}`,
                backgroundColor: GOLD,
                color: "#FFF",
                fontSize: 48,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {x.b}
            </div>
            <Line at={step(0.4)} frame={frame} size={48} colour={RED}>
              will not combine
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
            <Boxes n={x.a} colour={BLUE} />
            <div style={{ fontSize: 66, fontWeight: 800, color: MUTED }}>+</div>
            <Boxes n={x.b} colour={GREEN} />
            {sceneId !== "ask" && (
              <>
                <div style={{ fontSize: 66, fontWeight: 800, color: MUTED }}>=</div>
                <Line at={step(0.5)} frame={frame} size={88} colour={GREEN}>
                  {x.combined}x
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "distribute") {
    // The area rectangle: height a, width split into x and b.
    const H = 190;
    const WX = 300;
    const WB = 62 * x.b;
    const split = sceneId !== "ask";
    const headline =
      sceneId === "ask"
        ? `${x.a}( x + ${x.b} )`
        : sceneId === "work"
          ? "Two rooms"
          : sceneId === "twist"
            ? `Check it with x = ${x.at}`
            : `${x.a}x + ${x.outer}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", paddingTop: 40, paddingLeft: 60 }}>
          {/* height label */}
          <div
            style={{ position: "absolute", left: 0, top: 40 + H / 2 - 24, fontSize: 44, fontWeight: 800, color: MUTED }}
          >
            {x.a}
          </div>
          {/* width labels */}
          <div style={{ position: "absolute", left: 60, top: 0, width: WX, textAlign: "center", fontSize: 44, fontWeight: 800, color: BLUE }}>
            x
          </div>
          {split && (
            <div style={{ position: "absolute", left: 60 + WX, top: 0, width: WB, textAlign: "center", fontSize: 44, fontWeight: 800, color: GOLD }}>
              {x.b}
            </div>
          )}
          <div style={{ display: "flex" }}>
            <div
              style={{
                width: WX,
                height: H,
                border: `6px solid ${BLUE}`,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 62,
                fontWeight: 800,
                color: BLUE,
              }}
            >
              {split ? `${x.a}x` : ""}
            </div>
            <div
              style={{
                width: WB,
                height: H,
                border: `6px solid ${split ? GOLD : BLUE}`,
                borderLeftWidth: split ? 6 : 0,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 62,
                fontWeight: 800,
                color: GOLD,
              }}
            >
              {split ? x.outer : ""}
            </div>
          </div>
        </div>
        {sceneId === "twist" && (
          <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
            <Line at={step(0.15)} frame={frame} size={50} colour={MUTED}>
              {x.a}({x.at} + {x.b}) = {x.checkLeft}
            </Line>
            <Line at={step(0.5)} frame={frame} size={50} colour={GREEN}>
              {x.a * x.at} + {x.outer} = {x.checkRight}
            </Line>
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "solve-times") {
    const shared = sceneId === "twist" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `${x.a}x = ${x.b}`
        : sceneId === "work"
          ? "Both sides are equal — keep them that way"
          : sceneId === "twist"
            ? `Share both sides into ${x.a}`
            : `x = ${x.solution}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: shared ? 1 : x.a }, (_, i) => (
              <XBox key={i} size={104} colour={BLUE} />
            ))}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, color: MUTED }}>=</div>
          <Line at={shared ? step(0.35) : 0} frame={frame} size={92} colour={shared ? GREEN : GOLD}>
            {shared ? x.solution : x.b}
          </Line>
        </div>
        {/* The balance the narration asks you to picture. A bare beam reads as
            a fraction bar under "x = 3", so it gets a fulcrum. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 760, height: 10, backgroundColor: MUTED, borderRadius: 5, opacity: 0.65 }} />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "34px solid transparent",
              borderRight: "34px solid transparent",
              borderBottom: `52px solid ${MUTED}`,
              opacity: 0.65,
            }}
          />
        </div>
        {(sceneId === "twist" || sceneId === "record") && (
          <Line at={step(0.7)} frame={frame} size={44} colour={MUTED}>
            check: {x.a} × {x.solution} = {x.b}
          </Line>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  // integers — walk the line.
  const from = -8;
  const to = 8;
  const walkStart = step(0.2);
  const walkEnd = step(0.8);
  const at =
    sceneId === "ask"
      ? unit.a
      : sceneId === "work"
        ? unit.a
        : sceneId === "twist"
          ? Math.round(
              interpolate(frame, [walkStart, walkEnd], [unit.a, x.integerResult], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
            )
          : x.integerResult;
  const headline =
    sceneId === "ask"
      ? `(${unit.a}) − ${x.b}`
      : sceneId === "work"
        ? "Plus walks right. Minus walks left."
        : sceneId === "twist"
          ? `${x.b} steps left`
          : `(${unit.a}) − ${x.b} = ${x.integerResult}`;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 320, gap: 30 }}>
      <Title text={headline} enter={title} />
      <div style={{ position: "relative", width: STAGE_W, height: 300 }}>
        <IntegerLine from={from} to={to} at={at} start={unit.a} />
      </div>
      {sceneId === "work" && (
        <div style={{ display: "flex", gap: 90 }}>
          <Line at={step(0.15)} frame={frame} size={46} colour={GREEN}>
            + → right
          </Line>
          <Line at={step(0.4)} frame={frame} size={46} colour={RED}>
            − → left
          </Line>
        </div>
      )}
      {sceneId === "record" && tip}
    </AbsoluteFill>
  );
}

export const PreAlgVideo: React.FC<PreAlgProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = preAlgUnitById(unitId);
  const scenes = preAlgSceneTimings(unitId, voice);
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
