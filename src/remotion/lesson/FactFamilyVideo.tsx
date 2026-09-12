// src/remotion/lesson/FactFamilyVideo.tsx
// The FACT FAMILY template: one picture, four questions.
//
// Fact families are usually memorised as four separate facts, which is exactly
// backwards — they are ONE relationship, and the four facts are just different
// questions asked of the same picture. So this template draws the picture once
// and then interrogates it four times, highlighting the piece each fact is
// about:
//
//   additive        a part-part-whole bar   (5 and 8 make 13)
//   multiplicative  an array                (3 rows of 4 make 12)
//
// The highlight is the teaching: "13 − 8 = 5" lights the 5-part, so the child
// sees that subtraction is asking which piece is missing.
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment. The
// three numbers of the ask scene enter one per word; the whole bar lands on
// the whole and each part on its number (the array's first column on "3
// rows", the rest on "4 in each row"); each of the four facts enters number by
// number as she reads it and becomes the lit fact on its first number. The
// record line names no number, so its reveals keep their frames and are
// marked `// not-speech-bound`.
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
import { factFamilySceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { factFamilyUnitById, factFamilyFacts, type FactFamilyUnit } from "./units";

export { FPS } from "./timeline";

export type FactFamilyProps = {
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

const STAGE_W = 1500;
const STAGE_H = 470;

interface SceneProps {
  dur: number;
  unit: FactFamilyUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `factFamilyLines` (script.ts):
 *  "5 plus 8 is 13. 8 plus 5 is 13…" says every number four times, and only
 *  the occurrence list tells the k-th fact apart. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

const clamp01 = (frame: number, from: number, span: number) =>
  interpolate(frame, [from, from + span], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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

/** Split a phrase like "5 + 8 = 13" into parts that appear on the frame each
 *  number is said; text between numbers appears with the number that follows
 *  it, trailing text with the number before it, and a phrase with no numbers
 *  at all on `fallback`. `spokenBefore` lists the numbers the line says ahead
 *  of the phrase, so occurrences line up. */
function numberParts(phrase: string, said: SaidFn, fallback: number, spokenBefore: number[]): TextPart[] {
  const tokens = phrase.split(/(\d+)/).filter((t) => t.length > 0);
  const earlier = [...spokenBefore];
  const ats: number[] = tokens.map((t) => {
    if (!/^\d+$/.test(t)) return -1;
    const n = Number(t);
    const at = said(n, fallback, before(n, earlier));
    earlier.push(n);
    return at;
  });
  return tokens.map((text, i) => {
    let at = ats[i];
    if (at < 0) {
      const next = ats.slice(i + 1).find((a) => a >= 0);
      const prev = [...ats.slice(0, i)].reverse().find((a) => a >= 0);
      at = next ?? prev ?? fallback;
    }
    return { text, at };
  });
}

/** The numbers a phrase says, in order — for building occurrence lists. */
const numbersIn = (phrase: string) => (phrase.match(/\d+/g) ?? []).map(Number);

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

/** How far each piece of the bar has been revealed (0..1); the build scene
 *  grows the whole on its number and lands each part on its own. */
type BarShow = { whole: number; a: number; b: number };
const BAR_SHOWN: BarShow = { whole: 1, a: 1, b: 1 };

/**
 * Part-part-whole bar. `lit` says which piece the current fact is about:
 * "whole" | "a" | "b" | null.
 */
function Bar({
  unit,
  lit,
  show = BAR_SHOWN,
}: {
  unit: FactFamilyUnit;
  lit: "whole" | "a" | "b" | null;
  show?: BarShow;
}) {
  const reveal = show.whole;
  const whole = unit.a + unit.b;
  const barW = 1180;
  const aW = (unit.a / whole) * barW;
  const bW = barW - aW;
  const x0 = (STAGE_W - barW) / 2;
  const partY = 190;
  const H = 110;

  const piece = (
    x: number,
    w: number,
    value: number,
    colour: string,
    isLit: boolean,
    shown: number,
    key: string,
  ) => (
    <div key={key}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: partY,
          width: w,
          height: H,
          borderRadius: 12,
          backgroundColor: colour,
          opacity: (isLit ? 1 : 0.32) * shown,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: partY + 26,
          width: w,
          textAlign: "center",
          fontSize: 62,
          fontWeight: 800,
          color: "#fff",
          opacity: (isLit ? 1 : 0.55) * shown,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <>
      {/* the whole, drawn above the two parts */}
      <div
        style={{
          position: "absolute",
          left: x0,
          top: 40,
          width: barW * reveal,
          height: H,
          borderRadius: 12,
          backgroundColor: GREEN,
          opacity: lit === "whole" || lit === null ? 1 : 0.32,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x0,
          top: 66,
          width: barW,
          textAlign: "center",
          fontSize: 62,
          fontWeight: 800,
          color: "#fff",
          opacity: reveal > 0.9 ? (lit === "whole" || lit === null ? 1 : 0.55) : 0,
        }}
      >
        {whole}
      </div>
      {piece(x0, aW, unit.a, GOLD, lit === "a" || lit === null, show.a, "a")}
      {piece(x0 + aW, bW, unit.b, BLUE, lit === "b" || lit === null, show.b, "b")}
    </>
  );
}

/** Array picture: `a` rows of `b`. `lit` highlights a row or a column. */
function Grid({
  unit,
  lit,
  shownAt = () => 1,
}: {
  unit: FactFamilyUnit;
  lit: "rows" | "cols" | null;
  /** How far cell (row, col) has been revealed, 0..1 — the build scene lands
   *  the first column on "a rows" and the other columns on "b in each row". */
  shownAt?: (r: number, c: number) => number;
}) {
  const cell = 92;
  const gap = 12;
  const w = unit.b * cell + (unit.b - 1) * gap;
  const h = unit.a * cell + (unit.a - 1) * gap;
  const x0 = (STAGE_W - w) / 2;
  const y0 = (STAGE_H - h) / 2 - 20;
  return (
    <>
      {Array.from({ length: unit.a * unit.b }, (_, i) => {
        const r = Math.floor(i / unit.b);
        const c = i % unit.b;
        // Rows lit gold, columns lit blue — the two readings of one array.
        const colour = lit === "rows" ? GOLD : lit === "cols" ? BLUE : GOLD;
        const emphasis = lit === "rows" ? (r === 0 ? 1 : 0.4) : lit === "cols" ? (c === 0 ? 1 : 0.4) : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + c * (cell + gap),
              top: y0 + r * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: 12,
              backgroundColor: colour,
              opacity: emphasis * shownAt(r, c),
            }}
          />
        );
      })}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the three numbers ------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  const whole = unit.kind === "additive" ? unit.a + unit.b : unit.a * unit.b;
  // "5, 8 and 13." — each number enters on its word; the dots come with the
  // number that follows them.
  const parts = numberParts(`${unit.a} · ${unit.b} · ${whole}`, said, 6, []);
  const b = useEnter(40); // not-speech-bound: "These three belong together" names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Parts style={{ fontSize: 170, fontWeight: 800, color: INK }} parts={parts} />
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Three numbers that belong together.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build the one picture --------------------------------------
function SceneBuild({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const growAt = Math.round(dur * 0.22); // not-speech-bound: only for clips without alignment
  const whole = unit.kind === "additive" ? unit.a + unit.b : unit.a * unit.b;
  // Additive: "Here's the whole thing… 13. And it's made of two parts. 5… and
  // 8." — the whole bar grows on 13, each part lands on its number.
  // Multiplicative: "3 rows… with 4 in each row. That's 12 altogether." — the
  // first column (one cell per row) lands on 3, the other columns on 4.
  // The title reads in the same order, entering number by number.
  const wholeAt = said(whole, growAt, 0);
  const aAt = said(unit.a, growAt, 0);
  const bAt = said(unit.b, growAt, 0);
  const grow = interpolate(frame, [wholeAt, wholeAt + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const show: BarShow = { whole: grow, a: clamp01(frame, aAt, 8), b: clamp01(frame, bAt, 8) };
  // Stagger so a column is fully down within ~0.4 s (12 frames) of its word.
  const rowStep = Math.max(1, Math.min(3, Math.floor(7 / Math.max(1, unit.a - 1))));
  const colStep = Math.max(1, Math.min(3, Math.floor(6 / Math.max(1, unit.b - 2))));
  const cellAt = (r: number, c: number) =>
    c === 0 ? clamp01(frame, aAt + r * rowStep, 5) : clamp01(frame, bAt + (c - 1) * colStep + r, 5);
  const title =
    unit.kind === "additive"
      ? numberParts(`${whole} is made of ${unit.a} and ${unit.b}`, said, 4, [])
      : numberParts(`${unit.a} rows of ${unit.b} make ${whole}`, said, 4, []);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Parts style={{ fontSize: 84, fontWeight: 700, color: INK }} parts={title} />
      <Stage>
        {unit.kind === "additive" ? (
          <Bar unit={unit} lit={null} show={show} />
        ) : (
          <Grid unit={unit} lit={null} shownAt={cellAt} />
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: four questions of the same picture -------------------------
function SceneFacts({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: "Same picture, four questions" names no number
  const facts = factFamilyFacts(unit);
  const startAt = Math.round(dur * 0.12); // not-speech-bound: only for clips without alignment
  const per = Math.floor((dur - startAt - 20) / facts.length); // not-speech-bound: only for clips without alignment
  // "5 plus 8 is 13. Swap them round — 8 plus 5 is 13. … 13 take away 8 is 5.
  // And 13 take away 5 is 8." — each fact enters number by number as she reads
  // it. The multiplicative line says the product once more ("Or start from 12
  // and ask how many are in each row") before the third fact.
  const spoken: number[] = [];
  const factParts = facts.map((f, i) => {
    if (unit.kind === "multiplicative" && i === 2) spoken.push(unit.a * unit.b);
    const parts = numberParts(f.text, said, startAt + i * per, spoken);
    spoken.push(...numbersIn(f.text));
    return parts;
  });
  // A fact is the current one from its first number until the next fact's.
  const factStart = factParts.map((p) => Math.min(...p.map((x) => x.at)));
  let current = -1;
  factStart.forEach((at, i) => {
    if (frame >= at) current = i;
  });
  const active = current >= 0 ? facts[current] : null;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Same picture, four questions
      </div>
      <Stage>
        {unit.kind === "additive" ? (
          <Bar unit={unit} lit={(active?.lit as "whole" | "a" | "b") ?? null} />
        ) : (
          <Grid unit={unit} lit={(active?.lit as "rows" | "cols") ?? null} />
        )}
      </Stage>
      {/* The four facts, the current one in ink and full size. */}
      <div style={{ display: "flex", gap: 44, flexWrap: "wrap", justifyContent: "center" }}>
        {facts.map((f, i) => {
          const isCurrent = i === current;
          return (
            <Parts
              key={f.text}
              parts={factParts[i]}
              style={{
                fontSize: 66,
                fontWeight: 800,
                color: isCurrent ? INK : MUTED,
                opacity: isCurrent ? 1 : 0.42,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the family --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  // "That's the family. <tip>." names no number: the four facts and the tip
  // keep their frames.
  const title = useEnter(4); // not-speech-bound
  const facts = factFamilyFacts(unit);
  const tipAt = Math.round(dur * 0.55); // not-speech-bound: the tip names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        The whole family
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 80px" }}>
        {facts.map((f, i) => (
          <div
            key={f.text}
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: INK,
              textAlign: "center",
              // not-speech-bound: the record line reads no fact aloud
              opacity: interpolate(frame, [10 + i * 8, 10 + i * 8 + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {f.text}
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 56,
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
  facts: SceneFacts,
  record: SceneRecord,
};

export const FactFamilyVideo: React.FC<FactFamilyProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = factFamilyUnitById(unitId);
  const scenes = factFamilySceneTimings(unitId, voice);
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
        const said = saidFor(unitId, voice, scene.id);
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
