// src/app/opengraph-image.tsx
// Dynamically-generated branded social-share card (replaces the missing
// /og-image.png). Next renders this for OpenGraph + Twitter automatically.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Eduyro — Mastery learning, one worksheet at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1612",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700 }}>
          <span style={{ color: "#FDFAF4" }}>Edu</span>
          <span style={{ color: "#E8C87A" }}>yro</span>
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 24, color: "#D7CFC1" }}>
          Mastery learning, one worksheet at a time
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 48, color: "#9A8F7E", letterSpacing: 2 }}>
          MATH · READING · WRITING · SCIENCE · PRE-K – GRADE 12
        </div>
      </div>
    ),
    size,
  );
}
