// src/remotion/lesson/ColumnVideo.tsx
// The BASE-TEN BLOCKS template: what carrying and borrowing actually are.
//
// Carrying is normally taught as ritual — "put the 1 above the next column" —
// and most children never learn what the 1 IS. Here they watch ten unit cubes
// snap together into a ten-rod and slide into the tens column; borrowing is the
// same machinery in reverse, a rod breaking apart into ten units. The written
// algorithm is then shown as a record of what they just saw happen.
//
// Every number comes from the unit (src/remotion/lesson/units.ts).
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
import { columnSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { columnUnitById, type ColumnUnit } from "./units";

export { FPS } from "./timeline";

export type ColumnProps = {
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

const UNIT = 34; // one-cube edge
const ROD_W = UNIT;
const ROD_H = UNIT * 10 + 9 * 3;

interface SceneProps {
  dur: number;
  unit: ColumnUnit;
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

/** A ten-rod: ten cubes fused into a column, so a rod IS visibly ten ones. */
function Rod({ opacity = 1, highlight = false }: { opacity?: number; highlight?: boolean }) {
  return (
    <div
      style={{
        width: ROD_W,
        height: ROD_H,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        opacity,
        outline: `3px solid ${CREAM}`,
      }}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            width: UNIT,
            height: UNIT,
            borderRadius: 4,
            backgroundColor: highlight ? GREEN : BLUE,
          }}
        />
      ))}
    </div>
  );
}

function Cube({ opacity = 1, highlight = false }: { opacity?: number; highlight?: boolean }) {
  return (
    <div
      style={{
        width: UNIT,
        height: UNIT,
        borderRadius: 4,
        backgroundColor: highlight ? GREEN : GOLD,
        opacity,
      }}
    />
  );
}

/** Loose cubes wrap at ten per row so "more than ten" is visible at a glance. */
function Cubes({
  n,
  highlightUpTo = -1,
  opacity = 1,
}: {
  n: number;
  /** Index from which cubes turn green — the ten about to be regrouped. */
  highlightUpTo?: number;
  opacity?: number;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, width: UNIT * 10 + 9 * 3, opacity }}>
      {Array.from({ length: n }, (_, i) => (
        <Cube key={i} highlight={highlightUpTo >= 0 && i < highlightUpTo} />
      ))}
    </div>
  );
}

function ColumnHead({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 40, color: MUTED, fontWeight: 700, letterSpacing: 1 }}>{label}</div>
  );
}

