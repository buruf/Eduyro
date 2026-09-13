// src/remotion/lesson/PolyVideo.tsx
// The POLYNOMIAL template (M12). Algebra tiles for classify/add — a big
// square IS x², a bar IS x, a dot IS 1, so "like terms" are literally tiles
// of the same shape — and the area rectangle for multiply/factor, the same
// puzzle run in opposite directions.
//
// Sync: every reveal that shows something the narrator says is timed with
// `said(n, fallback, occurrence)` from the scene's clip alignment (timeline
// `saidFor`). A term lands on its coefficient, a combined term on its result,
// a room of the rectangle on its product, a factor pair on its first factor.
// Numbers a line repeats are resolved by their position in a narration-order
// list that mirrors script-poly.ts word for word. A term the recording speaks
// as words only ("x squared", coefficient 1) has no number to land on, so it
// settles just before the next spoken number. Reveals that follow no spoken
// number keep their old frames and are marked `// not-speech-bound`.
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
import { polySceneTimings, saidFor, type SaidFn } from "./timeline";
import { DEFAULT_VOICE_KEY } from "./voices";
import { Brand } from "./Brand";
import { polyUnitById, polyText, type PolyUnit } from "./units-poly";

export type PolyProps = {
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

interface SceneProps {
  dur: number;
  unit: PolyUnit;
  /** Scene-local frame at which the narrator says a number (timeline `saidFor`).
   *  The fallback is the old hand-picked frame, for clips without alignment. */
  said: SaidFn;
}

/** How many times `n` is spoken BEFORE the mention we want. */
const before = (n: number, earlier: number[]) => earlier.filter((v) => v === n).length;

/** The frames at which a line's numbers are said, in the order the line says
 *  them (`order` mirrors `polyLines` in script-poly.ts word for word, so a
 *  repeated number resolves to the right occurrence). `NaN` entries are terms
 *  the line speaks without a number; `settle` places those. */
const spokenAt = (said: SaidFn, order: (number | null)[], fallback: (i: number) => number): number[] =>
  order.map((n, k) =>
    n == null
      ? Number.NaN
      : said(n, fallback(k), before(n, order.slice(0, k).filter((v): v is number => v != null))),
  );

/** A term spoken as words only ("x squared") has no number to land on, so it
 *  arrives just before the next number of the same line. // not-speech-bound */
function settle(frames: number[], fallback: (i: number) => number): number[] {
  const out = frames.slice();
  for (let i = out.length - 1; i >= 0; i--) {
    if (!Number.isFinite(out[i])) {
      const next = out[i + 1];
      out[i] = Number.isFinite(next) ? Math.max(0, next - 24) : fallback(i);
    }
  }
  return out;
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

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 68,
  fontWeight: 700,
  color: INK,
  textAlign: "center",
  maxWidth: 1700,
};

function Title({ text, at = 4 }: { text: string; at?: number }) {
  const enter = useEnter(at);
  return <div style={{ ...TITLE_STYLE, opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>{text}</div>;
}

type TextPart = { text: string; at: number };

/** One piece of a headline, entering on its own frame. */
function Part({ text, at }: TextPart) {
  const enter = useEnter(at);
  return (
    <span style={{ display: "inline-block", whiteSpace: "pre", opacity: enter.opacity, translate: `0 ${enter.translateY}px` }}>
      {text}
    </span>
  );
}

/** A headline whose pieces appear as the narrator reaches them. */
function TitleParts({ parts }: { parts: TextPart[] }) {
  return (
    <div style={{ ...TITLE_STYLE, whiteSpace: "nowrap" }}>
      {parts.map((p, i) => (
        <Part key={`${i}-${p.text}`} {...p} />
      ))}
    </div>
  );
}

/** One algebra tile. */
function Tile({ kind, colour }: { kind: "sq" | "bar" | "dot"; colour: string }) {
  const size = kind === "sq" ? { w: 84, h: 84 } : kind === "bar" ? { w: 84, h: 30 } : { w: 30, h: 30 };
  return (
    <div
      style={{
        width: size.w,
        height: size.h,
        borderRadius: 8,
        backgroundColor: colour,
        opacity: 0.85,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFF",
        fontSize: kind === "sq" ? 30 : 18,
        fontWeight: 800,
      }}
    >
      {kind === "sq" ? "x²" : kind === "bar" ? "x" : ""}
    </div>
  );
}

/** A group of n tiles of one kind, revealed up to `shown`. */
function TileGroup({
  kind,
  n,
  colour,
  shown = n,
  label,
}: {
  kind: "sq" | "bar" | "dot";
  n: number;
  colour: string;
  shown?: number;
  label?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 300, alignItems: "flex-end", minHeight: 90 }}>
        {Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ opacity: i < shown ? 1 : 0.12 }}>
            <Tile kind={kind} colour={colour} />
          </div>
        ))}
      </div>
      {label && <div style={{ fontSize: 38, fontWeight: 800, color: colour, marginTop: 10 }}>{label}</div>}
    </div>
  );
}

