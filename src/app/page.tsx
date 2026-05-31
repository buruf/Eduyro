// src/app/page.tsx
import Link from "next/link";
import { PublicNavbar, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { SampleWorksheets } from "@/components/marketing/SampleWorksheets";
import { LevelLadder } from "@/components/marketing/LevelLadder";
import { CurriculumTables } from "@/components/marketing/CurriculumTables";
import { PracticeWidgets } from "@/components/marketing/PracticeWidgets";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main className="bg-cream">

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">
                Pre-K through Grade 12 · 4 subjects
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                Mastery learning,<br />
                <em className="italic font-light text-gold">one step at a time.</em>
              </h1>
              <p className="text-lg text-muted mt-6 max-w-lg leading-relaxed">
                Eduyro gives every student a personalized path through mastery — daily printable worksheets in Math, Reading, Writing &amp; Science, paced exactly to their level.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/placement">
                  <Button variant="primary" size="lg" rightIcon={<span>→</span>}>
                    Take free placement test
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="secondary" size="lg">Browse printable packs</Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted">
                <div className="flex items-center gap-2"><span className="text-brand-green">✓</span>Free placement test</div>
                <div className="flex items-center gap-2"><span className="text-brand-green">✓</span>No credit card required</div>
                <div className="flex items-center gap-2"><span className="text-brand-green">✓</span>Print at home</div>
              </div>
            </div>

            {/* Hero card preview */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gold/10 rounded-3xl rotate-2" />
              <div className="relative bg-white border border-border rounded-2xl shadow-elev p-8">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Eduyro Education</div>
                    <div className="font-serif text-lg font-bold mt-1">Multiplication — ×6, ×7, ×8 Tables</div>
                    <div className="text-xs text-muted mt-1">Level M5 · Sheet 1 of 3 · Target: 10 min</div>
                  </div>
                  <div className="text-right text-xs text-muted">Name: ___________<br />Score: __/20</div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 font-serif">
                  {[
                    "6 × 7 =", "8 × 3 =", "7 × 9 =", "6 × 8 =",
                    "8 × 7 =", "7 × 4 =", "6 × 9 =", "8 × 6 =",
                    "7 × 7 =", "6 × 6 =", "8 × 8 =", "7 × 5 =",
                  ].map((q, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b border-cream-dark py-1.5">
                      <span className="text-[10px] text-muted/40 font-sans">{i + 1}.</span>
                      <span className="font-bold flex-1 px-2">{q}</span>
                      <div className="w-10 h-5 border border-border-mid rounded bg-cream-dark/30" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-3 border-t border-dashed border-border flex justify-between text-[10px] text-muted/60 font-sans">
                  <span>Level M5 · Eduyro</span>
                  <span>Page 1 of 3</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="stripe-divider" />

        {/* SAMPLE WORKSHEETS */}
        <section className="py-20 bg-cream-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">See it in action</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Real worksheets, not just demos.</h2>
            <p className="text-muted max-w-xl mb-12 leading-relaxed">
              Every level uses printable, mastery-based practice sheets. Here are real examples from all four subjects.
            </p>
            <SampleWorksheets />
          </div>
        </section>

        {/* INTERACTIVE PRACTICE */}
        <section className="py-20" id="practice">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Try it yourself</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Practice a few problems right now.</h2>
            <p className="text-muted max-w-xl mb-12">
              Type your answers. Get instant feedback. Just like the daily practice your student will get.
            </p>
            <PracticeWidgets />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-ink text-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-3">How it works</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-16">The mastery loop, in four steps.</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { n: 1, t: "Placement test", d: "A 15-minute adaptive test places your student at their exact skill level — not their grade level." },
                { n: 2, t: "Daily packet", d: "Three short worksheets every day, 20 problems each, targeted at one specific skill." },
                { n: 3, t: "95% mastery", d: "Hit 95% accuracy for 5 days in a row, and the system automatically advances your student to the next level." },
                { n: 4, t: "Track everything", d: "Streaks, accuracy, attendance, level advances. All visible to parents in real time." },
              ].map((s) => (
                <div key={s.n}>
                  <div className="w-12 h-12 rounded-full bg-gold/20 text-gold-mid flex items-center justify-center font-serif text-lg font-bold mb-5">{s.n}</div>
                  <h3 className="font-serif text-lg font-semibold mb-2">{s.t}</h3>
                  <p className="text-sm text-cream/60 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEVEL LADDER */}
        <section className="py-20" id="curriculum">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">The level ladder</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">From counting to calculus.</h2>
            <p className="text-muted max-w-xl mb-12">
              23 levels in Math alone. Each level contains 200+ worksheets organized by skill.
            </p>
            <LevelLadder />
          </div>
        </section>

        {/* CURRICULUM TABLES */}
        <section className="py-20 bg-cream-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Full curriculum</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-12">Every level, every subject.</h2>
            <CurriculumTables />
          </div>
        </section>

        {/* SHOP */}
        <section id="shop" className="py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Shop</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">
              Buy a printable pack today.
            </h2>
            <p className="text-muted max-w-xl mb-12 leading-relaxed">
              100 worksheets per skill, instant download, answer keys included. No account required.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                { emoji: "➕", label: "Addition", desc: "Counting through 2-digit addition. 100 sheets, ~2,500 problems.", grades: "Pre-K – Grade 2" },
                { emoji: "➖", label: "Subtraction", desc: "Subtraction within 20 through 3-digit regrouping. 100 sheets.", grades: "Grade 1 – Grade 3" },
                { emoji: "✖", label: "Multiplication", desc: "Times tables through mixed fluency drills. 100 sheets, ~2,500 problems.", grades: "Grade 2 – Grade 5" },
                { emoji: "➗", label: "Division", desc: "Division facts through long division with remainders. 100 sheets.", grades: "Grade 3 – Grade 5" },
              ].map((pack) => (
                <div key={pack.label} className="bg-white border border-border rounded-2xl p-6 hover:border-gold hover:shadow-card transition-all group">
                  <div className="text-3xl mb-3">{pack.emoji}</div>
                  <h3 className="font-serif text-lg font-bold mb-1">{pack.label}</h3>
                  <div className="text-[10px] text-gold font-semibold uppercase tracking-wider mb-2">{pack.grades}</div>
                  <p className="text-sm text-muted leading-relaxed mb-4">{pack.desc}</p>
                  <div className="text-xs text-muted mb-4">100 sheets · Answer keys · Instant download</div>
                  <Link
                    href="/shop"
                    className="w-full mt-3 bg-brand-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2"
                  >
                    👁 Preview sample worksheets
                  </Link>
                </div>
              ))}
            </div>
            <div className="bg-cream-dark border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
              <div>
                <div className="font-serif text-lg font-bold mb-1">Bundle pricing</div>
                <div className="text-sm text-muted">
                  1 pack · $9.99 &nbsp;|&nbsp; 2 packs · $15.99 &nbsp;|&nbsp; 3 packs · $19.99 &nbsp;|&nbsp; All 4 · $24.99
                </div>
              </div>
              <Link href="/shop">
                <Button variant="gold" size="lg" rightIcon={<span>→</span>}>
                  Shop now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 bg-cream-dark">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Pricing</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-3">
              7-day free trial. Then from $9.99/month.
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-12">
              No credit card required to start. Cancel anytime.
            </p>
            <div className="max-w-lg mx-auto">
              <div className="bg-ink text-cream rounded-2xl p-8 relative">
                <div className="absolute top-4 right-4 bg-gold text-ink text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
                  Simple pricing
                </div>
                <div className="font-serif text-lg font-semibold mb-1">Per-child plan</div>
                <div className="text-xs text-cream/55 mb-6">Every child gets their own personalized learning path</div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">First child</div>
                      <div className="text-xs text-cream/55">7-day free trial included</div>
                    </div>
                    <div className="font-serif text-2xl font-bold text-gold-mid">$9.99<span className="text-sm font-sans text-cream/55">/mo</span></div>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">Each additional child</div>
                      <div className="text-xs text-cream/55">Added to same subscription</div>
                    </div>
                    <div className="font-serif text-2xl font-bold text-gold-mid">$5.99<span className="text-sm font-sans text-cream/55">/mo</span></div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm mb-8">
                  {["All 4 subjects", "Unlimited daily worksheets", "Printable PDF downloads", "Parent dashboard", "No per-seat cap — add as many children as you have"].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-cream/85">
                      <span className="text-gold-mid">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"><Button variant="gold" fullWidth size="lg">Start 7-day free trial →</Button></Link>
                <p className="text-center text-xs text-cream/40 mt-3">No credit card required · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">What parents say</div>
            <h2 className="font-serif text-4xl font-bold leading-tight mb-12">Real stories. Real progress.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { q: "My daughter went from Level M3 to Level M5 in two months. The daily routine made all the difference — it became as automatic as brushing her teeth.", name: "Maria R.", role: "Homeschool parent · Ontario", color: "#1B4F8A", av: "MR" },
                { q: "We pulled both kids from Kumon and switched to Eduyro. Same methodology, a fraction of the cost, and far better transparency. The parent dashboard alone justifies the price.", name: "David K.", role: "Parent of two · Toronto", color: "#2D6A3F", av: "DK" },
                { q: "My son went from hating math to asking for his sheets every morning. Honestly didn't think it was possible.", name: "Sunita P.", role: "Parent · Brampton", color: "#C8902A", av: "SP" },
              ].map((t, i) => (
                <div key={i} className="bg-white border border-border rounded-2xl p-7">
                  <div className="text-gold mb-3 tracking-tighter">★★★★★</div>
                  <p className="font-serif italic font-light text-base leading-relaxed mb-6">"{t.q}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full text-white text-xs font-semibold flex items-center justify-center" style={{ background: t.color }}>{t.av}</div>
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-cream-dark">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">FAQ</div>
              <h2 className="font-serif text-4xl font-bold leading-tight mb-12">Common questions.</h2>
            </div>
            <FaqAccordion items={[
              { q: "How is this different from Kumon?", a: "Same methodology — mastery through daily practice, level-based progression, 95% accuracy threshold — but at a tenth of the cost. No physical centres, a real parent dashboard, and an AI placement test that replaces hour-long manual intake assessments." },
              { q: "Do I need a printer?", a: "Recommended but not required. You can complete worksheets digitally on the student dashboard, but most families print the daily 3-sheet packet — it works better for fluency and there's no screen time." },
              { q: "How does the placement test work?", a: "15 minutes, adaptive — it gets harder or easier based on your answers. After 8–12 questions per subject, the AI confidently knows your exact starting level. Far more accurate than a grade-based assumption." },
              { q: "What if my child gets stuck?", a: "The system detects this automatically. If accuracy drops below 70% for 3 days in a row on a skill, we insert review sheets from the previous level. No human intervention needed." },
              { q: "Can I cancel anytime?", a: "Yes. One click in your billing settings. We don't lock in or hide cancellation. If you cancel mid-month, you keep access until the period ends." },
              { q: "Is this COPPA compliant?", a: "Yes. All student accounts are created by parents. We never share student data with advertisers, and parents can request full account deletion at any time." },
            ]} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-ink text-cream text-center">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="font-serif text-5xl font-bold leading-tight mb-6">
              Ready to start the<br /><em className="italic text-gold-mid font-light">first step?</em>
            </h2>
            <p className="text-lg text-cream/65 mb-10 max-w-xl mx-auto">
              Take the free placement test. See exactly where your student should begin. No card. No commitment.
            </p>
            <Link href="/placement">
              <Button variant="gold" size="lg" rightIcon={<span>→</span>}>
                Begin placement test
              </Button>
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
