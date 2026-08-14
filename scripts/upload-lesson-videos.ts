// scripts/upload-lesson-videos.ts
// Upload every public/lesson-video/*.mp4 to the Vercel Blob store, at stable
// paths (lesson-video/<name>.mp4) so the app's URLs never change. Rerun after
// any re-render: allowOverwrite replaces changed files in place.
//
//   npx tsx scripts/upload-lesson-videos.ts
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
import { put } from "@vercel/blob";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("BLOB_READ_WRITE_TOKEN missing from .env.local");
  process.exit(1);
}

const DIR = join(process.cwd(), "public", "lesson-video");
const files = readdirSync(DIR).filter((f) => f.endsWith(".mp4"));
const CONCURRENCY = 5;

async function main() {
  console.log(`Uploading ${files.length} videos to Blob…`);
  let done = 0;
  let bytes = 0;
  const queue = [...files];
  const failures: string[] = [];

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const f = queue.shift();
        if (!f) return;
        const full = join(DIR, f);
        try {
          await put(`lesson-video/${f}`, readFileSync(full), {
            access: "public",
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "video/mp4",
            token,
          });
          bytes += statSync(full).size;
          console.log(`  ${++done}/${files.length}  ${f}`);
        } catch (e) {
          failures.push(f);
          console.error(`  FAILED ${f}: ${(e as Error).message}`);
        }
      }
    }),
  );

  console.log(`\nUploaded ${done}/${files.length} (${Math.round(bytes / 1e6)}MB).`);
  if (failures.length) {
    console.error(`Failed: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main();