/** The (x + p)(x + q) area rectangle. Each room lights on the frame the
 *  narrator says its product; the side labels land on their own number. */
function AreaBox({
  p,
  q,
  roomAt,
  pAt = 0,
  qAt = 0,
}: {
  p: number;
  q: number;
  roomAt: number[];
  pAt?: number;
  qAt?: number;
}) {
  const frame = useCurrentFrame();
  const X = 300; // px for the x-length
  const unit = 62; // px per 1
  const rooms = [
    { w: X, h: X, label: "x²", c: BLUE },
    { w: unit * q, h: X, label: `${q}x`, c: GREEN },
    { w: X, h: unit * p, label: `${p}x`, c: GOLD },
    { w: unit * q, h: unit * p, label: String(p * q), c: MUTED },
  ];
  return (
    <div style={{ position: "relative", padding: "70px 0 0 70px" }}>
      {/* side labels — the two x's are the sides themselves, not a spoken number */}
      <div style={{ position: "absolute", left: 70 + X / 2 - 16, top: 8, fontSize: 44, fontWeight: 800, color: INK }}>x</div>
      <div style={{ position: "absolute", left: 70 + X + (unit * q) / 2 - 12, top: 8, fontSize: 44, fontWeight: 800, color: INK, opacity: frame >= qAt ? 1 : 0 }}>{q}</div>
      <div style={{ position: "absolute", left: 16, top: 70 + X / 2 - 26, fontSize: 44, fontWeight: 800, color: INK }}>x</div>
      <div style={{ position: "absolute", left: 16, top: 70 + X + (unit * p) / 2 - 26, fontSize: 44, fontWeight: 800, color: INK, opacity: frame >= pAt ? 1 : 0 }}>{p}</div>
      <div style={{ display: "grid", gridTemplateColumns: `${X}px ${unit * q}px`, gridTemplateRows: `${X}px ${unit * p}px`, gap: 6 }}>
        {rooms.map((r, i) => (
          <div
            key={i}
            style={{
              backgroundColor: r.c,
              opacity: frame >= roomAt[i] ? 0.82 : 0.1,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            {frame >= roomAt[i] ? r.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** The numbers the narrator reads for one polynomial, term by term — mirrors
 *  `spoken()` in script-poly.ts: a coefficient of 1 is never said aloud. */
const spokenNums = (c: [number, number, number]): (number | null)[] => [
  c[0] ? (c[0] === 1 ? null : c[0]) : null,
  c[1] ? (Math.abs(c[1]) === 1 ? null : Math.abs(c[1])) : null,
  c[2] ? Math.abs(c[2]) : null,
];

/** The written terms of one polynomial, with their leading signs. */
const termTexts = (c: [number, number, number]): string[] => [
  c[0] === 1 ? "x²" : `${c[0]}x²`,
  `${c[1] > 0 ? " + " : " − "}${Math.abs(c[1]) === 1 ? "x" : `${Math.abs(c[1])}x`}`,
  `${c[2] > 0 ? " + " : " − "}${Math.abs(c[2])}`,
];

const NEVER = 1e6;

function SceneBody({ dur, unit, sceneId, said }: SceneProps & { sceneId: string }) {
  const frame = useCurrentFrame();
  const step = (k: number) => Math.round(dur * k); // not-speech-bound — fallback frames only

  if (unit.mode === "classify") {
    const [c2, c1, c0] = unit.a;
    const terms = [
      { text: c2 === 1 ? "x²" : `${c2}x²`, deg: "degree 2", c: BLUE },
      { text: `${Math.abs(c1) === 1 ? "" : Math.abs(c1)}x`, deg: "degree 1", c: GREEN },
      { text: String(Math.abs(c0)), deg: "degree 0", c: GOLD },
    ];
    const per = Math.floor((dur * 0.55) / 3); // not-speech-bound — fallback spacing
    const workFb = (i: number) => step(0.15) + i * per;
    // ask  "3 x squared, plus 2 x, minus 5."     work  "Term one: 3 x squared. Term two: 2 x. Term three: 5."
    const nums: (number | null)[] = [c2 === 1 ? null : c2, Math.abs(c1) === 1 ? null : Math.abs(c1), Math.abs(c0)];
    const cardAt =
      sceneId === "ask"
        ? settle(spokenAt(said, nums, () => 0), () => 0)
        : sceneId === "work"
          ? settle(spokenAt(said, nums, workFb), workFb)
          : [0, 0, 0]; // not-speech-bound — the terms carry over from the previous scene
    // twist  "exponent on x: 2… then 1… then 0"
    const degAt = sceneId === "twist" ? [said(2, 0, 0), said(1, 0, 0), said(0, 0, 0)] : [0, 0, 0];
    // twist "Here, degree 2" is the line's SECOND 2; record "of degree 2" likewise.
    const titleAt = sceneId === "twist" ? said(2, 4, 1) : sceneId === "record" ? said(2, 4, 1) : 4;
    const headline =
      sceneId === "ask" ? polyText(unit.a) : sceneId === "work" ? "Count the terms → TRINOMIAL" : sceneId === "twist" ? "Biggest exponent → degree 2" : "Trinomial, degree 2";
    const texts = termTexts(unit.a);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
        {sceneId === "ask" ? (
          <TitleParts parts={texts.map((t, i) => ({ text: t, at: cardAt[i] }))} />
        ) : (
          <Title text={headline} at={titleAt} />
        )}
        <div style={{ display: "flex", gap: 40 }}>
          {terms.map((t, i) => (
            <div
              key={i}
              style={{
                borderRadius: 20,
                border: `5px solid ${t.c}`,
                padding: "30px 46px",
                backgroundColor: "#FFF",
                opacity: frame >= cardAt[i] ? 1 : 0.15,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 76, fontWeight: 800, color: t.c }}>{t.text}</div>
              {(sceneId === "twist" || sceneId === "record") && (
                <div style={{ fontSize: 34, fontWeight: 800, color: MUTED, marginTop: 8, opacity: frame >= degAt[i] ? 1 : 0 }}>{t.deg}</div>
              )}
            </div>
          ))}
        </div>
        {sceneId === "record" && (
          // not-speech-bound — the closing tip names no number
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  if (unit.mode === "add") {
    const a = unit.a;
    const b = unit.b ?? unit.a;
    const s: [number, number, number] = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const merged = sceneId !== "ask";
    const per = Math.floor((dur * 0.5) / 3); // not-speech-bound — fallback spacing
    const workFb = (i: number) => step(0.2) + Math.floor(i / 3) * per;

    // ask  "3 x squared, plus 2 x, plus 1… and x squared, plus 4 x, plus 2."
    const askAt = settle(spokenAt(said, [...spokenNums(a), ...spokenNums(b)], () => 0), () => 0);
    // work  "Squares: 3 and 1 make 4. Bars: 2 and 4 make 6. Dots: 1 and 2 make 3."
    const workOrder = [a[0], b[0], s[0], Math.abs(a[1]), Math.abs(b[1]), Math.abs(s[1]), Math.abs(a[2]), Math.abs(b[2]), Math.abs(s[2])];
    const workAt = spokenAt(said, workOrder, workFb);
    /** When each merged pile (and its label) lands: on the sum it makes. */
    const mergedAt = (i: number) => (sceneId === "work" ? workAt[i * 3 + 2] : 0);
    const kindShown = (i: number) => (frame >= mergedAt(i) ? 99 : 0);

    const recordAt = settle(spokenAt(said, spokenNums(s), () => 4), () => 4);
    // twist  "So 4 x squared and 6 x sit side by side" — the title states the rule, no number.
    const headline =
      sceneId === "ask" ? "" : sceneId === "work" ? "Sort tiles by SHAPE" : sceneId === "twist" ? "Only like terms combine" : polyText(s);
    const aTexts = termTexts(a), bTexts = termTexts(b), sTexts = termTexts(s);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        {sceneId === "ask" ? (
          <TitleParts
            parts={[
              ...aTexts.map((t, i) => ({ text: t, at: askAt[i] })),
              { text: "   +   ", at: askAt[3] },
              ...bTexts.map((t, i) => ({ text: i === 0 ? t : t, at: askAt[3 + i] })),
            ]}
          />
        ) : sceneId === "record" ? (
          <TitleParts parts={sTexts.map((t, i) => ({ text: t, at: recordAt[i] }))} />
        ) : (
          <Title text={headline} at={4} />
        )}
        {!merged ? (
          <div style={{ display: "flex", gap: 130 }}>
            {[a, b].map((c, gi) => (
              <div key={gi} style={{ display: "flex", gap: 26, alignItems: "flex-end" }}>
                <TileGroup kind="sq" n={c[0]} colour={BLUE} shown={frame >= askAt[gi * 3] ? c[0] : 0} />
                <TileGroup kind="bar" n={c[1]} colour={GREEN} shown={frame >= askAt[gi * 3 + 1] ? c[1] : 0} />
                <TileGroup kind="dot" n={c[2]} colour={GOLD} shown={frame >= askAt[gi * 3 + 2] ? c[2] : 0} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
            <TileGroup kind="sq" n={s[0]} colour={BLUE} shown={kindShown(0)} label={frame >= mergedAt(0) ? `${a[0]} + ${b[0]} = ${s[0]}` : ""} />
            <TileGroup kind="bar" n={s[1]} colour={GREEN} shown={kindShown(1)} label={frame >= mergedAt(1) ? `${a[1]} + ${b[1]} = ${s[1]}` : ""} />
            <TileGroup kind="dot" n={s[2]} colour={GOLD} shown={kindShown(2)} label={frame >= mergedAt(2) ? `${a[2]} + ${b[2]} = ${s[2]}` : ""} />
          </div>
        )}
        {sceneId === "record" && (
          // not-speech-bound — the closing tip names no number
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }

  // multiply / factor share the rectangle.
  {
    const p = unit.p ?? 2, q = unit.q ?? 3;
    const m = p + q, k = p * q;
    const isFactor = unit.mode === "factor";
    const per = Math.floor((dur * 0.55) / 4); // not-speech-bound — fallback spacing
    const roomFb = (i: number) => step(0.15) + i * per;

    // Narration order, mirroring script-poly.ts line for line.
    let roomAt = [0, 0, 0, 0]; // not-speech-bound — the rooms carry over from the previous scene
    let pAt = 0, qAt = 0;
    let titleParts: TextPart[] | null = null;
    let cardAt = [0, 0]; // factor's two candidate pairs

    if (!isFactor) {
      if (sceneId === "ask") {
        // "Multiply x plus 2… by x plus 3."
        const at = spokenAt(said, [p, q], () => 4);
        pAt = at[0]; qAt = at[1];
        roomAt = [NEVER, NEVER, NEVER, NEVER]; // not-speech-bound — no room is built yet
        titleParts = [
          { text: `(x + ${p})`, at: at[0] },
          { text: `(x + ${q})`, at: at[1] },
        ];
      } else if (sceneId === "work") {
        // "top: x, then 2. side: x, then 3. … x times 3… 3 x. 2 times x… 2 x. And 2 times 3… 6."
        const at = spokenAt(said, [p, q, q, q, p, p, p, q, k], (i) => (i < 2 ? 4 : roomFb(Math.min(3, i - 2))));
        pAt = at[0]; qAt = at[1];
        roomAt = [Math.max(0, at[3] - 24), at[3], at[5], at[8]]; // x² is spoken as words, so it settles before "3 x"
      } else if (sceneId === "twist") {
        // "Then 3 x and 2 x — together 5 x. And the 6. The product: x squared, plus 5 x, plus 6."
        const at = spokenAt(said, [q, p, m, k, m, k], () => 4);
        titleParts = [
          { text: "x²", at: Math.max(0, at[0] - 24) },
          { text: ` + ${q}x`, at: at[0] },
          { text: ` + ${p}x`, at: at[1] },
          { text: `  →  x² + ${m}x`, at: at[4] },
          { text: ` + ${k}`, at: at[5] },
        ];
      }
    } else {
      if (sceneId === "ask") {
        // "x squared, plus 5 x, plus 6. Factoring asks: which two brackets…"
        const at = spokenAt(said, [m, k], () => 4);
        titleParts = [
          { text: "x²", at: Math.max(0, at[0] - 24) },
          { text: ` + ${m}x`, at: at[0] },
          { text: ` + ${k}`, at: at[1] },
          { text: " = ( ? )( ? )", at: at[1] },
        ];
      } else if (sceneId === "work") {
        // "MULTIPLY to 6, and ADD to 5. Walk the factor pairs of 6. 1 and 6: add to 7… no. 2 and 3: add to 5."
        const at = spokenAt(said, [k, m, k, 1, k, 1 + k, p, q, m], () => 4);
        titleParts = [
          { text: `× to ${k}`, at: at[0] },
          { text: ` · + to ${m}`, at: at[1] },
          { text: `  →  ${p} and ${q}`, at: at[6] },
        ];
        cardAt = [at[3], at[6]];
      } else if (sceneId === "twist") {
        // "brackets are x plus 2… and x plus 3. … Rebuild: x squared… 3 x… 2 x… 6."
        const at = spokenAt(said, [p, q, q, p, k, m, k], () => 4);
        titleParts = [
          { text: `(x + ${p})`, at: at[0] },
          { text: `(x + ${q}) — rebuild it`, at: at[1] },
        ];
        roomAt = [Math.max(0, at[2] - 24), at[2], at[3], at[4]];
      }
    }

    const headline = isFactor
      ? sceneId === "work" ? `× to ${k} · + to ${m} → ${p} and ${q}` : sceneId === "twist" ? `(x + ${p})(x + ${q}) — rebuild it` : "The brackets write themselves"
      : sceneId === "work" ? "Four rooms" : `x² + ${m}x + ${k}`;
    const showBox = !(isFactor && (sceneId === "ask" || sceneId === "work"));
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 20 }}>
        {titleParts ? <TitleParts parts={titleParts} /> : <Title text={headline} at={4} />}
        {showBox ? (
          <AreaBox p={p} q={q} roomAt={roomAt} pAt={pAt} qAt={qAt} />
        ) : (
          <div style={{ display: "flex", gap: 50 }}>
            {[
              [1, k],
              [p, q],
            ].map(([f1, f2], i) => {
              const good = f1 + f2 === m;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 20,
                    border: `5px solid ${good ? GREEN : MUTED}`,
                    padding: "26px 42px",
                    backgroundColor: "#FFF",
                    opacity: sceneId === "ask" ? 0.15 : frame >= cardAt[i] ? 1 : 0.15,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 60, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {f1} · {f2} = {f1 * f2}
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 800, color: good ? GREEN : MUTED }}>
                    {f1} + {f2} = {f1 + f2} {good ? "✓" : "✗"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {sceneId === "record" && (
          // not-speech-bound — the closing tip names no number
          <div style={{ fontSize: 44, fontWeight: 800, color: GREEN }}>{unit.tip}</div>
        )}
      </AbsoluteFill>
    );
  }
}

export const PolyVideo: React.FC<PolyProps> = ({ unit: unitId, voice = DEFAULT_VOICE_KEY }) => {
  const { width } = useVideoConfig();
  const unit = polyUnitById(unitId);
  const scenes = polySceneTimings(unitId, voice);
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
