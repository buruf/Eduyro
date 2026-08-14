// src/remotion/lesson/FractionBarVideo.tsx
// The FRACTION BAR template (M7): one bar, cut into EQUAL parts.
//
// Four modes on one picture:
//   identify — cut, cross out an unequal cut, shade, name it
//   compare  — two same-length bars; the longer shading wins
//   add      — same-size pieces just count up; the bottom number stays
//   simplify — cuts are erased while THE SHADING NEVER MOVES, which is the
//              entire proof of 4/8 = 2/4 = 1/2 in one motion
//
// The unequal-cut counterexample is deliberate: "equal parts" is the
// load-bearing idea of fractions and the one most teaching skips past.
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
import { fractionBarSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { fractionBarUnitById, type FractionBarUnit } from "./units";

export { FPS } from "./timeline";

export type FractionBarProps = {
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
const EDGE = "#8A5E10";

const STAGE_W = 1500;
const STAGE_H = 520;
const BAR_W = 1200;
const BAR_H = 130;
const BAR_X = (STAGE_W - BAR_W) / 2;

interface SceneProps {
  dur: number;
  unit: FractionBarUnit;
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

/**
 * A bar cut into `parts`, with `shaded` of them filled (first `goldUpTo` in
 * gold, the rest of the shading in blue — used by the add mode to show the
 * arriving addend). `cutsShown` limits how many interior cuts are drawn, which
 * is what lets simplify ERASE cuts while the shading stays put.
 */
function Bar({
  y,
  parts,
  shaded,
  goldUpTo = Infinity,
  cutsShown = Infinity,
  shadeRevealAt = -1,
  shadeStagger = 8,
  color = GOLD,
}: {
  y: number;
  parts: number;
  shaded: number;
  goldUpTo?: number;
  cutsShown?: number;
  shadeRevealAt?: number;
  shadeStagger?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const cellW = BAR_W / parts;
  return (
    <>
      {/* outline */}
      <div
        style={{
          position: "absolute",
          left: BAR_X,
          top: y,
          width: BAR_W,
          height: BAR_H,
          border: `4px solid ${EDGE}`,
          borderRadius: 12,
        }}
      />
      {/* shading */}
      {Array.from({ length: shaded }, (_, i) => {
        const revealed =
          shadeRevealAt < 0 || frame >= shadeRevealAt + i * shadeStagger;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: BAR_X + i * cellW + 4,
              top: y + 4,
              width: cellW - 8,
              height: BAR_H - 8,
              borderRadius: 8,
              backgroundColor: i < goldUpTo ? color : BLUE,
              opacity: revealed
                ? interpolate(
                    frame,
                    [shadeRevealAt + i * shadeStagger, shadeRevealAt + i * shadeStagger + 8],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )
                : shadeRevealAt < 0
                  ? 1
                  : 0,
            }}
          />
        );
      })}
      {/* interior cuts */}
      {Array.from({ length: parts - 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: BAR_X + (i + 1) * cellW - 2,
            top: y,
            width: 4,
            height: BAR_H,
            backgroundColor: EDGE,
            opacity: i < cutsShown ? 1 : 0,
            transition: undefined,
          }}
        />
      ))}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 84,
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

/** Big fraction, drawn as an actual stack — a child should see the BAR in it. */
function Frac({ n, d, size = 150, color = INK }: { n: number; d: number; size?: number; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: size * 0.62,
        fontWeight: 800,
        color,
        lineHeight: 1.05,
        verticalAlign: "middle",
      }}
    >
      <span>{n}</span>
      <span style={{ width: size * 0.5, height: Math.max(6, size * 0.045), backgroundColor: color, borderRadius: 4 }} />
      <span>{d}</span>
    </span>
  );
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const ask =
    unit.mode === "compare"
      ? "Which is bigger?"
      : unit.mode === "add"
        ? "Adding fractions"
        : unit.mode === "simplify"
          ? "Say it more simply"
          : "What does this mean?";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40, opacity: a.opacity, translate: `0 ${a.translateY}px` }}>
        <Frac n={unit.n} d={unit.d} size={220} />
        {unit.mode === "compare" && (
          <>
            <span style={{ fontSize: 120, fontWeight: 800, color: MUTED }}>vs</span>
            <Frac n={unit.n2 ?? 1} d={unit.d2 ?? 2} size={220} />
          </>
        )}
        {unit.mode === "add" && (
          <>
            <span style={{ fontSize: 140, fontWeight: 800, color: INK }}>+</span>
            <Frac n={unit.n2 ?? 1} d={unit.d} size={220} />
          </>
        )}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {ask}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the parts ---------------------------------------------------
