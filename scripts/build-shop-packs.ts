// scripts/build-shop-packs.ts
// One-time pack pre-generation. Run after deploy (or whenever you change
// problem-generation logic) so the first customer of every skill gets
// an instant download instead of waiting 60s.
//
// Run: npm run shop:build-packs

import { getOrCreatePackPdf, getOrCreateSamplePdf } from "../src/lib/shop/pack-cache";
import { SHOP_SKILLS, type ShopSkill } from "../src/lib/shop/pack-generator";

async function main() {
  const skills = Object.keys(SHOP_SKILLS) as ShopSkill[];
  console.log(`🏗  Building ${skills.length} shop packs + ${skills.length} samples…\n`);

  let totalBytes = 0;
  for (const skill of skills) {
    const start = Date.now();

    // Full pack
    const pack = await getOrCreatePackPdf(skill);
    const elapsedMs = Date.now() - start;
    const sizeMb = (pack.sizeBytes / 1024 / 1024).toFixed(2);
    console.log(`✓ ${SHOP_SKILLS[skill].label} pack — ${sizeMb} MB · ${pack.sheetCount} sheets · ${elapsedMs}ms`);
    totalBytes += pack.sizeBytes;

    // Free sample
    const sampleStart = Date.now();
    const sample = await getOrCreateSamplePdf(skill);
    const sampleElapsed = Date.now() - sampleStart;
    const sampleSizeKb = (sample.sizeBytes / 1024).toFixed(0);
    console.log(`  └─ Sample — ${sampleSizeKb} KB · ${sample.sheetCount} sheets · ${sampleElapsed}ms`);
    totalBytes += sample.sizeBytes;
  }

  console.log(`\n✅ Built ${skills.length * 2} files (${(totalBytes / 1024 / 1024).toFixed(2)} MB total)`);
  console.log(`   Customers buying any of these skills will now get instant downloads.\n`);
}

main().catch((e) => {
  console.error("Build failed:", e);
  process.exit(1);
});
