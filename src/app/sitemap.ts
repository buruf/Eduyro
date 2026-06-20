// src/app/sitemap.ts → serves https://eduyro.com/sitemap.xml
// Lists the public, indexable pages so Google can discover the whole site.
import type { MetadataRoute } from "next";

const BASE = "https://eduyro.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "",           priority: 1.0, freq: "weekly" },
    { path: "/shop",      priority: 0.9, freq: "weekly" },
    { path: "/placement", priority: 0.9, freq: "monthly" },
    { path: "/schools",   priority: 0.8, freq: "monthly" },
    { path: "/register",  priority: 0.6, freq: "monthly" },
    { path: "/signin",    priority: 0.4, freq: "yearly" },
    { path: "/about",     priority: 0.5, freq: "yearly" },
    { path: "/accessibility", priority: 0.3, freq: "yearly" },
    { path: "/privacy",   priority: 0.3, freq: "yearly" },
    { path: "/terms",     priority: 0.3, freq: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
