// src/app/HomeClient.tsx
// Homepage v2 — conversion-first structure (benefit headline, product-proof
// hero card, 5-step system, Traditional-vs-Eduyro, curriculum progression
// strip) rendered in the Eduyro ink/cream/gold brand.
// Honest claims only: no invented testimonials or user counts.
// The previous design is preserved at HomeClient.legacy.tsx — to revert,
// point src/app/page.tsx at that file instead.
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { SampleWorksheets } from "@/components/marketing/SampleWorksheets";
import { CurriculumTables } from "@/components/marketing/CurriculumTables";
import { PracticeWidgets } from "@/components/marketing/PracticeWidgets";
import { StickyBar } from "@/components/marketing/StickyBar";

// Scroll-reveal hook
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const ArrowIcon = (
  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
    <path d="M10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 11H5a1 1 0 1 1 0-2h7.586l-2.293-2.293a1 1 0 0 1 0-1.414z"/>
  </svg>
);

// ── Hero product-proof card: animated student progress ───────────────────────
function ProgressCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="bg-white border border-border rounded-2xl shadow-elev overflow-hidden max-w-md mx-auto w-full">
      <div className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold">Student progress</span>
        <span className="text-[11px] text-gold-mid border border-gold-mid/50 rounded px-2 py-0.5">Level M4</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gold-light text-gold-dark flex items-center justify-center text-sm font-bold">E</div>
          <div>
            <div className="text-sm font-semibold">Emma</div>
            <div className="text-xs text-muted">Current skill: subtraction with borrowing</div>
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-muted mb-1">
          <span>Mastery progress</span>
          <span>target 95%</span>
        </div>
        <div className="h-2 bg-cream-dark rounded-full mb-4 overflow-hidden">
          <div
            className="h-2 bg-gold rounded-full transition-all duration-[1400ms] ease-out"
            style={{ width: mounted ? "80%" : "4%" }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["3", "sheets today"],
            ["126", "answered"],
            ["~3 days", "to advance"],
          ].map(([v, l]) => (
            <div key={l} className="bg-cream-dark rounded-lg py-2">
              <div className="text-base font-bold">{v}</div>
              <div className="text-[10px] text-muted">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-brand-green-light text-brand-green rounded-lg px-3 py-2 text-xs">
          🏆 Great job — keep practising to reach 95% mastery.
        </div>
      </div>
    </div>
  );
}

// ── Curriculum progression strip: mini worksheets in the real product style ──
function MiniSheet({ title, level, lines }: { title: string; level: string; lines: string[] }) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden w-[120px] flex-shrink-0">
      <div className="bg-ink px-2 py-1 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-cream">{title}</span>
        <span className="text-[8px] text-gold-mid">{level}</span>
      </div>
      <div className="p-2 text-[10px] leading-[1.9] text-ink">
        {lines.map((l, i) => <div key={i}>{i + 1}.&nbsp; {l}</div>)}
      </div>
    </div>
  );
}

