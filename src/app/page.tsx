// src/app/page.tsx — server wrapper (SEO metadata) for the homepage.
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: {
    absolute: "Eduyro — Printable Math Worksheets & Kumon-Style Mastery Learning (Pre-K–Grade 12)",
  },
  description:
    "A print-first, mastery-based learning program for Pre-K to Grade 12. Daily worksheets in Math, Reading, Writing & Science with a free AI placement test — a Kumon-style program at a fraction of the price.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
