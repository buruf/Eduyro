// src/remotion/lesson/RatioTableVideo.tsx
// The RATIO TABLE template (M9): a ratio is a pair that keeps its shape.
//
// The table makes "scale both sides by the same number" literal — a new column
// appears, both rows grow together, and the picture of counters beneath grows
// in step. Unit rate is the same table run DOWNWARD until one row reads 1,
// which is exactly why "per one" is the comparable form.
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment. A ratio
// "3 : 2" is two numbers said in order, so each cell of the table lands on its
// own value; the "×2" / "÷3" arrow lands on the factor ("Times 2…"); the
// counters beneath grow to a row's count as that count is said; the record
// line enters number by number. The base column in the scale scene is CARRIED
// from the build scene, so it is on screen from frame 0. Reveals that follow a
// word rather than a number (titles, the tip) keep their frames and are marked
// `// not-speech-bound`.
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
import { ratioSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { ratioUnitById, type RatioUnit } from "./units";

export { FPS } from "./timeline";

export type RatioProps = {
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

const CARRIED = 0; // not-speech-bound: carried over from the previous scene

interface SceneProps {
  dur: number;
  unit: RatioUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `ratioLines` (script.ts) word
 *  for word: "Times 2… 6 and 4. Times 3… 9 and 6" says 6 twice, and only the
 *  second is the bottom cell of the ×3 column. */
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

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
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

/** Split a phrase like "3 to 2 is 9 to 6" into parts that appear on the frame
 *  each number is said; text between numbers appears with the number that
 *  follows it, trailing text with the number before it, and a phrase with no
 *  numbers at all on `fallback`. `spokenBefore` lists the numbers the line
 *  says ahead of the phrase, so occurrences line up. */
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

/** The headline of a scene, split so each number enters on its word. */
function Title({ parts, style }: { parts: TextPart[]; style?: React.CSSProperties }) {
  return <Parts parts={parts} style={{ fontSize: 82, fontWeight: 700, color: INK, ...style }} />;
}

const COL_W = 230;
const ROW_H = 110;
const TABLE_X = 300;
const TABLE_Y = 40;

/** The two-row table. `cols` are [top, bottom] pairs; every cell enters on its
 *  own frame (`cellAt(col, row)`) and the factor arrow before column `i` on
 *  `factorAt(i)`, so a cell lands on its value as the narrator says it. */
function Table({
  cols,
  aName,
  bName,
  cellAt,
  factorAt,
  factorLabel,
  highlightLast = false,
}: {
  cols: [number, number][];
  aName: string;
  bName: string;
  cellAt: (col: number, row: number) => number;
  factorAt: (col: number) => number;
  factorLabel: (col: number) => string;
  highlightLast?: boolean;
}) {
  const frame = useCurrentFrame();
  const fadeAt = (at: number) =>
    interpolate(frame, [at, at + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <>
      {/* row labels */}
      <div
        style={{
          position: "absolute",
          left: TABLE_X - 250,
          top: TABLE_Y + 26,
          width: 230,
          textAlign: "right",
          fontSize: 46,
          fontWeight: 700,
          color: GOLD,
        }}
      >
        {aName}
      </div>
      <div
        style={{
          position: "absolute",
          left: TABLE_X - 250,
          top: TABLE_Y + ROW_H + 26,
          width: 230,
          textAlign: "right",
          fontSize: 46,
          fontWeight: 700,
          color: BLUE,
        }}
      >
        {bName}
      </div>
      {cols.map(([a, b], i) => {
        const isLast = highlightLast && i === cols.length - 1;
        return (
          <div key={i}>
            {[a, b].map((v, r) => (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: TABLE_X + i * COL_W,
                  top: TABLE_Y + r * ROW_H,
                  width: COL_W - 12,
                  height: ROW_H - 12,
                  border: `3px solid ${LINE}`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 62,
                  fontWeight: 800,
                  color: isLast ? GREEN : r === 0 ? GOLD : BLUE,
                  backgroundColor: isLast ? "rgba(47,125,79,0.08)" : "transparent",
                  opacity: fadeAt(cellAt(i, r)),
                }}
              >
                {v}
              </div>
            ))}
            {/* Multiplier from the BASE column, not the previous one: the
                columns are ×1, ×2, ×3 of the base, so consecutive steps are
                ×2 then ×1.5 — labelling those would contradict the narration
                ("times 2… times 3") and misstate the maths. */}
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: TABLE_X + i * COL_W - 118,
                  top: TABLE_Y + ROW_H - 34,
                  width: 110,
                  textAlign: "center",
                  fontSize: 40,
                  fontWeight: 800,
                  color: GREEN,
                  opacity: fadeAt(factorAt(i)),
                }}
              >
                {factorLabel(i)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/** A row of counters grows through `stages`: it holds `count` dots from
 *  frame `at` on. Dots already on screen stay put; the new ones of a stage
 *  set off one after another from `at`, close enough together that the last
 *  is in within ~0.3 s of the word. */
type CounterStage = { count: number; at: number };

/** Counters under the table, so the table's numbers stay attached to things. */
function Counters({ a, b }: { a: CounterStage[]; b: CounterStage[] }) {
  const frame = useCurrentFrame();
  const maxA = Math.max(...a.map((s) => s.count));
  const maxB = Math.max(...b.map((s) => s.count));
  const dot = maxA + maxB > 24 ? 22 : 34;
  const gap = 8;
  const appearAt = (stages: CounterStage[], i: number) => {
    let prev = 0;
    for (const s of stages) {
      if (i < s.count) {
        const fresh = s.count - prev;
        const step = Math.min(2, 8 / Math.max(1, fresh - 1));
        return s.at + (i - prev) * step;
      }
      prev = Math.max(prev, s.count);
    }
    return Number.POSITIVE_INFINITY;
  };
  const row = (stages: CounterStage[], n: number, colour: string, y: number) =>
    Array.from({ length: n }, (_, i) => {
      const at = appearAt(stages, i);
      return (
        <div
          key={colour + i}
          style={{
            position: "absolute",
            left: TABLE_X + (i % 18) * (dot + gap),
            top: y + Math.floor(i / 18) * (dot + gap),
            width: dot,
            height: dot,
            borderRadius: "50%",
            backgroundColor: colour,
            opacity: Number.isFinite(at)
              ? interpolate(frame, [at, at + 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0,
          }}
        />
      );
    });
  return (
    <>
      {row(a, maxA, GOLD, TABLE_Y + 2 * ROW_H + 40)}
      {row(b, maxB, BLUE, TABLE_Y + 2 * ROW_H + 40 + Math.ceil(maxA / 18) * (dot + gap) + 14)}
    </>
  );
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  // "3 red to 2 blue." / "3 over 4… equals what over 12?" / "12 apples for 3
  // pounds." — each number of the big line enters on its word.
  const b = useEnter(40); // not-speech-bound: "What IS a ratio?" names no number
  const s = unit.scale ?? 3;
  const parts: TextPart[] =
    unit.mode === "unit-rate"
      ? [
          { text: `${unit.a}`, at: said(unit.a, 6) },
          { text: ` for ${unit.b}`, at: said(unit.b, 6, before(unit.b, [unit.a])) },
        ]
      : unit.mode === "proportion"
        ? [
            { text: `${unit.a}`, at: said(unit.a, 6) },
            { text: `/${unit.b}`, at: said(unit.b, 6, before(unit.b, [unit.a])) },
            { text: `  =  ?/${unit.b * s}`, at: said(unit.b * s, 6, before(unit.b * s, [unit.a, unit.b])) },
          ]
        : [
            { text: `${unit.a}`, at: said(unit.a, 6) },
            { text: ` : ${unit.b}`, at: said(unit.b, 6, before(unit.b, [unit.a])) },
          ];
  const sub =
    unit.mode === "unit-rate"
      ? "How much is that each?"
      : unit.mode === "proportion"
        ? "Fill in the missing one."
        : "What IS a ratio?";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Parts style={{ fontSize: 170, fontWeight: 800, color: INK }} parts={parts} />
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>{sub}</div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the base pair ----------------------------------------------
function SceneBuild({ dur, unit, said }: SceneProps) {
  // "Here's the pair. 3 red on the top row, 2 blue on the bottom." — the
  // headline's numbers enter on their first mention; the cells and counters
  // land on the LAST mention ("Top row 3… bottom row 4" says each twice).
  const frac = (k: number) => Math.round(dur * k); // not-speech-bound: fallback only
  const at = frac(0.2);
  const topAt = said(unit.a, at, -1);
  const bottomAt = said(unit.b, at, -1);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Title
        parts={[
          { text: `${unit.a} ${unit.aName}`, at: said(unit.a, 4, 0) },
          { text: ` to ${unit.b} ${unit.bName}`, at: said(unit.b, 4, before(unit.b, [unit.a])) },
        ]}
      />
      <Stage>
        <Table
          cols={[[unit.a, unit.b]]}
          aName={unit.aName}
          bName={unit.bName}
          cellAt={(_c, r) => (r === 0 ? topAt : bottomAt)}
          factorAt={() => 0}
          factorLabel={() => ""}
        />
        <Counters
          a={[{ count: unit.a, at: said(unit.a, at + 16, -1) }]}
          b={[{ count: unit.b, at: said(unit.b, at + 16, -1) }]}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: scale it ----------------------------------------------------
function SceneScale({ dur, unit, said }: SceneProps) {
  const frac = (k: number) => Math.round(dur * k); // not-speech-bound: fallback only
  const at = frac(0.16);

  if (unit.mode === "unit-rate") {
    // "Now scale it DOWN, until the bottom says just 1. Divide both by 3…
    // 12 divided by 3 is 4. And 3 divided by 3 is 1." — the ÷3 arrow on the
    // first "3", the top cell on "4", the bottom cell on the last "1". The
    // base column and its counters are carried from the build scene.
    const per = unit.a / unit.b;
    const divideAt = said(unit.b, at + 30, 0);
    const perAt = said(per, at + 30, before(per, [1, unit.b, unit.a, unit.b]));
    const oneAt = said(1, at + 30, -1);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Title
          parts={[
            { text: "Divide both by ", at: 4 }, // not-speech-bound: headline words ahead of the number
            { text: `${unit.b}`, at: said(unit.b, 4, 0) },
          ]}
        />
        <Stage>
          <Table
            cols={[
              [unit.a, unit.b],
              [per, 1],
            ]}
            aName={unit.aName}
            bName={unit.bName}
            cellAt={(c, r) => (c === 0 ? CARRIED : r === 0 ? perAt : oneAt)}
            factorAt={() => divideAt}
            factorLabel={() => `÷${unit.b}`}
            highlightLast
          />
          <Counters a={[{ count: unit.a, at: CARRIED }]} b={[{ count: unit.b, at: CARRIED }]} />
        </Stage>
      </AbsoluteFill>
    );
  }

  // "Now multiply BOTH rows by the same number. Times 2… 6 and 4. Times 3…
  // 9 and 6." — the arrow lands on its factor, each cell on its value, and the
  // counters grow to a row's count as it is said. Spoken order:
  // [2, a×2, b×2, s, a×s, b×s]; `earlier` keeps repeats (6 twice) straight.
  const s = unit.scale ?? 3;
  const factors = [1, 2, s];
  const steps: [number, number][] = factors.map((f) => [unit.a * f, unit.b * f]);
  const earlier: number[] = [];
  const factorAts: number[] = [CARRIED];
  const cellAts: [number, number][] = [[CARRIED, CARRIED]];
  for (let i = 1; i < factors.length; i++) {
    const f = factors[i];
    const fallback = at + i * 34;
    factorAts.push(said(f, fallback, before(f, earlier)));
    earlier.push(f);
    const topAt = said(unit.a * f, fallback, before(unit.a * f, earlier));
    earlier.push(unit.a * f);
    const bottomAt = said(unit.b * f, fallback, before(unit.b * f, earlier));
    earlier.push(unit.b * f);
    cellAts.push([topAt, bottomAt]);
  }
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Title parts={[{ text: "Multiply BOTH rows by the same number", at: 4 }]} /> {/* not-speech-bound: headline names no number */}
      <Stage>
        <Table
          cols={steps}
          aName={unit.aName}
          bName={unit.bName}
          cellAt={(c, r) => cellAts[c][r]}
          factorAt={(c) => factorAts[c]}
          factorLabel={(c) => `×${factors[c]}`}
          highlightLast
        />
        <Counters
          a={steps.map(([top], i) => ({ count: top, at: cellAts[i][0] }))}
          b={steps.map(([, bottom], i) => ({ count: bottom, at: cellAts[i][1] }))}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frac = (k: number) => Math.round(dur * k); // not-speech-bound: fallback only
  const tipAt = frac(0.55); // not-speech-bound: the tip names no number
  const s = unit.scale ?? 3;
  const per = unit.a / unit.b;
  // Numbers the record line says, in order, so the tip's occurrences line up.
  const spoken =
    unit.mode === "unit-rate" ? [per] : [unit.a, unit.b, unit.a * s, unit.b * s];
  const earlier: number[] = [];
  const next = (n: number) => {
    const f = said(n, 0, before(n, earlier));
    earlier.push(n);
    return f;
  };
  const parts: TextPart[] =
    unit.mode === "unit-rate"
      ? [
          // "So that's 4 apples per pound." — the whole line on its number.
          { text: `${per}`, at: next(per), colour: GREEN },
          { text: ` ${unit.aName} per ${unit.bName.replace(/s$/, "")}`, at: said(per, 0, 0) },
        ]
      : unit.mode === "proportion"
        ? [
            // "So 3 over 4 equals 9 over 12."
            { text: `${unit.a}`, at: next(unit.a) },
            { text: `/${unit.b}`, at: next(unit.b) },
            { text: ` = ${unit.a * s}`, at: next(unit.a * s), colour: GREEN },
            { text: `/${unit.b * s}`, at: next(unit.b * s) },
          ]
        : [
            // "3 to 2 is the same ratio as 9 to 6."
            { text: `${unit.a}`, at: next(unit.a) },
            { text: ` : ${unit.b}`, at: next(unit.b) },
            { text: ` = ${unit.a * s}`, at: next(unit.a * s), colour: GREEN },
            { text: ` : ${unit.b * s}`, at: next(unit.b * s), colour: GREEN },
          ];
  const tip = numberParts(unit.tip, said, tipAt, spoken);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title parts={[{ text: unit.mode === "unit-rate" ? "The unit rate" : "Same ratio", at: 4 }]} /> {/* not-speech-bound: headline names no number */}
      <Parts style={{ fontSize: 130, fontWeight: 800, color: INK }} parts={parts} />
      <Parts style={{ fontSize: 52, color: BLUE, fontWeight: 700 }} parts={tip} />
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  scale: SceneScale,
  record: SceneRecord,
};

export const RatioTableVideo: React.FC<RatioProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = ratioUnitById(unitId);
  const scenes = ratioSceneTimings(unitId, voice);
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
