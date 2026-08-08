// src/components/tutorial/pilot/Greeter.tsx
// Client-only wrapper that plays the greeter animation via @remotion/player.
// Loaded with next/dynamic (ssr:false) by the tutorial so the Player bundle
// never ships to students who don't open this lesson — same pattern the
// codebase already uses for the Mafs explorers.
"use client";

import { useEffect, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  GreeterScene,
  GREETER_DURATION,
  GREETER_FPS,
} from "@/remotion/pilot/GreeterScene";

export default function Greeter({ start }: { start: boolean }) {
  const ref = useRef<PlayerRef>(null);

  // `autoPlay` alone is unreliable: the Player mounts a silent <audio> element
  // for A/V sync, so browsers can refuse to start it without a user gesture
  // and she freezes on frame 0 (scale 0 — invisible). Muting makes autoplay
  // permitted, and driving play() from a ref covers the case where the Player
  // finished mounting after its own autoPlay attempt.
  useEffect(() => {
    const p = ref.current;
    // Hold on frame 0 (she is not yet on screen) until the greeting is
    // actually being SPOKEN. The clip has to be fetched from /api/tts first,
    // so a self-starting animation finishes waving before the voice says
    // "Hey!" — the wave has to begin when the line does.
    if (!p || !start) return;
    // On `ended` the Player rewinds to frame 0 — which for this composition is
    // the pre-entrance state (scale 0), i.e. she vanishes the moment she
    // finishes waving. Pin her to the final resting pose instead.
    const onEnded = () => {
      try {
        p.pause();
        p.seekTo(GREETER_DURATION - 1);
      } catch {
        /* noop */
      }
    };
    p.addEventListener("ended", onEnded);
    try {
      p.mute();
      p.play();
    } catch {
      /* animation is decorative — a blocked start must never break the lesson */
    }
    return () => {
      try {
        p.removeEventListener("ended", onEnded);
      } catch {
        /* noop */
      }
    };
  }, [start]);

  return (
    <Player
      ref={ref}
      component={GreeterScene}
      durationInFrames={GREETER_DURATION}
      compositionWidth={300}
      compositionHeight={300}
      fps={GREETER_FPS}
      // No autoPlay — playback is driven by the effect above so the wave
      // starts on the spoken line, not on mount.
      initiallyMuted
      // No loop: she waves once and settles. The spec forbids decorative
      // motion while the child is reading or thinking.
      style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      // Purely decorative — the narration line beside her carries the meaning.
      className="pointer-events-none"
    />
  );
}
