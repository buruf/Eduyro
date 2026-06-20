// src/lib/tutorials/narrator.ts
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  TTS FALLBACK IN USE — SWAP WHEN A REAL KEY IS ADDED
//
// We checked the project env for ElevenLabs / OpenAI / Google / AWS / Azure
// TTS keys and found NONE, so narration uses the browser's Web Speech API.
// It works everywhere but sounds noticeably more robotic than a paid voice.
//
// TO UPGRADE LATER: implement `Narrator` below against your chosen service
// (e.g. an /api/tts route that streams ElevenLabs or OpenAI `tts-1-hd` audio)
// and swap the export in `createNarrator()`. Nothing else needs to change —
// the tutorial modal only talks to this interface.
// ─────────────────────────────────────────────────────────────────────────────

export interface Narrator {
  speak(text: string, onEnd?: () => void): void;
  pause(): void;
  resume(): void;
  stop(): void;
  /** true if this is the robotic browser fallback (UI may show a hint) */
  readonly isFallback: boolean;
}

/** Pick the most natural-sounding voice the browser offers. */
function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Ranked preferences — neural/natural voices first, then well-known decent ones.
  const prefer = [
    /natural/i, /neural/i,
    /Google US English/i, /Google UK English Female/i,
    /Microsoft (Aria|Jenny|Guy|Emma)/i,
    /Samantha/i, /Karen/i, /Daniel/i,
  ];
  for (const re of prefer) {
    const v = voices.find((v) => re.test(v.name) && v.lang.startsWith("en"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

class WebSpeechNarrator implements Narrator {
  readonly isFallback = true;
  private utterance: SpeechSynthesisUtterance | null = null;

  speak(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) { onEnd?.(); return; }
    this.stop();

    const start = () => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickBestVoice();
      if (voice) u.voice = voice;
      u.rate = 0.75;   // 75% speed — slow and easy for young learners to follow
      u.pitch = 1.02;  // slightly lifted — friendlier
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      this.utterance = u;
      window.speechSynthesis.speak(u);
    };

    // Voices load async in some browsers — wait once if the list is empty.
    if (window.speechSynthesis.getVoices().length === 0) {
      const once = () => { window.speechSynthesis.removeEventListener("voiceschanged", once); start(); };
      window.speechSynthesis.addEventListener("voiceschanged", once);
      // Safety: if voiceschanged never fires, start anyway after a beat.
      setTimeout(() => { window.speechSynthesis.removeEventListener("voiceschanged", once); if (!this.utterance) start(); }, 600);
    } else {
      start();
    }
  }

  pause() { if (typeof window !== "undefined") window.speechSynthesis?.pause(); }
  resume() { if (typeof window !== "undefined") window.speechSynthesis?.resume(); }
  stop() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    this.utterance = null;
  }
}

export function createNarrator(): Narrator {
  // ⚠️ Swap this for a premium TTS implementation when a key is available.
  return new WebSpeechNarrator();
}
