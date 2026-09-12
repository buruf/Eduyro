// src/remotion/lesson/FractionOpsVideo.tsx
// The FRACTION OPERATIONS template (M7): subtract, divide, mixed, improper
// and order on the same equal-parts BAR the earlier fraction videos taught,
// plus the one picture a bar cannot draw — multiplication as a fraction OF a
// fraction, on a square cut both ways.
//
// Same design rules as every template: numbers derive from the unit, visuals
// animate on the frame clock, and each scene carries its own narration clip
// so voice and picture share one clock.
//
// Sync: every reveal that shows something the narrator says is timed with
// `said(n, fallback, occurrence)` from the scene's clip alignment (timeline
// `saidFor`). A fraction "5/8" is aligned on its two digits in order: a bar's
// cuts land on the denominator, its shading on the numerator, each headline
// digit on its own word, an operator with the number after it, a product or
// quotient on its digits. Reveals that follow no spoken number keep their
// frames and are marked `// not-speech-bound`.
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
import { fracOpsSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { fracOpsUnitById, fracOpsNumbers, type FracOpsUnit } from "./units-fracops";

export type FracOpsProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const RED = "#B23B2E";
const EDGE = "#8A5E10";

const STAGE_W = 1500;
const BAR_W = 1200;
const BAR_H = 120;
const BAR_X = (STAGE_W - BAR_W) / 2;

interface SceneProps {
  dur: number;
  unit: FracOpsUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** The frames at which a line's numbers are said, in the order the line says
 *  them (`order` mirrors `fracOpsLines` in script-fracops.ts word for word, so
 *  a repeated digit — "5/8… cut into 8 parts" — resolves to the right
 *  occurrence). Every entry falls back to `fallback` for clips without
 *  alignment. */
const spokenAt = (said: SaidFn, order: number[], fallback: number) =>
  order.map((n, k) => said(n, fallback, before(n, order.slice(0, k))));

/** Frames at which `count` items appear one after another so that the LAST
 *  lands on `landAt`; the first never earlier than `floor` and the gap never
 *  wider than `maxGap` frames nor tighter than 2. With the old fallback frames
 *  this reproduces the old even stagger exactly. */
const landing = (landAt: number, count: number, floor: number, maxGap: number) => {
  const gap = count > 1 ? Math.min(maxGap, Math.max(2, (landAt - floor) / (count - 1))) : 0;
  return (i: number) => Math.round(landAt - (count - 1 - i) * gap);
};
/** A stagger whose last item lands on `landAt` (never starting before the
 *  first few frames of the scene). */
const stagger = (landAt: number, count: number, gap: number) =>
  landing(landAt, count, Math.min(landAt, 10), gap);

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

/** Wraps children that enter (fade + rise) on frame `at`. */
function Enter({ at, children, style }: { at: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const enter = useEnter(at);
  return <div style={{ ...style, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>{children}</div>;
}

type TextPart = { text: string; at: number; colour?: string };

/** One piece of a line of text, entering on its own frame. */
function Part({ text, at, colour }: TextPart) {
  const enter = useEnter(at);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        color: colour,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
      }}
    >
      {text}
    </span>
  );
}

/** A line of text whose pieces appear as the narrator reaches them. */
function Parts({ parts, style }: { parts: TextPart[]; style: React.CSSProperties }) {
  return (
    <div style={style}>
      {parts.map((p, i) => (
        <Part key={`${i}-${p.text}`} {...p} />
      ))}
    </div>
  );
}

const HEADLINE: React.CSSProperties = { fontSize: 78, fontWeight: 700, color: INK, textAlign: "center" };
const SUBLINE: React.CSSProperties = { fontSize: 44, fontWeight: 800, color: GREEN, textAlign: "center" };

/** "n/d" as two text pieces: the numerator (with its slash) on `nAt`, the
 *  denominator on `dAt` — the narrator says "five… eighths". */
const fracText = (n: number, d: number, nAt: number, dAt: number, colour?: string): TextPart[] => [
  { text: `${n}/`, at: nAt, colour },
  { text: `${d}`, at: dAt, colour },
];

/** Stacked fraction — a child should see the bar in it. `nAt` / `dAt` are the
 *  frames the numerator and denominator enter; absent → on screen from the
 *  start. */
function Frac({
  n,
  d,
  size = 120,
  color = INK,
  nAt,
  dAt,
}: {
  n: number;
  d: number;
  size?: number;
  color?: string;
  nAt?: number;
  dAt?: number;
}) {
  const nIn = useEnter(nAt ?? -20);
  const dIn = useEnter(dAt ?? -20);
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
      <span style={{ opacity: nIn.opacity, translate: `0 ${nIn.translateY}px` }}>{n}</span>
      <span
        style={{
          width: size * 0.5,
          height: Math.max(6, size * 0.045),
          backgroundColor: color,
          borderRadius: 4,
          opacity: nIn.opacity,
        }}
      />
      <span style={{ opacity: dIn.opacity, translate: `0 ${dIn.translateY}px` }}>{d}</span>
    </span>
  );
}

/** A bar of `parts` equal cells with per-cell fill control. `cutAt(i)` is the
 *  frame the i-th interior cut appears, `cellAt(i)` the frame the i-th filled
 *  cell fades in (absent → there from the start). */
function Bar({
  y,
  parts,
  fill,
  width = BAR_W,
  x = BAR_X,
  label,
  cutAt,
  cellAt,
}: {
  y: number;
  parts: number;
  /** For each cell index: color to fill, or null for empty. */
  fill: (i: number) => string | null;
  width?: number;
  x?: number;
  label?: React.ReactNode;
  cutAt?: (i: number) => number;
  cellAt?: (i: number) => number;
}) {
  const frame = useCurrentFrame();
  const cellW = width / parts;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height: BAR_H,
          border: `4px solid ${EDGE}`,
          borderRadius: 12,
        }}
      />
      {Array.from({ length: parts }, (_, i) => {
        const c = fill(i);
        return c ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + i * cellW + 4,
              top: y + 4,
              width: cellW - 8,
              height: BAR_H - 8,
              borderRadius: 8,
              backgroundColor: c,
              opacity: cellAt ? fadeIn(frame, cellAt(i), 8) : 1,
            }}
          />
        ) : null;
      })}
      {Array.from({ length: parts - 1 }, (_, i) => (
        <div
          key={`c${i}`}
          style={{
            position: "absolute",
            left: x + (i + 1) * cellW - 2,
            top: y,
            width: 4,
            height: BAR_H,
            backgroundColor: EDGE,
            opacity: !cutAt || frame >= cutAt(i) ? 1 : 0,
          }}
        />
      ))}
      {label !== undefined && (
        <div
          style={{
            position: "absolute",
            left: x - 150,
            top: y + BAR_H / 2 - 55,
            width: 130,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

function fadeOut(frame: number, at: number, dur = 16): number {
  return interpolate(frame, [at, at + dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}
function fadeIn(frame: number, at: number, dur = 12): number {
  return interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const x = fracOpsNumbers(unit);
  const TITLE_AT = 4; // frame a headline used to enter; the fallback for its digits

  // ---- subtract: shaded pieces leave the bar --------------------------------
  if (unit.mode === "subtract") {
    const removing = sceneId === "action";
    const shownShaded = sceneId === "ask" ? 0 : unit.n;
    // ask: "5/8, take away 2/8" · parts: "Here's 5/8: a bar cut into 8 equal
    // parts, with 5 of them shaded" · action: "take 2 … away … 3 pieces …
    // still 8ths" · record: "5/8 minus 2/8 is 3/8".
    const order =
      sceneId === "ask"
        ? [unit.n, unit.d, x.n2, unit.d]
        : sceneId === "parts"
          ? [unit.n, unit.d, unit.d, unit.n]
          : sceneId === "action"
            ? [x.n2, x.diff, unit.d]
            : [unit.n, unit.d, x.n2, unit.d, x.diff, unit.d];
    const at = spokenAt(said, order, TITLE_AT);
    // parts: the bar used to be complete at frame 0 — cuts land on the second
    // "8", shaded parts on the second "5".
    const cutsAt = sceneId === "parts" ? stagger(said(unit.d, 0, 1), unit.d - 1, 10) : undefined;
    const cellsAt = sceneId === "parts" ? stagger(said(unit.n, 0, 1), unit.n, 8) : undefined;
    // action: the leaving pieces start going on "2", one after another,
    // right to left.
    const leaveAt = said(x.n2, Math.round(dur * 0.25)); // not-speech-bound: fallback only, for clips without alignment
    const leaveGap = Math.round(dur * 0.12); // not-speech-bound: the gap between leaving pieces — "watch them go" names no number
    const leftAt = said(x.diff, Math.round(dur * 0.6)); // not-speech-bound: fallback only, for clips without alignment
    const headline: TextPart[] =
      sceneId === "ask"
        ? [...fracText(unit.n, unit.d, at[0], at[1]), { text: " − ", at: at[2] }, ...fracText(x.n2, unit.d, at[2], at[3]), { text: " = ?", at: at[3] }]
        : sceneId === "parts"
          ? [{ text: "Here's ", at: TITLE_AT }, ...fracText(unit.n, unit.d, at[0], at[1])]
          : sceneId === "action"
            ? [{ text: "Take ", at: TITLE_AT }, { text: `${x.n2}`, at: at[0] }, { text: " pieces away", at: at[0] }]
            : [
                ...fracText(unit.n, unit.d, at[0], at[1]),
                { text: " − ", at: at[2] },
                ...fracText(x.n2, unit.d, at[2], at[3]),
                { text: " = ", at: at[4] },
                ...fracText(x.diff, unit.d, at[4], at[5]),
              ];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
        <Parts parts={headline} style={HEADLINE} />
        <div style={{ position: "relative", width: STAGE_W, height: 240 }}>
          <Bar
            y={40}
            parts={unit.d}
            cutAt={cutsAt}
            cellAt={cellsAt}
            fill={(i) => {
              if (i >= shownShaded) return null;
              const isLeaving = i >= unit.n - x.n2;
              if (!removing) return sceneId === "record" && isLeaving ? null : GOLD;
              if (!isLeaving) return GOLD;
              // Leaving pieces flash red then fade, staggered right-to-left.
              const at = leaveAt + (unit.n - 1 - i) * leaveGap;
              const gone = fadeOut(frame, at);
              if (gone <= 0.02) return null;
              return frame >= at - 10 ? RED : GOLD;
            }}
          />
          {removing && (
            <Parts
              parts={[
                { text: `${x.diff}`, at: leftAt, colour: GREEN },
                { text: " left", at: leftAt, colour: GREEN },
                { text: ` — still ${unit.d}ths`, at: at[2], colour: GREEN },
              ]}
              style={{ ...SUBLINE, position: "absolute", left: 0, width: STAGE_W, top: 180 }}
            />
          )}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // ---- multiply: the two-way grid ------------------------------------------
  if (unit.mode === "multiply") {
    const cols = x.d2;
    const rows = unit.d;
    const G = 560;
    const gx = (STAGE_W - G) / 2;
    const showRows = sceneId === "action" || sceneId === "record";
    // ask: "1/2 times 3/4" · parts: "Start with the 3/4: a square cut into 4
    // columns, with 3 of them shaded" · action: "take 1/2 of THAT. Cut … into
    // 2 rows… keep just 1 row… 3 pieces survive, out of 8" · record: "1/2
    // times 3/4 is 3/8. Tops multiply: 1 times 3 is 3. Bottoms multiply: 2
    // times 4 is 8."
    const order =
      sceneId === "ask"
        ? [unit.n, unit.d, x.n2, x.d2]
        : sceneId === "parts"
          ? [x.n2, x.d2, x.d2, x.n2]
          : sceneId === "action"
            ? [unit.n, unit.d, unit.d, unit.n, x.prodN, x.prodD]
            : [unit.n, unit.d, x.n2, x.d2, x.prodN, x.prodD, unit.n, x.n2, x.prodN, unit.d, x.d2, x.prodD];
    const at = spokenAt(said, order, TITLE_AT);
    // The shaded columns and their cuts used to be complete at frame 0: in
    // ask they land on "3/4"'s digits, in parts on the second "4" / "3".
    const colCutAt =
      sceneId === "ask"
        ? stagger(said(x.d2, 0), cols - 1, 10)
        : sceneId === "parts"
          ? stagger(said(x.d2, 0, 1), cols - 1, 10)
          : undefined;
    const colAt =
      sceneId === "ask" ? stagger(said(x.n2, 0), x.n2, 8) : sceneId === "parts" ? stagger(said(x.n2, 0, 1), x.n2, 8) : undefined;
    const rowCutAt = sceneId === "action" ? said(unit.d, Math.round(dur * 0.2), 1) : 0; // not-speech-bound: fallback only, for clips without alignment
    const keepAt = sceneId === "action" ? said(unit.n, Math.round(dur * 0.45), 1) : 0; // not-speech-bound: fallback only, for clips without alignment
    const countAt = said(x.prodN, Math.round(dur * 0.75)); // not-speech-bound: fallback only, for clips without alignment
    const ofAt = said(x.prodD, Math.round(dur * 0.9)); // not-speech-bound: fallback only, for clips without alignment
    const headline: TextPart[] =
      sceneId === "ask"
        ? [...fracText(unit.n, unit.d, at[0], at[1]), { text: " × ", at: at[2] }, ...fracText(x.n2, x.d2, at[2], at[3]), { text: " — times means OF", at: at[3] }]
        : sceneId === "parts"
          ? [{ text: "Shade ", at: TITLE_AT }, ...fracText(x.n2, x.d2, at[0], at[1])]
          : sceneId === "action"
            ? [{ text: "Take ", at: TITLE_AT }, ...fracText(unit.n, unit.d, at[0], at[1]), { text: " of the shading", at: at[1] }]
            : [
                ...fracText(unit.n, unit.d, at[0], at[1]),
                { text: " × ", at: at[2] },
                ...fracText(x.n2, x.d2, at[2], at[3]),
                { text: " = ", at: at[4] },
                ...fracText(x.prodN, x.prodD, at[4], at[5]),
              ];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Parts parts={headline} style={HEADLINE} />
        <div style={{ position: "relative", width: STAGE_W, height: G + 40 }}>
          <div
            style={{
              position: "absolute",
              left: gx,
              top: 20,
              width: G,
              height: G,
              border: `5px solid ${EDGE}`,
              borderRadius: 14,
            }}
          />
          {Array.from({ length: cols }, (_, c) =>
            c < x.n2 ? (
              <div
                key={c}
                style={{
                  position: "absolute",
                  left: gx + (c * G) / cols + 4,
                  top: 24,
                  width: G / cols - 8,
                  height: G - 8,
                  borderRadius: 8,
                  backgroundColor: GOLD,
                  opacity: (sceneId === "ask" ? 0.35 : 0.8) * (colAt ? fadeIn(frame, colAt(c), 8) : 1),
                }}
              />
            ) : null,
          )}
          {Array.from({ length: cols - 1 }, (_, c) => (
            <div
              key={`cc${c}`}
              style={{
                position: "absolute",
                left: gx + ((c + 1) * G) / cols - 2,
                top: 20,
                width: 4,
                height: G,
                backgroundColor: EDGE,
                opacity: !colCutAt || frame >= colCutAt(c) ? 1 : 0,
              }}
            />
          ))}
          {showRows &&
            Array.from({ length: rows - 1 }, (_, r) => (
              <div
                key={`rc${r}`}
                style={{
                  position: "absolute",
                  left: gx,
                  top: 20 + ((r + 1) * G) / rows - 2,
                  width: G,
                  height: 4,
                  backgroundColor: EDGE,
                  opacity: sceneId === "record" ? 1 : fadeIn(frame, rowCutAt),
                }}
              />
            ))}
          {showRows &&
            Array.from({ length: x.n2 }, (_, c) => (
              <div
                key={`k${c}`}
                style={{
                  position: "absolute",
                  left: gx + (c * G) / cols + 4,
                  top: 20 + ((rows - unit.n) * G) / rows + 4,
                  width: G / cols - 8,
                  height: (G * unit.n) / rows - 8,
                  borderRadius: 8,
                  backgroundColor: BLUE,
                  opacity: sceneId === "record" ? 0.85 : fadeIn(frame, keepAt + c * 10) * 0.85,
                }}
              />
            ))}
          {sceneId === "action" && (
            <Parts
              parts={[
                { text: `${x.prodN}`, at: countAt, colour: BLUE },
                { text: " pieces survive", at: countAt, colour: BLUE },
                { text: ` of ${x.prodD}`, at: ofAt, colour: BLUE },
              ]}
              style={{ ...SUBLINE, position: "absolute", left: gx + G + 30, width: STAGE_W - gx - G - 30, top: G / 2 - 20, textAlign: "left" }}
            />
          )}
        </div>
        {sceneId === "record" && (
          <Parts
            parts={[
              { text: `${unit.n}`, at: at[6] },
              { text: ` × ${x.n2}`, at: at[7] },
              { text: ` = ${x.prodN}`, at: at[8] },
              { text: " on top · ", at: at[8] },
              { text: `${unit.d}`, at: at[9] },
              { text: ` × ${x.d2}`, at: at[10] },
              { text: ` = ${x.prodD}`, at: at[11] },
              { text: " underneath", at: at[11] },
            ]}
            style={SUBLINE}
          />
        )}
      </AbsoluteFill>
    );
  }

  // ---- divide: a measuring piece hops across the shading --------------------
  if (unit.mode === "divide") {
    const cellW = BAR_W / unit.d;
    const hops = x.quot;
    // ask: "3/4 divided by 1/4" · parts: "Here's 3/4: 3 shaded quarters. And
    // here's the measuring piece: a single 1/4." · action: the fits are
    // counted as WORDS ("One… two… three"), then "exactly 3 times" · record:
    // "3/4 divided by 1/4 is 3 … same answer as 3/4 times 4/1".
    const order =
      sceneId === "ask"
        ? [unit.n, unit.d, x.n2, x.d2]
        : sceneId === "parts"
          ? [unit.n, unit.d, unit.n, x.n2, x.d2]
          : sceneId === "action"
            ? [x.quot]
            : [unit.n, unit.d, x.n2, x.d2, x.quot, unit.n, unit.d, x.d2, x.n2];
    const at = spokenAt(said, order, TITLE_AT);
    // parts: the bar used to be complete at frame 0 — cuts land on "4",
    // shading on the second "3", the measuring piece on "1/4".
    const cutsAt = sceneId === "parts" ? stagger(said(unit.d, 0), unit.d - 1, 10) : undefined;
    const cellsAt = sceneId === "parts" ? stagger(said(unit.n, 0, 1), unit.n, 8) : undefined;
    const pieceAt = sceneId === "parts" ? said(x.n2, 0) : -20;
    // action: the counted fits are words the alignment does not carry, so
    // they keep their even stagger — but all are in place by "3 times".
    const hopEvery = Math.round((dur * 0.55) / Math.max(1, hops)); // not-speech-bound: "One… two… three" are words, not aligned
    const hopStart = Math.round(dur * 0.2); // not-speech-bound: "One… two… three" are words, not aligned
    const quotAt = said(x.quot, hopStart + (hops - 1) * hopEvery);
    const hopAt = (i: number) => Math.min(hopStart + i * hopEvery, quotAt - (hops - 1 - i) * 2);
    const fitsShown =
      sceneId === "action"
        ? Array.from({ length: hops }, (_, i) => i).filter((i) => frame >= hopAt(i)).length
        : sceneId === "record"
          ? hops
          : 0;
    const headline: TextPart[] =
      sceneId === "ask"
        ? [...fracText(unit.n, unit.d, at[0], at[1]), { text: " ÷ ", at: at[2] }, ...fracText(x.n2, x.d2, at[2], at[3]), { text: " — how many fit?", at: at[3] }]
        : sceneId === "parts"
          ? [...fracText(unit.n, unit.d, at[0], at[1]), { text: ", and a ", at: at[3] }, ...fracText(x.n2, x.d2, at[3], at[4]), { text: " to measure with", at: at[4] }]
          : sceneId === "action"
            ? [{ text: "Count the fits", at: TITLE_AT }]
            : [
                ...fracText(unit.n, unit.d, at[0], at[1]),
                { text: " ÷ ", at: at[2] },
                ...fracText(x.n2, x.d2, at[2], at[3]),
                { text: " = ", at: at[4] },
                { text: `${x.quot}`, at: at[4] },
              ];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Parts parts={headline} style={HEADLINE} />
        <div style={{ position: "relative", width: STAGE_W, height: 330 }}>
          <Bar
            y={20}
            parts={unit.d}
            cutAt={cutsAt}
            cellAt={cellsAt}
            fill={(i) => (sceneId === "ask" ? null : i < unit.n ? GOLD : null)}
          />
          {sceneId !== "ask" && (
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 200,
                width: cellW - 8,
                height: BAR_H - 30,
                border: `4px solid ${BLUE}`,
                borderRadius: 10,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Enter at={pieceAt}>
                <Frac
                  n={x.n2}
                  d={x.d2}
                  size={70}
                  color={BLUE}
                  nAt={sceneId === "parts" ? at[3] : undefined}
                  dAt={sceneId === "parts" ? at[4] : undefined}
                />
              </Enter>
            </div>
          )}
          {Array.from({ length: fitsShown }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: BAR_X + i * cellW + 8,
                top: 28,
                width: cellW - 16,
                height: BAR_H - 16,
                borderRadius: 10,
                border: `6px solid ${BLUE}`,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: 44, fontWeight: 800, color: BLUE, marginRight: 8 }}>{i + 1}</span>
            </div>
          ))}
          {sceneId === "action" && (
            <Parts
              parts={[{ text: `${x.quot} fits`, at: quotAt, colour: BLUE }]}
              style={{ ...SUBLINE, position: "absolute", left: BAR_X + cellW + 40, top: 220, textAlign: "left", color: BLUE }}
            />
          )}
        </div>
        {sceneId === "record" && (
          <Parts
            parts={[
              { text: "same as ", at: at[5] },
              ...fracText(unit.n, unit.d, at[5], at[6]),
              { text: " × ", at: at[7] },
              ...fracText(x.d2, x.n2, at[7], at[8]),
              { text: " — flip, then multiply", at: at[8] },
            ]}
            style={SUBLINE}
          />
        )}
      </AbsoluteFill>
    );
  }

  // ---- mixed & improper: whole bars plus parts ------------------------------
  if (unit.mode === "mixed" || unit.mode === "improper") {
    const isMixed = unit.mode === "mixed";
    const d = unit.d;
    const topN = isMixed ? d : Math.min(unit.n, d);
    const botN = isMixed ? unit.n : x.rem;
    const fillAt = Math.round(dur * 0.2); // not-speech-bound: fallback only, for clips without alignment
    const per = Math.round((dur * 0.55) / (topN + botN || 1)); // not-speech-bound: fallback gap only, for clips without alignment
    // mixed — ask: "One and 3/4" ("One" is a word, not aligned) · parts: "Two
    // bars, cut into 4ths. The first is completely full - that's the 1 …
    // The second has 3 parts shaded - that's the 3/4." · action: "count
    // EVERYTHING in 4ths. The full bar holds 4 … plus the 3 … 7 4ths" ·
    // record: "one and 3/4 is the same amount as 7/4".
    // improper — ask: "7/4" · parts: "Here are 7 loose pieces, each one a
    // 4th" · action: "4 of them fill one whole bar … the 3 left over fill 3
    // parts" · record: "7/4 is 1 whole and 3/4".
    const order = isMixed
      ? sceneId === "ask"
        ? [unit.n, d]
        : sceneId === "parts"
          ? [d, 1, unit.n, unit.n, d]
          : sceneId === "action"
            ? [d, d, unit.n, x.improperN, d]
            : [unit.n, d, x.improperN, d]
      : sceneId === "ask"
        ? [unit.n, d]
        : sceneId === "parts"
          ? [unit.n, d]
          : sceneId === "action"
            ? [d, x.rem, x.rem]
            : [unit.n, d, x.wholes, x.rem, d];
    const at = spokenAt(said, order, TITLE_AT);
    // Frames the top bar's last cell and the bottom bar's last cell land on.
    // Fallbacks reproduce the old even count-up (action) or frame 0 (the
    // scenes that showed everything at once).
    const topLandFb = sceneId === "action" ? fillAt + (topN - 1) * per : 0;
    const botLandFb = sceneId === "action" ? fillAt + (topN + botN - 1) * per : 0;
    const topLand = isMixed
      ? sceneId === "parts"
        ? said(1, topLandFb)
        : sceneId === "action"
          ? said(d, topLandFb, 1)
          : topLandFb
      : sceneId === "action"
        ? said(d, topLandFb)
        : topLandFb;
    const botLand = isMixed
      ? sceneId === "parts"
        ? said(unit.n, botLandFb)
        : sceneId === "action"
          ? said(unit.n, botLandFb)
          : botLandFb
      : sceneId === "action"
        ? said(x.rem, botLandFb, 1)
        : botLandFb;
    const topAt = stagger(topLand, topN, per);
    const botAt = landing(botLand, botN, Math.min(botLand, topLand + 2), per);
    const filled =
      sceneId === "action"
        ? topN + botN
        : sceneId === "ask"
          ? 0
          : sceneId === "parts"
            ? isMixed
              ? topN + botN
              : 0
            : topN + botN;
    const cutsAt = isMixed && sceneId === "parts" ? stagger(said(d, 0), d - 1, 10) : undefined;
    const loosePieceAt = said(unit.n, Math.round(dur * 0.2)); // not-speech-bound: fallback only, for clips without alignment
    const totalAt = isMixed && sceneId === "action" ? at[3] : -20;
    const headline: TextPart[] = isMixed
      ? sceneId === "ask"
        ? [{ text: "1 ", at: TITLE_AT }, ...fracText(unit.n, d, at[0], at[1]), { text: " — a mixed number", at: at[1] }]
        : sceneId === "parts"
          ? [{ text: "A whole bar, and ", at: TITLE_AT }, ...fracText(unit.n, d, at[3], at[4]), { text: " more", at: at[4] }]
          : sceneId === "action"
            ? [{ text: "Count everything in ", at: TITLE_AT }, { text: `${d}ths`, at: at[0] }]
            : [{ text: "1 ", at: TITLE_AT }, ...fracText(unit.n, d, at[0], at[1]), { text: " = ", at: at[2] }, ...fracText(x.improperN, d, at[2], at[3])]
      : sceneId === "ask"
        ? [...fracText(unit.n, d, at[0], at[1]), { text: " — top BIGGER than bottom?", at: at[1] }]
        : sceneId === "parts"
          ? [{ text: `${unit.n}`, at: at[0] }, { text: " loose ", at: at[0] }, { text: `${d}th pieces`, at: at[1] }]
          : sceneId === "action"
            ? [{ text: "Fill whole bars first", at: TITLE_AT }]
            : [
                ...fracText(unit.n, d, at[0], at[1]),
                { text: " = ", at: at[2] },
                { text: `${x.wholes} whole`, at: at[2] },
                { text: " + ", at: at[3] },
                ...fracText(x.rem, d, at[3], at[4]),
              ];
    // Bar labels: in the mixed "parts" scene the "1" lands on its word and the
    // 3/4 on its digits; elsewhere they are there from the start.
    const oneAt = isMixed && sceneId === "parts" ? said(1, 0) : -20;
    const fracLabelAt = isMixed && sceneId === "parts" ? [said(unit.n, 0, 1), said(d, 0, 1)] : [undefined, undefined];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Parts parts={headline} style={HEADLINE} />
        <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
          <Bar
            y={10}
            parts={d}
            fill={(i) => (i < Math.min(filled, topN) ? GOLD : null)}
            cutAt={cutsAt}
            cellAt={topAt}
            label={
              <Enter at={oneAt} style={{ fontSize: 50, fontWeight: 800, color: GOLD }}>
                1
              </Enter>
            }
          />
          <Bar
            y={190}
            parts={d}
            fill={(i) => (i < filled - topN ? BLUE : null)}
            cutAt={cutsAt}
            cellAt={(i) => botAt(i)}
            label={<Frac n={isMixed ? unit.n : x.rem} d={d} size={80} color={BLUE} nAt={fracLabelAt[0]} dAt={fracLabelAt[1]} />}
          />
          {!isMixed && sceneId === "parts" && (
            <div style={{ position: "absolute", left: BAR_X, top: 70, display: "flex", gap: 14 }}>
              {Array.from({ length: unit.n }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 10,
                    backgroundColor: i < d ? GOLD : BLUE,
                    border: `4px solid ${EDGE}`,
                    opacity: fadeIn(frame, loosePieceAt + i * 8),
                  }}
                />
              ))}
            </div>
          )}
          {isMixed && sceneId === "action" && (
            <Parts
              parts={[
                { text: `${x.improperN}`, at: totalAt, colour: GREEN },
                { text: ` ${d}ths altogether`, at: at[4], colour: GREEN },
              ]}
              style={{ ...SUBLINE, position: "absolute", left: 0, width: STAGE_W, top: 190 + BAR_H + 6 }}
            />
          )}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // ---- order: three same-length bars ---------------------------------------
  const rows = [
    { n: unit.n, d: unit.d, c: GOLD },
    { n: x.n2, d: x.d2, c: BLUE },
    { n: x.n3, d: x.d3, c: GREEN },
  ];
  const per = Math.round((dur * 0.5) / 3); // not-speech-bound: fallback gap only, for clips without alignment
  const hlStart = Math.round(dur * 0.2); // not-speech-bound: fallback only, for clips without alignment
  // ask: "3/8, 1/2, and 3/4" · parts: names no number · action: "3/8 reaches
  // the shortest… 1/2 reaches further… 3/4 reaches the furthest" · record:
  // "Smallest to biggest: 3/8, then 1/2, then 3/4". The same six digits in
  // the same order in every scene that says them.
  const order = [unit.n, unit.d, x.n2, x.d2, x.n3, x.d3];
  const at = sceneId === "parts" ? order.map(() => -20) : spokenAt(said, order, TITLE_AT);
  // action: each row's flag lands on its fraction's denominator.
  const flagAt = (ri: number) => (sceneId === "action" ? said(rows[ri].d, hlStart + ri * per, before(rows[ri].d, order.slice(0, 2 * ri + 1))) : 0);
  const highlight =
    sceneId === "action" ? rows.filter((_, ri) => frame >= flagAt(ri)).length : sceneId === "record" ? 3 : 0;
  const headline: TextPart[] =
    sceneId === "ask"
      ? [
          ...fracText(unit.n, unit.d, at[0], at[1]),
          { text: " · ", at: at[2] },
          ...fracText(x.n2, x.d2, at[2], at[3]),
          { text: " · ", at: at[4] },
          ...fracText(x.n3, x.d3, at[4], at[5]),
          { text: " — which is biggest?", at: at[5] },
        ]
      : sceneId === "parts"
        ? [{ text: "Same-length bars for all three", at: TITLE_AT }]
        : sceneId === "action"
          ? [{ text: "Read how far the shading reaches", at: TITLE_AT }]
          : [
              ...fracText(unit.n, unit.d, at[0], at[1]),
              { text: " < ", at: at[2] },
              ...fracText(x.n2, x.d2, at[2], at[3]),
              { text: " < ", at: at[4] },
              ...fracText(x.n3, x.d3, at[4], at[5]),
            ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
      <Parts parts={headline} style={HEADLINE} />
      <div style={{ position: "relative", width: STAGE_W, height: 470 }}>
        {rows.map((r, ri) => (
          <React.Fragment key={ri}>
            <Bar
              y={10 + ri * 160}
              parts={r.d}
              fill={(i) => (sceneId === "ask" ? null : i < r.n ? r.c : null)}
              label={
                <Frac
                  n={r.n}
                  d={r.d}
                  size={84}
                  color={r.c}
                  nAt={sceneId === "ask" ? at[2 * ri] : undefined}
                  dAt={sceneId === "ask" ? at[2 * ri + 1] : undefined}
                />
              }
            />
            {highlight > ri && (
              <div
                style={{
                  position: "absolute",
                  left: BAR_X + (BAR_W * r.n) / r.d + 12,
                  top: 10 + ri * 160 + BAR_H / 2 - 28,
                  fontSize: 44,
                  fontWeight: 800,
                  color: r.c,
                }}
              >
                → {ri === 0 ? "shortest" : ri === 1 ? "further" : "furthest"}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
}

export const FractionOpsVideo: React.FC<FracOpsProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = fracOpsUnitById(unitId);
  const scenes = fracOpsSceneTimings(unitId, voice);
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
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} said={saidFor(unitId, voice, scene.id)} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
