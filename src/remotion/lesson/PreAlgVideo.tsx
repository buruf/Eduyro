// src/remotion/lesson/PreAlgVideo.tsx
// The PRE-ALGEBRA template (M10, Grade 6-7) — a child's first letter.
//
// Everything here leans on ONE idea: x is a container, and algebra is what
// you do to containers. So x is drawn as an actual box with a value that can
// be poured into it, boxes get counted for like terms, a rectangle makes
// distribution impossible to under-count, a balance makes "do it to both
// sides" visible, and integers walk a number line where the signs are
// directions rather than decorations.
//
// SYNC (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` — the scene-local frame of that word in
// the recording (timeline.ts `saidFor`) — instead of a hand-picked fraction of
// the scene. Negatives are aligned as their absolute value ("negative 5" is a
// 5 in the alignment), so the integer walk asks for `Math.abs(v)`. Reveals
// that follow no spoken number, and carried-over visuals that are already on
// screen when the scene starts, are marked `// not-speech-bound`.
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
import { preAlgSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { preAlgUnitById, preAlgNumbers, type PreAlgUnit } from "./units-prealg";

export type PreAlgProps = {
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

const STAGE_W = 1500;

/** Already on screen when the scene starts — the picture carried over from the
 *  scene before, so there is no word for it to wait for. */
const CARRIED = 0; // not-speech-bound
/** Never in this scene. */
const NEVER = Number.MAX_SAFE_INTEGER;

interface SceneProps {
  dur: number;
  unit: PreAlgUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`). */
  said: SaidFn;
}

/** How many times `n` has already been spoken, so repeats line up. */
function before(n: number, earlier: number[]): number {
  return earlier.filter((v) => v === n).length;
}

function enterAt(frame: number, atFrame: number, durFrames = 14) {
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

/** Fade a piece of the picture in on the frame its number is said. */
function Appear({
  at,
  frame,
  children,
  style,
  from = 0,
}: {
  at: number;
  frame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** opacity before the word (dimmed-but-present rather than absent) */
  from?: number;
}) {
  const o = interpolate(frame, [at, at + 10], [from, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity: o, ...style }}>{children}</div>;
}

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 64,
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

function Line({
  children,
  at,
  frame,
  size = 62,
  colour = INK,
  weight = 800,
}: {
  children: React.ReactNode;
  at: number;
  frame: number;
  size?: number;
  colour?: string;
  weight?: number;
}) {
  const o = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dy = interpolate(frame, [at, at + 12], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div style={{ fontSize: size, fontWeight: weight, color: colour, opacity: o, translate: `0 ${dy}px`, whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

/** The x-box: a container that either shows the letter or the value inside. */
function XBox({ value, size = 118, colour = BLUE }: { value?: number | string; size?: number; colour?: string }) {
  const filled = value !== undefined;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        border: `6px solid ${colour}`,
        backgroundColor: filled ? colour : "#FFF",
        color: filled ? "#FFF" : colour,
        fontSize: size * 0.5,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontStyle: filled ? "normal" : "italic",
      }}
    >
      {filled ? value : "x"}
    </div>
  );
}

/** A number line from `from` to `to`, with a walker and its trail. */
function IntegerLine({ from, to, at, start }: { from: number; to: number; at: number; start: number }) {
  const W = 1240;
  const lx = (STAGE_W - W) / 2;
  const ly = 170;
  const posOf = (v: number) => lx + (W * (v - from)) / (to - from);
  const ticks: number[] = [];
  for (let v = from; v <= to; v++) ticks.push(v);
  const lo = Math.min(start, at);
  const hi = Math.max(start, at);
  return (
    <>
      {/* the walk so far */}
      {hi > lo && (
        <div
          style={{
            position: "absolute",
            left: posOf(lo),
            top: ly - 8,
            width: posOf(hi) - posOf(lo),
            height: 20,
            backgroundColor: GREEN,
            opacity: 0.28,
            borderRadius: 10,
          }}
        />
      )}
      <div style={{ position: "absolute", left: lx, top: ly, width: W, height: 6, backgroundColor: INK, borderRadius: 3 }} />
      {ticks.map((v) => (
        <React.Fragment key={v}>
          <div
            style={{
              position: "absolute",
              left: posOf(v) - 2,
              top: ly - (v === 0 ? 22 : 13),
              width: 4,
              height: v === 0 ? 50 : 32,
              backgroundColor: v === 0 ? GOLD : INK,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: posOf(v) - 50,
              top: ly + 34,
              width: 100,
              textAlign: "center",
              fontSize: 30,
              fontWeight: 800,
              color: v === 0 ? GOLD : MUTED,
            }}
          >
            {v}
          </div>
        </React.Fragment>
      ))}
      {/* the walker */}
      <div
        style={{
          position: "absolute",
          left: posOf(at) - 17,
          top: ly - 14,
          width: 34,
          height: 34,
          borderRadius: "50%",
          backgroundColor: GREEN,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: posOf(at) - 90,
          top: ly - 92,
          width: 180,
          textAlign: "center",
          fontSize: 46,
          fontWeight: 800,
          color: GREEN,
        }}
      >
        {at}
      </div>
    </>
  );
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const frame = useCurrentFrame();
  const x = preAlgNumbers(unit);
  const step = (f: number) => Math.floor(dur * f); // fallback frames only, for clips without word alignment
  const stage = { alignItems: "center", justifyContent: "center", gap: 38 } as const;
  const tip = (
    <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500 }}>{unit.tip}</div>
  );

  if (unit.mode === "evaluate-add") {
    // The same rule, run twice with different x, side by side in the twist —
    // that comparison IS the lesson.
    const headline =
      sceneId === "ask"
        ? "A rule, not an answer"
        : sceneId === "work"
          ? `x = ${x.at}`
          : sceneId === "twist"
            ? "Change x, and the answer moves"
            : "Substitute, then work it out";
    // "x is 4" — the value pours into the box on the word. In the recap the
    // filled box is carried from the work scene (the line is about a MINUS).
    const fillAt = sceneId === "work" ? said(x.at, CARRIED, 0) : CARRIED;
    // "x plus 7" — the constant.
    const addAt = sceneId === "ask" || sceneId === "work" ? said(x.a, CARRIED, 0) : CARRIED;
    const sumFallback = step(0.45); // not-speech-bound: fallback only
    const sumAt = said(x.sum, sumFallback, -1);
    // The recap line is about a MINUS: "x minus 7, when x is 10, is 3". It used
    // to be narrated over the carried addition (x + 7 = 11), so the picture
    // contradicted the words. Show the minus the line actually describes, each
    // part landing on its own number in narration order (b, then x, then the
    // answer).
    const minus = sceneId === "record";
    const boxValue = minus ? x.minusAt : x.at;
    const boxAt = minus ? said(x.minusAt, step(0.3), 0) : sceneId === "ask" ? CARRIED : fillAt;
    const opAt = minus ? said(x.b, CARRIED, 0) : addAt;
    const resultAt = minus ? said(x.difference, step(0.55), 0) : sumAt;
    // twist: the second column arrives on "say x is 10"; the first is carried.
    const secondAt = said(x.at2, step(0.35), 0);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enterAt(frame, sceneId === "work" ? fillAt : CARRIED)} />
        {sceneId === "twist" ? (
          <div style={{ display: "flex", gap: 110 }}>
            {[
              { v: x.at, r: x.sum, c: BLUE, at: CARRIED },
              { v: x.at2, r: x.sum2, c: GOLD, at: secondAt },
            ].map((c, i) => (
              <Appear key={i} at={c.at} frame={frame} from={i === 0 ? 1 : 0.15} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: MUTED }}>x = {c.v}</div>
                <div style={{ fontSize: 66, fontWeight: 800, color: c.c, marginTop: 12 }}>
                  {c.v} + {x.a}
                </div>
                <div style={{ fontSize: 80, fontWeight: 800, color: c.c }}>= {c.r}</div>
              </Appear>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Appear at={boxAt} frame={frame}>
              <XBox value={sceneId === "ask" ? undefined : boxValue} />
            </Appear>
            <Line at={opAt} frame={frame} size={76}>
              {minus ? "−" : "+"} {minus ? x.b : x.a}
            </Line>
            {sceneId !== "ask" && (
              <>
                <Line at={resultAt} frame={frame} size={76} colour={MUTED}>
                  =
                </Line>
                <Line at={resultAt} frame={frame} size={90} colour={GREEN}>
                  {minus ? x.difference : x.sum}
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "ask" && (
          <Line at={step(0.5)} frame={frame} size={40} colour={MUTED}>
            {/* not-speech-bound: "there is nothing to work out" names no number */}
            nothing to work out until x has a value
          </Line>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "evaluate-mul") {
    const groups = Array.from({ length: x.a }, (_, i) => i);
    const headline =
      sceneId === "ask"
        ? `${x.a}x`
        : sceneId === "work"
          ? `${x.a}x means ${x.a} × x`
          : sceneId === "twist"
            ? `x = ${x.at}`
            : `${x.a}x, when x is ${x.at}, is ${x.product}`;
    // work: the three readings, each on its own "3".
    const wrong1At = said(x.a, CARRIED, 0);
    const wrong2At = said(x.a, step(0.3), 1);
    const rightAt = said(x.a, step(0.55), 2);
    // twist: "count them: 4... 8... 12" — a group lands on its running total.
    // The total is said LAST in the line (the coefficient is announced first),
    // so ask for the final occurrence.
    const groupAt = (i: number) => {
      if (sceneId === "twist") return said(x.at * (i + 1), step(0.15) + i * step(0.2), -1);
      if (sceneId === "record") return said(x.at, CARRIED, 0);
      return CARRIED; // not-speech-bound: the boxes are the subject of ask/work
    };
    const productAt = said(x.product, step(0.6), -1);
    const titleAt =
      sceneId === "ask"
        ? said(x.a, CARRIED, 0)
        : sceneId === "work"
          ? said(x.a, CARRIED, 0)
          : sceneId === "twist"
            ? said(x.at, CARRIED, 0)
            : said(x.a, CARRIED, 0);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enterAt(frame, titleAt)} />
        {sceneId === "work" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
            <Line at={wrong1At} frame={frame} size={56} colour={RED}>
              not {x.a} next to x
            </Line>
            <Line at={wrong2At} frame={frame} size={56} colour={RED}>
              not {x.a} + x
            </Line>
            <Line at={rightAt} frame={frame} size={76} colour={GREEN}>
              {x.a} × x
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
            {groups.map((i) => (
              <Appear key={i} at={groupAt(i)} frame={frame} from={sceneId === "twist" ? 0.14 : 0}>
                <XBox value={sceneId === "ask" ? undefined : x.at} colour={GOLD} />
              </Appear>
            ))}
            {sceneId !== "ask" && (
              <>
                <Line at={productAt} frame={frame} size={70} colour={MUTED}>
                  =
                </Line>
                <Line at={productAt} frame={frame} size={92} colour={GREEN}>
                  {x.product}
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "like-terms") {
    const headline =
      sceneId === "ask"
        ? `${x.a}x + ${x.b}x`
        : sceneId === "work"
          ? "Count the boxes"
          : sceneId === "twist"
            ? `${x.a}x + ${x.b} — different things`
            : `${x.a}x + ${x.b}x = ${x.combined}x`;
    // ask: "3 x plus 2 x"; work: "3 x is 3 BOXES … 2 x is 2 BOXES" (the second
    // mention is the one the boxes illustrate); twist: "3 x plus 2".
    const blueAt =
      sceneId === "work" ? said(x.a, CARRIED, 1) : sceneId === "record" ? CARRIED : said(x.a, CARRIED, 0);
    const greenAt =
      sceneId === "work" ? said(x.b, CARRIED, 1) : sceneId === "record" ? CARRIED : said(x.b, CARRIED, 0);
    const combinedAt = said(x.combined, step(0.5), -1);
    const titleAt = sceneId === "work" || sceneId === "record" ? CARRIED : said(x.a, CARRIED, 0);
    const Boxes = ({ n, colour, at }: { n: number; colour: string; at: number }) => (
      <Appear at={at} frame={frame} style={{ display: "flex", gap: 14 }} from={0.15}>
        {Array.from({ length: n }, (_, i) => (
          <XBox key={i} size={92} colour={colour} />
        ))}
      </Appear>
    );
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enterAt(frame, titleAt)} />
        {sceneId === "twist" ? (
          <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
            <Boxes n={x.a} colour={BLUE} at={blueAt} />
            <div style={{ fontSize: 66, fontWeight: 800, color: MUTED }}>+</div>
            <Appear at={greenAt} frame={frame}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 16,
                  border: `6px solid ${GOLD}`,
                  backgroundColor: GOLD,
                  color: "#FFF",
                  fontSize: 48,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {x.b}
              </div>
            </Appear>
            {/* not-speech-bound: "different things do not combine" names no number */}
            <Line at={step(0.4)} frame={frame} size={48} colour={RED}>
              will not combine
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
            <Boxes n={x.a} colour={BLUE} at={blueAt} />
            <div style={{ fontSize: 66, fontWeight: 800, color: MUTED }}>+</div>
            <Boxes n={x.b} colour={GREEN} at={greenAt} />
            {sceneId !== "ask" && (
              <>
                <Line at={combinedAt} frame={frame} size={66} colour={MUTED}>
                  =
                </Line>
                <Line at={combinedAt} frame={frame} size={88} colour={GREEN}>
                  {x.combined}x
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "distribute") {
    // The area rectangle: height a, width split into x and b.
    const H = 190;
    const WX = 300;
    const WB = 62 * x.b;
    const split = sceneId !== "ask";
    const headline =
      sceneId === "ask"
        ? `${x.a}( x + ${x.b} )`
        : sceneId === "work"
          ? "Two rooms"
          : sceneId === "twist"
            ? `Check it with x = ${x.at}`
            : `${x.a}x + ${x.outer}`;
    // work: "a rectangle 3 tall" → height; "a piece of length 4" (the second 4)
    // → the cut; "which is 3 x" (the third 3) → first room; "which is 12" →
    // second room. In ask the height is the "3" of "expand 3, bracket…".
    const heightAt = sceneId === "ask" || sceneId === "work" ? said(x.a, CARRIED, 0) : CARRIED;
    const splitAt = sceneId === "work" ? said(x.b, step(0.35), 1) : sceneId === "ask" ? NEVER : CARRIED;
    const room1At = sceneId === "work" ? said(x.a, splitAt, 2) : CARRIED;
    const room2At = sceneId === "work" ? said(x.outer, room1At, 0) : CARRIED;
    // twist: the two checks, each on the number that opens it.
    const checkLeftAt = said(x.at, step(0.15), 1);
    const checkRightAt = said(x.a * x.at, step(0.5), 0);
    const titleAt =
      sceneId === "ask"
        ? said(x.a, CARRIED, 0)
        : sceneId === "twist"
          ? said(x.at, CARRIED, 0)
          : sceneId === "record"
            ? said(x.a, CARRIED, -1)
            : CARRIED; // not-speech-bound: "Two rooms" names no number
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enterAt(frame, titleAt)} />
        <div style={{ position: "relative", paddingTop: 40, paddingLeft: 60 }}>
          {/* height label */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 40 + H / 2 - 24,
              fontSize: 44,
              fontWeight: 800,
              color: MUTED,
              opacity: enterAt(frame, heightAt).opacity,
            }}
          >
            {x.a}
          </div>
          {/* width labels */}
          <div style={{ position: "absolute", left: 60, top: 0, width: WX, textAlign: "center", fontSize: 44, fontWeight: 800, color: BLUE }}>
            x
          </div>
          {split && (
            <div
              style={{
                position: "absolute",
                left: 60 + WX,
                top: 0,
                width: WB,
                textAlign: "center",
                fontSize: 44,
                fontWeight: 800,
                color: GOLD,
                opacity: enterAt(frame, splitAt).opacity,
              }}
            >
              {x.b}
            </div>
          )}
          <div style={{ display: "flex" }}>
            <div
              style={{
                width: WX,
                height: H,
                border: `6px solid ${BLUE}`,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 62,
                fontWeight: 800,
                color: BLUE,
              }}
            >
              {split && <span style={{ opacity: enterAt(frame, room1At).opacity }}>{`${x.a}x`}</span>}
            </div>
            <div
              style={{
                width: WB,
                height: H,
                border: `6px solid ${split && frame >= splitAt ? GOLD : BLUE}`,
                borderLeftWidth: split && frame >= splitAt ? 6 : 0,
                backgroundColor: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 62,
                fontWeight: 800,
                color: GOLD,
              }}
            >
              {split && <span style={{ opacity: enterAt(frame, room2At).opacity }}>{x.outer}</span>}
            </div>
          </div>
        </div>
        {sceneId === "twist" && (
          <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
            <Line at={checkLeftAt} frame={frame} size={50} colour={MUTED}>
              {x.a}({x.at} + {x.b}) = {x.checkLeft}
            </Line>
            <Line at={checkRightAt} frame={frame} size={50} colour={GREEN}>
              {x.a * x.at} + {x.outer} = {x.checkRight}
            </Line>
          </div>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "solve-times") {
    const shared = sceneId === "twist" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `${x.a}x = ${x.b}`
        : sceneId === "work"
          ? "Both sides are equal — keep them that way"
          : sceneId === "twist"
            ? `Share both sides into ${x.a}`
            : `x = ${x.solution}`;
    // ask "solve 4 x equals 12", work "on the left, 4 boxes … on the right, 12".
    const boxesAt = shared ? CARRIED : said(x.a, CARRIED, 0);
    // twist/record show the SOLUTION on the right: "is 3". Otherwise the total.
    const rightFallback = step(0.35); // not-speech-bound: fallback only
    const rightAt = shared ? said(x.solution, rightFallback, 0) : said(x.b, CARRIED, 0);
    const checkFallback = step(0.7); // not-speech-bound: fallback only
    const checkAt = said(x.b, checkFallback, -1);
    const titleAt =
      sceneId === "ask" || sceneId === "twist"
        ? said(x.a, CARRIED, 0)
        : sceneId === "record"
          ? said(x.solution, CARRIED, 0)
          : CARRIED; // not-speech-bound: the work headline names no number
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={enterAt(frame, titleAt)} />
        <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
          <Appear at={boxesAt} frame={frame} style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: shared ? 1 : x.a }, (_, i) => (
              <XBox key={i} size={104} colour={BLUE} />
            ))}
          </Appear>
          <div style={{ fontSize: 76, fontWeight: 800, color: MUTED }}>=</div>
          <Line at={rightAt} frame={frame} size={92} colour={shared ? GREEN : GOLD}>
            {shared ? x.solution : x.b}
          </Line>
        </div>
        {/* The balance the narration asks you to picture. A bare beam reads as
            a fraction bar under "x = 3", so it gets a fulcrum.
            not-speech-bound: scenery, present for the whole scene. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 760, height: 10, backgroundColor: MUTED, borderRadius: 5, opacity: 0.65 }} />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "34px solid transparent",
              borderRight: "34px solid transparent",
              borderBottom: `52px solid ${MUTED}`,
              opacity: 0.65,
            }}
          />
        </div>
        {(sceneId === "twist" || sceneId === "record") && (
          <Line at={checkAt} frame={frame} size={44} colour={MUTED}>
            check: {x.a} × {x.solution} = {x.b}
          </Line>
        )}
        {sceneId === "record" && tip}
      </AbsoluteFill>
    );
  }

  // integers — walk the line.
  const from = -8;
  const to = 8;
  const walkStart = step(0.2); // not-speech-bound: fallback only
  const walkEnd = step(0.8); // not-speech-bound: fallback only
  // Each hop lands on its own number: "negative 2… negative 3… negative 4…".
  // Negatives are aligned as their absolute value, and the step count (4) is
  // said twice before the walk, so the occurrence counter starts primed.
  const spokenBeforeHops: number[] = sceneId === "twist" ? [x.b, x.b] : [];
  const hopFrames: number[] = [];
  for (let k = 1; k <= x.b; k++) {
    const v = Math.abs(unit.a - k);
    const fallback = walkStart + Math.round(((walkEnd - walkStart) * k) / Math.max(1, x.b));
    hopFrames.push(said(v, fallback, before(v, spokenBeforeHops)));
    spokenBeforeHops.push(v);
  }
  const landedAt = said(Math.abs(x.integerResult), CARRIED, 0);
  const at =
    sceneId === "ask"
      ? unit.a
      : sceneId === "work"
        ? unit.a
        : sceneId === "twist"
          ? unit.a - hopFrames.filter((f) => frame >= f).length
          : frame >= landedAt
            ? x.integerResult
            : unit.a;
  const headline =
    sceneId === "ask"
      ? `(${unit.a}) − ${x.b}`
      : sceneId === "work"
        ? "Plus walks right. Minus walks left."
        : sceneId === "twist"
          ? `${x.b} steps left`
          : `(${unit.a}) − ${x.b} = ${x.integerResult}`;
  // ask: "negative 1, minus 4" puts the line up on the first number; after
  // that the line is carried. work: "find negative 1 and stand there".
  const lineAt =
    sceneId === "ask"
      ? said(x.startAbs, CARRIED, 0)
      : sceneId === "work"
        ? CARRIED
        : CARRIED;
  const titleAt =
    sceneId === "ask"
      ? said(x.startAbs, CARRIED, 0)
      : sceneId === "twist"
        ? said(x.b, CARRIED, 0)
        : sceneId === "record"
          ? said(x.startAbs, CARRIED, 0)
          : CARRIED; // not-speech-bound: the work headline names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 320, gap: 30 }}>
      <Title text={headline} enter={enterAt(frame, titleAt)} />
      <Appear at={lineAt} frame={frame} style={{ position: "relative", width: STAGE_W, height: 300 }}>
        <IntegerLine from={from} to={to} at={at} start={unit.a} />
      </Appear>
      {sceneId === "work" && (
        <div style={{ display: "flex", gap: 90 }}>
          {/* not-speech-bound: "plus means walk RIGHT / minus means walk LEFT"
              names no number */}
          <Line at={step(0.15)} frame={frame} size={46} colour={GREEN}>
            + → right
          </Line>
          <Line at={step(0.4)} frame={frame} size={46} colour={RED}>
            − → left
          </Line>
        </div>
      )}
      {sceneId === "record" && tip}
    </AbsoluteFill>
  );
}

export const PreAlgVideo: React.FC<PreAlgProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = preAlgUnitById(unitId);
  const scenes = preAlgSceneTimings(unitId, voice);
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
