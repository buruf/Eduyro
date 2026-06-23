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

// Known FEMALE voice names across Windows/Edge, Chrome, macOS/iOS, Android.
const FEMALE_NAMES = /\b(aria|jenny|jane|nancy|sara|michelle|monica|ava|emma|amber|ashley|cora|elizabeth|libby|sonia|natasha|clara|zira|hazel|susan|linda|heera|samantha|karen|victoria|tessa|moira|fiona|serena|allison|kate|catherine|female)\b/i;
const NATURAL = /\b(natural|neural|online|premium|enhanced|wavenet)\b/i;

/** Pick the most natural-sounding FEMALE English voice the browser offers.
 *  Scores every English voice (female + natural weighted highest) so we get the
 *  warmest available voice rather than the OS default robotic one. Still a
 *  browser voice — a studio-human voice needs a cloud TTS key (see header). */
function pickBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  if (!voices.length) return null;

  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    if (FEMALE_NAMES.test(v.name)) s += 5;
    if (NATURAL.test(v.name)) s += 4;
    if (/Google US English/i.test(v.name)) s += 2; // Google's default is female & decent
    if (/en-US/i.test(v.lang)) s += 1;
    if (/\b(male|david|mark|guy|daniel|alex|fred|george|james|paul|ravi)\b/i.test(v.name)) s -= 6; // avoid male
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? voices[0];
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
