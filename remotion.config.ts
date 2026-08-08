// remotion.config.ts — applies to `npx remotion studio` / `npx remotion render`
// only. The Next.js app does not read this file.
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/remotion/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
