// src/app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Eduyro — Mastery learning, one step at a time",
    template: "%s · Eduyro",
  },
  description:
    "Eduyro is a print-first, mastery-based learning platform for Pre-K to Grade 12. Daily worksheets in Math, Reading, Writing, and Science. Used by students, parents, and schools.",
  keywords: [
    "math worksheets", "kumon alternative", "printable worksheets",
    "homeschool curriculum", "school tutoring platform", "mastery learning",
    "reading comprehension", "writing practice",
  ],
  authors: [{ name: "Eduyro Education" }],
  openGraph: {
    type: "website",
    siteName: "Eduyro",
    title: "Eduyro — Mastery learning, one step at a time",
    description: "Daily worksheets · AI placement · Print-first curriculum from Pre-K to Grade 12.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduyro",
    description: "Mastery learning, one worksheet at a time.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
