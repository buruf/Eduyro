// src/components/tutorial/pilot/MulTensPilotTutorial.tsx
// Pilot redesign of the concept tutorial for "Multiplying tens" (20 × 3).
// 45-second, one-example, tap-gated flow: Hook (guess) → Reveal (marble
// waves) → Compress + payoff (rods → symbol, "put the zero back"). Beats
// 3-4 (faded example / isomorphic check) land in a later task; for now the
// final tap of beat 2 calls onStart so the flow is usable end-to-end.
//
// Every advance is a child TAP — no timer ever changes `beat` or the visual
// phase. The only timers in this file are (a) the 4s fade-in of the skip
// button and (b) prefetching the reveal audio clips during beat 0; the
// ~700ms zero-glyph translate and ~250ms sparkle are motion durations on an
// already-tapped-into state, not beat advances.
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MarbleStage, { type Phase, type Highlight } from "./MarbleStage";
import SkipCheck from "./SkipCheck";
import { PILOT } from "./pilot-script";
import { useTutorialLog } from "@/hooks/useTutorialLog";

type Beat = 0 | 1 | 2 | 3 | 4;

// Beat 0 sub-steps (hook): greet → the bag falls → count each row → notice the
// other two bags → the challenge (guess) → guessed.
type HookStep =
  | "bag1"
  | "spill"
  | "countGold"
  | "countBlue"
  | "otherBags"
  | "challenge"
  | "guessed";
// Beat 1 sub-steps (reveal). "sum" states the 20 + 20 + 20 = 60 that the three
// waves just acted out, before beat 2 compresses it to 6 tens.
type RevealStep =
  | "idle"
  | "wave1"
  | "wave1-done"
  | "wave2"
  | "wave2-done"
  | "wave3"
  | "wave3-done"
  | "sum";
// Beat 2 sub-steps (compress + payoff).
type CompressStep = "rods" | "symbol" | "payoff";

interface Props {
  open: boolean;
  studentId: string;
  /** False for "Review tutorial" replays — they must not enter the pilot's
   *  measurement funnel (skip/completion rates are first-run metrics). */
  logRun?: boolean;
  onStart: () => void;
  onClose: () => void;
}

// The greeter runs on @remotion/player — client-only, and lazily loaded so
// its bundle never reaches students who don't open this lesson.
const Greeter = dynamic(() => import("./Greeter"), { ssr: false });

// ---- audio: same /api/tts fetch shape as NarrationConductor, but a bare
// play-once helper (no visible player UI). Audio failure NEVER blocks the
// tutorial — every caller treats a failed/missing clip as "silently skip".
const clipCache = new Map<string, string | null>();

async function fetchClipUrl(text: string): Promise<string | null> {
  const cached = clipCache.get(text);
  if (cached !== undefined) return cached;
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) { clipCache.set(text, null); return null; }
    const j = await r.json();
    const url = j?.data?.url as string | undefined;
    if (!url) { clipCache.set(text, null); return null; }
    clipCache.set(text, url);
    return url;
  } catch {
    clipCache.set(text, null);
    return null;
  }
}

