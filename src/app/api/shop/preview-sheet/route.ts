// src/app/api/shop/preview-sheet/route.ts
// Free sample preview — serves the REAL worksheet PDF (same engine, same
// renderer the buyer receives) with a translucent SAMPLE watermark.
// Usage: GET /api/shop/preview-sheet?skill=ADDITION&sheet=1
//
// Guard rails: only the first few sheets are previewable (the full 100-sheet
// pack is the paid product), and requests are rate limited.

import { NextRequest, NextResponse } from "next/server";
import { generateProgressiveSheet, type ShopSkill } from "@/lib/shop/progressive-generator";
import { renderWorksheetToPdf } from "@/lib/pdf/renderer";
import { withRateLimit } from "@/lib/api/helpers";

export const maxDuration = 120; // Pro plan — cold engine + render comfortably inside the cap

const VALID_SKILLS: ShopSkill[] = [
  "ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "FRACTIONS",
  "DECIMALS", "RATIOS", "PRE_ALGEBRA", "LINEAR_EQUATIONS", "POLYNOMIALS", "GEOMETRY",
];

// Only the first few sheets are free to preview.
const MAX_PREVIEW_SHEET = 3;

export async function GET(req: NextRequest) {
  const limited = await withRateLimit(req, 30, 60_000); // 30/min per IP
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill")?.toUpperCase() as ShopSkill;
  const sheet = parseInt(searchParams.get("sheet") ?? "1");

  if (!VALID_SKILLS.includes(skill)) {
    return NextResponse.json(
      { error: `Invalid skill. Valid: ${VALID_SKILLS.join(", ")}` },
      { status: 400 }
    );
  }

  if (isNaN(sheet) || sheet < 1 || sheet > MAX_PREVIEW_SHEET) {
    return NextResponse.json(
      { error: `Preview is limited to sheets 1-${MAX_PREVIEW_SHEET}. Purchase the pack for all 100.` },
      { status: 400 }
    );
  }

  try {
    const worksheetData = generateProgressiveSheet(skill, sheet, 100, 30);
    const pdfBytes = await renderWorksheetToPdf(worksheetData, {
      watermark: "SAMPLE · eduyro.com",
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="eduyro-${skill.toLowerCase()}-sample${sheet}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("[preview-sheet] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
