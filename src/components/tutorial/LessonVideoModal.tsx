// src/components/tutorial/LessonVideoModal.tsx
// Plays a pre-rendered lesson video before a skill's practice.
//
// Replaces the interactive tutorial for units that have a video: the picture
// and narration are baked into one file, so they cannot drift apart the way a
// tap-driven animation racing a fetched audio clip can.
//
// Deliberately NOT autoplayed: browsers block autoplay with sound unless the
// user has interacted, and this modal opens on its own before practice — so an
// autoplay attempt would play the lesson silently, which is worse than not
// playing it. The child presses play, which is also the gesture that permits
// the audio.
"use client";

import { useEffect, useRef, useState } from "react";
import { useTutorialLog } from "@/hooks/useTutorialLog";

interface Props {
  open: boolean;
  studentId: string;
  skillId: string;
  /** Path under public/, e.g. "lesson-video/mul-tens.mp4". */
  src: string;
  title: string;
  /** False for "Review tutorial" replays so they stay out of the funnel. */
  logRun?: boolean;
  onStart: () => void; // → practice
  onClose: () => void;
}

export default function LessonVideoModal({
  open,
  studentId,
  skillId,
  src,
  title,
  logRun = true,
  onStart,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const watchedMsRef = useRef(0);
  const finishedRef = useRef(false);

  const tlog = useTutorialLog({ studentId, skillId, variant: "video", enabled: open && logRun });

  useEffect(() => {
    if (!open) return;
    setStarted(false);
    setEnded(false);
    watchedMsRef.current = 0;
    finishedRef.current = false;
  }, [open]);

  if (!open) return null;

  function play() {
    const v = videoRef.current;
    if (!v) return;
    tlog.bumpTap();
    v.play()
      .then(() => {
        setStarted(true);
        tlog.log({ beatIndex: 1 });
      })
      .catch(() => {
        // Even a user-gesture play can be refused; let them use the native
        // controls rather than trapping them on a dead poster frame.
        setStarted(true);
      });
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (v) watchedMsRef.current = v.currentTime * 1000;
  }

  function handleEnded() {
    setEnded(true);
    tlog.log({ beatIndex: 3, audioPlayedMs: Math.round(watchedMsRef.current) });
  }

  function goToPractice() {
    finishedRef.current = true;
    tlog.bumpTap();
    tlog.log({
      beatIndex: 4,
      audioPlayedMs: Math.round(watchedMsRef.current),
      // Leaving before the end is the video's version of skipping.
      ...(ended ? {} : { skipTapped: true }),
    });
    tlog.end();
    videoRef.current?.pause();
    onStart();
  }

  function handleClose() {
    if (!finishedRef.current) {
      tlog.log({ skipTapped: true, audioPlayedMs: Math.round(watchedMsRef.current) });
      tlog.end();
    }
    videoRef.current?.pause();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative bg-[#FDFAF4] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 text-ink/50 hover:text-ink text-xl leading-none"
          aria-label="Close lesson"
        >
          ×
        </button>

        <div className="px-6 pt-6 pb-2 text-center">
          <div className="text-xs font-semibold tracking-wide text-muted uppercase">Lesson</div>
          <h2 className="font-serif text-xl font-bold text-ink">{title}</h2>
        </div>

        <div className="relative bg-black/5">
          <video
            ref={videoRef}
            src={`/${src}`}
            controls={started}
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="w-full block"
          />
          {!started && (
            <button
              type="button"
              onClick={play}
              className="absolute inset-0 flex items-center justify-center bg-ink/30 hover:bg-ink/40 transition-colors"
              aria-label="Play the lesson"
            >
              <span className="w-20 h-20 rounded-full bg-white/95 flex items-center justify-center text-3xl text-brand-blue shadow-lg pl-1">
                ▶
              </span>
            </button>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {ended ? "That's it — ready to try some?" : "Watch the lesson, then practise."}
          </p>
          <button
            type="button"
            onClick={goToPractice}
            className={
              ended
                ? "px-5 py-2.5 rounded-full bg-brand-blue text-white font-semibold shrink-0"
                : "px-5 py-2.5 rounded-full border border-ink/20 text-ink/70 hover:bg-ink/5 font-medium shrink-0"
            }
          >
            {ended ? "Start practice →" : "Skip to practice"}
          </button>
        </div>
      </div>
    </div>
  );
}
