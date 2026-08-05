// src/app/shop/page.tsx
// Public shop page with skill cards, pricing, and FAQ.
// CHANGED: "Preview free sample" now opens an in-browser modal,
// not a downloadable PDF.

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SamplePreviewModal } from "@/components/shop/SamplePreviewModal";

type Skill = "ADDITION" | "SUBTRACTION" | "MULTIPLICATION" | "DIVISION" | "FRACTIONS" | "DECIMALS" | "RATIOS" | "PRE_ALGEBRA" | "LINEAR_EQUATIONS" | "POLYNOMIALS";

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

interface Bundle {
  id: string;
  name: string;
  tagline: string;
  gradeBand: string;
  skills: Skill[];
  skillLabels: string[];
  priceCents: number;
  priceLabel: string;
  alaCarteCents: number;
  savingsCents: number;
  savingsLabel: string;
  sheetCount: number;
}

interface Catalog {
  skills: SkillCard[];
  pricing: PricingTier[];
  bundles: Bundle[];
}

export default function ShopPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<Set<Skill>>(new Set());
  const [maxSkillsError, setMaxSkillsError] = useState(false);
  const [email, setEmail] = useState("");
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);
  const [bundleLoading, setBundleLoading] = useState<string | null>(null);
  const [bundleModal, setBundleModal] = useState<Bundle | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const bundleEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/shop/catalog")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCatalog(j.data);
      });
  }, []);

  const MAX_SKILLS = 10;

  const toggleSkill = (id: Skill) => {
    const next = new Set(selectedSkills);
    if (next.has(id)) {
      next.delete(id);
      setMaxSkillsError(false);
    } else {
      if (next.size >= MAX_SKILLS) {
        setMaxSkillsError(true);
        return;
      }
      next.add(id);
      setMaxSkillsError(false);
    }
    setSelectedSkills(next);
  };

  const currentPrice =
    catalog?.pricing.find((p) => p.skillCount === selectedSkills.size)?.label ??
    "$0.00";

  const emailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const startCheckout = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/shop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, email, emailDelivery }),
    });
    const j = await res.json();
    if (j.success && j.data.checkoutUrl) {
      window.location.href = j.data.checkoutUrl;
    } else {
      setError(j.error ?? "Could not start checkout.");
    }
  };

  const handleCheckout = async () => {
    setError(null);
    if (selectedSkills.size === 0) {
      setError("Please select at least one skill pack.");
      return;
    }
    if (!emailValid()) {
      setError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await startCheckout({ skills: Array.from(selectedSkills) });
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  const openBundleModal = (b: Bundle) => {
    setBundleError(null);
    setBundleModal(b);
    // focus the modal's email field on next paint
    setTimeout(() => bundleEmailRef.current?.focus(), 50);
  };

  const submitBundle = async () => {
    if (!bundleModal) return;
    setBundleError(null);
    if (!emailValid()) {
      setBundleError("Please enter a valid email address.");
      bundleEmailRef.current?.focus();
      return;
    }
    setBundleLoading(bundleModal.id);
    try {
      await startCheckout({ bundleId: bundleModal.id });
    } catch (e: any) {
      setBundleError(String(e.message ?? e));
    } finally {
      setBundleLoading(null);
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
      {/* Header — the shop had NO way back to the homepage */}
      <header className="border-b border-border/60 bg-cream/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-bold text-ink hover:opacity-80">
            Eduyro <span className="text-muted font-sans text-xs font-normal align-middle ml-1">· Worksheet Shop</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted hover:text-ink">← Back to home</Link>
          </nav>
        </div>
      </header>
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

        {/* ── Curated bundles — grade/goal framed, one-click ── */}
        {catalog.bundles?.length > 0 && (
          <div className="mb-14">
            <div className="text-center mb-6">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-2">
                Best value · grade-by-grade
              </div>
              <h2 className="font-serif text-2xl font-bold">Curated bundles</h2>
              <p className="text-sm text-muted mt-2">
                Not sure which packs? Pick the bundle that matches your child — one click, biggest savings.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalog.bundles.map((b) => {
                const featured = b.id === "full-math-mastery";
                return (
                  <div
                    key={b.id}
                    className={`relative bg-white rounded-2xl p-6 flex flex-col border-2 ${
                      featured ? "border-gold shadow-lg lg:col-span-1" : "border-gold/30"
                    }`}
                  >
                    {b.savingsCents > 0 && (
                      <span className="absolute -top-2.5 right-4 bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        Save {b.savingsLabel}
                      </span>
                    )}
                    <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                      {featured ? "★ Complete curriculum" : b.gradeBand}
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-1">{b.name}</h3>
                    <p className="text-sm text-muted mb-3 leading-relaxed">{b.tagline}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted mb-3">
                      {b.skillLabels.map((l) => (
                        <span key={l}>· {l}</span>
                      ))}
                    </div>
                    <div className="text-xs text-muted mb-4">
                      {b.sheetCount} worksheets · answer keys included
                    </div>
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-serif text-3xl font-bold">{b.priceLabel}</span>
                        {b.savingsCents > 0 && (
                          <span className="text-sm text-muted line-through">
                            ${(b.alaCarteCents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => openBundleModal(b)}
                        className="w-full bg-gold text-white font-medium px-4 py-3 rounded-lg hover:bg-gold-dark transition-colors"
                      >
                        Get this bundle →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Build your own ── */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl font-bold">Or build your own</h2>
          <p className="text-sm text-muted mt-2">
            Mix and match up to {MAX_SKILLS} individual skill packs — the more you add, the lower the per-pack price.
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

        {maxSkillsError && (
          <div className="max-w-2xl mx-auto mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-amber-500 flex-shrink-0">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              You've selected the maximum of {MAX_SKILLS} skill packs. Or grab the “Full Math Mastery” bundle above for the best price.
            </p>
          </div>
        )}

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
              ref={emailRef}
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

      {/* ── Inline bundle checkout modal ── */}
      {bundleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => bundleLoading === null && setBundleModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                {bundleModal.gradeBand}
              </div>
              <button
                onClick={() => bundleLoading === null && setBundleModal(null)}
                className="text-muted hover:text-ink text-xl leading-none -mt-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <h3 className="font-serif text-xl font-bold mb-1">{bundleModal.name}</h3>
            <p className="text-sm text-muted mb-3">{bundleModal.tagline}</p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted mb-3">
              {bundleModal.skillLabels.map((l) => (
                <span key={l}>· {l}</span>
              ))}
            </div>

            <div className="flex items-baseline gap-2 mb-4 pb-4 border-b border-border">
              <span className="font-serif text-3xl font-bold">{bundleModal.priceLabel}</span>
              {bundleModal.savingsCents > 0 && (
                <>
                  <span className="text-sm text-muted line-through">
                    ${(bundleModal.alaCarteCents / 100).toFixed(2)}
                  </span>
                  <span className="ml-auto bg-brand-red-light text-brand-red text-xs font-bold px-2 py-1 rounded-full">
                    Save {bundleModal.savingsLabel}
                  </span>
                </>
              )}
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Email
            </label>
            <input
              ref={bundleEmailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitBundle()}
              placeholder="you@example.com"
              className="w-full border border-border-mid rounded-md px-3 py-2 text-sm mb-3"
            />
            <label className="flex items-center gap-2 text-sm text-muted mb-4">
              <input
                type="checkbox"
                checked={emailDelivery}
                onChange={(e) => setEmailDelivery(e.target.checked)}
              />
              Email my PDFs when ready
            </label>

            {bundleError && (
              <div className="text-sm text-brand-red bg-brand-red-light border border-brand-red rounded-md px-3 py-2 mb-4">
                {bundleError}
              </div>
            )}

            <button
              onClick={submitBundle}
              disabled={bundleLoading !== null}
              className="w-full bg-gold text-white font-medium px-4 py-3 rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {bundleLoading === bundleModal.id
                ? "Starting checkout…"
                : `Pay ${bundleModal.priceLabel} · Secure Stripe checkout`}
            </button>
            <p className="text-xs text-muted text-center mt-3">
              {bundleModal.sheetCount} worksheets · answer keys · instant download
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

const FAQS = [
  {
    q: "What's included in each pack?",
    a: "100 worksheets per skill (about 3,000 problems), organized by difficulty. PDFs you can print at home, paced like a Kumon program but a fraction of the price.",
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
