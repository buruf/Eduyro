// src/remotion/lesson/QuadVideo.tsx
// The QUADRATICS template (M13, Grade 9).
//
// One idea runs through every mode: a quadratic answers in PAIRS. So the
// pictures are chosen to make the second answer impossible to overlook — two
// roots on a number line, two brackets each set to zero, a parabola that
// misses the axis entirely when there are none at all.
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
import { quadSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { quadUnitById, quadNumbers, type QuadUnit } from "./units-quad";

export type QuadProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const RED = "#A8321E";
const MUTED = "#8A7A5E";

interface SceneProps {
  dur: number;
  unit: QuadUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment.
   *  A root is aligned on its ABSOLUTE value: the narration says "negative 3",
   *  and the alignment carries the 3. */
  said: SaidFn;
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
        fontSize: 62,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
        maxWidth: 1600,
      }}
    >
      {text}
    </div>
  );
}

/** A parabola, used where "how many times does it meet the axis" is the point. */
function Parabola({ a, b, c, width = 720, height = 360 }: { a: number; b: number; c: number; width?: number; height?: number }) {
  const from = -b / (2 * a) - 4;
  const to = -b / (2 * a) + 4;
  const f = (x: number) => a * x * x + b * x + c;
  const N = 140;
  const xs = Array.from({ length: N + 1 }, (_, i) => from + ((to - from) * i) / N);
  const ys = xs.map(f);
  const lo = Math.min(...ys, 0);
  const hi = Math.max(...ys);
  const pad = (hi - lo) * 0.15 || 1;
  const px = (x: number) => ((x - from) / (to - from)) * width;
  const py = (y: number) => height - ((y - (lo - pad)) / (hi - lo + 2 * pad)) * height;
  const d = xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <line x1={0} y1={py(0)} x2={width} y2={py(0)} stroke={INK} strokeWidth={4} />
      <path d={d} fill="none" stroke={BLUE} strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
}

