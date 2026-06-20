// src/app/accessibility/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Accessibility Statement",
  description:
    "Eduyro's commitment to accessibility: how we design our site and printable worksheets to be usable by everyone, and how to reach us if something isn't working for you.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted hover:text-ink transition-colors">
          ← Back to home
        </Link>
      </div>

      <h1 className="font-serif text-4xl font-bold mb-2">Accessibility Statement</h1>
      <p className="text-sm text-muted mb-10">Last updated: June 10, 2026</p>

      <div className="space-y-8 text-ink">
        <section>
          <h2 className="font-serif text-xl font-bold mb-3">Our commitment</h2>
          <p className="text-sm leading-relaxed text-muted">
            Eduyro is built for families and classrooms of every kind. We aim to conform to the Web
            Content Accessibility Guidelines (WCAG) 2.1 Level AA across our website and dashboards,
            and we treat accessibility issues as bugs to be fixed, not suggestions.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">What we do</h2>
          <ul className="text-sm leading-relaxed text-muted list-disc pl-5 space-y-2">
            <li>Semantic HTML, keyboard-navigable controls, and visible focus states.</li>
            <li>Color choices checked for contrast against WCAG AA targets.</li>
            <li>
              Print-first worksheets in high-contrast black-on-white with clear, consistently sized
              type — usable without a screen entirely.
            </li>
            <li>Forms with proper labels and error messages announced in text, not color alone.</li>
            <li>No content that flashes or relies on motion to be understood.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">Known limitations</h2>
          <p className="text-sm leading-relaxed text-muted">
            Some older PDF worksheets may not yet include full tagging for screen readers, and some
            third-party services we rely on (such as our payment provider) control their own
            accessibility. We are working through these areas continuously.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold mb-3">Tell us if something isn&rsquo;t working</h2>
          <p className="text-sm leading-relaxed text-muted">
            If you or your child hit an accessibility barrier anywhere on Eduyro, email{" "}
            <a href="mailto:support@eduyro.com" className="text-brand-blue hover:underline">
              support@eduyro.com
            </a>{" "}
            with the page and what happened. We prioritize these reports and will respond within two
            business days.
          </p>
        </section>
      </div>
    </main>
  );
}
