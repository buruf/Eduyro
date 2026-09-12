// src/remotion/lesson/PlaceValueVideo.tsx
// The PLACE VALUE template (M2, Grade 1-2).
//
//   tens/ones   loose ones BUNDLE into rods of ten, so a two-digit number is
//               something you can count rather than something you decode
//   compare2d   both numbers in blocks, rods read FIRST - the method dots
//               cannot show, because "tens decide it" is about grouping
//   skip        equal hops along a number line
//   before      one step LEFT, next to the step right, so before/after are
//               directions rather than words to memorise
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment — each
// rod lands on its count, each digit on its place word, the expanded-form
// terms on their values, the hops on the numbers she hops to. Reveals that
// follow a word rather than a number ("bundle them", "LEFT", "keep hopping")
// keep their frames and are marked `// not-speech-bound`.
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
import { placeValueSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { placeValueUnitById, placeValueNumbers, type PlaceValueUnit } from "./units-placevalue";

export type PlaceValueProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const MUTED = "#8A7A5E";
const EDGE = "#8A5E10";

const STAGE_W = 1500;

interface SceneProps {
  dur: number;
  unit: PlaceValueUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `placeValueLines`
 *  (script-placevalue.ts) word for word: "4 rods and 3 ones. 38 is 3 rods"
 *  says 3 twice, and only the second is the rod count. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Frames at which `count` items appear one after another so that the LAST
 *  lands on `landAt`; the first never earlier than `floor` (the previous
 *  spoken moment) and the gap never wider than `maxGap` frames. */
const landing = (landAt: number, count: number, floor: number, maxGap = 12) => {
  const gap = count > 1 ? Math.min(maxGap, Math.max(3, (landAt - floor) / count)) : 0;
  return (i: number) => landAt - (count - 1 - i) * gap;
};

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

/** Opacity for something that appears at `at` (a short fade so a block does
 *  not pop) — 1 when `at` is undefined. */
function useFade(at?: number, durFrames = 6) {
  const frame = useCurrentFrame();
  if (at === undefined) return 1;
  return interpolate(frame, [at, at + durFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

type TitlePart = { text: string; at: number; colour?: string };

/** One piece of a headline, entering on its own frame. */
function Part({ text, at, colour }: TitlePart) {
  const enter = useEnter(at);
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", color: colour, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>
      {text}
    </span>
  );
}

/** The headline: pieces that enter as the narrator reaches them. */
function Title({ parts }: { parts: TitlePart[] }) {
  return (
    <div style={{ fontSize: 76, fontWeight: 700, color: INK, textAlign: "center" }}>
      {parts.map((p, i) => (
        <Part key={`${i}-${p.text}`} {...p} />
      ))}
    </div>
  );
}

/** A caption line made of pieces that appear on their own frames. */
function Caption({ parts, size = 52, colour }: { parts: TitlePart[]; size?: number; colour: string }) {
  return (
    <div style={{ fontSize: size, fontWeight: 800, color: colour }}>
      {parts.map((p, i) => (
        <Part key={`${i}-${p.text}`} {...p} />
      ))}
    </div>
  );
}

const UNIT = 26; // one "one" cube
// Compare stacks TWO numbers, and a rod is ten cubes tall - at full size they
// collide with each other and with the caption.
const CMP_UNIT = 16;
const GAP = 4;

/** A rod: ten unit cubes fused into a column. */
function Rod({ x, y, colour = GOLD, dim = false, unit = UNIT, at }: { x: number; y: number; colour?: string; dim?: boolean; unit?: number; at?: number }) {
  const fade = useFade(at);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: (dim ? 0.25 : 1) * fade }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            width: unit,
            height: unit,
            marginBottom: 1,
            backgroundColor: colour,
            border: `2px solid ${EDGE}`,
            borderRadius: 3,
          }}
        />
      ))}
    </div>
  );
}

/** A loose single. */
function One({ x, y, colour = BLUE, dim = false, unit = UNIT, at }: { x: number; y: number; colour?: string; dim?: boolean; unit?: number; at?: number }) {
  const fade = useFade(at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: unit,
        height: unit,
        backgroundColor: colour,
        border: `2px solid ${EDGE}`,
        borderRadius: 3,
        opacity: (dim ? 0.25 : 1) * fade,
      }}
    />
  );
}

