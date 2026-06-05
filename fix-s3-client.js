const fs = require('fs');
const f = 'src/lib/pdf/generator.ts';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  `const s3 = process.env.AWS_REGION
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;`,
  `const s3 = process.env.AWS_REGION
  ? new S3Client({
      region: process.env.AWS_REGION,
      ...(process.env.AWS_ENDPOINT_URL ? { endpoint: process.env.AWS_ENDPOINT_URL } : {}),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: false,
    })
  : null;`
);

// Also fix the bucket name default
c = c.replace(
  'const BUCKET = process.env.AWS_S3_BUCKET ?? "brightsteps-pdfs";',
  'const BUCKET = process.env.AWS_S3_BUCKET ?? "eduyro-pdfs";'
);

fs.writeFileSync(f, c);
console.log('endpoint URL added:', c.includes('AWS_ENDPOINT_URL'));
console.log('bucket default fixed:', c.includes('"eduyro-pdfs"'));
