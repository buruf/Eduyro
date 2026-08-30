// src/remotion/lesson/QuadVideo.tsx
// The QUADRATICS template (M13, Grade 9).
//
// One idea runs through every mode: a quadratic answers in PAIRS. So the
// pictures are chosen to make the second answer impossible to overlook — two
// roots on a number line, two brackets each set to zero, a parabola that
// misses the axis entirely when there are none at all.
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
import { quadSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { quadUnitById, quadNumbers, type QuadUnit } from "./units-quad";

export type QuadProps = {
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

interface SceneProps {
  dur: number;
  unit: QuadUnit;
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

/** A parabola, used where "how many times does it meet the axis" is the point. */
function Parabola({ a, b, c, width = 720, height = 360 }: { a: number; b: number; c: number; width?: number; height?: number }) {
  const from = -b / (2 * a) - 4;
  const to = -b / (2 * a) + 4;
  const f = (x: number) => a * x * x + b * x + c;
  const N = 140;
  const xs = Array.from({ length: N + 1 }, (_, i) => from + ((to - from) * i) / N);
  const ys = xs.map(f);
  const lo = Math.min(...ys, 0);
  const hi = Math.max(...ys);
  const pad = (hi - lo) * 0.15 || 1;
  const px = (x: number) => ((x - from) / (to - from)) * width;
  const py = (y: number) => height - ((y - (lo - pad)) / (hi - lo + 2 * pad)) * height;
  const d = xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <line x1={0} y1={py(0)} x2={width} y2={py(0)} stroke={INK} strokeWidth={4} />
      <path d={d} fill="none" stroke={BLUE} strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
}

/** A short number line carrying the two roots — the pair, made visible. */
function RootLine({ roots, lo, hi, shown }: { roots: number[]; lo: number; hi: number; shown: number }) {
  const W = 900;
  const px = (v: number) => ((v - lo) / (hi - lo)) * W;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v++) ticks.push(v);
  return (
    <div style={{ position: "relative", width: W, height: 150 }}>
      <div style={{ position: "absolute", left: 0, top: 70, width: W, height: 5, backgroundColor: INK, borderRadius: 3 }} />
      {ticks.map((v) => (
        <React.Fragment key={v}>
          <div style={{ position: "absolute", left: px(v) - 2, top: 60, width: 4, height: 24, backgroundColor: v === 0 ? GOLD : MUTED }} />
          <div style={{ position: "absolute", left: px(v) - 30, top: 92, width: 60, textAlign: "center", fontSize: 28, fontWeight: 800, color: v === 0 ? GOLD : MUTED }}>
            {v}
          </div>
        </React.Fragment>
      ))}
      {roots.slice(0, shown).map((r, i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: px(r) - 16, top: 56, width: 32, height: 32, borderRadius: "50%", backgroundColor: GREEN }} />
          <div style={{ position: "absolute", left: px(r) - 80, top: 4, width: 160, textAlign: "center", fontSize: 40, fontWeight: 800, color: GREEN }}>
            {r}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const n = quadNumbers(unit);
  const step = (f: number) => Math.floor(dur * f);
  const fade = (at: number) =>
    interpolate(frame, [step(at), step(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stage = { alignItems: "center", justifyContent: "center", gap: 30 } as const;
  const tipLine = (
    <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>
  );

  if (unit.mode === "perfect-squares") {
    // The square, actually built. 36 dots is a picture; "36 is a perfect
    // square" is a claim.
    const cell = 44;
    const built = sceneId === "ask" ? 0 : sceneId === "work" ? Math.min(n.square, Math.floor(((frame - step(0.15)) / Math.max(1, step(0.5))) * n.square) + 1) : n.square;
    const headline =
      sceneId === "ask"
        ? `Is ${n.square} a perfect square?`
        : sceneId === "work"
          ? `${n.side} rows of ${n.side}`
          : sceneId === "twist"
            ? `√${n.square} asks for the SIDE`
            : `${n.side} × ${n.side} = ${n.square}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${n.side}, ${cell}px)`, gap: 6 }}>
            {Array.from({ length: n.square }, (_, i) => (
              <div
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 6,
                  backgroundColor: i < built ? GOLD : "transparent",
                  border: `2px solid ${i < built ? "#8A5E10" : MUTED}`,
                }}
              />
            ))}
          </div>
          {(sceneId === "twist" || sceneId === "record") && (
            <div style={{ opacity: fade(0.2), textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: MUTED }}>side</div>
              <div style={{ fontSize: 92, fontWeight: 800, color: GREEN }}>{n.side}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>√{n.square} = {n.side}</div>
            </div>
          )}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "solve-x2-k") {
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? 1 : 2;
    const headline =
      sceneId === "ask"
        ? `x² = ${n.a}`
        : sceneId === "work"
          ? "Both of these work"
          : sceneId === "twist"
            ? "Squaring throws the sign away"
            : `x = ±${n.b}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 80 }}>
          {[
            { v: n.posRoot, c: BLUE },
            { v: n.negRoot, c: GOLD },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: "center", opacity: sceneId === "ask" ? 0.14 : i < shown || shown === 2 ? 1 : 0.14 }}>
              <div style={{ fontSize: 60, fontWeight: 800, color: r.c }}>
                ({r.v})² = {n.a}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: MUTED, marginTop: 8 }}>
                {r.v < 0 ? "negative × negative = positive" : ""}
              </div>
            </div>
          ))}
        </div>
        <RootLine roots={[n.negRoot, n.posRoot]} lo={-5} hi={5} shown={shown === 2 ? 2 : shown} />
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "simplify-roots") {
    const rows = [
      `√${n.a}`,
      `√(${n.factor} × ${n.inside})`,
      `√${n.factor} × √${n.inside}`,
      `${n.outside}√${n.inside}`,
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : 4;
    const headline =
      sceneId === "ask"
        ? `√${n.a} — not a whole number`
        : sceneId === "work"
          ? `${n.factor} is a perfect square`
          : sceneId === "twist"
            ? `√${n.factor} walks out`
            : `√${n.a} = ${n.outside}√${n.inside}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 86 : 60, fontWeight: 800, color: i === 3 ? GREEN : i === 2 ? BLUE : INK, opacity: fade(0.1 + i * 0.16) }}>
              {r}
            </div>
          ))}
        </div>
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ fontSize: 38, fontWeight: 800, color: MUTED, opacity: fade(0.7) }}>
            both are about 2.8 — same value, tidier form
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "zero-product" || unit.mode === "solve-factoring") {
    const factoring = unit.mode === "solve-factoring";
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? (factoring ? 1 : 0) : 2;
    const headline =
      sceneId === "ask"
        ? factoring
          ? `x² − ${n.sum}x + ${n.product} = 0`
          : `(x − ${n.root1})(x − ${n.root2}) = 0`
        : sceneId === "work"
          ? factoring
            ? `multiply to ${n.product}, add to −${n.sum}`
            : "A product is zero only if a factor is"
          : sceneId === "twist"
            ? "Set each bracket to zero"
            : `x = ${n.root1} or x = ${n.root2}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {factoring && sceneId === "work" ? (
          <div style={{ display: "flex", gap: 50 }}>
            {[
              [1, n.product],
              [n.root1, n.root2],
            ].map((pair, i) => {
              const good = pair[0] + pair[1] === n.sum;
              return (
                <div key={i} style={{ borderRadius: 18, border: `5px solid ${good ? GREEN : MUTED}`, padding: "22px 38px", backgroundColor: "#FFF", textAlign: "center" }}>
                  <div style={{ fontSize: 50, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {pair[0]} · {pair[1]} = {pair[0] * pair[1]}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {pair[0]} + {pair[1]} = {pair[0] + pair[1]} {good ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 46, alignItems: "center" }}>
            {[n.root1, n.root2].map((r, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ fontSize: 50, fontWeight: 800, color: MUTED }}>×</div>}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      borderRadius: 18,
                      border: `5px solid ${i === 0 ? BLUE : GOLD}`,
                      padding: "22px 38px",
                      backgroundColor: "#FFF",
                      fontSize: 54,
                      fontWeight: 800,
                      color: i === 0 ? BLUE : GOLD,
                    }}
                  >
                    x − {r}
                  </div>
                  <div style={{ height: 62, marginTop: 10, opacity: shown >= 2 ? fade(0.2 + i * 0.2) : 0 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: MUTED }}>= 0 →</div>
                    <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>x = {r}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div style={{ fontSize: 50, fontWeight: 800, color: MUTED }}>= 0</div>
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // discriminant
  const rows = [
    `b² − 4ac`,
    `${n.b}² − 4(${n.a})(${n.c})`,
    `${n.bSquared} − ${n.fourAC}`,
    `= ${n.discriminant}`,
  ];
  const shown = sceneId === "ask" ? 0 : sceneId === "work" ? 4 : 4;
  const headline =
    sceneId === "ask"
      ? `x² + ${n.b}x + ${n.c} = 0`
      : sceneId === "work"
        ? "The part under the root"
        : sceneId === "twist"
          ? "Negative → no real solutions"
          : "positive 2 · zero 1 · negative 0";
  return (
    <AbsoluteFill style={stage}>
      <Title text={headline} enter={title} />
      <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 74 : 48, fontWeight: 800, color: i === 3 ? RED : INK, opacity: fade(0.1 + i * 0.14) }}>
              {r}
            </div>
          ))}
        </div>
        {(sceneId === "twist" || sceneId === "record" || sceneId === "ask") && (
          <div style={{ opacity: sceneId === "ask" ? 1 : fade(0.15), textAlign: "center" }}>
            <Parabola a={n.a} b={n.b} c={n.c} width={600} height={300} />
            {sceneId !== "ask" && (
              <div style={{ fontSize: 36, fontWeight: 800, color: RED, marginTop: 8 }}>never touches the axis</div>
            )}
          </div>
        )}
      </div>
      {sceneId === "record" && tipLine}
    </AbsoluteFill>
  );
}

export const QuadVideo: React.FC<QuadProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = quadUnitById(unitId);
  const scenes = quadSceneTimings(unitId, voice);
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
