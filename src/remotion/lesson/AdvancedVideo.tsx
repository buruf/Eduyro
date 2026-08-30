// src/remotion/lesson/AdvancedVideo.tsx
// The ADVANCED template — final M10/M16/M17/M18 units, one honest picture per
// mode: a number line for ordering integers, two competing paths for order of
// operations, a plane with arrows for complex numbers and vectors, hop-chips
// and running sums for sequences, and rule cards applied to concrete powers
// for the calculus trio. Numbers all come from ADV (units-advanced.ts).
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
import { advancedSceneTimings } from "./timeline";
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

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
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
function Card({ children, colour = BLUE, dim = false }: { children: React.ReactNode; colour?: string; dim?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: `5px solid ${colour}`,
        padding: "26px 44px",
        backgroundColor: "#FFF",
        opacity: dim ? 0.15 : 1,
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

/** Horizontal integer number line from lo..hi with optional marked values. */
function IntLine({ lo, hi, marks, shown }: { lo: number; hi: number; marks: number[]; shown: number }) {
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
      {marks.slice(0, shown).map((v, i) => (
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
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A quadrant-1 plane with arrows (vectors / complex numbers). */
function Plane({
  arrows,
  labels,
  gridMax = 6,
}: {
  arrows: { from: [number, number]; to: [number, number]; colour: string }[];
  labels: { at: [number, number]; text: string; colour: string }[];
  gridMax?: number;
}) {
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
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.colour} strokeWidth={7} />
            <polygon
              points={`${x2},${y2} ${x2 - ah * Math.cos(ang - 0.45)},${y2 - ah * Math.sin(ang - 0.45)} ${x2 - ah * Math.cos(ang + 0.45)},${y2 - ah * Math.sin(ang + 0.45)}`}
              fill={a.colour}
            />
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={px(l.at[0]) + 12} y={py(l.at[1]) - 10} fontSize={30} fontWeight={800} fill={l.colour}>
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
  /** x-positions to ring on the curve, with a colour and a caption. */
  marks?: { x: number; colour: string; label?: string }[];
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
        <g key={i}>
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

/** A row of value chips — used wherever a lesson is really a list. */
function Chips({
  items,
  shown,
  colourOf,
}: {
  items: (string | number)[];
  shown: number;
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
            opacity: i < shown ? 1 : 0.14,
          }}
        >
          {v}
        </div>
      ))}
    </div>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const step = (k: number) => Math.round(dur * k);
  const reveal = (count: number, from = 0.15, span = 0.6) =>
    Math.min(count, Math.max(0, Math.floor((frame - step(from)) / Math.max(1, Math.floor((dur * span) / count))) + 1));

  // ── M16 / M17 / M18 ──────────────────────────────────────────────────────
  const stage = { alignItems: "center", justifyContent: "center", gap: 28 } as const;
  const tipLine = <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>;
  const fade = (at: number) =>
    interpolate(frame, [step(at), step(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  if (unit.mode === "y-intercept") {
    const { a, b, c } = ADV.yInt;
    const f = (x: number) => a * x * x + b * x + c;
    const rows = [
      `f(0) = ${a}(0)² + ${b}(0) − ${Math.abs(c)}`,
      `f(0) = 0 + 0 − ${Math.abs(c)}`,
      `f(0) = −${Math.abs(c)}`,
    ];
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? 2 : 3;
    const headline =
      sceneId === "ask"
        ? `f(x) = ${a}x² + ${b}x − ${Math.abs(c)}`
        : sceneId === "work"
          ? "On the y axis, x is zero"
          : sceneId === "twist"
            ? "The constant IS the y-intercept"
            : `y-intercept: (0, −${Math.abs(c)})`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
          <Sketch f={f} from={-3} to={2} width={560} height={320} marks={[{ x: 0, colour: GOLD, label: `−${Math.abs(c)}` }]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rows.slice(0, shown).map((r, i) => (
              <div key={i} style={{ fontSize: 44, fontWeight: 800, color: i === 2 ? GREEN : INK, opacity: fade(0.12 + i * 0.16) }}>
                {r}
              </div>
            ))}
          </div>
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "multiplicity") {
    const { r1, m1, r2 } = ADV.mult;
    const f = (x: number) => Math.pow(x - r1, m1) * (x - r2) * 0.5;
    const showMarks = sceneId === "twist" || sceneId === "record";
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
          marks={
            showMarks
              ? [
                  { x: r1, colour: GOLD, label: "bounce" },
                  { x: r2, colour: RED, label: "cross" },
                ]
              : []
          }
        />
        {showMarks && (
          // Ordered by position on the axis, so the caption on the left
          // describes the root on the left. Reading order matters when the
          // whole lesson is "which one bounces".
          <div style={{ display: "flex", gap: 90, opacity: fade(0.4) }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: RED }}>x = −{Math.abs(r2)}, multiplicity 1 — odd</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: GOLD }}>x = {r1}, multiplicity {m1} — even</div>
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
    const headline =
      sceneId === "ask"
        ? `Degree ${d} — how many turns?`
        : sceneId === "work"
          ? "Line 0, parabola 1, cubic 2…"
          : sceneId === "twist"
            ? `At most ${d - 1}`
            : `Degree ${d} → at most ${d - 1} turning points`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Sketch
          f={f}
          from={-2.6}
          to={3}
          width={900}
          height={360}
          marks={
            sceneId === "ask" ? [] : turns.map((x) => ({ x, colour: GOLD }))
          }
        />
        {sceneId !== "ask" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GOLD, opacity: fade(0.3) }}>
            {d} − 1 = {d - 1} turns
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "fta") {
    const d = ADV.fta.degree;
    const shown = sceneId === "ask" ? 0 : reveal(d, 0.12, 0.55);
    const headline =
      sceneId === "ask"
        ? `Degree ${d}`
        : sceneId === "work"
          ? `Exactly ${d} roots`
          : sceneId === "twist"
            ? "Counting repeats, and complex ones"
            : `Degree ${d} → exactly ${d} roots`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Chips
          items={Array.from({ length: d }, (_, i) => i + 1)}
          shown={shown}
          colourOf={(i) => (sceneId === "twist" || sceneId === "record" ? (i >= d - 3 ? RED : GOLD) : GOLD)}
        />
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ fontSize: 40, fontWeight: 800, color: RED, opacity: fade(0.35) }}>
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
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : 3;
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
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: GOLD, paddingRight: 14 }}>{r}</div>
          <div style={{ borderLeft: `6px solid ${INK}`, paddingLeft: 26 }}>
            {[top, mid, bot].slice(0, shown).map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: "flex",
                  gap: 44,
                  borderTop: ri === 2 ? `5px solid ${INK}` : undefined,
                  paddingTop: ri === 2 ? 12 : 0,
                  marginTop: ri === 2 ? 10 : 6,
                  opacity: fade(0.1 + ri * 0.2),
                }}
              >
                {row.map((v, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: 130,
                      textAlign: "center",
                      fontSize: 50,
                      fontWeight: 800,
                      color: ri === 1 ? RED : ri === 2 && ci === 2 ? GREEN : INK,
                    }}
                  >
                    {v === "" ? "" : v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {shown >= 3 && (
          <div style={{ fontSize: 40, fontWeight: 800, color: MUTED, opacity: fade(0.7) }}>
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
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(factors.length, 0.3, 0.5) : factors.length;
    const headline =
      sceneId === "ask"
        ? "Which guesses are worth making?"
        : sceneId === "work"
          ? `factors of ${constant} ÷ factors of ${leading}`
          : sceneId === "twist"
            ? "± each one — a short list"
            : `${root} is one that works`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Chips
          items={sceneId === "ask" ? factors : factors.map((f) => (sceneId === "work" ? f : `±${f}`))}
          shown={shown}
          colourOf={(i) => ((sceneId === "twist" || sceneId === "record") && factors[i] === root ? GREEN : GOLD)}
        />
        {sceneId !== "ask" && (
          <div style={{ fontSize: 40, fontWeight: 800, color: MUTED, opacity: fade(0.55) }}>
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
    const rows = [`${base}^x = ${value}`, `${value} = ${base}³`, `${base}^x = ${base}³`, `x = ${power}`];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : sceneId === "twist" ? 4 : 4;
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
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 78 : 58, fontWeight: 800, color: i === 3 ? GREEN : i === 2 ? BLUE : INK, opacity: fade(0.1 + i * 0.16) }}>
              {r}
            </div>
          ))}
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
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(4, 0.12, 0.6) : 4;
    const headline =
      sceneId === "ask"
        ? "i² = −1"
        : sceneId === "work"
          ? "Work up the powers"
          : sceneId === "twist"
            ? "Back to 1 — it repeats every 4"
            : "Divide the power by 4, keep the remainder";
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          {cyc.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ fontSize: 44, color: MUTED, opacity: i < shown ? 1 : 0.14 }}>→</div>}
              <div style={{ textAlign: "center", opacity: i < shown ? 1 : 0.14 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>{c.p}</div>
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
                  }}
                >
                  {c.v}
                </div>
              </div>
            </React.Fragment>
          ))}
          {(sceneId === "twist" || sceneId === "record") && (
            <div style={{ fontSize: 44, color: GREEN, fontWeight: 800, opacity: fade(0.45) }}>↻</div>
          )}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "geometric") {
    const { first, ratio, term } = ADV.geo;
    const terms = Array.from({ length: term }, (_, i) => first * ratio ** i);
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? reveal(term, 0.15, 0.6) : term;
    const headline =
      sceneId === "ask"
        ? `first ${first}, ratio ${ratio}`
        : sceneId === "work"
          ? `Multiply by ${ratio} each step`
          : sceneId === "twist"
            ? `${term} − 1 = ${term - 1} steps, not ${term}`
            : `Term ${term} is ${terms[term - 1]}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          {terms.map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ textAlign: "center", opacity: i < shown ? 1 : 0.14 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: RED }}>× {ratio}</div>
                  <div style={{ fontSize: 40, color: MUTED }}>→</div>
                </div>
              )}
              <div
                style={{
                  borderRadius: 16,
                  border: `5px solid ${i === term - 1 && shown >= term ? GREEN : GOLD}`,
                  backgroundColor: "#FFF",
                  padding: "20px 40px",
                  fontSize: 62,
                  fontWeight: 800,
                  color: i === term - 1 && shown >= term ? GREEN : GOLD,
                  opacity: i < shown ? 1 : 0.14,
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
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(4, 0.15, 0.6) : 4;
    const headline =
      sceneId === "ask"
        ? `lim x→${at} (x² + x + ${c})`
        : sceneId === "work"
          ? "Close in from both sides"
          : sceneId === "twist"
            ? "No gaps — so just substitute"
            : `The limit is ${value}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "twist" || sceneId === "record" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: INK, opacity: fade(0.1) }}>
              {at}² + {at} + {c}
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: BLUE, opacity: fade(0.3) }}>
              {at * at} + {at} + {c}
            </div>
            <div style={{ fontSize: 84, fontWeight: 800, color: GREEN, opacity: fade(0.5) }}>= {value}</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {approach.map((x, i) => (
              <div key={i} style={{ textAlign: "center", opacity: i < shown ? 1 : 0.14 }}>
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
    const rows = [
      { t: `∫ x${sup(n)} dx`, c: INK },
      { t: `try x${sup(n + 1)}`, c: MUTED },
      { t: `differentiates to ${n + 1}x${sup(n)}  — ${n + 1}× too big`, c: RED },
      { t: `x${sup(n + 1)} / ${n + 1} + C`, c: GREEN },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : 4;
    const headline =
      sceneId === "ask"
        ? "Differentiating, run backwards"
        : sceneId === "work"
          ? "Add one to the power, then check"
          : sceneId === "twist"
            ? `Divide by ${n + 1} — and add C`
            : `x${sup(n + 1)} / ${n + 1} + C`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 74 : 50, fontWeight: 800, color: r.c, opacity: fade(0.1 + i * 0.17) }}>
              {r.t}
            </div>
          ))}
        </div>
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ fontSize: 38, fontWeight: 800, color: MUTED, opacity: fade(0.7) }}>
            a constant differentiates to zero, so C could be anything
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "order-integers") {
    const marks = ADV.integers;
    const sorted = [...marks].sort((a, b) => a - b);
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(marks.length) : marks.length;
    const headline =
      sceneId === "ask" ? `Order: ${marks.join(",  ")}` : sceneId === "work" ? "Every integer has an address" : sceneId === "twist" ? "Left = smaller" : sorted.join("  <  ");
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
        <Title text={headline} enter={title} />
        <IntLine lo={-5} hi={6} marks={sceneId === "work" ? marks : sorted} shown={shown} />
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "order-ops") {
    const { a, b, c } = ADV.orderOps;
    const right = a + b * c;
    const wrong = (a + b) * c;
    const headline =
      sceneId === "ask" ? `${a} + ${b} × ${c} = ?` : sceneId === "work" ? "Two paths — one rule" : sceneId === "twist" ? `${right} is right · brackets make ${wrong}` : "× and ÷ before + and −";
    const showPaths = sceneId !== "ask";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36 }}>
        <Title text={headline} enter={title} />
        {showPaths && (
          <div style={{ display: "flex", gap: 70 }}>
            <div style={{ textAlign: "center" }}>
              <Card colour={RED}>
                ({a} + {b}) × {c} = {wrong}
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: RED, marginTop: 12 }}>
                {sceneId === "twist" || sceneId === "record" ? "only with brackets" : "left to right ✗"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Card colour={GREEN}>
                {a} + ({b} × {c}) = {right}
              </Card>
              <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 12 }}>multiply first ✓</div>
            </div>
          </div>
        )}
        {sceneId === "record" && <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "complex") {
    const { a, b, c, d } = ADV.complex;
    const showSum = sceneId === "twist" || sceneId === "record";
    const arrows = [
      { from: [0, 0] as [number, number], to: [a, b] as [number, number], colour: BLUE },
      ...(showSum
        ? [
            { from: [a, b] as [number, number], to: [a + c, b + d] as [number, number], colour: GOLD },
            { from: [0, 0] as [number, number], to: [a + c, b + d] as [number, number], colour: GREEN },
          ]
        : []),
    ];
    const labels = [
      { at: [a, b] as [number, number], text: `${a} + ${b}i`, colour: BLUE },
      ...(showSum ? [{ at: [a + c, b + d] as [number, number], text: `${a + c} + ${b + d}i`, colour: GREEN }] : []),
    ];
    const headline =
      sceneId === "ask" ? `${a} + ${b}i — just a point` : sceneId === "work" ? "Real across · imaginary up" : sceneId === "twist" ? `+ (${c} + ${d}i) — parts add` : `${a + c} + ${b + d}i`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <Plane arrows={sceneId === "ask" ? [] : arrows} labels={sceneId === "ask" ? [] : labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "sequence") {
    const { start, step: hop, terms } = ADV.seq;
    const seq = Array.from({ length: terms }, (_, i) => start + i * hop);
    const sums = seq.map((_, i) => seq.slice(0, i + 1).reduce((x, y) => x + y, 0));
    const isSeries = sceneId === "twist" || sceneId === "record";
    const shown = sceneId === "ask" ? terms : sceneId === "work" ? reveal(terms + 1) : terms;
    const headline =
      sceneId === "ask" ? `${seq.join(",  ")},  …` : sceneId === "work" ? `Same hop every time: +${hop}` : sceneId === "twist" ? "Now ADD them up — a series" : "Sequence lists · series adds";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
          {seq.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 34, alignItems: "center", opacity: i < shown ? 1 : 0.12 }}>
              {i > 0 && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD }}>+{hop}→</div>}
              <div style={{ textAlign: "center" }}>
                <Card colour={BLUE}>{v}</Card>
                {isSeries && <div style={{ fontSize: 36, fontWeight: 800, color: GREEN, marginTop: 10 }}>Σ {sums[i]}</div>}
              </div>
            </div>
          ))}
          {sceneId === "work" && shown > terms && <div style={{ fontSize: 38, fontWeight: 800, color: GOLD }}>+{hop}→ {seq[terms - 1] + hop}</div>}
        </div>
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "vectors") {
    const { v1, v2 } = ADV.vec;
    const s: [number, number] = [v1[0] + v2[0], v1[1] + v2[1]];
    const showSecond = sceneId !== "ask";
    const showSum = sceneId === "twist" || sceneId === "record";
    const arrows = [
      { from: [0, 0] as [number, number], to: v1, colour: BLUE },
      ...(showSecond ? [{ from: v1, to: s, colour: GOLD }] : []),
      ...(showSum ? [{ from: [0, 0] as [number, number], to: s, colour: GREEN }] : []),
    ];
    const labels = [
      { at: v1, text: `(${v1[0]}, ${v1[1]})`, colour: BLUE },
      ...(showSum ? [{ at: s, text: `(${s[0]}, ${s[1]})`, colour: GREEN }] : []),
    ];
    const headline =
      sceneId === "ask" ? `An arrow: ${v1[0]} across, ${v1[1]} up` : sceneId === "work" ? "Add tip to tail" : sceneId === "twist" ? `(${v1[0]}+${v2[0]}, ${v1[1]}+${v2[1]}) = (${s[0]}, ${s[1]})` : "Components just add";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Title text={headline} enter={title} />
        <Plane arrows={arrows} labels={labels} />
        {sceneId === "record" && <div style={{ fontSize: 42, fontWeight: 800, color: GREEN }}>{unit.tip}</div>}
      </AbsoluteFill>
    );
  }

  // Calculus card modes: power-rule, monomials, applications.
  {
    const rows =
      unit.mode === "power-rule"
        ? [
            { from: "x³", to: "3x²", note: "down in front · drop by one" },
            { from: "x⁵", to: "5x⁴", note: "same two moves" },
          ]
        : unit.mode === "monomials"
          ? [
              { from: "5x³", to: "15x²", note: "5 × 3 = 15 in front" },
            ]
          : [
              { from: "s = t²", to: "v = 2t", note: "differentiate position" },
              { from: "t = 3", to: `v = ${2 * ADV.app.t}`, note: "metres per second" },
            ];
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? reveal(rows.length) : rows.length;
    const headlines: Record<string, Record<string, string>> = {
      "power-rule": { ask: "A two-move rule", work: "Down in front… drop by one", twist: "Any power, same moves", record: "d/dx xⁿ = n·xⁿ⁻¹" },
      monomials: { ask: "5x³ — what about the 5?", work: "The coefficient rides along", twist: "5 × 3 = 15, exponent drops", record: "k·xⁿ → k·n·xⁿ⁻¹" },
      applications: { ask: "How fast at 3 seconds?", work: "Speed IS the derivative", twist: `v = 2 × 3 = ${2 * ADV.app.t} m/s`, record: "Position → speed" },
    };
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <Title text={headlines[unit.mode][sceneId] ?? ""} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 30, alignItems: "center", opacity: i < shown || sceneId === "ask" ? 1 : 0.12 }}>
              <Card colour={BLUE} dim={sceneId === "ask"}>{r.from}</Card>
              <div style={{ fontSize: 52, fontWeight: 800, color: GOLD }}>→</div>
              <Card colour={GREEN} dim={sceneId === "ask"}>{r.to}</Card>
              <div style={{ fontSize: 32, fontWeight: 700, color: MUTED, maxWidth: 360 }}>{sceneId === "ask" ? "" : r.note}</div>
            </div>
          ))}
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
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
