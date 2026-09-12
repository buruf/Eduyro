// src/remotion/lesson/AreaVideo.tsx
// The AREA template: why long multiplication has the steps it has.
//
// 27 × 4 is hard as a single fact and easy as a picture: draw a rectangle 27
// wide and 4 tall, cut it at the tens boundary, and it becomes 20 × 4 next to
// 7 × 4 — two facts a child already owns. The partial products in the written
// algorithm are literally these pieces, which is the connection almost never
// made: the "steps" are not a ritual, they are the rectangle's regions.
//
// 2-digit × 2-digit cuts BOTH ways and yields four regions, which is exactly
// why that algorithm has four partial products.
//
// Sync: every reveal that shows something the narrator says is timed with
// `said(n, fallback, occurrence)` from the scene's clip alignment (timeline
// `saidFor`). The factors land on their words, each region's width on the
// split ("23 is 20 and 3"), its "× h" on "20 times 4", its product on "is
// 80", the sum terms on their numbers and the answer on the total. Reveals
// that follow no spoken number keep their frames and are marked
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
import { areaSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { areaUnitById, areaRegions, areaSides, type AreaUnit } from "./units";

export { FPS } from "./timeline";

export type AreaProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const MUTED = "#8A7A5E";

const STAGE_W = 1500;
const STAGE_H = 560;

// The rectangle is drawn to a fixed box rather than true scale: at true scale
// a 3-wide sliver next to a 20-wide block is unreadable, and the point is the
// SPLIT, not the proportions.
const BOX_W = 1080;
const BOX_H = 380;
const BOX_X = (STAGE_W - BOX_W) / 2;
const BOX_Y = 90;
/** Minimum share of the box a region gets, so the ones column stays legible. */
const MIN_SHARE = 0.26;

interface SceneProps {
  dur: number;
  unit: AreaUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** The frames at which a line's numbers are said, in the order the line says
 *  them (`order` mirrors `areaLines` in script.ts word for word, so a repeated
 *  number — "23 is 20 and 3 … 20 times 4 is 80. 3 times 4 is 12" — resolves
 *  to the right occurrence). Every entry falls back to `fallback` for clips
 *  without alignment. */
const spokenAt = (said: SaidFn, order: number[], fallback: number) =>
  order.map((n, k) => said(n, fallback, before(n, order.slice(0, k))));

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

/** Column widths / row heights for the split, clamped so no strip vanishes. */
function shares(hi: number, lo: number) {
  // Either side missing means there is no cut on that axis, so the single
  // strip takes the whole box. Without this, a 1-digit side (no tens) fell
  // through to the clamp and rendered as a 26%-tall sliver.
  if (lo === 0 || hi === 0) return [1, 0];
  const raw = hi / (hi + lo);
  const clamped = Math.min(1 - MIN_SHARE, Math.max(MIN_SHARE, raw));
  return [clamped, 1 - clamped];
}

/** Frames at which the three parts of a region's label enter. */
interface RegionAt {
  /** the width digit ("20") — lands on the split sentence */
  w: number;
  /** "× h" — lands on "20 times 4" */
  h: number;
  /** the product — lands on "is 80" */
  product: number;
  /** region highlighted from here (the narrator is on this fact) */
  lit: number;
}

/** The rectangle, optionally cut, with each region labelled by its product. */
function Rect({
  unit,
  split,
  at,
}: {
  unit: AreaUnit;
  /** 0 = whole, 1 = fully cut. */
  split: number;
  /** Per-region reveal frames; absent → no labels, nothing lit. */
  at: RegionAt[] | null;
}) {
  const frame = useCurrentFrame();
  const regions = areaRegions(unit);
  const sides = areaSides(unit);
  const [wHi, wLo] = shares(sides.xTens, sides.xOnes);
  const [hHi, hLo] = shares(sides.yTens, sides.yOnes);
  // The cut opens a gap between regions as `split` goes 0 → 1.
  const gap = 16 * split;
  // The region whose fact the narrator is on: the latest one whose `lit`
  // frame has passed. None yet → every region full colour.
  let litIndex: number | null = null;
  at?.forEach((a, i) => {
    if (frame >= a.lit) litIndex = i;
  });
  const fade = (from: number) =>
    interpolate(frame, [from, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      {regions.map((r, i) => {
        const w = (r.col === 0 ? wHi : wLo) * BOX_W - (sides.xOnes ? gap / 2 : 0);
        const h = (r.row === 0 ? hHi : hLo) * BOX_H - (sides.yTens ? gap / 2 : 0);
        const x = BOX_X + (r.col === 0 ? 0 : wHi * BOX_W + gap / 2);
        const y = BOX_Y + (r.row === 0 ? 0 : hHi * BOX_H + gap / 2);
        const lit = litIndex === null || litIndex === i;
        const a = at?.[i];
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: Math.max(w, 10),
                height: Math.max(h, 10),
                borderRadius: 10,
                backgroundColor: r.col === 0 ? GOLD : BLUE,
                opacity: lit ? 1 : 0.28,
              }}
            />
            {a && (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: y + Math.max(h, 10) / 2 - 46,
                  width: Math.max(w, 10),
                  textAlign: "center",
                  color: "#fff",
                  opacity: lit ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>
                  <span style={{ opacity: fade(a.w) }}>{r.w}</span>
                  <span style={{ opacity: fade(a.h) }}> × {r.h}</span>
                </div>
                <div style={{ fontSize: 66, fontWeight: 800, opacity: fade(a.product) }}>{r.product}</div>
              </div>
            )}
          </div>
        );
      })}
      {/* Edge labels: the two numbers being multiplied (carried over from
          the build scene, so on screen from the start) */}
      <div
        style={{
          position: "absolute",
          left: BOX_X,
          top: BOX_Y - 62,
          width: BOX_W,
          textAlign: "center",
          fontSize: 48,
          fontWeight: 800,
          color: MUTED,
        }}
      >
        {unit.x}
      </div>
      <div
        style={{
          position: "absolute",
          left: BOX_X - 90,
          top: BOX_Y + BOX_H / 2 - 30,
          width: 70,
          textAlign: "right",
          fontSize: 48,
          fontWeight: 800,
          color: MUTED,
        }}
      >
        {unit.y}
      </div>
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  // "23 times 4." — each factor lands on its word.
  const [xAt, yAt] = spokenAt(said, [unit.x, unit.y], 6);
  const b = useEnter(40); // not-speech-bound: the caption names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Parts
        style={{ fontSize: 190, fontWeight: 800, color: INK }}
        parts={[
          { text: `${unit.x}`, at: xAt },
          { text: ` × ${unit.y}`, at: yAt },
        ]}
      />
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Too big to just know. So draw it.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the whole rectangle ----------------------------------------
function SceneBuild({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const growAt = Math.round(dur * 0.25); // not-speech-bound: only for clips without alignment
  // "Here's a rectangle. 23 across… and 4 down." — the rectangle finishes
  // growing as she reaches the first factor, the across label lands on it,
  // the down label on the second.
  const [xAt, yAt] = spokenAt(said, [unit.x, unit.y], growAt);
  const growFrom = Math.max(4, xAt - 26);
  const grow = interpolate(frame, [growFrom, growFrom + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const xIn = useEnter(xAt);
  const yIn = useEnter(yAt);
  const ask = useEnter(yAt + 12); // follows "4 down"
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Parts
        style={{ fontSize: 84, fontWeight: 700, color: INK }}
        parts={[
          { text: "A rectangle, ", at: 4 }, // not-speech-bound: said before the number
          { text: `${unit.x} across`, at: xAt },
          { text: ` and ${unit.y} down`, at: yAt },
        ]}
      />
      <Stage>
        <div
          style={{
            position: "absolute",
            left: BOX_X,
            top: BOX_Y,
            width: BOX_W * grow,
            height: BOX_H,
            borderRadius: 10,
            backgroundColor: GOLD,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: BOX_X,
            top: BOX_Y - 62,
            width: BOX_W,
            textAlign: "center",
            fontSize: 48,
            fontWeight: 800,
            color: MUTED,
            opacity: xIn.opacity,
            translate: `0 ${xIn.translateY}px`,
          }}
        >
          {unit.x}
        </div>
        <div
          style={{
            position: "absolute",
            left: BOX_X - 90,
            top: BOX_Y + BOX_H / 2 - 30,
            width: 70,
            textAlign: "right",
            fontSize: 48,
            fontWeight: 800,
            color: MUTED,
            opacity: yIn.opacity,
            translate: `0 ${yIn.translateY}px`,
          }}
        >
          {unit.y}
        </div>
      </Stage>
      <div style={{ fontSize: 52, color: MUTED, fontWeight: 700, opacity: ask.opacity, translate: `0 ${ask.translateY}px` }}>
        How many squares is that?
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 3: cut it into facts you know ---------------------------------
function SceneSplit({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound: the title names no number
  const regions = areaRegions(unit);
  const twoWay = regions.length === 4;
  const cutAt = Math.round(dur * 0.16); // not-speech-bound: only for clips without alignment
  const labelAt = Math.round(dur * 0.34); // not-speech-bound: only for clips without alignment
  const per = Math.max(24, Math.floor((dur - labelAt - 30) / regions.length));

  // The line's numbers in narration order (mirrors `areaLines`):
  //   2 regions: "23 is 20 and 3. … 20 times 4 is 80. 3 times 4 is 12."
  //              → [x, w0, w1, w0, h0, p0, w1, h1, p1]
  //   4 regions: "… 20 times 10 is 200. 3 times 10 is 30. 20 times 4 is 80.
  //              3 times 4 is 12."  → [w, h, p] per region
  const facts = regions.flatMap((r) => [r.w, r.h, r.product]);
  const order = twoWay ? facts : [unit.x, regions[0].w, regions[1].w, ...facts];
  const at = spokenAt(said, order, Number.NaN);
  const fb = (k: number, fallback: number) => (Number.isNaN(at[k]) ? fallback : at[k]);
  const base = twoWay ? 0 : 3;
  const regionAt: RegionAt[] = regions.map((_, i) => {
    const k = base + i * 3;
    const wSplit = !twoWay && i < 2 ? fb(1 + i, labelAt) : fb(k, labelAt);
    return {
      w: wSplit,
      h: fb(k + 1, labelAt),
      product: fb(k + 2, labelAt),
      lit: fb(k, labelAt + i * per),
    };
  });

  // The cut: "Now cut it at the tens" precedes the first number, so for the
  // two-region line the cut finishes as she reaches "23"; the two-way line
  // ("Across, at the tens… and down…") names nothing before its facts.
  const cutEnd = twoWay ? cutAt + 22 : fb(0, cutAt + 22); // not-speech-bound: two-way cut
  const cutFrom = Math.max(4, cutEnd - 22);
  const split = interpolate(frame, [cutFrom, cutFrom + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
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
        Cut it into facts you know
      </div>
      <Stage>
        <Rect unit={unit} split={split} at={regionAt} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: add the pieces ---------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const title = useEnter(4); // not-speech-bound: the title names no number
  const regions = areaRegions(unit);
  const answer = unit.x * unit.y;
  const sumAt = Math.round(dur * 0.3); // not-speech-bound: only for clips without alignment
  const answerAt = Math.round(dur * 0.62); // not-speech-bound: only for clips without alignment
  // "80 plus 12… 92." — each term lands on its number (the "+" enters with
  // the number after it), the answer line on the total.
  const at = spokenAt(said, [...regions.map((r) => r.product), answer], Number.NaN);
  const termAt = (i: number) => (Number.isNaN(at[i]) ? sumAt + i * 12 : at[i]);
  const totalAt = Number.isNaN(at[regions.length]) ? answerAt : at[regions.length];
  const total = useEnter(totalAt, 16);
  const tip = useEnter(totalAt + 20, 16); // not-speech-bound: follows the answer
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Add the pieces
      </div>
      <Parts
        style={{ fontSize: 92, fontWeight: 800, color: MUTED }}
        parts={regions.map((r, i) => ({ text: i === 0 ? `${r.product}` : ` + ${r.product}`, at: termAt(i) }))}
      />
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          color: INK,
          opacity: total.opacity,
          translate: `0 ${total.translateY}px`,
        }}
      >
        {unit.x} × {unit.y} = {answer}
      </div>
      <div
        style={{
          fontSize: 54,
          color: BLUE,
          fontWeight: 700,
          opacity: tip.opacity,
          translate: `0 ${tip.translateY}px`,
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
  split: SceneSplit,
  record: SceneRecord,
};

export const AreaVideo: React.FC<AreaProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = areaUnitById(unitId);
  const scenes = areaSceneTimings(unitId, voice);
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
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} said={saidFor(unitId, voice, scene.id)} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
