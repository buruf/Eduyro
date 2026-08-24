/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    // Bundle the worksheet PDF font into the serverless functions that render
    // PDFs — these .ttf files are read from disk at render time (react-pdf
    // Font.register) and would otherwise be tree-shaken out of the lambda.
    outputFileTracingIncludes: {
      "/api/**": ["./src/lib/pdf/fonts/**"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // SAMEORIGIN (not DENY): our shop preview modal and parent print page embed our own PDFs in iframes; DENY blocked them (ERR_BLOCKED_BY_RESPONSE) while still being no safer against third-party clickjacking.
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            // Locks the page down to our own origin plus the few places we
            // genuinely load from: lesson videos on the Blob CDN, and KaTeX
            // stylesheets on jsDelivr for rendered worksheets. Next.js needs
            // 'unsafe-inline'/'unsafe-eval' for hydration and its dev runtime.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "font-src 'self' data: https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
              "connect-src 'self' https://*.public.blob.vercel-storage.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
