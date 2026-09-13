// src/remotion/lesson/FactorVideo.tsx
// The FACTORING template (M12, Grade 9).
//
// These lessons are about RECOGNISING a shape, so the screen's job is to make
// the shape visible: the matching bracket in grouping picked out in one
// colour, the two middle terms of a difference of squares shown cancelling,
// and the perfect-square test written as an equation you can check rather
// than a rule you must trust.
//
// Sync: every working line lands on the number that finishes it in the
// narration (timeline `saidFor` → `said(n, fallback, occurrence)`): the ac
// product on "is 12", the split pair on the "3" of "3 and 4", the four split
// terms on the "2" of "2 x squared", the grouped brackets on the last "3",
// the difference-of-squares cancel strip term by term, the cube answer on the
// "4" that ends it. A line already on screen from the previous scene stays
// put (frame 0) instead of re-entering. Reveals that follow no spoken number
// — headlines, the closing tip, the SOAP words, the "any other middle term"
// note — keep their old frames and are marked `// not-speech-bound`.
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
import { factorSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { factorUnitById, factorNumbers, type FactorUnit } from "./units-factor";

export type FactorProps = {
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
  unit: FactorUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline
   *  `saidFor`). The fallback is the old hand-picked frame, used when the
   *  clip carries no word alignment. */
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
        fontSize: 60,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
        maxWidth: 1650,
      }}
    >
      {text}
    </div>
  );
}

/** A stack of working lines. Each line appears on the frame the narrator
 *  reaches the number that finishes it (`at[i]`, from `said`); a line carried
 *  over from the previous scene has `at = 0` and is simply there. */
