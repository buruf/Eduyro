// src/remotion/lesson/HundredGridVideo.tsx
// The HUNDRED GRID template (M8): a 10×10 square where tenths are whole
// columns and hundredths are single cells.
//
//   place-value — 0.3 and 0.03 drawn side by side; the size difference IS the
//                 lesson, because "they look almost the same written down" is
//                 exactly why children conflate them
//   operations  — 0.4 + 0.25 as 40 gold cells then 25 blue ones, counted live
//   percent     — one shading, three names: 37/100, 0.37, 37%
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
import { hundredGridSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { hundredGridUnitById, type HundredGridUnit } from "./units";

export { FPS } from "./timeline";

export type HundredGridProps = {
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
  unit: HundredGridUnit;
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
 * A 10×10 grid at (x, y). Cells fill COLUMN-FIRST (cell i is column
 * floor(i/10), row i%10) so that ten consecutive fills complete a column —
 * which is what makes "a tenth is a whole column" visible while shading.
 * `fills` maps cell index → colour; `revealAt`+`stagger` animate the shading.
 */
function Grid({
  x,
  y,
  cell,
  goldCells = 0,
  blueCells = 0,
  revealAt = -1,
  stagger = 2,
  groupSize,
}: {
  x: number;
  y: number;
  cell: number;
  goldCells?: number;
  blueCells?: number;
  revealAt?: number;
  stagger?: number;
  /** Cycle gold/blue/green every `groupSize` cells (multiply mode). */
  groupSize?: number;
}) {
  const frame = useCurrentFrame();
  const gap = Math.max(3, Math.round(cell * 0.09));
  const step = cell + gap;
  return (
    <>
      {Array.from({ length: 100 }, (_, i) => {
        const col = Math.floor(i / 10);
        const row = i % 10;
        const filled = i < goldCells + blueCells;
        // groupSize cycles gold/blue/green per group — the multiply mode's
        // "another group of the same" made visible.
        const colour = groupSize
          ? [GOLD, BLUE, GREEN][Math.floor(i / groupSize) % 3]
          : i < goldCells
            ? GOLD
            : BLUE;
        const opacity =
          !filled || revealAt < 0
            ? 1
            : interpolate(frame, [revealAt + i * stagger, revealAt + i * stagger + 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + col * step,
              top: y + row * step,
              width: cell,
              height: cell,
              borderRadius: Math.max(3, cell * 0.14),
              border: `2px solid ${LINE}`,
              backgroundColor: filled ? colour : "transparent",
              opacity: filled ? opacity : 1,
            }}
          />
        );
      })}
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

const dec = (cells: number) => (cells / 100).toFixed(cells % 10 === 0 ? 1 : 2);

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const big =
    unit.mode === "place-value"
      ? `0.${unit.tenths}  vs  0.0${unit.tenths}`
      : unit.mode === "operations"
        ? `${dec(unit.aCells ?? 40)} + ${dec(unit.bCells ?? 25)}`
        : unit.mode === "subtract"
          ? `${dec(unit.aCells ?? 65)} − ${dec(unit.bCells ?? 25)}`
          : unit.mode === "multiply"
            ? `0.${unit.tenths} × ${unit.times}`
            : `${unit.pct}%`;
  const sub =
    unit.mode === "place-value"
      ? "They look almost the same…"
      : unit.mode === "operations" || unit.mode === "subtract"
        ? "Decimals — on a grid they're easy."
        : unit.mode === "multiply"
          ? "Groups of tenths."
          : "What IS a percent, really?";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK, opacity: a.opacity, translate: `0 ${a.translateY}px` }}>
        {big}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {sub}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the grid ----------------------------------------------------
function SceneGrid({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const cell = 42;
  const gridW = 10 * (cell + 4);
  const x = (STAGE_W - gridW) / 2;
  // One column lights to show "a tenth", then one lone cell for "a hundredth".
  const colAt = Math.round(dur * 0.35);
  const cellAt = Math.round(dur * 0.7);
  // Modes that shade a starting quantity here rather than teaching the anatomy.
  const preShade =
    unit.mode === "operations" || unit.mode === "subtract"
      ? (unit.aCells ?? 40)
      : unit.mode === "multiply"
        ? (unit.tenths ?? 3) * 10
        : 0;
  const isFirst = preShade === 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Title
        text={
          unit.mode === "multiply"
            ? `0.${unit.tenths} is ${unit.tenths} columns — one group`
            : preShade
              ? `${dec(preShade)} is ${preShade} cells`
              : "100 little cells"
        }
        enter={title}
      />
      <Stage>
        <Grid
          x={x}
          y={20}
          cell={cell}
          goldCells={preShade ? preShade : isFirst && frame >= colAt ? 10 : 0}
          revealAt={preShade ? Math.round(dur * 0.3) : colAt}
          stagger={preShade ? 2 : 3}
        />
        {isFirst && frame >= cellAt && (
          <div
            style={{
              position: "absolute",
              left: x + 5 * (cell + 4),
              top: 20 + 4 * (cell + 4),
              width: cell,
              height: cell,
              borderRadius: 6,
              backgroundColor: BLUE,
              opacity: interpolate(frame, [cellAt, cellAt + 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        )}
      </Stage>
      {isFirst && (
        <div style={{ fontSize: 52, fontWeight: 700, color: MUTED, display: "flex", gap: 60 }}>
          <span style={{ color: GOLD, opacity: frame >= colAt ? 1 : 0 }}>column = a tenth</span>
          <span style={{ color: BLUE, opacity: frame >= cellAt ? 1 : 0 }}>cell = a hundredth</span>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---- Scene 3: the action --------------------------------------------------
function SceneAction({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const cell = unit.mode === "place-value" ? 36 : 42;

  if (unit.mode === "place-value") {
    const t = unit.tenths ?? 3;
    const gridW = 10 * (cell + 4);
    const leftX = STAGE_W / 2 - gridW - 60;
    const rightX = STAGE_W / 2 + 60;
    const leftAt = Math.round(dur * 0.16);
    const rightAt = Math.round(dur * 0.5);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`0.${t} next to 0.0${t}`} enter={title} />
        <Stage>
          <Grid x={leftX} y={20} cell={cell} goldCells={t * 10} revealAt={leftAt} stagger={1.6} />
          <Grid x={rightX} y={20} cell={cell} goldCells={0} blueCells={t} revealAt={rightAt} stagger={8} />
          <div style={{ position: "absolute", left: leftX, top: 440, width: gridW, textAlign: "center", fontSize: 66, fontWeight: 800, color: GOLD }}>
            0.{t} = {t * 10} cells
          </div>
          <div
            style={{
              position: "absolute",
              left: rightX,
              top: 440,
              width: gridW,
              textAlign: "center",
              fontSize: 66,
              fontWeight: 800,
              color: BLUE,
              opacity: frame >= rightAt ? 1 : 0.25,
            }}
          >
            0.0{t} = {t} cells
          </div>
        </Stage>
      </AbsoluteFill>
    );
  }

  const gridW = 10 * (cell + 4);
  const x = (STAGE_W - gridW) / 2;

  if (unit.mode === "operations") {
    const a = unit.aCells ?? 40;
    const b = unit.bCells ?? 25;
    const addAt = Math.round(dur * 0.2);
    const arrived = Math.max(0, Math.min(b, Math.floor((frame - addAt) / 2) + 1));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`Now add ${dec(b)} in blue`} enter={title} />
        <Stage>
          <Grid x={x} y={20} cell={cell} goldCells={a} blueCells={arrived} revealAt={addAt} stagger={2} />
        </Stage>
        <div style={{ fontSize: 62, fontWeight: 800, color: INK }}>{a + arrived} cells shaded</div>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "subtract") {
    const a = unit.aCells ?? 65;
    const b = unit.bCells ?? 25;
    const offAt = Math.round(dur * 0.2);
    // Cells leave from the top of the shading down — goldCells shrinks, and
    // because the grid fills column-first, whole columns visibly empty out.
    const removed = Math.max(0, Math.min(b, Math.floor((frame - offAt) / 3) + 1));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`Take ${dec(b)} away`} enter={title} />
        <Stage>
          <Grid x={x} y={20} cell={cell} goldCells={a - removed} />
        </Stage>
        <div style={{ fontSize: 62, fontWeight: 800, color: INK }}>
          {a - removed} cells left{a - removed === a - b ? "" : "…"}
        </div>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "multiply") {
    const t = unit.tenths ?? 3;
    const times = unit.times ?? 3;
    const groupCells = t * 10;
    const addAt = Math.round(dur * 0.16);
    const shown = Math.max(0, Math.min(groupCells * times, Math.floor((frame - addAt) / 1.6) + 1));
    const groupsDone = Math.floor(shown / groupCells);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`${times} groups of 0.${t}`} enter={title} />
        <Stage>
          <Grid x={x} y={20} cell={cell} goldCells={shown} revealAt={addAt} stagger={1.6} groupSize={groupCells} />
        </Stage>
        <div style={{ fontSize: 62, fontWeight: 800, color: INK }}>
          {((t * Math.min(groupsDone, times)) / 10).toFixed(1)}
          {shown >= groupCells * times ? ` — ${times} groups` : "…"}
        </div>
      </AbsoluteFill>
    );
  }

  const p = unit.pct ?? 37;
  const shadeAt = Math.round(dur * 0.2);
  const shaded = Math.max(0, Math.min(p, Math.floor((frame - shadeAt) / 2) + 1));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Title text={`Shade ${p} of the 100`} enter={title} />
      <Stage>
        <Grid x={x} y={20} cell={cell} goldCells={shaded} revealAt={shadeAt} stagger={2} />
      </Stage>
      <div style={{ fontSize: 62, fontWeight: 800, color: GOLD }}>
        {shaded} cell{shaded === 1 ? "" : "s"}
        {shaded === p ? ` — ${p}%` : "…"}
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
    unit.mode === "place-value" ? (
      <div style={{ fontSize: 110, fontWeight: 800, color: INK, display: "flex", gap: 70 }}>
        <span>
          0.{unit.tenths} <span style={{ color: GOLD, fontSize: 60 }}>columns</span>
        </span>
        <span>
          0.0{unit.tenths} <span style={{ color: BLUE, fontSize: 60 }}>cells</span>
        </span>
      </div>
    ) : unit.mode === "operations" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        {dec(unit.aCells ?? 40)} + {dec(unit.bCells ?? 25)} ={" "}
        <span style={{ color: GREEN }}>{dec((unit.aCells ?? 40) + (unit.bCells ?? 25))}</span>
      </div>
    ) : unit.mode === "subtract" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        {dec(unit.aCells ?? 65)} − {dec(unit.bCells ?? 25)} ={" "}
        <span style={{ color: GREEN }}>{dec((unit.aCells ?? 65) - (unit.bCells ?? 25))}</span>
      </div>
    ) : unit.mode === "multiply" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        0.{unit.tenths} × {unit.times} ={" "}
        <span style={{ color: GREEN }}>
          {(((unit.tenths ?? 3) * (unit.times ?? 3)) / 10).toFixed(1)}
        </span>
      </div>
    ) : (
      <div style={{ fontSize: 110, fontWeight: 800, color: INK, display: "flex", gap: 66, alignItems: "center" }}>
        <span>
          {unit.pct}
          <span style={{ color: MUTED }}>/100</span>
        </span>
        <span style={{ color: MUTED }}>=</span>
        <span>{((unit.pct ?? 37) / 100).toFixed(2)}</span>
        <span style={{ color: MUTED }}>=</span>
        <span style={{ color: GREEN }}>{unit.pct}%</span>
      </div>
    );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title
        text={unit.mode === "percent" ? "Three names, one amount" : "Written down"}
        enter={title}
      />
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
  grid: SceneGrid,
  action: SceneAction,
  record: SceneRecord,
};

export const HundredGridVideo: React.FC<HundredGridProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = hundredGridUnitById(unitId);
  const scenes = hundredGridSceneTimings(unitId, voice);
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
