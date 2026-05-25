// src/app/api/local-storage/[...path]/route.ts
// DEV-ONLY route — serves files written to .local-storage/ by uploadToS3.
// Only active when S3 is not configured. In production, files come from S3
// directly and this route is never hit.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Refuse to serve in production — we only want local files in dev mode.
  if (process.env.NODE_ENV === "production" && process.env.AWS_S3_BUCKET) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const fileKey = params.path.join("/");
    const localDir = path.join(process.cwd(), ".local-storage");
    const fullPath = path.join(localDir, fileKey);

    // Path-traversal guard: resolved path must stay within local-storage
    const normalized = path.normalize(fullPath);
    if (!normalized.startsWith(localDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const file = await readFile(normalized);
    const ext = path.extname(normalized).toLowerCase();
    const contentType = ext === ".pdf" ? "application/pdf" : "application/octet-stream";
    const filename = path.basename(normalized);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("[local-storage] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
