// src/app/robots.ts → serves https://eduyro.com/robots.txt
// Allow crawling of public pages, keep app/account/api areas out of the index,
// and point crawlers to the sitemap.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/parent",
          "/student",
          "/admin",
          "/print/",
          "/coppa/",
          "/shop/download",
          "/shop/cancel",
        ],
      },
    ],
    sitemap: "https://eduyro.com/sitemap.xml",
    host: "https://eduyro.com",
  };
}
