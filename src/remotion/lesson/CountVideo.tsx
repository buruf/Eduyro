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
import { countSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
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
  voice: string;
  /** Scene-local frame at which the narrator says a number (timeline.ts
   *  `saidFor`). Every reveal that shows something she counts or names is
   *  timed with this, never with a fraction of the scene. */
  said: SaidFn;
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
function SceneAsk({ unit, said }: SceneProps) {
  // "Let's count to 10…" / "Counting to 50 sounds like a lot…" / "This is 7."
  // — the big number lands the first time she says it.
  const a = useEnter(said(unit.upTo, 6));
  // Recognition: "But what does 7 actually mean?" — the question lands on the
  // second 7. The counting lines' subtitles name no number.
  const b = useEnter(unit.mode === "recognise" ? said(unit.upTo, 40, -1) : 40); // not-speech-bound (count modes)
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
function SceneCount({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4); // "Count with me" — not-speech-bound
  const n = Math.min(unit.upTo, 10);
  const size = dotSize(unit.upTo);
  // Each dot lands the moment the narrator SAYS its number — real word
  // timestamps from the voice build. Even spacing was the old behaviour and
  // it drifted badly (user-caught: dot 7 landing on "five"); it survives only
  // as the fallback for clips that predate timestamp capture.
  const firstAt = Math.round(dur * 0.16); // not-speech-bound: fallback only
  const lastAt = Math.round(dur * 0.86); // not-speech-bound: fallback only
  const stepF = (lastAt - firstAt) / Math.max(1, n - 1);
  // LAST occurrence: the line SAYS the target early ("The first row is just
  // counting to 10. 1… 2…"), and the counted number is always the later mention.
  const dotAt = Array.from({ length: n }, (_, i) => said(i + 1, firstAt + i * stepF, -1));
  const appeared = dotAt.filter((t) => frame >= t).length;
  const lastTick = appeared > 0 ? dotAt[appeared - 1] : null;
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
          <Dot key={i} i={i} size={size} appearAt={dotAt[i]} />
        ))}
        <Ticker value={appeared} flashAt={lastTick} />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: the structure ----------------------------------------------
function SceneRows({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const size = dotSize(unit.upTo);
  // Scene titles ("Two ways to write the same thing", "Every row is another
  // ten") name nothing she counts — not-speech-bound. The 10-unit's title IS
  // the number ("10 fills a whole row"), so it waits for "10".
  const title = useEnter(unit.upTo === 10 && unit.mode === "count" ? said(unit.upTo, 4) : 4);
  // Recognition: "The numeral 7… and 7 things." — the numeral on the first 7,
  // the things on the second. Both were on screen from frame 0 before, which
  // stays the fallback for clips without alignment. (Hooks run for every
  // mode; only the recognise branch reads them.)
  const numeral = useEnter(said(unit.upTo, 0, 0));
  const things = useEnter(said(unit.upTo, 0, -1));

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
          <div
            style={{
              fontSize: 300,
              fontWeight: 800,
              color: BLUE,
              opacity: numeral.opacity,
              translate: `0 ${numeral.translateY}px`,
            }}
          >
            {unit.upTo}
          </div>
          <div style={{ fontSize: 90, color: MUTED, fontWeight: 700, opacity: things.opacity }}>=</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              width: 4 * (72 + 16),
              opacity: things.opacity,
              translate: `0 ${things.translateY}px`,
            }}
          >
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
    // The full row IS the point: ten exactly fills it. "And look — 10 of them
    // fill a whole row, exactly." — the ring closes a beat after "10", once the
    // title has landed on the same word.
    const ringAt = said(unit.upTo, Math.round(dur * 0.4) - 6) + 6; // not-speech-bound: fallback only (unchanged)
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

  // 50 / 100: rows sweep in whole, the decade count doing the talking — each
  // row lands when its decade is SPOKEN ("20… 30… 40…"), with the old even
  // spread as the no-timestamp fallback.
  const rows = unit.upTo / 10;
  // "Every full row is another ten… 20… 30… 40… 50." — each decade is said
  // once, so the first occurrence is the counted one.
  const rowAt = (r: number) =>
    said((r + 1) * 10, Math.round(dur * (0.14 + (r - 1) * (0.7 / Math.max(1, rows - 1))))); // not-speech-bound: fallback only
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
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  // "And that's 50." / "You counted to 10." / "So that's 7." — the big
  // numeral lands the first time she says it.
  const title = useEnter(said(unit.upTo, 4, 0));
  // The tip follows: "Count the rows of ten — 10, 20, 30…", "100 is just 10
  // rows of ten". It lands on the FIRST number inside the tip — the second
  // mention when that number is the target itself ("that's 100. 100 is…").
  // Tips with no number ("The last number you say is how many there are")
  // keep the old fixed moment.
  const tipFallback = Math.round(dur * 0.45); // not-speech-bound: fallback only
  const tipFirst = unit.tip.match(/\d+/)?.[0];
  const tipAt =
    tipFirst === undefined
      ? tipFallback
      : said(Number(tipFirst), tipFallback, Number(tipFirst) === unit.upTo ? 1 : 0);
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
        const said = saidFor(unit.id, voice, scene.id);
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
            {/* Voice and picture share this Sequence's clock, so the line
                always starts exactly when its scene does. */}
            {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
            <Body dur={scene.dur} unit={unit} voice={voice} said={said} />
          </Sequence>
        );
      })}
      <Brand />
    </AbsoluteFill>
  );
};
