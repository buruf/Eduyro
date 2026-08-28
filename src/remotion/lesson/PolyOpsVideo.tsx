// src/remotion/lesson/PolyOpsVideo.tsx
// The POLYNOMIAL OPERATIONS template (M12) — the technique drills.
//
// These lessons are about MANIPULATION, not about what a polynomial is, so
// the visuals are deliberately typographic: a line of algebra that rewrites
// itself one step at a time, with the step being taught picked out in colour.
// A student watching should be able to pause on any frame and see exactly
// which piece moved and where it went.
//
//   anatomy        terms sorted by exponent, then each part named
//   evaluate       a substitution ladder, one row per step
//   subtract       the minus visibly landing on every term in the bracket
//   monomial-mult  coefficients and exponents on separate lanes, because
//                  they obey different rules
//   divide-mono    one long fraction splitting into two easy ones
//   gcf            the shared factor lifted out to the front
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
import { polyOpsSceneTimings } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { polyOpsUnitById, polyOpsText, monoText, polyOpsNumbers, type PolyOpsUnit } from "./units-polyops";

export type PolyOpsProps = {
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

interface SceneProps {
  dur: number;
  unit: PolyOpsUnit;
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
        fontSize: 64,
        fontWeight: 700,
        color: INK,
        opacity: enter.opacity,
        translate: `0 ${enter.translateY}px`,
        textAlign: "center",
        maxWidth: 1600,
      }}
    >
      {text}
    </div>
  );
}

