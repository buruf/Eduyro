// src/app/api/tts/route.ts
// POST { text } → { url } : narration audio in the owner's cloned voice.
// Caches every distinct line (hash of voiceId|text) in storage + a TtsClip row
// so we never re-charge ElevenLabs for the same line. Auth-gated (any signed-in
// user). Returns 503 when TTS isn't configured so the client can stay silent.
import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { ok, err, handleRouteError, withAuth, parseRequest } from "@/lib/api/helpers";
import { isTtsEnabled, synthesizeSpeechWithTimestamps, VOICE_ID, presetCacheKey } from "@/lib/tts/elevenlabs";
import { speakable } from "@/lib/tts/speakable";
import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";
import { z } from "zod";

export const maxDuration = 30;

// 2500 covers the longest lesson narration (goal + why + rule + worked example
// ≈ 1300 chars); each unique line is synthesized once and cached forever.
const Schema = z.object({
  text: z.string().min(1).max(2500),
  // Delivery preset — omitted means the original lesson read, so every
  // existing caller keeps its cached clips.
  preset: z.enum(["lesson", "lively"]).optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    if (!isTtsEnabled()) return err("Narration is not enabled", 503);
    const parsed = await parseRequest(req, Schema);
    if ("status" in parsed) return parsed;
    const text = speakable(parsed.data.text);
    if (!text) return err("Nothing to speak", 400);
    const preset = parsed.data.preset ?? "lesson";

    try {
      // "v3" = delivery version (speed 0.88 + word-timestamp alignment). Bump to
      // invalidate cached clips whenever the voice settings or payload change.
      // The preset joins the key so the two deliveries cache separately; the
      // default keeps the exact key existing lesson clips were stored under.
      const hash = crypto
        .createHash("sha256")
        .update(`${VOICE_ID}|v3|${presetCacheKey(preset)}${text}`)
        .digest("hex");
      const existing = await db.ttsClip.findUnique({ where: { hash } });
      if (existing) {
        return ok({ url: await getSignedDownloadUrl(existing.fileKey, 60 * 60 * 24), alignment: (existing as any).alignment ?? null });
      }
      // Cache miss — synthesize once (with word timings), store, record.
      const { mp3, alignment } = await synthesizeSpeechWithTimestamps(text, preset);
      const fileKey = `tts/${VOICE_ID}/${hash}.mp3`;
      await uploadToS3(mp3, fileKey, "audio/mpeg");
      await db.ttsClip.create({ data: { hash, voiceId: VOICE_ID, fileKey, chars: text.length, alignment: alignment as any } }).catch(() => {});
      return ok({ url: await getSignedDownloadUrl(fileKey, 60 * 60 * 24), alignment });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