/** A short number line carrying the two roots — the pair, made visible. */
function RootLine({ roots, lo, hi, shownAt }: { roots: number[]; lo: number; hi: number; shownAt: number[] }) {
  const frame = useCurrentFrame();
  const W = 900;
  const px = (v: number) => ((v - lo) / (hi - lo)) * W;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v++) ticks.push(v);
  return (
    <div style={{ position: "relative", width: W, height: 150 }}>
      <div style={{ position: "absolute", left: 0, top: 70, width: W, height: 5, backgroundColor: INK, borderRadius: 3 }} />
      {ticks.map((v) => (
        <React.Fragment key={v}>
          <div style={{ position: "absolute", left: px(v) - 2, top: 60, width: 4, height: 24, backgroundColor: v === 0 ? GOLD : MUTED }} />
          <div style={{ position: "absolute", left: px(v) - 30, top: 92, width: 60, textAlign: "center", fontSize: 28, fontWeight: 800, color: v === 0 ? GOLD : MUTED }}>
            {v}
          </div>
        </React.Fragment>
      ))}
      {roots.map((r, i) => (frame < shownAt[i] ? null : (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: px(r) - 16, top: 56, width: 32, height: 32, borderRadius: "50%", backgroundColor: GREEN }} />
          <div style={{ position: "absolute", left: px(r) - 80, top: 4, width: 160, textAlign: "center", fontSize: 40, fontWeight: 800, color: GREEN }}>
            {r}
          </div>
        </React.Fragment>
      )))}
    </div>
  );
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0); // not-speech-bound: the headline is the scene's own caption
  const n = quadNumbers(unit);
  const step = (f: number) => Math.floor(dur * f); // not-speech-bound: fallback frames only
  const fade = (at: number) =>
    interpolate(frame, [step(at), step(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  /** Same ramp, but from an absolute frame (a spoken moment) instead of a fraction. */
  const at = (f: number) =>
    Number.isFinite(f)
      ? interpolate(frame, [f, f + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 0;
  const stage = { alignItems: "center", justifyContent: "center", gap: 30 } as const;
  const tipLine = (
    <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>
  );

  if (unit.mode === "perfect-squares") {
    // The square, actually built. 36 dots is a picture; "36 is a perfect
    // square" is a claim.
    const cell = 44;
    // work: "Try it with 36. 6 rows of 6... and it fills exactly" — the square
    // starts filling on the first "6" and is complete on the closing "36".
    const fillFrom = said(n.side, step(0.15), 0);
    const fillTo = said(n.square, fillFrom + step(0.5), -1);
    const built =
      sceneId === "ask"
        ? 0
        : sceneId === "work"
          ? Math.min(n.square, Math.max(0, Math.floor(((frame - fillFrom) / Math.max(1, fillTo - fillFrom)) * n.square) + 1))
          : n.square; // not-speech-bound: carried over, already built in "work"
    // The side panel answers "the square root of 36 is 6" — twist says that 6
    // first, record says it as its SECOND 6 ("6 squared is 36, so … is 6").
    const sideAt = said(n.side, step(0.2), sceneId === "record" ? 1 : 0);
    const headline =
      sceneId === "ask"
        ? `Is ${n.square} a perfect square?`
        : sceneId === "work"
          ? `${n.side} rows of ${n.side}`
          : sceneId === "twist"
            ? `√${n.square} asks for the SIDE`
            : `${n.side} × ${n.side} = ${n.square}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${n.side}, ${cell}px)`, gap: 6 }}>
            {Array.from({ length: n.square }, (_, i) => (
              <div
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 6,
                  backgroundColor: i < built ? GOLD : "transparent",
                  border: `2px solid ${i < built ? "#8A5E10" : MUTED}`,
                }}
              />
            ))}
          </div>
          {(sceneId === "twist" || sceneId === "record") && (
            <div style={{ opacity: at(sideAt), textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: MUTED }}>side</div>
              <div style={{ fontSize: 92, fontWeight: 800, color: GREEN }}>{n.side}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>√{n.square} = {n.side}</div>
            </div>
          )}
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "solve-x2-k") {
    // Both answers are the SAME spoken number ("3", then "negative 3"), so the
    // positive root takes one occurrence and the negative root the next.
    //   work   "Check 3: 3 squared is 9 … Now check negative 3"  → 1st / 4th "3"
    //   twist  "3 and negative 3 both land on 9"                 → 1st / 2nd "3"
    //   record "x equals plus or minus 3"                        → one moment, both
    const occ: [number, number] | null =
      sceneId === "work" ? [0, 3] : sceneId === "twist" ? [0, 1] : sceneId === "record" ? [0, 0] : null;
    const rootAt: [number, number] =
      occ === null
        ? [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] // ask: the roots are not out yet
        : [said(n.posRoot, 0, occ[0]), said(n.posRoot, sceneId === "work" ? Number.POSITIVE_INFINITY : 0, occ[1])];
    const headline =
      sceneId === "ask"
        ? `x² = ${n.a}`
        : sceneId === "work"
          ? "Both of these work"
          : sceneId === "twist"
            ? "Squaring throws the sign away"
            : `x = ±${n.b}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 80 }}>
          {[
            { v: n.posRoot, c: BLUE },
            { v: n.negRoot, c: GOLD },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: "center", opacity: frame >= rootAt[i] ? 1 : 0.14 }}>
              <div style={{ fontSize: 60, fontWeight: 800, color: r.c }}>
                ({r.v})² = {n.a}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: MUTED, marginTop: 8 }}>
                {r.v < 0 ? "negative × negative = positive" : ""}
              </div>
            </div>
          ))}
        </div>
        <RootLine roots={[n.negRoot, n.posRoot]} lo={-5} hi={5} shownAt={[rootAt[1], rootAt[0]]} />
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "simplify-roots") {
    const rows = [
      `√${n.a}`,
      `√(${n.factor} × ${n.inside})`,
      `√${n.factor} × √${n.inside}`,
      `${n.outside}√${n.inside}`,
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : 4;
    // ask   "the square root of 8"                          → √8 on the first 8
    // work  "write the root of 8 as the root of 4, times the root of 2"
    //                                                        → the split on that 4, the product on its 2
    // twist "The answer is 2 root 2"                         → the answer on its own 2 (4th)
    // record "Root 8 is 2 root 2"                            → √8 on the 8, answer on the last 2
    const rowAt = [
      sceneId === "twist" ? 0 /* not-speech-bound: carried over from work */ : said(n.a, step(0.1), 0),
      sceneId === "work" ? said(n.factor, step(0.26), 2) : step(0.26), // not-speech-bound outside work: carried over
      sceneId === "work" ? said(n.inside, step(0.42), -1) : step(0.42), // not-speech-bound outside work: carried over
      sceneId === "twist" ? said(n.inside, step(0.58), 3) : said(n.inside, step(0.58), -1),
    ];
    // "both are about 2.8" — twist says "about 2 point 8", so it lands on that 8.
    const aboutAt = sceneId === "twist" ? said(n.a, step(0.7), 1) : step(0.7); // not-speech-bound in record
    const headline =
      sceneId === "ask"
        ? `√${n.a} — not a whole number`
        : sceneId === "work"
          ? `${n.factor} is a perfect square`
          : sceneId === "twist"
            ? `√${n.factor} walks out`
            : `√${n.a} = ${n.outside}√${n.inside}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 86 : 60, fontWeight: 800, color: i === 3 ? GREEN : i === 2 ? BLUE : INK, opacity: at(rowAt[i]) }}>
              {r}
            </div>
          ))}
        </div>
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ fontSize: 38, fontWeight: 800, color: MUTED, opacity: at(aboutAt) }}>
            both are about 2.8 — same value, tidier form
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "zero-product" || unit.mode === "solve-factoring") {
    const factoring = unit.mode === "solve-factoring";
    const shown = sceneId === "ask" ? 0 : sceneId === "work" ? (factoring ? 1 : 0) : 2;
    const roots = [n.root1, n.root2];
    // The brackets. zero-product reads them out in "ask" ("x minus 3, x minus
    // 5"); solve-factoring only reaches them in "twist" ("so it factors to…").
    const boxOcc = factoring ? (sceneId === "twist" || sceneId === "record" ? 0 : null) : sceneId === "ask" ? 0 : null;
    const boxAt = (i: number) =>
      boxOcc === null ? 0 /* not-speech-bound: the brackets are already on screen */ : said(roots[i], 0, boxOcc);
    // "x is 3 … x is 5" — in twist that is the SECOND time each root is named
    // (after "x minus 3 is zero"); in record it is the only time.
    const solAt = (i: number) =>
      shown < 2 ? Number.POSITIVE_INFINITY : said(roots[i], step(0.2 + i * 0.2), sceneId === "twist" ? 1 : 0);
    // The factor-pair cards: "multiply to 18" names the first pair's product,
    // "Try 3 and 6" names the winning pair.
    const pairAt = (i: number) => (i === 0 ? said(n.product, 0, 0) : said(n.root1, 0, 0));
    const headline =
      sceneId === "ask"
        ? factoring
          ? `x² − ${n.sum}x + ${n.product} = 0`
          : `(x − ${n.root1})(x − ${n.root2}) = 0`
        : sceneId === "work"
          ? factoring
            ? `multiply to ${n.product}, add to −${n.sum}`
            : "A product is zero only if a factor is"
          : sceneId === "twist"
            ? "Set each bracket to zero"
            : `x = ${n.root1} or x = ${n.root2}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {factoring && sceneId === "work" ? (
          <div style={{ display: "flex", gap: 50 }}>
            {[
              [1, n.product],
              [n.root1, n.root2],
            ].map((pair, i) => {
              const good = pair[0] + pair[1] === n.sum;
              return (
                <div key={i} style={{ borderRadius: 18, border: `5px solid ${good ? GREEN : MUTED}`, padding: "22px 38px", backgroundColor: "#FFF", textAlign: "center", opacity: at(pairAt(i)) }}>
                  <div style={{ fontSize: 50, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {pair[0]} · {pair[1]} = {pair[0] * pair[1]}
                  </div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {pair[0]} + {pair[1]} = {pair[0] + pair[1]} {good ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 46, alignItems: "center" }}>
            {roots.map((r, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ fontSize: 50, fontWeight: 800, color: MUTED, opacity: at(boxAt(i)) }}>×</div>}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      opacity: at(boxAt(i)),
                      borderRadius: 18,
                      border: `5px solid ${i === 0 ? BLUE : GOLD}`,
                      padding: "22px 38px",
                      backgroundColor: "#FFF",
                      fontSize: 54,
                      fontWeight: 800,
                      color: i === 0 ? BLUE : GOLD,
                    }}
                  >
                    x − {r}
                  </div>
                  <div style={{ height: 62, marginTop: 10, opacity: at(solAt(i)) }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: MUTED }}>= 0 →</div>
                    <div style={{ fontSize: 46, fontWeight: 800, color: GREEN }}>x = {r}</div>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div style={{ fontSize: 50, fontWeight: 800, color: MUTED, opacity: at(boxAt(1)) }}>= 0</div>
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // discriminant
  const rows = [
    `b² − 4ac`,
    `${n.b}² − 4(${n.a})(${n.c})`,
    `${n.bSquared} − ${n.fourAC}`,
    `= ${n.discriminant}`,
  ];
  const shown = sceneId === "ask" ? 0 : sceneId === "work" ? 4 : 4;
  // work: "b squared minus 4 a c" → the formula on that 4; "a is 1, b is 4,
  // c is 6" → the substituted line on the c; "4 a c is 24" → the subtraction;
  // "16 minus 24 is negative 8" → the result on its 8 (aligned on |−8|).
  // record: "b squared minus 4 a c" then, much later, "here it is negative 8".
  const rowAt =
    sceneId === "work"
      ? [said(n.b, step(0.1), 0), said(n.c, step(0.24), 0), said(n.fourAC, step(0.38), 0), said(Math.abs(n.discriminant), step(0.52), -1)]
      : sceneId === "record"
        ? [said(n.b, step(0.1), 0), step(0.24), step(0.38), said(Math.abs(n.discriminant), step(0.52), 0)] // middle rows: not-speech-bound, record never reads them
        : [step(0.1), step(0.24), step(0.38), step(0.52)]; // twist: not-speech-bound, this clip names no number
  const headline =
    sceneId === "ask"
      ? `x² + ${n.b}x + ${n.c} = 0`
      : sceneId === "work"
        ? "The part under the root"
        : sceneId === "twist"
          ? "Negative → no real solutions"
          : "positive 2 · zero 1 · negative 0";
  return (
    <AbsoluteFill style={stage}>
      <Title text={headline} enter={title} />
      <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          {rows.slice(0, shown).map((r, i) => (
            <div key={i} style={{ fontSize: i === 3 ? 74 : 48, fontWeight: 800, color: i === 3 ? RED : INK, opacity: at(rowAt[i]) }}>
              {r}
            </div>
          ))}
        </div>
        {(sceneId === "twist" || sceneId === "record" || sceneId === "ask") && (
          <div style={{ opacity: sceneId === "ask" ? 1 : fade(0.15), textAlign: "center" }}>
            <Parabola a={n.a} b={n.b} c={n.c} width={600} height={300} />
            {sceneId !== "ask" && (
              <div style={{ fontSize: 36, fontWeight: 800, color: RED, marginTop: 8 }}>never touches the axis</div>
            )}
          </div>
        )}
      </div>
      {sceneId === "record" && tipLine}
    </AbsoluteFill>
  );
}

export const QuadVideo: React.FC<QuadProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = quadUnitById(unitId);
  const scenes = quadSceneTimings(unitId, voice);
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
