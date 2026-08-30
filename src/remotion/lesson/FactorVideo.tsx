// src/remotion/lesson/FactorVideo.tsx
// The FACTORING template (M12, Grade 9).
//
// These lessons are about RECOGNISING a shape, so the screen's job is to make
// the shape visible: the matching bracket in grouping picked out in one
// colour, the two middle terms of a difference of squares shown cancelling,
// and the perfect-square test written as an equation you can check rather
// than a rule you must trust.
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
import { factorSceneTimings } from "./timeline";
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

/** A stack of working lines, revealed one at a time. */
function Steps({
  rows,
  shown,
  fade,
}: {
  rows: { t: React.ReactNode; c?: string; size?: number }[];
  shown: number;
  fade: (at: number) => number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
      {rows.slice(0, shown).map((r, i) => (
        <div
          key={i}
          style={{
            fontSize: r.size ?? 56,
            fontWeight: 800,
            color: r.c ?? INK,
            opacity: fade(0.1 + i * 0.15),
            whiteSpace: "nowrap",
          }}
        >
          {r.t}
        </div>
      ))}
    </div>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const n = factorNumbers(unit);
  const step = (f: number) => Math.floor(dur * f);
  const fade = (at: number) =>
    interpolate(frame, [step(at), step(at) + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
        <Steps rows={rows} shown={shown} fade={fade} />
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
        <Steps rows={rows} shown={shown} fade={fade} />
        {(sceneId === "twist" || sceneId === "record") && (
          <div style={{ display: "flex", gap: 34, alignItems: "center", opacity: fade(0.25) }}>
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
                  textDecoration: p.strike ? "line-through" : undefined,
                  opacity: p.strike ? 0.6 : 1,
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
        <Steps rows={rows} shown={shown} fade={fade} />
        {(sceneId === "twist" || sceneId === "record") && (
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
        <Steps rows={rows} shown={shown} fade={fade} />
        {(sceneId === "twist" || sceneId === "record") && (
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
      <Steps rows={rows} shown={shown} fade={fade} />
      {(sceneId === "twist" || sceneId === "record") && (
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
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