/** Blocks for a two-digit number: `tens` rods then `ones` singles. `rodAt` /
 *  `oneAt` give each block the frame it appears on (undefined = always there). */
function Blocks({
  x,
  y,
  tens,
  ones,
  rodColour = GOLD,
  oneColour = BLUE,
  dimRods = false,
  dimOnes = false,
  rodAt,
  oneAt,
  unit = UNIT,
}: {
  x: number;
  y: number;
  tens: number;
  ones: number;
  rodColour?: string;
  oneColour?: string;
  dimRods?: boolean;
  dimOnes?: boolean;
  rodAt?: (i: number) => number;
  oneAt?: (i: number) => number;
  unit?: number;
}) {
  const rodStep = unit + 10;
  const onesX = x + tens * rodStep + 26;
  return (
    <>
      {Array.from({ length: tens }, (_, i) => (
        <Rod key={i} x={x + i * rodStep} y={y} colour={rodColour} dim={dimRods} unit={unit} at={rodAt?.(i)} />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <One
          key={`o${i}`}
          x={onesX + (i % 3) * (unit + GAP)}
          y={y + Math.floor(i / 3) * (unit + GAP)}
          colour={oneColour}
          dim={dimOnes}
          unit={unit}
          at={oneAt?.(i)}
        />
      ))}
    </>
  );
}

type Mark = { value: number; at: number; colour?: string; small?: boolean };

