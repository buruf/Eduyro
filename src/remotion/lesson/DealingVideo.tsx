// src/remotion/lesson/DealingVideo.tsx
// The DEALING template: division, shown as both of the things it means.
//
// Division is taught almost everywhere as sharing ("30 split between 5") and
// almost nowhere as grouping ("how many 5s fit inside 30") — yet the second is
// what makes division feel like multiplication running backwards, and it is
// the one that makes remainders obvious. So this template performs BOTH on the
// same number and lands on the same answer:
//
//   deal   — dots are dealt round-robin onto plates, like cards
//   group  — the same dots re-form into rings of the divisor, and we count rings
//
// Dots move; nothing teleports. A live count sits under each plate as it fills,
// the same rule as the other templates.
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment. The
// deal is spread across "Deal them out… Keep going…" so the LAST dot lands on
// "everyone ends up with 6"; the first ring of the grouping lands on "a group
// of 5" and the last ring on the counted "6"; a leftover moves on "1 won't go";
// the record line and the tip appear number by number as she says them.
// Reveals that follow a word rather than a number ("Deal them out", "two ways")
// keep their frames and are marked `// not-speech-bound`.
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
import { dealingSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { dealingUnitById, dealingNumbers, type DealingUnit } from "./units";

export { FPS } from "./timeline";

export type DealingProps = {
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
const PLATE = "#EFE4CC";

const STAGE_W = 1640;
const STAGE_H = 760;

interface SceneProps {
  dur: number;
  unit: DealingUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `dealingLines` (script.ts) word
 *  for word: "36 divided by 6 is 6" says 6 twice, and only the second is the
 *  answer. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Frames at which `count` items set off one after another so that the LAST
 *  leaves on `landAt`; the first never earlier than `floor` (the previous
 *  spoken moment or the start of the deal) and the gap never wider than
 *  `maxGap` frames nor tighter than 2. With the old fallback frames this
 *  reproduces the old even stagger exactly. */
const landing = (landAt: number, count: number, floor: number, maxGap: number) => {
  const gap = count > 1 ? Math.min(maxGap, Math.max(2, (landAt - floor) / (count - 1))) : 0;
  return (i: number) => Math.round(landAt - (count - 1 - i) * gap);
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

/** Split a phrase like "5 × 6 = 30, so 30 ÷ 5 = 6" into parts that appear on
 *  the frame each number is said; text between numbers appears with the number
 *  that follows it (so "5" then " × 6"), trailing text with the number before
 *  it, and a phrase with no numbers at all on `fallback`. `spokenBefore` lists
 *  the numbers the line says ahead of the phrase, so occurrences line up. */
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

/** Dot size shrinks as the dividend grows, so 48 fits as comfortably as 12. */
function dotSize(total: number) {
  if (total <= 12) return 44;
  if (total <= 24) return 36;
  if (total <= 36) return 30;
  return 26;
}

/** The pile the dots start in, laid out in rows of ten. */
function pilePos(i: number, size: number) {
  const perRow = 10;
  const gap = size * 0.35;
  const w = perRow * (size + gap) - gap;
  const x0 = (STAGE_W - w) / 2;
  return {
    x: x0 + (i % perRow) * (size + gap),
    y: 90 + Math.floor(i / perRow) * (size + gap),
  };
}

interface PlateGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Plate rectangles, spread across the stage. */
function plateGeom(plateCount: number, perPlate: number, size: number): PlateGeom[] {
  const cols = Math.min(plateCount, 6);
  const rows = Math.ceil(plateCount / cols);
  const gap = 34;
  const inner = Math.ceil(Math.sqrt(Math.max(perPlate, 1)));
  const w = Math.max(150, inner * (size + 8) + 30);
  const h = Math.max(130, Math.ceil(perPlate / inner) * (size + 8) + 30);
  const totalW = cols * w + (cols - 1) * gap;
  const x0 = (STAGE_W - totalW) / 2;
  const y0 = 330;
  return Array.from({ length: plateCount }, (_, i) => ({
    x: x0 + (i % cols) * (w + gap),
    y: y0 + Math.floor(i / cols) * (h + 90),
    w,
    h,
  }));
}

/** Seat `k` inside a plate. */
function seatPos(plate: PlateGeom, k: number, perPlate: number, size: number) {
  const inner = Math.ceil(Math.sqrt(Math.max(perPlate, 1)));
  return {
    x: plate.x + 15 + (k % inner) * (size + 8),
    y: plate.y + 15 + Math.floor(k / inner) * (size + 8),
  };
}

/** A dot that sets off at `at` and arrives `travel` frames later. Short
 *  travel, so a dot that leaves on the word has landed 0.3 s after it. */
function Dot({
  from,
  to,
  at,
  travel = 10,
  size,
  color = GOLD,
  showAt,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  at: number;
  travel?: number;
  size: number;
  color?: string;
  /** Frame the dot first appears (undefined = always there). */
  showAt?: number;
}) {
  const frame = useCurrentFrame();
  const fade = useFade(showAt);
  const t = interpolate(frame, [at, at + travel], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: from.x + (to.x - from.x) * t,
        top: from.y + (to.y - from.y) * t,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: fade,
      }}
    />
  );
}

function Plate({ g, label, count }: { g: PlateGeom; label?: string; count?: number }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: g.x,
          top: g.y,
          width: g.w,
          height: g.h,
          borderRadius: 16,
          backgroundColor: PLATE,
        }}
      />
      {count !== undefined && (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y + g.h + 8,
            width: g.w,
            textAlign: "center",
            fontSize: 52,
            fontWeight: 800,
            color: INK,
          }}
        >
          {count}
        </div>
      )}
      {label && (
        <div
          style={{
            position: "absolute",
            left: g.x,
            top: g.y - 46,
            width: g.w,
            textAlign: "center",
            fontSize: 32,
            color: MUTED,
            fontWeight: 700,
          }}
        >
          {label}
        </div>
      )}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  // "30 divided by 5." — each number on its word.
  const b = useEnter(38); // not-speech-bound: "two ways to picture this" names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Parts
        style={{ fontSize: 190, fontWeight: 800, color: INK }}
        parts={[
          { text: `${unit.total}`, at: said(unit.total, 6) },
          { text: ` ÷ ${unit.divisor}`, at: said(unit.divisor, 6, before(unit.divisor, [unit.total])) },
        ]}
      />
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Two ways to see this.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: share them out ---------------------------------------------
/** A ten-rod: ten cubes fused, so a rod is visibly ten ones. */
function Rod({ x, y, size, showAt }: { x: number; y: number; size: number; showAt?: number }) {
  const fade = useFade(showAt);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        opacity: fade,
      }}
    >
      {Array.from({ length: 10 }, (_, k) => (
        <div key={k} style={{ width: size, height: size, borderRadius: 3, backgroundColor: BLUE }} />
      ))}
    </div>
  );
}

