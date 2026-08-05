// src/app/api/shop/catalog/route.ts
// GET /api/shop/catalog
// Public read-only catalog: skill list, pricing tiers.

import { NextRequest } from "next/server";
import { ok } from "@/lib/api/helpers";
import { SHOP_SKILLS, SHOP_PRICING, SHOP_BUNDLES, calculatePrice } from "@/lib/shop/pack-generator";

export async function GET(_req: NextRequest) {
  // `hidden` skills stay purchasable/fulfillable (old links, bundles) but are
  // not listed — e.g. RATIOS, folded into the combined Decimals pack.
  const skills = Object.entries(SHOP_SKILLS).filter(([, def]) => !(def as any).hidden).map(([id, def]) => {
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

  // Curated bundles — grade/goal framed, with the à-la-carte comparison so the
  // UI can show "save $X" honestly. Prices come from the server only.
  const bundles = SHOP_BUNDLES.map((b) => {
    const alaCarteCents = calculatePrice(b.skills);
    return {
      id: b.id,
      name: b.name,
      tagline: b.tagline,
      gradeBand: b.gradeBand,
      skills: b.skills,
      skillLabels: b.skills.map((s) => SHOP_SKILLS[s].label),
      priceCents: b.priceCents,
      priceLabel: `$${(b.priceCents / 100).toFixed(2)}`,
      alaCarteCents,
      savingsCents: Math.max(0, alaCarteCents - b.priceCents),
      savingsLabel: `$${(Math.max(0, alaCarteCents - b.priceCents) / 100).toFixed(2)}`,
      // Sum the ACTUAL pack sizes (Fractions is 50 sheets, not 100) — the old
      // skills×100 shortcut overstated bundle counts, a false-advertising risk.
      sheetCount: b.skills.reduce((sum, s) => sum + (SHOP_SKILLS[s]?.totalSheets ?? 100), 0),
    };
  });

  return ok({ skills, pricing, bundles });
}
