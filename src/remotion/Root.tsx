// src/remotion/Root.tsx
// Registry of renderable Remotion compositions for this repo.
// Preview:  npx remotion studio --no-open
// Render:   npx remotion render MulTens out/mul-tens.jessica.mp4 --props='{"voice":"jessica"}'
//
// One render per narration voice: the audio is baked into the file, and each
// voice reads the script at a different length, so the composition's duration
// is computed from the chosen voice's clips rather than fixed.
import { Composition } from "remotion";
import { MulTensVideo, FPS } from "./lesson/MulTensVideo";
import { totalFrames } from "./lesson/timeline";
import { DEFAULT_VOICE_KEY } from "./lesson/voices";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MulTens"
      component={MulTensVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: totalFrames(props.voice),
      })}
    />
  );
};
