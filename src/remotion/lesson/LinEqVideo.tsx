// src/remotion/lesson/LinEqVideo.tsx
// The LINEAR EQUATIONS template (M11, Grade 8).
//
// Four of the five modes are the same picture: a LEDGER, where each line of
// working is one row and the operation applied sits between the rows, written
// once on each side. That layout is the argument — you can see that both
// sides got the same treatment, which is the only rule in the topic.
//
// The fifth, transformations, needs a coordinate plane instead: a point, its
// image, and a dashed line showing the journey.
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
import { linEqSceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { linEqUnitById, linEqNumbers, type LinEqUnit } from "./units-lineq";

export type LinEqProps = {
  unit: string;
  voice: string;
  [key: string]: unknown;
};

const CREAM = "#FDFAF4";
const INK = "#2E2016";
const GOLD = "#C8902A";
const BLUE = "#1B4F8A";
const GREEN = "#2F7D4F";
const RED = "#A8321E";
const MUTED = "#8A7A5E";

const STAGE_W = 1500;

interface SceneProps {
  dur: number;
  unit: LinEqUnit;
  sceneId: string;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`). */
  said: SaidFn;
}

/** A piece of a written line and the frame it earns its place on. */
type Part = { text: string; at: number };

/** Split a written line ("3x − 4", "÷ 3", "(3, 2)") into parts that appear on
 *  the frame each number is SAID. `occ` gives, in order, which occurrence of
 *  each number in the scene's line this row means (-1 = the last one); text
 *  between numbers rides with the number that follows it, trailing text with
 *  the number before. `occ = null` means the row follows no spoken number in
 *  this scene (it was earned in an earlier one), so the whole line keeps the
 *  template's own frame. */
function numberParts(phrase: string, said: SaidFn, fallback: number, occ: number[] | null): Part[] {
  if (!occ) return [{ text: phrase, at: fallback }]; // not-speech-bound
  const tokens = phrase.split(/(\d+)/).filter((t) => t.length > 0);
  const ats: number[] = [];
  let k = 0;
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      ats.push(said(Number(t), fallback, occ[k] ?? 0));
      k++;
    } else ats.push(-1);
  }
  return tokens.map((text, i) => {
    let a = ats[i];
    if (a < 0) {
      // Symbols ride with the number BEFORE them ("3x −" rather than a bare
      // "3" waiting for its operator), and leading symbols with the number
      // that follows.
      a =
        [...ats.slice(0, i)].reverse().find((v) => v >= 0) ??
        ats.slice(i + 1).find((v) => v >= 0) ??
        fallback;
    }
    return { text, at: a };
  });
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

/** One part of a written line, faded in on its own spoken moment. */
function Ink({ part }: { part: Part }) {
  const enter = useEnter(part.at, 12);
  return (
    <span style={{ opacity: enter.opacity, whiteSpace: "pre" }}>{part.text}</span>
  );
}

/** A block that arrives on one frame (its own spoken moment, or a fallback). */
function Fade({ at, style, children }: { at: number; style?: React.CSSProperties; children: React.ReactNode }) {
  const enter = useEnter(at);
  return <div style={{ ...style, opacity: enter.opacity }}>{children}</div>;
}

function Title({ parts }: { parts: Part[] }) {
  return (
    <div
      style={{
        fontSize: 62,
        fontWeight: 700,
        color: INK,
        textAlign: "center",
        maxWidth: 1600,
      }}
    >
      {parts.map((p, i) => (
        <Ink key={i} part={p} />
      ))}
    </div>
  );
}

/** One line of the working: left side, equals, right side. Each side enters
 *  number by number, on the frame the narrator says that number. */
function EqRow({ left, right, colour = INK }: { left: Part[]; right: Part[]; colour?: string }) {
  const eq: Part = { text: "=", at: right[0]?.at ?? left[0]?.at ?? 0 };
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: 330, textAlign: "right", fontSize: 62, fontWeight: 800, color: colour }}>
        {left.map((p, i) => (
          <Ink key={i} part={p} />
        ))}
      </div>
      <div style={{ width: 90, textAlign: "center", fontSize: 62, fontWeight: 800, color: MUTED }}>
        <Ink part={eq} />
      </div>
      <div style={{ width: 330, textAlign: "left", fontSize: 62, fontWeight: 800, color: colour }}>
        {right.map((p, i) => (
          <Ink key={i} part={p} />
        ))}
      </div>
    </div>
  );
}

/** The move applied to BOTH sides, written under each side so the symmetry
 *  is visible rather than claimed. Both copies land on the same spoken word,
 *  because the narrator says the move once and means both sides. */
function OpRow({ op, colour = RED }: { op: Part[]; colour?: string }) {
  const side = (key: string, align: "right" | "left") => (
    <div key={key} style={{ width: 330, textAlign: align, fontSize: 40, fontWeight: 800, color: colour }}>
      {op.map((p, i) => (
        <Ink key={i} part={p} />
      ))}
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", height: 54 }}>
      {side("l", "right")}
      <div style={{ width: 90 }} />
      {side("r", "left")}
    </div>
  );
}

/** A small coordinate plane for the transformation mode. */
function Plane({
  points,
}: {
  points: {
    x: number;
    y: number;
    colour: string;
    label: string;
    /** Where the label sits relative to its point. Chosen per point rather
     *  than by a rule, because four labels on one small plane collide the
     *  moment two points share a row or a column. */
    anchor: "above" | "below" | "left" | "right";
    dashFrom?: { x: number; y: number };
    /** Frame the narrator says this point's coordinates (negatives aligned on
     *  the absolute value). The point, its label and its dashed journey all
     *  arrive together on that word. */
    at?: number;
  }[];
}) {
  const R = 6; // shown range, -R..R
  const S = 46; // pixels per unit
  const W = 2 * R * S;
  const ox = (STAGE_W - W) / 2 + R * S;
  const oy = 20 + R * S;
  const px = (v: number) => ox + v * S;
  const py = (v: number) => oy - v * S;
  const ticks: number[] = [];
  for (let v = -R; v <= R; v++) ticks.push(v);
  const frame = useCurrentFrame();
  const shownAt = (at?: number) =>
    interpolate(frame, [at ?? 0, (at ?? 0) + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  return (
    <>
      {/* grid */}
      {ticks.map((v) => (
        <React.Fragment key={`g${v}`}>
          <div style={{ position: "absolute", left: px(-R), top: py(v), width: W, height: 2, backgroundColor: "rgba(138,122,94,0.22)" }} />
          <div style={{ position: "absolute", left: px(v), top: py(R), width: 2, height: W, backgroundColor: "rgba(138,122,94,0.22)" }} />
        </React.Fragment>
      ))}
      {/* axes */}
      <div style={{ position: "absolute", left: px(-R), top: py(0) - 2, width: W, height: 5, backgroundColor: INK }} />
      <div style={{ position: "absolute", left: px(0) - 2, top: py(R), width: 5, height: W, backgroundColor: INK }} />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          {p.dashFrom && (
            <svg style={{ position: "absolute", left: 0, top: 0, width: STAGE_W, height: 2 * R * S + 60, pointerEvents: "none", opacity: shownAt(p.at) }}>
              <line
                x1={px(p.dashFrom.x)}
                y1={py(p.dashFrom.y)}
                x2={px(p.x)}
                y2={py(p.y)}
                stroke={p.colour}
                strokeWidth={4}
                strokeDasharray="10 8"
              />
            </svg>
          )}
          <div
            style={{
              position: "absolute",
              left: px(p.x) - 13,
              top: py(p.y) - 13,
              width: 26,
              height: 26,
              borderRadius: "50%",
              backgroundColor: p.colour,
              opacity: shownAt(p.at),
            }}
          />
          <div
            style={{
              position: "absolute",
              left:
                p.anchor === "right" ? px(p.x) + 24 : p.anchor === "left" ? px(p.x) - 264 : px(p.x) - 120,
              top:
                p.anchor === "above" ? py(p.y) - 60 : p.anchor === "below" ? py(p.y) + 24 : py(p.y) - 20,
              width: 240,
              textAlign: p.anchor === "right" ? "left" : p.anchor === "left" ? "right" : "center",
              fontSize: 32,
              fontWeight: 800,
              color: p.colour,
              whiteSpace: "nowrap",
              opacity: shownAt(p.at),
            }}
          >
            {p.label}
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

function SceneBody({ dur, unit, sceneId, said }: SceneProps) {
  const n = linEqNumbers(unit);
  const step = (f: number) => Math.floor(dur * f);
  const stage = { alignItems: "center", justifyContent: "center", gap: 10 } as const;
  const tipLine = (
    <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, textAlign: "center", maxWidth: 1500, marginTop: 26 }}>
      {unit.tip}
    </div>
  );

  if (unit.mode === "transform") {
    const shown =
      sceneId === "ask" ? 0 : sceneId === "work" ? 1 : sceneId === "twist" ? 2 : 3;
    // Each image lands on the moment its coordinates are named. "The point
    // 3, 2" opens the ask; the reflection arrives on the flipped up-value
    // ("2 becomes negative 2" — negatives align on the absolute value); the
    // slide and the quarter turn each on the last time their new first
    // coordinate is said, which is where the narrator reads the image out.
    const pts: Parameters<typeof Plane>[0]["points"] = [
      {
        x: n.px,
        y: n.py,
        colour: INK,
        label: `(${n.px}, ${n.py})`,
        anchor: "above",
        at: sceneId === "ask" ? said(Math.abs(n.px), 0, 0) : 0,
      },
    ];
    if (shown >= 1) {
      pts.push({
        x: n.reflectXx,
        y: n.reflectXy,
        colour: BLUE,
        label: `reflect (${n.reflectXx}, ${n.reflectXy})`,
        anchor: "below",
        dashFrom: { x: n.px, y: n.py },
        at: sceneId === "work" ? said(Math.abs(n.reflectXy), 0, 1) : 0,
      });
    }
    if (shown >= 2) {
      pts.push({
        x: n.translatedX,
        y: n.translatedY,
        colour: GOLD,
        label: `slide (${n.translatedX}, ${n.translatedY})`,
        anchor: "right",
        dashFrom: { x: n.px, y: n.py },
        at: sceneId === "twist" ? said(Math.abs(n.translatedX), 0, -1) : 0,
      });
      pts.push({
        x: n.rotatedX,
        y: n.rotatedY,
        colour: GREEN,
        label: `turn (${n.rotatedX}, ${n.rotatedY})`,
        anchor: "left",
        dashFrom: { x: n.px, y: n.py },
        at: sceneId === "twist" ? said(Math.abs(n.rotatedX), 0, -1) : 0,
      });
    }
    const headline =
      sceneId === "ask"
        ? `(${n.px}, ${n.py})`
        : sceneId === "work"
          ? "Reflect — flip one coordinate"
          : sceneId === "twist"
            ? "Slide adds. Quarter turn swaps."
            : "Three rules, three images";
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Title parts={numberParts(headline, said, 0, sceneId === "ask" ? [0, 0] : null)} />
        <div style={{ position: "relative", width: STAGE_W, height: 640 }}>
          <Plane points={pts} />
        </div>
        {sceneId === "record" && tipLine}
      </AbsoluteFill>
    );
  }

  // ---- the ledger modes ---------------------------------------------------
  // Each entry is either an equation row or the operation applied to both
  // sides. Built per mode, then revealed in step with the narration.
  type Step = { kind: "eq"; left: string; right: string; colour?: string } | { kind: "op"; op: string };
  let steps: Step[] = [];
  let headline = "";
  // Which spoken number each row waits for, per scene: one occurrence index
  // per digit in the row, or null when this scene's line does not say the
  // row's numbers (a row earned in an earlier scene, or a summary line with
  // no alignment) — those keep the template's own frame.
  let reveal: (number[] | null)[] = [];
  let titleOcc: number[] | null = null;
  const pick = (byScene: Record<string, (number[] | null)[]>) =>
    byScene[sceneId] ?? byScene.record;

  if (unit.mode === "two-step") {
    steps = [
      { kind: "eq", left: `${n.a}x − ${n.b}`, right: `${n.c}` },
      { kind: "op", op: `+ ${n.b}` },
      { kind: "eq", left: `${n.a}x`, right: `${n.afterAdd}`, colour: BLUE },
      { kind: "op", op: `÷ ${n.a}` },
      { kind: "eq", left: `x`, right: `${n.twoStepX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? "Two things were done to x"
        : sceneId === "work"
          ? "Undo the LAST thing first"
          : sceneId === "twist"
            ? `Now divide by ${n.a}`
            : "Reverse order, both sides";
    // ask: "3 x minus 4 equals 11" · work: "add 4 … 11 plus 4 is 15, so now
    // 3 x equals 15" · twist: "divide by 3 … x equals 5".
    reveal = pick({
      ask: [[0, 0, 0], null, null, null, null],
      work: [null, [1], [0, 1], null, null],
      twist: [null, null, null, [1], [1]],
      record: [null, null, null, null, null],
    });
    titleOcc = sceneId === "twist" ? [1] : null; // "Now divide by 3"
  } else if (unit.mode === "distribute-eq") {
    steps = [
      { kind: "eq", left: `${n.a}(x + ${n.b})`, right: `${n.c}` },
      { kind: "op", op: `÷ ${n.a}` },
      { kind: "eq", left: `x + ${n.b}`, right: `${n.afterDivide}`, colour: BLUE },
      { kind: "op", op: `− ${n.b}` },
      { kind: "eq", left: `x`, right: `${n.distributeX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? `${n.a}(x + ${n.b}) = ${n.c}`
        : sceneId === "work"
          ? "Divide first — the bracket falls away"
          : sceneId === "twist"
            ? "The long way agrees"
            : "Divide first when it divides neatly";
    // ask: "3, bracket, x plus 4, equals 21" · work: "divide both sides by 3
    // … x plus 4 equals 7" · twist walks the EXPAND route instead, so the
    // last two ledger rows land on the only words that name them there
    // ("3 times 4", "x equals 3").
    reveal = pick({
      ask: [[0, 0, 0], null, null, null, null],
      work: [null, [1], [1, 1], null, null],
      twist: [null, null, null, [0], [-1]],
      record: [null, null, null, null, null],
    });
    titleOcc = sceneId === "ask" ? [0, 0, 0] : null; // "3(x + 4) = 21"
  } else if (unit.mode === "both-sides") {
    steps = [
      { kind: "eq", left: `${n.a}x + ${n.b}`, right: `${n.c}x + ${n.d}` },
      { kind: "op", op: `− ${n.c}x` },
      { kind: "eq", left: `${n.xDiff}x + ${n.b}`, right: `${n.d}`, colour: BLUE },
      { kind: "op", op: `− ${n.b}` },
      { kind: "eq", left: `${n.xDiff}x`, right: `${n.constDiff}`, colour: BLUE },
      { kind: "op", op: `÷ ${n.xDiff}` },
      { kind: "eq", left: `x`, right: `${n.bothSidesX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? "x on BOTH sides"
        : sceneId === "work"
          ? `Take ${n.c}x off both sides`
          : sceneId === "twist"
            ? "Now it is an ordinary two-step"
            : "Collect the x’s, then finish as normal";
    // ask: "5 x plus 2 equals 2 x plus 11" · work: "Take 2 x off … leaves
    // 3 x … just 11 left" · twist: "Take 2 off … 3 x equals 9 … divide by 3:
    // x equals 3".
    reveal = pick({
      ask: [[0, 0, 1, 0], null, null, null, null, null, null],
      work: [null, [0], [0, 2, 0], null, null, null, null],
      twist: [null, null, null, [1], [1, 1], [2], [-1]],
      record: [null, null, null, null, null, null, null],
    });
    titleOcc = sceneId === "work" ? [0] : null; // "Take 2x off both sides"
  } else {
    steps = [
      { kind: "eq", left: `x / ${n.a}`, right: `${n.b}` },
      { kind: "op", op: `× ${n.a}` },
      { kind: "eq", left: `x`, right: `${n.fractionX}`, colour: GREEN },
    ];
    headline =
      sceneId === "ask"
        ? `x / ${n.a} = ${n.b}`
        : sceneId === "work"
          ? `One part out of ${n.a} is ${n.b}`
          : sceneId === "twist"
            ? `Multiply both sides by ${n.a}`
            : "Multiplying undoes dividing";
    // ask: "x over 4 equals 6" · work: "undo it by MULTIPLYING by 4" (the
    // last 4 of the line) · twist: "Multiply both sides by 4 … x equals 24".
    reveal = pick({
      ask: [[0, 0], null, null],
      work: [null, [-1], [0]],
      twist: [null, [0], [1]],
      record: [null, null, null],
    });
    titleOcc =
      sceneId === "ask" ? [0, 0] : sceneId === "work" ? [0, 0] : sceneId === "twist" ? [0] : null;
  }

  // How much of the ledger has been earned by this point in the lesson.
  const eqCount = steps.filter((s) => s.kind === "eq").length;
  const target = sceneId === "ask" ? 1 : sceneId === "work" ? 2 : eqCount;
  let seenEq = 0;
  const visible = steps.map((s) => {
    if (s.kind === "eq") seenEq++;
    // An operation row belongs to the line BELOW it, so it waits for that
    // line: otherwise "÷ 3" sat on screen through the whole work scene,
    // where the narration never mentions dividing at all.
    return s.kind === "eq" ? seenEq <= target : seenEq < target;
  });

  // The expand-route proof, shown only where the narration walks it.
  const showAltRoute = unit.mode === "distribute-eq" && sceneId === "twist";

  return (
    <AbsoluteFill style={stage}>
      <Title parts={numberParts(headline, said, 0, titleOcc)} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18 }}>
        {steps.map((s, i) => {
          const occ = reveal[i] ?? null;
          // Speech-bound rows keep the template's old frame as their fallback;
          // a row carried in from an earlier scene is already established, so
          // it is simply there. // not-speech-bound
          const fb = occ ? step(0.1 + i * 0.11) : 0;
          return !visible[i] ? null : s.kind === "eq" ? (
            <EqRow
              key={i}
              left={numberParts(s.left, said, fb, occ && occ.slice(0, (s.left.match(/\d+/g) ?? []).length))}
              right={numberParts(s.right, said, fb, occ && occ.slice((s.left.match(/\d+/g) ?? []).length))}
              colour={s.colour ?? INK}
            />
          ) : (
            <OpRow key={i} op={numberParts(s.op, said, fb, occ)} />
          );
        })}
      </div>
      {showAltRoute && (
        // The expand route is read out as one sentence; it arrives on "is 12",
        // the first number the long way produces.
        <Fade at={said(n.expanded, step(0.55), 0)} style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: MUTED }}>expanding instead</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: GOLD }}>
            {n.a}x + {n.expanded} = {n.c} → {n.a}x = {n.c - n.expanded} → x = {n.distributeX}
          </div>
        </Fade>
      )}
      {sceneId === "record" && tipLine}
    </AbsoluteFill>
  );
}

export const LinEqVideo: React.FC<LinEqProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = linEqUnitById(unitId);
  const scenes = linEqSceneTimings(unitId, voice);
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
          <SceneBody dur={scene.dur} unit={unit} sceneId={scene.id} said={saidFor(unitId, voice, scene.id)} />
        </Sequence>
      ))}
      <Brand />
    </AbsoluteFill>
  );
};
