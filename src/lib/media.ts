// src/lib/media.ts
// Lesson videos are served from Vercel Blob's public CDN, not from public/ —
// 79 MP4s (~166MB) don't belong in a git repo or a serverless bundle, and the
// CDN answers byte-range requests (scrubbing) without touching our server.
//
// The base URL is the store's public hostname — public by design, safe to ship
// in the client bundle. Override with NEXT_PUBLIC_MEDIA_BASE_URL if the store
// is ever recreated (a new store gets a new hostname).
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  "https://6lyuvlpkczxliptj.public.blob.vercel-storage.com";

/** "lesson-video/mul-tens.ramlah.mp4" → full CDN URL. */
export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}/${path.replace(/^\//, "")}`;
}
