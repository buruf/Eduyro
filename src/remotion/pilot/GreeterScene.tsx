// src/remotion/pilot/GreeterScene.tsx
// The tutorial's greeter — an illustrated girl who waves hello and delivers the
// hook line ("Hey — I need your help with something").
//
// Frame-driven via Remotion so the motion is real animation, not CSS easing:
// she pops in on a spring, waves three times from the shoulder with the wrist
// counter-rotating (what makes a wave read as a wave rather than a rocking
// stick), then settles into a still, friendly hand-up pose. Nothing loops —
// per the pilot spec there is no decorative motion while the child is reading.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const GREETER_FPS = 30;
export const GREETER_DURATION = 78;

// Palette — warm, matches the tutorial's cream/gold/ink stage.
const SKIN = "#E8B183";
const SKIN_SHADE = "#D2966A";
const HAIR = "#4A2E1E";
const HAIR_HI = "#6B452E";
const SHIRT = "#2F6FB5";
const SHIRT_SHADE = "#255A94";
const INK = "#2E2016";

/** Hand drawn around a local origin at the wrist (0,0), fingers pointing up. */
function Hand() {
  return (
    <g>
      {/* palm */}
      <path
        d="M -17,2
           Q -19,-16 -13,-24
           Q 0,-30 13,-24
           Q 19,-16 17,2
           Q 12,12 0,13
           Q -12,12 -17,2 Z"
        fill={SKIN}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* four fingers */}
      {[
        { x: -11.5, len: 20 },
        { x: -3.8, len: 24 },
        { x: 3.8, len: 23 },
        { x: 11.5, len: 18 },
      ].map((f, i) => (
        <rect
          key={i}
          x={f.x - 3.6}
          y={-24 - f.len}
          width={7.2}
          height={f.len + 8}
          rx={3.6}
          fill={SKIN}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      {/* thumb, angled off the side of the palm */}
      <rect
        x={-6}
        y={-12}
        width={7}
        height={20}
        rx={3.5}
        fill={SKIN}
        stroke={INK}
        strokeWidth={2}
        style={{ rotate: "58deg", transformOrigin: "-3px 6px", transformBox: "fill-box" }}
      />
      {/* knuckle shading so the palm reads as a palm */}
      <path d="M -12,-20 Q 0,-15 12,-20" fill="none" stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export const GreeterScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance: pop in with an overshoot, then hold.
  const pop = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  // Wave: three swings from the shoulder (frames 14-62), settling at +6deg so
  // the resting pose is "hand up, friendly" rather than a frozen mid-swing.
  const armRotate = interpolate(
    frame,
    [14, 24, 34, 44, 54, 62],
    [-8, 26, -4, 26, -2, 6],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    },
  );

  // Wrist trails the arm slightly — the counter-rotation is what sells a wave.
  const wristRotate = interpolate(
    frame,
    [14, 26, 36, 46, 56, 62],
    [10, -16, 12, -16, 8, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.45, 0, 0.55, 1),
    },
  );

  // Head tilts toward the raised hand while she waves, then straightens.
  const headTilt = interpolate(frame, [14, 30, 62], [0, -5, -2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });

  // A single blink around frame 46 (eyelids close and reopen over ~5 frames).
  const blink = interpolate(frame, [44, 46, 48], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <svg viewBox="0 0 300 300" width="100%" height="100%">
        <g
          style={{
            scale: String(pop),
            transformOrigin: "150px 250px",
            transformBox: "view-box",
            opacity: pop,
          }}
        >
          {/* ---- torso ---- */}
          <path
            d="M 96,300 Q 98,238 150,228 Q 202,238 204,300 Z"
            fill={SHIRT}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <path d="M 150,228 L 150,300" stroke={SHIRT_SHADE} strokeWidth={2} />
          {/* collar */}
          <path d="M 133,231 Q 150,246 167,231" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          {/* neck */}
          <rect x={139} y={200} width={22} height={34} rx={9} fill={SKIN_SHADE} stroke={INK} strokeWidth={2} />

          {/* ---- waving arm (rotates from the shoulder) ---- */}
          <g
            style={{
              rotate: `${armRotate}deg`,
              transformOrigin: "199px 252px",
              transformBox: "view-box",
            }}
          >
            {/* upper arm + forearm as one tapered sleeve→skin limb */}
            <path
              d="M 191,258 Q 196,222 212,196"
              fill="none"
              stroke={SHIRT}
              strokeWidth={26}
              strokeLinecap="round"
            />
            <path
              d="M 191,258 Q 196,222 212,196"
              fill="none"
              stroke={INK}
              strokeWidth={2}
              strokeOpacity={0.25}
            />
            <path
              d="M 212,196 Q 224,172 230,150"
              fill="none"
              stroke={SKIN}
              strokeWidth={21}
              strokeLinecap="round"
            />
            {/* hand at the end of the forearm, wrist counter-rotating */}
            <g
              style={{
                translate: "230px 146px",
                rotate: `${wristRotate}deg`,
                transformBox: "fill-box",
              }}
            >
              <Hand />
            </g>
          </g>

          {/* ---- resting arm: hangs down at her side ---- */}
          <path
            d="M 106,250 Q 96,272 94,292"
            fill="none"
            stroke={SHIRT}
            strokeWidth={25}
            strokeLinecap="round"
          />
          <path d="M 94,292 Q 93,300 93,306" fill="none" stroke={SKIN} strokeWidth={20} strokeLinecap="round" />

          {/* ---- head ---- */}
          <g
            style={{
              rotate: `${headTilt}deg`,
              transformOrigin: "150px 205px",
              transformBox: "view-box",
            }}
          >
            {/* ears */}
            <ellipse cx={96} cy={140} rx={9} ry={13} fill={SKIN} stroke={INK} strokeWidth={2} />
            <ellipse cx={204} cy={140} rx={9} ry={13} fill={SKIN} stroke={INK} strokeWidth={2} />
            {/* face */}
            <ellipse cx={150} cy={137} rx={56} ry={64} fill={SKIN} stroke={INK} strokeWidth={2.5} />
            {/* hair: cap + side sweep + a loose strand */}
            <path
              d="M 94,140
                 Q 88,74 150,70
                 Q 212,74 206,140
                 Q 202,112 194,104
                 Q 172,118 150,112
                 Q 122,118 106,104
                 Q 98,112 94,140 Z"
              fill={HAIR}
              stroke={INK}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <path d="M 118,84 Q 150,74 182,84" fill="none" stroke={HAIR_HI} strokeWidth={3} strokeLinecap="round" />
            {/* eyebrows */}
            <path d="M 116,116 Q 128,109 140,114" fill="none" stroke={HAIR} strokeWidth={3.5} strokeLinecap="round" />
            <path d="M 160,114 Q 172,109 184,116" fill="none" stroke={HAIR} strokeWidth={3.5} strokeLinecap="round" />
            {/* eyes — sclera, iris, pupil, highlight; eyelid closes on blink */}
            {[128, 172].map((cx) => (
              <g key={cx}>
                <ellipse cx={cx} cy={134} rx={10} ry={11.5 * (1 - blink) + 0.8} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
                <circle cx={cx} cy={135} r={6.4 * (1 - blink)} fill="#3B6E4A" />
                <circle cx={cx} cy={135} r={3.2 * (1 - blink)} fill={INK} />
                <circle cx={cx - 2.4} cy={131} r={2.2 * (1 - blink)} fill="#FFFFFF" />
              </g>
            ))}
            {/* nose */}
            <path d="M 148,146 Q 143,154 151,156" fill="none" stroke={SKIN_SHADE} strokeWidth={2.5} strokeLinecap="round" />
            {/* open smile with tongue — an actual expression, not a curve */}
            <path
              d="M 130,166 Q 150,186 170,166 Q 150,174 130,166 Z"
              fill="#8E3B3B"
              stroke={INK}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <path d="M 130,166 Q 150,171 170,166" fill="#FFFFFF" stroke="none" />
            <path d="M 130,166 Q 150,186 170,166" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            {/* blush */}
            <ellipse cx={116} cy={158} rx={11} ry={7} fill="#E38B8B" opacity={0.45} />
            <ellipse cx={184} cy={158} rx={11} ry={7} fill="#E38B8B" opacity={0.45} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
