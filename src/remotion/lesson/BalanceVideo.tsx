// src/remotion/lesson/BalanceVideo.tsx
// The BALANCE SCALE template (M10): an equation is a scale that is level.
//
// Solving is taught almost everywhere as "move it to the other side and flip
// the sign", which is a rule with no reason attached. Here the reason is the
// picture: the beam is level, so whatever you take off one pan you must take
// off the other, or it tips. The weights physically leave BOTH pans at the
// same moment — that simultaneity IS the rule.
//
// An inequality is the same scale, tipped, and every legal move keeps the tilt.
//
// Sync (Sep 2026): every reveal that shows a number the narrator says is timed
// with `said(n, fallback, occurrence)` from the scene's clip alignment. The
// equation enters number by number; boxes land on "2 boxes" and each pile of
// weights on its count; a "take N off" move starts on that N (the one-step
// line takes it off the left first, the beam tips, then off the right on the
// second N and re-levels); the count badge on the right pan lands on "right is
// N"; the split into `coef` rows lands on the second "2" and the spare rows
// leave on "4 on the right"; the answer lands on its value and the box opens
// on "put 5 back in the box". Reveals that follow a word rather than a number
// (titles, "still level", the tip) keep their frames and are marked
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
import { balanceSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { balanceUnitById, balanceSolution, type BalanceUnit } from "./units";

export { FPS } from "./timeline";

export type BalanceProps = {
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
const BEAM = "#8A5E10";

const STAGE_W = 1500;
const STAGE_H = 600;

const PIVOT_X = STAGE_W / 2;
const PIVOT_Y = 300;
const BEAM_HALF = 480;
const PAN_DROP = 130;
const W = 54; // weight size

const CARRIED = 0; // not-speech-bound: on screen from the scene's first frame

interface SceneProps {
  dur: number;
  unit: BalanceUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want, given the numbers
 *  the line says ahead of it. The lists mirror `balanceLines` (script.ts) word
 *  for word: "Take 3 off the left… take 3 off the RIGHT" says 3 twice, and only
 *  the second empties the right pan. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

const clamp01 = (frame: number, from: number, span: number) =>
  interpolate(frame, [from, from + span], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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

/** Split a phrase like "2x + 3 = 11" into parts that appear on the frame each
 *  number is said; text between numbers appears with the number that follows
 *  it, trailing text with the number before it, and a phrase with no numbers
 *  at all on `fallback`. `spokenBefore` lists the numbers the line says ahead
 *  of the phrase, so occurrences line up. */
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

/** A single unit weight. */
function Weight({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: W,
        height: W,
        borderRadius: 8,
        backgroundColor: GOLD,
        opacity,
      }}
    />
  );
}

/** A box holding the unknown. */
function XBox({ x, y, size = 92, opened = 0, value, opacity = 1 }: { x: number; y: number; size?: number; opened?: number; value?: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: opened > 0.5 ? GREEN : BLUE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.5,
        fontWeight: 800,
        opacity,
      }}
    >
      {opened > 0.5 && value !== undefined ? value : "x"}
    </div>
  );
}

/** The count of weights left on a pan, named as the narrator names it. */
function CountBadge({ value, opacity }: { value: number; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 430,
        top: 170 - 92,
        minWidth: 80,
        height: 80,
        padding: "0 16px",
        borderRadius: 40,
        backgroundColor: GREEN,
        color: "#fff",
        fontSize: 52,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {value}
    </div>
  );
}

/**
 * The scale. `tilt` is degrees (negative = left side down). Pans hang from the
 * beam ends, so a tilt visibly raises one pan and drops the other.
 */