/** Block sharing: deal whole TENS first, then the ones — which is exactly
 *  what long division does, and why 84 ÷ 4 is easy without counting 84 things. */
function SceneDealBlocks({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const tens = Math.floor(unit.total / 10);
  const ones = unit.total % 10;
  const tensEach = tens / unit.divisor;
  const onesEach = ones / unit.divisor;

  const size = 18;
  const rodH = size * 10 + 9 * 2;
  const plateW = Math.max(200, tensEach * (size + 14) + onesEach * (size + 6) + 60);
  const gap = 40;
  const totalW = unit.divisor * plateW + (unit.divisor - 1) * gap;
  const x0 = (STAGE_W - totalW) / 2;
  const plateY = 300;

  const tensAt = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const onesAt = Math.round(dur * 0.6); // not-speech-bound: only for clips without alignment
  const travel = 12;
  const stagger = 6;

  // The line, number by number: "84 is 8 tens and 4 ones. Share the tens
  // first — 8 tens between 4… that's 2 tens each. Now the ones. 4 between
  // 4… 1 each." — the same number recurs, so each mention is found by how
  // many times it was said before.
  const spoken = [unit.total, tens, ones, tens, unit.divisor, tensEach, ones, unit.divisor, onesEach];
  const at = (k: number, fallback: number) => said(spoken[k], fallback, before(spoken[k], spoken.slice(0, k)));
  const rodsShowAt = at(1, 0); // the pile of tens appears on "8 tens"
  const cubesShowAt = at(2, 0); // the loose ones on "4 ones"
  const rodsFloor = at(3, tensAt); // "8 tens between 4" — dealing starts here
  const rodsLand = at(5, tensAt + (tens - 1) * stagger); // the last rod leaves on "2 tens each"
  const onesTitleAt = at(6, onesAt); // "Now the ones. 4 between 4"
  const cubesFloor = at(7, onesAt);
  const cubesLand = at(8, onesAt + (ones - 1) * stagger); // the last cube on "1 each"
  const rodAt = landing(rodsLand, tens, rodsFloor, Math.max(stagger, 8));
  const cubeAt = landing(cubesLand, ones, cubesFloor, Math.max(stagger, 8));
  const tensCaptionAt = rodsLand;
  const onesCaptionAt = cubesLand;

  const title = useEnter(4); // not-speech-bound: "Share the…" — the count enters on its word below
  const tensWordAt = at(1, 4);
  const onesTitle = useEnter(onesTitleAt);

  const rodsDealt = Array.from({ length: tens }, (_, i) => rodAt(i) + travel * 0.6).filter((t) => frame >= t).length;
  const cubesDealt = Array.from({ length: ones }, (_, i) => cubeAt(i) + travel * 0.6).filter((t) => frame >= t).length;

  const pileRod = (i: number) => ({ x: 420 + i * (size + 22), y: 90 });
  const pileCube = (i: number) => ({ x: 420 + i * (size + 8), y: 90 + rodH + 30 });
  const seatRod = (p: number, k: number) => ({
    x: x0 + p * (plateW + gap) + 22 + k * (size + 14),
    y: plateY + 24,
  });
  const seatCube = (p: number, k: number) => ({
    x: x0 + p * (plateW + gap) + 22 + tensEach * (size + 14) + k * (size + 6),
    y: plateY + 24 + rodH - size,
  });

  const showOnes = frame >= onesTitleAt;
  const tensCaption = useFade(tensCaptionAt);
  const onesCaption = useFade(onesCaptionAt);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
      {showOnes ? (
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: INK,
            opacity: onesTitle.opacity,
            translate: `0 ${onesTitle.translateY}px`,
          }}
        >
          Now share the {ones} ones
        </div>
      ) : (
        <Parts
          style={{ fontSize: 80, fontWeight: 700, color: INK, opacity: title.opacity, translate: `0 ${title.translateY}px` }}
          parts={[
            { text: "Share the ", at: 4 }, // not-speech-bound: names no number
            { text: `${tens} tens`, at: tensWordAt },
          ]}
        />
      )}
      <Stage>
        {/* Plates are the stage — they wait for the blocks. not-speech-bound */}
        {Array.from({ length: unit.divisor }, (_, p) => (
          <div
            key={p}
            style={{
              position: "absolute",
              left: x0 + p * (plateW + gap),
              top: plateY,
              width: plateW,
              height: rodH + 48,
              borderRadius: 16,
              backgroundColor: PLATE,
            }}
          />
        ))}
        {/* Tens travel first */}
        {Array.from({ length: tens }, (_, i) => {
          const p = i % unit.divisor;
          const k = Math.floor(i / unit.divisor);
          const from = pileRod(i);
          const to = seatRod(p, k);
          const t = interpolate(frame, [rodAt(i), rodAt(i) + travel], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          });
          return (
            <Rod
              key={`r${i}`}
              x={from.x + (to.x - from.x) * t}
              y={from.y + (to.y - from.y) * t}
              size={size}
              showAt={rodsShowAt}
            />
          );
        })}
        {/* Then the ones */}
        {Array.from({ length: ones }, (_, i) => {
          const p = i % unit.divisor;
          const k = Math.floor(i / unit.divisor);
          const from = pileCube(i);
          const to = seatCube(p, k);
          return (
            <Dot
              key={`c${i}`}
              size={size}
              from={from}
              to={to}
              at={cubeAt(i)}
              travel={travel}
              color={GOLD}
              showAt={cubesShowAt}
            />
          );
        })}
        {/* Per-plate running value, so each plate visibly becomes 21 (live count — follows the blocks, not a word) */}
        {Array.from({ length: unit.divisor }, (_, p) => {
          const r = Math.max(0, Math.min(tensEach, Math.floor((rodsDealt - p - 1) / unit.divisor) + 1));
          const c = Math.max(0, Math.min(onesEach, Math.floor((cubesDealt - p - 1) / unit.divisor) + 1));
          return (
            <div
              key={`v${p}`}
              style={{
                position: "absolute",
                left: x0 + p * (plateW + gap),
                top: plateY + rodH + 60,
                width: plateW,
                textAlign: "center",
                fontSize: 62,
                fontWeight: 800,
                color: INK,
              }}
            >
              {r * 10 + c}
            </div>
          );
        })}
      </Stage>
      <div style={{ fontSize: 50, color: MUTED, fontWeight: 700 }}>
        {frame < onesCaptionAt ? (
          <span style={{ opacity: tensCaption }}>{`${tensEach} tens each`}</span>
        ) : (
          <span style={{ opacity: onesCaption }}>{`${tensEach} tens and ${onesEach} — that's ${n.each}`}</span>
        )}
      </div>
    </AbsoluteFill>
  );
}

