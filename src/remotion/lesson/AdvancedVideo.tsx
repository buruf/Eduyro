// src/remotion/lesson/AdvancedVideo.tsx
// The ADVANCED template — final M10/M16/M17/M18 units, one honest picture per
// mode: a number line for ordering integers, two competing paths for order of
// operations, a plane with arrows for complex numbers and vectors, hop-chips
// and running sums for sequences, and rule cards applied to concrete powers
// for the calculus trio. Numbers all come from ADV (units-advanced.ts).
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with the scene's `said(n, fallback, occurrence)` — a chip lands on its
// value, a worked step on the number it introduces, a root dot on its
// coordinate, the answer on the answer. The old hand-picked frames survive
// only as the fallback for a clip without word alignment. Reveals that follow
// no spoken number (titles, curves, transitions) are marked
// `// not-speech-bound`.
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
import { advancedSceneTimings, saidFor, type SaidFn } from "./timeline";
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

/** Unicode superscript for a small exponent, so the screen shows x⁵ while
 *  the narration says "x to the power 5". */
function sup(n: number): string {
  return String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]).join("");
}

interface SceneProps {
  dur: number;
  unit: AdvancedUnit;
  /** Scene-local frame at which the narrator says a number (timeline.ts
   *  `saidFor`). Every reveal that shows a value she says is timed with this,
   *  never with a fraction of the scene. */
  said: SaidFn;
}

/** A reveal that never happens in this scene (the row belongs to a later
 *  scene). Fades treat it as "stay hidden". */
const NEVER = Number.POSITIVE_INFINITY;
/** Already on screen when the scene opens — it was the previous scene's
 *  picture, so it is not re-revealed. */
