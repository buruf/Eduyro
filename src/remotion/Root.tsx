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
import { totalFrames, columnTotalFrames, tenFrameTotalFrames, dealingTotalFrames, factFamilyTotalFrames, areaTotalFrames, countTotalFrames, compareTotalFrames, numberLineTotalFrames } from "./lesson/timeline";
import { DEFAULT_VOICE_KEY } from "./lesson/voices";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS } from "./lesson/units";
import { ColumnVideo } from "./lesson/ColumnVideo";
import { TenFrameVideo } from "./lesson/TenFrameVideo";
import { DealingVideo } from "./lesson/DealingVideo";
import { FactFamilyVideo } from "./lesson/FactFamilyVideo";
import { AreaVideo } from "./lesson/AreaVideo";
import { CountVideo } from "./lesson/CountVideo";
import { CompareVideo } from "./lesson/CompareVideo";
import { NumberLineVideo } from "./lesson/NumberLineVideo";

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
    <Composition
      id="TenFrame"
      component={TenFrameVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: TEN_FRAME_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: tenFrameTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Dealing"
      component={DealingVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: DEALING_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: dealingTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="FactFamily"
      component={FactFamilyVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: FACT_FAMILY_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: factFamilyTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Area"
      component={AreaVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: AREA_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: areaTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Count"
      component={CountVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: COUNT_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: countTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Compare"
      component={CompareVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: COMPARE_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: compareTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="NumberLine"
      component={NumberLineVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: NUMBER_LINE_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: numberLineTotalFrames(props.unit, props.voice),
      })}
    />
    </>
  );
};
