// src/remotion/lesson/Brand.tsx
// The eduyro.com wordmark, shown on every lesson video.
//
// Deliberately quiet: these videos are watched by a child who is about to
// practise, and a mark that competes with the teaching is a mark that costs
// attention. So it sits bottom-right, small, low-contrast, and never moves or
// animates — nothing on screen should pull the eye away from the maths.
//
// Bottom-right is the one corner no template draws into: every stage is
// centred with margins, and the scene captions sit centre or top.
import { AbsoluteFill } from "remotion";

const INK = "#2E2016";
const GOLD = "#C8902A";

export function Brand() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          right: 46,
          bottom: 34,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: 0.42,
        }}
      >
        {/* The dot echoes the counters used throughout the lessons. */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: GOLD,
          }}
        />
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 34,
            fontWeight: 700,
            color: INK,
            letterSpacing: 0.5,
          }}
        >
          eduyro<span style={{ color: GOLD }}>.com</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
