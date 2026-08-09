// src/remotion/Root.tsx
// Registry of renderable Remotion compositions for this repo.
// Preview:  npx remotion studio --no-open
// Render:   npx tsx scripts/render-lessons.ts
//
// One render per (unit × voice): audio is baked into the file, and each unit
// and voice runs to a different length, so duration is computed from the
// chosen combination's clips rather than fixed.
import { Composition } from "remotion";
import { EqualGroupsVideo, FPS } from "./lesson/EqualGroupsVideo";
import { totalFrames, columnTotalFrames } from "./lesson/timeline";
import { DEFAULT_VOICE_KEY } from "./lesson/voices";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS } from "./lesson/units";
import { ColumnVideo } from "./lesson/ColumnVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="EqualGroups"
      component={EqualGroupsVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: EQUAL_GROUP_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: totalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Column"
      component={ColumnVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: COLUMN_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: columnTotalFrames(props.unit, props.voice),
      })}
    />
    </>
  );
};
