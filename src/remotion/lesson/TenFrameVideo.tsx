// src/remotion/lesson/TenFrameVideo.tsx
// The TEN-FRAME template: addition and subtraction facts, where the strategy
// is something you WATCH rather than something you're told.
//
// A ten-frame is two rows of five. Its power is that "how far from ten" is
// visible at a glance — the empty cells ARE the gap. So for 8 + 5, two dots
// physically slide out of the five and into the empty cells to complete the
// ten; what's left over is the answer's ones digit. Doubles get mirrored rows
// so the symmetry is the memory hook; near-doubles show the double you know
// and then one extra dot arriving.
//
// Blocks move — nothing vanishes and reappears — and a live total counts as
// they land, the same rule as the base-ten template.
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
import { tenFrameSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { tenFrameUnitById, type TenFrameUnit } from "./units";

export { FPS } from "./timeline";

export type TenFrameProps = {
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
const FRAME_LINE = "#C9BCA0";

// ---- geometry -------------------------------------------------------------
const CELL = 96;
const CELL_GAP = 8;
const DOT = 66;
const FRAME_W = 5 * CELL + 4 * CELL_GAP;
const FRAME_H = 2 * CELL + CELL_GAP;

const STAGE_W = 1640;
const STAGE_H = 620;

const FRAME_X = 40;
const FRAME_Y = 60;
const FRAME2_X = FRAME_X + FRAME_W + 90; // second ten-frame, for totals past 10
const LOOSE_X = FRAME_X + FRAME_W + 90; // where the second addend waits
const LOOSE_Y = FRAME_Y + FRAME_H + 120;

/** Centre of cell `i` (0-9) of the frame whose top-left is (fx, fy). */
function cellPos(i: number, fx: number, fy: number) {
  const col = i % 5;
  const row = Math.floor(i / 5);
  return {
    x: fx + col * (CELL + CELL_GAP) + (CELL - DOT) / 2,
    y: fy + row * (CELL + CELL_GAP) + (CELL - DOT) / 2,
  };
}

/** Loose dots waiting below, in a row of five. */
function loosePos(i: number) {
  return {
    x: LOOSE_X + (i % 5) * (CELL + CELL_GAP) + (CELL - DOT) / 2,
    y: LOOSE_Y + Math.floor(i / 5) * (CELL + CELL_GAP) + (CELL - DOT) / 2,
  };
}

const offStage = (from: { x: number; y: number }) => ({ x: from.x, y: STAGE_H + 160 });

interface SceneProps {
  dur: number;
  unit: TenFrameUnit;
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

/** The empty grid: ten cells, so "how many missing" is readable at a glance. */
function FrameGrid({ x, y, dim = false }: { x: number; y: number; dim?: boolean }) {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + col * (CELL + CELL_GAP),
              top: y + row * (CELL + CELL_GAP),
              width: CELL,
              height: CELL,
              borderRadius: 10,
              border: `3px solid ${FRAME_LINE}`,
              opacity: dim ? 0.45 : 1,
            }}
          />
        );
      })}
    </>
  );
}

interface Move {
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
  travel?: number;
}

function Dot(props: Move & { color?: string; appearAt?: number }) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [props.at, props.at + (props.travel ?? 18)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const x = props.from.x + (props.to.x - props.from.x) * t;
  const y = props.from.y + (props.to.y - props.from.y) * t;
  const appearing =
    props.appearAt === undefined
      ? 1
      : interpolate(frame, [props.appearAt, props.appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  // Dots on their way off the stage fade as they go, so they don't sail
  // straight through the running total on the way down.
  const leaving = props.to.y >= STAGE_H ? 1 - t * 0.95 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: DOT,
        height: DOT,
        borderRadius: "50%",
        backgroundColor: props.color ?? GOLD,
        opacity: appearing * leaving,
      }}
    />
  );
}

/** Running total under the stage; flashes green the frame it changes. */
function Total({ value, changedAt, label }: { value: number; changedAt: number | null; label?: string }) {
  const frame = useCurrentFrame();
  const flash =
    changedAt === null
      ? 0
      : interpolate(frame, [changedAt, changedAt + 12], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div style={{ position: "absolute", left: 0, top: STAGE_H - 90, width: STAGE_W, textAlign: "center" }}>
      <span
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: flash > 0.05 ? GREEN : INK,
          scale: String(1 + flash * 0.16),
          display: "inline-block",
        }}
      >
        {value}
      </span>
      {label && <span style={{ fontSize: 46, color: MUTED, fontWeight: 700, marginLeft: 16 }}>{label}</span>}
    </div>
  );
}

