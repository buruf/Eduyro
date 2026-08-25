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
import { totalFrames, columnTotalFrames, tenFrameTotalFrames, dealingTotalFrames, factFamilyTotalFrames, areaTotalFrames, countTotalFrames, compareTotalFrames, numberLineTotalFrames, fractionBarTotalFrames, hundredGridTotalFrames, ratioTotalFrames, balanceTotalFrames, graphTotalFrames, functionTotalFrames, trigTotalFrames, polyTotalFrames, advancedTotalFrames, fracOpsTotalFrames } from "./lesson/timeline";
import { DEFAULT_VOICE_KEY } from "./lesson/voices";
import { EQUAL_GROUP_UNITS, COLUMN_UNITS, TEN_FRAME_UNITS, DEALING_UNITS, FACT_FAMILY_UNITS, AREA_UNITS, COUNT_UNITS, COMPARE_UNITS, NUMBER_LINE_UNITS, FRACTION_BAR_UNITS, HUNDRED_GRID_UNITS, RATIO_UNITS, BALANCE_UNITS, GRAPH_UNITS } from "./lesson/units";
import { ColumnVideo } from "./lesson/ColumnVideo";
import { TenFrameVideo } from "./lesson/TenFrameVideo";
import { DealingVideo } from "./lesson/DealingVideo";
import { FactFamilyVideo } from "./lesson/FactFamilyVideo";
import { AreaVideo } from "./lesson/AreaVideo";
import { CountVideo } from "./lesson/CountVideo";
import { CompareVideo } from "./lesson/CompareVideo";
import { NumberLineVideo } from "./lesson/NumberLineVideo";
import { FractionBarVideo } from "./lesson/FractionBarVideo";
import { HundredGridVideo } from "./lesson/HundredGridVideo";
import { RatioTableVideo } from "./lesson/RatioTableVideo";
import { BalanceVideo } from "./lesson/BalanceVideo";
import { GraphVideo } from "./lesson/GraphVideo";
import { FunctionMachineVideo } from "./lesson/FunctionMachineVideo";
import { FUNCTION_UNITS } from "./lesson/units-functions";
import { TrigVideo } from "./lesson/TrigVideo";
import { TRIG_UNITS } from "./lesson/units-trig";
import { PolyVideo } from "./lesson/PolyVideo";
import { POLY_UNITS } from "./lesson/units-poly";
import { FractionOpsVideo } from "./lesson/FractionOpsVideo";
import { FRAC_OPS_UNITS } from "./lesson/units-fracops";
import { AdvancedVideo } from "./lesson/AdvancedVideo";
import { ADVANCED_UNITS } from "./lesson/units-advanced";

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
    <Composition
      id="FractionBar"
      component={FractionBarVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: FRACTION_BAR_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: fractionBarTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="HundredGrid"
      component={HundredGridVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: HUNDRED_GRID_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: hundredGridTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="RatioTable"
      component={RatioTableVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: RATIO_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: ratioTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Balance"
      component={BalanceVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: BALANCE_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: balanceTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Graph"
      component={GraphVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: GRAPH_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: graphTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="FunctionMachine"
      component={FunctionMachineVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: FUNCTION_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: functionTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Trig"
      component={TrigVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: TRIG_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: trigTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Poly"
      component={PolyVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: POLY_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: polyTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="Advanced"
      component={AdvancedVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: ADVANCED_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: advancedTotalFrames(props.unit, props.voice),
      })}
    />
    <Composition
      id="FractionOps"
      component={FractionOpsVideo}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ unit: FRAC_OPS_UNITS[0].id, voice: DEFAULT_VOICE_KEY }}
      calculateMetadata={({ props }) => ({
        durationInFrames: fracOpsTotalFrames(props.unit, props.voice),
      })}
    />
    </>
  );
};
