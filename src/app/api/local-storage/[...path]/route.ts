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
  // This is a DEV-ONLY fallback for when S3 isn't configured. Hard-disable it in
  // production UNCONDITIONALLY (previously it only refused when AWS_S3_BUCKET was
  // set — so if S3 was unconfigured in prod it served arbitrary cwd files with no
  // auth). In prod, files are served from S3 via signed URLs, not this route.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const fileKey = params.path.join("/");
    const localDir = path.join(process.cwd(), ".local-storage");
    const fullPath = path.join(localDir, fileKey);

    // Path-traversal guard: resolved path must stay within local-storage. Compare
    // against `localDir + sep` so a sibling like ".local-storage-x" can't pass a
    // bare startsWith prefix check.
    const normalized = path.normalize(fullPath);
    if (normalized !== localDir && !normalized.startsWith(localDir + path.sep)) {
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
