// src/remotion/Root.tsx
// Registry of renderable Remotion compositions for this repo.
// Preview:  npx remotion studio --no-open
// Render:   npx remotion render MulTens out/mul-tens.mp4
import { Composition } from "remotion";
import { MulTensVideo, FPS, DURATION } from "./lesson/MulTensVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MulTens"
      component={MulTensVideo}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
