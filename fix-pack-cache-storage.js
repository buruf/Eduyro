const fs = require('fs');
const f = 'src/lib/shop/pack-cache.ts';
let c = fs.readFileSync(f, 'utf8');

// Replace uploadToS3 calls with a local save function that works without S3
// On Vercel, we save to /tmp and serve via the local-storage route

// Add a helper function import and replace uploadToS3 calls
c = c.replace(
  `import { uploadToS3, getSignedDownloadUrl } from "@/lib/pdf/generator";`,
  `import { uploadToS3 } from "@/lib/pdf/generator";
import * as path from "path";
import * as fs from "fs";

// Save PDF locally when S3 is not configured
async function savePdf(pdf: Buffer, key: string): Promise<string> {
  const hasS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);
  
  if (hasS3) {
    return uploadToS3(pdf, key, "application/pdf");
  }

  // No S3 — save to local filesystem
  const localPath = path.join(process.cwd(), ".local-storage", key);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(localPath, pdf);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eduyro.com";
  return \`\${baseUrl}/api/local-storage/\${encodeURIComponent(key)}\`;
}`
);

// Replace uploadToS3 calls with savePdf
c = c.replace(/const url = await uploadToS3\(pdf, key, "application\/pdf"\);/g, 'const url = await savePdf(pdf, key);');

fs.writeFileSync(f, c);
console.log('✅ pack-cache.ts updated — falls back to local storage when S3 not configured');
console.log('savePdf function:', c.includes('async function savePdf'));
console.log('no direct uploadToS3:', !c.includes('const url = await uploadToS3'));
