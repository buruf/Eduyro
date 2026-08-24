// src/app/icon.tsx
// Browser-tab icon. There was none: /favicon.ico 404'd and no <link rel=icon>
// appeared in any page head, so every visitor saw a blank document icon next
// to a paid product. Generated rather than committed as a binary so it stays
// in step with the wordmark used on the OG card.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1612",
          color: "#E8C87A",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
          borderRadius: 6,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
