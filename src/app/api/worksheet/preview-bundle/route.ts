// src/app/api/worksheet/preview-bundle/route.ts
// POST /api/worksheet/preview-bundle
// Returns a SINGLE PDF containing all 3 sheets back-to-back, then one answer
// key at the end (covering all 3 sheets together).
//
// This is the "Save as PDF / Print" path for the public worksheet generator.

import { NextRequest } from "next/server";
import { z } from "zod";
import { generateProblems } from "@/lib/worksheet/generator";
import { renderSheetHtml, wrapDocument } from "@/lib/worksheet/render-sheet";
import { renderHtmlToPdf } from "@/lib/pdf/renderer";
import { ok, validationError, serverError, withRateLimit } from "@/lib/api/helpers";

const BundleRequestSchema = z.object({
  subjectSlug: z.enum(["MATH", "READING", "WRITING", "SCIENCE"]),
  levelCode: z.string().min(1).max(8),
  skillName: z.string().min(1).max(200),
  problemCount: z.number().int().min(1).max(200),
  timeLimitMinutes: z.number().int().min(1).max(120).default(10),
  totalSheets: z.number().int().min(1).max(10).default(3),
  difficulty: z.number().min(0.1).max(3.0).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit — bundling generates a real PDF, so it's heavier than preview
  const rateLimited = await withRateLimit(req, 20, 60_000);
  if (rateLimited) return rateLimited;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return validationError({ body: ["Invalid JSON"] });
  }

  const parsed = BundleRequestSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }
  const cfg = parsed.data;

  try {
    // Generate problems for each sheet. We use the same parameters but
    // different seeds (driven by sheet number) to produce distinct sheets.
    const allSheets: Array<{
      problems: any[];
      answerKey: any[];
    }> = [];

    for (let s = 1; s <= cfg.totalSheets; s++) {
      const { problems, answerKey } = generateProblems({
        subjectSlug: cfg.subjectSlug,
        levelCode: cfg.levelCode,
        skillName: cfg.skillName,
        problemCount: cfg.problemCount,
        timeLimitMinutes: cfg.timeLimitMinutes,
        difficulty: cfg.difficulty,
        sheetNumber: s,
        totalSheets: cfg.totalSheets,
      });
      allSheets.push({ problems, answerKey });
    }

    // Build the sheet HTML for each problem set (no answer key per sheet)
    const sheetHtmls = allSheets.map((sheet, i) =>
      renderSheetHtml(sheet.problems, {
        subjectLabel: subjectLabel(cfg.subjectSlug),
        levelCode: cfg.levelCode,
        skillName: cfg.skillName,
        sheetNumber: i + 1,
        totalSheets: cfg.totalSheets,
        timeLimitMinutes: cfg.timeLimitMinutes,
      }, false)
    );

    // Build ONE combined answer key at the end. Concatenate problems
    // from all sheets, numbered continuously (1.x for sheet 1, then
    // continuing from there).
    const combinedAnswers = allSheets.flatMap((sheet) => sheet.problems.map((p, idx) => ({
      ...p,
      answer: sheet.answerKey[idx]?.answer ?? "",
    })));

    const answerKeyHtml = renderSheetHtml(combinedAnswers, {
      subjectLabel: subjectLabel(cfg.subjectSlug),
      levelCode: cfg.levelCode,
      skillName: cfg.skillName,
      timeLimitMinutes: cfg.timeLimitMinutes,
    }, true);

    const doc = wrapDocument(
      [...sheetHtmls, answerKeyHtml],
      `${cfg.skillName} — ${cfg.levelCode}`
    );

    const pdfBytes = await renderHtmlToPdf(doc);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename(cfg.skillName)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e: any) {
    console.error("[worksheet bundle] generation failed:", e);
    return serverError("Failed to build worksheet PDF. Please try again.");
  }
}

function subjectLabel(slug: string): string {
  switch (slug) {
    case "MATH": return "Mathematics";
    case "READING": return "Reading";
    case "WRITING": return "Writing";
    case "SCIENCE": return "Science";
    default: return slug;
  }
}

function safeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60);
}
