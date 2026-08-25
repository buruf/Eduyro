// src/app/lessons/[slug]/page.tsx
// One public page per lesson: the video, what it teaches, real practice
// problems from the student generator, and a way in.
//
// Statically generated for every lesson so the pages are cheap and crawlable,
// and carrying VideoObject structured data so Google can show them as video
// results — the discovery route that YouTube's made-for-kids rules throttle.
import Link from "next/link";
import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import { lessonCatalog, lessonBySlug, sampleProblems } from "@/lib/lessons/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return lessonCatalog().map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const lesson = lessonBySlug(params.slug);
  if (!lesson) return { title: "Lesson not found" };
  const gradePart = lesson.grade ? ` (${lesson.grade})` : "";
  return {
    title: `${lesson.label}${gradePart} — Free Math Lesson Video`,
    description: lesson.hook.slice(0, 155),
    alternates: { canonical: `/lessons/${lesson.slug}` },
    openGraph: {
      title: `${lesson.label} — Free Math Lesson Video | Eduyro`,
      description: lesson.hook.slice(0, 155),
      type: "video.other",
    },
  };
}

export default function LessonPage({ params }: { params: { slug: string } }) {
  const lesson = lessonBySlug(params.slug);
  if (!lesson) notFound();

  const problems = sampleProblems(lesson, 4);
  const videoUrl = mediaUrl(lesson.videoFile);

  // Structured data: this is what earns a video thumbnail in Google results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${lesson.label} — Math Lesson`,
    description: lesson.hook,
    contentUrl: videoUrl,
    embedUrl: videoUrl,
    uploadDate: "2026-08-01",
    isFamilyFriendly: true,
    inLanguage: "en",
    learningResourceType: "Lesson",
    ...(lesson.grade ? { educationalLevel: lesson.grade } : {}),
    publisher: {
      "@type": "Organization",
      name: "Eduyro",
      url: "https://eduyro.com",
    },
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-8">
        <Link href="/lessons" className="text-sm text-muted hover:text-ink transition-colors">
          ← All lessons
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-2">{lesson.label}</h1>
      {lesson.grade && <p className="text-sm text-muted mb-6">{lesson.grade}</p>}

      <video
        controls
        preload="metadata"
        playsInline
        className="w-full rounded-xl border border-border bg-ink"
        src={videoUrl}
      >
        Your browser cannot play this video.
      </video>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-bold mb-2">What this lesson shows</h2>
        <p className="text-muted leading-relaxed">{lesson.hook}</p>
      </section>

      {problems.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold mb-1">Try it yourself</h2>
          <p className="text-sm text-muted mb-4">
            Real questions from this lesson&apos;s worksheets — answers below each one.
          </p>
          <ol className="space-y-3">
            {problems.map((p, i) => (
              <li key={i} className="rounded-xl border border-border p-4">
                <div className="font-semibold text-ink">{p.question}</div>
                <details className="mt-2">
                  <summary className="text-sm text-brand-blue cursor-pointer">Show answer</summary>
                  <div className="mt-1 text-sm font-semibold text-brand-green">{p.answer}</div>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-border bg-cream/60 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold mb-2">Practise this every day</h2>
        <p className="text-muted mb-6">
          Eduyro gives your child a short daily worksheet on exactly this skill, and moves them on
          only once they have it. Watch the lesson, then build the fluency.
        </p>
        <Link
          href="/register"
          className="inline-block rounded-lg bg-brand-gold px-6 py-3 font-semibold text-ink hover:opacity-90 transition-opacity"
        >
          Start free
        </Link>
      </section>
    </main>
  );
}
