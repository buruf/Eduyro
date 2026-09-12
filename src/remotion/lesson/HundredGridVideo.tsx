// src/remotion/lesson/HundredGridVideo.tsx
// The HUNDRED GRID template (M8): a 10×10 square where tenths are whole
// columns and hundredths are single cells.
//
//   place-value — 0.3 and 0.03 drawn side by side; the size difference IS the
//                 lesson, because "they look almost the same written down" is
//                 exactly why children conflate them
//   operations  — 0.4 + 0.25 as 40 gold cells then 25 blue ones, counted live
//   percent     — one shading, three names: 37/100, 0.37, 37%
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment. A
// decimal is aligned on its digits — "0.25" is the numbers 0 then 25 — so a
// written decimal appears on its leading 0 and a cell count on its count.
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
import { hundredGridSceneTimings, saidFor, type SaidFn } from "./timeline";
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
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `hundredGridLines` (script.ts)
 *  word for word: "0.65 is 65 cells" says 65 twice, and only the second is
 *  the count. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Frames between consecutive cells in a batch so that the LAST one lands on
 *  `endAt` — never tighter than `min`, never slower than `max`. */
const spread = (start: number, count: number, endAt: number, min: number, max: number) =>
  count > 1 ? Math.min(max, Math.max(min, (endAt - start) / (count - 1))) : min;

/** The number the narrator says for a cell count written as a decimal: 40
 *  cells is "0.4" (she says 4), 25 cells is "0.25" (she says 25). */
const decDigits = (cells: number) => (cells % 10 === 0 ? cells / 10 : cells);

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
 * `revealAt`+`stagger` animate the shading from cell `revealFrom` on (cells
 * before it were shaded in an earlier scene and are simply there);
 * `cellRevealAt` gives each cell its own frame instead.
 */
