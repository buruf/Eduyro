"use client";
// Compact narration control — replaces the big read-along transcript box (user:
// "redundant, takes big space — the information is already on screen"). Plays
// the cloned voice (browser voice fallback) and reports WHICH LESSON SECTION is
// currently being read, so the modal can highlight the real Goal/Why/Rule/
// Example cards in place as the teacher reads them.
import { useCallback, useEffect, useRef, useState } from "react";

interface Alignment { words: string[]; startsSec: number[]; endsSec: number[] }
export interface NarrationSection { id: string; chars: number } // chars of this part in the script

const clipCache = new Map<string, { url: string; alignment: Alignment | null } | null>();

export function NarrationConductor({
  text, sections, autoPlay = true, replayNonce = 0, onSection, onPlayingChange,
}: {
  text: string;
  sections: NarrationSection[];
  autoPlay?: boolean;
  replayNonce?: number;
  onSection?: (id: string | null) => void;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const script = (text ?? "").trim();
  const [mode, setMode] = useState<"loading" | "cloned" | "browser" | "off">("loading");
  const [clip, setClip] = useState<{ url: string; alignment: Alignment | null } | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayedRef = useRef(false);
  const cb = useRef({ onSection, onPlayingChange });
  cb.current = { onSection, onPlayingChange };

  useEffect(() => { cb.current.onPlayingChange?.(playing); if (!playing) cb.current.onSection?.(null); }, [playing]);

  // Map a progress FRACTION through the script → section id.
  const total = sections.reduce((a, s) => a + s.chars, 0) || 1;
  const sectionAt = useCallback((frac: number) => {
    let acc = 0;
    for (const s of sections) { acc += s.chars; if (frac * total <= acc) return s.id; }
    return sections[sections.length - 1]?.id ?? null;
  }, [sections, total]);

  useEffect(() => {
    if (!script) { setMode("off"); return; }
    autoPlayedRef.current = false;
    const cached = clipCache.get(script);
    if (cached !== undefined) {
      if (cached) { setClip(cached); setMode("cloned"); } else setMode("browser");
      return;
    }
    setMode("loading");
    let cancelled = false;
    fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: script }) })
      .then(async (r) => {
        if (r.status === 503) { clipCache.set(script, null); throw new Error("off"); }
        const j = await r.json();
        if (!j?.success || !j?.data?.url) throw new Error("no url");
        return { url: j.data.url as string, alignment: (j.data.alignment ?? null) as Alignment | null };
      })
      .then((c) => { if (!cancelled) { clipCache.set(script, c); setClip(c); setMode("cloned"); } })
      .catch(() => { if (!cancelled) setMode("browser"); });
    return () => { cancelled = true; };
  }, [script]);

  // Cloned audio → progress via word timings (linear in SPOKEN text, so pauses
  // don't skew it); falls back to time/duration without an alignment.
  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current; if (!a) return;
    const al = clip?.alignment;
    let frac: number;
    if (al?.words?.length) {
      const t = a.currentTime;
      let i = 0; while (i < al.startsSec.length && al.startsSec[i] <= t) i++;
      const spokenTotal = al.words.reduce((x, w) => x + w.length + 1, 0);
      const spokenSoFar = al.words.slice(0, Math.max(1, i)).reduce((x, w) => x + w.length + 1, 0);
      frac = spokenSoFar / spokenTotal;
    } else {
      frac = a.duration ? a.currentTime / a.duration : 0;
    }
    cb.current.onSection?.(sectionAt(frac));
  }, [clip, sectionAt]);

  const playCloned = useCallback(() => {
    const a = audioRef.current; if (!a) return;
    a.play().then(() => setPlaying(true)).catch(() => {/* blocked — button covers it */});
  }, []);

  useEffect(() => {
    if (mode !== "cloned" || !clip?.url || !autoPlay || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    playCloned();
  }, [mode, clip, autoPlay, playCloned]);

  // Browser-voice fallback — boundary charIndex gives EXACT progress.
  const speakBrowser = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) { setMode("off"); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.92;
    const vs = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
    const pref = vs.find((v) => /natural|neural|female|samantha|aria|jenny|zira/i.test(v.name)) ?? vs[0];
    if (pref) u.voice = pref;
    u.onboundary = (e) => { if (!e.name || e.name === "word") cb.current.onSection?.(sectionAt((e.charIndex ?? 0) / script.length)); };
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  }, [script, sectionAt]);

  useEffect(() => {
    if (mode !== "browser" || !autoPlay || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    speakBrowser();
  }, [mode, autoPlay, speakBrowser]);

  useEffect(() => {
    if (!replayNonce) return;
    if (mode === "cloned") { const a = audioRef.current; if (a) { a.currentTime = 0; playCloned(); } }
    else if (mode === "browser") speakBrowser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayNonce]);

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* noop */ } }, [script]);

  const toggle = () => {
    if (mode === "cloned") {
      const a = audioRef.current; if (!a) return;
      if (a.paused) { if (a.ended) a.currentTime = 0; playCloned(); } else { a.pause(); setPlaying(false); }
    } else if (mode === "browser") {
      if (playing) { window.speechSynthesis?.cancel(); setPlaying(false); } else speakBrowser();
    }
  };

  if (mode === "off" || !script) return null;

  return (
    <div className="flex items-center gap-2">
      {mode === "cloned" && clip?.url && (
        <audio ref={audioRef} src={clip.url} preload="auto"
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)} />
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={mode === "loading"}
        aria-label={playing ? "Pause narration" : "Play narration"}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-40 shrink-0"
      >
        {mode === "loading" ? "…" : playing ? "❚❚" : "▶"}
      </button>
      <span className="text-xs text-muted">
        {/* Only claim a highlight when the script actually carries section ids —
            the level-level "Review tutorial" script has none, and telling the
            child to look for a highlight that doesn't exist is confusing
            (field report: Ridwan). */}
        {playing
          ? <><span className="inline-block w-2 h-2 rounded-full bg-brand-green animate-pulse mr-1.5" />
              {sections.some((s) => s.id) ? "Your teacher is reading the highlighted part…" : "Your teacher is reading the lesson…"}</>
          : "Listen to the lesson"}
      </span>
      {mode === "browser" && <span className="ml-auto text-[10px] text-muted" title="Cloned voice unavailable — using the browser voice.">browser voice</span>}
    </div>
  );
}