function Scale({
  tilt,
  left,
  right,
}: {
  tilt: number;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const rad = (tilt * Math.PI) / 180;
  const dy = Math.sin(rad) * BEAM_HALF;
  const leftPanY = PIVOT_Y - dy;
  const rightPanY = PIVOT_Y + dy;
  return (
    <>
      {/* stand */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 8,
          top: PIVOT_Y,
          width: 16,
          height: 230,
          backgroundColor: BEAM,
          borderRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 110,
          top: PIVOT_Y + 224,
          width: 220,
          height: 18,
          backgroundColor: BEAM,
          borderRadius: 8,
        }}
      />
      {/* beam */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - BEAM_HALF,
          top: PIVOT_Y - 7,
          width: BEAM_HALF * 2,
          height: 14,
          backgroundColor: BEAM,
          borderRadius: 7,
          rotate: `${tilt}deg`,
        }}
      />
      {/* pans */}
      {[
        { x: PIVOT_X - BEAM_HALF, y: leftPanY, node: left },
        { x: PIVOT_X + BEAM_HALF, y: rightPanY, node: right },
      ].map((p, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: p.x - 2,
              top: p.y,
              width: 4,
              height: PAN_DROP,
              backgroundColor: BEAM,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: p.x - 210,
              top: p.y + PAN_DROP,
              width: 420,
              height: 14,
              backgroundColor: BEAM,
              borderRadius: 7,
            }}
          />
          {/* pan contents sit ON the tray */}
          <div style={{ position: "absolute", left: p.x - 210, top: p.y + PAN_DROP - 170, width: 420, height: 170 }}>
            {p.node}
          </div>
        </div>
      ))}
    </>
  );
}

/** Lay weights out in the pan, bottom-aligned, wrapping at 6 per row. */
function pileLayout(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: 210 - Math.min(count, 6) * (W + 8) / 2 + (i % 6) * (W + 8),
    y: 170 - W - 6 - Math.floor(i / 6) * (W + 8),
  }));
}

/** The same weights re-laid as `parts` equal rows of `each` — "split both
 *  sides into 2" makes the 8 on the right two rows of 4. */
function splitLayout(each: number, parts: number) {
  return Array.from({ length: each * parts }, (_, i) => ({
    x: 210 - each * (W + 8) / 2 + (i % each) * (W + 8),
    y: 170 - W - 6 - Math.floor(i / each) * (W + 8),
  }));
}

/** Frames between successive weights of one pile, so the whole pile is down
 *  within ~0.4 s of its count being said (3 weights: 3 apart; 11: 1 apart). */
const pileStep = (count: number) => Math.max(1, Math.min(3, Math.floor(8 / Math.max(1, count - 1))));
const WEIGHT_FADE = 5;

function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>{children}</div>;
}

/** The headline of a scene, split so each number enters on its word. */
function Title({ parts }: { parts: TextPart[] }) {
  return <Parts parts={parts} style={{ fontSize: 82, fontWeight: 700, color: INK }} />;
}

function equationText(u: BalanceUnit) {
  const c = u.coef === 1 ? "" : String(u.coef);
  return `${c}x + ${u.constL} ${u.rel} ${u.constR}`;
}

// ---- Scene 1: the question -----------------------------------------------
function SceneAsk({ unit, said }: SceneProps) {
  // "2x + 3 equals 11. What is x?" — each number enters on its word.
  const parts = numberParts(equationText(unit), said, 6, []);
  const b = useEnter(40); // not-speech-bound: "What is x?" names no number
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Parts style={{ fontSize: 170, fontWeight: 800, color: INK }} parts={parts} />
      <div style={{ fontSize: 56, color: MUTED, opacity: b.opacity, translate: `0 ${b.translateY}px` }}>
        {unit.rel === "=" ? "Think of it as a scale." : "A scale that's tipped."}
      </div>
    </AbsoluteFill>
  );
}

