const fs = require('fs');
const f = 'next.config.js';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  `/** @type {import('next').NextConfig} */
const nextConfig = {`,
  `/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],`
);

fs.writeFileSync(f, c);
console.log('Fixed:', c.includes('serverExternalPackages'));
