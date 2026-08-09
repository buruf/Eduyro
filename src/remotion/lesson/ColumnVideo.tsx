// src/remotion/lesson/ColumnVideo.tsx
// The BASE-TEN BLOCKS template: what carrying and borrowing actually are.
//
// The blocks MOVE — nothing vanishes and reappears. In addition, the second
// number's blocks travel up and join the first's columns; in subtraction the
// taken-away blocks slide off the stage. Carrying is ten cubes flying across
// to stack into a rod in the tens column; borrowing is a rod's ten cubes
// flying back and fanning out as ones. A live count under each column ticks
// up or down AS EACH BLOCK arrives or leaves — watching the number change in
// real time is the teaching. The written algorithm then appears as a record
// of what was just seen.
//
// Every number comes from the unit (src/remotion/lesson/units.ts).
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
import { columnSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { columnUnitById, columnNumbers, type ColumnUnit } from "./units";

export { FPS } from "./timeline";

export type ColumnProps = {
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

// ---- stage geometry -------------------------------------------------------
// One absolute-positioned stage; every block has a computed (x, y) per beat
// and CSS-free frame-interpolated motion between them.
const UNIT = 26; // one-cube edge
const GAP = 4;
const ROD_W = UNIT;
const ROD_H = UNIT * 10 + 9 * GAP;

const STAGE_W = 1600;
const STAGE_H = 830;

// Primary (top) row: the number being built on / taken from.
const TENS_X0 = 60;
const ROW_Y = 110;
const ONES_X0 = 950;
// Staging (bottom) row: the second number in an addition, before it merges.
const STAGE_ROW_Y = 460;
// Live counts sit between the rows.
const COUNT_Y = 745;

const rodSlot = (i: number) => ({ x: TENS_X0 + i * (ROD_W + 18), y: ROW_Y });
const onesSlot = (i: number) => ({
  x: ONES_X0 + (i % 5) * (UNIT + GAP),
  y: ROW_Y + Math.floor(i / 5) * (UNIT + GAP),
});
// Staged blocks sit directly BELOW their destination slot, so every merge
// journey is a clean vertical rise — nothing crosses the counts or other
// blocks diagonally on its way up.
const stagedRodSlot = (targetIdx: number) => ({ x: rodSlot(targetIdx).x, y: STAGE_ROW_Y });
const stagedOnesSlot = (targetIdx: number, localIdx: number) => ({
  x: ONES_X0 + (targetIdx % 5) * (UNIT + GAP),
  y: STAGE_ROW_Y + Math.floor(localIdx / 5) * (UNIT + GAP),
});
/** The k-th cube of a rod standing at slot i (rods are ten stacked cubes). */
const rodCubePos = (slot: { x: number; y: number }, k: number) => ({
  x: slot.x,
  y: slot.y + k * (UNIT + GAP - 1),
});
/** Where removed blocks go: straight down off the bottom of the stage. */
const offStage = (from: { x: number; y: number }) => ({ x: from.x, y: STAGE_H + 120 });

interface SceneProps {
  dur: number;
  unit: ColumnUnit;
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

// ---- moving blocks --------------------------------------------------------

interface Move {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Frame this block starts moving. */
  at: number;
  /** Frames the journey takes. */
  travel?: number;
}

/** Frame-interpolated position for a block journey. */
function useJourney({ from, to, at, travel = 18 }: Move) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + travel], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    t,
  };
}

function MovingCube(props: Move & { color?: string; appearAt?: number }) {
  const frame = useCurrentFrame();
  const { x, y } = useJourney(props);
  const opacity =
    props.appearAt === undefined
      ? 1
      : interpolate(frame, [props.appearAt, props.appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: UNIT,
        height: UNIT,
        borderRadius: 5,
        backgroundColor: props.color ?? GOLD,
        opacity,
      }}
    />
  );
}

function MovingRod(props: Move & { color?: string; appearAt?: number }) {
  const frame = useCurrentFrame();
  const { x, y } = useJourney(props);
  const opacity =
    props.appearAt === undefined
      ? 1
      : interpolate(frame, [props.appearAt, props.appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: ROD_W,
        display: "flex",
        flexDirection: "column",
        gap: GAP - 1,
        opacity,
      }}
    >
      {Array.from({ length: 10 }, (_, k) => (
        <div
          key={k}
          style={{
            width: UNIT,
            height: UNIT,
            borderRadius: 5,
            backgroundColor: props.color ?? BLUE,
          }}
        />
      ))}
    </div>
  );
}

/** Live count under a column — ticks as blocks arrive/leave, and pulses green
 *  at the moment it changes so the eye is drawn to the number moving. */
