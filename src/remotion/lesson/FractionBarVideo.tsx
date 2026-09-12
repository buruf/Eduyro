// src/remotion/lesson/FractionBarVideo.tsx
// The FRACTION BAR template (M7): one bar, cut into EQUAL parts.
//
// Four modes on one picture:
//   identify — cut, cross out an unequal cut, shade, name it
//   compare  — two same-length bars; the longer shading wins
//   add      — same-size pieces just count up; the bottom number stays
//   simplify — cuts are erased while THE SHADING NEVER MOVES, which is the
//              entire proof of 4/8 = 2/4 = 1/2 in one motion
//
// The unequal-cut counterexample is deliberate: "equal parts" is the
// load-bearing idea of fractions and the one most teaching skips past.
//
// Sync: every reveal that shows something the narrator says is timed with
// `said(n, fallback, occurrence)` from the scene's clip alignment (timeline
// `saidFor`). A fraction "3/4" is aligned on its two digits in order: the
// bar's cuts land on the denominator, its shading on the numerator, the
// comparison flag on the deciding mention, a sum on the answer. Reveals that
// follow no spoken number keep their frames and are marked
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
import { fractionBarSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { fractionBarUnitById, type FractionBarUnit } from "./units";

export { FPS } from "./timeline";

export type FractionBarProps = {
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
const EDGE = "#8A5E10";

const STAGE_W = 1500;
const STAGE_H = 520;
const BAR_W = 1200;
const BAR_H = 130;
const BAR_X = (STAGE_W - BAR_W) / 2;

interface SceneProps {
  dur: number;
  unit: FractionBarUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** The frames at which a line's numbers are said, in the order the line says
 *  them (`order` mirrors `fractionBarLines` in script.ts word for word, so a
 *  repeated digit — "4/8… a bar in 8 parts" — resolves to the right
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

/**
 * A bar cut into `parts`, with `shaded` of them filled (first `goldUpTo` in
 * gold, the rest of the shading in blue — used by the add mode to show the
 * arriving addend). `cutsShown` limits how many interior cuts are drawn, which
 * is what lets simplify ERASE cuts while the shading stays put. `cutAt(i)` and
 * `shadeAt(i)` give the frame the i-th cut / shaded part appears (absent →
 * there from the start).
 */
function Bar({
  y,
  parts,
  shaded,
  goldUpTo = Infinity,
  cutsShown = Infinity,
  cutAt,
  shadeAt,
  color = GOLD,
}: {
  y: number;
  parts: number;
  shaded: number;
  goldUpTo?: number;
  cutsShown?: number;
  cutAt?: (i: number) => number;
  shadeAt?: (i: number) => number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const cellW = BAR_W / parts;
  return (
    <>
      {/* outline */}
      <div
        style={{
          position: "absolute",
          left: BAR_X,
          top: y,
          width: BAR_W,
          height: BAR_H,
          border: `4px solid ${EDGE}`,
          borderRadius: 12,
        }}
      />
      {/* shading */}
      {Array.from({ length: shaded }, (_, i) => {
        const at = shadeAt ? shadeAt(i) : undefined;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: BAR_X + i * cellW + 4,
              top: y + 4,
              width: cellW - 8,
              height: BAR_H - 8,
              borderRadius: 8,
              backgroundColor: i < goldUpTo ? color : BLUE,
              opacity:
                at === undefined
                  ? 1
                  : interpolate(frame, [at, at + 8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
            }}
          />
        );
      })}
      {/* interior cuts */}
      {Array.from({ length: parts - 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: BAR_X + (i + 1) * cellW - 2,
            top: y,
            width: 4,
            height: BAR_H,
            backgroundColor: EDGE,
            opacity: i < cutsShown && (!cutAt || frame >= cutAt(i)) ? 1 : 0,
          }}
        />
      ))}
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

/** Big fraction, drawn as an actual stack — a child should see the BAR in it.
 *  `nAt` / `dAt` are the frames the numerator and denominator enter (the
 *  narrator says "3/4" as "three… quarters", so the two digits land
 *  separately); absent → on screen from the start. */
function Frac({
  n,
  d,
  size = 150,
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

/** A big operator sign that enters with the number after it. */
function Sign({ text, at, color = INK, size = 140 }: { text: string; at: number; color?: string; size?: number }) {
  const enter = useEnter(at);
  return (
    <span style={{ fontSize: size, fontWeight: 800, color, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>
      {text}
    </span>
  );
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  const b = useEnter(40); // not-speech-bound: the question names no number
  const n2 = unit.n2 ?? 1;
  const d2 = unit.d2 ?? 2;
  // "What does 3/4 mean?" / "Which is bigger… 3/4, or 2/3?" / "3/8 plus 2/8"
  // / "4/8… can we say that more simply?" — each digit lands on its word.
  const order =
    unit.mode === "compare"
      ? [unit.n, unit.d, n2, d2]
      : unit.mode === "add"
        ? [unit.n, unit.d, n2, unit.d]
        : [unit.n, unit.d];
  const at = spokenAt(said, order, 6);
  const ask =
    unit.mode === "compare"
      ? "Which is bigger?"
      : unit.mode === "add"
        ? "Adding fractions"
        : unit.mode === "simplify"
          ? "Say it more simply"
          : "What does this mean?";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <Frac n={unit.n} d={unit.d} size={220} nAt={at[0]} dAt={at[1]} />
        {unit.mode === "compare" && (
          <>
            <Sign text="vs" at={at[2]} color={MUTED} size={120} />
            <Frac n={n2} d={d2} size={220} nAt={at[2]} dAt={at[3]} />
          </>
        )}
        {unit.mode === "add" && (
          <>
            <Sign text="+" at={at[2]} />
            <Frac n={n2} d={unit.d} size={220} nAt={at[2]} dAt={at[3]} />
          </>
        )}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {ask}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the parts ---------------------------------------------------
function SceneParts({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: the count in the title enters on its word below
  const cutAt = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const cutStagger = 10;
  const wrongAt = Math.round(dur * 0.62); // not-speech-bound: "if the parts aren't equal" names no number
  const titleStyle: React.CSSProperties = { fontSize: 84, fontWeight: 700, color: INK };

  if (unit.mode === "compare") {
    const n2 = unit.n2 ?? 1;
    const d2 = unit.d2 ?? 2;
    const shadeAt = Math.round(dur * 0.3); // not-speech-bound: only for clips without alignment
    // "Cut the first into 4… and shade 3. Cut the second into 3… and shade 2."
    // — each bar's last cut lands on its denominator, its last shaded part on
    // its numerator.
    const at = spokenAt(said, [unit.d, unit.n, d2, n2], Number.NaN);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
    const cutsA = stagger(fb(0, cutAt + (unit.d - 1) * cutStagger), unit.d - 1, cutStagger);
    const shadeA = stagger(fb(1, shadeAt + (unit.n - 1) * 8), unit.n, 8);
    const cutsB = stagger(fb(2, cutAt + (d2 - 1) * cutStagger), d2 - 1, cutStagger);
    const shadeB = stagger(fb(3, shadeAt + 40 + (n2 - 1) * 8), n2, 8);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text="Two bars, the same length" enter={title} />
        <Stage>
          <Bar y={70} parts={unit.d} shaded={unit.n} cutAt={cutsA} shadeAt={shadeA} />
          <Bar y={300} parts={d2} shaded={n2} cutAt={cutsB} shadeAt={shadeB} color={BLUE} goldUpTo={0} />
        </Stage>
      </AbsoluteFill>
    );
  }

  // identify: "Cut it into 4 parts" — the last cut lands on "4".
  // add:      "a bar cut into 8 equal parts, with 3 shaded" — cuts on "8",
  //           shading on "3".
  // simplify: "Here's 4/8 — a bar in 8 parts, 4 shaded" — cuts on the first
  //           "8", the title's 8 on the second, shading on the second "4".
  const order =
    unit.mode === "identify" ? [unit.d] : unit.mode === "add" ? [unit.d, unit.n] : [unit.n, unit.d, unit.d, unit.n];
  const at = spokenAt(said, order, Number.NaN);
  const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
  const cutsLandFallback = cutAt + (unit.d - 1) * cutStagger;
  const cuts = stagger(
    unit.mode === "identify" ? fb(0, cutsLandFallback) : unit.mode === "add" ? fb(0, cutsLandFallback) : fb(1, cutsLandFallback),
    unit.d - 1,
    cutStagger,
  );
  const shadeFallback = Math.round(dur * 0.5) + (unit.n - 1) * 8; // not-speech-bound: only for clips without alignment
  const shade = stagger(unit.mode === "add" ? fb(1, shadeFallback) : fb(3, shadeFallback), unit.n, 8);
  const titleCountAt = unit.mode === "identify" ? fb(0, 4) : unit.mode === "add" ? fb(0, 4) : fb(2, 4);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      {unit.mode === "identify" ? (
        <Parts
          style={titleStyle}
          parts={[
            { text: "Cut it into ", at: 4 }, // not-speech-bound: said before the number
            { text: `${unit.d} EQUAL parts`, at: titleCountAt },
          ]}
        />
      ) : (
        <Parts
          style={titleStyle}
          parts={[
            { text: "A bar in ", at: 4 }, // not-speech-bound: said before the number
            { text: `${unit.d} equal parts`, at: titleCountAt },
          ]}
        />
      )}
      <Stage>
        <Bar
          y={60}
          parts={unit.d}
          shaded={unit.mode === "identify" ? 0 : unit.n}
          cutAt={cuts}
          shadeAt={unit.mode === "identify" ? undefined : shade}
        />
        {/* The counterexample: unequal parts crossed out. not-speech-bound */}
        {unit.mode === "identify" && frame >= wrongAt && (
          <>
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 300,
                width: BAR_W,
                height: BAR_H,
                border: `4px solid ${EDGE}`,
                borderRadius: 12,
                opacity: 0.75,
              }}
            />
            {[0.15, 0.35, 0.85].map((f) => (
              <div
                key={f}
                style={{
                  position: "absolute",
                  left: BAR_X + f * BAR_W,
                  top: 300,
                  width: 4,
                  height: BAR_H,
                  backgroundColor: EDGE,
                  opacity: 0.75,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: BAR_X,
                top: 296,
                width: BAR_W,
                textAlign: "center",
                fontSize: 96,
                fontWeight: 800,
                color: RED,
                opacity: interpolate(frame, [wrongAt + 12, wrongAt + 26], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              ✗ not equal parts
            </div>
          </>
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the action --------------------------------------------------
function SceneAction({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: titles whose number enters on its word are split below
  const titleStyle: React.CSSProperties = { fontSize: 84, fontWeight: 700, color: INK };

  if (unit.mode === "identify") {
    const shadeAt = Math.round(dur * 0.25); // not-speech-bound: only for clips without alignment
    // "Now shade 3 of them. One… two… three. 3 out of 4." — the title's 3 on
    // the first "3"; the counted words carry no digits, so the parts are
    // spread so the LAST lands on the second "3" ("3 out of 4"); "of 4" on "4".
    const at = spokenAt(said, [unit.n, unit.n, unit.d], Number.NaN);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
    const shade = stagger(fb(1, shadeAt + (unit.n - 1) * 26), unit.n, 26);
    const shadedSoFar = Array.from({ length: unit.n }, (_, i) => shade(i)).filter((f) => frame >= f).length;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Parts
          style={titleStyle}
          parts={[
            { text: "Shade ", at: 4 }, // not-speech-bound: said before the number
            { text: `${unit.n} of them`, at: fb(0, 4) },
          ]}
        />
        <Stage>
          <Bar y={130} parts={unit.d} shaded={unit.n} shadeAt={shade} />
        </Stage>
        <Parts
          style={{ fontSize: 64, fontWeight: 800, color: GOLD }}
          parts={[
            { text: `${shadedSoFar}`, at: shade(0) }, // counts with the shading above
            { text: ` of ${unit.d}`, at: fb(2, 0) },
          ]}
        />
      </AbsoluteFill>
    );
  }

  if (unit.mode === "compare") {
    const markAt = Math.round(dur * 0.4); // not-speech-bound: "where the shading ends" names no number
    // "The top bar reaches further. 3/4 is bigger." — the winner flag lands
    // on the deciding mention, the numerator of the bigger fraction.
    const flagAt = said(unit.n, markAt + 10);
    const aEnd = BAR_X + (unit.n / unit.d) * BAR_W;
    const bEnd = BAR_X + ((unit.n2 ?? 1) / (unit.d2 ?? 2)) * BAR_W;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text="Where does the shading end?" enter={title} />
        <Stage>
          <Bar y={70} parts={unit.d} shaded={unit.n} />
          <Bar y={300} parts={unit.d2 ?? 2} shaded={unit.n2 ?? 1} color={BLUE} goldUpTo={0} />
          {/* drop lines from each shading edge (not-speech-bound), then the winner flag */}
          {frame >= markAt && (
            <>
              <div style={{ position: "absolute", left: aEnd - 3, top: 50, width: 6, height: 400, backgroundColor: GREEN, opacity: 0.85 }} />
              <div style={{ position: "absolute", left: bEnd - 3, top: 280, width: 6, height: 170, backgroundColor: MUTED, opacity: 0.6 }} />
            </>
          )}
          <div
            style={{
              position: "absolute",
              left: Math.min(aEnd + 24, STAGE_W - 320),
              top: 96,
              fontSize: 60,
              fontWeight: 800,
              color: GREEN,
              opacity: interpolate(frame, [flagAt, flagAt + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            further →
          </div>
        </Stage>
      </AbsoluteFill>
    );
  }

  if (unit.mode === "add") {
    const addAt = Math.round(dur * 0.3); // not-speech-bound: only for clips without alignment
    const n2 = unit.n2 ?? 0;
    const total = unit.n + n2;
    // "Now add 2 more parts… watch them slide in. Count the shading: 5 parts."
    // — the title's 2 on "2"; the new parts slide in one by one so the LAST
    // lands on the total "5".
    const at = spokenAt(said, [n2, total], Number.NaN);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
    const arrive = stagger(fb(1, addAt + (n2 - 1) * 24), n2, 24);
    const arrived = Array.from({ length: n2 }, (_, i) => arrive(i)).filter((f) => frame >= f).length;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Parts
          style={titleStyle}
          parts={[
            { text: "Add ", at: 4 }, // not-speech-bound: said before the number
            { text: `${n2} more`, at: fb(0, 4) },
          ]}
        />
        <Stage>
          <Bar
            y={130}
            parts={unit.d}
            shaded={unit.n + arrived}
            goldUpTo={unit.n}
            shadeAt={(i) => (i < unit.n ? 0 : arrive(i - unit.n))}
          />
        </Stage>
        <div style={{ fontSize: 64, fontWeight: 800, color: INK }}>
          {unit.n + arrived} of {unit.d} shaded
          {unit.n + arrived === total ? "" : "…"}
        </div>
      </AbsoluteFill>
    );
  }

  // simplify: cuts erased in stages, shading untouched.
  // "Erase every second cut… now it's 2 out of 4. Erase again… 1 out of 2."
  // — each erase lands on the numerator it produces, and the equation grows
  // one fraction at a time as she names it.
  const at = spokenAt(said, [unit.n / 2, unit.d / 2, unit.n / 4, unit.d / 4], Number.NaN);
  const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
  const stage1At = fb(0, Math.round(dur * 0.3)); // not-speech-bound: fallback only — 8 parts -> 4
  const stage2At = fb(2, Math.round(dur * 0.68)); // not-speech-bound: fallback only — 4 parts -> 2
  const stage = frame >= stage2At ? 2 : frame >= stage1At ? 1 : 0;
  const parts = stage === 0 ? unit.d : stage === 1 ? unit.d / 2 : unit.d / 4;
  const shaded = stage === 0 ? unit.n : stage === 1 ? unit.n / 2 : unit.n / 4;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Title text="Watch the shading — erase the cuts" enter={title} />
      <Stage>
        <Bar y={130} parts={parts} shaded={shaded} />
      </Stage>
      <div style={{ fontSize: 64, fontWeight: 800, color: INK, display: "flex", gap: 22, alignItems: "center" }}>
        <Frac n={unit.n} d={unit.d} size={86} color={stage === 0 ? INK : MUTED} />
        <Sign text="=" at={fb(0, 0)} color={MUTED} size={64} />
        <Frac n={unit.n / 2} d={unit.d / 2} size={86} color={stage === 1 ? INK : MUTED} nAt={fb(0, 0)} dAt={fb(1, 0)} />
        <Sign text="=" at={fb(2, 0)} color={MUTED} size={64} />
        <Frac n={unit.n / 4} d={unit.d / 4} size={86} color={stage === 2 ? INK : MUTED} nAt={fb(2, 0)} dAt={fb(3, 0)} />
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: "The fraction" names no number
  const tipAt = Math.round(dur * 0.55); // not-speech-bound: no tip names a number
  const n2 = unit.n2 ?? 1;
  const d2 = unit.d2 ?? 2;
  const total = unit.n + (unit.n2 ?? 0);
  // Every record line reads its fractions digit by digit, in this order:
  //   compare  "So 3/4 is greater than 2/3"     → n d n2 d2
  //   add      "3/8 plus 2/8 is 5/8"            → n d n2 d total d
  //   simplify "4/8, 2/4 and 1/2 are the SAME"  → n d n/2 d/2 n/4 d/4
  //   identify names no digits (fallback 4, as before)
  const order =
    unit.mode === "compare"
      ? [unit.n, unit.d, n2, d2]
      : unit.mode === "add"
        ? [unit.n, unit.d, n2, unit.d, total, unit.d]
        : unit.mode === "simplify"
          ? [unit.n, unit.d, unit.n / 2, unit.d / 2, unit.n / 4, unit.d / 4]
          : [unit.n, unit.d];
  const at = spokenAt(said, order, 4);
  const main =
    unit.mode === "compare" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <Frac n={unit.n} d={unit.d} size={190} nAt={at[0]} dAt={at[1]} />
        <Sign text=">" at={at[2]} color={GREEN} />
        <Frac n={n2} d={d2} size={190} nAt={at[2]} dAt={at[3]} />
      </div>
    ) : unit.mode === "add" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Frac n={unit.n} d={unit.d} size={170} nAt={at[0]} dAt={at[1]} />
        <Sign text="+" at={at[2]} size={120} />
        <Frac n={n2} d={unit.d} size={170} nAt={at[2]} dAt={at[3]} />
        <Sign text="=" at={at[4]} size={120} />
        <Frac n={total} d={unit.d} size={170} color={GREEN} nAt={at[4]} dAt={at[5]} />
      </div>
    ) : unit.mode === "simplify" ? (
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <Frac n={unit.n} d={unit.d} size={170} nAt={at[0]} dAt={at[1]} />
        <Sign text="=" at={at[2]} size={120} />
        <Frac n={unit.n / 2} d={unit.d / 2} size={170} nAt={at[2]} dAt={at[3]} />
        <Sign text="=" at={at[4]} size={120} />
        <Frac n={unit.n / 4} d={unit.d / 4} size={170} color={GREEN} nAt={at[4]} dAt={at[5]} />
      </div>
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <Frac n={unit.n} d={unit.d} size={230} nAt={at[0]} dAt={at[1]} />
        <div style={{ textAlign: "left", fontSize: 52, fontWeight: 700, color: MUTED, lineHeight: 1.5 }}>
          <div>
            <span style={{ color: GOLD }}>top</span> — shaded parts
          </div>
          <div>
            <span style={{ color: EDGE }}>bottom</span> — equal parts
          </div>
        </div>
      </div>
    );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 46 }}>
      <Title text="The fraction" enter={title} />
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
  parts: SceneParts,
  action: SceneAction,
  record: SceneRecord,
};

export const FractionBarVideo: React.FC<FractionBarProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = fractionBarUnitById(unitId);
  const scenes = fractionBarSceneTimings(unitId, voice);
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