function SceneParts({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const cutAt = Math.round(dur * 0.2);
  const cutStagger = 10;
  const cutsShown = Math.max(0, Math.floor((frame - cutAt) / cutStagger));
  const wrongAt = Math.round(dur * 0.62);

  if (unit.mode === "compare") {
    const shadeAt = Math.round(dur * 0.3);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text="Two bars, the same length" enter={title} />
        <Stage>
          <Bar y={70} parts={unit.d} shaded={unit.n} cutsShown={cutsShown} shadeRevealAt={shadeAt} />
          <Bar
            y={300}
            parts={unit.d2 ?? 2}
            shaded={unit.n2 ?? 1}
            cutsShown={cutsShown}
            shadeRevealAt={shadeAt + 40}
            color={BLUE}
            goldUpTo={0}
          />
        </Stage>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Title
        text={
          unit.mode === "identify"
            ? `Cut it into ${unit.d} EQUAL parts`
            : `A bar in ${unit.d} equal parts`
        }
        enter={title}
      />
      <Stage>
        <Bar
          y={60}
          parts={unit.d}
          shaded={unit.mode === "identify" ? 0 : unit.n}
          cutsShown={cutsShown}
          shadeRevealAt={unit.mode === "identify" ? -1 : Math.round(dur * 0.5)}
        />
        {/* The counterexample: unequal parts crossed out. */}
        {unit.mode === "identify" && frame >= wrongAt && (
          <>
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 300,
                width: BAR_W,
                height: BAR_H,
                border: `4px solid ${EDGE}`,
                borderRadius: 12,
                opacity: 0.75,
              }}
            />
            {[0.15, 0.35, 0.85].map((f) => (
              <div
                key={f}
                style={{
                  position: "absolute",
                  left: BAR_X + f * BAR_W,
                  top: 300,
                  width: 4,
                  height: BAR_H,
                  backgroundColor: EDGE,
                  opacity: 0.75,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 296,
                width: BAR_W,
                textAlign: "center",
                fontSize: 96,
                fontWeight: 800,
                color: RED,
                opacity: interpolate(frame, [wrongAt + 12, wrongAt + 26], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              ✗ not equal parts
            </div>
          </>
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the action --------------------------------------------------
function SceneAction({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);

  if (unit.mode === "identify") {
    const shadeAt = Math.round(dur * 0.25);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text={`Shade ${unit.n} of them`} enter={title} />
        <Stage>
          <Bar y={130} parts={unit.d} shaded={unit.n} shadeRevealAt={shadeAt} shadeStagger={26} />
        </Stage>
        <div style={{ fontSize: 64, fontWeight: 800, color: GOLD }}>
          {Math.max(
            0,
            Math.min(unit.n, Math.floor((frame - shadeAt) / 26) + 1),
          )}{" "}
          of {unit.d}
        </div>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "compare") {
    const markAt = Math.round(dur * 0.4);
    const aEnd = BAR_X + (unit.n / unit.d) * BAR_W;
    const bEnd = BAR_X + ((unit.n2 ?? 1) / (unit.d2 ?? 2)) * BAR_W;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text="Where does the shading end?" enter={title} />
        <Stage>
          <Bar y={70} parts={unit.d} shaded={unit.n} />
          <Bar y={300} parts={unit.d2 ?? 2} shaded={unit.n2 ?? 1} color={BLUE} goldUpTo={0} />
          {/* drop lines from each shading edge, then the winner flag */}
          {frame >= markAt && (
            <>
              <div style={{ position: "absolute", left: aEnd - 3, top: 50, width: 6, height: 400, backgroundColor: GREEN, opacity: 0.85 }} />
              <div style={{ position: "absolute", left: bEnd - 3, top: 280, width: 6, height: 170, backgroundColor: MUTED, opacity: 0.6 }} />
              <div
                style={{
                  position: "absolute",
                  left: Math.min(aEnd + 24, STAGE_W - 320),
                  top: 96,
                  fontSize: 60,
                  fontWeight: 800,
                  color: GREEN,
                  opacity: interpolate(frame, [markAt + 10, markAt + 24], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                further →
              </div>
            </>
          )}
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "add") {
    const addAt = Math.round(dur * 0.3);
    const total = unit.n + (unit.n2 ?? 0);
    const arrived = Math.max(0, Math.min(unit.n2 ?? 0, Math.floor((frame - addAt) / 24) + 1));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text={`Add ${unit.n2} more`} enter={title} />
        <Stage>
          <Bar
            y={130}
            parts={unit.d}
            shaded={unit.n + arrived}
            goldUpTo={unit.n}
            shadeRevealAt={-1}
          />
        </Stage>
        <div style={{ fontSize: 64, fontWeight: 800, color: INK }}>
          {unit.n + arrived} of {unit.d} shaded
          {unit.n + arrived === total ? "" : "…"}
        </div>
      </AbsoluteFill>
    );
  }

  // simplify: cuts erased in stages, shading untouched.
  const stage1At = Math.round(dur * 0.3); // 8 parts -> 4
  const stage2At = Math.round(dur * 0.68); // 4 parts -> 2
  const stage = frame >= stage2At ? 2 : frame >= stage1At ? 1 : 0;
  const parts = stage === 0 ? unit.d : stage === 1 ? unit.d / 2 : unit.d / 4;
  const shaded = stage === 0 ? unit.n : stage === 1 ? unit.n / 2 : unit.n / 4;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Title text="Watch the shading — erase the cuts" enter={title} />
      <Stage>
        <Bar y={130} parts={parts} shaded={shaded} />
      </Stage>
      <div style={{ fontSize: 64, fontWeight: 800, color: INK, display: "flex", gap: 22, alignItems: "center" }}>
        <Frac n={unit.n} d={unit.d} size={86} color={stage === 0 ? INK : MUTED} />
        <span style={{ color: MUTED }}>=</span>
        <Frac n={unit.n / 2} d={unit.d / 2} size={86} color={stage === 1 ? INK : MUTED} />
        <span style={{ color: MUTED }}>=</span>
        <Frac n={unit.n / 4} d={unit.d / 4} size={86} color={stage === 2 ? INK : MUTED} />
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.55);
  const main =
    unit.mode === "compare" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Frac n={unit.n} d={unit.d} size={190} />
        <span style={{ fontSize: 140, fontWeight: 800, color: GREEN }}>&gt;</span>
        <Frac n={unit.n2 ?? 1} d={unit.d2 ?? 2} size={190} />
      </div>
    ) : unit.mode === "add" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Frac n={unit.n} d={unit.d} size={170} />
        <span style={{ fontSize: 120, fontWeight: 800 }}>+</span>
        <Frac n={unit.n2 ?? 0} d={unit.d} size={170} />
        <span style={{ fontSize: 120, fontWeight: 800 }}>=</span>
        <Frac n={unit.n + (unit.n2 ?? 0)} d={unit.d} size={170} color={GREEN} />
      </div>
    ) : unit.mode === "simplify" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Frac n={unit.n} d={unit.d} size={170} />
        <span style={{ fontSize: 120, fontWeight: 800 }}>=</span>
        <Frac n={unit.n / 2} d={unit.d / 2} size={170} />
        <span style={{ fontSize: 120, fontWeight: 800 }}>=</span>
        <Frac n={unit.n / 4} d={unit.d / 4} size={170} color={GREEN} />
      </div>
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <Frac n={unit.n} d={unit.d} size={230} />
        <div style={{ textAlign: "left", fontSize: 52, fontWeight: 700, color: MUTED, lineHeight: 1.5 }}>
          <div>
            <span style={{ color: GOLD }}>top</span> — shaded parts
          </div>
          <div>
            <span style={{ color: EDGE }}>bottom</span> — equal parts
          </div>
        </div>
      </div>
    );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title text="The fraction" enter={title} />
      {main}
      <div
        style={{
          fontSize: 54,
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
  parts: SceneParts,
  action: SceneAction,
  record: SceneRecord,
};

export const FractionBarVideo: React.FC<FractionBarProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = fractionBarUnitById(unitId);
  const scenes = fractionBarSceneTimings(unitId, voice);
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
