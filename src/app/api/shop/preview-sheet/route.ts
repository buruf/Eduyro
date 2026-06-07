// src/app/api/shop/preview-sheet/route.ts
// Preview a single worksheet PDF without purchase.
// Usage: GET /api/shop/preview-sheet?skill=ADDITION&sheet=1
// Returns a PDF for immediate preview in browser.

import { NextRequest, NextResponse } from "next/server";
import { generateProgressiveSheet } from "@/lib/shop/progressive-generator";
import { renderWorksheetToPdf } from "@/lib/pdf/renderer";
import type { ShopSkill } from "@/lib/shop/difficulty-curve";

export const maxDuration = 60;

const VALID_SKILLS: ShopSkill[] = [
  "ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION",
  "FRACTIONS", "DECIMALS", "PRE_ALGEBRA",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get("skill")?.toUpperCase() as ShopSkill;
  const sheet = parseInt(searchParams.get("sheet") ?? "1");

  if (!VALID_SKILLS.includes(skill)) {
    return NextResponse.json(
      { error: `Invalid skill. Valid: ${VALID_SKILLS.join(", ")}` },
      { status: 400 }
    );
  }

  if (isNaN(sheet) || sheet < 1 || sheet > 100) {
    return NextResponse.json(
      { error: "Sheet must be 1-100" },
      { status: 400 }
    );
  }

  try {
    const worksheetData = generateProgressiveSheet(skill, sheet, 100, 30);
    const pdfBytes = await renderWorksheetToPdf(worksheetData);

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="eduyro-${skill.toLowerCase()}-sheet${sheet}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[preview-sheet] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