function SceneDeal(props: SceneProps) {
  if (props.unit.blocks) return <SceneDealBlocks {...props} />;
  return <SceneDealDots {...props} />;
}

function SceneDealDots({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const title = useEnter(4); // not-speech-bound: "First way — sharing" names no number
  const size = dotSize(unit.total);
  const plates = plateGeom(unit.divisor, n.each, size);

  // "Deal them out, one at a time, like cards… onto 5 plates. Keep going… and
  // everyone ends up with 6. And 1 won't go." — she names only the total per
  // plate, so the deal is spread from "Deal them out" and the LAST dot leaves
  // on that total; a leftover moves on its number.
  const dealAt = Math.round(dur * 0.18); // not-speech-bound: "Deal them out" names no number; also the fallback start
  const stagger = Math.max(2, Math.round(90 / unit.total));
  const travel = 10;
  const eachAt = said(n.each, dealAt + (n.dealt - 1) * stagger, -1); // last mention: "onto 6 plates… ends up with 6"
  const dealtBy = landing(eachAt, n.dealt, dealAt, Math.max(stagger, 8));
  const leftoverAt = said(n.remainder, dealAt + n.dealt * stagger, -1);
  const eachCaption = useFade(eachAt, 10);
  const leftoverCaption = useFade(leftoverAt, 10);

  // Round-robin: dot i goes to plate (i % divisor), seat floor(i / divisor).
  const seated = Array.from({ length: n.dealt }, (_, i) => dealtBy(i) + travel * 0.6).filter(
    (t) => frame >= t,
  ).length;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Share {unit.total} between {unit.divisor}
      </div>
      <Stage>
        {/* Plates are the stage the deal lands on, so they are there from the
            start ("onto 5 plates" is said mid-deal). not-speech-bound */}
        {plates.map((g, p) => (
          <Plate
            key={p}
            g={g}
            count={Math.max(0, Math.min(n.each, Math.floor((seated - p - 1) / unit.divisor) + 1))}
          />
        ))}
        {Array.from({ length: unit.total }, (_, i) => {
          const p = i % unit.divisor;
          const k = Math.floor(i / unit.divisor);
          const isLeftover = n.remainder > 0 && i >= n.dealt;
          return (
            <Dot
              key={i}
              size={size}
              from={pilePos(i, size)}
              to={isLeftover ? pilePos(i - n.dealt, size) : seatPos(plates[p], k, n.each, size)}
              at={isLeftover ? leftoverAt : dealtBy(i)}
              travel={travel}
              color={isLeftover ? GREEN : GOLD}
            />
          );
        })}
      </Stage>
      <div style={{ fontSize: 52, color: MUTED, fontWeight: 700 }}>
        <span style={{ opacity: eachCaption }}>{`${n.each} each`}</span>
        {n.remainder > 0 && (
          <span style={{ opacity: leftoverCaption }}>{` — and ${n.remainder} that won't go`}</span>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the other meaning — how many groups fit? -------------------
function SceneGroup(props: SceneProps) {
  // 84 in groups of 4 would need 21 rings — impossible to show and not what
  // this unit teaches. Block units get the place-value record instead, which
  // is the written partner to the sharing they just watched.
  if (props.unit.blocks) return <SceneGroupBlocks {...props} />;
  return <SceneGroupDots {...props} />;
}

function SceneGroupBlocks({ dur, unit, said }: SceneProps) {
  const n = dealingNumbers(unit);
  const title = useEnter(4); // not-speech-bound: "Written down…" names no number
  const tens = Math.floor(unit.total / 10);
  const ones = unit.total % 10;
  const tensEach = tens / unit.divisor;
  const onesEach = ones / unit.divisor;
  // "8 tens divided by 4 is 2 tens. 4 ones divided by 4 is 1. Put them
  // together… 21." — each piece of each row enters on its number.
  const spoken = [tens, unit.divisor, tensEach, ones, unit.divisor, onesEach, n.each];
  const at = (k: number, fallback: number) => said(spoken[k], fallback, before(spoken[k], spoken.slice(0, k)));
  const row1At = Math.round(dur * 0.18); // not-speech-bound: only for clips without alignment
  const row2At = Math.round(dur * 0.46); // not-speech-bound: only for clips without alignment
  const totalAt = Math.round(dur * 0.74); // not-speech-bound: only for clips without alignment
  const rowStyle = { fontSize: 92, fontWeight: 800, color: MUTED };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div style={{ fontSize: 80, fontWeight: 700, color: INK, opacity: title.opacity, translate: `0 ${title.translateY}px` }}>
        Written down, place by place
      </div>
      <Parts
        style={rowStyle}
        parts={[
          { text: `${tens} tens`, at: at(0, row1At) },
          { text: ` ÷ ${unit.divisor}`, at: at(1, row1At) },
          { text: ` = ${tensEach} tens`, at: at(2, row1At) },
        ]}
      />
      <Parts
        style={rowStyle}
        parts={[
          { text: `${ones} ones`, at: at(3, row2At) },
          { text: ` ÷ ${unit.divisor}`, at: at(4, row2At) },
          { text: ` = ${onesEach} one${onesEach === 1 ? "" : "s"}`, at: at(5, row2At) },
        ]}
      />
      <Parts style={{ fontSize: 120, fontWeight: 800, color: GREEN }} parts={[{ text: `${n.each}`, at: at(6, totalAt) }]} />
    </AbsoluteFill>
  );
}

function SceneGroupDots({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = dealingNumbers(unit);
  const size = dotSize(unit.total);
  // Now the PLATES are groups of `divisor`, and the answer is how many plates.
  const rings = plateGeom(n.each, unit.divisor, size);

  // "…how many 5s actually fit inside 30. Make a group of 5… and another… and
  // count the groups. 6." — the first ring completes on "a group of 5", the
  // rings in between are spread evenly, and the last completes on the counted
  // total; a leftover moves on "the same 1 is still stranded".
  const formAt = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const stagger = Math.max(2, Math.round(90 / unit.total));
  const travel = 10;
  const ring0At = said(unit.divisor, formAt + (unit.divisor - 1) * stagger, before(unit.divisor, [unit.divisor, unit.total]));
  const lastAt = said(
    n.each,
    formAt + (n.dealt - 1) * stagger,
    before(n.each, [unit.divisor, unit.total, unit.divisor]),
  );
  const ringEnd = (r: number) => (n.each > 1 ? Math.round(ring0At + ((lastAt - ring0At) * r) / (n.each - 1)) : lastAt);
  const dotAt = (i: number) => {
    const r = Math.floor(i / unit.divisor);
    const k = i % unit.divisor;
    return landing(ringEnd(r), unit.divisor, r === 0 ? formAt : ringEnd(r - 1), stagger)(k);
  };
  const leftoverAt = said(n.remainder, formAt, -1);

  const arrived = Array.from({ length: n.dealt }, (_, i) => dotAt(i) + travel * 0.6).filter((t) => frame >= t).length;
  const ringsFull = Math.floor(arrived / unit.divisor);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Parts
        style={{ fontSize: 84, fontWeight: 700, color: INK }}
        parts={[
          { text: "How many ", at: 4 }, // not-speech-bound: said before the number
          { text: `${unit.divisor}s`, at: said(unit.divisor, 4) },
          { text: ` fit in ${unit.total}?`, at: said(unit.total, 4, before(unit.total, [unit.divisor])) },
        ]}
      />
      <Stage>
        {rings.map((g, p) => (
          <Plate key={p} g={g} label={p < ringsFull ? `${p + 1}` : undefined} />
        ))}
        {Array.from({ length: n.dealt }, (_, i) => {
          const ring = Math.floor(i / unit.divisor);
          const k = i % unit.divisor;
          return (
            <Dot
              key={i}
              size={size}
              from={pilePos(i, size)}
              to={seatPos(rings[ring], k, unit.divisor, size)}
              at={dotAt(i)}
              travel={travel}
              color={GOLD}
            />
          );
        })}
        {n.remainder > 0 &&
          Array.from({ length: n.remainder }, (_, i) => (
            <Dot
              key={`r${i}`}
              size={size}
              from={pilePos(n.dealt + i, size)}
              to={pilePos(i, size)}
              at={leftoverAt}
              travel={travel}
              color={GREEN}
            />
          ))}
      </Stage>
      <div style={{ fontSize: 56, color: GREEN, fontWeight: 800 }}>
        {ringsFull} {ringsFull === 1 ? "group" : "groups"}
        {n.remainder > 0 && frame >= leftoverAt ? `, ${n.remainder} left over` : ""}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the fact ---------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const n = dealingNumbers(unit);
  const title = useEnter(4); // not-speech-bound: "Both ways agree" names no number
  const answerAt = Math.round(dur * 0.28); // not-speech-bound: only for clips without alignment
  const tipAt = Math.round(dur * 0.6); // not-speech-bound: only for clips without alignment
  // "So 30 divided by 5 is 6[, remainder 1]. <tip>." — the fact appears
  // number by number, then the tip does the same (its numbers repeat the
  // fact's, so the occurrences carry on from what was said before it).
  const spoken = [unit.total, unit.divisor, n.each];
  const totalAt = said(unit.total, 0);
  const divisorAt = said(unit.divisor, 0, before(unit.divisor, spoken.slice(0, 1)));
  const eachAt = said(n.each, answerAt, before(n.each, spoken.slice(0, 2)));
  const remainderAt = said(n.remainder, answerAt, before(n.remainder, spoken));
  if (n.remainder > 0) spoken.push(n.remainder);
  const factParts: TextPart[] = [
    { text: `${unit.total}`, at: totalAt },
    { text: ` ÷ ${unit.divisor}`, at: divisorAt },
    { text: ` = ${n.each}`, at: eachAt },
  ];
  if (n.remainder > 0) factParts.push({ text: ` r ${n.remainder}`, at: remainderAt });
  const tipParts = numberParts(unit.tip, said, tipAt, spoken);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Both ways agree
      </div>
      <Parts style={{ fontSize: 160, fontWeight: 800, color: INK }} parts={factParts} />
      <Parts style={{ fontSize: 58, color: BLUE, fontWeight: 700 }} parts={tipParts} />
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  deal: SceneDeal,
  group: SceneGroup,
  record: SceneRecord,
};

export const DealingVideo: React.FC<DealingProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = dealingUnitById(unitId);
  const scenes = dealingSceneTimings(unitId, voice);
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
