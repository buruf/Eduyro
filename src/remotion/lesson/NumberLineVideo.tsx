// src/remotion/lesson/NumberLineVideo.tsx
// The NUMBER LINE template: a sequence with a gap, and a dot that hops along
// the line until it lands in it.
//
// "What comes next" is usually asked as recall; on the line it's a PLACE — one
// more hop to the right, and for patterns every hop is visibly the same size.
// The decade-crossing unit (58, 59, __) puts the gap exactly where counting to
// 100 actually breaks down, and the hop that lands on 60 is the lesson.
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
import { numberLineSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { numberLineUnitById, numberLineValues, type NumberLineUnit } from "./units-early";

export { FPS } from "./timeline";

export type NumberLineProps = {
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

const STAGE_W = 1640;
const STAGE_H = 620;
const LINE_Y = 400;
const LINE_X0 = 90;
const LINE_X1 = STAGE_W - 90;

interface SceneProps {
  dur: number;
  voice: string;
  unit: NumberLineUnit;
  /** Scene-local frame at which the narrator says a number (timeline.ts
   *  `saidFor`). Every reveal that shows a value she says — a card in the
   *  sequence, the start dot, each hop's landing, the tip's number — is timed
   *  with this, never with a fraction of the scene. */
  said: SaidFn;
}

/** How many times `n` was already said among `earlier` — the occurrence to
 *  hand `said` when a line repeats a value (the decade tip says 59 and 60 a
 *  second time). */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** Walks a line's numbers in the order the script says them ("6… then 7…
 *  then 8"), so a scene that reveals values in narration order never counts
 *  occurrences by hand: `next(n, fallback)` is the k-th time n is said, k =
 *  how many earlier next() calls named n. */
function spokenOrder(said: SaidFn) {
  const earlier: number[] = [];
  const next = (n: number, fallback: number) => {
    const a = Math.abs(n);
    const at = said(a, fallback, before(a, earlier));
    earlier.push(a);
    return at;
  };
  return { next };
}

/** The scene-local frames at which each card of the sequence is said, in
 *  order. The gap card is the word "blank", which alignment does not carry:
 *  it is spread from its neighbours — midway between them, or one typical
 *  spacing after the last spoken number when it ends the sequence. */
function sequenceSaidAt(unit: NumberLineUnit, said: SaidFn, fallback: number): number[] {
  const n = numberLineValues(unit);
  const order = spokenOrder(said);
  const at = n.values.map((v, i) => (i === unit.gapIndex ? NaN : order.next(v, fallback)));
  const spoken = at.filter((f) => !Number.isNaN(f));
  const spacing =
    spoken.length > 1 ? (spoken[spoken.length - 1] - spoken[0]) / (spoken.length - 1) : 0;
  const g = unit.gapIndex;
  const prev = g > 0 ? at[g - 1] : fallback;
  at[g] = g < at.length - 1 ? Math.round((prev + at[g + 1]) / 2) : Math.round(prev + spacing);
  return at;
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

/** X of a value on the drawn window. */
function xOf(u: NumberLineUnit, v: number) {
  const n = numberLineValues(u);
  return (
    LINE_X0 +
    ((v - n.windowStart) / (n.windowEnd - n.windowStart)) * (LINE_X1 - LINE_X0)
  );
}

/** The line itself: ticks at every step within the window, labelled. */
function Line({ unit, appear = 1 }: { unit: NumberLineUnit; appear?: number }) {
  const n = numberLineValues(unit);
  const ticks: number[] = [];
  for (let v = n.windowStart; v <= n.windowEnd; v += unit.step) ticks.push(v);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: LINE_X0,
          top: LINE_Y - 4,
          width: (LINE_X1 - LINE_X0) * appear,
          height: 8,
          borderRadius: 4,
          backgroundColor: INK,
        }}
      />
      {ticks.map((v) => (
        <div key={v} style={{ opacity: appear }}>
          <div
            style={{
              position: "absolute",
              left: xOf(unit, v) - 3,
              top: LINE_Y - 26,
              width: 6,
              height: 52,
              borderRadius: 3,
              backgroundColor: INK,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: xOf(unit, v) - 70,
              top: LINE_Y + 44,
              width: 140,
              textAlign: "center",
              fontSize: 52,
              fontWeight: 700,
              color: MUTED,
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </>
  );
}

/** The sequence cards above the line, the gap card showing "?" until filled. */
function SequenceCards({
  unit,
  filled,
  flash,
}: {
  unit: NumberLineUnit;
  filled: boolean;
  flash: number;
}) {
  const n = numberLineValues(unit);
  const cardW = 180;
  const gap = 40;
  const total = unit.count * cardW + (unit.count - 1) * gap;
  const x0 = (STAGE_W - total) / 2;
  return (
    <>
      {n.values.map((v, i) => {
        const isGap = i === unit.gapIndex;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + i * (cardW + gap),
              top: 60,
              width: cardW,
              height: 150,
              borderRadius: 18,
              backgroundColor: isGap && !filled ? "transparent" : "#fff",
              border: isGap ? `6px dashed ${isGap && filled ? GREEN : MUTED}` : "3px solid #E4D9BE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 84,
              fontWeight: 800,
              color: isGap ? (filled ? GREEN : MUTED) : INK,
              scale: isGap && filled ? String(1 + flash * 0.12) : "1",
            }}
          >
            {isGap && !filled ? "?" : v}
          </div>
        );
      })}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the sequence with a hole ------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  // "6… then 7… then 8… then blank": each card lands on its number (speech
  // starts at frame 0, so the first one opens the scene); the blank is
  // spread from its neighbours. The question follows the last card.
  const cardAt = sequenceSaidAt(unit, said, 6);
  const lastCardAt = Math.max(...cardAt);
  const b = useEnter(Math.max(40, lastCardAt + 16)); // not-speech-bound: "What goes in the blank?"
  const n = numberLineValues(unit);
  const fade = (at: number) => ({
    opacity: interpolate(frame, [at, at + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translate: `0 ${interpolate(frame, [at, at + 14], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    })}px`,
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          color: INK,
          display: "flex",
          gap: 40,
        }}
      >
        {n.values.map((v, i) => (
          <span key={i} style={{ color: i === unit.gapIndex ? MUTED : INK, ...fade(cardAt[i]) }}>
            {i === unit.gapIndex ? "__" : v}
            {i < unit.count - 1 ? "," : ""}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 60, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        What goes in the blank?
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: the line appears --------------------------------------------
function SceneLine({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // not-speech-bound
  // "Here's the line. The sequence starts at 6." — the line itself follows no
  // number; the dot lands on the start value as she says it (never before
  // the line it sits on has grown).
  const growAt = Math.round(dur * 0.2); // not-speech-bound: "Here's the line"
  const appear = interpolate(frame, [growAt, growAt + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const dotAt = Math.max(growAt, said(unit.start, growAt, 0));
  const dotAppear = interpolate(frame, [dotAt, dotAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        Put it on the number line
      </div>
      <Stage>
        <SequenceCards unit={unit} filled={false} flash={0} />
        <Line unit={unit} appear={appear} />
        {/* the dot waits on the first value */}
        <div
          style={{
            position: "absolute",
            left: xOf(unit, unit.start) - 26,
            top: LINE_Y - 90,
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: GOLD,
            opacity: Math.min(appear, dotAppear),
          }}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: hop to the gap ----------------------------------------------
function SceneHop({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = numberLineValues(unit);
  const title = useEnter(4); // not-speech-bound
  const hops = unit.count - 1; // start value → each next value
  const hopFrames = 24;
  const hopGap = 16;
  const firstAt = Math.round(dur * 0.18); // not-speech-bound: fallback only
  // Each hop LANDS as its value is spoken ("Hop along… 7… then 8… then 9"),
  // so the hop begins hopFrames earlier. When the words come faster than
  // that ("5… then 6" 0.7 s apart) the arc is shortened to just over half
  // the gap, so the dot visibly RESTS on each number before leaving it —
  // never a hop that starts before the previous one has landed. Even spacing
  // is the no-timestamp fallback.
  const order = spokenOrder(said);
  const landAt: number[] = [];
  for (let h = 0; h < hops; h++) {
    const spoken = order.next(n.values[h + 1], firstAt + h * (hopFrames + hopGap) + hopFrames);
    landAt.push(Math.max((h === 0 ? 6 : landAt[h - 1]) + 8, spoken));
  }
  const hopStart = (h: number) => {
    const restingSince = h === 0 ? 6 : landAt[h - 1];
    const len = Math.min(hopFrames, Math.max(6, Math.floor(0.55 * (landAt[h] - restingSince))));
    return landAt[h] - len;
  };

  // Dot position: piecewise across hops, with a small arc.
  let dotX = xOf(unit, unit.start);
  let dotY = LINE_Y - 90;
  for (let h = 0; h < hops; h++) {
    const t = interpolate(frame, [hopStart(h), landAt[h]], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    const from = xOf(unit, n.values[h]);
    const to = xOf(unit, n.values[h + 1]);
    if (t > 0) {
      dotX = from + (to - from) * t;
      dotY = LINE_Y - 90 - Math.sin(Math.PI * t) * 90;
    }
  }
  const landedAt = landAt[hops - 1];
  const filled = frame >= landedAt;
  const flash = interpolate(frame, [landedAt, landedAt + 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        {unit.step === 1 ? "Hop along" : `Hop by ${unit.step}s`}
      </div>
      <Stage>
        <SequenceCards unit={unit} filled={filled} flash={flash} />
        <Line unit={unit} />
        {/* landing marker on the gap value */}
        <div
          style={{
            position: "absolute",
            left: xOf(unit, n.gapValue) - 40,
            top: LINE_Y - 40,
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `6px dashed ${filled ? GREEN : MUTED}`,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: dotX - 26,
            top: dotY,
            width: 52,
            height: 52,
            borderRadius: "50%",
            backgroundColor: filled ? GREEN : GOLD,
          }}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the completed sequence --------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = numberLineValues(unit);
  // "6… then 7… then 8… then 9. Say the number, then hop one more." — each
  // number of the completed sequence lands as she says it (the first opens
  // the scene). The tip lands on the first number IT says ("After 59, the
  // tens tick over — 60": the second 59), or after the sequence when it
  // names none.
  const order = spokenOrder(said);
  const valueAt = n.values.map((v) => order.next(v, 4));
  const lastValueAt = Math.max(...valueAt);
  const tipFallback = Math.round(dur * 0.5); // not-speech-bound: fallback only
  const tipNums = unit.tip.match(/\d+/g)?.map(Number) ?? [];
  const tipAt =
    tipNums.length > 0
      ? order.next(tipNums[0], tipFallback)
      : Math.max(tipFallback, lastValueAt + 12);
  const fade = (at: number) => ({
    opacity: interpolate(frame, [at, at + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translate: `0 ${interpolate(frame, [at, at + 14], [18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    })}px`,
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48 }}>
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: INK,
          display: "flex",
          gap: 40,
        }}
      >
        {n.values.map((v, i) => (
          <span key={i} style={{ color: i === unit.gapIndex ? GREEN : INK, ...fade(valueAt[i]) }}>
            {v}
            {i < unit.count - 1 ? "," : ""}
          </span>
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
  line: SceneLine,
  hop: SceneHop,
  record: SceneRecord,
};

export const NumberLineVideo: React.FC<NumberLineProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = numberLineUnitById(unitId);
  const scenes = numberLineSceneTimings(unitId, voice);
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
            <Body dur={scene.dur} unit={unit} voice={voice} said={saidFor(unitId, voice, scene.id)} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
