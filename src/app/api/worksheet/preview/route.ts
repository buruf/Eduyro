// src/app/api/worksheet/preview/route.ts
// Public endpoint — generates a real worksheet from the backend engine.
// Used by /pdf-generator to render full problem banks instead of the
// page's old hardcoded preview data.
//
// No auth required: this generates content from a public curriculum.
// Rate-limited to prevent abuse.

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleRouteError, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { generateProblems } from "@/lib/worksheet/generator";

const PreviewSchema = z.object({
  subjectSlug: z.enum(["MATH", "READING", "WRITING", "SCIENCE"]),
  levelCode: z.string().min(1).max(10),
  skillName: z.string().min(1).max(200),
  problemCount: z.number().int().min(1).max(100).default(20),
  timeLimitMinutes: z.number().int().min(1).max(120).default(10),
  difficulty: z.number().min(0.1).max(3.0).default(1.0),
  sheetNumber: z.number().int().min(1).max(50).default(1),
  totalSheets: z.number().int().min(1).max(50).default(1),
});

export async function POST(req: NextRequest) {
  // 30 requests per minute is plenty for a UI tool and blocks scraping
  const limited = await withRateLimit(req, 30, 60_000);
  if (limited) return limited;

  const parsed = await parseRequest(req, PreviewSchema);
  if ("status" in parsed) return parsed;
  const cfg = parsed.data;

  try {
    const { problems, answerKey } = generateProblems({
      subjectSlug: cfg.subjectSlug,
      levelCode: cfg.levelCode,
      skillName: cfg.skillName,
      problemCount: cfg.problemCount ?? 20,
      timeLimitMinutes: cfg.timeLimitMinutes ?? 10,
      difficulty: cfg.difficulty ?? 1.0,
      sheetNumber: cfg.sheetNumber ?? 1,
      totalSheets: cfg.totalSheets ?? 1,
    });

    return ok({
      problems,
      answerKey,
      meta: {
        subjectSlug: cfg.subjectSlug,
        levelCode: cfg.levelCode,
        skillName: cfg.skillName,
        sheetNumber: cfg.sheetNumber,
        totalSheets: cfg.totalSheets,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
