// src/remotion/lesson/AdvancedVideo.tsx
// The ADVANCED template — final M10/M16/M17/M18 units, one honest picture per
// mode: a number line for ordering integers, two competing paths for order of
// operations, a plane with arrows for complex numbers and vectors, hop-chips
// and running sums for sequences, and rule cards applied to concrete powers
// for the calculus trio. Numbers all come from ADV (units-advanced.ts).
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
import { advancedSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { advancedUnitById, ADV, type AdvancedUnit } from "./units-advanced";

export type AdvancedProps = {
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

interface SceneProps {
  dur: number;
  unit: AdvancedUnit;
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
        fontSize: 66,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
        maxWidth: 1500,
      }}
    >
      {text}
    </div>
  );
}

/** Simple card with big content, used by the card modes. */
function Card({ children, colour = BLUE, dim = false }: { children: React.ReactNode; colour?: string; dim?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `5px solid ${colour}`,
        padding: "26px 44px",
        backgroundColor: "#FFF",
        opacity: dim ? 0.15 : 1,
        textAlign: "center",
        fontSize: 58,
        fontWeight: 800,
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

/** Horizontal integer number line from lo..hi with optional marked values. */
function IntLine({ lo, hi, marks, shown }: { lo: number; hi: number; marks: number[]; shown: number }) {
  const W = 1400;
  const px = (v: number) => ((v - lo) / (hi - lo)) * W;
  return (
    <div style={{ position: "relative", width: W, height: 190 }}>
      <div style={{ position: "absolute", left: 0, top: 96, width: W, height: 5, backgroundColor: MUTED }} />
      {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((v) => (
        <div key={v}>
          <div style={{ position: "absolute", left: px(v) - 1, top: 86, width: 3, height: 24, backgroundColor: v === 0 ? INK : MUTED }} />
          <div style={{ position: "absolute", left: px(v) - 24, top: 118, width: 48, textAlign: "center", fontSize: 30, fontWeight: 700, color: v === 0 ? INK : MUTED }}>{v}</div>
        </div>
      ))}
      {marks.slice(0, shown).map((v, i) => (
        <div key={v}>
          <div
            style={{
              position: "absolute",
              left: px(v) - 22,
              top: 30,
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: v < 0 ? RED : GREEN,
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A quadrant-1 plane with arrows (vectors / complex numbers). */
function Plane({
  arrows,
  labels,
  gridMax = 6,
}: {
  arrows: { from: [number, number]; to: [number, number]; colour: string }[];
  labels: { at: [number, number]; text: string; colour: string }[];
  gridMax?: number;
}) {
  const S = 620;
  const px = (v: number) => (v / gridMax) * (S - 80) + 50;
  const py = (v: number) => S - 40 - (v / gridMax) * (S - 80);
  return (
    <svg width={S + 130} height={S}>
      {Array.from({ length: gridMax + 1 }, (_, i) => i).map((i) => (
        <g key={i}>
          <line x1={px(i)} y1={py(0)} x2={px(i)} y2={py(gridMax)} stroke="#E3DAC6" strokeWidth={1.5} />
          <line x1={px(0)} y1={py(i)} x2={px(gridMax)} y2={py(i)} stroke="#E3DAC6" strokeWidth={1.5} />
          {i > 0 && <text x={px(i) - 8} y={py(0) + 32} fontSize={24} fill={MUTED} fontWeight={700}>{i}</text>}
          {i > 0 && <text x={px(0) - 34} y={py(i) + 8} fontSize={24} fill={MUTED} fontWeight={700}>{i}</text>}
        </g>
      ))}
      <line x1={px(0)} y1={py(0)} x2={px(gridMax)} y2={py(0)} stroke={MUTED} strokeWidth={4} />
      <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(gridMax)} stroke={MUTED} strokeWidth={4} />
      {arrows.map((a, i) => {
        const x1 = px(a.from[0]), y1 = py(a.from[1]), x2 = px(a.to[0]), y2 = py(a.to[1]);
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const ah = 18;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.colour} strokeWidth={7} />
            <polygon
              points={`${x2},${y2} ${x2 - ah * Math.cos(ang - 0.45)},${y2 - ah * Math.sin(ang - 0.45)} ${x2 - ah * Math.cos(ang + 0.45)},${y2 - ah * Math.sin(ang + 0.45)}`}
              fill={a.colour}
            />
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={px(l.at[0]) + 12} y={py(l.at[1]) - 10} fontSize={30} fontWeight={800} fill={l.colour}>
          {l.text}
        </text>
      ))}
    </svg>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const step = (k: number) => Math.round(dur * k);
  const reveal = (count: number, from = 0.15, span = 0.6) =>
    Math.min(count, Math.max(0, Math.floor((frame - step(from)) / Math.max(1, Math.floor((dur * span) / count))) + 1));

  if (unit.mode === "order-integers") {
    const marks = ADV.integers;
    const sorted = [...marks].sort((a, b) => a - b);
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(marks.length) : marks.length;
    const headline =
      sceneId === "ask" ? `Order: ${marks.join(",  ")}` : sceneId === "work" ? "Every integer has an address" : sceneId === "twist" ? "Left = smaller" : sorted.join("  <  ");
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
        <Title text={headline} enter={title} />
        <IntLine lo={-5} hi={6} marks={sceneId === "work" ? marks : sorted} shown={shown} />
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "order-ops") {
    const { a, b, c } = ADV.orderOps;
    const right = a + b * c;
    const wrong = (a + b) * c;
    const headline =
      sceneId === "ask" ? `${a} + ${b} × ${c} = ?` : sceneId === "work" ? "Two paths — one rule" : sceneId === "twist" ? `${right} is right · brackets make ${wrong}` : "× and ÷ before + and −";
    const showPaths = sceneId !== "ask";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
        <Title text={headline} enter={title} />
        {showPaths && (
          <div style={{ display: "flex", gap: 70 }}>
            <div style={{ textAlign: "center" }}>
              <Card colour={RED}>
                ({a} + {b}) × {c} = {wrong}
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: RED, marginTop: 12 }}>
                {sceneId === "twist" || sceneId === "record" ? "only with brackets" : "left to right ✗"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Card colour={GREEN}>
                {a} + ({b} × {c}) = {right}
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 12 }}>multiply first ✓</div>
            </div>
          </div>
        )}
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "complex") {
    const { a, b, c, d } = ADV.complex;
    const showSum = sceneId === "twist" || sceneId === "record";
    const arrows = [
      { from: [0, 0] as [number, number], to: [a, b] as [number, number], colour: BLUE },
      ...(showSum
        ? [
            { from: [a, b] as [number, number], to: [a + c, b + d] as [number, number], colour: GOLD },
            { from: [0, 0] as [number, number], to: [a + c, b + d] as [number, number], colour: GREEN },
          ]
        : []),
    ];
    const labels = [
      { at: [a, b] as [number, number], text: `${a} + ${b}i`, colour: BLUE },
      ...(showSum ? [{ at: [a + c, b + d] as [number, number], text: `${a + c} + ${b + d}i`, colour: GREEN }] : []),
    ];
    const headline =
      sceneId === "ask" ? `${a} + ${b}i — just a point` : sceneId === "work" ? "Real across · imaginary up" : sceneId === "twist" ? `+ (${c} + ${d}i) — parts add` : `${a + c} + ${b + d}i`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <Plane arrows={sceneId === "ask" ? [] : arrows} labels={sceneId === "ask" ? [] : labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "sequence") {
    const { start, step: hop, terms } = ADV.seq;
    const seq = Array.from({ length: terms }, (_, i) => start + i * hop);
    const sums = seq.map((_, i) => seq.slice(0, i + 1).reduce((x, y) => x + y, 0));
    const isSeries = sceneId === "twist" || sceneId === "record";
    const shown = sceneId === "ask" ? terms : sceneId === "work" ? reveal(terms + 1) : terms;
    const headline =
      sceneId === "ask" ? `${seq.join(",  ")},  …` : sceneId === "work" ? `Same hop every time: +${hop}` : sceneId === "twist" ? "Now ADD them up — a series" : "Sequence lists · series adds";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
          {seq.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 34, alignItems: "center", opacity: i < shown ? 1 : 0.12 }}>
              {i > 0 && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD }}>+{hop}→</div>}
              <div style={{ textAlign: "center" }}>
                <Card colour={BLUE}>{v}</Card>
                {isSeries && <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 10 }}>Σ {sums[i]}</div>}
              </div>
            </div>
          ))}
          {sceneId === "work" && shown > terms && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD }}>+{hop}→ {seq[terms - 1] + hop}</div>}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "vectors") {
    const { v1, v2 } = ADV.vec;
    const s: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];
    const showSecond = sceneId !== "ask";
    const showSum = sceneId === "twist" || sceneId === "record";
    const arrows = [
      { from: [0, 0] as [number, number], to: v1, colour: BLUE },
      ...(showSecond ? [{ from: v1, to: s, colour: GOLD }] : []),
      ...(showSum ? [{ from: [0, 0] as [number, number], to: s, colour: GREEN }] : []),
    ];
    const labels = [
      { at: v1, text: `(${v1[0]}, ${v1[1]})`, colour: BLUE },
      ...(showSum ? [{ at: s, text: `(${s[0]}, ${s[1]})`, colour: GREEN }] : []),
    ];
    const headline =
      sceneId === "ask" ? `An arrow: ${v1[0]} across, ${v1[1]} up` : sceneId === "work" ? "Add tip to tail" : sceneId === "twist" ? `(${v1[0]}+${v2[0]}, ${v1[1]}+${v2[1]}) = (${s[0]}, ${s[1]})` : "Components just add";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <Plane arrows={arrows} labels={labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // Calculus card modes: power-rule, monomials, applications.
  {
    const rows =
      unit.mode === "power-rule"
        ? [
            { from: "x³", to: "3x²", note: "down in front · drop by one" },
            { from: "x⁵", to: "5x⁴", note: "same two moves" },
          ]
        : unit.mode === "monomials"
          ? [
              { from: "5x³", to: "15x²", note: "5 × 3 = 15 in front" },
            ]
          : [
              { from: "s = t²", to: "v = 2t", note: "differentiate position" },
              { from: "t = 3", to: `v = ${2 * ADV.app.t}`, note: "metres per second" },
            ];
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(rows.length) : rows.length;
    const headlines: Record<string, Record<string, string>> = {
      "power-rule": { ask: "A two-move rule", work: "Down in front… drop by one", twist: "Any power, same moves", record: "d/dx xⁿ = n·xⁿ⁻¹" },
      monomials: { ask: "5x³ — what about the 5?", work: "The coefficient rides along", twist: "5 × 3 = 15, exponent drops", record: "k·xⁿ → k·n·xⁿ⁻¹" },
      applications: { ask: "How fast at 3 seconds?", work: "Speed IS the derivative", twist: `v = 2 × 3 = ${2 * ADV.app.t} m/s`, record: "Position → speed" },
    };
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headlines[unit.mode][sceneId] ?? ""} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 30, alignItems: "center", opacity: i < shown || sceneId === "ask" ? 1 : 0.12 }}>
              <Card colour={BLUE} dim={sceneId === "ask"}>{r.from}</Card>
              <div style={{ fontSize: 52, fontWeight: 800, color: GOLD }}>→</div>
              <Card colour={GREEN} dim={sceneId === "ask"}>{r.to}</Card>
              <div style={{ fontSize: 32, fontWeight: 700, color: MUTED, maxWidth: 360 }}>{sceneId === "ask" ? "" : r.note}</div>
            </div>
          ))}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }
}

export const AdvancedVideo: React.FC<AdvancedProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = advancedUnitById(unitId);
  const scenes = advancedSceneTimings(unitId, voice);
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