function Grid({
  x,
  y,
  cell,
  goldCells = 0,
  blueCells = 0,
  revealAt = -1,
  stagger = 2,
  revealFrom = 0,
  cellRevealAt,
  groupSize,
}: {
  x: number;
  y: number;
  cell: number;
  goldCells?: number;
  blueCells?: number;
  revealAt?: number;
  stagger?: number;
  /** Cells below this index are already shaded — no fade. */
  revealFrom?: number;
  /** Per-cell reveal frame; overrides revealAt + i * stagger. */
  cellRevealAt?: (i: number) => number;
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
        const at = cellRevealAt ? cellRevealAt(i) : revealAt + (i - revealFrom) * stagger;
        const opacity =
          !filled || (revealAt < 0 && !cellRevealAt) || i < revealFrom
            ? 1
            : interpolate(frame, [at, at + 6], [0, 1], {
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
            }}
          >
            {/* Only the fill fades: a cell waiting for its word keeps its
                border, so the grid never shows holes before she reaches it. */}
            {filled && (
              <div
                style={{
                  position: "absolute",
                  inset: -1,
                  borderRadius: Math.max(3, cell * 0.14),
                  backgroundColor: colour,
                  opacity,
                }}
              />
            )}
          </div>
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
function SceneAsk({ unit, said }: SceneProps) {
  // "0.4 plus 0.25": the first number on its leading 0, the operator and the
  // second number on the second leading 0 ("0.3 × 3": the times on its own
  // 3, which is the second 3 she says when it matches the tenths digit).
  const t = unit.tenths ?? 3;
  const times = unit.times ?? 3;
  const firstAt = said(unit.mode === "percent" ? (unit.pct ?? 37) : 0, 6, 0);
  const secondAt =
    unit.mode === "multiply" ? said(times, 6, before(times, [0, t])) : said(0, 6, 1);
  const a = useEnter(firstAt);
  const a2 = useEnter(secondAt);
  const b = useEnter(40); // not-speech-bound: "Decimals… but the grid makes it easy"
  const [first, second] =
    unit.mode === "place-value"
      ? [`0.${t}`, `vs  0.0${t}`]
      : unit.mode === "operations"
        ? [dec(unit.aCells ?? 40), `+ ${dec(unit.bCells ?? 25)}`]
        : unit.mode === "subtract"
          ? [dec(unit.aCells ?? 65), `− ${dec(unit.bCells ?? 25)}`]
          : unit.mode === "multiply"
            ? [`0.${t}`, `× ${times}`]
            : [`${unit.pct}%`, ""];
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
      <div style={{ fontSize: 170, fontWeight: 800, color: INK, display: "flex", gap: 50 }}>
        <span style={{ opacity: a.opacity, translate: `0 ${a.translateY}px` }}>{first}</span>
        {second && (
          <span style={{ opacity: a2.opacity, translate: `0 ${a2.translateY}px` }}>{second}</span>
        )}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {sub}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the grid ----------------------------------------------------
function SceneGrid({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const cell = 42;
  const gridW = 10 * (cell + 4);
  const x = (STAGE_W - gridW) / 2;
  // Modes that shade a starting quantity here rather than teaching the anatomy.
  const preShade =
    unit.mode === "operations" || unit.mode === "subtract"
      ? (unit.aCells ?? 40)
      : unit.mode === "multiply"
        ? (unit.tenths ?? 3) * 10
        : 0;
  const isFirst = preShade === 0;
  // Anatomy line: "a square cut into 100 little cells. One whole column is a
  // tenth — ten cells. One little cell on its own is a hundredth." — the title
  // on the 100; "ten" and "one" are words, not digits, so the column and the
  // lone cell keep their places in the scene.
  // Shading line: "0.4 is 40 cells out of 100 — shade them gold." — the title
  // on the leading 0, the cells from the count on (the SECOND 65 in "0.65 is
  // 65 cells"; the first is the decimal's own digits).
  const title = useEnter(isFirst ? said(100, 4, 0) : said(0, 4, 0));
  const colAt = Math.round(dur * 0.35); // not-speech-bound: "ten cells" is a word
  const cellAt = Math.round(dur * 0.7); // not-speech-bound: "one little cell" is a word
  const shadeFallback = Math.round(dur * 0.3); // not-speech-bound: only for clips without alignment
  const shadeAt = preShade
    ? unit.mode === "multiply"
      ? said(unit.tenths ?? 3, shadeFallback, before(unit.tenths ?? 3, [0, unit.tenths ?? 3]))
      : said(preShade, shadeFallback, before(preShade, [0, decDigits(preShade)]))
    : colAt;
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
          revealAt={shadeAt}
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
function SceneAction({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const cell = unit.mode === "place-value" ? 36 : 42;
  // The title on the first number of its line: the leading 0 of the decimal
  // ("0.3 is…", "And 0.25 is…", "Now take 0.25 away"), the group count
  // ("Now take 3 groups"), or the percent ("Shade 37 of them").
  const title = useEnter(
    said(
      unit.mode === "multiply" ? (unit.times ?? 3) : unit.mode === "percent" ? (unit.pct ?? 37) : 0,
      4,
      0,
    ),
  );

  if (unit.mode === "place-value") {
    const t = unit.tenths ?? 3;
    const gridW = 10 * (cell + 4);
    const leftX = STAGE_W / 2 - gridW - 60;
    const rightX = STAGE_W / 2 + 60;
    // "0.3 is 3 whole columns… 30 cells. But 0.03 is just 3 little cells."
    // The columns start filling on "3 whole columns" (the second 3 — the
    // first is the decimal's digit) and the last cell lands on the 30; the
    // lone cells appear on "3 little cells", the fourth 3 of the line.
    const leftFallback = Math.round(dur * 0.16); // not-speech-bound: only for clips without alignment
    const leftAt = said(t, leftFallback, before(t, [0, t]));
    const leftCountAt = said(t * 10, leftAt + (t * 10 - 1) * 1.6, before(t * 10, [0, t, t]));
    const leftStagger = spread(leftAt, t * 10, leftCountAt, 1, 1.6);
    const rightFallback = Math.round(dur * 0.5); // not-speech-bound: only for clips without alignment
    const rightAt = said(t, rightFallback, before(t, [0, t, t, t * 10, 0, t]));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`0.${t} next to 0.0${t}`} enter={title} />
        <Stage>
          <Grid x={leftX} y={20} cell={cell} goldCells={t * 10} revealAt={leftAt} stagger={leftStagger} />
          <Grid x={rightX} y={20} cell={cell} goldCells={0} blueCells={t} revealAt={rightAt} stagger={8} />
          <div
            style={{
              position: "absolute",
              left: leftX,
              top: 440,
              width: gridW,
              textAlign: "center",
              fontSize: 66,
              fontWeight: 800,
              color: GOLD,
              opacity: frame >= leftCountAt ? 1 : 0.25,
            }}
          >
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
    // "And 0.25 is 25 cells — shade them blue, right after. Now count
    // everything shaded… 65 cells." — blue cells start on "25 cells" (the
    // second 25) and the last one lands, the count reaching 65, on the 65.
    const addFallback = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
    const addAt = said(b, addFallback, before(b, [0, decDigits(b)]));
    const sumAt = said(a + b, addAt + (b - 1) * 2, before(a + b, [0, decDigits(b), b]));
    const stagger = spread(addAt, b, sumAt, 2, 10);
    const arrived = Math.max(0, Math.min(b, Math.floor((frame - addAt) / stagger) + 1));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`Now add ${dec(b)} in blue`} enter={title} />
        <Stage>
          <Grid
            x={x}
            y={20}
            cell={cell}
            goldCells={a}
            blueCells={arrived}
            revealAt={addAt}
            stagger={stagger}
            revealFrom={a}
          />
        </Stage>
        <div style={{ fontSize: 62, fontWeight: 800, color: INK }}>{a + arrived} cells shaded</div>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "subtract") {
    const a = unit.aCells ?? 65;
    const b = unit.bCells ?? 25;
    // "Now take 0.25 away — that's 25 cells, coming off… watch the count
    // fall. 40 cells left." — cells leave from "25 cells" (the second 25)
    // and the last is gone, the count reading 40, on the 40.
    const offFallback = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
    const offAt = said(b, offFallback, before(b, [0, decDigits(b)]));
    const leftAt = said(a - b, offAt + (b - 1) * 3, before(a - b, [0, decDigits(b), b]));
    const stagger = spread(offAt, b, leftAt, 3, 10);
    // Cells leave from the top of the shading down — goldCells shrinks, and
    // because the grid fills column-first, whole columns visibly empty out.
    const removed = Math.max(0, Math.min(b, Math.floor((frame - offAt) / stagger) + 1));
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
    // "Now take 3 groups of it… 0.3… 0.6… 0.9. 9 tenths altogether." — the
    // first group starts filling on the 3 (of "3 groups") and each group's
    // last cell lands on its running total's digits (3, 6, 9 — the first
    // of which is the second 3 she says when it matches the group count);
    // the next group starts where the previous one landed.
    const addFallback = Math.round(dur * 0.16); // not-speech-bound: only for clips without alignment
    const groups: { start: number; stagger: number }[] = [];
    const earlier: number[] = [times];
    let start = said(times, addFallback, 0);
    for (let g = 0; g < times; g++) {
      const total = t * (g + 1);
      earlier.push(0);
      const landAt = said(total, start + (groupCells - 1) * 1.6, before(total, earlier));
      earlier.push(total);
      const stagger = spread(start, groupCells, landAt, 1, 1.6);
      groups.push({ start, stagger });
      start = start + (groupCells - 1) * stagger;
    }
    const cellAt = (i: number) => {
      const g = Math.min(times - 1, Math.floor(i / groupCells));
      return groups[g].start + (i - g * groupCells) * groups[g].stagger;
    };
    let shown = 0;
    for (let i = 0; i < groupCells * times; i++) if (frame >= cellAt(i)) shown = i + 1;
    const groupsDone = Math.floor(shown / groupCells);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title text={`${times} groups of 0.${t}`} enter={title} />
        <Stage>
          <Grid x={x} y={20} cell={cell} goldCells={shown} cellRevealAt={cellAt} groupSize={groupCells} />
        </Stage>
        <div style={{ fontSize: 62, fontWeight: 800, color: INK }}>
          {((t * Math.min(groupsDone, times)) / 10).toFixed(1)}
          {shown >= groupCells * times ? ` — ${times} groups` : "…"}
        </div>
      </AbsoluteFill>
    );
  }

  const p = unit.pct ?? 37;
  // "Shade 37 of them… that's 37 percent." — shading starts on the first 37
  // and the last cell lands, the label reading 37%, on the second.
  const shadeFallback = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const shadeAt = said(p, shadeFallback, 0);
  const doneAt = said(p, shadeAt + (p - 1) * 2, 1);
  const stagger = spread(shadeAt, p, doneAt, 1, 10);
  const shaded = Math.max(0, Math.min(p, Math.floor((frame - shadeAt) / stagger) + 1));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Title text={`Shade ${p} of the 100`} enter={title} />
      <Stage>
        <Grid x={x} y={20} cell={cell} goldCells={shaded} revealAt={shadeAt} stagger={stagger} />
      </Stage>
      <div style={{ fontSize: 62, fontWeight: 800, color: GOLD }}>
        {shaded} cell{shaded === 1 ? "" : "s"}
        {shaded === p ? ` — ${p}%` : "…"}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: scene title
  const tipFallback = Math.round(dur * 0.55); // not-speech-bound: only for clips without alignment / tips with no number
  const show = (at: number) => ({ opacity: frame >= at ? 1 : 0 });
  const t = unit.tenths ?? 3;
  const times = unit.times ?? 3;
  const total = t * times;

  // Each written number appears on its leading 0 — the k-th 0 of the line,
  // since every decimal she reads starts with one:
  //   operations "65 cells out of 100 is 0.65. So 0.4 plus 0.25 is 0.65."
  //   subtract   "40 cells is 0.4. So 0.65 take away 0.25 is 0.4."
  //   multiply   "9 tenths is 0.9. So 0.3 × 3 is 0.9."
  //   percent    "three names: 37 out of 100… 0.37… and 37%."
  // Place-value keeps its decimals on screen from the start: "first place
  // after the dot" needs a dot to point at; its tip IS the spoken "0.3 is
  // 3 whole columns…", so it lands on that first 0.
  const tipAt =
    unit.mode === "place-value" ? said(0, tipFallback, 0) : tipFallback;

  const main =
    unit.mode === "place-value" ? (
      <div style={{ fontSize: 110, fontWeight: 800, color: INK, display: "flex", gap: 70 }}>
        <span>
          0.{t} <span style={{ color: GOLD, fontSize: 60 }}>columns</span>
        </span>
        <span>
          0.0{t} <span style={{ color: BLUE, fontSize: 60 }}>cells</span>
        </span>
      </div>
    ) : unit.mode === "operations" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        <span style={show(said(0, 0, 1))}>{dec(unit.aCells ?? 40)}</span>
        <span style={show(said(0, 0, 2))}> + {dec(unit.bCells ?? 25)}</span>
        <span style={show(said(0, 0, 3))}>
          {" "}
          = <span style={{ color: GREEN }}>{dec((unit.aCells ?? 40) + (unit.bCells ?? 25))}</span>
        </span>
      </div>
    ) : unit.mode === "subtract" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        <span style={show(said(0, 0, 1))}>{dec(unit.aCells ?? 65)}</span>
        <span style={show(said(0, 0, 2))}> − {dec(unit.bCells ?? 25)}</span>
        <span style={show(said(0, 0, 3))}>
          {" "}
          = <span style={{ color: GREEN }}>{dec((unit.aCells ?? 65) - (unit.bCells ?? 25))}</span>
        </span>
      </div>
    ) : unit.mode === "multiply" ? (
      <div style={{ fontSize: 130, fontWeight: 800, color: INK }}>
        <span style={show(said(0, 0, 1))}>0.{t}</span>
        <span style={show(said(times, 0, before(times, [total, 0, total, 0, t])))}> × {times}</span>
        <span style={show(said(0, 0, 2))}>
          {" "}
          = <span style={{ color: GREEN }}>{(total / 10).toFixed(1)}</span>
        </span>
      </div>
    ) : (
      <div style={{ fontSize: 110, fontWeight: 800, color: INK, display: "flex", gap: 66, alignItems: "center" }}>
        <span style={show(said(unit.pct ?? 37, 0, 0))}>
          {unit.pct}
          <span style={{ color: MUTED }}>/100</span>
        </span>
        <span style={{ color: MUTED, ...show(said(0, 0, 0)) }}>=</span>
        <span style={show(said(0, 0, 0))}>{((unit.pct ?? 37) / 100).toFixed(2)}</span>
        <span style={{ color: MUTED, ...show(said(unit.pct ?? 37, 0, 2)) }}>=</span>
        <span style={{ color: GREEN, ...show(said(unit.pct ?? 37, 0, 2)) }}>{unit.pct}%</span>
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
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