/** How many dots a group has so far, sitting under that group. */
function GroupLabel({
  value,
  x,
  y,
  visible,
  color = INK,
}: {
  value: number;
  x: number;
  y: number;
  visible: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: FRAME_W,
        textAlign: "center",
        fontSize: 78,
        fontWeight: 800,
        color,
        opacity: visible ? 1 : 0,
      }}
    >
      {value}
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question ------------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(38);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 190,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {unit.x} {unit.op} {unit.y}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {unit.op === "+" ? "Let's use a ten-frame." : "Let's take them off a ten-frame."}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build ------------------------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const still = (p: { x: number; y: number }) => ({ from: p, to: p, at: 0 });
  const firstAt = 16;
  const secondAt = Math.round(dur * 0.52);
  // x fills the frame(s); y waits below (addition) or is what we remove.
  const xInFrame2 = Math.max(0, unit.x - 10);
  const landed = Math.max(0, Math.min(unit.x, Math.floor((frame - firstAt - 8) / 4) + 1));
  const landedY = Math.max(0, Math.min(unit.y, Math.floor((frame - secondAt - 8) / 4) + 1));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.op === "+" ? `${unit.x}, and ${unit.y} more` : `${unit.x} to start with`}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        {unit.x > 10 && <FrameGrid x={FRAME2_X} y={FRAME_Y} />}
        {Array.from({ length: Math.min(unit.x, 10) }, (_, i) => (
          <Dot key={`x${i}`} {...still(cellPos(i, FRAME_X, FRAME_Y))} appearAt={firstAt + i * 4} />
        ))}
        {Array.from({ length: xInFrame2 }, (_, i) => (
          <Dot
            key={`x2${i}`}
            {...still(cellPos(i, FRAME2_X, FRAME_Y))}
            appearAt={firstAt + (10 + i) * 4}
          />
        ))}
        {unit.op === "+" &&
          Array.from({ length: unit.y }, (_, i) => (
            <Dot key={`y${i}`} {...still(loosePos(i))} color={BLUE} appearAt={secondAt + i * 4} />
          ))}
        {/* Each group is labelled SEPARATELY here. A combined running total
            during the build showed 13 before a single dot had moved — giving
            away the answer the strategy scene is supposed to arrive at. */}
        <GroupLabel value={landed} x={FRAME_X} y={FRAME_Y + FRAME_H + 18} visible={landed > 0} />
        {unit.op === "+" && (
          <GroupLabel
            value={landedY}
            x={LOOSE_X}
            y={LOOSE_Y + CELL + 18}
            visible={landedY > 0}
            color={BLUE}
          />
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the strategy ------------------------------------------------
function SceneStrategy(props: SceneProps) {
  // The unit's own strategy drives the animation. Running make-ten on a
  // doubles fact taught the wrong thing AND contradicted its narration.
  if (props.unit.strategy === "doubles") return <SceneDoubles {...props} />;
  if (props.unit.strategy === "turnaround") return <SceneTurnaround {...props} />;
  return props.unit.op === "+" ? <SceneAdd {...props} /> : <SceneSubtract {...props} />;
}

/** Turnaround: the two groups physically trade places and the total doesn't
 *  budge — "3 + 8 is the same as 8 + 3" shown rather than asserted. */
function SceneTurnaround({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const total = unit.x + unit.y;
  const settleAt = Math.round(dur * 0.18);
  const swapAt = Math.round(dur * 0.5);
  const travel = 24;
  const swapped = frame >= swapAt + travel * 0.9;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {swapped ? `${unit.y} + ${unit.x} — the same` : `${unit.x} + ${unit.y}`}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        <FrameGrid x={FRAME2_X} y={FRAME_Y} />
        {/* x starts left, ends right */}
        {Array.from({ length: unit.x }, (_, i) => (
          <Dot
            key={`x${i}`}
            from={cellPos(i, FRAME_X, FRAME_Y)}
            to={cellPos(i, FRAME2_X, FRAME_Y)}
            at={swapAt}
            travel={travel}
          />
        ))}
        {/* y starts below, settles right, then swaps left */}
        {Array.from({ length: unit.y }, (_, i) => (
          <Dot
            key={`y${i}`}
            from={frame < swapAt ? loosePos(i) : cellPos(i, FRAME2_X, FRAME_Y)}
            to={frame < swapAt ? cellPos(i, FRAME2_X, FRAME_Y) : cellPos(i, FRAME_X, FRAME_Y)}
            at={frame < swapAt ? settleAt + i * 3 : swapAt}
            travel={frame < swapAt ? 16 : travel}
            color={BLUE}
          />
        ))}
        {/* Counts up as the second group settles, then holds through the swap —
            the total NOT changing while the dots move sides is the whole
            point. Showing the finished total from frame 0 gave the answer away
            before anything happened. */}
        <Total
          value={
            frame >= swapAt
              ? total
              : unit.x +
                Array.from({ length: unit.y }, (_, i) => settleAt + i * 3 + 16 * 0.8).filter(
                  (t) => frame >= t,
                ).length
          }
          changedAt={swapped ? swapAt + travel : null}
        />
      </Stage>
      {swapped && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          same dots — still {total}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Doubles: the second number lands in its OWN frame, in the identical shape,
 *  so the two are visibly the same — that symmetry is the memory hook. */
function SceneDoubles({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const total = unit.x + unit.y;
  const moveAt = Math.round(dur * 0.24);
  const travel = 18;
  const stagger = 4;
  const landed = Array.from({ length: unit.y }, (_, i) => moveAt + i * stagger + travel * 0.8).filter(
    (t) => frame >= t,
  ).length;
  const value = unit.x + landed;
  const lastTick = landed > 0 ? moveAt + (landed - 1) * stagger + travel * 0.8 : null;
  const near = unit.x !== unit.y; // near-double: one extra beyond the double
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {near ? `${unit.x} + ${unit.x} — then one more` : "The same twice"}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        <FrameGrid x={FRAME2_X} y={FRAME_Y} />
        {Array.from({ length: unit.x }, (_, i) => (
          <Dot key={`x${i}`} from={cellPos(i, FRAME_X, FRAME_Y)} to={cellPos(i, FRAME_X, FRAME_Y)} at={0} />
        ))}
        {Array.from({ length: unit.y }, (_, i) => (
          <Dot
            key={`y${i}`}
            from={loosePos(i)}
            // Same cell index as the first frame → identical shape, mirrored.
            to={cellPos(i, FRAME2_X, FRAME_Y)}
            at={moveAt + i * stagger}
            travel={travel}
            // The extra dot of a near-double is marked, so "the double you
            // know, plus one" is visible rather than merely asserted.
            color={near && i >= unit.x ? GREEN : BLUE}
          />
        ))}
        <Total value={value} changedAt={lastTick} />
      </Stage>
      {value === total && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          {near
            ? `${unit.x} + ${unit.x} is ${unit.x * 2}, and one more is ${total}`
            : `${unit.x} twice — that's ${total}`}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Addition: fill the ten first, then the rest — the make-ten move made literal. */
function SceneAdd({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const total = unit.x + unit.y;
  const gap = Math.max(0, 10 - unit.x); // empty cells in the first frame
  const fillers = Math.min(gap, unit.y); // dots that complete the ten
  const rest = unit.y - fillers;

  const fillAt = Math.round(dur * 0.2);
  const restAt = Math.round(dur * 0.58);
  const travel = 18;
  const stagger = 4;

  const filled = Array.from({ length: fillers }, (_, i) => fillAt + i * stagger + travel * 0.8).filter(
    (t) => frame >= t,
  ).length;
  const rested = Array.from({ length: rest }, (_, i) => restAt + i * stagger + travel * 0.8).filter(
    (t) => frame >= t,
  ).length;
  const value = unit.x + filled + rested;
  const lastTick =
    rested > 0
      ? restAt + (rested - 1) * stagger + travel * 0.8
      : filled > 0
        ? fillAt + (filled - 1) * stagger + travel * 0.8
        : null;
  const tenMade = fillers > 0 && filled >= fillers;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {gap > 0 && gap <= unit.y ? "Fill the ten first" : "Add them on"}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        <FrameGrid x={FRAME2_X} y={FRAME_Y} dim={!tenMade && rest === 0} />
        {/* x's dots, already seated */}
        {Array.from({ length: Math.min(unit.x, 10) }, (_, i) => (
          <Dot key={`x${i}`} from={cellPos(i, FRAME_X, FRAME_Y)} to={cellPos(i, FRAME_X, FRAME_Y)} at={0} />
        ))}
        {/* y's dots: the first `fillers` complete the ten, the rest go next door */}
        {Array.from({ length: unit.y }, (_, i) => {
          const isFiller = i < fillers;
          const to = isFiller
            ? cellPos(unit.x + i, FRAME_X, FRAME_Y)
            : cellPos(i - fillers, FRAME2_X, FRAME_Y);
          return (
            <Dot
              key={`y${i}`}
              from={loosePos(i)}
              to={to}
              at={isFiller ? fillAt + i * stagger : restAt + (i - fillers) * stagger}
              travel={travel}
              color={isFiller ? GREEN : BLUE}
            />
          );
        })}
        <Total value={value} changedAt={lastTick} />
      </Stage>
      {/* Only once EVERY dot has landed — this line states the conclusion, and
          showing it while dots are still travelling announces the answer
          before the picture has finished making it. */}
      {tenMade && value === total && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          10 and {total - 10} — that&apos;s {total}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Subtraction: take dots off, back down through the ten. */
function SceneSubtract({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const extras = Math.max(0, unit.x - 10); // dots sitting above ten
  const firstOff = Math.min(extras, unit.y); // getting back down to ten
  const thenOff = unit.y - firstOff;

  const firstAt = Math.round(dur * 0.2);
  const secondAt = Math.round(dur * 0.58);
  const travel = 18;
  const stagger = 4;

  const goneA = Array.from({ length: firstOff }, (_, i) => firstAt + i * stagger + travel * 0.4).filter(
    (t) => frame >= t,
  ).length;
  const goneB = Array.from({ length: thenOff }, (_, i) => secondAt + i * stagger + travel * 0.4).filter(
    (t) => frame >= t,
  ).length;
  const value = unit.x - goneA - goneB;
  const lastTick =
    goneB > 0
      ? secondAt + (goneB - 1) * stagger + travel * 0.4
      : goneA > 0
        ? firstAt + (goneA - 1) * stagger + travel * 0.4
        : null;
  const atTen = firstOff > 0 && goneA >= firstOff && goneB === 0;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {firstOff > 0 && thenOff > 0 ? "Down to ten first" : `Take ${unit.y} off`}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        {extras > 0 && <FrameGrid x={FRAME2_X} y={FRAME_Y} />}
        {/* Dots leave from the top down: the extras above ten go first. */}
        {Array.from({ length: unit.x }, (_, i) => {
          const inSecond = i >= 10;
          const pos = inSecond ? cellPos(i - 10, FRAME2_X, FRAME_Y) : cellPos(i, FRAME_X, FRAME_Y);
          const removalIdx = unit.x - 1 - i; // highest index leaves first
          const isFirstBatch = removalIdx < firstOff;
          const isSecondBatch = removalIdx >= firstOff && removalIdx < unit.y;
          if (isFirstBatch) {
            return (
              <Dot
                key={`d${i}`}
                from={pos}
                to={offStage(pos)}
                at={firstAt + removalIdx * stagger}
                travel={travel + 6}
                color={GREEN}
              />
            );
          }
          if (isSecondBatch) {
            return (
              <Dot
                key={`d${i}`}
                from={pos}
                to={offStage(pos)}
                at={secondAt + (removalIdx - firstOff) * stagger}
                travel={travel + 6}
                color={BLUE}
              />
            );
          }
          return <Dot key={`d${i}`} from={pos} to={pos} at={0} />;
        })}
        <Total value={value} changedAt={lastTick} />
      </Stage>
      {atTen && <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>down to 10</div>}
    </AbsoluteFill>
  );
}

// ---- Scene 4: the fact, written ------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const answer = unit.op === "+" ? unit.x + unit.y : unit.x - unit.y;
  const answerAt = Math.round(dur * 0.3);
  const tipAt = Math.round(dur * 0.6);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        The fact
      </div>
      <div style={{ fontSize: 170, fontWeight: 800, color: INK }}>
        {unit.x} {unit.op} {unit.y} ={" "}
        <span
          style={{
            opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {answer}
        </span>
      </div>
      <div
        style={{
          fontSize: 58,
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
  strategy: SceneStrategy,
  record: SceneRecord,
};

export const TenFrameVideo: React.FC<TenFrameProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = tenFrameUnitById(unitId);
  const scenes = tenFrameSceneTimings(unitId, voice);
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
    </AbsoluteFill>
  );
};
