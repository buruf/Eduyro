// src/app/api/shop/catalog/route.ts
// GET /api/shop/catalog
// Public read-only catalog: skill list, pricing tiers.

import { NextRequest } from "next/server";
import { ok } from "@/lib/api/helpers";
import { SHOP_SKILLS, SHOP_PRICING } from "@/lib/shop/pack-generator";

export async function GET(_req: NextRequest) {
  const skills = Object.entries(SHOP_SKILLS).map(([id, def]) => {
    // True total = sum of (band.sheetCount × band.problemCount) across all bands
    const trueProblemCount = def.bands.reduce(
      (sum, b) => sum + b.sheetCount * b.problemCount,
      0
    );
    return {
      id,
      label: def.label,
      description: def.description,
      iconEmoji: def.iconEmoji,
      totalSheets: def.totalSheets,
      problemsPerSheet: def.problemsPerSheet,
      estimatedProblems: trueProblemCount,
      bands: def.bands.map((b) => ({
        label: b.label,
        sheetCount: b.sheetCount,
        difficulty: b.difficulty,
        problemCount: b.problemCount,
      })),
    };
  });

  const pricing = Object.entries(SHOP_PRICING).map(([count, data]) => ({
    skillCount: parseInt(count),
    amountCents: data.amountCents,
    label: data.label,
  }));

  return ok({ skills, pricing });
}
