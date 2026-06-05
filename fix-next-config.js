const fs = require('fs');
const f = 'next.config.js';
let c = fs.readFileSync(f, 'utf8');

// Remove the wrong key we added
c = c.replace(
  '  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],\n',
  ''
);

// Add correct key inside experimental
c = c.replace(
  '  experimental: {\n    serverActions: { bodySizeLimit: "5mb" },\n  },',
  '  experimental: {\n    serverActions: { bodySizeLimit: "5mb" },\n    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],\n  },'
);

fs.writeFileSync(f, c);
console.log('serverComponentsExternalPackages:', c.includes('serverComponentsExternalPackages'));
console.log('serverExternalPackages remaining:', c.includes('serverExternalPackages:'));
