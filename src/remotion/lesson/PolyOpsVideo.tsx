// src/remotion/lesson/PolyOpsVideo.tsx
// The POLYNOMIAL OPERATIONS template (M12) — the technique drills.
//
// These lessons are about MANIPULATION, not about what a polynomial is, so
// the visuals are deliberately typographic: a line of algebra that rewrites
// itself one step at a time, with the step being taught picked out in colour.
// A student watching should be able to pause on any frame and see exactly
// which piece moved and where it went.
//
//   anatomy        terms sorted by exponent, then each part named
//   evaluate       a substitution ladder, one row per step
//   subtract       the minus visibly landing on every term in the bracket
//   monomial-mult  coefficients and exponents on separate lanes, because
//                  they obey different rules
//   divide-mono    one long fraction splitting into two easy ones
//   gcf            the shared factor lifted out to the front
//
// Sync: every reveal that shows something the narrator says is timed with
// `said(n, fallback, occurrence)` from the scene's clip alignment (timeline
// `saidFor`). A term lands on its coefficient (a signed value like −2 is
// spoken "negative 2" and aligned on the 2, so lookups use the magnitude),
// a combined term on its result, a product room on its product, the quotient
// on its value. Numbers a line repeats are resolved by their position in a
// narration-order list that mirrors script-polyops.ts word for word. Reveals
// that follow no spoken number keep their frames and are marked
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
import { polyOpsSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { polyOpsUnitById, polyOpsText, monoText, polyOpsNumbers, type PolyOpsUnit } from "./units-polyops";

export type PolyOpsProps = {
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
  unit: PolyOpsUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** The frames at which a line's numbers are said, in the order the line says
 *  them (`order` mirrors `polyOpsLines` in script-polyops.ts word for word,
 *  so a repeated number resolves to the right occurrence). NaN where the
 *  clip has no alignment, so each caller can supply its own fallback. */
const spokenAt = (said: SaidFn, order: number[]) =>
  order.map((n, k) => said(n, Number.NaN, before(n, order.slice(0, k))));

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

/** 0 → 1 over ten frames from `from`. */
const fadeAt = (frame: number, from: number, len = 10) =>
  interpolate(frame, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 700,
  color: INK,
  textAlign: "center",
  maxWidth: 1600,
};

function Title({ text, at = 0 }: { text: string; at?: number }) {
  const enter = useEnter(at);
  return (
    <div style={{ ...TITLE_STYLE, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>{text}</div>
  );
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
    <div style={{ whiteSpace: "nowrap", ...style }}>
      {parts.map((p, i) => (
        <Part key={`${i}-${p.text}`} {...p} />
      ))}
    </div>
  );
}

/** One line of the working, revealed at `at` (a frame). */
function Line({
  children,
  at,
  frame,
  size = 66,
  colour = INK,
  weight = 700,
}: {
  children: React.ReactNode;
  at: number;
  frame: number;
  size?: number;
  colour?: string;
  weight?: number;
}) {
  const o = interpolate(frame, [at, at + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dy = interpolate(frame, [at, at + 12], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color: colour,
        opacity: o,
        translate: `0 ${dy}px`,
        letterSpacing: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

const LINE_STYLE = (size: number, colour: string, weight = 700): React.CSSProperties => ({
  fontSize: size,
  fontWeight: weight,
  color: colour,
  letterSpacing: 1,
});

/** A bordered card holding a term, optionally annotated underneath. The card
 *  enters at `at`; it sits dimmed while `dim`; the note fades in at `noteAt`. */
function Card({
  main,
  note,
  colour,
  at = 0,
  noteAt,
  dim = false,
}: {
  main: string;
  note?: string;
  colour: string;
  at?: number;
  noteAt?: number;
  dim?: boolean;
}) {
  const frame = useCurrentFrame();
  const enter = useEnter(at);
  return (
    <div style={{ textAlign: "center", opacity: dim ? 0.18 : enter.opacity, translate: `0 ${enter.translateY}px` }}>
      <div
        style={{
          borderRadius: 20,
          border: `5px solid ${colour}`,
          backgroundColor: "#FFF",
          padding: "26px 40px",
          fontSize: 66,
          fontWeight: 800,
          color: colour,
          minWidth: 190,
        }}
      >
        {main}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 32,
          fontWeight: 800,
          color: note ? colour : MUTED,
          height: 44,
          opacity: fadeAt(frame, noteAt ?? at),
        }}
      >
        {note ?? ""}
      </div>
    </div>
  );
}

/** The terms of a [x², x, 1] polynomial as the pieces `polyOpsText` joins,
 *  each with the number the narrator says for it — null for a bare ±x, which
 *  is spoken with no number at all. */
function termParts(c: [number, number, number]): { text: string; n: number | null }[] {
  const out: { text: string; n: number | null }[] = [];
  const push = (v: number, mag: string, n: number | null) => {
    if (!v) return;
    out.push({ text: out.length ? `${v > 0 ? " + " : " − "}${mag}` : v < 0 ? `−${mag}` : mag, n });
  };
  push(c[0], Math.abs(c[0]) === 1 ? "x²" : `${Math.abs(c[0])}x²`, Math.abs(c[0]) === 1 ? null : Math.abs(c[0]));
  push(c[1], Math.abs(c[1]) === 1 ? "x" : `${Math.abs(c[1])}x`, Math.abs(c[1]) === 1 ? null : Math.abs(c[1]));
  push(c[2], String(Math.abs(c[2])), Math.abs(c[2]));
  return out;
}

/** A polynomial as text parts entering term by term as each coefficient is
 *  said. `at` gives the frame per spoken term, in order; a bare ±x (no number
 *  spoken) enters midway between its neighbours. */
function polyParts(c: [number, number, number], at: number[], colour?: string): TextPart[] {
  const terms = termParts(c);
  let k = 0;
  const frames = terms.map((t) => (t.n === null ? Number.NaN : at[k++] ?? 0));
  return terms.map((t, i) => {
    let f = frames[i];
    if (Number.isNaN(f)) {
      // not-speech-bound: "minus x" carries no number — midway between neighbours
      const prev = frames.slice(0, i).filter((v) => !Number.isNaN(v)).pop() ?? 0;
      const next = frames.slice(i + 1).find((v) => !Number.isNaN(v)) ?? prev;
      f = Math.round((prev + next) / 2);
    }
    return { text: t.text, at: f, colour };
  });
}

/** The numbers a polynomial's terms say, in speaking order (bare ±x says none). */
const polyNumbers = (c: [number, number, number]) =>
  termParts(c).flatMap((t) => (t.n === null ? [] : [t.n]));

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const x = polyOpsNumbers(unit);
  // Hand-picked reveal points as fractions of the scene: ONLY the fallback
  // for clips without alignment, and for reveals that follow no number.
  const step = (f: number) => Math.floor(dur * f); // not-speech-bound: fallback only
  const stage = { alignItems: "center", justifyContent: "center", gap: 34 } as const;
  const NEVER = dur + 1;

  if (unit.mode === "anatomy") {
    const named = sceneId === "twist" || sceneId === "record";
    const mags = [Math.abs(x.c2), Math.abs(x.c1), Math.abs(x.c0)];
    // Narration order per line (script-polyops.ts, anatomy):
    //   ask:   "3 x squared, plus 5 x, minus 2"                  → [3, 5, 2]
    //   work:  "3 x squared carries exponent 2. 5 x … 1. … negative 2? Exponent 0 …
    //          2… then 1… then 0"                                → [3,2, 5,1, 2,0, 2,1,0]
    //   twist: "The biggest exponent, 2, … leading term, 3, … no x, negative 2"
    //                                                            → [2, 3, 2]
    const order =
      sceneId === "ask"
        ? mags
        : sceneId === "work"
          ? [mags[0], 2, mags[1], 1, mags[2], 0, 2, 1, 0]
          : sceneId === "twist"
            ? [2, mags[0], mags[2]]
            : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const terms = [
      { main: monoText(x.c2, 2), note: named ? "leading coefficient" : "exponent 2", colour: BLUE },
      { main: monoText(x.c1, 1), note: named ? "" : "exponent 1", colour: GREEN },
      { main: `${x.c0 < 0 ? "−" : ""}${Math.abs(x.c0)}`, note: named ? "constant term" : "exponent 0", colour: GOLD },
    ];
    // ask: each card lands on its coefficient. work: the cards sit dimmed and
    // light on their coefficient, the "exponent k" note on the k. twist: the
    // names land on their number ("leading term, 3"; "no x, negative 2").
    const cardAt = terms.map((_, i) => (sceneId === "ask" ? fb(i, 0) : 0));
    const litAt = terms.map((_, i) => (sceneId === "work" ? fb(i * 2, step(0.2) + i * step(0.2)) : 0));
    const noteAt = terms.map((_, i) =>
      sceneId === "work" ? fb(i * 2 + 1, litAt[i]) : sceneId === "twist" ? fb(i === 0 ? 1 : 2, 0) : cardAt[i],
    );
    const degreeAt = fb(0, 0); // twist: "the biggest exponent, 2"
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Parts style={TITLE_STYLE} parts={polyParts(unit.a, cardAt)} />
        ) : sceneId === "work" ? (
          <Title text="Standard form: biggest exponent first" /> // not-speech-bound
        ) : sceneId === "twist" ? (
          <Title text={`Degree ${x.degree}`} at={degreeAt} />
        ) : (
          <Title text={polyOpsText(unit.a)} /> // not-speech-bound: no alignment in record
        )}
        <div style={{ display: "flex", gap: 46, alignItems: "flex-start" }}>
          {terms.map((t, i) => (
            <Card
              key={i}
              main={t.main}
              note={t.note || undefined}
              colour={t.colour}
              at={cardAt[i]}
              noteAt={noteAt[i]}
              dim={sceneId === "work" && frame < litAt[i]}
            />
          ))}
        </div>
        {sceneId === "twist" && (
          <Line at={fb(0, step(0.55))} frame={frame} size={44} colour={MUTED} weight={800}>
            biggest exponent = the degree
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "evaluate") {
    // The substitution ladder. Every row is one honest step of the working.
    // Narration order per line (script-polyops.ts, evaluate):
    //   ask:    "3 x squared, plus 5 x, minus 2 … x is 2"        → [3, 5, 2, 2]
    //   work:   "Swap every x for 2 … 3 times 2 squared… plus 5 times 2… minus 2.
    //            … 2 squared is 4. … 3 times 4, which is 12"      → [2, 3,2, 5,2, 2, 2,4, 3,4, 12]
    //   twist:  "5 times 2 is 10. … 12, plus 10, minus 2… 20. … 3 times 2 … the 3"
    //                                                             → [5,2,10, 12,10,2, 20, 3,2, 3]
    //   record: "At x equals 2, this polynomial is worth 20"      → [2, 20]
    const c0 = Math.abs(x.c0);
    const order =
      sceneId === "ask"
        ? [...polyNumbers(unit.a), x.at]
        : sceneId === "work"
          ? [x.at, x.c2, x.at, x.c1, x.at, c0, x.at, x.sq, x.c2, x.sq, x.termSq]
          : sceneId === "twist"
            ? [x.c1, x.at, x.termX, x.termSq, x.termX, c0, x.value, x.c2, x.at, x.c2]
            : [x.at, x.value];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const rowFb = (i: number) => step(0.12) + i * step(0.14);
    const CARRIED = 0; // not-speech-bound: rows already on screen from the previous scene
    const rows: { parts: TextPart[]; colour: string; size?: number }[] = [
      {
        colour: INK,
        parts:
          sceneId === "ask"
            ? polyParts(unit.a, polyNumbers(unit.a).map((_, k) => fb(k, rowFb(0))))
            : [{ text: polyOpsText(unit.a), at: CARRIED }],
      },
      {
        colour: BLUE,
        parts:
          sceneId === "work"
            ? [
                { text: `${x.c2}(${x.at})²`, at: fb(1, rowFb(1)) },
                { text: ` + ${x.c1}(${x.at})`, at: fb(3, rowFb(1)) },
                { text: ` − ${c0}`, at: fb(5, rowFb(1)) },
              ]
            : [{ text: `${x.c2}(${x.at})² + ${x.c1}(${x.at}) − ${c0}`, at: CARRIED }],
      },
      {
        colour: BLUE,
        parts: [
          {
            text: `${x.c2}(${x.sq}) + ${x.c1}(${x.at}) − ${c0}`,
            at: sceneId === "work" ? fb(7, rowFb(2)) : CARRIED, // "2 squared is 4"
          },
        ],
      },
      {
        colour: GOLD,
        parts:
          sceneId === "work"
            ? [{ text: `${x.termSq}`, at: fb(10, NEVER) }] // "which is 12" — the rest comes in the twist
            : sceneId === "twist"
              ? [
                  { text: `${x.termSq}`, at: fb(3, rowFb(3)) },
                  { text: ` + ${x.termX}`, at: fb(4, rowFb(3)) },
                  { text: ` − ${c0}`, at: fb(5, rowFb(3)) },
                ]
              : [{ text: `${x.termSq} + ${x.termX} − ${c0}`, at: CARRIED }],
      },
      {
        colour: GREEN,
        size: 82,
        parts: [{ text: `= ${x.value}`, at: sceneId === "twist" ? fb(6, NEVER) : fb(1, rowFb(4)) }],
      },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 4 : 5;
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Title text={`x = ${x.at}`} at={fb(polyNumbers(unit.a).length, 0)} />
        ) : sceneId === "work" ? (
          <Title text="Swap every x — then powers first" /> // not-speech-bound
        ) : sceneId === "twist" ? (
          <Title text="Multiply, then add" /> // not-speech-bound
        ) : (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: `At x = ${x.at},`, at: fb(0, 0) },
              { text: ` the value is ${x.value}`, at: fb(1, 0) },
            ]}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {rows.slice(0, shown).map((r, i) => (
            <Parts key={i} style={LINE_STYLE(r.size ?? 62, r.colour)} parts={r.parts} />
          ))}
        </div>
        {sceneId === "twist" && (
          <Line at={fb(7, step(0.6))} frame={frame} size={40} colour={RED} weight={800}>
            the exponent belongs to the x — not to the {x.c2}
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "subtract") {
    const b: [number, number, number] = [x.b2, x.b1, x.b0];
    const flipped = sceneId === "work" || sceneId === "twist" || sceneId === "record";
    const mag = (v: number) => Math.abs(v);
    // Narration order per line (script-polyops.ts, subtract):
    //   ask:    "Take 5 x squared, plus 3 x, plus 7… and subtract 2 x squared, plus 4 x, plus 1"
    //   work:   "in front of the 2 x squared … Flip them all: minus 2 x squared, minus 4 x,
    //            minus 1. That plus 4 x became a minus"         → [b2, b2, b1, b0, b1]
    //   twist:  "5 take away 2 is 3. … 3 take away 4… negative 1. … 7 take away 1 is 6"
    //                                                           → [a, b, r] per column
    //   record: "The answer: 3 x squared, minus x, plus 6"     → the diff's spoken numbers
    const cols = [
      { label: "x²", a: x.c2, b: x.b2, r: x.diff[0], colour: BLUE },
      { label: "x", a: x.c1, b: x.b1, r: x.diff[1], colour: GREEN },
      { label: "constant", a: x.c0, b: x.b0, r: x.diff[2], colour: GOLD },
    ];
    const order =
      sceneId === "ask"
        ? [...polyNumbers(unit.a), ...polyNumbers(b)]
        : sceneId === "work"
          ? [mag(x.b2), mag(x.b2), mag(x.b1), mag(x.b0), mag(x.b1)]
          : sceneId === "twist"
            ? cols.flatMap((c) => [mag(c.a), mag(c.b), mag(c.r)])
            : polyNumbers(x.diff);
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const nA = polyNumbers(unit.a).length;
    const flipAt = fb(1, step(0.25)); // "Flip them all: minus 2 x squared…"
    const colFb = (i: number) => step(0.15) + i * step(0.22);
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "record" ? (
          <Parts style={TITLE_STYLE} parts={polyParts(x.diff, order.map((_, k) => fb(k, 0)))} />
        ) : (
          <Title
            text={
              sceneId === "ask"
                ? // The expression itself is already on the stage below; repeating it
                  // in the headline just says the same thing twice.
                  "Subtract — and watch one sign"
                : sceneId === "work"
                  ? "The minus hits EVERY term"
                  : "Now combine like terms"
            }
          /> // not-speech-bound: these titles name no number
        )}
        {sceneId === "ask" || sceneId === "work" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
            <Parts
              style={LINE_STYLE(62, INK)}
              parts={
                sceneId === "ask"
                  ? polyParts(unit.a, order.slice(0, nA).map((_, k) => fb(k, 0)))
                  : [{ text: polyOpsText(unit.a), at: 0 }] // not-speech-bound: carried from ask
              }
            />
            <div style={{ position: "relative" }}>
              {/* the bracket as asked; in the work scene it fades as the flipped terms land */}
              <div
                style={{
                  ...LINE_STYLE(62, INK),
                  whiteSpace: "nowrap",
                  // gone by the time the first flipped term lands (leaving early is fine)
                  opacity: flipped ? 1 - fadeAt(frame, flipAt - 12, 12) : 1,
                  position: flipped ? "absolute" : "relative",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                <Parts
                  style={{}}
                  parts={[
                    { text: "− ( ", at: sceneId === "ask" ? fb(nA, 0) : 0 },
                    ...polyParts(b, sceneId === "ask" ? order.slice(nA).map((_, k) => fb(nA + k, 0)) : [0, 0, 0]),
                    { text: " )", at: sceneId === "ask" ? fb(order.length - 1, 0) : 0 },
                  ]}
                />
              </div>
              {flipped && (
                <Parts
                  style={LINE_STYLE(62, RED)}
                  parts={[
                    { text: `− ${monoText(x.b2, 2)}`, at: flipAt },
                    { text: ` − ${monoText(x.b1, 1)}`, at: fb(2, step(0.25)) },
                    { text: ` − ${Math.abs(x.b0)}`, at: fb(3, step(0.25)) },
                  ]}
                />
              )}
            </div>
            {flipped && (
              <Line at={fb(1, step(0.55))} frame={frame} size={40} colour={RED} weight={800}>
                every sign inside the bracket flips
              </Line>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 60 }}>
            {cols.map((c, i) => {
              const litAt = sceneId === "record" ? 0 : fb(i * 3, colFb(i));
              const partAt = (j: number) => (sceneId === "record" ? 0 : fb(i * 3 + j, colFb(i)));
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 20,
                    border: `5px solid ${c.colour}`,
                    backgroundColor: "#FFF",
                    padding: "24px 34px",
                    textAlign: "center",
                    opacity: frame >= litAt ? 1 : 0.15,
                  }}
                >
                  <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>{c.label} terms</div>
                  <Parts
                    style={{ fontSize: 58, fontWeight: 800, color: c.colour }}
                    parts={[
                      { text: `${c.a}`, at: partAt(0) },
                      { text: ` − ${c.b}`, at: partAt(1) },
                    ]}
                  />
                  <Parts
                    style={{ fontSize: 66, fontWeight: 800, color: c.colour }}
                    parts={[{ text: `= ${c.r < 0 ? `−${Math.abs(c.r)}` : c.r}`, at: partAt(2) }]}
                  />
                </div>
              );
            })}
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "monomial-mult") {
    // Two lanes, because coefficients and exponents obey different rules and
    // conflating them is the whole error this lesson exists to prevent.
    // Narration order per line (script-polyops.ts, monomial-mult):
    //   ask:    "3 x times 4 x squared"                          → [c1, k]
    //   work:   "3 times 4, which is 12"                         → [c1, k, coef]
    //   twist:  "multiplying 3 x's in a row … 1 plus 2 is 3. The answer: 12 x cubed"
    //                                                            → [exp, 1, p, exp, coef]
    //   record: "3 times 4 is 12; 1 plus 2 is 3"                 → [c1, k, coef, 1, p, exp]
    const order =
      sceneId === "ask"
        ? [x.c1, x.k]
        : sceneId === "work"
          ? [x.c1, x.k, x.monoCoef]
          : sceneId === "twist"
            ? [x.monoExp, 1, x.p, x.monoExp, x.monoCoef]
            : [x.c1, x.k, x.monoCoef, 1, x.p, x.monoExp];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    // The coefficient lane: its numbers land on their words; the product only
    // once it has been said (the ask never says it).
    const coefLaneAt = sceneId === "work" ? fb(0, step(0.15)) : 0;
    const coefAt = sceneId === "ask" || sceneId === "work" || sceneId === "record"
      ? [fb(0, coefLaneAt), fb(1, coefLaneAt), sceneId === "ask" ? NEVER : fb(2, coefLaneAt)]
      : [0, 0, 0];
    // The exponent lane: "1 + 2" enters with the x squared it belongs to; its
    // sum is only shown once the twist has explained it.
    const expLaneAt = sceneId === "work" ? step(0.5) : 0; // not-speech-bound: "Then the x parts" names no number
    const expAt = sceneId === "record" ? [fb(3, 0), fb(4, 0), fb(5, 0)] : sceneId === "ask" ? [fb(1, 0), fb(1, 0), NEVER] : [expLaneAt, expLaneAt, NEVER];
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: monoText(x.c1, 1), at: fb(0, 0) },
              { text: ` · ${monoText(x.k, x.p)}`, at: fb(1, 0) },
            ]}
          />
        ) : sceneId === "work" ? (
          <Title text="Two different jobs" /> // not-speech-bound
        ) : sceneId === "twist" ? (
          <Title text="Why the exponents ADD" /> // not-speech-bound
        ) : (
          <Title text={monoText(x.monoCoef, x.monoExp)} at={fb(2, 0)} />
        )}
        {sceneId === "twist" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
            <Line at={0} frame={frame} size={58} colour={MUTED}>
              x · (x · x)
            </Line>
            <Line at={fb(0, step(0.3))} frame={frame} size={58} colour={BLUE}>
              = x · x · x
            </Line>
            <Parts
              style={LINE_STYLE(70, GREEN)}
              parts={[
                { text: "1", at: fb(1, step(0.55)) },
                { text: ` + ${x.p}`, at: fb(2, step(0.55)) },
                { text: ` = ${x.monoExp}`, at: fb(3, step(0.55)) },
              ]}
            />
            <Line at={fb(4, NEVER)} frame={frame} size={70} colour={GREEN}>
              = {monoText(x.monoCoef, x.monoExp)}
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 70 }}>
            <div
              style={{
                borderRadius: 20,
                border: `5px solid ${GOLD}`,
                backgroundColor: "#FFF",
                padding: "26px 42px",
                textAlign: "center",
                opacity: frame >= coefLaneAt ? 1 : 0.15,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>coefficients</div>
              <Parts
                style={{ fontSize: 62, fontWeight: 800, color: GOLD }}
                parts={[
                  { text: `${x.c1}`, at: coefAt[0] },
                  { text: ` × ${x.k}`, at: coefAt[1] },
                  { text: ` = ${x.monoCoef}`, at: coefAt[2] },
                ]}
              />
              <div style={{ fontSize: 34, fontWeight: 800, color: GOLD }}>multiply</div>
            </div>
            <div
              style={{
                borderRadius: 20,
                border: `5px solid ${BLUE}`,
                backgroundColor: "#FFF",
                padding: "26px 42px",
                textAlign: "center",
                opacity: frame >= expLaneAt ? 1 : 0.15,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>exponents</div>
              <Parts
                style={{ fontSize: 62, fontWeight: 800, color: BLUE }}
                parts={[
                  { text: "1", at: expAt[0] },
                  { text: ` + ${x.p}`, at: expAt[1] },
                  { text: ` = ${x.monoExp}`, at: expAt[2] },
                ]}
              />
              <div style={{ fontSize: 34, fontWeight: 800, color: BLUE }}>add</div>
            </div>
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "distribute-mono") {
    // The area rectangle, with the number of ROOMS driven by the bracket —
    // which is the entire point of the twist: three terms, three rooms, same
    // method.
    // Narration order per line (script-polyops.ts, distribute-mono):
    //   ask:    "5 x, bracket, x, plus 4"                             → [k, c0]
    //   work:   "Draw it 5 x tall, … x and 4. … First room: 5 x times x … that is
    //            5 x squared. Second room: 5 x times 4 is 20 x. So the answer is
    //            5 x squared plus 20 x"        → [k, c0, k, distA, k, c0, distB, distA, distB]
    //   twist:  "x squared, plus 3 x, plus 2. … 5 x cubed. Then 15 x squared. Then 10 x"
    //                                                                → [b1, b2, triA, triB, triC]
    const b = unit.b ?? [0, 0, 0];
    const tri = sceneId === "twist" || sceneId === "record";
    const c0 = Math.abs(x.c0);
    const order =
      sceneId === "ask"
        ? [x.k, c0]
        : sceneId === "work"
          ? [x.k, c0, x.k, x.distA, x.k, c0, x.distB, x.distA, x.distB]
          : sceneId === "twist"
            ? [...polyNumbers(b), x.triA, x.triB, x.triC]
            : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const roomFb = (i: number) => step(0.12) + i * step(0.2);
    const nB = polyNumbers(b).length;
    // top label / lit (room highlighted) / body (its product) frames per room
    const rooms = tri
      ? [
          { top: "x²", body: monoText(x.triA, x.p + 2), colour: BLUE, w: 300, topAt: 0, litAt: fb(nB, roomFb(0)), bodyAt: fb(nB, roomFb(0)) },
          { top: `${Math.abs(b[1])}x`, body: monoText(x.triB, x.p + 1), colour: GOLD, w: 260, topAt: fb(0, 0), litAt: fb(nB + 1, roomFb(1)), bodyAt: fb(nB + 1, roomFb(1)) },
          { top: `${Math.abs(b[2])}`, body: monoText(x.triC, x.p), colour: GREEN, w: 220, topAt: fb(1, 0), litAt: fb(nB + 2, roomFb(2)), bodyAt: fb(nB + 2, roomFb(2)) },
        ]
      : [
          {
            top: "x",
            body: monoText(x.distA, x.distAExp),
            colour: BLUE,
            w: 330,
            topAt: sceneId === "ask" ? Math.round((fb(0, 0) + fb(1, 0)) / 2) : 0, // not-speech-bound: "x" says no number
            litAt: sceneId === "work" ? fb(2, roomFb(0)) : 0, // "First room: 5 x times x"
            bodyAt: sceneId === "work" ? fb(3, roomFb(0)) : NEVER, // "that is 5 x squared"
          },
          {
            top: `${c0}`,
            body: monoText(x.distB, x.distBExp),
            colour: GOLD,
            w: 290,
            topAt: sceneId === "ask" ? fb(1, 0) : 0,
            litAt: sceneId === "work" ? fb(4, roomFb(1)) : 0, // "Second room: 5 x times 4"
            bodyAt: sceneId === "work" ? fb(6, roomFb(1)) : NEVER, // "is 20 x"
          },
        ];
    const sideAt = sceneId === "ask" ? fb(0, 0) : 0;
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: monoText(x.k, x.p), at: fb(0, 0) },
              { text: "( x", at: Math.round((fb(0, 0) + fb(1, 0)) / 2) }, // not-speech-bound: "bracket, x"
              { text: ` + ${c0} )`, at: fb(1, 0) },
            ]}
          />
        ) : (
          <Title
            text={
              sceneId === "work"
                ? "One room per term"
                : sceneId === "twist"
                  ? "Three terms — three rooms"
                  : "Nothing in the bracket gets missed"
            }
          /> // not-speech-bound: these titles name no number
        )}
        <div style={{ position: "relative", paddingLeft: 90, paddingTop: 46 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 46 + 80,
              fontSize: 46,
              fontWeight: 800,
              color: MUTED,
              opacity: fadeAt(frame, sideAt),
            }}
          >
            {monoText(x.k, x.p)}
          </div>
          <div style={{ display: "flex" }}>
            {rooms.map((r, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -46,
                    left: 0,
                    width: r.w,
                    textAlign: "center",
                    fontSize: 42,
                    fontWeight: 800,
                    color: r.colour,
                    opacity: fadeAt(frame, r.topAt),
                  }}
                >
                  {r.top}
                </div>
                <div
                  style={{
                    width: r.w,
                    height: 200,
                    border: `6px solid ${r.colour}`,
                    borderLeftWidth: i === 0 ? 6 : 3,
                    backgroundColor: "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 56,
                    fontWeight: 800,
                    color: r.colour,
                    opacity: sceneId === "ask" ? 0.12 : frame >= r.litAt ? 1 : 0.15,
                  }}
                >
                  <span style={{ opacity: fadeAt(frame, r.bodyAt) }}>{sceneId === "ask" ? "" : r.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {sceneId === "work" && (
          <Parts
            style={LINE_STYLE(58, GREEN)}
            parts={[
              { text: `= ${monoText(x.distA, x.distAExp)}`, at: fb(7, NEVER) },
              { text: ` + ${monoText(x.distB, x.distBExp)}`, at: fb(8, NEVER) },
            ]}
          />
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "long-division") {
    // Laid out as the actual bus-stop division, because recognising the
    // familiar shape is half of what makes this feel possible.
    // Narration order per line (script-polyops.ts, long-division):
    //   ask:    "x squared, plus 5 x, plus 6, divided by x plus 2"   → [c1, c0, root]
    //   work:   "x times x plus 2 is x squared plus 2 x. … 5 x take away 2 x leaves 3 x"
    //                                                                → [root, root, c1, root, after]
    //   twist:  "Bring down the 6 … gives 3 x? 3. Multiply: 3 times x plus 2 is 3 x
    //            plus 6. … x plus 2 was a factor … x plus 3"
    //                                    → [c0, after, after, after, root, after, c0, root, after]
    const order =
      sceneId === "ask"
        ? [x.c1, x.c0, x.root]
        : sceneId === "work"
          ? [x.root, x.root, x.c1, x.root, x.afterFirst]
          : sceneId === "twist"
            ? [x.c0, x.afterFirst, x.afterFirst, x.afterFirst, x.root, x.afterFirst, x.c0, x.root, x.afterFirst]
            : [];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const rowFb = (i: number) => step(0.1 + i * 0.13);
    const CARRIED = 0; // not-speech-bound: already on screen from the previous scene
    const rows: { parts: TextPart[]; colour: string; indent: number; rule?: boolean }[] = [
      {
        colour: INK,
        indent: 0,
        parts:
          sceneId === "ask"
            ? [
                { text: "x²", at: rowFb(0) }, // not-speech-bound: "x squared" says no number
                { text: ` + ${x.c1}x`, at: fb(0, rowFb(0)) },
                { text: ` + ${x.c0}`, at: fb(1, rowFb(0)) },
              ]
            : [{ text: `x² + ${x.c1}x + ${x.c0}`, at: CARRIED }],
      },
      {
        colour: RED,
        indent: 0,
        rule: true,
        // "x squared plus 2 x" — the product lands on its 2 x
        parts: [{ text: `− ( x² + ${x.root}x )`, at: sceneId === "work" ? fb(1, rowFb(1)) : sceneId === "twist" ? CARRIED : rowFb(1) }],
      },
      {
        colour: BLUE,
        indent: 90,
        parts: [
          // "leaves 3 x" in the work scene; the 6 only comes down in the twist ("Bring down the 6")
          { text: `${x.afterFirst}x`, at: sceneId === "work" ? fb(4, rowFb(2)) : sceneId === "twist" ? CARRIED : rowFb(2) },
          { text: ` + ${x.c0}`, at: sceneId === "work" ? NEVER : sceneId === "twist" ? fb(0, 0) : rowFb(2) },
        ],
      },
      {
        colour: RED,
        indent: 90,
        rule: true,
        parts: [
          { text: `− ( ${x.afterFirst}x`, at: fb(5, rowFb(3)) }, // "is 3 x plus 6"
          { text: ` + ${x.c0} )`, at: fb(6, rowFb(3)) },
        ],
      },
      { colour: GREEN, indent: 90, parts: [{ text: "0", at: rowFb(4) }] }, // not-speech-bound: "nothing left … zero" is not aligned
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : 5;
    const quotientAt = sceneId === "twist" ? fb(2, 0) : 0; // "what times x gives 3 x? 3."
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: "( x²", at: 0 }, // not-speech-bound: "x squared" says no number
              { text: ` + ${x.c1}x`, at: fb(0, 0) },
              { text: ` + ${x.c0} )`, at: fb(1, 0) },
              { text: ` ÷ ( x + ${x.root} )`, at: fb(2, 0) },
            ]}
          />
        ) : (
          <Title
            text={
              sceneId === "work"
                ? "Divide, multiply, subtract"
                : sceneId === "twist"
                  ? "Bring down, and go again"
                  : `x + ${x.afterFirst}, remainder 0`
            }
          /> // not-speech-bound: titles name no number, and record has no alignment
        )}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: MUTED, paddingTop: 66, opacity: fadeAt(frame, sceneId === "ask" ? fb(2, 0) : 0) }}>
            x + {x.root}
          </div>
          <div>
            {/* the quotient sits above the bar, as it does on paper */}
            <div style={{ fontSize: 54, fontWeight: 800, color: GREEN, paddingLeft: 26, height: 66 }}>
              {sceneId !== "ask" && (
                <Parts
                  style={{}}
                  parts={[
                    { text: "x", at: 0 }, // not-speech-bound: "So x is the first piece" says no number
                    ...(shown >= 5 ? [{ text: ` + ${x.afterFirst}`, at: quotientAt }] : []),
                  ]}
                />
              )}
            </div>
            <div style={{ borderTop: `5px solid ${INK}`, borderLeft: `5px solid ${INK}`, paddingLeft: 26, paddingTop: 10 }}>
              {rows.slice(0, shown).map((r, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: r.colour,
                    paddingLeft: r.indent,
                    borderBottom: r.rule ? `3px solid ${MUTED}` : undefined,
                    paddingBottom: r.rule ? 8 : 0,
                    marginBottom: r.rule ? 8 : 4,
                    opacity: fadeAt(frame, Math.min(...r.parts.map((p) => p.at))),
                  }}
                >
                  <Parts style={{}} parts={r.parts} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "divide-mono") {
    const div = monoText(x.k, x.p);
    // Narration order per line (script-polyops.ts, divide-mono):
    //   ask:    "6 x squared, plus 4 x, all divided by 2 x"          → [c2, c1, k]
    //   work:   "6 x squared over 2 x… PLUS 4 x over 2 x"            → [c2, k, c1, k]
    //   twist:  "6 divided by 2 is 3. … So 3 x. The second: 4 divided by 2 is 2, …
    //            leaving just 2"                          → [c2, k, divA, divA, c1, k, divB, divB]
    //   record: "The answer: 3 x plus 2"                             → [divA, divB]
    const order =
      sceneId === "ask"
        ? [x.c2, x.c1, x.k]
        : sceneId === "work"
          ? [x.c2, x.k, x.c1, x.k]
          : sceneId === "twist"
            ? [x.c2, x.k, x.divA, x.divA, x.c1, x.k, x.divB, x.divB]
            : [x.divA, x.divB];
    const at = spokenAt(said, order);
    const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
    const Frac = ({ top, bottom, bottomAt, colour, note }: { top: TextPart[]; bottom: string; bottomAt: number; colour: string; note?: TextPart[] }) => (
      <div style={{ textAlign: "center", color: colour }}>
        <Parts style={{ fontSize: 58, fontWeight: 800, padding: "0 18px" }} parts={top} />
        <div style={{ height: 6, backgroundColor: colour, borderRadius: 3, margin: "8px 0", opacity: fadeAt(frame, bottomAt) }} />
        <div style={{ fontSize: 58, fontWeight: 800, opacity: fadeAt(frame, bottomAt) }}>{bottom}</div>
        {note && <Parts style={{ fontSize: 34, fontWeight: 800, color: MUTED, marginTop: 10, height: 44 }} parts={note} />}
      </div>
    );
    const answerAt = sceneId === "twist" ? [fb(3, step(0.35)), fb(7, step(0.35))] : [fb(0, step(0.35)), fb(1, step(0.35))];
    return (
      <AbsoluteFill style={stage}>
        {sceneId === "ask" ? (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: `( ${monoText(x.c2, 2)}`, at: fb(0, 0) },
              { text: ` + ${monoText(x.c1, 1)} )`, at: fb(1, 0) },
              { text: ` ÷ ${div}`, at: fb(2, 0) },
            ]}
          />
        ) : sceneId === "record" ? (
          <Parts
            style={TITLE_STYLE}
            parts={[
              { text: monoText(x.divA, x.divAExp), at: fb(0, 0) },
              { text: ` + ${x.divB}`, at: fb(1, 0) },
            ]}
          />
        ) : (
          <Title text={sceneId === "work" ? "Split the fraction, term by term" : "Divide numbers, SUBTRACT exponents"} /> // not-speech-bound
        )}
        {sceneId === "ask" ? (
          <Frac
            top={[
              { text: monoText(x.c2, 2), at: fb(0, 0) },
              { text: ` + ${monoText(x.c1, 1)}`, at: fb(1, 0) },
            ]}
            bottom={div}
            bottomAt={fb(2, 0)}
            colour={INK}
          />
        ) : (
          <div style={{ display: "flex", gap: 44, alignItems: "flex-start" }}>
            <Frac
              top={[{ text: monoText(x.c2, 2), at: sceneId === "work" ? fb(0, 0) : 0 }]}
              bottom={div}
              bottomAt={sceneId === "work" ? fb(1, 0) : 0}
              colour={BLUE}
              note={
                sceneId === "twist" || sceneId === "record"
                  ? [
                      { text: `${x.c2}`, at: sceneId === "twist" ? fb(0, 0) : 0 },
                      { text: ` ÷ ${x.k}`, at: sceneId === "twist" ? fb(1, 0) : 0 },
                      { text: ` = ${x.divA}`, at: sceneId === "twist" ? fb(2, 0) : 0 },
                    ]
                  : undefined
              }
            />
            <div style={{ fontSize: 62, fontWeight: 800, color: MUTED, paddingTop: 10, opacity: fadeAt(frame, sceneId === "work" ? fb(2, 0) : 0) }}>+</div>
            <Frac
              top={[{ text: monoText(x.c1, 1), at: sceneId === "work" ? fb(2, 0) : 0 }]}
              bottom={div}
              bottomAt={sceneId === "work" ? fb(3, 0) : 0}
              colour={GOLD}
              note={
                sceneId === "twist" || sceneId === "record"
                  ? [
                      { text: `${x.c1}`, at: sceneId === "twist" ? fb(4, 0) : 0 },
                      { text: ` ÷ ${x.k}`, at: sceneId === "twist" ? fb(5, 0) : 0 },
                      { text: ` = ${x.divB}`, at: sceneId === "twist" ? fb(6, 0) : 0 },
                    ]
                  : undefined
              }
            />
            {(sceneId === "twist" || sceneId === "record") && (
              <>
                <div style={{ fontSize: 62, fontWeight: 800, color: MUTED, paddingTop: 10, opacity: fadeAt(frame, answerAt[0]) }}>=</div>
                <Parts
                  style={{ ...LINE_STYLE(70, GREEN), paddingTop: 8 }}
                  parts={[
                    { text: monoText(x.divA, x.divAExp), at: answerAt[0] },
                    { text: ` + ${x.divB}`, at: answerAt[1] },
                  ]}
                />
              </>
            )}
          </div>
        )}
        {sceneId === "twist" && (
          <Line at={fb(2, step(0.65)) + 12} frame={frame} size={40} colour={MUTED} weight={800}>
            {/* not-speech-bound: "Letters: x squared divided by x…" follows "is 3" */}
            x² ÷ x → 2 − 1 = 1
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // gcf — the shared factor is found from the terms, then lifted out.
  // Narration order per line (script-polyops.ts, gcf):
  //   ask:    "6 x squared, plus 9 x"                                → [c2, c1]
  //   work:   "What divides both 6 and 9? 3. … 6 x squared has an x … 9 x has an x …
  //            the greatest common factor is 3 x"                    → [c2, c1, k, c2, c1, k]
  //   twist:  "From 6 x squared, taking 3 x leaves 2 x. From 9 x, it leaves 3. So the
  //            answer is 3 x, bracket, 2 x plus 3. Check … 6 x squared plus 9 x"
  //                                        → [c2, k, gcfA, c1, gcfB, k, gcfA, gcfB, c2, c1]
  const gcf = monoText(x.k, x.p);
  const order =
    sceneId === "ask"
      ? [x.c2, x.c1]
      : sceneId === "work"
        ? [x.c2, x.c1, x.k, x.c2, x.c1, x.k]
        : sceneId === "twist"
          ? [x.c2, x.k, x.gcfA, x.c1, x.gcfB, x.k, x.gcfA, x.gcfB, x.c2, x.c1]
          : [];
  const at = spokenAt(said, order);
  const fb = (k: number, fallback: number) => (Number.isNaN(at[k] ?? Number.NaN) ? fallback : at[k]);
  const boxFb = (i: number) => step(0.15) + i * step(0.2);
  const checkAt = fb(8, step(0.65)); // twist: "multiplying back out: 6 x squared plus 9 x"
  return (
    <AbsoluteFill style={stage}>
      {sceneId === "ask" ? (
        <Parts style={TITLE_STYLE} parts={polyParts(unit.a, [fb(0, 0), fb(1, 0)])} />
      ) : (
        <Title text={sceneId === "work" ? "What do BOTH terms share?" : sceneId === "twist" ? "Lift it out to the front" : "Factored form"} /> // not-speech-bound
      )}
      {sceneId === "ask" || sceneId === "work" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
            {[
              { term: monoText(x.c2, 2), colour: BLUE, at: fb(0, sceneId === "ask" ? 0 : boxFb(0)) },
              { term: monoText(x.c1, 1), colour: GOLD, at: fb(1, sceneId === "ask" ? 0 : boxFb(1)) },
            ].map((t, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ fontSize: 62, fontWeight: 800, color: MUTED, opacity: fadeAt(frame, t.at) }}>+</div>}
                <div
                  style={{
                    borderRadius: 20,
                    border: `5px solid ${t.colour}`,
                    backgroundColor: "#FFF",
                    padding: "26px 40px",
                    fontSize: 64,
                    fontWeight: 800,
                    color: t.colour,
                    opacity: sceneId === "ask" ? fadeAt(frame, t.at) : frame >= t.at ? 1 : 0.15,
                  }}
                >
                  {t.term}
                </div>
              </React.Fragment>
            ))}
          </div>
          {sceneId === "work" && (
            <Parts
              style={LINE_STYLE(44, GREEN, 800)}
              parts={[
                { text: `numbers share ${x.k}`, at: fb(2, step(0.35)) },
                { text: `   ·   letters share x`, at: fb(4, step(0.5)) + 20 }, // not-speech-bound: follows "9 x has an x in it"
                { text: `   →   GCF = ${gcf}`, at: fb(5, step(0.65)) },
              ]}
            />
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Line at={fb(1, 0)} frame={frame} size={86} colour={GREEN}>
            {gcf}
          </Line>
          <Parts
            style={LINE_STYLE(86, INK)}
            parts={[
              { text: `( ${monoText(x.gcfA, x.gcfAExp)}`, at: fb(2, step(0.3)) },
              { text: ` + ${x.gcfB} )`, at: fb(4, step(0.3)) },
            ]}
          />
        </div>
      )}
      {sceneId === "twist" && (
        <Parts
          style={LINE_STYLE(40, MUTED, 800)}
          parts={[
            { text: "multiply back out to check: ", at: Math.max(0, checkAt - 36) }, // not-speech-bound: "Check it by multiplying back out" precedes the 6
            { text: monoText(x.c2, 2), at: checkAt },
            { text: ` + ${monoText(x.c1, 1)}  ✓`, at: fb(9, step(0.65)) },
          ]}
        />
      )}
      {sceneId === "record" && (
        <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
      )}
    </AbsoluteFill>
  );
}

export const PolyOpsVideo: React.FC<PolyOpsProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = polyOpsUnitById(unitId);
  const scenes = polyOpsSceneTimings(unitId, voice);
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
