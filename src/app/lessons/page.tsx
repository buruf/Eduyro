// src/app/lessons/page.tsx
// Public lesson library — the index of every lesson video, grouped by grade.
//
// This is the page a parent lands on from search ("how to multiply fractions")
// and the home every YouTube description points back to. It is deliberately
// public and crawlable: the videos themselves are throttled by YouTube's
// made-for-kids rules, so search + our own pages are the discovery path.
import Link from "next/link";
import { groupedByGrade, lessonCatalog } from "@/lib/lessons/catalog";

export const metadata = {
  title: "Free Math Lesson Videos — Pre-K to Grade 12",
  description:
    "Short animated math lessons for every skill from counting to calculus. Watch the lesson, then practise it with worksheets that adapt to your child.",
  alternates: { canonical: "/lessons" },
};

export default function LessonsIndexPage() {
  const groups = groupedByGrade();
  const total = lessonCatalog().length;

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
          ← Back to home
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-3">Math lesson videos</h1>
      <p className="text-muted max-w-2xl mb-2">
        {total} short animated lessons — one for every skill we teach, from counting to calculus.
        Each one shows the idea with a picture first, then names the rule.
      </p>
      <p className="text-sm text-muted mb-12">
        Free to watch. No account needed.
      </p>

      {groups.map((g) => (
        <section key={g.heading} className="mb-12">
          <h2 className="font-serif text-2xl font-bold mb-4">{g.heading}</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {g.lessons.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/lessons/${l.slug}`}
                  className="block rounded-xl border border-border p-4 hover:border-brand-gold hover:bg-cream/50 transition-colors h-full"
                >
                  <div className="font-semibold text-ink leading-snug">{l.label}</div>
                  {l.grade && <div className="text-xs text-muted mt-1">{l.grade}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-16 rounded-2xl border border-border bg-cream/60 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold mb-2">Watching is the easy part</h2>
        <p className="text-muted max-w-xl mx-auto mb-6">
          Children learn maths by doing it, a little every day. Eduyro turns each of these lessons
          into daily practice that adjusts to what your child already knows.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-lg bg-brand-gold px-6 py-3 font-semibold text-ink hover:opacity-90 transition-opacity"
        >
          Start free
        </Link>
      </div>
    </main>
  );
}
