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
import { placeValueSceneTimings } from "./timeline";
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

function Title({ text, enter }: { text: string; enter: { opacity: number; translateY: number } }) {
  return (
    <div
      style={{
        fontSize: 76,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

const UNIT = 26; // one "one" cube
const GAP = 4;

/** A rod: ten unit cubes fused into a column. */
function Rod({ x, y, colour = GOLD, dim = false }: { x: number; y: number; colour?: string; dim?: boolean }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: dim ? 0.25 : 1 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            width: UNIT,
            height: UNIT,
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
function One({ x, y, colour = BLUE, dim = false }: { x: number; y: number; colour?: string; dim?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: UNIT,
        height: UNIT,
        backgroundColor: colour,
        border: `2px solid ${EDGE}`,
        borderRadius: 3,
        opacity: dim ? 0.25 : 1,
      }}
    />
  );
}

/** Blocks for a two-digit number: `tens` rods then `ones` singles. */
function Blocks({
  x,
  y,
  tens,
  ones,
  rodColour = GOLD,
  oneColour = BLUE,
  dimRods = false,
  dimOnes = false,
  rodsShown = Infinity,
}: {
  x: number;
  y: number;
  tens: number;
  ones: number;
  rodColour?: string;
  oneColour?: string;
  dimRods?: boolean;
  dimOnes?: boolean;
  rodsShown?: number;
}) {
  const rodStep = UNIT + 10;
  const onesX = x + tens * rodStep + 26;
  return (
    <>
      {Array.from({ length: tens }, (_, i) =>
        i < rodsShown ? <Rod key={i} x={x + i * rodStep} y={y} colour={rodColour} dim={dimRods} /> : null,
      )}
      {Array.from({ length: ones }, (_, i) => (
        <One
          key={`o${i}`}
          x={onesX + (i % 3) * (UNIT + GAP)}
          y={y + Math.floor(i / 3) * (UNIT + GAP)}
          colour={oneColour}
          dim={dimOnes}
        />
      ))}
    </>
  );
}

/** A number line with ticks and an optional marker + hops. */
function NumberLine({
  from,
  to,
  step,
  markAt,
  hopsShown = 0,
  labelEvery = 1,
}: {
  from: number;
  to: number;
  step: number;
  markAt?: number;
  hopsShown?: number;
  labelEvery?: number;
}) {
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
      {markAt !== undefined && (
        <>
          <div
            style={{
              position: "absolute",
              left: posOf(markAt) - 15,
              top: ly - 15,
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: GOLD,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: posOf(markAt) - 90,
              top: ly - 92,
              width: 180,
              textAlign: "center",
              fontSize: 42,
              fontWeight: 800,
              color: GOLD,
            }}
          >
            {markAt}
          </div>
        </>
      )}
    </>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(4);
  const x = placeValueNumbers(unit);
  const step = (k: number) => Math.round(dur * k);

  // ---- tens / ones: bundle, then read one digit --------------------------
  if (unit.mode === "tens" || unit.mode === "ones") {
    const isTens = unit.mode === "tens";
    const bundled = sceneId !== "build" || frame > step(0.45);
    const rodsRevealed =
      sceneId === "action"
        ? Math.min(x.tens, Math.max(0, Math.floor((frame - step(0.15)) / Math.max(1, Math.round((dur * 0.5) / x.tens))) + 1))
        : x.tens;
    const headline =
      sceneId === "ask"
        ? `${unit.n} — what does each digit mean?`
        : sceneId === "build"
          ? bundled
            ? "Bundle every ten"
            : `${unit.n} loose ones`
          : isTens
            ? `Count the rods: ${x.tens}`
            : `Count the loose ones: ${x.ones}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 340 }}>
          {sceneId === "build" && !bundled ? (
            // the loose pile, before bundling
            Array.from({ length: unit.n }, (_, i) => (
              <One key={i} x={120 + (i % 16) * (UNIT + GAP)} y={40 + Math.floor(i / 16) * (UNIT + GAP)} />
            ))
          ) : (
            <Blocks
              x={200}
              y={40}
              tens={x.tens}
              ones={x.ones}
              rodsShown={sceneId === "action" && isTens ? rodsRevealed : Infinity}
              dimRods={sceneId === "action" && !isTens}
              dimOnes={sceneId === "action" && isTens}
            />
          )}
        </div>
        {(sceneId === "action" || sceneId === "record") && (
          <div style={{ fontSize: 52, fontWeight: 800, color: isTens ? GOLD : BLUE }}>
            {isTens ? `${x.tens} tens = ${x.tensValue}` : `${x.ones} ones`}
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>
            {unit.n} = {x.tensValue} + {x.ones}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ---- compare two-digit: rods first ---------------------------------------
  if (unit.mode === "compare2d") {
    const focusRods = sceneId === "action" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `${unit.n} or ${x.n2} — which is bigger?`
        : sceneId === "build"
          ? "Build them both"
          : sceneId === "action"
            ? `Rods first: ${x.tens} against ${x.tens2}`
            : `${x.bigger} is bigger`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 420 }}>
          {sceneId !== "ask" && (
            <>
              <div style={{ position: "absolute", left: 120, top: 8, fontSize: 46, fontWeight: 800, color: INK }}>{unit.n}</div>
              <Blocks x={230} y={0} tens={x.tens} ones={x.ones} dimOnes={focusRods} />
              <div style={{ position: "absolute", left: 120, top: 228, fontSize: 46, fontWeight: 800, color: INK }}>{x.n2}</div>
              <Blocks x={230} y={220} tens={x.tens2} ones={x.ones2} rodColour={GREEN} dimOnes={focusRods} />
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
    const hopsShown =
      sceneId === "action"
        ? Math.min(x.hops, Math.max(0, Math.floor((frame - step(0.12)) / Math.max(1, Math.round((dur * 0.7) / x.hops))) + 1))
        : sceneId === "record"
          ? x.hops
          : 0;
    const headline =
      sceneId === "ask"
        ? `Counting by ${x.step}`
        : sceneId === "build"
          ? `Every hop is ${x.step}`
          : sceneId === "action"
            ? `${x.sequence.slice(0, hopsShown).join(", ") || "..."}`
            : x.sequence.join(", ");
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text={headline} enter={title} />
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
    const showPrev = sceneId === "action" || sceneId === "record";
    const headline =
      sceneId === "ask"
        ? `What comes just before ${unit.n}?`
        : sceneId === "build"
          ? "Before means LEFT"
          : sceneId === "action"
            ? `One step left → ${x.prev}`
            : `${x.prev}, ${unit.n}, ${x.next}`;
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Title text={headline} enter={title} />
        <div style={{ position: "relative", width: STAGE_W, height: 300 }}>
          <NumberLine from={unit.n - 3} to={unit.n + 3} step={1} markAt={showPrev ? x.prev : unit.n} />
          {sceneId !== "ask" && (
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
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.dur}>
          {scene.voiceFile && <Audio src={staticFile(scene.voiceFile)} />}
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
