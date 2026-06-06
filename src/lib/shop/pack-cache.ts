// src/lib/shop/pack-cache.ts
// Generates shop pack PDFs on demand and stores them.
// Storage: R2/S3 if configured, otherwise /tmp (ephemeral on Vercel).
// Cache key format: shop-packs/v2/{SKILL}.pdf

import { generatePackForSkill, SHOP_SKILLS, type ShopSkill } from "./pack-generator";
import { renderPackToPdf } from "@/lib/pdf/renderer";
import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";
import { writeFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";

const CACHE_VERSION = "v9";
const CACHE_PREFIX  = `shop-packs/${CACHE_VERSION}`;
const SAMPLE_PREFIX = `shop-samples/${CACHE_VERSION}`;

const STORAGE_ROOT = process.env.VERCEL
  ? "/tmp/.local-storage"
  : join(process.cwd(), ".local-storage");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";

const HAS_S3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

export interface CachedPack {
  skill: ShopSkill;
  key: string;
  url: string;
  sizeBytes: number;
  sheetCount: number;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getOrCreatePackPdf(skill: ShopSkill): Promise<CachedPack> {
  const config = SHOP_SKILLS[skill];
  const key    = `${CACHE_PREFIX}/${skill}.pdf`;

  const cached = await tryLoadCached(key);
  if (cached) return { skill, key, url: cached.url, sizeBytes: cached.sizeBytes, sheetCount: config.totalSheets };

  console.log(`[shop-cache] Generating ${skill} pack (cache miss)…`);
  const pack = generatePackForSkill(skill);
  const sheets = pack.sheets.map((s) => {
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
    };
  });

  const pdfBytes = await renderPackToPdf({
    skillLabel: pack.label,
    skillCode:  pack.skill,
    levelCode:  pack.skill,
    sheets,
  });

  const pdf = Buffer.from(pdfBytes);
  const url = await savePdf(pdf, key);

  return { skill, key, url, sizeBytes: pdf.length, sheetCount: pack.sheets.length };
}

export async function getOrCreateSamplePdf(skill: ShopSkill): Promise<CachedPack> {
  const key = `${SAMPLE_PREFIX}/${skill}-sample.pdf`;

  const cached = await tryLoadCached(key);
  if (cached) return { skill, key, url: cached.url, sizeBytes: cached.sizeBytes, sheetCount: 3 };

  console.log(`[shop-cache] Generating ${skill} sample (cache miss)…`);
  const full         = generatePackForSkill(skill);
  const sampleSheets = full.sheets.slice(0, 3).map((s) => {
    const answerMap = new Map((s.answerKey ?? []).map((e: any) => [e.id, String(e.answer)]));
    return {
      problems: s.problems.map((p: any) => ({
        ...p,
        answer: answerMap.get(p.id) ?? String(p.answer ?? ""),
      })),
      skillBand: s.bandLabel,
    };
  });

  const pdfBytes = await renderPackToPdf({
    skillLabel: `${full.label} — Free Sample`,
    skillCode:  full.skill,
    levelCode:  full.skill,
    sheets:     sampleSheets,
  });

  const pdf = Buffer.from(pdfBytes);
  const url = await savePdf(pdf, key);

  return { skill, key, url, sizeBytes: pdf.length, sheetCount: sampleSheets.length };
}

// ── Storage helpers ──────────────────────────────────────────────────────────

async function savePdf(pdf: Buffer, key: string): Promise<string> {
  if (HAS_S3) {
    console.log(`[shop-cache] Uploading ${key} to R2/S3…`);
    return uploadToS3(pdf, key, "application/pdf");
  }
  // Fallback: local filesystem
  const localPath = join(STORAGE_ROOT, key);
  const dir = localPath.substring(0, localPath.lastIndexOf("/"));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(localPath, pdf);
  return `${BASE_URL}/api/local-storage/${encodeURIComponent(key)}`;
}

async function tryLoadCached(key: string): Promise<{ url: string; sizeBytes: number } | null> {
  if (HAS_S3) {
    // With R2/S3 — attempt to get a signed URL. If object doesn't exist,
    // the download will fail but generation will re-run next time.
    // For now, always regenerate if we can't confirm existence cheaply.
    return null;
  }

  // Local filesystem check
  const localPath = join(STORAGE_ROOT, key);
  try {
    const stats = statSync(localPath);
    if (stats.isFile() && stats.size > 0) {
      return {
        url: `${BASE_URL}/api/local-storage/${encodeURIComponent(key)}`,
        sizeBytes: stats.size,
      };
    }
  } catch {
    // not cached
  }
  return null;
}