// ---- Scene 2: build the scale --------------------------------------------
function SceneBuild({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const at = Math.round(dur * 0.2); // not-speech-bound: only for clips without alignment
  const tilt = unit.rel === ">" ? 7 : 0;
  // "On the left: 2 boxes… and 3 weights. On the right: 8 weights." The single
  // box of a one-step unit ("a box holding x") is named without a number, so it
  // is on screen from the start as before.
  const spoken: number[] = [];
  const boxAt = unit.coef > 1 ? said(unit.coef, CARRIED, 0) : CARRIED;
  if (unit.coef > 1) spoken.push(unit.coef);
  const leftAt = said(unit.constL, at, before(unit.constL, spoken));
  spoken.push(unit.constL);
  const rightAt = said(unit.constR, at, before(unit.constR, spoken));
  const leftPile = pileLayout(unit.constL);
  const rightPile = pileLayout(unit.constR);
  const leftStep = pileStep(unit.constL);
  const rightStep = pileStep(unit.constR);
  const boxSize = 92;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title parts={[{ text: unit.rel === "=" ? "Level — both sides weigh the same" : "Tipped — the left is heavier", at: 4 }]} /> {/* not-speech-bound */}
      <Stage>
        <Scale
          tilt={tilt}
          left={
            <>
              {Array.from({ length: unit.coef }, (_, i) => (
                <XBox
                  key={i}
                  x={40 + i * (boxSize + 12)}
                  y={170 - boxSize - 6}
                  size={boxSize}
                  opacity={clamp01(frame, boxAt + i * 4, 8)}
                />
              ))}
              {leftPile.map((p, i) => (
                <Weight key={i} x={p.x + 90} y={p.y} opacity={clamp01(frame, leftAt + i * leftStep, WEIGHT_FADE)} />
              ))}
            </>
          }
          right={
            <>
              {rightPile.map((p, i) => (
                <Weight key={i} x={p.x} y={p.y} opacity={clamp01(frame, rightAt + i * rightStep, WEIGHT_FADE)} />
              ))}
            </>
          }
        />
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 3: take the same off both sides -------------------------------
function SceneSolve({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = balanceSolution(unit);
  const twoStep = unit.coef > 1;
  // The one-step line takes the constant off the LEFT first ("Take 3 off the
  // left… it tips. So take 3 off the RIGHT as well"); the two-step and
  // inequality lines take it off both sides on one "3" / "2".
  const leftFirst = !twoStep && unit.rel === "=";

  const removeAt = Math.round(dur * 0.22); // not-speech-bound: only for clips without alignment
  const removeSpan = 22;
  const spoken: number[] = [];
  const removeLeftAt = said(unit.constL, removeAt, 0);
  spoken.push(unit.constL);
  const removeRightAt = leftFirst ? said(unit.constL, removeAt, 1) : removeLeftAt;
  if (leftFirst) spoken.push(unit.constL);
  if (twoStep) spoken.push(unit.coef); // "Left is 2 boxes" — already on screen
  const removedL = clamp01(frame, removeLeftAt, removeSpan);
  const removedR = clamp01(frame, removeRightAt, removeSpan);
  const constGone = removedR > 0.9;
  // "right is 8" — the count badge lands on the number.
  const badgeAt = said(n.afterConst, removeAt + removeSpan, before(n.afterConst, spoken));
  spoken.push(n.afterConst);

  // Beat 2 (two-step only): "split both sides into 2… one box on the left, 4 on
  // the right" — the rows form on the second "2", the spare rows leave on "4".
  const splitFallback = Math.round(dur * 0.66); // not-speech-bound: only for clips without alignment
  const splitAt = twoStep ? said(unit.coef, splitFallback, before(unit.coef, spoken)) : Number.MAX_SAFE_INTEGER;
  if (twoStep) spoken.push(unit.coef);
  const halveAt = twoStep ? said(n.x, splitAt, before(n.x, spoken)) : Number.MAX_SAFE_INTEGER;
  const splitP = twoStep ? clamp01(frame, splitAt, 10) : 0;
  const split = twoStep && frame >= splitAt;
  const halved = twoStep ? clamp01(frame, halveAt, 14) : 0;

  // The beam: an inequality stays tipped; a one-step equation tips after the
  // left loses its weights and re-levels when the right does.
  const baseTilt = unit.rel === ">" ? 7 : 0;
  const tipGap = removeRightAt - (removeLeftAt + removeSpan);
  const tip =
    leftFirst && tipGap > 12
      ? interpolate(frame, [removeLeftAt + removeSpan, removeLeftAt + removeSpan + 12, removeRightAt, removeRightAt + removeSpan], [0, 7, 7, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const tilt = baseTilt + tip;

  const boxSize = 92;
  const leftPile = pileLayout(unit.constL);
  const rightPile = pileLayout(unit.constR);
  const rows = twoStep ? splitLayout(n.x, unit.coef) : rightPile;

  const takeTitle = numberParts(`Take ${unit.constL} off BOTH sides`, said, 4, []);
  const splitTitle = numberParts(`Split both sides into ${unit.coef}`, said, splitAt, spoken.slice(0, spoken.indexOf(n.afterConst) + 1));

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Title parts={split ? splitTitle : takeTitle} />
      <Stage>
        <Scale
          tilt={tilt}
          left={
            <>
              {Array.from({ length: unit.coef }, (_, i) => (
                <XBox
                  key={i}
                  x={40 + i * (boxSize + 12)}
                  y={170 - boxSize - 6}
                  size={boxSize}
                  opacity={i === 0 ? 1 : 1 - splitP}
                />
              ))}
              {/* the constants lift off the left pan */}
              {removedL < 1 &&
                leftPile.map((p, i) => (
                  <Weight key={i} x={p.x + 90} y={p.y - removedL * 220} opacity={1 - removedL} />
                ))}
            </>
          }
          right={
            <>
              {rightPile.map((p, i) => {
                if (i >= n.afterConst) {
                  // the matching weights leave the right pan on the second "3"
                  return removedR < 1 ? <Weight key={i} x={p.x} y={p.y - removedR * 220} opacity={1 - removedR} /> : null;
                }
                const q = rows[i];
                const x = p.x + (q.x - p.x) * splitP;
                const y = p.y + (q.y - p.y) * splitP;
                const spare = twoStep && i >= n.x;
                const lift = spare ? halved : 0;
                return lift < 1 ? <Weight key={i} x={x} y={y - lift * 220} opacity={1 - lift} /> : null;
              })}
              <CountBadge value={halved > 0.5 ? n.x : n.afterConst} opacity={clamp01(frame, badgeAt, 8)} />
            </>
          }
        />
        {constGone && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: STAGE_H - 40,
              width: STAGE_W,
              textAlign: "center",
              fontSize: 54,
              fontWeight: 700,
              color: GREEN,
            }}
          >
            {/* not-speech-bound: "still level" follows the move, not a number */}
            {unit.rel === "=" ? "still level" : "still tipped the same way"}
          </div>
        )}
      </Stage>
    </AbsoluteFill>
  );
}

// ---- Scene 4: the answer --------------------------------------------------
function SceneRecord({ dur, unit, said }: SceneProps) {
  const frame = useCurrentFrame();
  const n = balanceSolution(unit);
  const value = unit.rel === "=" ? n.x : n.afterConst;
  // "So x is 5" — the answer lands on its value; "put 5 back in the box" opens
  // the box on the last "5".
  const valueAt = said(value, 0, 0);
  const openAt = said(value, Math.round(dur * 0.3), -1); // not-speech-bound: fallback only
  const tipAt = Math.round(dur * 0.62); // not-speech-bound: the tip names no number
  const opened = frame >= openAt ? 1 : 0;
  const valueEnter = useEnter(valueAt);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Title parts={[{ text: unit.rel === "=" ? "So x is…" : "So x can be…", at: 4 }]} /> {/* not-speech-bound */}
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        {/* the box is absolutely positioned, so give it a slot in the row */}
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <XBox x={0} y={0} size={140} opened={opened} value={n.x} />
        </div>
        <span style={{ fontSize: 120, fontWeight: 800, color: MUTED }}>{unit.rel}</span>
        <span style={{ fontSize: 150, fontWeight: 800, color: GREEN, opacity: valueEnter.opacity, translate: `0 ${valueEnter.translateY}px` }}>
          {value}
        </span>
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, color: INK, opacity: valueEnter.opacity }}>
        {unit.rel === "=" ? `x = ${n.x}` : `x > ${n.afterConst}`}
      </div>
      <div
        style={{
          fontSize: 52,
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
  solve: SceneSolve,
  record: SceneRecord,
};

export const BalanceVideo: React.FC<BalanceProps> = ({
  unit: unitId,
  voice = DEFAULT_VOICE_KEY,
}) => {
  const { width } = useVideoConfig();
  const unit = balanceUnitById(unitId);
  const scenes = balanceSceneTimings(unitId, voice);
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
