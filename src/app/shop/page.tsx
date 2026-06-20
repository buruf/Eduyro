// src/app/shop/page.tsx — server wrapper (SEO metadata) for the shop.
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Printable Math Worksheet Packs — 100 Sheets Per Skill",
  description:
    "Buy printable PDF math worksheet packs: Addition through Polynomials. 100 worksheets plus answer keys per skill, organized by difficulty. Grade-by-grade bundles from $4.99 — instant download, no account required.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Printable Math Worksheet Packs — Eduyro",
    description: "100 worksheets + answer keys per skill. Grade-by-grade bundles from $4.99. Instant download.",
  },
};

export default function Page() {
  return <ShopClient />;
}
