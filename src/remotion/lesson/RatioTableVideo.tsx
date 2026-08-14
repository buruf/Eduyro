// src/remotion/lesson/RatioTableVideo.tsx
// The RATIO TABLE template (M9): a ratio is a pair that keeps its shape.
//
// The table makes "scale both sides by the same number" literal — a new column
// appears, both rows grow together, and the picture of counters beneath grows
// in step. Unit rate is the same table run DOWNWARD until one row reads 1,
// which is exactly why "per one" is the comparable form.
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
import { ratioSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { ratioUnitById, type RatioUnit } from "./units";

export { FPS } from "./timeline";

export type RatioProps = {
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
const LINE = "#C9BCA0";

const STAGE_W = 1500;
const STAGE_H = 560;

interface SceneProps {
  dur: number;
  unit: RatioUnit;
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

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 82,
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

const COL_W = 230;
const ROW_H = 110;
const TABLE_X = 300;
const TABLE_Y = 40;

/** The two-row table. `cols` are [top, bottom] pairs, revealed one at a time. */
function Table({
  cols,
  aName,
  bName,
  revealAt,
  perCol = 30,
  highlightLast = false,
}: {
  cols: [number, number][];
  aName: string;
  bName: string;
  revealAt: number;
  perCol?: number;
  highlightLast?: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <>
      {/* row labels */}
      <div
        style={{
          position: "absolute",
          left: TABLE_X - 250,
          top: TABLE_Y + 26,
          width: 230,
          textAlign: "right",
          fontSize: 46,
          fontWeight: 700,
          color: GOLD,
        }}
      >
        {aName}
      </div>
      <div
        style={{
          position: "absolute",
          left: TABLE_X - 250,
          top: TABLE_Y + ROW_H + 26,
          width: 230,
          textAlign: "right",
          fontSize: 46,
          fontWeight: 700,
          color: BLUE,
        }}
      >
        {bName}
      </div>
      {cols.map(([a, b], i) => {
        const at = revealAt + i * perCol;
        const o = interpolate(frame, [at, at + 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isLast = highlightLast && i === cols.length - 1;
        return (
          <div key={i} style={{ opacity: o }}>
            {[a, b].map((v, r) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: TABLE_X + i * COL_W,
                  top: TABLE_Y + r * ROW_H,
                  width: COL_W - 12,
                  height: ROW_H - 12,
                  border: `3px solid ${LINE}`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 62,
                  fontWeight: 800,
                  color: isLast ? GREEN : r === 0 ? GOLD : BLUE,
                  backgroundColor: isLast ? "rgba(47,125,79,0.08)" : "transparent",
                }}
              >
                {v}
              </div>
            ))}
            {/* Multiplier from the BASE column, not the previous one: the
                columns are ×1, ×2, ×3 of the base, so consecutive steps are
                ×2 then ×1.5 — labelling those would contradict the narration
                ("times 2… times 3") and misstate the maths. */}
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: TABLE_X + i * COL_W - 118,
                  top: TABLE_Y + ROW_H - 34,
                  width: 110,
                  textAlign: "center",
                  fontSize: 40,
                  fontWeight: 800,
                  color: GREEN,
                }}
              >
                ×{a / cols[0][0]}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/** Counters under the table, so the table's numbers stay attached to things. */
function Counters({ a, b, revealAt }: { a: number; b: number; revealAt: number }) {
  const frame = useCurrentFrame();
  const dot = a + b > 24 ? 22 : 34;
  const gap = 8;
  const row = (n: number, colour: string, y: number) =>
    Array.from({ length: n }, (_, i) => (
      <div
        key={colour + i}
        style={{
          position: "absolute",
          left: TABLE_X + (i % 18) * (dot + gap),
          top: y + Math.floor(i / 18) * (dot + gap),
          width: dot,
          height: dot,
          borderRadius: "50%",
          backgroundColor: colour,
          opacity: interpolate(frame, [revealAt + i * 2, revealAt + i * 2 + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    ));
  return (
    <>
      {row(a, GOLD, TABLE_Y + 2 * ROW_H + 40)}
      {row(b, BLUE, TABLE_Y + 2 * ROW_H + 40 + Math.ceil(a / 18) * (dot + gap) + 14)}
    </>
  );
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const big =
    unit.mode === "unit-rate"
      ? `${unit.a} for ${unit.b}`
      : unit.mode === "proportion"
        ? `${unit.a}/${unit.b}  =  ?/${unit.b * (unit.scale ?? 3)}`
        : `${unit.a} : ${unit.b}`;
  const sub =
    unit.mode === "unit-rate"
      ? "How much is that each?"
      : unit.mode === "proportion"
        ? "Fill in the missing one."
        : "What IS a ratio?";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK, opacity: a.opacity, translate: `0 ${a.translateY}px` }}>
        {big}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>{sub}</div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the base pair ----------------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const title = useEnter(4);
  const at = Math.round(dur * 0.2);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Title text={`${unit.a} ${unit.aName} to ${unit.b} ${unit.bName}`} enter={title} />
      <Stage>
        <Table cols={[[unit.a, unit.b]]} aName={unit.aName} bName={unit.bName} revealAt={at} />
        <Counters a={unit.a} b={unit.b} revealAt={at + 16} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: scale it ----------------------------------------------------
function SceneScale({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const at = Math.round(dur * 0.16);

  if (unit.mode === "unit-rate") {
    // Scale DOWN to one: two columns, the second being the per-one pair.
    const per = unit.a / unit.b;
    const shown = frame >= at + 30;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Title text={`Divide both by ${unit.b}`} enter={title} />
        <Stage>
          <Table
            cols={shown ? [[unit.a, unit.b], [per, 1]] : [[unit.a, unit.b]]}
            aName={unit.aName}
            bName={unit.bName}
            revealAt={at}
            perCol={30}
            highlightLast={shown}
          />
          {shown && (
            <div
              style={{
                position: "absolute",
                left: TABLE_X + COL_W - 118,
                top: TABLE_Y + ROW_H - 34,
                width: 110,
                textAlign: "center",
                fontSize: 40,
                fontWeight: 800,
                color: GREEN,
              }}
            >
              ÷{unit.b}
            </div>
          )}
          <Counters a={unit.a} b={unit.b} revealAt={-100} />
        </Stage>
      </AbsoluteFill>
    );
  }

  const s = unit.scale ?? 3;
  const steps: [number, number][] = [
    [unit.a, unit.b],
    [unit.a * 2, unit.b * 2],
    [unit.a * s, unit.b * s],
  ];
  const shownCols = Math.max(1, Math.min(steps.length, Math.floor((frame - at) / 34) + 1));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Title text="Multiply BOTH rows by the same number" enter={title} />
      <Stage>
        <Table
          cols={steps.slice(0, shownCols)}
          aName={unit.aName}
          bName={unit.bName}
          revealAt={at}
          perCol={34}
          highlightLast={shownCols === steps.length}
        />
        <Counters
          a={steps[shownCols - 1][0]}
          b={steps[shownCols - 1][1]}
          revealAt={at + (shownCols - 1) * 34}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.55);
  const s = unit.scale ?? 3;
  const main =
    unit.mode === "unit-rate" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        <span style={{ color: GREEN }}>{unit.a / unit.b}</span> {unit.aName} per{" "}
        {unit.bName.replace(/s$/, "")}
      </div>
    ) : unit.mode === "proportion" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        {unit.a}/{unit.b} = <span style={{ color: GREEN }}>{unit.a * s}</span>/{unit.b * s}
      </div>
    ) : (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        {unit.a} : {unit.b} = <span style={{ color: GREEN }}>{unit.a * s} : {unit.b * s}</span>
      </div>
    );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title text={unit.mode === "unit-rate" ? "The unit rate" : "Same ratio"} enter={title} />
      {main}
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

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  scale: SceneScale,
  record: SceneRecord,
};

export const RatioTableVideo: React.FC<RatioProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = ratioUnitById(unitId);
  const scenes = ratioSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const Body = SCENE_BODIES[scene.id];
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
