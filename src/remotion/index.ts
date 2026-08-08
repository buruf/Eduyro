// src/remotion/index.ts
// Remotion bundler entry point (see remotion.config.ts). Kept separate from
// the Next.js app — nothing here ships in the web bundle.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
