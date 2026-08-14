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
import { Brand } from "./Brand";
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
  const { x, y, t } = useJourney(props);
  const appearing =
    props.appearAt === undefined
      ? 1
      : interpolate(frame, [props.appearAt, props.appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  // Blocks heading off the stage fade as they go, rather than sailing straight
  // through the live counts on their way down.
  const opacity = appearing * (props.to.y >= STAGE_H ? 1 - t * 0.95 : 1);
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
  const { x, y, t } = useJourney(props);
  const appearing =
    props.appearAt === undefined
      ? 1
      : interpolate(frame, [props.appearAt, props.appearAt + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  // Blocks heading off the stage fade as they go, rather than sailing straight
  // through the live counts on their way down.
  const opacity = appearing * (props.to.y >= STAGE_H ? 1 - t * 0.95 : 1);
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

/** Frames a block's fade-in takes — a block only counts once it's visible. */
const FADE = 8;

/** The value a building row has reached: blocks count when their fade ENDS,
 *  not when it starts, so the label never runs ahead of what's on screen. */
function rowValueAt(frame: number, startAt: number, tens: number, ones: number): number {
  const tensLanded = Math.max(0, Math.min(tens, Math.floor((frame - startAt - FADE) / 5) + 1));
  const onesLanded = Math.max(
    0,
    Math.min(ones, Math.floor((frame - startAt - tens * 5 - FADE) / 3) + 1),
  );
  return tensLanded * 10 + onesLanded;
}

/** A row's own value, shown beside its blocks and counting up as they land —
 *  so both numbers in a build are labelled, not just the top one. Hidden
 *  until the row starts building (a stray 0 beside empty space reads as a
 *  mistake). */
function RowValue({ value, y, visible }: { value: number; y: number; visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: STAGE_W - 240,
        top: y,
        width: 220,
        textAlign: "left",
        fontSize: 110,
        fontWeight: 800,
        color: INK,
        opacity: visible ? 1 : 0,
      }}
    >
      {value}
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
// The problem is STACKED from the very first second — top number over bottom
// number over a rule, exactly as the child will write it. A horizontal
// "52 − 27" asks them to mentally rotate it into columns before the lesson
// even starts (user-caught: 2-digit work must be vertical).
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(38);
  const width = Math.max(String(unit.x).length, String(unit.y).length);
  const COLW = 120;
  const pad = (v: number) => String(v).padStart(width, " ").split("");
  const DigitRow = ({ chars, prefix }: { chars: string[]; prefix?: string }) => (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <div style={{ width: 110, fontSize: 130, fontWeight: 800, color: INK, textAlign: "right" }}>
        {prefix ?? ""}
      </div>
      {chars.map((c, i) => (
        <div
          key={i}
          style={{ width: COLW, fontSize: 150, fontWeight: 800, color: INK, textAlign: "center" }}
        >
          {c.trim()}
        </div>
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div style={{ opacity: a.opacity, translate: `0 ${a.translateY}px` }}>
        <DigitRow chars={pad(unit.x)} />
        <DigitRow chars={pad(unit.y)} prefix={unit.op} />
        <div style={{ borderTop: `8px solid ${INK}`, marginTop: 8, marginLeft: 110, width: width * COLW }} />
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
        {/* Each ROW carries its own value, counting up as its blocks land —
            column counters here described only the top number, which made the
            second one read as unlabeled clutter (user-caught: "you have the
            37 but no 45"). */}
        <RowValue
          value={rowValueAt(frame, 16, n.xTens, n.xOnes)}
          y={ROW_Y + 90}
          visible={frame >= 16 + FADE}
        />
        {unit.op === "+" && (
          <RowValue
            value={rowValueAt(frame, secondRowAt, n.yTens, n.yOnes)}
            y={STAGE_ROW_Y + 90}
            visible={frame >= secondRowAt + FADE}
          />
        )}
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
        {Array.from({ length: n.xOnes }, (_, i) => {
          // Once a cube's turn in the carry comes, its green flying copy takes
          // over — the static original must leave with it, or the ones column
          // keeps showing cubes the count says are gone.
          const isCarried = n.carries && i >= n.leftover;
          if (isCarried && frame >= carryAt + (i - n.leftover) * carryStagger) return null;
          return <MovingCube key={`xo${i}`} from={onesSlot(i)} to={onesSlot(i)} at={0} />;
        })}

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

        {/* ONE journey per cube. Splitting arrival and removal across separate
            render blocks drew borrowed-then-removed cubes twice — parked AND
            flying — so the column showed more cubes than the count. */}
        {Array.from({ length: onesAvailable }, (_, i) => {
          const isBorrowed = n.borrows && i >= n.xOnes;
          const k = i - n.xOnes; // index within the borrowed ten
          // Borrowed cubes don't exist until their flight starts.
          if (isBorrowed && frame < borrowAt + k * borrowStagger) return null;

          // Cubes leave highest-index first, so survivors stay a tidy block.
          const removalIdx = onesAvailable - 1 - i;
          const removalStart = removeAt + removalIdx * stagger;
          const leaving = removalIdx < n.yOnes && frame >= removalStart;

          if (leaving) {
            return (
              <MovingCube
                key={`o${i}`}
                from={onesSlot(i)}
                to={offStage(onesSlot(i))}
                at={removalStart}
                travel={travel + 8}
                color={isBorrowed ? GREEN : undefined}
              />
            );
          }
          if (isBorrowed) {
            return (
              <MovingCube
                key={`o${i}`}
                from={rodCubePos(rodSlot(n.xTens - 1), k)}
                to={onesSlot(i)}
                at={borrowAt + k * borrowStagger}
                travel={borrowTravel}
                color={GREEN}
              />
            );
          }
          return <MovingCube key={`o${i}`} from={onesSlot(i)} to={onesSlot(i)} at={0} />;
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

// ===========================================================================
// THREE-DIGIT: hundreds, tens and ones.
// ===========================================================================
// Deliberately a separate code path rather than a generalisation of the
// two-digit scenes above. Those four videos are correct and reviewed, and the
// three-digit case is genuinely different: two regroups instead of one, and a
// third block shape. Widening the working scenes risked all six to serve two.
//
// The mechanic is identical, applied twice: ten of a place group up, turn
// green, and travel to the next place as ONE block of the next size. That is
// the whole of carrying, and reversed, the whole of borrowing.

const U3 = 13; // cube edge at three-digit scale
const G3 = 2;
const ROD3_H = U3 * 10 + 9 * G3;
const FLAT3_W = U3 * 10 + 9 * G3;

// Widened: four flats span 706px, so the tens column cannot start at 700 —
// the fourth hundred overran it. Worst cases are 4 flats (248+167), 13 rods
// (342-158 after borrowing a hundred) and 15 ones.
const COL3_X = [60, 800, 1280]; // hundreds, tens, ones
const ROW3_Y = 150;
const STAGE3_ROW_Y = 470;
const COUNT3_Y = 700;

/** A hundred: ten rods side by side, so it is visibly ten tens. */
function Flat3({ x, y, colour = GREEN }: { x: number; y: number; colour?: string }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: G3 }}>
      {Array.from({ length: 10 }, (_, c) => (
        <div key={c} style={{ display: "flex", flexDirection: "column", gap: G3 }}>
          {Array.from({ length: 10 }, (_, r) => (
            <div
              key={r}
              style={{ width: U3, height: U3, borderRadius: 2, backgroundColor: colour }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Rod3({ x, y, colour = BLUE }: { x: number; y: number; colour?: string }) {
  return (
    <div
      style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: "column", gap: G3 }}
    >
      {Array.from({ length: 10 }, (_, r) => (
        <div key={r} style={{ width: U3, height: U3, borderRadius: 2, backgroundColor: colour }} />
      ))}
    </div>
  );
}

function Cube3({ x, y, colour = GOLD }: { x: number; y: number; colour?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: U3,
        height: U3,
        borderRadius: 2,
        backgroundColor: colour,
      }}
    />
  );
}

const flat3Slot = (i: number, y = ROW3_Y) => ({ x: COL3_X[0] + i * (FLAT3_W + 14), y });
const rod3Slot = (i: number, y = ROW3_Y) => ({ x: COL3_X[1] + i * (U3 + 12), y });
const cube3Slot = (i: number, y = ROW3_Y) => ({
  x: COL3_X[2] + (i % 5) * (U3 + G3 + 3),
  y: y + Math.floor(i / 5) * (U3 + G3 + 3),
});

function Head3({ i, label }: { i: number; label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: COL3_X[i],
        top: 70,
        width: 320,
        fontSize: 34,
        color: MUTED,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  );
}

function Count3({ value, i, label, changedAt }: { value: number; i: number; label: string; changedAt: number | null }) {
  const frame = useCurrentFrame();
  const flash =
    changedAt === null
      ? 0
      : interpolate(frame, [changedAt, changedAt + 12], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div style={{ position: "absolute", left: COL3_X[i], top: COUNT3_Y, width: 320 }}>
      <span
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: flash > 0.05 ? GREEN : INK,
          scale: String(1 + flash * 0.16),
          display: "inline-block",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 36, color: MUTED, fontWeight: 700, marginLeft: 10 }}>{label}</span>
    </div>
  );
}

function Stage3({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: 1640, height: 800 }}>
      <Head3 i={0} label="HUNDREDS" />
      <Head3 i={1} label="TENS" />
      <Head3 i={2} label="ONES" />
      {children}
    </div>
  );
}

/** Straight-line travel between two points. */
function useTrip(from: { x: number; y: number }, to: { x: number; y: number }, at: number, travel = 22) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + travel], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, t };
}

function SceneBuild3({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const secondAt = Math.round(dur * 0.52);
  const xDigits = [n.xHundreds, Math.floor((unit.x % 100) / 10), unit.x % 10];
  const yDigits = [n.yHundreds, Math.floor((unit.y % 100) / 10), unit.y % 10];
  const rows: { d: number[]; y: number; at: number }[] =
    unit.op === "−"
      ? [{ d: xDigits, y: ROW3_Y, at: 16 }]
      : [
          { d: xDigits, y: ROW3_Y, at: 16 },
          { d: yDigits, y: STAGE3_ROW_Y, at: secondAt },
        ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.op === "−" ? `${unit.x} to start with` : `${unit.x} and ${unit.y}`}
      </div>
      <Stage3>
        {rows.map((row, ri) => (
          <div key={ri}>
            {Array.from({ length: row.d[0] }, (_, i) =>
              frame >= row.at + i * 6 ? (
                <Flat3 key={`f${ri}${i}`} {...flat3Slot(i, row.y)} />
              ) : null,
            )}
            {Array.from({ length: row.d[1] }, (_, i) =>
              frame >= row.at + row.d[0] * 6 + i * 4 ? (
                <Rod3 key={`r${ri}${i}`} {...rod3Slot(i, row.y)} />
              ) : null,
            )}
            {Array.from({ length: row.d[2] }, (_, i) =>
              frame >= row.at + row.d[0] * 6 + row.d[1] * 4 + i * 3 ? (
                <Cube3 key={`c${ri}${i}`} {...cube3Slot(i, row.y)} />
              ) : null,
            )}
            <div
              style={{
                position: "absolute",
                left: 1480,
                top: row.y + 60,
                fontSize: 86,
                fontWeight: 800,
                color: INK,
              }}
            >
              {ri === 0 ? unit.x : unit.y}
            </div>
          </div>
        ))}
      </Stage3>
    </AbsoluteFill>
  );
}

/** Addition: ones merge and carry, then tens merge and carry. */
function SceneAdd3({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const xT = Math.floor((unit.x % 100) / 10);
  const yT = Math.floor((unit.y % 100) / 10);
  const onesSum = n.onesSum;
  const tensAfterCarry = xT + yT + (n.carries ? 1 : 0);

  const mergeAt = Math.round(dur * 0.08);
  const carry1At = Math.round(dur * 0.34); // ones → tens
  const carry2At = Math.round(dur * 0.66); // tens → hundreds
  const trip = 22;

  const merged = frame >= mergeAt + 20;
  const carried1 = frame >= carry1At + trip * 0.9;
  const carried2 = n.tensCarry && frame >= carry2At + trip * 0.9;

  const onesShown = carried1 ? n.leftover : merged ? onesSum : unit.x % 10;
  const tensShown =
    (carried2 ? tensAfterCarry - 10 : merged ? xT + yT : xT) + (carried1 && !carried2 ? 1 : 0);
  const hundredsShown = n.xHundreds + (merged ? n.yHundreds : 0) + (carried2 ? 1 : 0);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {frame < carry1At
          ? "Put them together"
          : frame < carry2At
            ? "Ten ones make a ten"
            : "And ten tens make a hundred"}
      </div>
      <Stage3>
        {Array.from({ length: hundredsShown }, (_, i) => (
          <Flat3 key={`f${i}`} {...flat3Slot(i)} colour={carried2 && i === hundredsShown - 1 ? GREEN : GREEN} />
        ))}
        {Array.from({ length: Math.max(0, tensShown) }, (_, i) => (
          <Rod3 key={`r${i}`} {...rod3Slot(i)} />
        ))}
        {Array.from({ length: Math.max(0, onesShown) }, (_, i) => (
          <Cube3 key={`c${i}`} {...cube3Slot(i)} />
        ))}

        {/* The ten ones travelling to the tens column as one rod */}
        {n.carries && frame >= carry1At && !carried1 && (
          <TravellingRod from={cube3Slot(n.leftover)} to={rod3Slot(xT + yT)} at={carry1At} travel={trip} />
        )}
        {/* The ten tens travelling to the hundreds column as one flat */}
        {n.tensCarry && frame >= carry2At && !carried2 && (
          <TravellingFlat
            from={rod3Slot(tensAfterCarry - 10)}
            to={flat3Slot(n.xHundreds + n.yHundreds)}
            at={carry2At}
            travel={trip}
          />
        )}

        <Count3 value={hundredsShown} i={0} label="h" changedAt={carried2 ? carry2At + trip : null} />
        <Count3 value={Math.max(0, tensShown)} i={1} label="t" changedAt={carried1 ? carry1At + trip : null} />
        <Count3 value={Math.max(0, onesShown)} i={2} label="o" changedAt={carried1 ? carry1At : null} />
      </Stage3>
    </AbsoluteFill>
  );
}

function TravellingRod({
  from,
  to,
  at,
  travel,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
  travel: number;
}) {
  const p = useTrip(from, to, at, travel);
  return <Rod3 x={p.x} y={p.y} colour={GREEN} />;
}

function TravellingFlat({
  from,
  to,
  at,
  travel,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
  travel: number;
}) {
  const p = useTrip(from, to, at, travel);
  return <Flat3 x={p.x} y={p.y} colour={GREEN} />;
}

/** Subtraction: borrow a hundred into tens if needed, then a ten into ones. */
function SceneSub3({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const xH = n.xHundreds;
  const xT = Math.floor((unit.x % 100) / 10);
  const xO = unit.x % 10;
  const yH = n.yHundreds;
  const yT = Math.floor((unit.y % 100) / 10);
  const yO = unit.y % 10;

  const borrow1At = Math.round(dur * 0.16); // ten → ones
  const borrow2At = Math.round(dur * 0.44); // hundred → tens
  const takeAt = Math.round(dur * 0.7);
  const trip = 22;

  const b1 = n.borrows && frame >= borrow1At + trip * 0.9;
  const b2 = n.tensBorrow && frame >= borrow2At + trip * 0.9;
  const took = frame >= takeAt + trip * 0.9;

  const onesNow = took ? xO + (n.borrows ? 10 : 0) - yO : xO + (b1 ? 10 : 0);
  const tensNow =
    (took ? xT - (n.borrows ? 1 : 0) + (n.tensBorrow ? 10 : 0) - yT : xT - (b1 ? 1 : 0) + (b2 ? 10 : 0));
  const hundredsNow = took ? xH - (n.tensBorrow ? 1 : 0) - yH : xH - (b2 ? 1 : 0);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {frame < borrow2At
          ? "Not enough ones — break a ten"
          : frame < takeAt
            ? "Not enough tens — break a hundred"
            : `Now take away ${unit.y}`}
      </div>
      <Stage3>
        {Array.from({ length: Math.max(0, hundredsNow) }, (_, i) => (
          <Flat3 key={`f${i}`} {...flat3Slot(i)} />
        ))}
        {Array.from({ length: Math.max(0, tensNow) }, (_, i) => (
          <Rod3 key={`r${i}`} {...rod3Slot(i)} />
        ))}
        {Array.from({ length: Math.max(0, onesNow) }, (_, i) => (
          <Cube3 key={`c${i}`} {...cube3Slot(i)} />
        ))}

        {n.borrows && frame >= borrow1At && !b1 && (
          <TravellingRod from={rod3Slot(xT - 1)} to={cube3Slot(xO)} at={borrow1At} travel={trip} />
        )}
        {n.tensBorrow && frame >= borrow2At && !b2 && (
          <TravellingFlat from={flat3Slot(xH - 1)} to={rod3Slot(xT)} at={borrow2At} travel={trip} />
        )}

        <Count3 value={Math.max(0, hundredsNow)} i={0} label="h" changedAt={b2 ? borrow2At : null} />
        <Count3 value={Math.max(0, tensNow)} i={1} label="t" changedAt={b2 ? borrow2At + trip : null} />
        <Count3 value={Math.max(0, onesNow)} i={2} label="o" changedAt={b1 ? borrow1At + trip : null} />
      </Stage3>
    </AbsoluteFill>
  );
}

function SceneAction3(props: SceneProps) {
  return props.unit.op === "−" ? <SceneSub3 {...props} /> : <SceneAdd3 {...props} />;
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  regroup: SceneAction,
  written: SceneWritten,
};

/** The written algorithm for three digits, with ONE mark per place.
 *  The two-digit version's annotation is a single pair and produced nonsense
 *  here ("33 12" for 342 − 158, where it should be 2 13 12). */
function SceneWritten3({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = columnNumbers(unit);
  const title = useEnter(4);
  const markAt = Math.round(dur * 0.28);
  const answerAt = Math.round(dur * 0.58);

  const xH = n.xHundreds;
  const xT = Math.floor((unit.x % 100) / 10);
  const xO = unit.x % 10;

  // Per-place annotations, aligned to the digit each one belongs above.
  let marks: (string | null)[];
  if (unit.op === "−") {
    marks = [
      n.tensBorrow ? String(xH - 1) : null,
      n.tensBorrow ? String(xT - (n.borrows ? 1 : 0) + 10) : n.borrows ? String(xT - 1) : null,
      n.borrows ? String(xO + 10) : null,
    ];
  } else {
    // A carry is written above the place it lands IN.
    marks = [n.tensCarry ? "1" : null, n.carries ? "1" : null, null];
  }

  const COLW = 150;
  const digits = (v: number) => String(v).padStart(3, " ").split("");
  const markOpacity = interpolate(frame, [markAt, markAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const Row = ({ chars, prefix }: { chars: string[]; prefix?: string }) => (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <div style={{ width: 90, fontSize: 120, fontWeight: 800, color: INK, textAlign: "right" }}>
        {prefix ?? ""}
      </div>
      {chars.map((c, i) => (
        <div
          key={i}
          style={{ width: COLW, fontSize: 130, fontWeight: 800, color: INK, textAlign: "center" }}
        >
          {c.trim()}
        </div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Writing it down
      </div>
      <div style={{ fontFamily: "Georgia, serif" }}>
        {/* the regrouping marks, each above its own place */}
        <div style={{ display: "flex", opacity: markOpacity }}>
          <div style={{ width: 90 }} />
          {marks.map((m, i) => (
            <div
              key={i}
              style={{ width: COLW, fontSize: 52, fontWeight: 800, color: GREEN, textAlign: "center" }}
            >
              {m ?? ""}
            </div>
          ))}
        </div>
        <Row chars={digits(unit.x)} />
        <Row chars={digits(unit.y)} prefix={unit.op} />
        <div style={{ borderTop: `7px solid ${INK}`, marginTop: 6, paddingTop: 6 }}>
          <div
            style={{
              opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <Row chars={digits(n.answer)} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENE_BODIES_3: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild3,
  regroup: SceneAction3,
  written: SceneWritten3,
};

export const ColumnVideo: React.FC<ColumnProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = columnUnitById(unitId);
  const scenes = columnSceneTimings(unitId, voice);
  // Three-digit units use their own scenes: two regroups and a third block
  // shape, rather than a widened version of the two-digit ones.
  const bodies = columnNumbers(unit).hasHundreds ? SCENE_BODIES_3 : SCENE_BODIES;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const Body = bodies[scene.id];
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
