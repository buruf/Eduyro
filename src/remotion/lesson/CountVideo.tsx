// src/remotion/lesson/CountVideo.tsx
// The COUNTING template: one number for each thing, and the rows-of-ten
// structure that makes big counting possible.
//
// Counting to 10 is one-to-one correspondence: dots land one at a time and
// the count ticks WITH them, never ahead. Counting to 50 or 100 is a
// different insight — you don't count 100 things, you count rows of ten — so
// the first row lands slowly, then whole rows sweep in while the decade
// number ticks. Number recognition pairs the numeral with its quantity, both
// on screen at once.
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
import { countSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { countUnitById, type CountUnit } from "./units-early";

export { FPS } from "./timeline";

export type CountProps = {
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

const STAGE_W = 1560;
const STAGE_H = 640;

interface SceneProps {
  dur: number;
  unit: CountUnit;
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

/** Dot size by how many must fit: 10 per row always, row count varies. */
function dotSize(upTo: number) {
  if (upTo <= 10) return 72;
  if (upTo <= 50) return 52;
  return 38;
}

function dotPos(i: number, size: number) {
  const gap = size * 0.28;
  const rowW = 10 * (size + gap) - gap;
  const x0 = (STAGE_W - rowW) / 2;
  return {
    x: x0 + (i % 10) * (size + gap),
    y: 30 + Math.floor(i / 10) * (size + gap),
  };
}

function Dot({
  i,
  size,
  appearAt,
  color = GOLD,
}: {
  i: number;
  size: number;
  appearAt: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [appearAt, appearAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
  const p = dotPos(i, size);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity: t,
        scale: String(0.4 + 0.6 * t),
      }}
    />
  );
}

/** The live count — always equal to the dots on screen, never ahead. */
function Ticker({ value, flashAt }: { value: number; flashAt: number | null }) {
  const frame = useCurrentFrame();
  const flash =
    flashAt === null
      ? 0
      : interpolate(frame, [flashAt, flashAt + 10], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div style={{ position: "absolute", left: 0, top: STAGE_H - 120, width: STAGE_W, textAlign: "center" }}>
      <span
        style={{
          fontSize: 120,
          fontWeight: 800,
          color: flash > 0.05 ? GREEN : INK,
          scale: String(1 + flash * 0.14),
          display: "inline-block",
        }}
      >
        {value > 0 ? value : ""}
      </span>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the question ------------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: unit.mode === "recognise" ? 260 : 150,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {unit.mode === "recognise" ? unit.upTo : `Counting to ${unit.upTo}`}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {unit.mode === "recognise"
          ? "What does this numeral mean?"
          : unit.upTo === 10
            ? "One number for each thing."
            : "It's easier than it sounds."}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: count the first ten, one at a time --------------------------
function SceneCount({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const n = Math.min(unit.upTo, 10);
  const size = dotSize(unit.upTo);
  // Dots land spread across the middle of the scene, matching the spoken
  // count's pace as closely as an even spacing can.
  const firstAt = Math.round(dur * 0.16);
  const lastAt = Math.round(dur * 0.86);
  const stepF = (lastAt - firstAt) / Math.max(1, n - 1);
  const appeared = Array.from({ length: n }, (_, i) => firstAt + i * stepF).filter(
    (t) => frame >= t,
  ).length;
  const lastTick = appeared > 0 ? firstAt + (appeared - 1) * stepF : null;
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
        {unit.mode === "recognise" ? `Count them` : `Count with me`}
      </div>
      <Stage>
        {Array.from({ length: n }, (_, i) => (
          <Dot key={i} i={i} size={size} appearAt={firstAt + i * stepF} />
        ))}
        <Ticker value={appeared} flashAt={lastTick} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the structure ----------------------------------------------
function SceneRows({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const size = dotSize(unit.upTo);

  if (unit.mode === "recognise") {
    // Numeral and quantity side by side — the two spellings of one idea.
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            color: INK,
            opacity: title.opacity,
            translate: `0 ${title.translateY}px`,
          }}
        >
          Two ways to write the same thing
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
          <div style={{ fontSize: 300, fontWeight: 800, color: BLUE }}>{unit.upTo}</div>
          <div style={{ fontSize: 90, color: MUTED, fontWeight: 700 }}>=</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, width: 4 * (72 + 16) }}>
            {Array.from({ length: unit.upTo }, (_, i) => (
              <div
                key={i}
                style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: GOLD }}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  if (unit.upTo === 10) {
    // The full row IS the point: ten exactly fills it.
    const ringAt = Math.round(dur * 0.4);
    const ring = interpolate(frame, [ringAt, ringAt + 16], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const p0 = dotPos(0, size);
    const p9 = dotPos(9, size);
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
          10 fills a whole row
        </div>
        <Stage>
          {Array.from({ length: 10 }, (_, i) => (
            <Dot key={i} i={i} size={size} appearAt={-100} />
          ))}
          <div
            style={{
              position: "absolute",
              left: p0.x - 22,
              top: p0.y - 22,
              width: p9.x - p0.x + size + 44,
              height: size + 44,
              borderRadius: 60,
              border: `6px solid ${GREEN}`,
              opacity: ring,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: p0.y + size + 48,
              width: STAGE_W,
              textAlign: "center",
              fontSize: 64,
              fontWeight: 800,
              color: GREEN,
              opacity: ring,
            }}
          >
            one full ten
          </div>
        </Stage>
      </AbsoluteFill>
    );
  }

  // 50 / 100: rows sweep in whole, the decade count doing the talking.
  const rows = unit.upTo / 10;
  const rowAt = (r: number) => Math.round(dur * (0.14 + (r - 1) * (0.7 / Math.max(1, rows - 1))));
  const litRows = 1 + Array.from({ length: rows - 1 }, (_, r) => rowAt(r + 1)).filter((t) => frame >= t).length;
  const lastTick = litRows > 1 ? rowAt(litRows - 1) : null;
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
        Every row is another ten
      </div>
      <Stage>
        {Array.from({ length: litRows * 10 }, (_, i) => (
          <Dot
            key={i}
            i={i}
            size={size}
            appearAt={i < 10 ? -100 : rowAt(Math.floor(i / 10))}
            color={Math.floor(i / 10) % 2 === 0 ? GOLD : BLUE}
          />
        ))}
        <Ticker value={litRows * 10} flashAt={lastTick} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the record --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const tipAt = Math.round(dur * 0.45);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <div
        style={{
          fontSize: 260,
          fontWeight: 800,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.upTo}
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
  count: SceneCount,
  rows: SceneRows,
  record: SceneRecord,
};

export const CountVideo: React.FC<CountProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = countUnitById(unitId);
  const scenes = countSceneTimings(unitId, voice);
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
