// DEV-ONLY review page: every rendered lesson video on one screen, grouped by
// template, so the whole set can be watched back to back without hunting for
// files. 404s in production.
"use client";

import { notFound } from "next/navigation";
import {
  EQUAL_GROUP_UNITS,
  COLUMN_UNITS,
  TEN_FRAME_UNITS,
  DEALING_UNITS,
  FACT_FAMILY_UNITS,
  AREA_UNITS,
  unitNumbers,
  columnNumbers,
  tenFrameNumbers,
  dealingNumbers,
  factFamilyFacts,
  areaRegions,
} from "@/remotion/lesson/units";
import { DEFAULT_VOICE_KEY } from "@/remotion/lesson/voices";

interface Row {
  id: string;
  label: string;
  example: string;
}

const GROUPS: { title: string; blurb: string; rows: Row[] }[] = [
  {
    title: "Equal groups",
    blurb: "a × b means b groups of a — laid out, counted, then named as a fact.",
    rows: EQUAL_GROUP_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      example: `${u.a} × ${u.b} = ${unitNumbers(u).product}`,
    })),
  },
  {
    title: "Base-ten blocks",
    blurb: "What carrying and borrowing actually are: ten ones becoming one ten, and back.",
    rows: COLUMN_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      example: `${u.x} ${u.op} ${u.y} = ${columnNumbers(u).answer}`,
    })),
  },
  {
    title: "Ten-frame",
    blurb: "Addition and subtraction facts, where the strategy is performed rather than described.",
    rows: TEN_FRAME_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      example: `${u.x} ${u.op} ${u.y} = ${tenFrameNumbers(u).answer}  ·  ${u.strategy}`,
    })),
  },
  {
    title: "Dealing",
    blurb: "Division done both ways — shared onto plates, then grouped into rings — same answer.",
    rows: DEALING_UNITS.map((u) => {
      const n = dealingNumbers(u);
      return {
        id: u.id,
        label: u.label,
        example: `${u.total} ÷ ${u.divisor} = ${n.each}${n.remainder ? ` r ${n.remainder}` : ""}`,
      };
    }),
  },
  {
    title: "Fact family",
    blurb: "One picture, four questions — the four facts are the same relationship asked different ways.",
    rows: FACT_FAMILY_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      example: factFamilyFacts(u).map((f) => f.text).join("   "),
    })),
  },
  {
    title: "Area model",
    blurb: "Why long multiplication has the steps it has: the partial products ARE the rectangle regions.",
    rows: AREA_UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      example: u.x + " × " + u.y + " = " + u.x * u.y + "  ·  " + areaRegions(u).map((r) => r.product).join(" + "),
    })),
  },
];

export default function LessonReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const total = GROUPS.reduce((n, g) => n + g.rows.length, 0);
  return (
    <div className="min-h-screen bg-cream-dark px-6 py-8">
      <h1 className="font-serif text-2xl font-bold text-ink mb-1">
        Lesson videos — {total} rendered
      </h1>
      <p className="text-sm text-muted mb-8">
        Voice: {DEFAULT_VOICE_KEY}. Dev-only page; not reachable in production.
      </p>

      {GROUPS.map((g) => (
        <section key={g.title} className="mb-12">
          <h2 className="font-serif text-xl font-bold text-ink">
            {g.title} <span className="text-muted font-normal">· {g.rows.length}</span>
          </h2>
          <p className="text-sm text-muted mb-4">{g.blurb}</p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {g.rows.map((r) => (
              <figure key={r.id} className="bg-white border border-border rounded-xl overflow-hidden">
                <video
                  src={`/lesson-video/${r.id}.${DEFAULT_VOICE_KEY}.mp4`}
                  controls
                  preload="metadata"
                  className="w-full block bg-black/5"
                />
                <figcaption className="px-3 py-2">
                  <div className="text-sm font-semibold text-ink">{r.label}</div>
                  <div className="text-xs text-muted">{r.example}</div>
                  <div className="text-[10px] text-muted/70 mt-0.5">{r.id}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
