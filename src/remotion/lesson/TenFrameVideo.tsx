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
import { tenFrameSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { tenFrameNumbers, tenFrameUnitById, type TenFrameUnit } from "./units";

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
  voice: string;
  unit: TenFrameUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  Every reveal that shows something she counts or names is timed with it;
   *  the fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it — lines like "The frame has 2 empty spaces. So
 *  slide 2 across… that leaves 2" repeat a value, and only the k-th one is the
 *  moment the picture belongs to. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

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
function SceneAsk({ unit, said }: SceneProps) {
  // "7 plus 2": the first number as she says it, the operator and second
  // number as she says the second. The line says y last (6 + 6 says 6 twice).
  const a = useEnter(said(unit.x, 6, 0));
  const y = useEnter(said(unit.y, 6, -1));
  const b = useEnter(38); // not-speech-bound: "Let's use a ten-frame"
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
        {unit.x}{" "}
        <span style={{ opacity: y.opacity, display: "inline-block", translate: `0 ${y.translateY}px` }}>
          {unit.op} {unit.y}
        </span>
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {unit.op === "+" ? "Let's use a ten-frame." : "Let's take them off a ten-frame."}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build ------------------------------------------------------
function SceneBuild({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const still = (p: { x: number; y: number }) => ({ from: p, to: p, at: 0 });
  // Count-up starts from the SMALLER number — the gap up to the larger one is
  // what the strategy scene then measures — so the build shows y, not x.
  const countUp = unit.strategy === "count-up";
  const shown = countUp ? unit.y : unit.x;
  // x fills the frame(s); y waits below (addition) or is what we remove.
  const xInFrame2 = Math.max(0, shown - 10);
  // "Here's 8 in the frame" — the first group lands as she names it; "and
  // here are the other 5" — the second group as she names THAT (last
  // mention: 6 + 6 says 6 twice). Past ten, "a full ten, and 2 more" puts the
  // extras on the second "2".
  const firstAt = said(shown, 16, 0);
  const secondFallback = Math.round(dur * 0.52); // not-speech-bound: only for clips without alignment
  const secondAt = said(unit.y, secondFallback, -1);
  const extrasAt = xInFrame2 > 0 ? said(xInFrame2, firstAt + 40, -1) : firstAt + 40;
  const appearX = (i: number) => (i < 10 ? firstAt + i * 4 : extrasAt + (i - 10) * 4);
  const landed = Array.from({ length: shown }, (_, i) => appearX(i) + 8).filter((t) => frame >= t).length;
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
        {unit.op === "+" ? unit.x + ", and " + unit.y + " more" : countUp ? "Start from " + unit.y : unit.x + " to start with"}
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        {shown > 10 && <FrameGrid x={FRAME2_X} y={FRAME_Y} />}
        {Array.from({ length: Math.min(shown, 10) }, (_, i) => (
          <Dot key={`x${i}`} {...still(cellPos(i, FRAME_X, FRAME_Y))} appearAt={appearX(i)} />
        ))}
        {Array.from({ length: xInFrame2 }, (_, i) => (
          <Dot
            key={`x2${i}`}
            {...still(cellPos(i, FRAME2_X, FRAME_Y))}
            appearAt={appearX(10 + i)}
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
  if (props.unit.strategy === "turnaround") return <SceneTurnaround {...props} />;
  if (props.unit.strategy === "count-up") return <SceneCountUp {...props} />;
  return props.unit.op === "+" ? <SceneAdd {...props} /> : <SceneSubtract {...props} />;
}

/** Count up: dots are ADDED from the smaller number to the larger, and the
 *  ones you added are the answer — subtraction as the distance between two
 *  numbers rather than as removal. The added dots stay green and get their own
 *  count, so "how far" is a thing on screen, not just a claim. */
function SceneCountUp({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const gap = unit.x - unit.y; // the answer

  const addAt = Math.round(dur * 0.24); // not-speech-bound: only for clips without alignment
  const travel = 22;
  const stagger = 10; // slow: each added dot is one count

  // The narrator counts each added dot ("9… 10… 11"), so dot i LANDS on its
  // spoken value — the count ticks on the word, the dot sets off just before.
  // Last occurrence: the line names the target early ("up to 13"), and the
  // counted 13 is the later one.
  const addStart = Array.from({ length: gap }, (_, i) => {
    const fallbackLand = addAt + i * stagger + travel * 0.8;
    return Math.max(4, Math.round(said(unit.y + i + 1, fallbackLand, -1) - travel * 0.8));
  });
  const addLand = (i: number) => addStart[i] + travel * 0.8;

  const added = Array.from({ length: gap }, (_, i) => addLand(i)).filter(
    (t) => frame >= t,
  ).length;
  const lastTick = added > 0 ? addLand(added - 1) : null;
  // "Count what you added — 5": the conclusion waits for that word, never
  // before the last dot has landed.
  const allLanded = gap > 0 ? addLand(gap - 1) : 0;
  const concludeAt = Math.max(allLanded, said(gap, allLanded, -1));

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
        How far from {unit.y} up to {unit.x}?
      </div>
      <Stage>
        <FrameGrid x={FRAME_X} y={FRAME_Y} />
        <FrameGrid x={FRAME2_X} y={FRAME_Y} />
        {/* The starting number, already seated */}
        {Array.from({ length: unit.y }, (_, i) => {
          const pos =
            i < 10 ? cellPos(i, FRAME_X, FRAME_Y) : cellPos(i - 10, FRAME2_X, FRAME_Y);
          return <Dot key={`s${i}`} from={pos} to={pos} at={0} />;
        })}
        {/* The gap, arriving one dot at a time from below */}
        {Array.from({ length: gap }, (_, i) => {
          const idx = unit.y + i;
          const to = idx < 10 ? cellPos(idx, FRAME_X, FRAME_Y) : cellPos(idx - 10, FRAME2_X, FRAME_Y);
          return (
            <Dot
              key={`g${i}`}
              from={loosePos(i)}
              to={to}
              at={addStart[i]}
              travel={travel}
              color={GREEN}
            />
          );
        })}
        {/* Two counts: where we've reached, and how many we've added. The
            second is the answer, so it is the one in the accent colour. */}
        <Total value={unit.y + added} changedAt={lastTick} label="reached" />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: STAGE_H - 200,
            width: STAGE_W,
            textAlign: "center",
            fontSize: 64,
            fontWeight: 800,
            color: GREEN,
            opacity: added > 0 ? 1 : 0,
          }}
        >
          {added} added
        </div>
      </Stage>
      {added >= gap && frame >= concludeAt && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          {unit.y} to {unit.x} is {gap} — so {unit.x} − {unit.y} = {gap}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Turnaround: the two groups physically trade places and the total doesn't
 *  budge — "3 + 8 is the same as 8 + 3" shown rather than asserted. */
function SceneTurnaround({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const total = unit.x + unit.y;
  // "3 and 8" — y settles in as she says it the first time; "swap them
  // round. 8 and 3" — the swap goes on her second 8; "still 11" — the caption.
  const settleFallback = Math.round(dur * 0.18); // not-speech-bound: only for clips without alignment
  const swapFallback = Math.round(dur * 0.5); // not-speech-bound: only for clips without alignment
  const settleAt = said(unit.y, settleFallback, before(unit.y, [unit.x]));
  const swapAt = said(unit.y, swapFallback, before(unit.y, [unit.x, unit.y]));
  const travel = 24;
  const swapped = frame >= swapAt + travel * 0.9;
  const stillAt = Math.max(swapAt + travel, said(total, swapAt + travel, -1));
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
      {swapped && frame >= stillAt && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          same dots — still {total}
        </div>
      )}
    </AbsoluteFill>
  );
}


/** Addition: fill the ten first, then the rest — the make-ten move made literal. */
function SceneAdd({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const total = unit.x + unit.y;
  const { gap, fillers, rest, makesTen } = tenFrameNumbers(unit);

  // The slide IS the lesson, so it gets room: the loose dots sit still for a
  // beat, then cross one at a time, slowly enough to follow. A quick, tightly
  // staggered fill read as "the dots were simply already there".
  const fillFallback = Math.round(dur * 0.26); // not-speech-bound: only for clips without alignment
  const restFallback = Math.round(dur * 0.64); // not-speech-bound: only for clips without alignment
  const travel = 26;
  const stagger = 9;

  // Make-ten line: "The frame has G empty spaces. So slide F across… and the
  // ten is full. That leaves R. 10 and R is A." The fillers set off on the
  // SECOND F (the first is the gap), the rest on the first R after those.
  // Without make-ten: "Now add the other Y on… A" — everything goes on Y.
  const fillAt = makesTen
    ? said(fillers, fillFallback, before(fillers, [gap]))
    : said(unit.y, fillFallback, 0);
  const restAt = makesTen ? said(rest, restFallback, before(rest, [gap, fillers])) : fillAt + fillers * stagger;

  // On a count-on unit the narrator says each landing total ("9… 10… 11"), so
  // every dot LANDS on its word — the count ticks on the word, the dot sets
  // off just before. Other strategies start each batch on its spoken number.
  const dotStart = Array.from({ length: unit.y }, (_, i) => {
    const staged = i < fillers ? fillAt + i * stagger : restAt + (i - fillers) * stagger;
    if (unit.strategy !== "count-on") return staged;
    return Math.max(4, Math.round(said(unit.x + i + 1, staged + travel * 0.8, -1) - travel * 0.8));
  });
  const landAt = (i: number) => dotStart[i] + travel * 0.8;
  // "10 and 3 is 13": the conclusion waits for the spoken total, and never
  // shows before the last dot has landed.
  const allLanded = unit.y > 0 ? landAt(unit.y - 1) : 0;
  const concludeAt = Math.max(allLanded, said(total, allLanded, -1));

  const filled = Array.from({ length: fillers }, (_, i) => landAt(i)).filter(
    (t) => frame >= t,
  ).length;
  const rested = Array.from({ length: rest }, (_, i) => landAt(fillers + i)).filter(
    (t) => frame >= t,
  ).length;
  const value = unit.x + filled + rested;
  const lastTick =
    rested > 0
      ? landAt(fillers + rested - 1)
      : filled > 0
        ? landAt(filled - 1)
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
              at={dotStart[i]}
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
      {tenMade && value === total && frame >= concludeAt && (
        <div style={{ fontSize: 50, color: GREEN, fontWeight: 700 }}>
          10 and {total - 10} — that&apos;s {total}
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Subtraction: take dots off, back down through the ten. */
function SceneSubtract({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const { extras, firstOff, thenOff, answer, bridgesDown } = tenFrameNumbers(unit);

  const firstFallback = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const secondFallback = Math.round(dur * 0.58); // not-speech-bound: only for clips without alignment
  const travel = 18;
  const stagger = 4;
  const gone = travel * 0.4; // frames after a dot sets off before it counts as gone

  // Bridge-down line: "15 is a ten and 5 more. Take those 5 off first… and
  // we're down to 10. Now 2 more to go… 8." The first batch leaves on the
  // SECOND 5 (the first names the extras) and is all gone by "10"; the second
  // batch leaves on the 2 and the last one is gone as she says 8. Other
  // subtraction lines ("Take all 7 of them off… Zero", "Take 3 off… 4 left")
  // name the batch once and the answer at the end.
  const firstAt = firstOff > 0 ? said(firstOff, firstFallback, bridgesDown ? before(firstOff, [unit.x, extras]) : 0) : firstFallback;
  const secondAt =
    thenOff > 0
      ? said(thenOff, secondFallback, bridgesDown ? before(thenOff, [unit.x, extras, firstOff, 10]) : 0)
      : secondFallback;
  // Spread each batch so its LAST dot is gone on the number that closes it
  // ("down to 10", "… 8"); never faster than the staged 4-frame stagger.
  const spread = (start: number, count: number, endAt: number) =>
    count > 1 ? Math.min(12, Math.max(stagger, (endAt - gone - start) / (count - 1))) : stagger;
  const tenAt = said(10, firstAt + (firstOff - 1) * stagger + gone, bridgesDown ? before(10, [unit.x]) : 0);
  const answerAt = said(answer, secondAt + (thenOff - 1) * stagger + gone, -1);
  const staggerA = spread(firstAt, firstOff, tenAt);
  const staggerB = spread(secondAt, thenOff, answerAt);

  // On a count-back unit the narrator says each remaining total ("8… 7… 6"),
  // so the j-th dot leaves exactly on its word. Other strategies keep the
  // two-batch schedule.
  const removeStart = Array.from({ length: unit.y }, (_, j) => {
    const staged = j < firstOff ? firstAt + j * staggerA : secondAt + (j - firstOff) * staggerB;
    if (unit.strategy !== "count-back") return Math.round(staged);
    return Math.max(4, Math.round(said(unit.x - j - 1, staged + gone, -1) - gone));
  });
  const goneAtF = (j: number) => removeStart[j] + gone;

  const goneA = Array.from({ length: firstOff }, (_, j) => goneAtF(j)).filter(
    (t) => frame >= t,
  ).length;
  const goneB = Array.from({ length: thenOff }, (_, j) => goneAtF(firstOff + j)).filter(
    (t) => frame >= t,
  ).length;
  const value = unit.x - goneA - goneB;
  const lastTick =
    goneB > 0
      ? goneAtF(firstOff + goneB - 1)
      : goneA > 0
        ? goneAtF(goneA - 1)
        : null;
  const atTen = firstOff > 0 && goneA >= firstOff && goneB === 0 && frame >= tenAt;

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
                at={removeStart[removalIdx]}
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
                at={removeStart[removalIdx]}
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
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const answer = unit.op === "+" ? unit.x + unit.y : unit.x - unit.y;
  // "So 7 plus 2 is 9": the answer as she says it — after x and y, which may
  // be the same number (7 take away 0 is 7).
  const answerFallback = Math.round(dur * 0.3); // not-speech-bound: only for clips without alignment
  const answerAt = said(answer, answerFallback, before(answer, [unit.x, unit.y]));
  // The tip is a sentence, not a number; it follows the answer.
  const tipAt = Math.max(Math.round(dur * 0.6), answerAt + 24); // not-speech-bound: strategy tip
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
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} voice={voice} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