// ---- Scene 1: the question ------------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(38);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 190,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {unit.x} {unit.op} {unit.y}
      </div>
      <div
        style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}
      >
        Let&apos;s build it out of blocks.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: both numbers as blocks --------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const title = useEnter(4);
  const frame = useCurrentFrame();
  const rowAt = (r: number) => Math.round(dur * (0.18 + r * 0.34));
  // Subtraction builds only the number being taken FROM — showing both as
  // blocks would suggest you're combining them, which is the opposite idea.
  const rows =
    unit.op === "−"
      ? [{ n: unit.x, tens: Math.floor(unit.x / 10), ones: unit.x % 10 }]
      : [
          { n: unit.x, tens: Math.floor(unit.x / 10), ones: unit.x % 10 },
          { n: unit.y, tens: Math.floor(unit.y / 10), ones: unit.y % 10 },
        ];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        {unit.op === "−" ? `${unit.x} to start with` : `${unit.x} and ${unit.y}`}
      </div>
      <div style={{ display: "flex", gap: 90 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="TENS" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="ONES" />
        </div>
      </div>
      {rows.map((row, r) => {
        const o = interpolate(frame, [rowAt(r), rowAt(r) + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={r} style={{ display: "flex", gap: 90, alignItems: "flex-start", opacity: o }}>
            <div style={{ display: "flex", gap: 16, width: 420, justifyContent: "flex-end" }}>
              {Array.from({ length: row.tens }, (_, i) => (
                <Rod key={i} />
              ))}
            </div>
            <div style={{ width: 340 }}>
              <Cubes n={row.ones} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---- Scene 3: the regroup — ten ones become one ten -----------------------
function SceneRegroup(props: SceneProps) {
  // Subtraction is the same machinery in reverse, but reversing it inside one
  // component made every branch unreadable — so borrowing has its own scene.
  if (props.unit.op === "−") return <SceneBorrow {...props} />;
  return <SceneCarry {...props} />;
}

/** Borrowing: a ten-rod visibly breaks apart into ten ones. */
function SceneBorrow({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const xTens = Math.floor(unit.x / 10);
  const xOnes = unit.x % 10;
  const yOnes = unit.y % 10;
  const borrows = xOnes < yOnes;

  // Beat 1: what we have. Beat 2: the rod being borrowed goes green.
  // Beat 3: it shatters into ten ones and joins the ones column.
  const markAt = Math.round(dur * 0.34);
  const breakAt = Math.round(dur * 0.56);
  const marked = frame >= markAt;
  const broken = interpolate(frame, [breakAt, breakAt + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const done = broken > 0.5;

  const tensShown = borrows && done ? xTens - 1 : xTens;
  const onesShown = borrows && done ? xOnes + 10 : xOnes;

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
        {borrows ? "Not enough ones — borrow a ten" : "Take them away"}
      </div>
      <div style={{ display: "flex", gap: 90, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="TENS" />
          <div style={{ display: "flex", gap: 16, minHeight: ROD_H }}>
            {Array.from({ length: tensShown }, (_, i) => (
              <Rod key={i} />
            ))}
            {borrows && !done && (
              // The rod about to be broken up, flagged before it goes.
              <div style={{ opacity: 1 - broken * 0.6 }}>
                <Rod highlight={marked} />
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="ONES" />
          <div style={{ minHeight: ROD_H, display: "flex", alignItems: "flex-start" }}>
            <Cubes n={onesShown} highlightUpTo={borrows && done ? 10 : -1} />
          </div>
        </div>
      </div>
      {borrows && (
        <div style={{ fontSize: 54, color: GREEN, fontWeight: 700, opacity: broken }}>
          one ten = ten ones
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Carrying: ten loose ones fuse into a rod and move to the tens. */
function SceneCarry({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const onesTotal = (unit.x % 10) + (unit.y % 10);
  const tensTotal = Math.floor(unit.x / 10) + Math.floor(unit.y / 10);
  const carries = onesTotal >= 10;
  const leftover = onesTotal % 10;

  // Beat 1: all the ones together. Beat 2: ten of them turn green. Beat 3:
  // they fuse into a rod and move to the tens column.
  const gatherAt = Math.round(dur * 0.12);
  const markAt = Math.round(dur * 0.4);
  const fuseAt = Math.round(dur * 0.62);

  const marked = frame >= markAt;
  const fused = interpolate(frame, [fuseAt, fuseAt + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

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
        {carries ? "Ten ones make a ten" : "Put them together"}
      </div>
      <div style={{ display: "flex", gap: 90, alignItems: "flex-start" }}>
        {/* Tens column — gains the new rod as it arrives */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="TENS" />
          <div style={{ display: "flex", gap: 16, minHeight: ROD_H }}>
            {Array.from({ length: tensTotal }, (_, i) => (
              <Rod key={i} />
            ))}
            {carries && (
              <div style={{ opacity: fused, scale: String(0.7 + 0.3 * fused) }}>
                <Rod highlight />
              </div>
            )}
          </div>
        </div>
        {/* Ones column — ten of them go green, then leave */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <ColumnHead label="ONES" />
          <div style={{ minHeight: ROD_H, display: "flex", alignItems: "flex-start" }}>
            <Cubes
              n={carries && fused > 0.5 ? leftover : onesTotal}
              highlightUpTo={marked && !(fused > 0.5) ? 10 : -1}
              opacity={interpolate(frame, [gatherAt, gatherAt + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />
          </div>
        </div>
      </div>
      {carries && (
        <div
          style={{
            fontSize: 54,
            color: GREEN,
            fontWeight: 700,
            opacity: fused,
          }}
        >
          that&apos;s the little 1 you carry
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---- Scene 4: the written algorithm as a record ---------------------------
function SceneWritten({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const answer = unit.op === "+" ? unit.x + unit.y : unit.x - unit.y;
  const carryAt = Math.round(dur * 0.3);
  const answerAt = Math.round(dur * 0.6);
  const carries = (unit.x % 10) + (unit.y % 10) >= 10;
  const col = (s: string) => s.padStart(3, " ");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        Writing it down
      </div>
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 140,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.12,
          textAlign: "right",
          whiteSpace: "pre",
        }}
      >
        {carries && unit.op === "+" && (
          <div style={{ fontSize: 56, color: GREEN, opacity: interpolate(frame, [carryAt, carryAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {"  1  "}
          </div>
        )}
        <div>{col(String(unit.x))}</div>
        <div>
          {unit.op} {col(String(unit.y))}
        </div>
        <div style={{ borderTop: `6px solid ${INK}`, paddingTop: 8 }}>
          <span
            style={{
              opacity: interpolate(frame, [answerAt, answerAt + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {col(String(answer))}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENE_BODIES: Record<string, React.FC<SceneProps>> = {
  ask: SceneAsk,
  build: SceneBuild,
  regroup: SceneRegroup,
  written: SceneWritten,
};

export const ColumnVideo: React.FC<ColumnProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = columnUnitById(unitId);
  const scenes = columnSceneTimings(unitId, voice);
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