function LiveCount({
  value,
  x,
  label,
  changedAt,
}: {
  value: number;
  x: number;
  label: string;
  changedAt: number | null;
}) {
  const frame = useCurrentFrame();
  const flash =
    changedAt === null
      ? 0
      : interpolate(frame, [changedAt, changedAt + 12], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: COUNT_Y,
        width: 360,
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontSize: 84,
          fontWeight: 800,
          color: flash > 0.05 ? GREEN : INK,
          scale: String(1 + flash * 0.18),
          display: "inline-block",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 44, color: MUTED, fontWeight: 700, marginLeft: 14 }}>{label}</span>
    </div>
  );
}

function ColumnHead({ x, label }: { x: number; label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 40,
        width: 360,
        textAlign: "center",
        fontSize: 40,
        color: MUTED,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>
      <ColumnHead x={TENS_X0 - 60} label="TENS" />
      <ColumnHead x={ONES_X0 - 100} label="ONES" />
      {children}
    </div>
  );
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
      <div
        style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}
      >
        Let&apos;s build it out of blocks.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build the number(s) as blocks -------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const secondRowAt = Math.round(dur * 0.5);
  const still = (p: { x: number; y: number }) => ({ from: p, to: p, at: 0 });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.op === "−" ? `${unit.x} to start with` : `${unit.x} and ${unit.y}`}
      </div>
      <Stage>
        {/* x: appears block by block, so building IS counting */}
        {Array.from({ length: n.xTens }, (_, i) => (
          <MovingRod key={`xt${i}`} {...still(rodSlot(i))} appearAt={16 + i * 5} />
        ))}
        {Array.from({ length: n.xOnes }, (_, i) => (
          <MovingCube key={`xo${i}`} {...still(onesSlot(i))} appearAt={16 + n.xTens * 5 + i * 3} />
        ))}
        <LiveCount
          value={Math.max(
            0,
            Math.min(n.xTens, Math.floor((frame - 16) / 5) + 1),
          )}
          x={TENS_X0 - 60}
          label="tens"
          changedAt={null}
        />
        <LiveCount
          value={Math.max(
            0,
            Math.min(n.xOnes, Math.floor((frame - 16 - n.xTens * 5) / 3) + 1),
          )}
          x={ONES_X0 - 100}
          label="ones"
          changedAt={null}
        />
        {/* y staged below (addition only) — it will travel up in the next scene */}
        {unit.op === "+" &&
          Array.from({ length: n.yTens }, (_, i) => (
            <MovingRod key={`yt${i}`} {...still(stagedRodSlot(n.xTens + i))} appearAt={secondRowAt + i * 5} />
          ))}
        {unit.op === "+" &&
          Array.from({ length: n.yOnes }, (_, i) => (
            <MovingCube
              key={`yo${i}`}
              {...still(stagedOnesSlot(n.xOnes + i, i))}
              appearAt={secondRowAt + n.yTens * 5 + i * 3}
            />
          ))}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the action — blocks move, counts tick -----------------------
function SceneAction(props: SceneProps) {
  if (props.unit.op === "−") return <SceneSubtract {...props} />;
  return <SceneAdd {...props} />;
}

/** Addition: y's blocks travel UP into x's columns; if the ones overflow, ten
 *  of them fly across and stack into a new rod in the tens column. */