function Steps({
  rows,
  shown,
  at,
}: {
  rows: { t: React.ReactNode; c?: string; size?: number }[];
  shown: number;
  at: number[];
}) {
  const frame = useCurrentFrame();
  const fadeAt = (f: number) =>
    interpolate(frame, [f, f + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
      {rows.slice(0, shown).map((r, i) => (
        <div
          key={i}
          style={{
            fontSize: r.size ?? 56,
            fontWeight: 800,
            color: r.c ?? INK,
            opacity: fadeAt(at[i] ?? 0),
            whiteSpace: "nowrap",
          }}
        >
          {r.t}
        </div>
      ))}
    </div>
  );
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const n = factorNumbers(unit);
  const step = (f: number) => Math.floor(dur * f); // not-speech-bound — fallback frames only
  const fade = (at: number) =>
    interpolate(frame, [step(at), step(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  /** The hand-picked frame row `i` used before the sync fix — kept as the
   *  fallback for clips with no word alignment. // not-speech-bound */
  const fb = (i: number) => step(0.1 + i * 0.15);
  /** A row already on screen from the previous scene: no new reveal. */
  const CARRIED = 0;
  const stage = { alignItems: "center", justifyContent: "center", gap: 30 } as const;
  const tipLine = (
    <div style={{ fontSize: 38, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1550 }}>{unit.tip}</div>
  );
  /** The bracket that both halves share — the signal that grouping worked. */
  const hl = (text: string, colour = GREEN) => <span style={{ color: colour }}>{text}</span>;

  if (unit.mode === "trinomial-a") {
    const rows = [
      { t: `${n.a}x² + ${n.b}x + ${n.c}` },
      { t: `a × c = ${n.a} × ${n.c} = ${n.ac}`, c: MUTED, size: 46 },
      { t: `${n.split1} · ${n.split2} = ${n.ac}   and   ${n.split1} + ${n.split2} = ${n.b}`, c: GOLD, size: 46 },
      { t: `${n.a}x² + ${n.split1}x + ${n.split2}x + ${n.c}`, c: BLUE },
      { t: <>x({hl(`${n.a}x + ${n.split1}`)}) + {n.q}({hl(`${n.a}x + ${n.split1}`)})</>, c: INK, size: 50 },
      { t: `(${n.a}x + ${n.split1})(x + ${n.q})`, c: GREEN, size: 72 },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : sceneId === "twist" ? 5 : 6;
    // ask    "…plus 7 x, plus 6"            → the question on the closing "6"
    // work   "2 times 6 is 12" / "3 and 4"  → ac row on "12", the pair on "3"
    // twist  "…four terms: 2 x squared…"    → split row on that "2";
    //        the grouped line on the last "3" that closes the second bracket
    // record "…bracket, x plus 2"           → the answer on the closing "2"
    const at =
      sceneId === "ask"
        ? [said(n.c, fb(0), 0)]
        : sceneId === "work"
          ? [CARRIED, said(n.ac, fb(1), 0), said(n.split1, fb(2), 0)]
          : sceneId === "twist"
            ? [CARRIED, CARRIED, CARRIED, said(n.a, fb(3), 0), said(n.split1, fb(4), 3)]
            : [CARRIED, CARRIED, CARRIED, CARRIED, CARRIED, said(n.q, fb(5), -1)];
    const headline =
      sceneId === "ask"
        ? "The two-numbers trick fails here"
        : sceneId === "work"
          ? `Multiply a by c first`
          : sceneId === "twist"
            ? "Split the middle, then group"
            : "Same bracket twice — it worked";
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Steps rows={rows} shown={shown} at={at} />
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "diff-squares") {
    const rows = [
      { t: `x² − ${n.squared}` },
      { t: `x² − ${n.root}²`, c: BLUE, size: 50 },
      { t: `(x − ${n.root})(x + ${n.root})`, c: GREEN, size: 70 },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : 3;
    // ask   "Factor x squared minus 16"       → the question on that "16"
    // work  "4 times 4 is 16"                 → x² − 4² on the second "16";
    //       "…x minus 4, bracket, x plus 4"   → the answer on the last "4"
    const at =
      sceneId === "ask"
        ? [said(n.squared, fb(0), 0)]
        : sceneId === "work"
          ? [CARRIED, said(n.squared, fb(1), 1), said(n.root, fb(2), -1)]
          : [CARRIED, CARRIED, CARRIED];
    // The multiply-back strip: "x times 4 is 4 x" (the 2nd "4"), "minus 4
    // times x is minus 4 x" (the 4th), "minus 4 times 4 is minus 16".
    const plusAt = said(n.root, step(0.25), 1);
    const minusAt = said(n.root, step(0.3), 3);
    const lastAt = said(n.squared, step(0.4), -1);
    const stripAt =
      sceneId === "twist"
        ? // x² is spoken as words, so it settles just before the first number
          [Math.max(0, plusAt - 24), plusAt, minusAt, lastAt]
        : [CARRIED, CARRIED, CARRIED, CARRIED];
    // the strike lands on "they cancel", which follows the last number // not-speech-bound
    const strikeAt = sceneId === "twist" ? lastAt + 30 : CARRIED;
    const headline =
      sceneId === "ask"
        ? `x² − ${n.squared} — where is the x term?`
        : sceneId === "work"
          ? "A square, minus a square"
          : sceneId === "twist"
            ? "The middle terms cancel"
            : `x² − ${n.squared} = (x − ${n.root})(x + ${n.root})`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Steps rows={rows} shown={shown} at={at} />
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
            {[
              { t: "x²", c: INK, strike: false },
              { t: `+ ${n.root}x`, c: RED, strike: true },
              { t: `− ${n.root}x`, c: RED, strike: true },
              { t: `− ${n.squared}`, c: INK, strike: false },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  fontSize: 50,
                  fontWeight: 800,
                  color: p.c,
                  textDecoration: p.strike && frame >= strikeAt ? "line-through" : undefined,
                  opacity: frame < stripAt[i] ? 0 : p.strike && frame >= strikeAt ? 0.6 : 1,
                }}
              >
                {p.t}
              </div>
            ))}
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "perfect-square") {
    const rows = [
      { t: `x² + ${n.middle}x + ${n.c}` },
      { t: `√(x²) = x        √${n.c} = ${n.half}`, c: BLUE, size: 46 },
      { t: `2 × x × ${n.half} = ${n.middle}x  ✓`, c: GOLD, size: 52 },
      { t: `(x + ${n.half})²`, c: GREEN, size: 78 },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : sceneId === "twist" ? 3 : 4;
    // ask    "…plus 6 x, plus 9"          → the question on the closing "9"
    // work   "its root is 3"              → the two roots row on that "3"
    // twist  "2 times 3, which is 6"      → the twice-the-roots row on "6"
    // record "x plus 3, squared"          → the answer on that "3"
    const at =
      sceneId === "ask"
        ? [said(n.c, fb(0), 0)]
        : sceneId === "work"
          ? [CARRIED, said(n.half, fb(1), 0)]
          : sceneId === "twist"
            ? [CARRIED, CARRIED, said(n.middle, fb(2), 0)]
            : [CARRIED, CARRIED, CARRIED, said(n.half, fb(3), 0)];
    const headline =
      sceneId === "ask"
        ? `x² + ${n.middle}x + ${n.c}`
        : sceneId === "work"
          ? "Are both ends squares?"
          : sceneId === "twist"
            ? "Is the middle TWICE the roots multiplied?"
            : `(x + ${n.half})²`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Steps rows={rows} shown={shown} at={at} />
        {(sceneId === "twist" || sceneId === "record") && (
          // not-speech-bound — "if the middle had been anything else" names no number
          <div style={{ fontSize: 36, fontWeight: 800, color: MUTED, opacity: fade(0.7) }}>
            any other middle term, and it is an ordinary trinomial
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "grouping") {
    const rows = [
      { t: `x³ + ${n.g1}x² + ${n.g2}x + ${n.c}` },
      {
        t: (
          <>
            (x³ + {n.g1}x²) + ({n.g2}x + {n.c})
          </>
        ),
        c: BLUE,
        size: 52,
      },
      {
        t: (
          <>
            x²({hl(`x + ${n.g1}`)}) + {n.g2}({hl(`x + ${n.g1}`)})
          </>
        ),
        size: 52,
      },
      { t: `(x + ${n.g1})(x² + ${n.g2})`, c: GREEN, size: 72 },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : sceneId === "twist" ? 4 : 4;
    // ask   "…plus 2 x, plus 6"              → the question on the closing "6"
    // work  "Second pair: 2 x plus 6"        → the paired row on that "6";
    //       "…that leaves 2, bracket, x plus 3" → the two factored pairs on
    //       the last "3", when the second bracket is finished
    // twist "…bracket, x squared plus 2"     → the answer on that "2"
    // record has no word alignment, so every row keeps its fallback frame
    const at =
      sceneId === "ask"
        ? [said(n.c, fb(0), 0)]
        : sceneId === "work"
          ? [CARRIED, said(n.c, fb(1), 0), said(n.g1, fb(2), -1)]
          : sceneId === "twist"
            ? [CARRIED, CARRIED, CARRIED, said(n.g2, fb(3), -1)]
            : [CARRIED, CARRIED, CARRIED, CARRIED];
    const headline =
      sceneId === "ask"
        ? "Four terms, nothing common to all four"
        : sceneId === "work"
          ? "Pair them, and factor each pair"
          : sceneId === "twist"
            ? "The SAME bracket appeared twice"
            : `(x + ${n.g1})(x² + ${n.g2})`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <Steps rows={rows} shown={shown} at={at} />
        {(sceneId === "twist" || sceneId === "record") && (
          // not-speech-bound — "if the two brackets had come out different" names no number
          <div style={{ fontSize: 36, fontWeight: 800, color: MUTED, opacity: fade(0.7) }}>
            different brackets? pair the terms another way
          </div>
        )}
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // cubes — SOAP, with each sign coloured as it is decided.
  const rows = [
    { t: `x³ + ${n.cube}` },
    { t: `x³ + ${n.cubeRoot}³`, c: BLUE, size: 50 },
    { t: `(x + ${n.cubeRoot})(x² − ${n.cubeRoot}x + ${n.cubeSquare})`, c: GREEN, size: 66 },
  ];
  const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : 3;
  // ask   "Factor x cubed plus 8"            → the question on that "8"
  // work  "Take the cube roots: x, and 2"    → x³ + 2³ on that "2"
  // twist "…minus 2 x plus 4"                → the answer on the closing "4"
  // record has no word alignment; all three rows are carried from twist
  const at =
    sceneId === "ask"
      ? [said(n.cube, fb(0), 0)]
      : sceneId === "work"
        ? [CARRIED, said(n.cubeRoot, fb(1), 0)]
        : [CARRIED, CARRIED, sceneId === "twist" ? said(n.cubeSquare, fb(2), -1) : CARRIED];
  const headline =
    sceneId === "ask"
      ? `x³ + ${n.cube} — both are cubes`
      : sceneId === "work"
        ? `cube roots: x and ${n.cubeRoot}`
        : sceneId === "twist"
          ? "Same · Opposite · Always Positive"
          : `(x + ${n.cubeRoot})(x² − ${n.cubeRoot}x + ${n.cubeSquare})`;
  return (
    <AbsoluteFill style={stage}>
      <Title text={headline} enter={title} />
      <Steps rows={rows} shown={shown} at={at} />
      {(sceneId === "twist" || sceneId === "record") && (
        // not-speech-bound — "Same, Opposite, Always Positive" are words, not numbers
        <div style={{ display: "flex", gap: 60, opacity: fade(0.3) }}>
          {[
            { w: "Same", d: "+ in the first bracket", c: GREEN },
            { w: "Opposite", d: "− in the middle", c: RED },
            { w: "Always Positive", d: "+ at the end", c: BLUE },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: s.c }}>{s.w}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: MUTED }}>{s.d}</div>
            </div>
          ))}
        </div>
      )}
      {sceneId === "record" && tipLine}
    </AbsoluteFill>
  );
}

export const FactorVideo: React.FC<FactorProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = factorUnitById(unitId);
  const scenes = factorSceneTimings(unitId, voice);
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