export default function MulTensPilotTutorial({ open, studentId, logRun = true, onStart, onClose }: Props) {
  const [beat, setBeat] = useState<Beat>(0);
  const [phase, setPhase] = useState<Phase>("empty");
  const [hookStep, setHookStep] = useState<HookStep>("bag1");
  const [highlight, setHighlight] = useState<Highlight>("none");
  const [revealStep, setRevealStep] = useState<RevealStep>("idle");
  const [compressStep, setCompressStep] = useState<CompressStep>("rods");

  const [guess, setGuess] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const [skipVisible, setSkipVisible] = useState(false);
  const [skipRequested, setSkipRequested] = useState(false);

  const [showSparkle, setShowSparkle] = useState(false);
  const [zeroTranslated, setZeroTranslated] = useState(false);

  // Beat 3 (faded worked example — completion problem).
  const [beat3Answer, setBeat3Answer] = useState("");
  const [beat3Wrong, setBeat3Wrong] = useState(false);
  const [beat3Done, setBeat3Done] = useState(false);

  // Beat 4 (isomorphic check).
  const [beat4Answer, setBeat4Answer] = useState("");
  const [beat4Wrong, setBeat4Wrong] = useState(false);
  const [beat4Scaffold, setBeat4Scaffold] = useState(false);
  const [beat4ScaffoldAnswer, setBeat4ScaffoldAnswer] = useState("");

  const tlog = useTutorialLog({ studentId, skillId: PILOT.skillId, variant: "pilot", enabled: open && logRun });

  const openedAtRef = useRef<number | null>(null);
  const audioPlayedMsRef = useRef(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  // Set true once the run has reached a terminal outcome (finished to
  // practice or passed the skip check) so the × close handler below only
  // logs an abandon event for runs that never resolved.
  const runFinishedRef = useRef(false);

  const advance = (b: Beat) => {
    tlog.bumpTap();
    tlog.log({ beatIndex: b });
    setBeat(b);
  };
  const tapOnly = () => tlog.bumpTap();

  // Play a narration line by key from PILOT.narration. Never blocks the UI —
  // resolves immediately if the fetch fails; still counts ms toward the log
  // once the clip actually plays and ends.
  const playLine = (text: string) => {
    // Interrupt whatever's currently playing so fast taps never overlap
    // audio; still bank the ms it actually played before being cut off.
    const prev = currentAudioRef.current;
    if (prev) {
      audioPlayedMsRef.current += (prev.currentTime || 0) * 1000;
      prev.pause();
      currentAudioRef.current = null;
      tlog.log({ audioPlayedMs: Math.round(audioPlayedMsRef.current) });
    }
    fetchClipUrl(text).then((url) => {
      if (!url) return;
      try {
        const a = new Audio(url);
        currentAudioRef.current = a;
        a.addEventListener("ended", () => {
          audioPlayedMsRef.current += (a.duration || 0) * 1000;
          tlog.log({ audioPlayedMs: Math.round(audioPlayedMsRef.current) });
        });
        a.play().catch(() => { /* autoplay blocked — tutorial still works muted */ });
      } catch { /* noop — audio is best-effort */ }
    });
  };

  // ---- open: reset state, kick off beat 0, prefetch reveal clips ----
  useEffect(() => {
    if (!open) return;
    openedAtRef.current = Date.now();
    runFinishedRef.current = false;
    setBeat(0);
    setPhase("bag1");
    setHookStep("bag1");
    setHighlight("none");
    setRevealStep("idle");
    setCompressStep("rods");
    setGuess("");
    setGuessSubmitted(false);
    setSkipVisible(false);
    setSkipRequested(false);
    setShowSparkle(false);
    setZeroTranslated(false);
    setBeat3Answer("");
    setBeat3Wrong(false);
    setBeat3Done(false);
    setBeat4Answer("");
    setBeat4Wrong(false);
    setBeat4Scaffold(false);
    setBeat4ScaffoldAnswer("");
    audioPlayedMsRef.current = 0;

    playLine(PILOT.narration.hook1);
    // Prefetch the three reveal clips now so beat 1 playback is instant.
    PILOT.narration.reveal.forEach((t) => { fetchClipUrl(t); });

    const t = setTimeout(() => setSkipVisible(true), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // ---- beat 0: hook ----
  function handleHookTap() {
    if (beat !== 0 || skipRequested) return;
    tapOnly();
    if (hookStep === "bag1") {
      // The sack tips over and pours out its twenty marbles.
      setHookStep("spill");
      setPhase("grid20");
      playLine(PILOT.narration.spill);
    } else if (hookStep === "spill") {
      setHookStep("countGold");
      setHighlight("gold");
      playLine(PILOT.narration.countGold);
    } else if (hookStep === "countGold") {
      setHookStep("countBlue");
      setHighlight("blue");
      playLine(PILOT.narration.countBlue);
    } else if (hookStep === "countBlue") {
      setHookStep("otherBags");
      setHighlight("none");
      setPhase("bags3");
      playLine(PILOT.narration.otherBags);
    } else if (hookStep === "otherBags") {
      setHookStep("challenge");
      playLine(PILOT.narration.challenge);
    }
    // "challenge" and "guessed" are advanced via the keypad / "let's find
    // out" tap below, not the generic stage tap.
  }

  function submitGuess() {
    if (!guess) return;
    tlog.log({ predictionAnswer: guess, predictionCorrect: guess === String(PILOT.answer) });
    setGuessSubmitted(true);
    setHookStep("guessed");
    playLine(PILOT.narration.checkGuess);
  }

  function goToReveal() {
    advance(1);
  }

  // ---- beat 1: reveal ----
  function handleRevealTap() {
    if (beat !== 1) return;
    tapOnly();
    if (revealStep === "idle") {
      setRevealStep("wave1");
      setPhase("wave1");
    } else if (revealStep === "wave1-done") {
      setRevealStep("wave2");
      setPhase("wave2");
    } else if (revealStep === "wave2-done") {
      setRevealStep("wave3");
      setPhase("wave3");
    } else if (revealStep === "wave3-done") {
      // Name the addition the three waves just acted out, before beat 2
      // compresses it into tens.
      setRevealStep("sum");
      playLine(PILOT.narration.addUp);
    } else if (revealStep === "sum") {
      advance(2);
      setPhase("rods");
      setCompressStep("rods");
    }
  }

  function handleWave(n: 1 | 2 | 3) {
    playLine(PILOT.narration.reveal[n - 1]);
    if (n === 1) setRevealStep("wave1-done");
    if (n === 2) setRevealStep("wave2-done");
    if (n === 3) setRevealStep("wave3-done");
  }

  // ---- beat 2: compress + payoff ----
  function handleCompressTap() {
    if (beat !== 2) return;
    tapOnly();
    if (compressStep === "rods") {
      setCompressStep("symbol");
      setPhase("symbol");
      playLine(PILOT.narration.compress);
    } else if (compressStep === "symbol") {
      // Tap-gated: the child's tap is what triggers the payoff overlay.
      // The 700ms translate + 250ms sparkle that follow are motion
      // durations on an already-tapped-into state, not beat advances.
      setCompressStep("payoff");
      playLine(PILOT.narration.payoff);
      setShowSparkle(true);
      requestAnimationFrame(() => setZeroTranslated(true));
      setTimeout(() => setShowSparkle(false), 250);
    } else if (compressStep === "payoff") {
      advance(3);
    }
  }

  // ---- beat 3: faded worked example (completion problem) ----
  const tensA = PILOT.a / 10; // 2
  const tensAnswer = PILOT.answer / 10; // 6
  const beat3Steps = [
    `${PILOT.a} is ${tensA} tens`,
    `${tensA} tens × ${PILOT.b} = ${tensAnswer} tens`,
    `${tensAnswer} tens = ___`,
  ];

  function submitBeat3() {
    if (!beat3Answer) return;
    if (beat3Answer === String(PILOT.answer)) {
      setBeat3Wrong(false);
      setBeat3Done(true);
    } else {
      // Gentle retry — no penalty copy, steps stay visible.
      setBeat3Wrong(true);
      setBeat3Answer("");
    }
  }

  function goToBeat4() {
    // beatIndex 4 is reserved for actual completion (finishToPractice) so
    // that walk-aways after entering beat 4 don't count as completers. This
    // entry advance logs 3 (the highest "reached but not necessarily
    // finished" marker) — `beat` itself still moves to 4 for rendering.
    tlog.bumpTap();
    tlog.log({ beatIndex: 3 });
    setBeat(4);
    playLine(PILOT.narration.handoff);
  }

  // ---- beat 4: isomorphic check ----
  const iso = PILOT.iso;
  const isoTensA = iso.a / 10; // 3
  const isoTensAnswer = iso.answer / 10; // 9
  const beat4Steps = [
    `${iso.a} is ${isoTensA} tens`,
    `${isoTensA} tens × ${iso.b} = ${isoTensAnswer} tens`,
    `${isoTensAnswer} tens = ___`,
  ];

  function finishToPractice() {
    runFinishedRef.current = true;
    tlog.log({ beatIndex: 4 });
    tlog.end();
    currentAudioRef.current?.pause();
    onStart();
  }

  function submitBeat4() {
    if (!beat4Answer) return;
    if (beat4Answer === String(iso.answer)) {
      finishToPractice();
    } else {
      // Wrong on the isomorphic check → reveal the same 3-step scaffold
      // with the iso numbers, penalty-free retry.
      setBeat4Wrong(true);
      setBeat4Scaffold(true);
      setBeat4Answer("");
    }
  }

  function submitBeat4Scaffold() {
    if (!beat4ScaffoldAnswer) return;
    if (beat4ScaffoldAnswer === String(iso.answer)) {
      finishToPractice();
    } else {
      setBeat4ScaffoldAnswer("");
    }
  }

  function handleSkipClick() {
    const skipAtMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    tlog.bumpTap();
    tlog.log({ skipTapped: true, skipAtMs });
    setSkipRequested(true);
  }

  // ---- skip check: pass = legit skip straight to practice; fail = resume
  // the tutorial at beat 1 (reveal), not back at beat 0. ----
  function handleSkipPass() {
    runFinishedRef.current = true;
    tlog.end();
    currentAudioRef.current?.pause();
    onStart();
  }

  function handleSkipFail() {
    setSkipRequested(false);
    advance(1);
    setRevealStep("idle");
    setPhase("bags3");
  }

  // Mirrors the old modal's handleClose: the × button is reachable on every
  // beat, so a tap there before the run resolves (finishToPractice /
  // handleSkipPass) is an abandonment that must be logged, or completion
  // funnels silently overcount (walk-aways vanish instead of showing up as
  // non-completers).
  function handleClose() {
    if (!runFinishedRef.current) {
      const skipAtMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
      tlog.log({ skipTapped: true, skipAtMs });
      tlog.end();
    }
    onClose();
  }

  const showKeypad = beat === 0 && hookStep === "challenge" && !guessSubmitted;
  const stageTapHandler =
    beat === 0 ? handleHookTap : beat === 1 ? handleRevealTap : beat === 2 ? handleCompressTap : undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative bg-[#FDFAF4] rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
        {skipVisible && beat === 0 && !skipRequested && (
          <button
            type="button"
            onClick={handleSkipClick}
            className="absolute top-3 right-10 text-xs text-muted hover:text-ink underline transition-opacity duration-500 opacity-100 z-10"
          >
            {PILOT.skipLabel}
          </button>
        )}
        {/* Close must be reachable on every beat, independent of the
            beat-0-only skip affordance. */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-ink/40 hover:text-ink text-lg leading-none z-10"
          aria-label="Close tutorial"
        >
          ×
        </button>

        {skipRequested ? (
          <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center gap-4">
            <SkipCheck onPass={handleSkipPass} onFail={handleSkipFail} onTap={tlog.bumpTap} />
          </div>
        ) : (
        <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center gap-4">
          <div className="relative w-full">
            <MarbleStage phase={phase} onWave={handleWave} highlight={highlight} />

            {/* Illustrated greeter for the hook line — she waves once and
                settles, so "Hey — I need your help" comes from SOMEONE.
                Leaves once the bag spills and the math takes the stage. */}
            {beat === 0 && hookStep === "bag1" && (
              <div
                className="absolute bottom-0 right-1 w-[185px] h-[185px] pointer-events-none"
                aria-hidden="true"
              >
                <Greeter />
              </div>
            )}

            {beat === 2 && compressStep === "symbol" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-4xl font-bold text-ink font-serif">
                  {PILOT.a} × {PILOT.b} = {PILOT.answer}
                </div>
              </div>
            )}

            {beat === 2 && compressStep === "payoff" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="text-4xl font-bold text-ink font-serif">
                  {PILOT.a} × {PILOT.b} = {PILOT.answer}
                </div>
                <div className="text-lg font-semibold text-brand-blue relative">
                  {PILOT.a / 10} × {PILOT.b} = {PILOT.answer / 10}
                  <span
                    className="inline-block font-bold ml-1"
                    style={{
                      transition: "transform 700ms ease",
                      transform: zeroTranslated ? "translate(28px, 18px)" : "translate(0, 0)",
                    }}
                  >
                    0
                  </span>
                </div>
                {showSparkle && (
                  <div
                    aria-hidden="true"
                    className="absolute text-2xl"
                    style={{ animation: "pilot-sparkle 250ms ease-out" }}
                  >
                    ✨
                  </div>
                )}
              </div>
            )}

            {beat === 3 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                {beat3Steps.map((s, i) => (
                  <div key={i} className="text-lg font-semibold text-ink font-serif">
                    {s}
                  </div>
                ))}
              </div>
            )}

            {beat === 4 && beat4Scaffold && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                {beat4Steps.map((s, i) => (
                  <div key={i} className="text-lg font-semibold text-ink font-serif">
                    {s}
                  </div>
                ))}
              </div>
            )}

            {beat === 4 && !beat4Scaffold && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-4xl font-bold text-ink font-serif">
                  {iso.a} × {iso.b} =
                </div>
              </div>
            )}
          </div>

          {/* Narration text is a visual anchor for what's playing — copy comes
              ONLY from PILOT.narration, never hardcoded. */}
          <div className="min-h-[2.5rem] text-lg font-medium text-ink">
            {beat === 0 && hookStep === "bag1" && PILOT.caption.hook1}
            {beat === 0 && hookStep === "spill" && PILOT.caption.spill}
            {beat === 0 && hookStep === "countGold" && PILOT.caption.countGold}
            {beat === 0 && hookStep === "countBlue" && PILOT.caption.countBlue}
            {beat === 0 && hookStep === "otherBags" && PILOT.caption.otherBags}
            {beat === 0 && hookStep === "challenge" && !guessSubmitted && PILOT.caption.challenge}
            {beat === 0 && guessSubmitted && PILOT.caption.checkGuess}
            {beat === 1 && revealStep === "idle" && "Tap to watch."}
            {beat === 1 && revealStep === "sum" && PILOT.caption.addUp}
            {beat === 1 && revealStep !== "idle" && revealStep !== "sum" && PILOT.narration.reveal[
              revealStep === "wave1" || revealStep === "wave1-done" ? 0
                : revealStep === "wave2" || revealStep === "wave2-done" ? 1
                : 2
            ]}
            {beat === 2 && compressStep === "rods" && "Tap to see it a different way."}
            {beat === 2 && compressStep === "symbol" && PILOT.narration.compress}
            {beat === 2 && compressStep === "payoff" && PILOT.narration.payoff}
            {beat === 3 && !beat3Done && !beat3Wrong && "Fill in the blank."}
            {beat === 3 && !beat3Done && beat3Wrong && "Try again — take another look."}
            {beat === 3 && beat3Done && "Nice work!"}
            {beat === 4 && !beat4Scaffold && !beat4Wrong && PILOT.narration.handoff}
            {beat === 4 && beat4Scaffold && "Let's break it down."}
          </div>

          {showKeypad && (
            <GuessKeypad
              value={guess}
              onChange={setGuess}
              onSubmit={submitGuess}
              onTap={tapOnly}
            />
          )}

          {beat === 0 && guessSubmitted && (
            <button
              type="button"
              onClick={goToReveal}
              className="px-6 py-3 rounded-full bg-brand-blue text-white font-semibold animate-pulse"
            >
              Tap to continue
            </button>
          )}

          {beat === 3 && !beat3Done && (
            <GuessKeypad
              value={beat3Answer}
              onChange={setBeat3Answer}
              onSubmit={submitBeat3}
              onTap={tapOnly}
            />
          )}

          {beat === 3 && beat3Done && (
            <button
              type="button"
              onClick={goToBeat4}
              className="px-6 py-3 rounded-full bg-brand-blue text-white font-semibold animate-pulse"
            >
              Tap to continue
            </button>
          )}

          {beat === 4 && !beat4Scaffold && (
            <GuessKeypad
              value={beat4Answer}
              onChange={setBeat4Answer}
              onSubmit={submitBeat4}
              onTap={tapOnly}
            />
          )}

          {beat === 4 && beat4Scaffold && (
            <GuessKeypad
              value={beat4ScaffoldAnswer}
              onChange={setBeat4ScaffoldAnswer}
              onSubmit={submitBeat4Scaffold}
              onTap={tapOnly}
            />
          )}

          {!showKeypad && !(beat === 0 && guessSubmitted) && beat !== 3 && beat !== 4 && stageTapHandler && (
            <button
              type="button"
              onClick={stageTapHandler}
              className="px-6 py-3 rounded-full bg-brand-blue text-white font-semibold animate-pulse"
            >
              Tap to continue
            </button>
          )}
        </div>
        )}
      </div>
      {/* global: these keyframes are referenced from inline `style` props,
          which styled-jsx does not rewrite — scoped names would never match. */}
      <style jsx global>{`
        @keyframes pilot-sparkle {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// Local 0-9 / ⌫ / ✓ keypad for the beat-0 guess. Not extracted from
// PracticeModal to avoid touching that file in this task.
function GuessKeypad({
  value,
  onChange,
  onSubmit,
  onTap,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onTap: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
  return (
    <div className="grid grid-cols-3 gap-2 w-48">
      <div className="col-span-3 text-2xl font-bold text-ink mb-1 min-h-[2rem]">{value || "?"}</div>
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            onTap();
            if (k === "⌫") onChange(value.slice(0, -1));
            else if (k === "✓") onSubmit();
            else if (value.length < 3) onChange(value + k);
          }}
          className={
            k === "✓"
              ? "rounded-lg bg-brand-blue text-white font-bold py-2"
              : "rounded-lg bg-white border border-ink/15 text-ink font-semibold py-2 hover:bg-ink/5"
          }
        >
          {k}
        </button>
      ))}
    </div>
  );
}