function SceneAdd({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);

  const mergeAt = Math.round(dur * 0.14);
  const travel = 16;
  const stagger = 3;
  const mergeDone = mergeAt + Math.max(n.yTens, n.yOnes) * stagger + travel;
  const carryAt = n.carries ? Math.round(dur * 0.55) : Infinity;

  // Counts tick as blocks arrive/depart. A block "counts" once it's most of
  // the way there — the tick lands ON the motion, not after it.
  const arrivedRods = Array.from({ length: n.yTens }, (_, i) => mergeAt + i * stagger + travel * 0.8)
    .filter((t) => frame >= t).length;
  const arrivedOnes = Array.from({ length: n.yOnes }, (_, i) => mergeAt + i * stagger + travel * 0.8)
    .filter((t) => frame >= t).length;

  // The carried ten: the LAST ten cubes of the combined ones (the leftovers
  // are indices 0..leftover-1, already sitting in place).
  const carryTravel = 20;
  const carryStagger = 2;
  const departedCarry = n.carries
    ? Array.from({ length: 10 }, (_, k) => carryAt + k * carryStagger + carryTravel * 0.5).filter(
        (t) => frame >= t,
      ).length
    : 0;
  const carryArrived = n.carries && frame >= carryAt + 9 * carryStagger + carryTravel * 0.9;

  const onesCount = n.xOnes + arrivedOnes - departedCarry;
  const tensCount = n.xTens + arrivedRods + (carryArrived ? 1 : 0);

  const lastOnesTick =
    arrivedOnes > 0 || departedCarry > 0
      ? Math.max(
          arrivedOnes > 0 ? mergeAt + (arrivedOnes - 1) * stagger + travel * 0.8 : -1,
          departedCarry > 0 ? carryAt + (departedCarry - 1) * carryStagger + carryTravel * 0.5 : -1,
        )
      : null;
  const lastTensTick = carryArrived
    ? carryAt + 9 * carryStagger + carryTravel * 0.9
    : arrivedRods > 0
      ? mergeAt + (arrivedRods - 1) * stagger + travel * 0.8
      : null;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {n.carries ? "Put them together — ten ones make a ten" : "Put them together"}
      </div>
      <Stage>
        {/* x's blocks, in place */}
        {Array.from({ length: n.xTens }, (_, i) => (
          <MovingRod key={`xt${i}`} from={rodSlot(i)} to={rodSlot(i)} at={0} />
        ))}
        {Array.from({ length: n.xOnes }, (_, i) => (
          <MovingCube key={`xo${i}`} from={onesSlot(i)} to={onesSlot(i)} at={0} />
        ))}

        {/* y's blocks travel up into the columns */}
        {Array.from({ length: n.yTens }, (_, i) => (
          <MovingRod
            key={`yt${i}`}
            from={stagedRodSlot(n.xTens + i)}
            to={rodSlot(n.xTens + i)}
            at={mergeAt + i * stagger}
            travel={travel}
          />
        ))}
        {Array.from({ length: n.yOnes }, (_, i) => {
          const targetIdx = n.xOnes + i;
          const isCarried = n.carries && targetIdx >= n.leftover;
          if (!isCarried || frame < carryAt + (targetIdx - n.leftover) * carryStagger) {
            return (
              <MovingCube
                key={`yo${i}`}
                from={stagedOnesSlot(targetIdx, i)}
                to={onesSlot(targetIdx)}
                at={mergeAt + i * stagger}
                travel={travel}
              />
            );
          }
          return null;
        })}

        {/* x's own cubes that get carried (when leftover < xOnes) */}
        {n.carries &&
          Array.from({ length: 10 }, (_, k) => {
            const idx = n.leftover + k; // combined index of the k-th carried cube
            if (frame < carryAt + k * carryStagger) return null;
            return (
              <MovingCube
                key={`c${k}`}
                from={onesSlot(idx)}
                to={rodCubePos(rodSlot(n.tensSum), k)}
                at={carryAt + k * carryStagger}
                travel={carryTravel}
                color={GREEN}
              />
            );
          })}

        <LiveCount value={onesCount} x={ONES_X0 - 100} label="ones" changedAt={lastOnesTick} />
        <LiveCount value={tensCount} x={TENS_X0 - 60} label="tens" changedAt={lastTensTick} />
      </Stage>
      {n.carries && (
        <div
          style={{
            fontSize: 50,
            color: GREEN,
            fontWeight: 700,
            opacity: carryArrived ? 1 : 0,
          }}
        >
          that&apos;s the little 1 you carry
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Subtraction: the taken-away blocks slide OFF the stage; a borrow first
 *  flies a rod's ten cubes back into the ones column. */
function SceneSubtract({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);

  const borrowAt = n.borrows ? Math.round(dur * 0.28) : Infinity;
  const borrowTravel = 20;
  const borrowStagger = 2;
  const borrowDone = n.borrows && frame >= borrowAt + 9 * borrowStagger + borrowTravel * 0.9;

  const removeAt = Math.round(dur * (n.borrows ? 0.62 : 0.3));
  const travel = 18;
  const stagger = 3;

  const onesAvailable = n.xOnes + (n.borrows ? 10 : 0);
  // Cubes leave highest-index first, so the survivors are a tidy block.
  const removedOnes = Array.from({ length: n.yOnes }, (_, i) => removeAt + i * stagger + travel * 0.4)
    .filter((t) => frame >= t).length;
  const removedRods = Array.from({ length: n.yTens }, (_, i) => removeAt + i * stagger + travel * 0.4)
    .filter((t) => frame >= t).length;

  const borrowedArrived = n.borrows
    ? Array.from({ length: 10 }, (_, k) => borrowAt + k * borrowStagger + borrowTravel * 0.8).filter(
        (t) => frame >= t,
      ).length
    : 0;

  const onesCount = n.xOnes + borrowedArrived - removedOnes;
  const tensCount = n.xTens - (n.borrows && frame >= borrowAt ? 1 : 0) - removedRods;

  const lastOnesTick =
    removedOnes > 0
      ? removeAt + (removedOnes - 1) * stagger + travel * 0.4
      : borrowedArrived > 0
        ? borrowAt + (borrowedArrived - 1) * borrowStagger + borrowTravel * 0.8
        : null;
  const lastTensTick =
    removedRods > 0
      ? removeAt + (removedRods - 1) * stagger + travel * 0.4
      : n.borrows && frame >= borrowAt
        ? borrowAt
        : null;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {n.borrows ? "Not enough ones — borrow a ten" : `Take away ${unit.y}`}
      </div>
      <Stage>
        {/* Rods that stay (the borrowed one is rendered as flying cubes) */}
        {Array.from({ length: n.xTens }, (_, i) => {
          const isBorrowed = n.borrows && i === n.xTens - 1;
          if (isBorrowed && frame >= borrowAt) return null;
          const isRemoved = i >= n.xTens - (n.borrows ? 1 : 0) - n.yTens;
          const removalIdx = n.xTens - (n.borrows ? 1 : 0) - 1 - i;
          if (!isBorrowed && isRemoved && removalIdx < n.yTens) {
            return (
              <MovingRod
                key={`t${i}`}
                from={rodSlot(i)}
                to={offStage(rodSlot(i))}
                at={removeAt + removalIdx * stagger}
                travel={travel + 8}
              />
            );
          }
          return <MovingRod key={`t${i}`} from={rodSlot(i)} to={rodSlot(i)} at={0} />;
        })}

        {/* The borrowed rod's ten cubes fly over and fan into the ones grid */}
        {n.borrows &&
          frame >= borrowAt &&
          Array.from({ length: 10 }, (_, k) => (
            <MovingCube
              key={`b${k}`}
              from={rodCubePos(rodSlot(n.xTens - 1), k)}
              to={onesSlot(n.xOnes + k)}
              at={borrowAt + k * borrowStagger}
              travel={borrowTravel}
              color={GREEN}
            />
          ))}

        {/* Ones: survivors stay, the taken-away ones slide off the stage */}
        {Array.from({ length: onesAvailable }, (_, i) => {
          if (n.borrows && i >= n.xOnes) return null; // rendered above as borrowed
          const removalIdx = onesAvailable - 1 - i;
          if (removalIdx < n.yOnes) {
            return (
              <MovingCube
                key={`o${i}`}
                from={onesSlot(i)}
                to={offStage(onesSlot(i))}
                at={removeAt + removalIdx * stagger}
                travel={travel + 8}
              />
            );
          }
          return <MovingCube key={`o${i}`} from={onesSlot(i)} to={onesSlot(i)} at={0} />;
        })}

        {/* Borrowed cubes that then get taken away leave from their new home */}
        {n.borrows &&
          Array.from({ length: 10 }, (_, k) => {
            const i = n.xOnes + k;
            const removalIdx = onesAvailable - 1 - i;
            if (removalIdx >= 0 && removalIdx < n.yOnes && frame >= removeAt + removalIdx * stagger) {
              return (
                <MovingCube
                  key={`br${k}`}
                  from={onesSlot(i)}
                  to={offStage(onesSlot(i))}
                  at={removeAt + removalIdx * stagger}
                  travel={travel + 8}
                  color={GREEN}
                />
              );
            }
            return null;
          })}

        <LiveCount value={onesCount} x={ONES_X0 - 100} label="ones" changedAt={lastOnesTick} />
        <LiveCount value={tensCount} x={TENS_X0 - 60} label="tens" changedAt={lastTensTick} />
      </Stage>
      {n.borrows && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700, opacity: borrowDone ? 1 : 0 }}>
          one ten = ten ones
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---- Scene 4: the written algorithm as a record ---------------------------
function SceneWritten({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const markAt = Math.round(dur * 0.3);
  const answerAt = Math.round(dur * 0.6);
  const col = (s: string) => s.padStart(3, " ");
  const markOpacity = interpolate(frame, [markAt, markAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Writing it down
      </div>
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 140,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.12,
          textAlign: "right",
          whiteSpace: "pre",
        }}
      >
        {n.carries && unit.op === "+" && (
          <div style={{ fontSize: 56, color: GREEN, opacity: markOpacity }}>{"  1  "}</div>
        )}
        {n.borrows && unit.op === "−" && (
          <div style={{ fontSize: 56, color: GREEN, opacity: markOpacity }}>
            {`  ${n.xTens - 1} ${n.xOnes + 10}`}
          </div>
        )}
        <div>{col(String(unit.x))}</div>
        <div>
          {unit.op} {col(String(unit.y))}
        </div>
        <div style={{ borderTop: `6px solid ${INK}`, paddingTop: 8 }}>
          <span
            style={{
              opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {col(String(n.answer))}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  regroup: SceneAction,
  written: SceneWritten,
};

export const ColumnVideo: React.FC<ColumnProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = columnUnitById(unitId);
  const scenes = columnSceneTimings(unitId, voice);
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
