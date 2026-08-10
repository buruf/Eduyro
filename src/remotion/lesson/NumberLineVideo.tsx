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
import { numberLineSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
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
  unit: NumberLineUnit;
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
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const n = numberLineValues(unit);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
          display: "flex",
          gap: 40,
        }}
      >
        {n.values.map((v, i) => (
          <span key={i} style={{ color: i === unit.gapIndex ? MUTED : INK }}>
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
function SceneLine({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const growAt = Math.round(dur * 0.2);
  const appear = interpolate(frame, [growAt, growAt + 22], [0, 1], {
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
            opacity: appear,
          }}
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: hop to the gap ----------------------------------------------
function SceneHop({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = numberLineValues(unit);
  const title = useEnter(4);
  const hops = unit.count - 1; // start value → each next value
  const hopFrames = 24;
  const hopGap = 16;
  const firstAt = Math.round(dur * 0.18);
  const hopStart = (h: number) => firstAt + h * (hopFrames + hopGap);

  // Dot position: piecewise across hops, with a small arc.
  let dotX = xOf(unit, unit.start);
  let dotY = LINE_Y - 90;
  for (let h = 0; h < hops; h++) {
    const t = interpolate(frame, [hopStart(h), hopStart(h) + hopFrames], [0, 1], {
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
  const landedAt = hopStart(hops - 1) + hopFrames;
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
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const n = numberLineValues(unit);
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.5);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48 }}>
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
          display: "flex",
          gap: 40,
        }}
      >
        {n.values.map((v, i) => (
          <span key={i} style={{ color: i === unit.gapIndex ? GREEN : INK }}>
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
            <Body dur={scene.dur} unit={unit} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