const CARRIED = 0; // not-speech-bound: carried over from the previous scene

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function Title({ text, enter }: { text: React.ReactNode; enter: { opacity: number; translateY: number } }) {
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
function Card({ children, colour = BLUE, dim = false, opacity = 1 }: { children: React.ReactNode; colour?: string; dim?: boolean; opacity?: number }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `5px solid ${colour}`,
        padding: "26px 44px",
        backgroundColor: "#FFF",
        opacity: dim ? 0.15 : opacity,
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

/** Horizontal integer number line from lo..hi with marked values, each with
 *  its own opacity so a mark can land on the word that names it. */
function IntLine({ lo, hi, marks }: { lo: number; hi: number; marks: { v: number; opacity: number }[] }) {
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
      {marks.map(({ v, opacity }) => (
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
              opacity,
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

type PlaneArrow = { from: [number, number]; to: [number, number]; colour: string; opacity?: number; guide?: boolean };
type PlaneLabel = { at: [number, number]; text: string; colour: string; opacity?: number };

/** A quadrant-1 plane with arrows (vectors / complex numbers). A `guide` is a
 *  dashed component walk ("3 across… 2 up") without an arrowhead. */
function Plane({ arrows, labels, gridMax = 6 }: { arrows: PlaneArrow[]; labels: PlaneLabel[]; gridMax?: number }) {
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
          <g key={i} opacity={a.opacity ?? 1}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.colour} strokeWidth={a.guide ? 5 : 7} strokeDasharray={a.guide ? "14 12" : undefined} />
            {!a.guide && (
              <polygon
                points={`${x2},${y2} ${x2 - ah * Math.cos(ang - 0.45)},${y2 - ah * Math.sin(ang - 0.45)} ${x2 - ah * Math.cos(ang + 0.45)},${y2 - ah * Math.sin(ang + 0.45)}`}
                fill={a.colour}
              />
            )}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={px(l.at[0]) + 12} y={py(l.at[1]) - 10} fontSize={30} fontWeight={800} fill={l.colour} opacity={l.opacity ?? 1}>
          {l.text}
        </text>
      ))}
    </svg>
  );
}

/** A sketched curve. Auto-scales to whatever the function does over the
 *  window, so a mode can change its polynomial without the picture falling
 *  off the stage. */
function Sketch({
  f,
  from,
  to,
  width = 760,
  height = 340,
  marks = [],
}: {
  f: (x: number) => number;
  from: number;
  to: number;
  width?: number;
  height?: number;
  /** x-positions to ring on the curve, with a colour, a caption and the
   *  opacity that lands the ring on its spoken coordinate. */
  marks?: { x: number; colour: string; label?: string; opacity?: number }[];
}) {
  const N = 160;
  const xs = Array.from({ length: N + 1 }, (_, i) => from + ((to - from) * i) / N);
  const ys = xs.map(f);
  const lo = Math.min(...ys, 0);
  const hi = Math.max(...ys, 0);
  const pad = (hi - lo) * 0.12 || 1;
  const px = (x: number) => ((x - from) / (to - from)) * width;
  const py = (y: number) => height - ((y - (lo - pad)) / (hi - lo + 2 * pad)) * height;
  const d = xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* axes */}
      <line x1={0} y1={py(0)} x2={width} y2={py(0)} stroke={INK} strokeWidth={4} />
      <line x1={px(0)} y1={0} x2={px(0)} y2={height} stroke={INK} strokeWidth={4} />
      <path d={d} fill="none" stroke={BLUE} strokeWidth={7} strokeLinecap="round" />
      {marks.map((m, i) => (
        <g key={i} opacity={m.opacity ?? 1}>
          <circle cx={px(m.x)} cy={py(f(m.x))} r={13} fill={m.colour} />
          {m.label && (
            <text
              x={px(m.x)}
              y={py(f(m.x)) + (f(m.x) >= 0 ? -30 : 46)}
              textAnchor="middle"
              fontSize={30}
              fontWeight={800}
              fill={m.colour}
            >
              {m.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** A row of value chips — used wherever a lesson is really a list. Each chip
 *  is lit by its own flag, so it can land on the word that names it. */
function Chips({
  items,
  lit,
  colourOf,
}: {
  items: (string | number)[];
  lit: boolean[];
  colourOf?: (i: number) => string;
}) {
  return (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
      {items.map((v, i) => (
        <div
          key={i}
          style={{
            borderRadius: 16,
            border: `5px solid ${colourOf?.(i) ?? GOLD}`,
            backgroundColor: "#FFF",
            padding: "16px 30px",
            fontSize: 52,
            fontWeight: 800,
            color: colourOf?.(i) ?? GOLD,
            opacity: lit[i] ? 1 : 0.14,
          }}
        >
          {v}
        </div>
      ))}
    </div>
  );
}

/** A worked line made of segments that each land on their own word
 *  ("27 =" on "27", "3³" on "3 cubed"). */
type Seg = { t: string; at: number };

function SceneBody({ dur, unit, sceneId, said }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  /** Today's hand-picked frame for a reveal — used ONLY as the fallback handed
   *  to `said` for a clip without word alignment. */
  const frac = (k: number) => Math.round(dur * k); // not-speech-bound: fallback only
  /** The even spacing the old `reveal(count, from, span)` produced — the
   *  fallback for a list revealed one chip per word. */
  const evenly = (i: number, count: number, from = 0.15, span = 0.6) =>
    frac(from) + i * Math.max(1, Math.floor((dur * span) / count));
  /** Does this scene's clip carry alignment for `n`? (A fallback of −1 can
   *  never be a real frame.) */
  const aligned = (n: number, occurrence = 0) => said(n, -1, occurrence) >= 0;

  const fadeAt = (at: number) =>
    Number.isFinite(at) ? interpolate(frame, [at, at + 12], [0, 1], CLAMP) : 0;
  const lit = (at: number) => Number.isFinite(at) && frame >= at;
  const enter = (at: number, d = 14) => ({
    opacity: Number.isFinite(at) ? interpolate(frame, [at, at + d], [0, 1], { ...CLAMP, easing: EASE }) : 0,
    translateY: Number.isFinite(at) ? interpolate(frame, [at, at + d], [18, 0], { ...CLAMP, easing: EASE }) : 18,
  });
  const TITLE_AT = 4; // not-speech-bound: a headline that names no number opens the scene
  const title = enter(TITLE_AT);
  const isTwist = sceneId === "twist";
  const isRecord = sceneId === "record";
  const late = isTwist || isRecord;

  const stage = { alignItems: "center", justifyContent: "center", gap: 28 } as const;
  const tipLine = <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>;
  const Segs = ({ segs, size, colour }: { segs: Seg[]; size: number; colour: string }) => (
    <div style={{ display: "flex", gap: 16, fontSize: size, fontWeight: 800, color: colour, justifyContent: "center" }}>
      {segs.map((s, i) => (
        <span key={i} style={{ opacity: fadeAt(s.at) }}>{s.t}</span>
      ))}
    </div>
  );
  /** A headline whose numbers each land on their word. */
  const TitleSegs = ({ segs }: { segs: Seg[] }) => (
    <div style={{ display: "flex", gap: 18, fontSize: 66, fontWeight: 700, color: INK, justifyContent: "center", maxWidth: 1500 }}>
      {segs.map((s, i) => {
        const e = enter(s.at);
        return (
          <span key={i} style={{ opacity: e.opacity, translate: `0 ${e.translateY}px` }}>{s.t}</span>
        );
      })}
    </div>
  );

  // ── M16 / M17 / M18 ──────────────────────────────────────────────────────
  if (unit.mode === "y-intercept") {
    const { a, b, c } = ADV.yInt;
    const f = (x: number) => a * x * x + b * x + c;
    const rows = [
      `f(0) = ${a}(0)² + ${b}(0) − ${Math.abs(c)}`,
      `f(0) = 0 + 0 − ${Math.abs(c)}`,
      `f(0) = −${Math.abs(c)}`,
    ];
    // work: "2 times zero squared is zero" (first 2) → the substitution row;
    //       "2 times zero is zero" (second 2) → both terms vanished.
    // twist / record: "the constant: minus 3" → the answer row.
    const rowAt =
      sceneId === "ask"
        ? [NEVER, NEVER, NEVER]
        : sceneId === "work"
          ? [said(a, frac(0.12), 0), said(b, frac(0.28), 1), NEVER]
          : [CARRIED, CARRIED, said(Math.abs(c), frac(0.44), 0)];
    // ask: the intercept ring lands on "minus 3"; later scenes carry it.
    const dotAt = sceneId === "ask" ? said(Math.abs(c), 0, 0) : CARRIED;
    const headline =
      sceneId === "ask"
        ? `f(x) = ${a}x² + ${b}x − ${Math.abs(c)}`
        : sceneId === "work"
          ? "On the y axis, x is zero"
          : sceneId === "twist"
            ? "The constant IS the y-intercept"
            : `y-intercept: (0, −${Math.abs(c)})`;
    const titleAt = isRecord ? said(Math.abs(c), TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
          <Sketch f={f} from={-3} to={2} width={560} height={320} marks={[{ x: 0, colour: GOLD, label: `−${Math.abs(c)}`, opacity: fadeAt(dotAt) }]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rows.map((r, i) =>
              Number.isFinite(rowAt[i]) ? (
                <div key={i} style={{ fontSize: 44, fontWeight: 800, color: i === 2 ? GREEN : INK, opacity: fadeAt(rowAt[i]) }}>
                  {r}
                </div>
              ) : null,
            )}
          </div>
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "multiplicity") {
    const { r1, m1, r2 } = ADV.mult;
    const f = (x: number) => Math.pow(x - r1, m1) * (x - r2) * 0.5;
    // ask: "Its roots are 2 and minus 3" — a plain dot lands on each root
    //      (the second time each is said; the first is the factor).
    // twist: "at 2, it bounces … at minus 3, it crosses" — the labelled ring
    //      and its caption land on the root.
    const bounceAt = sceneId === "ask" ? said(r1, NEVER, 1) : late ? said(r1, 0, 0) : CARRIED;
    const crossAt = sceneId === "ask" ? said(Math.abs(r2), NEVER, 1) : late ? said(Math.abs(r2), 0, 0) : CARRIED;
    const bounceCapAt = said(r1, frac(0.4), 0);
    const crossCapAt = said(Math.abs(r2), frac(0.4), 0);
    const headline =
      sceneId === "ask"
        ? `f(x) = (x − ${r1})²(x + ${Math.abs(r2)})`
        : sceneId === "work"
          ? `Count the repeats: ${r1} twice, −${Math.abs(r2)} once`
          : sceneId === "twist"
            ? "Even bounces. Odd crosses."
            : "The count decides the shape";
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Sketch
          f={f}
          from={-4.2}
          to={3.4}
          width={860}
          height={360}
          marks={[
            { x: r1, colour: GOLD, label: late ? "bounce" : undefined, opacity: fadeAt(bounceAt) },
            { x: r2, colour: RED, label: late ? "cross" : undefined, opacity: fadeAt(crossAt) },
          ]}
        />
        {late && (
          // Ordered by position on the axis, so the caption on the left
          // describes the root on the left. Reading order matters when the
          // whole lesson is "which one bounces".
          <div style={{ display: "flex", gap: 90 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: RED, opacity: fadeAt(crossCapAt) }}>x = −{Math.abs(r2)}, multiplicity 1 — odd</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: GOLD, opacity: fadeAt(bounceCapAt) }}>x = {r1}, multiplicity {m1} — even</div>
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "turning-points") {
    const d = ADV.turns.degree;
    // A genuine degree-4 curve with three visible turns.
    const f = (x: number) => (x + 2) * (x + 0.4) * (x - 1) * (x - 2.4) * 0.6;
    // Find the turns from the CURVE rather than typing in three x-values.
    // Hand-placed dots drift the moment the polynomial changes, and a dot
    // that is not on a turning point is teaching the wrong thing.
    const turns: number[] = [];
    {
      const lo = -2.6, hi = 3, N = 400;
      const at = (i: number) => lo + ((hi - lo) * i) / N;
      for (let i = 1; i < N; i++) {
        const before = f(at(i)) - f(at(i - 1));
        const after = f(at(i + 1)) - f(at(i));
        if (before === 0 || after === 0) continue;
        if (before > 0 !== after > 0) turns.push(at(i));
      }
    }
    // The "4 − 1 = 3 turns" caption lands on "3" in twist ("at most 3
    // times") and record. The work line talks about lines, parabolas and
    // cubics and never says 4 − 1, so the caption waits for twist.
    const capAt = late ? said(d - 1, frac(0.3), 0) : NEVER;
    const headline =
      sceneId === "ask"
        ? `Degree ${d} — how many turns?`
        : sceneId === "work"
          ? "Line 0, parabola 1, cubic 2…"
          : sceneId === "twist"
            ? `At most ${d - 1}`
            : `Degree ${d} → at most ${d - 1} turning points`;
    const titleAt = isTwist ? said(d - 1, TITLE_AT, 0) : isRecord ? said(d, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <Sketch
          f={f}
          from={-2.6}
          to={3}
          width={900}
          height={360}
          // not-speech-bound: the turn dots are the curve's own feature, not a
          // counted number; they open every scene after the question.
          marks={sceneId === "ask" ? [] : turns.map((x) => ({ x, colour: GOLD }))}
        />
        {late && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GOLD, opacity: fadeAt(capAt) }}>
            {d} − 1 = {d - 1} turns
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "fta") {
    const d = ADV.fta.degree;
    // work: "degree 9 has exactly 9 roots" — the chips roll out from the
    // second "9" (the root count), one every 4 frames, so all nine are up
    // within ~1.2 s of the word. Later scenes carry them.
    const rollFrom = said(d, evenly(0, d, 0.12, 0.55), 1);
    const spacing = aligned(d, 1) ? 4 : Math.max(1, Math.floor((dur * 0.55) / d)); // not-speech-bound: fallback only
    const chipAt = Array.from({ length: d }, (_, i) =>
      sceneId === "ask" ? NEVER : sceneId === "work" ? rollFrom + i * spacing : CARRIED,
    );
    const capAt = frac(0.35); // not-speech-bound: "some may repeat, and some may be complex" names no number
    const headline =
      sceneId === "ask"
        ? `Degree ${d}`
        : sceneId === "work"
          ? `Exactly ${d} roots`
          : sceneId === "twist"
            ? "Counting repeats, and complex ones"
            : `Degree ${d} → exactly ${d} roots`;
    const titleAt = sceneId === "work" ? said(d, TITLE_AT, 1) : isRecord ? said(d, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <Chips
          items={Array.from({ length: d }, (_, i) => i + 1)}
          lit={chipAt.map(lit)}
          colourOf={(i) => (late ? (i >= d - 3 ? RED : GOLD) : GOLD)}
        />
        {late && (
          <div style={{ fontSize: 40, fontWeight: 800, color: RED, opacity: fadeAt(capAt) }}>
            some may repeat, and some may be complex
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "synthetic") {
    const { a, b, c, r } = ADV.synth;
    const s1 = a * r + b;
    const rem = s1 * r + c;
    const headline =
      sceneId === "ask"
        ? `(${a}x² + ${b}x − ${Math.abs(c)}) ÷ (x − ${r})`
        : sceneId === "work"
          ? "Bring down, multiply, add"
          : sceneId === "twist"
            ? "Repeat — the last number is the remainder"
            : `${a}x + ${s1}, remainder ${rem}`;
    const top = [a, b, c];
    const mid = ["", a * r, s1 * r];
    const bot = [a, s1, rem];
    // Every cell lands on the word that writes it. The line says "2" many
    // times: coefficients first (2, then 2), the root outside third, and in
    // the work line the bring-down is the fifth "2" (after "x minus 2 zero").
    const coeffAt = [said(a, frac(0.1), 0), said(b, frac(0.1), 1), said(Math.abs(c), frac(0.1), 0)];
    let rAt: number, cellAt: number[][];
    if (sceneId === "ask") {
      rAt = said(r, 0, 2);
      cellAt = [coeffAt, [NEVER, NEVER, NEVER], [NEVER, NEVER, NEVER]];
    } else if (sceneId === "work") {
      rAt = said(r, 0, 2);
      cellAt = [
        coeffAt,
        [NEVER, said(a * r, frac(0.3), 0), NEVER],
        [said(a, NEVER, 4), said(s1, NEVER, 0), NEVER],
      ];
    } else if (sceneId === "twist") {
      rAt = CARRIED;
      cellAt = [
        [CARRIED, CARRIED, CARRIED],
        [NEVER, CARRIED, said(s1 * r, frac(0.3), 0)],
        [CARRIED, CARRIED, said(rem, frac(0.5), 0)],
      ];
    } else {
      rAt = CARRIED;
      cellAt = [[CARRIED, CARRIED, CARRIED], [NEVER, CARRIED, CARRIED], [CARRIED, CARRIED, CARRIED]];
    }
    // twist: "the numbers along the bottom, 2 and 6, are the quotient" — the
    // second "2" of the line. record: "the remainder: 9".
    const capAt = isTwist ? said(a, frac(0.7), 1) : isRecord ? said(rem, frac(0.7), 0) : NEVER;
    const rowAt = (row: number[]) => Math.min(...row);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: GOLD, paddingRight: 14, opacity: fadeAt(rAt) }}>{r}</div>
          <div style={{ borderLeft: `6px solid ${INK}`, paddingLeft: 26 }}>
            {[top, mid, bot].map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: "flex",
                  gap: 44,
                  borderTop: ri === 2 ? `5px solid rgba(46,32,22,${fadeAt(rowAt(cellAt[2]))})` : undefined,
                  paddingTop: ri === 2 ? 12 : 0,
                  marginTop: ri === 2 ? 10 : 6,
                }}
              >
                {row.map((v, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: 130,
                      height: 62,
                      textAlign: "center",
                      fontSize: 50,
                      fontWeight: 800,
                      color: ri === 1 ? RED : ri === 2 && ci === 2 ? GREEN : INK,
                      opacity: fadeAt(cellAt[ri][ci]),
                    }}
                  >
                    {v === "" ? "" : v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {late && (
          <div style={{ fontSize: 40, fontWeight: 800, color: MUTED, opacity: fadeAt(capAt) }}>
            quotient {a}x + {s1} · remainder {rem}
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "rational-root") {
    const { constant, leading, root } = ADV.rational;
    const factors = [1, 3, 5, 15];
    // work: "Factors of 15: 1, then 3, then 5, then 15" — each chip on its
    // word (the "1" after "leading coefficient is 1"; the third "15").
    // twist: the chips carry over; the ± lands on "plus or minus 1, 3, 5,
    // and 15" (the third "1"), and the root turns green on "3 is one that
    // works" (the second "3").
    const occ = (f: number, i: number) => (sceneId === "work" ? (f === 1 ? 1 : f === constant ? 2 : 0) : f === 1 ? 2 : 0);
    const chipAt = factors.map((f, i) =>
      sceneId === "ask" ? NEVER : sceneId === "work" ? said(f, evenly(i, factors.length, 0.3, 0.5), occ(f, i)) : CARRIED,
    );
    const pmAt = factors.map((f, i) => (isTwist ? said(f, 0, occ(f, i)) : isRecord ? CARRIED : NEVER));
    const greenAt = isTwist ? said(root, 0, 1) : isRecord ? CARRIED : NEVER;
    const capAt = sceneId === "work" ? said(constant, frac(0.55), 0) : late ? said(leading, frac(0.55), 0) : NEVER;
    const headline =
      sceneId === "ask"
        ? "Which guesses are worth making?"
        : sceneId === "work"
          ? `factors of ${constant} ÷ factors of ${leading}`
          : sceneId === "twist"
            ? "± each one — a short list"
            : `${root} is one that works`;
    const titleAt = sceneId === "work" ? said(constant, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <Chips
          items={factors.map((f, i) => (lit(pmAt[i]) ? `±${f}` : f))}
          lit={chipAt.map(lit)}
          colourOf={(i) => (lit(greenAt) && factors[i] === root ? GREEN : GOLD)}
        />
        {sceneId !== "ask" && (
          <div style={{ fontSize: 40, fontWeight: 800, color: MUTED, opacity: fadeAt(capAt) }}>
            constant {constant} · leading coefficient {leading}
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "exponential") {
    const { base, power } = ADV.expo;
    const value = base ** power;
    // Each worked line is segments that land on their own word:
    //   ask   "3 to the power x equals 27"       → 3^x =  |  27
    //   work  "So 27 is 3 cubed" (3rd 27, 5th 3) → 27 =   |  3³
    //   twist "3 to the power x equals 3 to the power 3" → 3^x | = 3 | ³
    //         "x equals 3" (4th 3)                → x = 3
    const rows: { segs: Seg[]; size: number; colour: string }[] = [
      {
        segs: sceneId === "ask" ? [{ t: `${base}^x =`, at: said(base, frac(0.1), 0) }, { t: `${value}`, at: said(value, frac(0.1), 0) }] : [{ t: `${base}^x = ${value}`, at: CARRIED }],
        size: 58,
        colour: INK,
      },
      {
        segs:
          sceneId === "ask"
            ? []
            : sceneId === "work"
              ? [{ t: `${value} =`, at: said(value, frac(0.26), 2) }, { t: `${base}${sup(power)}`, at: said(base, frac(0.26), 4) }]
              : [{ t: `${value} = ${base}${sup(power)}`, at: CARRIED }],
        size: 58,
        colour: INK,
      },
      {
        segs:
          isTwist
            ? [{ t: `${base}^x`, at: said(base, frac(0.42), 0) }, { t: `= ${base}`, at: said(base, frac(0.42), 1) }, { t: sup(power), at: said(base, frac(0.42), 2) }]
            : isRecord
              ? [{ t: `${base}^x = ${base}${sup(power)}`, at: CARRIED }]
              : [],
        size: 58,
        colour: BLUE,
      },
      {
        segs: isTwist ? [{ t: `x = ${power}`, at: said(power, frac(0.58), 3) }] : isRecord ? [{ t: `x = ${power}`, at: CARRIED }] : [],
        size: 78,
        colour: GREEN,
      },
    ];
    const headline =
      sceneId === "ask"
        ? "x is stuck in the exponent"
        : sceneId === "work"
          ? `Write ${value} as a power of ${base}`
          : sceneId === "twist"
            ? "Same base → same exponent"
            : `x = ${power}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {rows.map((r, i) => (r.segs.length ? <Segs key={i} segs={r.segs} size={r.size} colour={r.colour} /> : null))}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "powers-of-i") {
    const cyc = [
      { p: "i¹", v: "i", colour: BLUE },
      { p: "i²", v: "−1", colour: GOLD },
      { p: "i³", v: "−i", colour: RED },
      { p: "i⁴", v: "1", colour: GREEN },
    ];
    const cycle = ADV.imaginary.cycle;
    // work: "i to the power 1 … i squared is minus 1 … minus 1 times i, minus
    // i … i to the power 4 … minus 1 times minus 1… 1": the first three cards
    // land on the 1st/2nd/3rd "1"; the i⁴ label on "4" and its value on the
    // LAST "1" (the result).
    // record: "i, then minus 1, then minus i, then 1" — i opens the scene,
    // −1 and 1 on their words, −i (no number) midway between them.
    let cardAt: number[], valueAt: number[];
    if (sceneId === "ask") {
      cardAt = [NEVER, NEVER, NEVER, NEVER];
      valueAt = cardAt;
    } else if (sceneId === "work") {
      cardAt = [said(1, evenly(0, 4, 0.12, 0.6), 0), said(1, evenly(1, 4, 0.12, 0.6), 1), said(1, evenly(2, 4, 0.12, 0.6), 2), said(cycle, evenly(3, 4, 0.12, 0.6), 0)];
      valueAt = [cardAt[0], cardAt[1], cardAt[2], said(1, evenly(3, 4, 0.12, 0.6), -1)];
    } else if (isRecord) {
      const minusOne = said(1, 0, 0);
      const one = said(1, 0, 1);
      cardAt = [CARRIED, minusOne, Math.round((minusOne + one) / 2), one];
      valueAt = cardAt;
    } else {
      cardAt = [CARRIED, CARRIED, CARRIED, CARRIED];
      valueAt = cardAt;
    }
    const loopAt = said(cycle, frac(0.45), 0); // "repeats every 4 steps" / "divide the power by 4"
    const headline =
      sceneId === "ask"
        ? "i² = −1"
        : sceneId === "work"
          ? "Work up the powers"
          : sceneId === "twist"
            ? "Back to 1 — it repeats every 4"
            : "Divide the power by 4, keep the remainder";
    const titleAt = sceneId === "ask" ? said(1, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {cyc.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ fontSize: 44, color: MUTED, opacity: lit(cardAt[i]) ? 1 : 0.14 }}>→</div>}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: MUTED, opacity: lit(cardAt[i]) ? 1 : 0.14 }}>{c.p}</div>
                <div
                  style={{
                    borderRadius: 16,
                    border: `5px solid ${c.colour}`,
                    backgroundColor: "#FFF",
                    padding: "18px 34px",
                    fontSize: 58,
                    fontWeight: 800,
                    color: c.colour,
                    marginTop: 8,
                    opacity: lit(valueAt[i]) ? 1 : 0.14,
                  }}
                >
                  {c.v}
                </div>
              </div>
            </React.Fragment>
          ))}
          {late && (
            <div style={{ fontSize: 44, color: GREEN, fontWeight: 800, opacity: fadeAt(loopAt) }}>↻</div>
          )}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "geometric") {
    const { first, ratio, term } = ADV.geo;
    const terms = Array.from({ length: term }, (_, i) => first * ratio ** i);
    // ask: the first chip lands on "starts at 2". work: "Start at 2. Times 3
    // gives 6. Times 3 again gives 18" — each chip on its value, each "× 3"
    // connector on its "3". Later scenes carry the list.
    const chipAt = terms.map((t, i) =>
      sceneId === "ask" ? (i === 0 ? said(first, 0, 0) : NEVER) : sceneId === "work" ? said(t, evenly(i, term), 0) : CARRIED,
    );
    const hopAt = terms.map((_, i) => (i === 0 ? NEVER : sceneId === "work" ? said(ratio, evenly(i, term), i - 1) : late ? CARRIED : NEVER));
    const headline =
      sceneId === "ask"
        ? `first ${first}, ratio ${ratio}`
        : sceneId === "work"
          ? `Multiply by ${ratio} each step`
          : sceneId === "twist"
            ? `${term} − 1 = ${term - 1} steps, not ${term}`
            : `Term ${term} is ${terms[term - 1]}`;
    // twist: "you take 3 minus 1 steps" is the 4th "3"; record: "is 18".
    const titleAt = isTwist ? said(term, TITLE_AT, 3) : isRecord ? said(terms[term - 1], TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          {terms.map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ textAlign: "center", opacity: lit(hopAt[i]) ? 1 : 0.14 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: RED }}>× {ratio}</div>
                  <div style={{ fontSize: 40, color: MUTED }}>→</div>
                </div>
              )}
              <div
                style={{
                  borderRadius: 16,
                  border: `5px solid ${i === term - 1 && late ? GREEN : GOLD}`,
                  backgroundColor: "#FFF",
                  padding: "20px 40px",
                  fontSize: 62,
                  fontWeight: 800,
                  color: i === term - 1 && late ? GREEN : GOLD,
                  opacity: lit(chipAt[i]) ? 1 : 0.14,
                }}
              >
                {t}
              </div>
            </React.Fragment>
          ))}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "limit-poly") {
    const { at, c } = ADV.limit;
    const f = (x: number) => x * x + x + c;
    const value = f(at);
    const approach = [3.9, 3.99, 4.01, 4.1];
    // work: "at 3 point 9, at 3 point 99 … 4 point 1, 4 point 01" — each
    // column lands on the leading digit of its decimal (the 1st/2nd "3", the
    // 2nd/3rd "4"; the first "4" is "closes in on 4").
    const colAt = approach.map((x, i) => {
      if (sceneId !== "work") return NEVER;
      const lead = Math.floor(x);
      const occ = lead === at ? (x === 4.1 ? 1 : 2) : x === 3.9 ? 0 : 1;
      return said(lead, evenly(i, approach.length), occ);
    });
    // twist: "4 squared is 16, plus 4, plus 2… 22" — each line on the number
    // it introduces. record: the answer on "22".
    const rowAt = isTwist
      ? [said(at, frac(0.1), 0), said(at * at, frac(0.3), 0), said(value, frac(0.5), 0)]
      : isRecord
        ? [CARRIED, CARRIED, said(value, frac(0.5), 0)]
        : [NEVER, NEVER, NEVER];
    const headline =
      sceneId === "ask"
        ? `lim x→${at} (x² + x + ${c})`
        : sceneId === "work"
          ? "Close in from both sides"
          : sceneId === "twist"
            ? "No gaps — so just substitute"
            : `The limit is ${value}`;
    const titleAt = sceneId === "ask" ? said(at, TITLE_AT, 0) : isRecord ? said(value, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        {late ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: INK, opacity: fadeAt(rowAt[0]) }}>
              {at}² + {at} + {c}
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: BLUE, opacity: fadeAt(rowAt[1]) }}>
              {at * at} + {at} + {c}
            </div>
            <div style={{ fontSize: 84, fontWeight: 800, color: GREEN, opacity: fadeAt(rowAt[2]) }}>= {value}</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {approach.map((x, i) => (
              <div key={i} style={{ textAlign: "center", opacity: lit(colAt[i]) ? 1 : 0.14 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: MUTED }}>x = {x}</div>
                <div style={{ fontSize: 46, fontWeight: 800, color: i < 2 ? GOLD : BLUE }}>
                  {f(x).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "integrate-power") {
    const { n } = ADV.integral;
    // ask   "The integral of x to the power 4"            → ∫ x⁴ dx on "4"
    // work  "so try x to the power 5" (2nd 5)              → try x⁵
    //       "it gives 5 x to the power 4" (3rd 5)          → differentiates to 5x⁴
    //       "5 times too big" (4th 5)                      → — 5× too big
    // twist "x to the power 5" (2nd 5) / "over 5" (3rd 5)  → x⁵ | / 5, then + C
    const plusC = said(n + 1, frac(0.61), 2) + 30; // not-speech-bound: "add C" names no number — a beat after "over 5"
    const rows: { segs: Seg[]; size: number; colour: string }[] = [
      { segs: [{ t: `∫ x${sup(n)} dx`, at: sceneId === "ask" ? said(n, frac(0.1), 0) : CARRIED }], size: 50, colour: INK },
      { segs: sceneId === "ask" ? [] : [{ t: `try x${sup(n + 1)}`, at: sceneId === "work" ? said(n + 1, frac(0.27), 1) : CARRIED }], size: 50, colour: MUTED },
      {
        segs:
          sceneId === "ask"
            ? []
            : sceneId === "work"
              ? [{ t: `differentiates to ${n + 1}x${sup(n)}`, at: said(n + 1, frac(0.44), 2) }, { t: `— ${n + 1}× too big`, at: said(n + 1, frac(0.44), 3) }]
              : [{ t: `differentiates to ${n + 1}x${sup(n)}  — ${n + 1}× too big`, at: CARRIED }],
        size: 50,
        colour: RED,
      },
      {
        segs: isTwist
          ? [{ t: `x${sup(n + 1)}`, at: said(n + 1, frac(0.61), 1) }, { t: `/ ${n + 1}`, at: said(n + 1, frac(0.61), 2) }, { t: "+ C", at: plusC }]
          : isRecord
            ? [{ t: `x${sup(n + 1)} / ${n + 1} + C`, at: CARRIED }]
            : [],
        size: 74,
        colour: GREEN,
      },
    ];
    const capAt = frac(0.7); // not-speech-bound: "a constant differentiates to zero" carries no aligned number
    const headline =
      sceneId === "ask"
        ? "Differentiating, run backwards"
        : sceneId === "work"
          ? "Add one to the power, then check"
          : sceneId === "twist"
            ? `Divide by ${n + 1} — and add C`
            : `x${sup(n + 1)} / ${n + 1} + C`;
    const titleAt = isTwist ? said(n + 1, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enter(titleAt)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          {rows.map((r, i) => (r.segs.length ? <Segs key={i} segs={r.segs} size={r.size} colour={r.colour} /> : null))}
        </div>
        {late && (
          <div style={{ fontSize: 38, fontWeight: 800, color: MUTED, opacity: fadeAt(capAt) }}>
            a constant differentiates to zero, so C could be anything
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // ── M10 stragglers ───────────────────────────────────────────────────────
  if (unit.mode === "order-integers") {
    const marks = ADV.integers;
    const sorted = [...marks].sort((a, b) => a - b);
    // Negatives are aligned on their digits ("minus 3" → 3); every value is
    // distinct in size, so the first occurrence is the one.
    // ask: the headline's numbers land one per word. work: each dot lands on
    // its address as she places it. record: the sorted dots and the sorted
    // headline land in order.
    const shownMarks = sceneId === "work" ? marks : sorted;
    const markAt = shownMarks.map((v, i) =>
      sceneId === "ask" ? NEVER : sceneId === "work" ? said(Math.abs(v), evenly(i, marks.length), 0) : isRecord ? said(Math.abs(v), 0, 0) : CARRIED,
    );
    const headline =
      sceneId === "ask" ? (
        <TitleSegs segs={[{ t: "Order:", at: TITLE_AT }, ...marks.map((v, i) => ({ t: `${v}${i < marks.length - 1 ? "," : ""}`, at: said(Math.abs(v), TITLE_AT, 0) }))]} />
      ) : sceneId === "work" ? (
        <Title text="Every integer has an address" enter={title} />
      ) : sceneId === "twist" ? (
        <Title text="Left = smaller" enter={title} />
      ) : (
        <TitleSegs segs={sorted.map((v, i) => ({ t: `${i > 0 ? "<  " : ""}${v}`, at: said(Math.abs(v), TITLE_AT, 0) }))} />
      );
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
        {headline}
        <IntLine lo={-5} hi={6} marks={shownMarks.map((v, i) => ({ v, opacity: fadeAt(markAt[i]) }))} />
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "order-ops") {
    const { a, b, c } = ADV.orderOps;
    const right = a + b * c;
    const wrong = (a + b) * c;
    // work: the left-to-right card builds as she walks it — "(3 + 4)" on 3,
    // "× 2" on 2, "= 14" on 14; the rule card lands on "4 times 2" (the
    // second 4) and its answer on 11. twist: the left card's caption switches
    // to "only with brackets" as she starts the bracket line ("3 plus 4, in
    // brackets"). Later scenes carry both cards.
    const w = sceneId === "work";
    const wrongAt = w ? [said(a, 0, 0), said(c, 0, 0), said(wrong, 0, 0)] : [CARRIED, CARRIED, CARRIED];
    const rightAt = w ? [said(b, 0, 1), said(right, 0, 0)] : [CARRIED, CARRIED];
    const bracketsAt = isTwist ? said(a, 0, 0) : isRecord ? CARRIED : NEVER;
    const headline =
      sceneId === "ask" ? (
        <TitleSegs segs={[{ t: `${a}`, at: said(a, TITLE_AT, 0) }, { t: `+ ${b}`, at: said(b, TITLE_AT, 0) }, { t: `× ${c}`, at: said(c, TITLE_AT, 0) }, { t: "= ?", at: said(c, TITLE_AT, 0) }]} />
      ) : (
        <Title text={sceneId === "work" ? "Two paths — one rule" : sceneId === "twist" ? `${right} is right · brackets make ${wrong}` : "× and ÷ before + and −"} enter={title} />
      );
    const showPaths = sceneId !== "ask";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
        {headline}
        {showPaths && (
          <div style={{ display: "flex", gap: 70 }}>
            <div style={{ textAlign: "center" }}>
              <Card colour={RED} opacity={fadeAt(wrongAt[0])}>
                <span>({a} + {b})</span> <span style={{ opacity: fadeAt(wrongAt[1]) }}>× {c}</span> <span style={{ opacity: fadeAt(wrongAt[2]) }}>= {wrong}</span>
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: RED, marginTop: 12, opacity: fadeAt(wrongAt[2]) }}>
                {lit(bracketsAt) ? "only with brackets" : "left to right ✗"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Card colour={GREEN} opacity={fadeAt(rightAt[0])}>
                <span>{a} + ({b} × {c})</span> <span style={{ opacity: fadeAt(rightAt[1]) }}>= {right}</span>
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 12, opacity: fadeAt(rightAt[1]) }}>multiply first ✓</div>
            </div>
          </div>
        )}
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "complex") {
    const { a, b, c, d } = ADV.complex;
    // work: "The real part, 3, goes ACROSS" → a dashed walk along the real
    // axis; "the imaginary part, 2, goes UP" → the vertical walk; "So 3 plus
    // 2i lives at the point" (2nd 3) → the arrow; "3 across, 2 up" (3rd 3) →
    // the label. twist: "Add 1 plus 1 i" → the gold step; "The answer: 4 plus
    // 3 i" (2nd 4) → the green sum and its label.
    const w = sceneId === "work";
    const acrossAt = w ? said(a, NEVER, 0) : NEVER;
    const upAt = w ? said(b, NEVER, 0) : NEVER;
    const arrowAt = w ? said(a, 0, 1) : sceneId === "ask" ? NEVER : CARRIED;
    const labelAt = w ? said(a, 0, 2) : sceneId === "ask" ? NEVER : CARRIED;
    const stepAt = isTwist ? said(c, 0, 0) : isRecord ? CARRIED : NEVER;
    const sumAt = isTwist ? said(a + c, 0, 1) : isRecord ? CARRIED : NEVER;
    const arrows: PlaneArrow[] = [
      { from: [0, 0], to: [a, 0], colour: BLUE, opacity: fadeAt(acrossAt), guide: true },
      { from: [a, 0], to: [a, b], colour: BLUE, opacity: fadeAt(upAt), guide: true },
      { from: [0, 0], to: [a, b], colour: BLUE, opacity: fadeAt(arrowAt) },
      { from: [a, b], to: [a + c, b + d], colour: GOLD, opacity: fadeAt(stepAt) },
      { from: [0, 0], to: [a + c, b + d], colour: GREEN, opacity: fadeAt(sumAt) },
    ];
    const labels: PlaneLabel[] = [
      { at: [a, b], text: `${a} + ${b}i`, colour: BLUE, opacity: fadeAt(labelAt) },
      { at: [a + c, b + d], text: `${a + c} + ${b + d}i`, colour: GREEN, opacity: fadeAt(sumAt) },
    ];
    const headline =
      sceneId === "ask" ? `${a} + ${b}i — just a point` : sceneId === "work" ? "Real across · imaginary up" : sceneId === "twist" ? `+ (${c} + ${d}i) — parts add` : `${a + c} + ${b + d}i`;
    const titleAt = isRecord ? TITLE_AT : sceneId === "ask" ? said(a, TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={enter(titleAt)} />
        <Plane arrows={arrows} labels={labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "sequence") {
    const { start, step: hop, terms } = ADV.seq;
    const seq = Array.from({ length: terms }, (_, i) => start + i * hop);
    const sums = seq.map((_, i) => seq.slice(0, i + 1).reduce((x, y) => x + y, 0));
    const isSeries = late;
    // ask: each card (and the headline's number) lands on its word. work: the
    // cards carry over; each "+4→" lands on its "plus 4" (the third hop is
    // never narrated — "the same hop every time" — so it follows the second),
    // and the next term on "19". twist: each running total on its word.
    const cardAt = seq.map((v) => (sceneId === "ask" ? said(v, 0, 0) : CARRIED));
    const hopAt = seq.map((_, i) => {
      if (i === 0) return NEVER;
      if (sceneId === "work") {
        if (i <= 2) return said(hop, evenly(i, terms + 1), i - 1);
        return said(hop, evenly(i, terms + 1), 1) + 18; // not-speech-bound: "the same hop every time"
      }
      return late ? CARRIED : NEVER;
    });
    const nextAt = sceneId === "work" ? said(seq[terms - 1] + hop, evenly(terms, terms + 1), 0) : NEVER;
    const sumAt = sums.map((s) => (isTwist ? said(s, 0, 0) : isRecord ? CARRIED : NEVER));
    const headline =
      sceneId === "ask" ? (
        <TitleSegs segs={[...seq.map((v) => ({ t: `${v},`, at: said(v, TITLE_AT, 0) })), { t: "…", at: said(seq[terms - 1], TITLE_AT, 0) }]} />
      ) : (
        <Title text={sceneId === "work" ? `Same hop every time: +${hop}` : sceneId === "twist" ? "Now ADD them up — a series" : "Sequence lists · series adds"} enter={title} />
      );
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        {headline}
        <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
          {seq.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 34, alignItems: "center" }}>
              {i > 0 && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD, opacity: lit(hopAt[i]) ? 1 : 0.12 }}>+{hop}→</div>}
              <div style={{ textAlign: "center" }}>
                <Card colour={BLUE} opacity={lit(cardAt[i]) ? 1 : 0.12}>{v}</Card>
                {isSeries && <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 10, opacity: fadeAt(sumAt[i]) }}>Σ {sums[i]}</div>}
              </div>
            </div>
          ))}
          {sceneId === "work" && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD, opacity: fadeAt(nextAt) }}>+{hop}→ {seq[terms - 1] + hop}</div>}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "vectors") {
    const { v1, v2 } = ADV.vec;
    const s: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];
    // ask: the arrow opens the scene ("A vector is an arrow"); "goes 3 across"
    // and "2 up" draw the dashed component walk; "Write it as 3, 2" (2nd 3)
    // lands the label. work: "Add the arrow 1, 3" → the gold arrow; "land at
    // 4, 5" → the landing label. twist: "Up: 2 plus 3 is 5" → the green
    // straight arrow.
    const acrossAt = sceneId === "ask" ? said(v1[0], NEVER, 0) : NEVER;
    const upAt = sceneId === "ask" ? said(v1[1], NEVER, 0) : NEVER;
    const labelAt = sceneId === "ask" ? said(v1[0], 0, 1) : CARRIED;
    const secondAt = sceneId === "work" ? said(v2[0], 0, 0) : sceneId === "ask" ? NEVER : CARRIED;
    const landAt = sceneId === "work" ? said(s[0], NEVER, 0) : late ? CARRIED : NEVER;
    const sumAt = isTwist ? said(s[1], 0, 0) : isRecord ? CARRIED : NEVER;
    const arrows: PlaneArrow[] = [
      { from: [0, 0], to: [v1[0], 0], colour: BLUE, opacity: fadeAt(acrossAt), guide: true },
      { from: [v1[0], 0], to: v1, colour: BLUE, opacity: fadeAt(upAt), guide: true },
      { from: [0, 0], to: v1, colour: BLUE }, // not-speech-bound: "A vector is an arrow" opens the scene
      { from: v1, to: s, colour: GOLD, opacity: fadeAt(secondAt) },
      { from: [0, 0], to: s, colour: GREEN, opacity: fadeAt(sumAt) },
    ];
    const labels: PlaneLabel[] = [
      { at: v1, text: `(${v1[0]}, ${v1[1]})`, colour: BLUE, opacity: fadeAt(labelAt) },
      { at: s, text: `(${s[0]}, ${s[1]})`, colour: GREEN, opacity: fadeAt(landAt) },
    ];
    const headline =
      sceneId === "ask" ? `An arrow: ${v1[0]} across, ${v1[1]} up` : sceneId === "work" ? "Add tip to tail" : sceneId === "twist" ? `(${v1[0]}+${v2[0]}, ${v1[1]}+${v2[1]}) = (${s[0]}, ${s[1]})` : "Components just add";
    const titleAt = sceneId === "ask" ? said(v1[0], TITLE_AT, 0) : isTwist ? said(v1[0], TITLE_AT, 0) : TITLE_AT;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={enter(titleAt)} />
        <Plane arrows={arrows} labels={labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // Calculus card modes: power-rule, monomials, applications. Each row is a
  // from-card, a to-card and a note; the from-card lands on the power she
  // names, the to-card (and note) on the derivative's number.
  {
    const { n1, n2 } = ADV.power;
    const { k, n } = ADV.mono;
    const { t } = ADV.app;
    const w = sceneId === "work";
    type Row = { from: string; to: string; note: string; fromAt: number; toAt: number; noteAt: number };
    const rows: Row[] =
      unit.mode === "power-rule"
        ? [
            // work: "Take x to the power 3" → x³; "the derivative of x cubed is… 3 x squared" (2nd 3) → 3x²
            { from: "x³", to: "3x²", note: "down in front · drop by one", fromAt: w ? said(n1, evenly(0, 2), 0) : sceneId === "ask" ? CARRIED : CARRIED, toAt: w ? said(n1, evenly(0, 2), 1) : CARRIED, noteAt: w ? said(n1, evenly(0, 2), 1) : CARRIED },
            // twist: "x to the power 5" → x⁵; "the derivative is 5 x to the power 4" (3rd 5) → 5x⁴
            { from: "x⁵", to: "5x⁴", note: "same two moves", fromAt: isTwist ? said(n2, 0, 0) : isRecord ? CARRIED : NEVER, toAt: isTwist ? said(n2, 0, 2) : isRecord ? CARRIED : NEVER, noteAt: isTwist ? said(n2, 0, 2) : isRecord ? CARRIED : NEVER },
          ]
        : unit.mode === "monomials"
          ? [
              // work: "The 5 just rides along" → 5x³; "5 times 3 is 15" → the note on the 2nd 5, 15x² on 15
              { from: `${k}x³`, to: `${k * n}x²`, note: `${k} × ${n} = ${k * n} in front`, fromAt: w ? said(k, evenly(0, 1), 0) : CARRIED, toAt: w ? said(k * n, evenly(0, 1), 0) : CARRIED, noteAt: w ? said(k, evenly(0, 1), 1) : CARRIED },
            ]
          : [
              // work: "the speed is 2 t" (2nd 2) → v = 2t; the position card opens the scene
              { from: "s = t²", to: "v = 2t", note: "differentiate position", fromAt: CARRIED, toAt: w ? said(2, evenly(0, 2), 1) : CARRIED, noteAt: w ? said(2, evenly(0, 2), 1) : CARRIED },
              // twist: "At 3 seconds" → t = 3; "2 times 3… 6" → v = 6
              { from: `t = ${t}`, to: `v = ${2 * t}`, note: "metres per second", fromAt: isTwist ? said(t, 0, 0) : isRecord ? CARRIED : NEVER, toAt: isTwist ? said(2 * t, 0, 0) : isRecord ? CARRIED : NEVER, noteAt: isTwist ? said(2 * t, 0, 0) : isRecord ? CARRIED : NEVER },
            ];
    const headlines: Record<string, Record<string, string>> = {
      "power-rule": { ask: "A two-move rule", work: "Down in front… drop by one", twist: "Any power, same moves", record: "d/dx xⁿ = n·xⁿ⁻¹" },
      monomials: { ask: `${k}x³ — what about the ${k}?`, work: "The coefficient rides along", twist: `${k} × ${n} = ${k * n}, exponent drops`, record: "k·xⁿ → k·n·xⁿ⁻¹" },
      applications: { ask: `How fast at ${t} seconds?`, work: "Speed IS the derivative", twist: `v = 2 × ${t} = ${2 * t} m/s`, record: "Position → speed" },
    };
    const titleAt = unit.mode === "applications" && isTwist ? said(2 * t, TITLE_AT, 0) : unit.mode === "monomials" && isTwist ? said(k * n, TITLE_AT, 0) : TITLE_AT;
    const isAsk = sceneId === "ask";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headlines[unit.mode][sceneId] ?? ""} enter={enter(titleAt)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {rows.map((r, i) => {
            const pending = !isAsk && !Number.isFinite(r.fromAt); // a later scene's row: dimmed, not hidden
            return (
              <div key={i} style={{ display: "flex", gap: 30, alignItems: "center", opacity: pending ? 0.12 : 1 }}>
                <Card colour={BLUE} dim={isAsk} opacity={pending ? 1 : fadeAt(r.fromAt)}>{r.from}</Card>
                <div style={{ fontSize: 52, fontWeight: 800, color: GOLD, opacity: isAsk || pending ? 1 : fadeAt(r.toAt) }}>→</div>
                <Card colour={GREEN} dim={isAsk} opacity={pending ? 1 : fadeAt(r.toAt)}>{r.to}</Card>
                <div style={{ fontSize: 32, fontWeight: 700, color: MUTED, maxWidth: 360, opacity: pending ? 1 : fadeAt(r.noteAt) }}>{isAsk ? "" : r.note}</div>
              </div>
            );
          })}
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
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} said={saidFor(unitId, voice, scene.id)} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
