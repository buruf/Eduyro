// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { SampleWorksheets } from "@/components/marketing/SampleWorksheets";
import { CurriculumTables } from "@/components/marketing/CurriculumTables";
import { PracticeWidgets } from "@/components/marketing/PracticeWidgets";
import { HeroAnimation } from "@/components/marketing/HeroAnimation";
import { PathFork } from "@/components/marketing/PathFork";
import { StickyBar } from "@/components/marketing/StickyBar";
import { TestimonialMarquee } from "@/components/marketing/TestimonialMarquee";

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

export default function HomePage() {
  const howItWorks = useReveal();
  const curriculum = useReveal();
  const pricing    = useReveal();
  const faq        = useReveal();

  return (
    <>
      <StickyBar />
      <PublicNavbar />
      <main className="bg-cream">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-16 pb-0 lg:pt-24">
          {/* Grid texture */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(#1A1612 1px, transparent 1px), linear-gradient(90deg, #1A1612 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }} />

          {/* Warm radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,144,42,0.08) 0%, transparent 70%)" }} />

          <div className="max-w-5xl mx-auto px-6 lg:px-8 relative">

            {/* Eyebrow pill */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-5 py-2 shadow-card">
                <div className="flex -space-x-1">
                  {["#1B4F8A","#2D6A3F","#C8902A","#8A3F9F"].map(c => (
                    <div key={c} className="w-4 h-4 rounded-full border-2 border-white" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-ink">Pre-K through Grade 12</span>
                <div className="h-3 w-px bg-border" />
                <span className="text-xs text-muted">4 subjects · Print at home</span>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center mb-6">
              <h1 className="font-serif text-5xl lg:text-[4rem] xl:text-[4.5rem] font-bold leading-[1.04] tracking-tight text-ink">
                Your child deserves a
                <br />
                <span className="relative inline-block mt-1">
                  <em className="italic font-light text-gold" style={{ fontStyle: "italic" }}>personalised</em>
                  {/* Underline squiggle */}
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 6 Q50 2 100 6 Q150 10 198 6" stroke="#C8902A" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                </span>
                {" "}path through school.
              </h1>
              <p className="text-lg text-muted mt-6 max-w-2xl mx-auto leading-relaxed">
                Eduyro places your child at their exact skill level — not their grade —
                then builds daily habits through mastery-based worksheets in Math, Reading, Writing &amp; Science.
                The same method as Kumon. A fraction of the cost.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
              <Link href="/placement">
                <Button variant="primary" size="lg" rightIcon={
                  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                    <path d="M10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 11H5a1 1 0 1 1 0-2h7.586l-2.293-2.293a1 1 0 0 1 0-1.414z"/>
                  </svg>
                }>
                  Take the free placement test
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">See how it works</Button>
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-14 text-sm text-muted">
              {[
                { icon: "M5 13l4 4L19 7", label: "No credit card required" },
                { icon: "M5 13l4 4L19 7", label: "7-day free trial" },
                { icon: "M5 13l4 4L19 7", label: "Cancel anytime" },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-brand-green fill-none stroke-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Animated product demo */}
            <HeroAnimation />

            {/* Stats row */}
            <div className="mt-10 mb-0 pb-16 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
              {[
                { n: "Unlimited", label: "fresh worksheets generated" },
                { n: "95%", label: "mastery threshold" },
                { n: "4 subjects", label: "Pre-K to Grade 12" },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="font-serif text-2xl font-bold text-ink">{stat.n}</div>
                  <div className="text-xs text-muted mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Wave divider into next section */}
          <div className="relative h-16 -mb-1">
            <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none" style={{ fill: "#F5F0E8" }}>
              <path d="M0,64L80,53.3C160,43,320,21,480,21.3C640,21,800,43,960,48C1120,53,1280,43,1360,37.3L1440,32L1440,64L1360,64C1280,64,1120,64,960,64C800,64,640,64,480,64C320,64,160,64,80,64L0,64Z"/>
            </svg>
          </div>
        </section>

        {/* ── TWO-PATH FORK ─────────────────────────────────────────────── */}
        <PathFork />

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

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 bg-ink text-cream">
          <div
            ref={howItWorks.ref}
            className={`max-w-7xl mx-auto px-6 lg:px-8 transition-all duration-700 ${howItWorks.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-3">How it works</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-4">Four steps. One consistent habit.</h2>
            <p className="text-cream/60 max-w-xl mb-16 text-base leading-relaxed">
              Most tutoring centres never tell parents exactly where their child stands or why they're not advancing.
              Eduyro is built around total transparency and a single measurable outcome: mastery.
            </p>

            {/* Steps with connector line */}
            <div className="relative">
              {/* Connector line — desktop only */}
              <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-white/10" />
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border border-white/10 rounded-2xl overflow-hidden">
                {[
                  {
                    n: "01", t: "Placement test",
                    d: "A 15-minute adaptive test finds your child's exact skill level — not their grade level. No guessing, no wasted time on material they already know.",
                    tag: "Takes 15 min",
                    icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 7 2 2 4-4",
                  },
                  {
                    n: "02", t: "Daily 3-sheet packet",
                    d: "Three focused worksheets every morning. 20–30 problems each. Targeted at one specific skill. Print them out — screen-free practice builds stronger retention.",
                    tag: "10 min/day",
                    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z",
                  },
                  {
                    n: "03", t: "95% mastery gates",
                    d: "The system only advances your child when they've hit 95% accuracy for 5 consecutive days. No child moves forward before they're truly ready.",
                    tag: "Auto-paced",
                    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z",
                  },
                  {
                    n: "04", t: "Parent dashboard",
                    d: "Streaks, accuracy, level advances, attendance. Everything visible in real time. You'll know within seconds whether your child did their work today.",
                    tag: "Full visibility",
                    icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
                  },
                ].map((s, i) => (
                  <div
                    key={s.n}
                    className="p-7 border-r border-b border-white/10 last:border-r-0 [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(3)]:border-r"
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-gold-mid fill-none stroke-[1.5]">
                          <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 font-sans">{s.tag}</span>
                    </div>
                    <div className="font-serif text-3xl font-bold text-white/10 mb-2 leading-none">{s.n}</div>
                    <h3 className="font-serif text-lg font-semibold mb-2 text-cream">{s.t}</h3>
                    <p className="text-sm text-cream/55 leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Kumon comparison */}
            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-7 grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold-mid mb-3">Eduyro vs Kumon</div>
                <p className="text-sm text-cream/60 leading-relaxed">
                  Same methodology. Same 95% mastery threshold. Same daily drill habit. The difference is cost, transparency, and control.
                </p>
              </div>
              {[
                { label: "Monthly cost", eduyro: "$9.99 USD/child", kumon: "$150–200 USD/child" },
                { label: "Parent visibility", eduyro: "Real-time dashboard", kumon: "Monthly report" },
              ].map(row => (
                <div key={row.label} className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-cream/40 uppercase tracking-wider mb-3 font-sans">{row.label}</div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                    <div>
                      <div className="text-xs text-cream/40 font-sans">Eduyro</div>
                      <div className="text-sm font-semibold text-gold-mid">{row.eduyro}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-cream/40 font-sans">Kumon</div>
                      <div className="text-sm text-cream/50 line-through">{row.kumon}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS — MARQUEE ───────────────────────────────────── */}
        <TestimonialMarquee />

        {/* ── CURRICULUM ───────────────────────────────────────────────── */}
        <section className="py-20 bg-cream-dark" id="curriculum">
          <div
            ref={curriculum.ref}
            className={`max-w-7xl mx-auto px-6 lg:px-8 transition-all duration-700 ${curriculum.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Full curriculum</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">From counting to calculus —<br />every level mapped.</h2>
            <p className="text-muted max-w-xl mb-12 leading-relaxed">
              42 levels across 4 subjects. Every skill sequenced so mastery at one level is exactly the foundation the next level requires.
            </p>
            <CurriculumTables />
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
                Seven days to see real progress. No card required. If your child doesn't improve in the first week, you haven't paid a cent.
              </p>

              {/* Savings callout */}
              <div className="inline-flex items-center gap-2 bg-brand-green-light border border-brand-green/20 rounded-full px-4 py-1.5 mt-4">
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-brand-green flex-shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                </svg>
                <span className="text-xs font-semibold text-brand-green">Save up to $1,920/year vs Kumon</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free trial */}
              <div className="bg-cream-dark border-2 border-border rounded-2xl p-8 flex flex-col">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">Free trial</div>
                <div className="font-serif text-4xl font-bold text-ink mb-1">$0 <span className="text-sm font-sans font-normal text-muted">USD</span></div>
                <div className="text-sm text-muted mb-6">7 days · No card required</div>
                <ul className="space-y-3 text-sm mb-8 flex-1">
                  {["Full AI placement test","All 4 subjects unlocked","Daily worksheet packets","Parent dashboard","Up to 3 children"].map(f => (
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
                <div className="text-sm text-cream/50 mb-2">First child · +$5.99 each additional</div>
                <div className="text-xs text-gold-mid mb-6 font-sans">7-day free trial included</div>
                <ul className="space-y-3 text-sm mb-8 flex-1">
                  {["Everything in free trial","Unlimited daily worksheets","Printable PDF downloads","Auto-advance on mastery","No per-seat cap","Email progress reports"].map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-cream/80">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 fill-gold-mid flex-shrink-0 mt-0.5">
                        <path d="M10 18A8 8 0 1 0 10 2a8 8 0 0 0 0 16zm3.707-9.293l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414z"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button variant="gold" fullWidth size="lg" rightIcon={
                    <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                      <path d="M10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 11H5a1 1 0 1 1 0-2h7.586l-2.293-2.293a1 1 0 0 1 0-1.414z"/>
                    </svg>
                  }>
                    Start 7-day free trial
                  </Button>
                </Link>
                <p className="text-center text-xs text-cream/30 mt-3 font-sans">Cancel anytime · No hidden fees</p>
              </div>
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

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="py-28 bg-ink text-cream text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(200,144,42,0.12), transparent)" }} />

          <div className="max-w-3xl mx-auto px-6 lg:px-8 relative">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-4">Get started today</div>
            <h2 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Know exactly where
              <br />
              <em className="italic text-gold-mid font-light">your child stands.</em>
            </h2>
            <p className="text-lg text-cream/60 mb-10 max-w-xl mx-auto leading-relaxed">
              The placement test takes 15 minutes. It will tell you precisely which skills are solid and which ones have gaps — for free, before you commit to anything.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/placement">
                <Button variant="gold" size="lg" rightIcon={
                  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
                    <path d="M10.293 5.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414-1.414L12.586 11H5a1 1 0 1 1 0-2h7.586l-2.293-2.293a1 1 0 0 1 0-1.414z"/>
                  </svg>
                }>
                  Begin free placement test
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