/** A number line with ticks, hops, and markers that appear on their frames. */
function NumberLine({
  from,
  to,
  step,
  marks = [],
  hopsShown = 0,
  labelEvery = 1,
}: {
  from: number;
  to: number;
  step: number;
  marks?: Mark[];
  hopsShown?: number;
  labelEvery?: number;
}) {
  const frame = useCurrentFrame();
  const W = 1180;
  const lx = (STAGE_W - W) / 2;
  const ly = 150;
  const span = to - from;
  const posOf = (v: number) => lx + (W * (v - from)) / span;
  const ticks: number[] = [];
  for (let v = from; v <= to; v += step) ticks.push(v);
  return (
    <>
      <div style={{ position: "absolute", left: lx, top: ly, width: W, height: 6, backgroundColor: INK, borderRadius: 3 }} />
      {ticks.map((v, i) => (
        <React.Fragment key={v}>
          <div style={{ position: "absolute", left: posOf(v) - 2, top: ly - 14, width: 4, height: 34, backgroundColor: INK }} />
          {i % labelEvery === 0 && (
            <div
              style={{
                position: "absolute",
                left: posOf(v) - 50,
                top: ly + 32,
                width: 100,
                textAlign: "center",
                fontSize: 34,
                fontWeight: 800,
                color: MUTED,
              }}
            >
              {v}
            </div>
          )}
        </React.Fragment>
      ))}
      {/* hop arcs */}
      {Array.from({ length: hopsShown }, (_, i) => {
        const a = posOf(from + step * i);
        const b = posOf(from + step * (i + 1));
        return (
          <div
            key={`h${i}`}
            style={{
              position: "absolute",
              left: a,
              top: ly - 54,
              width: b - a,
              height: 54,
              borderTop: `6px solid ${GREEN}`,
              borderLeft: `4px solid ${GREEN}`,
              borderRight: `4px solid ${GREEN}`,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
            }}
          />
        );
      })}
      {marks
        .filter((m) => frame >= m.at)
        .map((m) => {
          const colour = m.colour ?? GOLD;
          const r = m.small ? 11 : 15;
          return (
            <React.Fragment key={m.value}>
              <div
                style={{
                  position: "absolute",
                  left: posOf(m.value) - r,
                  top: ly - r + 3,
                  width: 2 * r,
                  height: 2 * r,
                  borderRadius: "50%",
                  backgroundColor: colour,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: posOf(m.value) - 90,
                  top: ly - 92,
                  width: 180,
                  textAlign: "center",
                  fontSize: m.small ? 34 : 42,
                  fontWeight: 800,
                  color: colour,
                }}
              >
                {m.value}
              </div>
            </React.Fragment>
          );
        })}
    </>
  );
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const x = placeValueNumbers(unit);
  const step = (k: number) => Math.round(dur * k); // not-speech-bound: only for reveals that follow a word, or as a fallback
  const T = x.tens;
  const O = x.ones;

  // ---- tens / ones: bundle, then read one digit --------------------------
  if (unit.mode === "tens" || unit.mode === "ones") {
    const isTens = unit.mode === "tens";
    const digitWord = isTens ? "Count the rods:" : "Count the loose ones:";
    const digit = isTens ? T : O;

    if (sceneId === "ask") {
      // "47. Two digits... What does the 4 really stand for?" — the number
      // and its blocks on the 47.
      const nAt = said(unit.n, 0, 0);
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Title parts={[{ text: `${unit.n} — what does each digit mean?`, at: said(unit.n, 4, 0) }]} />
          <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
            <Blocks x={200} y={40} tens={T} ones={O} rodAt={() => nAt} oneAt={() => nAt} />
          </div>
        </AbsoluteFill>
      );
    }

    if (sceneId === "build" && isTens) {
      // "Here are 47 ones, all loose… So bundle them: every ten ones snap
      // together into one rod." — the pile on the 47; the bundling follows
      // "bundle them", which names no number.
      const bundledAt = step(0.45); // not-speech-bound: "bundle them" is a word
      const bundled = frame > bundledAt;
      const pileAt = said(unit.n, 0, 0);
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Title parts={bundled ? [{ text: "Bundle every ten", at: bundledAt }] : [{ text: `${unit.n} loose ones`, at: said(unit.n, 4, 0) }]} />
          <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
            {!bundled ? (
              Array.from({ length: unit.n }, (_, i) => (
                <One key={i} x={120 + (i % 16) * (UNIT + GAP)} y={40 + Math.floor(i / 16) * (UNIT + GAP)} at={pileAt} />
              ))
            ) : (
              <Blocks x={200} y={40} tens={T} ones={O} rodAt={() => bundledAt} oneAt={() => bundledAt} />
            )}
          </div>
        </AbsoluteFill>
      );
    }

    if (sceneId === "build") {
      // ones: "Here is 47 in blocks: 4 rods of ten, and some loose ones
      // beside them." — rods land on the 4, the loose ones follow (their
      // count is not said here).
      const nAt = said(unit.n, 4, 0);
      const rodsFallback = step(0.45); // not-speech-bound: only for clips without alignment
      const rodsAt = said(T, rodsFallback, before(T, [unit.n]));
      const rodAt = landing(rodsAt, T, nAt);
      const onesAt = rodsAt + 12; // not-speech-bound: "some loose ones" names no number
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Title parts={[{ text: `${unit.n} in blocks`, at: nAt }]} />
          <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
            <Blocks x={200} y={40} tens={T} ones={O} rodAt={rodAt} oneAt={() => onesAt} />
          </div>
        </AbsoluteFill>
      );
    }

    if (sceneId === "action" && isTens) {
      // "Count the rods. One... two... three... 4. 4 rods, and 7 ones left
      // over" — the last rod lands on the counted 4, the earlier ones spaced
      // before it; the caption on "4 rods"; the dimmed ones brighten on
      // "7 ones".
      const rodGapFallback = Math.max(1, Math.round((dur * 0.5) / T)); // not-speech-bound: only for clips without alignment
      const countAt = said(T, step(0.15) + (T - 1) * rodGapFallback, 0);
      const rodAt = landing(countAt, T, step(0.15), 18);
      const rodsAt = said(T, 0, 1);
      const onesAt = said(O, dur, before(O, [T, T]));
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Title parts={[{ text: digitWord, at: 4 }, { text: ` ${T}`, at: said(T, 4, 0) }]} />
          <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
            <Blocks x={200} y={40} tens={T} ones={O} rodAt={rodAt} dimOnes={frame < onesAt} />
          </div>
          <Caption colour={GOLD} parts={[{ text: `${T} tens`, at: rodsAt }, { text: ` = ${x.tensValue}`, at: rodsAt }]} />
        </AbsoluteFill>
      );
    }

    if (sceneId === "action") {
      // ones: "Count only the loose ones. 7." — the caption on the 7.
      const oAt = said(O, 0, 0);
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
          <Title parts={[{ text: digitWord, at: 4 }, { text: ` ${O}`, at: said(O, 4, 0) }]} />
          <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
            <Blocks x={200} y={40} tens={T} ones={O} dimRods />
          </div>
          <Caption colour={BLUE} parts={[{ text: `${O} ones`, at: oAt }]} />
        </AbsoluteFill>
      );
    }

    // record
    // tens: "So the 4 in 47 is not 4 — it is 4 TENS, which is 40." — the
    //   caption "4 tens" on the third 4, "= 40" on the 40; the expanded form
    //   "47 =" on the 47, "40" on the 40, "+ 7" with it (7 is not said).
    // ones: "So 47 is 40 plus 7." — each term on its value.
    const nAt = said(unit.n, 0, 0);
    const tvAt = said(x.tensValue, 0, 0);
    const oAt = isTens ? tvAt : said(O, 0, 0);
    const caption: TitlePart[] = isTens
      ? [
          { text: `${T} tens`, at: said(T, 0, before(T, [T, unit.n, T])) },
          { text: ` = ${x.tensValue}`, at: tvAt },
        ]
      : [{ text: `${O} ones`, at: oAt }];
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title parts={[{ text: digitWord, at: 4 }, { text: ` ${digit}`, at: said(digit, 4, 0) }]} />
        <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
          <Blocks x={200} y={40} tens={T} ones={O} />
        </div>
        <Caption colour={isTens ? GOLD : BLUE} parts={caption} />
        <Caption
          colour={GREEN}
          size={44}
          parts={[
            { text: `${unit.n} =`, at: nAt },
            { text: ` ${x.tensValue}`, at: tvAt },
            { text: ` + ${O}`, at: oAt },
          ]}
        />
      </AbsoluteFill>
    );
  }

  // ---- compare two-digit: rods first ---------------------------------------
  if (unit.mode === "compare2d") {
    const T2 = x.tens2;
    const O2 = x.ones2;
    const focusRods = sceneId === "action" || sceneId === "record";
    const rodStep = CMP_UNIT + 10;
    // Which row has the extra rods, and how many.
    const topBigger = unit.n > x.n2;
    const extra = Math.abs(T - T2);

    let headline: TitlePart[];
    // Per-block frames (build) and digit / comparison marks (action).
    let rodAt1: ((i: number) => number) | undefined;
    let oneAt1: ((i: number) => number) | undefined;
    let rodAt2: ((i: number) => number) | undefined;
    let oneAt2: ((i: number) => number) | undefined;
    let label1At = 0;
    let label2At = 0;
    let tensMark1At = Infinity;
    let tensMark2At = Infinity;
    let diffAt = Infinity;

    if (sceneId === "ask") {
      // "Which is bigger: 43, or 38?"
      headline = [
        { text: "Which is bigger:", at: 4 }, // not-speech-bound: said before either number
        { text: ` ${unit.n}`, at: said(unit.n, 4, 0) },
        { text: ` or ${x.n2}?`, at: said(x.n2, 4, before(x.n2, [unit.n])) },
      ];
    } else if (sceneId === "build") {
      // "Build them both. 43 is 4 rods and 3 ones. 38 is 3 rods and 8 ones."
      // — each label on its number, each row's rods landing on its rod
      // count, its ones on its ones count.
      headline = [{ text: "Build them both", at: 4 }]; // not-speech-bound
      label1At = said(unit.n, 0, 0);
      const r1 = said(T, 0, before(T, [unit.n]));
      const o1 = said(O, 0, before(O, [unit.n, T]));
      label2At = said(x.n2, 0, before(x.n2, [unit.n, T, O]));
      const r2 = said(T2, 0, before(T2, [unit.n, T, O, x.n2]));
      const o2 = said(O2, 0, before(O2, [unit.n, T, O, x.n2, T2]));
      rodAt1 = landing(r1, T, label1At);
      oneAt1 = landing(o1, O, r1, 6);
      rodAt2 = landing(r2, T2, label2At);
      oneAt2 = landing(o2, O2, r2, 6);
    } else if (sceneId === "action") {
      // "Now look at the RODS first, not the ones. 4 rods against 3. That is
      // already 10 more" — the tens digits are marked on their counts, the
      // extra rods ringed on the 10.
      tensMark1At = said(T, 4, 0);
      tensMark2At = said(T2, 4, before(T2, [T]));
      diffAt = said(extra * 10, step(0.55), before(extra * 10, [T, T2])); // not-speech-bound: only for clips without alignment
      headline = [
        { text: "Rods first:", at: 4 }, // not-speech-bound: "RODS first, not the ones" names no number
        { text: ` ${T}`, at: tensMark1At },
        { text: ` against ${T2}`, at: tensMark2At },
      ];
    } else {
      // "So 43 is bigger than 38."
      headline = [{ text: `${x.bigger} is bigger`, at: said(x.bigger, 4, 0) }];
    }

    // A number label whose tens digit is marked on its frame (plain function, no hooks).
    const label = ({ n, y, at, markAt, colour }: { n: number; y: number; at: number; markAt: number; colour: string }) => {
      const tensDigit = String(n).slice(0, -1);
      const onesDigit = String(n).slice(-1);
      const marked = frame >= markAt;
      return (
        <div style={{ position: "absolute", left: 300, top: y, fontSize: 46, fontWeight: 800, color: INK, opacity: frame >= at ? 1 : 0 }}>
          <span style={{ color: marked ? colour : INK, borderBottom: marked ? `6px solid ${colour}` : "6px solid transparent" }}>{tensDigit}</span>
          <span style={{ opacity: focusRods ? 0.35 : 1 }}>{onesDigit}</span>
        </div>
      );
    };

    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Title parts={headline} />
        <div style={{ position: "relative", width: STAGE_W, height: 400 }}>
          {sceneId !== "ask" && (
            <>
              {label({ n: unit.n, y: 44, at: label1At, markAt: tensMark1At, colour: GOLD })}
              <Blocks x={400} y={0} tens={T} ones={O} dimOnes={focusRods} unit={CMP_UNIT} rodAt={rodAt1} oneAt={oneAt1} />
              {label({ n: x.n2, y: 244, at: label2At, markAt: tensMark2At, colour: GREEN })}
              <Blocks x={400} y={200} tens={T2} ones={O2} rodColour={GREEN} dimOnes={focusRods} unit={CMP_UNIT} rodAt={rodAt2} oneAt={oneAt2} />
              {extra > 0 && frame >= diffAt && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: 400 + Math.min(T, T2) * rodStep - 8,
                      top: (topBigger ? 0 : 200) - 8,
                      width: extra * rodStep + 6,
                      height: 10 * (CMP_UNIT + 1) + 14,
                      border: `4px dashed ${GREEN}`,
                      borderRadius: 10,
                    }}
                  />
                  <div style={{ position: "absolute", left: 400 + Math.max(T, T2) * rodStep + 120, top: (topBigger ? 0 : 200) + 56, fontSize: 44, fontWeight: 800, color: GREEN }}>
                    {extra * 10} more
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- skip counting: equal hops -------------------------------------------
  if (unit.mode === "skip") {
    const total = x.step * x.hops;
    const seq = x.sequence;
    const spokenCount = Math.min(5, x.hops); // the action line says the first five hops, then "keep hopping"
    let hopsShown = 0;
    let headline: TitlePart[];
    if (sceneId === "ask") {
      // "Counting by 2."
      headline = [{ text: `Counting by ${x.step}`, at: said(x.step, 4, 0) }];
    } else if (sceneId === "build") {
      // "Here is a number line, starting at 0. Each hop is exactly 2 long." —
      // one example hop on the 2.
      const hopAt = said(x.step, step(0.55), before(x.step, [0])); // not-speech-bound: only for clips without alignment
      hopsShown = frame >= hopAt ? 1 : 0;
      headline = [{ text: `Every hop is ${x.step}`, at: said(x.step, 4, before(x.step, [0])) }];
    } else if (sceneId === "action") {
      // "Off we go. 2... 4... 6... 8... 10... keep hopping." — each hop lands
      // on its number; the unspoken hops keep the pace of the last two.
      const gapFallback = Math.max(1, Math.round((dur * 0.7) / x.hops)); // not-speech-bound: only for clips without alignment
      const at: number[] = [];
      for (let i = 0; i < x.hops; i++) {
        if (i < spokenCount) at.push(said(seq[i], step(0.12) + i * gapFallback, 0));
        else at.push(at[i - 1] + Math.max(8, at[spokenCount - 1] - at[spokenCount - 2])); // not-speech-bound: "keep hopping"
      }
      hopsShown = at.filter((f) => frame >= f).length;
      headline = [{ text: seq.slice(0, hopsShown).join(", ") || "...", at: 4 }];
    } else {
      // "2, 4, 6, 8, 10, 12, 14, 16." — every hop and its number on the word.
      hopsShown = seq.filter((n) => frame >= said(n, 0, 0)).length;
      headline = [{ text: seq.slice(0, hopsShown).join(", ") || "...", at: 4 }];
    }
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title parts={headline} />
        <div style={{ position: "relative", width: STAGE_W, height: 300 }}>
          <NumberLine from={0} to={total} step={x.step} hopsShown={hopsShown} labelEvery={x.step >= 10 ? 1 : 2} />
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- before: one step left -----------------------------------------------
  {
    let headline: TitlePart[];
    let marks: Mark[];
    if (sceneId === "ask") {
      // "What number comes just BEFORE 60?" — the marker on the 60.
      headline = [
        { text: "What comes just before", at: 4 }, // not-speech-bound: said before the number
        { text: ` ${unit.n}?`, at: said(unit.n, 4, 0) },
      ];
      marks = [{ value: unit.n, at: said(unit.n, 0, 0) }];
    } else if (sceneId === "build") {
      // "Find 60 on the number line. Before means to the LEFT"
      headline = [{ text: "Before means LEFT", at: 4 }]; // not-speech-bound
      marks = [{ value: unit.n, at: said(unit.n, 0, 0) }];
    } else if (sceneId === "action") {
      // "Take one step left... and you land on 59. One step the other way…
      // would be 61" — the marker steps to 59 on the 59; a small 61 on the 61.
      const prevAt = said(x.prev, 0, 0);
      const nextAt = said(x.next, step(0.6), before(x.next, [x.prev])); // not-speech-bound: only for clips without alignment
      headline = [
        { text: "One step left →", at: 4 }, // not-speech-bound: "one step left" names no number
        { text: ` ${x.prev}`, at: said(x.prev, 4, 0) },
      ];
      marks = frame >= prevAt ? [{ value: x.prev, at: prevAt }, { value: x.next, at: nextAt, colour: MUTED, small: true }] : [{ value: unit.n, at: 0 }];
    } else {
      // "So 59 comes before 60, and 61 comes after."
      headline = [
        { text: `${x.prev},`, at: said(x.prev, 4, 0) },
        { text: ` ${unit.n},`, at: said(unit.n, 4, before(unit.n, [x.prev])) },
        { text: ` ${x.next}`, at: said(x.next, 4, before(x.next, [x.prev, unit.n])) },
      ];
      marks = [
        { value: x.prev, at: said(x.prev, 0, 0) },
        { value: unit.n, at: said(unit.n, 0, before(unit.n, [x.prev])), colour: INK, small: true },
        { value: x.next, at: said(x.next, 0, before(x.next, [x.prev, unit.n])), colour: MUTED, small: true },
      ];
    }
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title parts={headline} />
        <div style={{ position: "relative", width: STAGE_W, height: 300 }}>
          <NumberLine from={unit.n - 3} to={unit.n + 3} step={1} marks={marks} />
          {sceneId !== "ask" && (
            // not-speech-bound: "LEFT" and "smaller" are words
            <div style={{ position: "absolute", left: 0, top: 240, width: STAGE_W, display: "flex", justifyContent: "center", gap: 90 }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: GOLD }}>← smaller</span>
              <span style={{ fontSize: 38, fontWeight: 800, color: MUTED }}>bigger →</span>
            </div>
          )}
        </div>
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const PlaceValueVideo: React.FC<PlaceValueProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = placeValueUnitById(unitId);
  const scenes = placeValueSceneTimings(unitId, voice);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: "Georgia, 'Times New Roman', serif",
        scale: String(width / 1920),
      }}
    >
      {scenes.map((scene) => {
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
