// src/lib/shop/pack-cache.ts
// Persistent cache for shop pack PDFs.
//
// Each pack is generated ONCE and stored at a stable key. Every customer
// purchasing the same skill gets a copy of the same file — no regeneration
// required. The S3-or-local storage layer (lib/pdf/generator.ts) takes
// care of where files actually live.
//
// Cache key format:
//   shop-packs/v1/{SKILL}.pdf
//
// Bumping the version (v1 → v2) invalidates the cache, useful when you
// change problem-generation logic and want fresh PDFs across the board.

import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";
import { generatePackForSkill, SHOP_SKILLS, type ShopSkill } from "./pack-generator";
import { renderPackHtml } from "./pack-pdf";
import { promises as fs } from "fs";
import path from "path";

const CACHE_VERSION = "v1";
const CACHE_PREFIX = `shop-packs/${CACHE_VERSION}`;
const SAMPLE_PREFIX = `shop-samples/${CACHE_VERSION}`;

export interface CachedPack {
  skill: ShopSkill;
  key: string;
  url: string;
  sizeBytes: number;
  sheetCount: number;
}

/**
 * Get a cached pack URL. If the file doesn't exist yet, generates and uploads it.
 * Returns the URL + metadata that can be served to a customer.
 */
export async function getOrCreatePackPdf(skill: ShopSkill): Promise<CachedPack> {
  const config = SHOP_SKILLS[skill];
  const key = `${CACHE_PREFIX}/${skill}.pdf`;

  // Check if the file already exists in local storage (.local-storage/<key>)
  // In production with S3, we'd HEAD the S3 object; for now, always check local first.
  const cached = await tryLoadCached(key);
  if (cached) {
    return {
      skill,
      key,
      url: cached.url,
      sizeBytes: cached.sizeBytes,
      sheetCount: config.totalSheets,
    };
  }

  // Cache miss → generate fresh
  console.log(`[shop-cache] Generating ${skill} pack (cache miss)…`);
  const pack = generatePackForSkill(skill);
  const pdf = await renderPackHtml({ skillLabel: pack.label, skillCode: pack.skill, levelCode: pack.skill, sheets: pack.sheets });
  const url = await uploadToS3(pdf, key, "application/pdf");

  return {
    skill,
    key,
    url,
    sizeBytes: pdf.length,
    sheetCount: pack.sheets.length,
  };
}

/**
 * Generate and cache a free 3-sheet sample for a skill.
 * Uses only the easiest 3 sheets of the easiest band.
 */
export async function getOrCreateSamplePdf(skill: ShopSkill): Promise<CachedPack> {
  const key = `${SAMPLE_PREFIX}/${skill}-sample.pdf`;

  const cached = await tryLoadCached(key);
  if (cached) {
    return { skill, key, url: cached.url, sizeBytes: cached.sizeBytes, sheetCount: 3 };
  }

  console.log(`[shop-cache] Generating ${skill} sample (cache miss)…`);
  const full = generatePackForSkill(skill);
  // Take the first 3 sheets — those are the easiest by design
  const sampleSheets = full.sheets.slice(0, 3);
  const samplePack = {
    ...full,
    label: `${full.label} — Free Sample`,
    sheets: sampleSheets,
  };
  const pdf = await renderPackHtml(samplePack);
  const url = await uploadToS3(pdf, key, "application/pdf");

  return { skill, key, url, sizeBytes: pdf.length, sheetCount: sampleSheets.length };
}

/**
 * Check if a cached PDF exists at the given key.
 * In local-dev mode, checks .local-storage/<key>. In production with S3,
 * we just attempt to serve the URL (no HEAD needed - if it exists, the URL works).
 */
async function tryLoadCached(key: string): Promise<{ url: string; sizeBytes: number } | null> {
  // Local dev path
  const localPath = path.join(process.cwd(), ".local-storage", key);
  try {
    const stats = await fs.stat(localPath);
    if (stats.isFile() && stats.size > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      return {
        url: `${baseUrl}/api/local-storage/${encodeURIComponent(key)}`,
        sizeBytes: stats.size,
      };
    }
  } catch {
    // File doesn't exist locally
  }

  // For S3, attempt to fetch a signed URL — if the underlying object doesn't
  // exist this will still succeed (signed URLs don't validate existence).
  // So we can't reliably check S3 here without a HEAD. For now, return null
  // so we always regen if local cache misses. In production deploy, set up
  // a one-time pre-generation step instead.
  return null;
}
