// src/remotion/lesson/FactFamilyVideo.tsx
// The FACT FAMILY template: one picture, four questions.
//
// Fact families are usually memorised as four separate facts, which is exactly
// backwards — they are ONE relationship, and the four facts are just different
// questions asked of the same picture. So this template draws the picture once
// and then interrogates it four times, highlighting the piece each fact is
// about:
//
//   additive        a part-part-whole bar   (5 and 8 make 13)
//   multiplicative  an array                (3 rows of 4 make 12)
//
// The highlight is the teaching: "13 − 8 = 5" lights the 5-part, so the child
// sees that subtraction is asking which piece is missing.
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
import { factFamilySceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { factFamilyUnitById, factFamilyFacts, type FactFamilyUnit } from "./units";

export { FPS } from "./timeline";

export type FactFamilyProps = {
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

const STAGE_W = 1500;
const STAGE_H = 470;

interface SceneProps {
  dur: number;
  unit: FactFamilyUnit;
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

/**
 * Part-part-whole bar. `lit` says which piece the current fact is about:
 * "whole" | "a" | "b" | null.
 */
function Bar({
  unit,
  lit,
  reveal = 1,
}: {
  unit: FactFamilyUnit;
  lit: "whole" | "a" | "b" | null;
  reveal?: number;
}) {
  const whole = unit.a + unit.b;
  const barW = 1180;
  const aW = (unit.a / whole) * barW;
  const bW = barW - aW;
  const x0 = (STAGE_W - barW) / 2;
  const partY = 190;
  const H = 110;

  const piece = (
    x: number,
    w: number,
    value: number,
    colour: string,
    isLit: boolean,
    key: string,
  ) => (
    <div key={key}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: partY,
          width: w,
          height: H,
          borderRadius: 12,
          backgroundColor: colour,
          opacity: isLit ? 1 : 0.32,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x,
          top: partY + 26,
          width: w,
          textAlign: "center",
          fontSize: 62,
          fontWeight: 800,
          color: "#fff",
          opacity: isLit ? 1 : 0.55,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <>
      {/* the whole, drawn above the two parts */}
      <div
        style={{
          position: "absolute",
          left: x0,
          top: 40,
          width: barW * reveal,
          height: H,
          borderRadius: 12,
          backgroundColor: GREEN,
          opacity: lit === "whole" || lit === null ? 1 : 0.32,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x0,
          top: 66,
          width: barW,
          textAlign: "center",
          fontSize: 62,
          fontWeight: 800,
          color: "#fff",
          opacity: reveal > 0.9 ? (lit === "whole" || lit === null ? 1 : 0.55) : 0,
        }}
      >
        {whole}
      </div>
      {piece(x0, aW, unit.a, GOLD, lit === "a" || lit === null, "a")}
      {piece(x0 + aW, bW, unit.b, BLUE, lit === "b" || lit === null, "b")}
    </>
  );
}

/** Array picture: `a` rows of `b`. `lit` highlights a row or a column. */
function Grid({
  unit,
  lit,
  shown = Infinity,
}: {
  unit: FactFamilyUnit;
  lit: "rows" | "cols" | null;
  shown?: number;
}) {
  const cell = 92;
  const gap = 12;
  const w = unit.b * cell + (unit.b - 1) * gap;
  const h = unit.a * cell + (unit.a - 1) * gap;
  const x0 = (STAGE_W - w) / 2;
  const y0 = (STAGE_H - h) / 2 - 20;
  return (
    <>
      {Array.from({ length: unit.a * unit.b }, (_, i) => {
        const r = Math.floor(i / unit.b);
        const c = i % unit.b;
        // Rows lit gold, columns lit blue — the two readings of one array.
        const colour = lit === "rows" ? GOLD : lit === "cols" ? BLUE : GOLD;
        const emphasis = lit === "rows" ? (r === 0 ? 1 : 0.4) : lit === "cols" ? (c === 0 ? 1 : 0.4) : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + c * (cell + gap),
              top: y0 + r * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: 12,
              backgroundColor: colour,
              opacity: i < shown ? emphasis : 0,
            }}
          />
        );
      })}
    </>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

// ---- Scene 1: the three numbers ------------------------------------------
function SceneAsk({ unit }: SceneProps) {
  const a = useEnter(6);
  const b = useEnter(40);
  const whole = unit.kind === "additive" ? unit.a + unit.b : unit.a * unit.b;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div
        style={{
          fontSize: 170,
          fontWeight: 800,
          color: INK,
          opacity: a.opacity,
          translate: `0 ${a.translateY}px`,
        }}
      >
        {unit.a} · {unit.b} · {whole}
      </div>
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        Three numbers that belong together.
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build the one picture --------------------------------------
function SceneBuild({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const growAt = Math.round(dur * 0.22);
  const reveal = interpolate(frame, [growAt, growAt + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const cells = unit.a * unit.b;
  const shown = Math.max(0, Math.min(cells, Math.floor((frame - growAt) / 3) + 1));
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
        {unit.kind === "additive"
          ? `${unit.a} and ${unit.b} make ${unit.a + unit.b}`
          : `${unit.a} rows of ${unit.b}`}
      </div>
      <Stage>
        {unit.kind === "additive" ? (
          <Bar unit={unit} lit={null} reveal={reveal} />
        ) : (
          <Grid unit={unit} lit={null} shown={shown} />
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: four questions of the same picture -------------------------
function SceneFacts({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const facts = factFamilyFacts(unit);
  const startAt = Math.round(dur * 0.12);
  const per = Math.floor((dur - startAt - 20) / facts.length);
  const current = Math.max(0, Math.min(facts.length - 1, Math.floor((frame - startAt) / per)));
  const active = frame >= startAt ? facts[current] : null;

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
        Same picture, four questions
      </div>
      <Stage>
        {unit.kind === "additive" ? (
          <Bar unit={unit} lit={(active?.lit as "whole" | "a" | "b") ?? null} />
        ) : (
          <Grid unit={unit} lit={(active?.lit as "rows" | "cols") ?? null} />
        )}
      </Stage>
      {/* The four facts, the current one in ink and full size. */}
      <div style={{ display: "flex", gap: 44, flexWrap: "wrap", justifyContent: "center" }}>
        {facts.map((f, i) => {
          const revealed = frame >= startAt + i * per;
          const isCurrent = revealed && i === current;
          return (
            <div
              key={f.text}
              style={{
                fontSize: 66,
                fontWeight: 800,
                color: isCurrent ? INK : MUTED,
                opacity: revealed ? (isCurrent ? 1 : 0.42) : 0,
              }}
            >
              {f.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the family --------------------------------------------------
function SceneRecord({ dur, unit }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const facts = factFamilyFacts(unit);
  const tipAt = Math.round(dur * 0.55);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div
        style={{
          fontSize: 92,
          fontWeight: 700,
          color: INK,
          opacity: title.opacity,
          translate: `0 ${title.translateY}px`,
        }}
      >
        The whole family
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 80px" }}>
        {facts.map((f, i) => (
          <div
            key={f.text}
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: INK,
              textAlign: "center",
              opacity: interpolate(frame, [10 + i * 8, 10 + i * 8 + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {f.text}
          </div>
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
  build: SceneBuild,
  facts: SceneFacts,
  record: SceneRecord,
};

export const FactFamilyVideo: React.FC<FactFamilyProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = factFamilyUnitById(unitId);
  const scenes = factFamilySceneTimings(unitId, voice);
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
      <Brand />
    </AbsoluteFill>
  );
};
