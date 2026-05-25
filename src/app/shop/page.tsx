// src/app/shop/page.tsx
// Public shop page with skill cards, pricing, and FAQ.
// CHANGED: "Preview free sample" now opens an in-browser modal,
// not a downloadable PDF.

"use client";

import { useState, useEffect } from "react";
import { SamplePreviewModal } from "@/components/shop/SamplePreviewModal";

type Skill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION";

interface SkillCard {
  id: Skill;
  label: string;
  description: string;
  iconEmoji: string;
  totalSheets: number;
  estimatedProblems: number;
  bands: Array<{
    label: string;
    sheetCount: number;
    difficulty: string;
    problemCount: number;
  }>;
}

interface PricingTier {
  skillCount: number;
  amountCents: number;
  label: string;
}

interface Catalog {
  skills: SkillCard[];
  pricing: PricingTier[];
}

export default function ShopPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<Skill>>(new Set());
  const [email, setEmail] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  useEffect(() => {
    fetch("/api/shop/catalog")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCatalog(j.data);
      });
  }, []);

  const toggleSkill = (id: Skill) => {
    const next = new Set(selectedSkills);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSkills(next);
  };

  const currentPrice =
    catalog?.pricing.find((p) => p.skillCount === selectedSkills.size)?.label ??
    "$0.00";

  const handleCheckout = async () => {
    setError(null);
    if (selectedSkills.size === 0) {
      setError("Please select at least one skill pack.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: Array.from(selectedSkills),
          email,
          emailDelivery,
        }),
      });
      const j = await res.json();
      if (j.success && j.data.checkoutUrl) {
        window.location.href = j.data.checkoutUrl;
      } else {
        setError(j.error ?? "Could not start checkout.");
      }
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!catalog) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-muted">Loading shop…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">
            Shop
          </div>
          <h1 className="font-serif text-4xl font-bold mb-3">
            Buy a printable PDF pack today.
          </h1>
          <p className="text-lg text-cream/65 mt-6 max-w-2xl mx-auto leading-relaxed text-muted">
            100 worksheets per skill, instant download, no account required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {catalog.skills.map((skill) => {
            const selected = selectedSkills.has(skill.id);
            return (
              <div
                key={skill.id}
                className={`bg-white border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                  selected ? "border-gold shadow-lg" : "border-border hover:border-ink"
                }`}
                onClick={() => toggleSkill(skill.id)}
              >
                <div className="text-3xl mb-2">{skill.iconEmoji}</div>
                <h3 className="font-serif text-lg font-bold mb-2">{skill.label}</h3>
                <p className="text-sm text-muted mb-3 leading-relaxed">
                  {skill.description}
                </p>
                <div className="text-xs text-muted mb-3">
                  {skill.totalSheets} sheets · ~{skill.estimatedProblems} problems
                </div>
                <button
className="w-full mt-3 bg-brand-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2"                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSkill(skill.id);
                  }}
                >
👁 Preview sample worksheets                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="font-serif text-lg font-bold mb-4">Your order</h3>
          <div className="mb-4">
            {selectedSkills.size === 0 ? (
              <p className="text-sm text-muted">Select one or more skills above.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {Array.from(selectedSkills).map((s) => (
                  <li key={s}>· {catalog.skills.find((sk) => sk.id === s)?.label}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-border-mid rounded-md px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted mb-4">
            <input
              type="checkbox"
              checked={emailDelivery}
              onChange={(e) => setEmailDelivery(e.target.checked)}
            />
            Email my PDFs when ready
          </label>

          {error && (
            <div className="text-sm text-brand-red bg-brand-red-light border border-brand-red rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={submitting || selectedSkills.size === 0}
            className="w-full bg-gold text-white font-medium px-4 py-3 rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Starting checkout…" : `Pay ${currentPrice} · Secure Stripe checkout`}
          </button>
        </div>

        <section className="max-w-3xl mx-auto mt-16">
          <h2 className="font-serif text-3xl font-bold text-center mb-8">
            Common questions.
          </h2>
          <div className="divide-y divide-border">
            {FAQS.map((f, i) => (
              <div key={i}>
                <button
                  className="w-full text-left py-5 flex items-center justify-between gap-4 hover:text-brand-blue transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-base font-medium">{f.q}</span>
                  <span
                    className={`text-xl text-muted transition-transform flex-shrink-0 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </section>

      <SamplePreviewModal
        open={previewSkill !== null}
        skill={previewSkill}
        onClose={() => setPreviewSkill(null)}
      />
    </main>
  );
}

const FAQS = [
  {
    q: "What's included in each pack?",
    a: "100 worksheets per skill (about 2,500 problems), organized by difficulty. PDFs you can print at home, paced like a Kumon program but a fraction of the price.",
  },
  {
    q: "Do I need an account?",
    a: "No. Buy as a guest with just your email. We send you a private download link that's valid for 30 days.",
  },
  {
    q: "Will the answers be included?",
    a: "Yes — every pack includes a separate answer key at the end. Parents can grade easily without doing the math.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. If you're not happy within 7 days, email support@eduyro.com and we'll refund you in full.",
  },
  {
    q: "What ages is this for?",
    a: "Addition and subtraction packs are best for Pre-K through Grade 2. Multiplication and division packs are best for Grades 2–5. Use the free placement test to find the right level.",
  },
];
