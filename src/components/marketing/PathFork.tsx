// src/components/marketing/PathFork.tsx
// The two-path fork — appears immediately after hero.
// Lets parents self-select: daily platform vs one-time shop.
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function PathFork() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 bg-cream relative overflow-hidden">
      {/* Subtle radial gradient behind cards */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200,144,42,0.06) 0%, transparent 70%)" }} />

      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">How would you like to start?</span>
          </div>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-ink leading-tight">
            Two ways to help<br />
            <em className="italic font-light text-gold">your child thrive.</em>
          </h2>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Card 1 — Daily Platform */}
          <div className={`transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <Link href="/placement" className="group relative bg-ink rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-300 no-underline">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(200,144,42,0.15), transparent 60%)" }} />

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-gold/20 text-gold-mid text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6 w-fit">
                <div className="w-1 h-1 rounded-full bg-gold-mid animate-pulse" />
                Most popular
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-gold fill-none stroke-[1.5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 7 2 2 4-4" />
                </svg>
              </div>

              <h3 className="font-serif text-2xl font-bold text-cream mb-3">Daily practice platform</h3>
              <p className="text-cream/60 text-sm leading-relaxed mb-6 flex-1">
                Your child takes a placement test, gets placed at their exact skill level, and receives a personalised 3-sheet daily packet every morning. The system tracks progress and advances them automatically when they've mastered each level.
              </p>

              {/* Features */}
              <div className="space-y-2 mb-8">
                {[
                  "AI placement test — finds exact skill level",
                  "Daily 3-sheet packet, auto-generated",
                  "95% mastery gates — no rushing ahead",
                  "Parent dashboard with real-time progress",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-cream/70">
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-gold flex-shrink-0">
                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.5 5.5L7 10 4.5 7.5 3 9l4 4 6-6-1.5-1.5z"/>
                    </svg>
                    {f}
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-cream/40 text-xs font-sans mb-1">Starting from</div>
                    <div className="font-serif text-3xl font-bold text-cream">$9.99<span className="text-base font-sans font-normal text-cream/40">/mo</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-cream/30 font-sans">vs Kumon</div>
                    <div className="text-sm font-semibold text-gold-mid line-through-gold">$150–200/mo</div>
                  </div>
                </div>
                <Link href="/placement" className="block w-full bg-gold text-ink text-sm font-bold py-3.5 rounded-xl text-center hover:bg-gold-mid transition-colors">
                  Start free — take placement test →
                </Link>
                <p className="text-center text-[10px] text-cream/30 mt-2 font-sans">7-day free trial · No card required</p>
              </div>
            </Link>
          </div>

          {/* Card 2 — Shop */}
          <div className={`transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <Link href="/shop" className="group relative bg-white border-2 border-border rounded-3xl p-8 h-full flex flex-col overflow-hidden cursor-pointer hover:border-gold hover:scale-[1.01] transition-all duration-300 no-underline">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(200,144,42,0.04), transparent 60%)" }} />

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-brand-blue-light text-brand-blue text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6 w-fit">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-current">
                  <path d="M6 0l1.5 4.5H12L8.25 7.5 9.75 12 6 9 2.25 12l1.5-4.5L0 4.5h4.5z"/>
                </svg>
                No account needed
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-brand-blue-light flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-brand-blue fill-none stroke-[1.5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              <h3 className="font-serif text-2xl font-bold text-ink mb-3">Printable worksheet packs</h3>
              <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
                Need extra practice for a specific skill? Buy a ready-made printable pack — 100 worksheets, answer keys included, instant download. No subscription, no account, no commitment.
              </p>

              {/* Packs preview */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  { label: "Addition", grades: "Pre-K – Gr. 2", color: "#1B4F8A" },
                  { label: "Subtraction", grades: "Gr. 1 – Gr. 3", color: "#2D6A3F" },
                  { label: "Multiplication", grades: "Gr. 2 – Gr. 5", color: "#C8902A" },
                  { label: "Division", grades: "Gr. 3 – Gr. 5", color: "#8A3F1B" },
                ].map(pack => (
                  <div key={pack.label} className="bg-cream rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pack.color }} />
                    <div>
                      <div className="text-xs font-semibold text-ink">{pack.label}</div>
                      <div className="text-[9px] text-muted">{pack.grades}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="border-t border-border pt-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-muted text-xs font-sans mb-1">From</div>
                    <div className="font-serif text-3xl font-bold text-ink">$3.99<span className="text-base font-sans font-normal text-muted">/pack</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted font-sans">All 4 packs</div>
                    <div className="text-sm font-semibold text-brand-blue">$9.99 total</div>
                  </div>
                </div>
                <Link href="/shop" className="block w-full bg-brand-blue text-white text-sm font-bold py-3.5 rounded-xl text-center hover:bg-[#153F6E] transition-colors">
                  Browse worksheet packs →
                </Link>
                <p className="text-center text-[10px] text-muted mt-2 font-sans">1 pack $3.99 · 2 packs $5.99 · All 4 packs $9.99</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Or separator */}
        <div className={`flex items-center justify-center gap-4 mt-6 transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
          <div className="h-px flex-1 bg-border max-w-32" />
          <span className="text-xs text-muted font-sans">Not sure? Take the free placement test first — it tells you exactly where your child stands.</span>
          <div className="h-px flex-1 bg-border max-w-32" />
        </div>
      </div>
    </section>
  );
}