/** One line of the working, revealed at `at` (a frame). */
function Line({
  children,
  at,
  frame,
  size = 66,
  colour = INK,
  weight = 700,
}: {
  children: React.ReactNode;
  at: number;
  frame: number;
  size?: number;
  colour?: string;
  weight?: number;
}) {
  const o = interpolate(frame, [at, at + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dy = interpolate(frame, [at, at + 12], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        color: colour,
        opacity: o,
        translate: `0 ${dy}px`,
        letterSpacing: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** A bordered card holding a term, optionally annotated underneath. */
function Card({
  main,
  note,
  colour,
  dim = false,
}: {
  main: string;
  note?: string;
  colour: string;
  dim?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", opacity: dim ? 0.18 : 1 }}>
      <div
        style={{
          borderRadius: 20,
          border: `5px solid ${colour}`,
          backgroundColor: "#FFF",
          padding: "26px 40px",
          fontSize: 66,
          fontWeight: 800,
          color: colour,
          minWidth: 190,
        }}
      >
        {main}
      </div>
      <div style={{ marginTop: 14, fontSize: 32, fontWeight: 800, color: note ? colour : MUTED, height: 44 }}>
        {note ?? ""}
      </div>
    </div>
  );
}

function SceneBody({ dur, unit, sceneId }: SceneProps) {
  const frame = useCurrentFrame();
  const title = useEnter(0);
  const x = polyOpsNumbers(unit);
  // Reveal points as fractions of the scene, so a long narration and a short
  // one both land their steps in step with the voice.
  const step = (f: number) => Math.floor(dur * f);
  const stage = { alignItems: "center", justifyContent: "center", gap: 34 } as const;

  if (unit.mode === "anatomy") {
    const named = sceneId === "twist" || sceneId === "record";
    const terms = [
      { main: monoText(x.c2, 2), exp: 2, note: named ? "leading coefficient" : "exponent 2", colour: BLUE },
      { main: monoText(x.c1, 1), exp: 1, note: named ? "" : "exponent 1", colour: GREEN },
      { main: `${x.c0 < 0 ? "−" : ""}${Math.abs(x.c0)}`, exp: 0, note: named ? "constant term" : "exponent 0", colour: GOLD },
    ];
    const headline =
      sceneId === "ask"
        ? polyOpsText(unit.a)
        : sceneId === "work"
          ? "Standard form: biggest exponent first"
          : sceneId === "twist"
            ? `Degree ${x.degree}`
            : polyOpsText(unit.a);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", gap: 46, alignItems: "flex-start" }}>
          {terms.map((t, i) => (
            <Card
              key={i}
              main={t.main}
              note={t.note || undefined}
              colour={t.colour}
              dim={sceneId === "work" && frame < step(0.2) + i * step(0.2)}
            />
          ))}
        </div>
        {sceneId === "twist" && (
          <Line at={step(0.55)} frame={frame} size={44} colour={MUTED} weight={800}>
            biggest exponent = the degree
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "evaluate") {
    // The substitution ladder. Every row is one honest step of the working.
    const rows: { text: string; colour: string }[] = [
      { text: polyOpsText(unit.a), colour: INK },
      { text: `${x.c2}(${x.at})² + ${x.c1}(${x.at}) − ${Math.abs(x.c0)}`, colour: BLUE },
      { text: `${x.c2}(${x.sq}) + ${x.c1}(${x.at}) − ${Math.abs(x.c0)}`, colour: BLUE },
      { text: `${x.termSq} + ${x.termX} − ${Math.abs(x.c0)}`, colour: GOLD },
      { text: `= ${x.value}`, colour: GREEN },
    ];
    const shown = sceneId === "ask" ? 1 : sceneId === "work" ? 3 : sceneId === "twist" ? 4 : 5;
    const headline =
      sceneId === "ask"
        ? `x = ${x.at}`
        : sceneId === "work"
          ? "Swap every x — then powers first"
          : sceneId === "twist"
            ? "Multiply, then add"
            : `At x = ${x.at}, the value is ${x.value}`;
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
          {rows.slice(0, shown).map((r, i) => (
            <Line key={i} at={step(0.12) + i * step(0.14)} frame={frame} colour={r.colour} size={i === 4 ? 82 : 62}>
              {r.text}
            </Line>
          ))}
        </div>
        {sceneId === "twist" && (
          <Line at={step(0.6)} frame={frame} size={40} colour={RED} weight={800}>
            the exponent belongs to the x — not to the {x.c2}
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "subtract") {
    const b: [number, number, number] = [x.b2, x.b1, x.b0];
    const flipped = sceneId === "work" || sceneId === "twist" || sceneId === "record";
    const cols = [
      { label: "x²", a: x.c2, b: x.b2, r: x.diff[0], colour: BLUE },
      { label: "x", a: x.c1, b: x.b1, r: x.diff[1], colour: GREEN },
      { label: "constant", a: x.c0, b: x.b0, r: x.diff[2], colour: GOLD },
    ];
    const headline =
      sceneId === "ask"
        ? // The expression itself is already on the stage below; repeating it
          // in the headline just says the same thing twice.
          "Subtract — and watch one sign"
        : sceneId === "work"
          ? "The minus hits EVERY term"
          : sceneId === "twist"
            ? "Now combine like terms"
            : polyOpsText(x.diff);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "ask" || sceneId === "work" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
            <Line at={0} frame={frame} size={62}>
              {polyOpsText(unit.a)}
            </Line>
            <Line at={flipped ? step(0.25) : 0} frame={frame} size={62} colour={flipped ? RED : INK}>
              {flipped
                ? `− ${monoText(x.b2, 2)} − ${monoText(x.b1, 1)} − ${Math.abs(x.b0)}`
                : `− ( ${polyOpsText(b)} )`}
            </Line>
            {flipped && (
              <Line at={step(0.55)} frame={frame} size={40} colour={RED} weight={800}>
                every sign inside the bracket flips
              </Line>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 60 }}>
            {cols.map((c, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 20,
                  border: `5px solid ${c.colour}`,
                  backgroundColor: "#FFF",
                  padding: "24px 34px",
                  textAlign: "center",
                  opacity: sceneId === "record" || frame >= step(0.15) + i * step(0.22) ? 1 : 0.15,
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>{c.label} terms</div>
                <div style={{ fontSize: 58, fontWeight: 800, color: c.colour }}>
                  {c.a} − {c.b}
                </div>
                <div style={{ fontSize: 66, fontWeight: 800, color: c.colour }}>
                  = {c.r < 0 ? `−${Math.abs(c.r)}` : c.r}
                </div>
              </div>
            ))}
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "monomial-mult") {
    // Two lanes, because coefficients and exponents obey different rules and
    // conflating them is the whole error this lesson exists to prevent.
    const headline =
      sceneId === "ask"
        ? `${monoText(x.c1, 1)} · ${monoText(x.k, x.p)}`
        : sceneId === "work"
          ? "Two different jobs"
          : sceneId === "twist"
            ? "Why the exponents ADD"
            : monoText(x.monoCoef, x.monoExp);
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "twist" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
            <Line at={0} frame={frame} size={58} colour={MUTED}>
              x · (x · x)
            </Line>
            <Line at={step(0.3)} frame={frame} size={58} colour={BLUE}>
              = x · x · x
            </Line>
            <Line at={step(0.55)} frame={frame} size={70} colour={GREEN}>
              1 + {x.p} = {x.monoExp}
            </Line>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 70 }}>
            <div
              style={{
                borderRadius: 20,
                border: `5px solid ${GOLD}`,
                backgroundColor: "#FFF",
                padding: "26px 42px",
                textAlign: "center",
                opacity: sceneId === "ask" || frame >= step(0.15) ? 1 : 0.15,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>coefficients</div>
              <div style={{ fontSize: 62, fontWeight: 800, color: GOLD }}>
                {x.c1} × {x.k} = {x.monoCoef}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: GOLD }}>multiply</div>
            </div>
            <div
              style={{
                borderRadius: 20,
                border: `5px solid ${BLUE}`,
                backgroundColor: "#FFF",
                padding: "26px 42px",
                textAlign: "center",
                opacity: sceneId === "ask" || frame >= step(0.5) ? 1 : 0.15,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: MUTED }}>exponents</div>
              <div style={{ fontSize: 62, fontWeight: 800, color: BLUE }}>
                1 + {x.p} = {x.monoExp}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: BLUE }}>add</div>
            </div>
          </div>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "divide-mono") {
    const div = monoText(x.k, x.p);
    const headline =
      sceneId === "ask"
        ? `( ${polyOpsText(unit.a)} ) ÷ ${div}`
        : sceneId === "work"
          ? "Split the fraction, term by term"
          : sceneId === "twist"
            ? "Divide numbers, SUBTRACT exponents"
            : `${monoText(x.divA, x.divAExp)} + ${x.divB}`;
    const Frac = ({ top, bottom, colour }: { top: string; bottom: string; colour: string }) => (
      <div style={{ textAlign: "center", color: colour }}>
        <div style={{ fontSize: 58, fontWeight: 800, padding: "0 18px" }}>{top}</div>
        <div style={{ height: 6, backgroundColor: colour, borderRadius: 3, margin: "8px 0" }} />
        <div style={{ fontSize: 58, fontWeight: 800 }}>{bottom}</div>
      </div>
    );
    return (
      <AbsoluteFill style={stage}>
        <Title text={headline} enter={title} />
        {sceneId === "ask" ? (
          <Frac top={polyOpsText(unit.a)} bottom={div} colour={INK} />
        ) : (
          <div style={{ display: "flex", gap: 44, alignItems: "center" }}>
            <Frac top={monoText(x.c2, 2)} bottom={div} colour={BLUE} />
            <div style={{ fontSize: 62, fontWeight: 800, color: MUTED }}>+</div>
            <Frac top={monoText(x.c1, 1)} bottom={div} colour={GOLD} />
            {(sceneId === "twist" || sceneId === "record") && (
              <>
                <div style={{ fontSize: 62, fontWeight: 800, color: MUTED }}>=</div>
                <Line at={step(0.35)} frame={frame} size={70} colour={GREEN}>
                  {monoText(x.divA, x.divAExp)} + {x.divB}
                </Line>
              </>
            )}
          </div>
        )}
        {sceneId === "twist" && (
          <Line at={step(0.65)} frame={frame} size={40} colour={MUTED} weight={800}>
            x² ÷ x → 2 − 1 = 1
          </Line>
        )}
        {sceneId === "record" && (
          <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // gcf — the shared factor is highlighted inside each term, then lifted out.
  const gcf = monoText(x.k, x.p);
  const headline =
    sceneId === "ask"
      ? polyOpsText(unit.a)
      : sceneId === "work"
        ? "What do BOTH terms share?"
        : sceneId === "twist"
          ? "Lift it out to the front"
          : "Factored form";
  return (
    <AbsoluteFill style={stage}>
      <Title text={headline} enter={title} />
      {sceneId === "ask" || sceneId === "work" ? (
        <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
          {[
            { shared: gcf, rest: monoText(x.gcfA, x.gcfAExp), colour: BLUE },
            { shared: gcf, rest: String(x.gcfB), colour: GOLD },
          ].map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ fontSize: 62, fontWeight: 800, color: MUTED }}>+</div>}
              <div
                style={{
                  borderRadius: 20,
                  border: `5px solid ${t.colour}`,
                  backgroundColor: "#FFF",
                  padding: "26px 40px",
                  fontSize: 64,
                  fontWeight: 800,
                  opacity: sceneId === "ask" || frame >= step(0.15) + i * step(0.2) ? 1 : 0.15,
                }}
              >
                <span style={{ color: sceneId === "work" ? GREEN : t.colour }}>{t.shared}</span>
                <span style={{ color: t.colour }}> · {t.rest}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Line at={0} frame={frame} size={86} colour={GREEN}>
            {gcf}
          </Line>
          <Line at={step(0.3)} frame={frame} size={86} colour={INK}>
            ( {monoText(x.gcfA, x.gcfAExp)} + {x.gcfB} )
          </Line>
        </div>
      )}
      {sceneId === "twist" && (
        <Line at={step(0.65)} frame={frame} size={40} colour={MUTED} weight={800}>
          multiply back out to check
        </Line>
      )}
      {sceneId === "record" && (
        <div style={{ fontSize: 42, fontWeight: 800, color: GREEN, textAlign: "center" }}>{unit.tip}</div>
      )}
    </AbsoluteFill>
  );
}

export const PolyOpsVideo: React.FC<PolyOpsProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = polyOpsUnitById(unitId);
  const scenes = polyOpsSceneTimings(unitId, voice);
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
