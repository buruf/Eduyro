// src/app/placement/page.tsx — server wrapper (SEO metadata) for the placement test.
import type { Metadata } from "next";
import PlacementClient from "./PlacementClient";

export const metadata: Metadata = {
  title: "Free Math Placement Test — Find Your Child's Level",
  description:
    "Take Eduyro's free adaptive placement test. In about 15 minutes, find the right starting level across Math, Reading, Writing & Science. Instant results — no credit card required.",
  alternates: { canonical: "/placement" },
};

export default function Page() {
  return <PlacementClient />;
}
