// src/app/schools/page.tsx — server wrapper (SEO metadata) for the schools page.
import type { Metadata } from "next";
import SchoolsClient from "./SchoolsClient";

export const metadata: Metadata = {
  title: "Eduyro for Schools — Mastery Worksheets & Teacher Dashboard",
  description:
    "Bring Kumon-style mastery practice to your classroom. Per-student pricing, a teacher admin dashboard, printable daily packets, and a free 30-day pilot for schools with 20+ students.",
  alternates: { canonical: "/schools" },
};

export default function Page() {
  return <SchoolsClient />;
}