function CurriculumStrip() {
  return (
    <div className="flex items-center gap-2 justify-start lg:justify-center overflow-x-auto pb-2">
      <MiniSheet title="Sheet 1" level="M3" lines={["2 + 1 = __", "4 + 1 = __", "5 + 1 = __"]} />
      <span className="text-border-mid flex-shrink-0">→</span>
      <MiniSheet title="Sheet 25" level="M3" lines={["23 + 8 = __", "34 + 7 = __", "45 + 9 = __"]} />
      <span className="text-border-mid flex-shrink-0">→</span>
      <MiniSheet title="Sheet 50" level="M3" lines={["67 + 28 = __", "54 + 39 = __", "72 + 18 = __"]} />
      <span className="text-border-mid flex-shrink-0">→</span>
      <MiniSheet title="Sheet 75" level="M3" lines={["126 + 37 = __", "215 + 48 = __", "304 + 29 = __"]} />
      <span className="text-border-mid flex-shrink-0">→</span>
      <div className="bg-brand-green-light border border-brand-green/40 rounded-lg w-[120px] flex-shrink-0 px-2 py-4 text-center">
        <div className="text-xl">✓</div>
        <div className="text-[10px] font-semibold text-brand-green leading-tight mt-1">Mastered — next skill unlocks</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const how     = useReveal();
  const why     = useReveal();
  const curr    = useReveal();
  const pricing = useReveal();
  const faq     = useReveal();

  return (
    <>
      <StickyBar />
      <PublicNavbar />
      <main className="bg-cream">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-14 pb-0 lg:pt-20">
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(#1A1612 1px, transparent 1px), linear-gradient(90deg, #1A1612 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,144,42,0.08) 0%, transparent 70%)" }} />

          <div className="max-w-6xl mx-auto px-6 lg:px-8 relative grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <div>
              <div className="inline-block bg-gold-light text-gold-dark text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-full mb-5">
                Mastery before advancement
              </div>
              <h1 className="font-serif text-4xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight text-ink mb-5">
                Know exactly what your child needs to practice next.
              </h1>
              <p className="text-lg text-muted leading-relaxed mb-6 max-w-xl">
                Eduyro places your child at their true skill level — not their grade — then
                builds a personalized path of daily printable practice until they reach 95% mastery.
              </p>

              <div className="flex flex-wrap gap-2 mb-7">
                {["Placement test", "Personalized path", "Daily practice", "95% mastery"].map((c) => (
                  <span key={c} className="text-xs bg-white border border-border rounded-full px-3 py-1.5 text-ink">
                    <span className="text-gold font-bold mr-1">✓</span>{c}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/placement">
                  <Button variant="primary" size="lg" rightIcon={ArrowIcon}>
                    Take the free placement test
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="secondary" size="lg">See how it works</Button>
                </Link>
              </div>
              <p className="text-xs text-muted mt-3">No credit card required · takes about 15 minutes</p>
            </div>

            <ProgressCard />
          </div>

          {/* Honest proof strip */}
          <div className="max-w-6xl mx-auto px-6 lg:px-8 mt-12 pb-16">
            <div className="border-t border-border pt-5 text-center text-sm text-muted">
              <span className="font-semibold text-ink">12 levels · 1,200+ worksheets · 36,000+ problems</span>
              {" "}— the daily-mastery method, built for printing at home.
            </div>
          </div>

          {/* Wave divider into next section */}
          <div className="relative h-16 -mb-1">
            <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none" style={{ fill: "#F5F0E8" }}>
              <path d="M0,64L80,53.3C160,43,320,21,480,21.3C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,64L1360,64C1280,64,1120,64,960,64C800,64,640,64,480,64C320,64,160,64,80,64L0,64Z"/>
            </svg>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 bg-cream-dark">
          <div
            ref={how.ref}
            className={`max-w-6xl mx-auto px-6 lg:px-8 transition-all duration-700 ${how.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-center mb-12">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">The system</div>
              <h2 className="font-serif text-4xl font-bold leading-tight mb-3">How Eduyro works</h2>
              <p className="text-muted">A simple system built for mastery.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                ["📋", "1. Placement test", "We find your child's true level and identify learning gaps."],
                ["📍", "2. Personalized level", "They start exactly where they are — not where their grade says."],
                ["✏️", "3. Daily practice", "Three printable sheets a day, about 15 minutes."],
                ["🎯", "4. 95% mastery", "They must prove mastery before moving forward."],
                ["🚀", "5. Advance", "The next skill unlocks automatically."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center mx-auto mb-3 text-xl">
                    {icon}
                  </div>
                  <div className="text-sm font-semibold mb-1">{title}</div>
                  <div className="text-xs text-muted leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY PARENTS CHOOSE EDUYRO ────────────────────────────────── */}
        <section className="py-20">
          <div
            ref={why.ref}
            className={`max-w-4xl mx-auto px-6 lg:px-8 transition-all duration-700 ${why.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-center mb-12">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">The difference</div>
              <h2 className="font-serif text-4xl font-bold leading-tight">Why parents choose Eduyro.</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white border border-border rounded-2xl p-7">
                <div className="text-sm font-semibold text-muted mb-4">Traditional learning</div>
                <ul className="space-y-3 text-sm text-muted">
                  {[
                    "Moves on after lessons or time, ready or not",
                    "Same pace for every student",
                    "Hard to see what they actually know",
                    "Learning gaps go unnoticed for years",
                    "Tutors and centres cost $150–200/month",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="text-brand-red font-bold mt-0.5">✕</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border-2 border-gold rounded-2xl p-7 relative">
                <span className="absolute -top-3 left-6 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Eduyro</span>
                <div className="text-sm font-semibold text-gold-dark mb-4">Mastery learning</div>
                <ul className="space-y-3 text-sm text-ink">
                  {[
                    "Moves on only after 95% mastery",
                    "A personalized path for each child",
                    "Live progress tracking for parents",
                    "Gaps identified and fixed automatically",
                    "From $4.99 one-time packs or $9.99/month",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="text-brand-green font-bold mt-0.5">✓</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── CURRICULUM ───────────────────────────────────────────────── */}
        <section id="curriculum" className="py-20 bg-cream-dark">
          <div
            ref={curr.ref}
            className={`max-w-6xl mx-auto px-6 lg:px-8 transition-all duration-700 ${curr.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-center mb-10">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Curriculum</div>
              <h2 className="font-serif text-4xl font-bold leading-tight mb-3">A curriculum that builds step by step.</h2>
              <p className="text-muted max-w-xl mx-auto">
                Every sheet is measurably harder than the one before — no sudden jumps, no filler.
                These are real sheets from the Addition track.
              </p>
            </div>
            <CurriculumStrip />
            <p className="text-center text-xs text-muted mt-4 mb-14">Gradual progression. No sudden jumps. True mastery.</p>

            <div className="text-center mb-10">
              <h3 className="font-serif text-2xl font-bold">From counting to calculus — every level mapped.</h3>
            </div>
            <CurriculumTables />
          </div>
        </section>

        {/* ── SAMPLE WORKSHEETS ───────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">See it in action</div>
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Real worksheets,<br />not just demos.</h2>
                <p className="text-muted max-w-md leading-relaxed">
                  Every level uses printable, mastery-based practice sheets. Here are real examples from all four subjects.
                </p>
              </div>
            </div>
            <SampleWorksheets />
          </div>
        </section>

        {/* ── INTERACTIVE PRACTICE ────────────────────────────────────── */}
        <section className="py-20 bg-cream-dark" id="practice">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Try it yourself</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Practice a few problems right now.</h2>
            <p className="text-muted max-w-xl mb-12">
              Type your answers. Get instant feedback. Just like the daily practice your student will get every morning.
            </p>
            <PracticeWidgets />
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24">
          <div
            ref={pricing.ref}
            className={`max-w-5xl mx-auto px-6 lg:px-8 transition-all duration-700 ${pricing.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-center mb-14">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Pricing</div>
              <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Start free. Stay if it works.</h2>
              <p className="text-muted max-w-lg mx-auto">
                Seven days to see real progress. No card required. If your child doesn&rsquo;t improve in the first week, you haven&rsquo;t paid a cent.
              </p>
              <div className="inline-flex items-center gap-2 bg-brand-green-light border border-brand-green/20 rounded-full px-4 py-1.5 mt-4">
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-brand-green">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                </svg>
                <span className="text-xs font-semibold text-brand-green">Save up to $1,920/year vs typical tutoring centres</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free trial */}
              <div className="bg-cream-dark border-2 border-border rounded-2xl p-8 flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Free trial</div>
                <div className="font-serif text-4xl font-bold text-ink mb-1">$0 <span className="text-sm font-sans font-normal text-muted">USD</span></div>
                <div className="text-sm text-muted mb-6">7 days · No card required</div>
                <ul className="space-y-3 text-sm mb-8 flex-1">
                  {["Full AI placement test", "All 4 subjects unlocked", "Daily worksheet packets", "Parent dashboard", "Full access for one child"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-muted">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 fill-brand-green flex-shrink-0 mt-0.5">
                        <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/placement">
                  <Button variant="secondary" fullWidth size="lg">Start free trial</Button>
                </Link>
              </div>

              {/* Premium */}
              <div className="bg-ink text-cream rounded-2xl p-8 relative flex flex-col shadow-elev">
                <div className="absolute top-4 right-4 bg-gold text-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Most popular
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold-mid mb-1">Premium</div>
                <div className="font-serif text-4xl font-bold text-cream mb-0.5">
                  $9.99 USD<span className="text-lg font-sans font-normal text-cream/50">/mo</span>
                </div>
                <div className="text-sm text-cream/50 mb-2">First child · +$5.99/mo each additional child</div>
                <div className="text-xs text-gold-mid mb-6 font-sans">7-day free trial included</div>
                <ul className="space-y-3 text-sm mb-8 flex-1">
                  {["Everything in the free trial", "Unlimited daily worksheets", "Printable PDF downloads", "Auto-advance on mastery", "Add as many children as you like", "Email progress reports"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-cream/80">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 fill-gold-mid flex-shrink-0 mt-0.5">
                        <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="gold" fullWidth size="lg" rightIcon={ArrowIcon}>
                    Start 7-day free trial
                  </Button>
                </Link>
                <p className="text-center text-xs text-cream/30 mt-3 font-sans">Cancel anytime · No hidden fees</p>
              </div>
            </div>

            {/* One-time shop path */}
            <div className="max-w-3xl mx-auto mt-6 bg-white border border-border rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Prefer no subscription?</div>
                <div className="text-sm text-muted">
                  One-time printable packs from <span className="font-semibold text-ink">$4.99</span> — or the complete
                  Full Math Mastery bundle for <span className="font-semibold text-ink">$19.99</span>. No account needed.
                </div>
              </div>
              <Link href="/shop">
                <Button variant="primary" size="md" rightIcon={ArrowIcon}>Shop workbooks</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="py-24 bg-cream-dark">
          <div
            ref={faq.ref}
            className={`max-w-3xl mx-auto px-6 lg:px-8 transition-all duration-700 ${faq.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-center mb-12">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">FAQ</div>
              <h2 className="font-serif text-4xl font-bold leading-tight">Common questions.</h2>
            </div>
            <FaqAccordion items={[
              { q: "How is this different from Kumon?", a: "Same methodology — mastery through daily practice, level-based progression, 95% accuracy threshold — but at a tenth of the cost. No physical centres, a real parent dashboard, and an AI placement test that replaces hour-long manual intake assessments." },
              { q: "Do I need a printer?", a: "Recommended but not required. You can complete worksheets digitally on the student dashboard, but most families print the daily 3-sheet packet — it works better for fluency and there's no screen time." },
              { q: "How does the placement test work?", a: "15 minutes, adaptive — it gets harder or easier based on your answers. After 8–12 questions per subject, the AI confidently knows your exact starting level. Far more accurate than a grade-based assumption." },
              { q: "What if my child gets stuck at a level?", a: "The system detects this automatically. If accuracy drops below 70% for 3 days in a row on a skill, we insert review sheets from the previous level. No human intervention needed." },
              { q: "Can I cancel anytime?", a: "Yes. One click in your billing settings. We don't lock in or hide cancellation. If you cancel mid-month, you keep access until the period ends." },
              { q: "Is this COPPA compliant?", a: "Yes. All student accounts are created by parents. We never share student data with advertisers, and parents can request full account deletion at any time." },
            ]} />
          </div>
        </section>

        {/* ── TRUST STRIP ─────────────────────────────────────────────── */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ["💰", "Affordable", "Less than one tutoring session per month"],
              ["🖨", "Print or digital", "Paper-first, works on any device"],
              ["📐", "Curriculum-aligned", "Built skill by skill, Pre-K to Grade 12"],
              ["🔒", "Safe & private", "COPPA-aware, data never sold"],
            ].map(([icon, title, desc]) => (
              <div key={title}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-semibold mb-0.5">{title}</div>
                <div className="text-xs text-muted leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="py-28 bg-ink text-cream text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(200,144,42,0.12), transparent)" }} />
          <div className="max-w-3xl mx-auto px-6 lg:px-8 relative">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-4">Get started today</div>
            <h2 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Find your child&rsquo;s
              <br />
              <em className="italic text-gold-mid font-light">true math level.</em>
            </h2>
            <p className="text-lg text-cream/60 mb-10 max-w-xl mx-auto leading-relaxed">
              The placement test takes 15 minutes. It will tell you precisely which skills are solid
              and which ones have gaps — for free, before you commit to anything.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/placement">
                <Button variant="gold" size="lg" rightIcon={ArrowIcon}>
                  Start free placement test
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="ghost" size="lg" className="text-cream/70 hover:text-cream hover:bg-white/10">
                  Create an account
                </Button>
              </Link>
            </div>
            <p className="text-xs text-cream/30 mt-5 font-sans">No credit card · No commitment · Results in 15 minutes</p>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
