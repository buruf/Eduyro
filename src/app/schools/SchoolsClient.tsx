// src/app/schools/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export default function SchoolsPage() {
  return (
    <>
      {/* Custom nav for schools */}
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <Link href="/" className="hover:text-ink">Home</Link>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how-it-works" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#contact" className="hover:text-ink">Contact</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin" className="text-sm text-muted hover:text-ink">Sign in</Link>
            <a href="#contact"><Button variant="gold" size="sm" rightIcon={<span>→</span>}>Get a quote</Button></a>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <div className="stripe-divider" />
        <FeaturesSection />
        <HowItWorksSection />
        <ComparisonSection />
        <SchoolPricingSection />
        <TestimonialsSection />
        <ContactSection />
        <SchoolsFaqSection />
      </main>
      <PublicFooter />
    </>
  );
}

function HeroSection() {
  return (
    <section className="bg-ink text-cream py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-3">
            Eduyro for Schools
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
            Mastery learning at<br />
            <em className="italic font-light text-gold-mid">school scale.</em>
          </h1>
          <p className="text-lg text-cream/65 mt-6 max-w-md leading-relaxed">
            Give every student a personalized learning path. Generate and print daily worksheets for an entire class in one click. Track every student in real time.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#contact">
              <Button variant="gold" size="lg" rightIcon={<span>→</span>}>Get a free school demo</Button>
            </a>
            {/* Was a link to /admin, which every logged-out prospect hit as a
                sign-in wall - a broken promise on the page meant to sell them.
                Point at what we can actually show a visitor. */}
            <a href="#features">
              <Button size="lg" className="bg-white/10 text-cream border-[1.5px] border-white/20 hover:bg-white/15">
                See what the admin panel does
              </Button>
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { v: "84", l: "Max students per centre" },
              { v: "$8", l: "Per student per month" },
              { v: "1 click", l: "Bulk export all PDFs" },
            ].map((s) => (
              <div key={s.l} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="font-serif text-2xl font-bold text-gold-mid">{s.v}</div>
                <div className="text-[10px] text-cream/50 mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin preview card */}
        <div className="bg-white/5 border border-white/12 rounded-2xl p-6">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center text-ink font-bold text-xs">SA</div>
            <div>
              <div className="text-sm font-semibold">Sunrise Academy</div>
              <div className="text-[10px] text-cream/40">Admin Panel · 84 students</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[["91%", "Avg accuracy"], ["23", "Advances/mo"], ["1,240", "Sheets/week"]].map(([v, l]) => (
              <div key={l} className="bg-white/6 rounded-lg p-2.5 text-center">
                <div className="font-serif text-base font-bold">{v}</div>
                <div className="text-[9px] text-cream/40 uppercase tracking-wider mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {[
              ["Kai Liu", "Math M5 · 68%", 68, "#C8902A", "On track", "green"],
              ["Emma Liu", "Reading R3 · 81%", 81, "#C8902A", "Review", "gold"],
              ["Sam Park", "Math M6 · 97%", 97, "#639922", "Excellent", "green"],
              ["Leo Martinez", "Math M3 · 72%", 72, "#C23B22", "Support", "red"],
              ["Priya Patel", "Math A · 96%", 96, "#639922", "Excellent", "green"],
            ].map((row: any) => {
              const [name, info, pct, color, status, statusColor] = row;
              return (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-cream/80 w-24 truncate">{name}</span>
                  <span className="text-[10px] text-cream/40 w-28 truncate">{info}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      statusColor === "green" ? "bg-brand-green/30 text-[#97D477]" :
                      statusColor === "gold" ? "bg-gold/25 text-gold-mid" :
                      "bg-brand-red/30 text-[#F5907A]"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <button className="flex-1 bg-white/6 border border-white/12 rounded-md py-2 text-[11px] text-cream/70 hover:bg-white/10 transition-colors">
              🖨 Bulk export PDFs
            </button>
            <button className="flex-1 bg-gold/20 border border-gold/30 rounded-md py-2 text-[11px] text-gold-mid hover:bg-gold/25 transition-colors">
              📈 View analytics
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: "👥", iconBg: "bg-brand-blue-light", title: "Multi-student management", desc: "Manage every student in one place. Assign levels, track progress, flag who needs support.", bullets: ["Student roster with status flags", "Class and grade groupings", "Bulk level assignment", "Automated struggle detection"] },
    { icon: "🖨", iconBg: "bg-ink text-gold-mid", title: "One-click bulk PDF export", desc: "Generate today's worksheet packets for every student simultaneously — in under 30 seconds.", bullets: ["Export by class or whole school", "Auto-named per student", "Weekly packet bundles", "Answer keys in separate file"] },
    { icon: "🗂", iconBg: "bg-gold-light", title: "Curriculum builder", desc: "Create custom sequences, edit skill progressions, build on top of the base curriculum.", bullets: ["Full hierarchy editor", "Custom question banks", "Skill sequencing controls", "Custom mastery thresholds"] },
    { icon: "📈", iconBg: "bg-brand-green-light", title: "School-wide analytics", desc: "Every student's accuracy, attendance, and level progress at a glance.", bullets: ["Real-time accuracy by skill", "Attendance + completion tracking", "Level advancement history", "Exportable PDF reports"] },
    { icon: "🎨", iconBg: "bg-cream-dark", title: "Custom branding", desc: "Every worksheet prints with your school's name and logo — not Eduyro.", bullets: ["Your name + logo on all sheets", "Custom header & footer text", "Branded parent reports", "White-label option available"] },
    { icon: "🔗", iconBg: "bg-brand-red-light", title: "Integrations", desc: "Connect to the tools your school already uses.", bullets: ["Google Classroom integration", "CSV roster import", "Grade export to Excel/CSV", "API access for districts"] },
  ];
  return (
    <section className="py-24" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">School Features</div>
        <h2 className="font-serif text-4xl font-bold leading-tight mb-3">
          Everything a school needs — nothing it doesn't.
        </h2>
        <p className="text-muted max-w-lg mb-12">
          Built specifically for tutoring centres, private schools, and homeschool co-ops managing multiple students.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-border rounded-2xl p-6">
              <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center text-xl mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed mb-3">{f.desc}</p>
              <div className="space-y-1.5">
                {f.bullets.map((b) => (
                  <div key={b} className="flex items-start gap-2 text-xs text-muted">
                    <span className="text-brand-green font-bold flex-shrink-0">✓</span>{b}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: 1, t: "Import your roster", d: "Upload a CSV with student names and grades. Accounts created automatically. Under 5 minutes for any school size." },
    { n: 2, t: "Run placement tests", d: "Students take the adaptive placement test at home or in school. Every student gets their exact skill level across all selected subjects." },
    { n: 3, t: "Print daily packets", d: "Every morning, click \"Bulk export\" and download every student's worksheet packet — sorted by class, named automatically." },
    { n: 4, t: "Track and advance", d: "The dashboard shows you who's on track, who's struggling, and who just advanced. The system handles all assessment automatically." },
  ];
  return (
    <section className="py-24 bg-cream-dark" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">For Schools</div>
        <h2 className="font-serif text-4xl font-bold leading-tight mb-12">
          Up and running in one day.
        </h2>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-7">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-ink text-gold-mid font-serif font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {s.n}
                </div>
                <div>
                  <h4 className="font-serif text-base font-semibold mb-1">{s.t}</h4>
                  <p className="text-sm text-muted leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual */}
          <div className="bg-ink rounded-2xl p-6 text-cream">
            <div className="text-[10px] uppercase tracking-wider text-cream/60 font-semibold mb-3">
              Grade 4 — Mr. Kim's Class
            </div>
            <div className="grid grid-cols-[40px_1fr_50px_42px] gap-2 text-[10px] text-cream/30 uppercase tracking-wider mb-1 pb-1.5 border-b border-white/10">
              <span>Student</span><span>Progress</span><span>Acc.</span><span>Status</span>
            </div>
            {[
              ["KL", "#1B4F8A", "Kai Liu", 88, "#C8902A", "On track"],
              ["SP", "#2D6A3F", "Sam Park", 97, "#639922", "Excellent"],
              ["AJ", "#8A3F9F", "Aisha J.", 85, "#1B4F8A", "On track"],
              ["LM", "#C23B22", "Leo M.", 72, "#C23B22", "Support"],
              ["SC", "#C8902A", "Sofia C.", 93, "#639922", "Excellent"],
            ].map((row: any) => {
              const [av, c, name, pct, pc, status] = row;
              return (
                <div key={name} className="grid grid-cols-[40px_1fr_50px_42px] gap-2 items-center py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full text-white text-[8px] font-semibold flex items-center justify-center" style={{ background: c }}>{av}</div>
                    <span className="text-[10px] text-cream/70 truncate">{name}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pc }} />
                  </div>
                  <span className="text-[10px] font-semibold text-right" style={{ color: pc }}>{pct}%</span>
                  <span className="text-[9px] font-semibold text-center" style={{
                    color: status === "Excellent" || status === "On track" ? "#97D477" : "#F5907A"
                  }}>{status}</span>
                </div>
              );
            })}
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <div className="flex-1 bg-white/6 rounded-md p-2 text-center text-[11px] text-cream/60">
                📋 22 packets<br /><span className="text-cream/30 text-[10px]">ready to print</span>
              </div>
              <div className="flex-1 bg-gold/15 rounded-md p-2 text-center text-[11px] text-gold-mid">
                ⚠ 1 student<br /><span className="text-gold/55 text-[10px]">needs attention</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Why Eduyro</div>
        <h2 className="font-serif text-4xl font-bold leading-tight mb-3">
          How we compare to the alternatives.
        </h2>
        <p className="text-muted max-w-xl mb-10">
          Kumon works. But it costs $200+/month per student, requires physical centres, and gives parents little visibility. Eduyro delivers the same methodology at a fraction of the cost.
        </p>

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-dark">
                <th></th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-brand-blue">BrightSteps</th>
                <th className="text-center px-4 py-3 text-xs font-semibold">Kumon</th>
                <th className="text-center px-4 py-3 text-xs font-semibold">IXL</th>
                <th className="text-center px-4 py-3 text-xs font-semibold">Khan Academy</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Printable PDF worksheets", "✓", "✓", "✗", "✗"],
                ["AI placement test", "✓", "✗", "Partial", "Partial"],
                ["Mastery-based progression", "✓", "✓", "Partial", "✗"],
                ["Bulk PDF export (schools)", "✓", "✗", "✗", "✗"],
                ["Parent dashboard", "✓", "Basic", "✓", "Basic"],
                ["Admin / school panel", "✓", "✗", "✓", "✗"],
                ["No physical centre required", "✓", "✗", "✓", "✓"],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border hover:bg-cream-dark/40">
                  <td className="px-4 py-3 font-medium">{row[0]}</td>
                  {row.slice(1).map((cell, j) => (
                    <td key={j} className="text-center px-4 py-3">
                      <span className={cn(
                        "text-base",
                        cell === "✓" && "text-brand-green text-lg",
                        cell === "✗" && "text-border-mid",
                        cell === "Partial" && "text-gold text-xs",
                        cell === "Basic" && "text-gold text-xs",
                      )}>{cell}</span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border bg-cream-dark/40">
                <td className="px-4 py-3 font-medium">Monthly cost (per student)</td>
                <td className="text-center px-4 py-3 text-brand-green font-bold">$8–$19</td>
                <td className="text-center px-4 py-3 text-brand-red font-bold">$150–$200</td>
                <td className="text-center px-4 py-3 font-medium">$20–$30</td>
                <td className="text-center px-4 py-3 text-brand-green font-bold">Free</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SchoolPricingSection() {
  return (
    <section id="pricing" className="py-24 bg-cream-dark">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">School Pricing</div>
        <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Scales with your school.</h2>
        <p className="text-muted max-w-xl mx-auto mb-12">
          All school plans include everything in Premium plus admin tools, bulk export, and analytics.
        </p>

        <div className="grid md:grid-cols-3 gap-5 text-left">
          {[
            { name: "Starter Centre", desc: "Small tutoring centre or homeschool co-op", price: "$19", per: "/month per student · 20–49 students", features: ["Admin panel + teacher accounts", "Bulk PDF export", "All 4 subjects per student", "School-wide analytics", "Custom worksheet branding"], featured: false },
            { name: "School Plan", desc: "Established centres and small schools", price: "$12", per: "/month per student · 50–199 students", features: ["Everything in Starter", "Curriculum builder + CMS", "Scheduled daily export", "Google Classroom integration", "Dedicated account manager", "CSV roster import"], featured: true },
            { name: "District", desc: "School boards, franchise networks", price: "$8", per: "/month per student · 200+ students", features: ["Everything in School", "White-label platform", "Multi-location management", "API access + grade export", "Custom onboarding + training", "SLA + priority support"], featured: false },
          ].map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-7",
                plan.featured
                  ? "bg-ink text-cream border border-ink relative"
                  : "bg-white border border-border"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-ink text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                  Recommended
                </div>
              )}
              <div className="font-serif text-lg font-semibold mb-1">{plan.name}</div>
              <div className={cn("text-xs mb-5", plan.featured ? "text-cream/55" : "text-muted")}>{plan.desc}</div>
              <div className={cn("font-serif text-5xl font-bold leading-none", plan.featured && "text-gold-mid")}>{plan.price}</div>
              <div className={cn("text-xs mt-1 mb-5", plan.featured ? "text-cream/45" : "text-muted")}>{plan.per}</div>

              <div className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5",
                      plan.featured ? "bg-gold/25 text-gold-mid" : "bg-brand-green-light text-brand-green"
                    )}>✓</span>
                    <span className={plan.featured ? "text-cream/85" : "text-ink"}>{f}</span>
                  </div>
                ))}
              </div>

              <a href="#contact">
                <Button variant={plan.featured ? "gold" : "secondary"} fullWidth>
                  {plan.featured ? "Get school demo →" : "Get started →"}
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">School Stories</div>
        <h2 className="font-serif text-4xl font-bold leading-tight mb-12">Centres that made the switch.</h2>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { q: "The admin panel lets me manage 84 students and export their daily worksheets in one click. It's saved our centre hours of prep every single week.", n: "Sunita Patel", r: "Director · Sunrise Academy", c: "#C8902A", av: "SP" },
            { q: "We switched from Kumon franchising to running our own centre. Same methodology, a tenth of the cost, far better parent transparency. Enrolment grew 40% in six months.", n: "David Kim", r: "Owner · Excel Learning Centre", c: "#1B4F8A", av: "DK" },
            { q: "The placement test replaced our entire intake process. Students show up, take 15 minutes, and I know exactly where every one of them needs to start.", n: "Angela Torres", r: "Head Teacher · MathPath Academy", c: "#2D6A3F", av: "AT" },
          ].map((t, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-7">
              <div className="text-gold mb-3 tracking-tighter">★★★★★</div>
              <p className="font-serif italic font-light text-base leading-relaxed mb-5">"{t.q}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full text-white text-[11px] font-semibold flex items-center justify-center" style={{ background: t.c }}>
                  {t.av}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.n}</div>
                  <div className="text-[11px] text-muted">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [students, setStudents] = useState("20–49 students");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first || !last || !school || !email) {
      setError("Please fill in your name, school, and email");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "school_demo",
          firstName: first, lastName: last, school, email, phone, students, city, message,
        }),
      });
      const j = await res.json();
      if (j.success) {
        setSubmitted(true);
      } else {
        setError(j.error ?? "Something went wrong. Please email support@eduyro.com.");
      }
    } catch {
      setError("Couldn't send your request. Please email support@eduyro.com.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="bg-ink text-cream py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-3">Get in touch</div>
          <h2 className="font-serif text-4xl font-bold leading-tight mb-3">Let's set up your school.</h2>
          <p className="text-cream/60 max-w-md leading-relaxed">
            We'll walk you through the platform, import your first roster, and have you printing within 24 hours.
          </p>
          <div className="space-y-3 mt-8 text-sm">
            {[
              ["📞", "We'll call you within one business day"],
              ["🖥", "Free 30-minute demo of the admin panel"],
              ["📋", "Free 30-day pilot for schools with 20+ students"],
              ["🗂", "We'll help import your roster and run placement tests"],
              ["💰", "Pricing locked in for 12 months"],
            ].map(([ic, t]) => (
              <div key={t} className="flex items-start gap-3 text-cream/70">
                <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-sm flex-shrink-0">{ic}</div>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {submitted ? (
          <div className="bg-white/6 border border-white/12 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="font-serif text-xl font-bold mb-2">Request received!</div>
            <p className="text-sm text-cream/60 leading-relaxed">
              Thanks — we'll call you within one business day to set up your free demo and 30-day pilot.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/6 border border-white/12 rounded-2xl p-7">
            <div className="font-serif text-lg font-bold mb-1">Request a demo</div>
            <div className="text-xs text-cream/50 mb-5">We'll reach out within 24 hours.</div>

            {error && (
              <div className="bg-brand-red-light/20 border border-brand-red/30 text-[#F5907A] text-xs rounded-md p-2.5 mb-3">
                {error}
              </div>
            )}

            <div className="space-y-3 [&_label]:text-cream/70 [&_label]:text-[11px] [&_input]:bg-white/8 [&_input]:border-white/12 [&_input]:text-cream [&_input]:placeholder:text-cream/30 [&_select]:bg-white/8 [&_select]:border-white/12 [&_select]:text-cream [&_textarea]:bg-white/8 [&_textarea]:border-white/12 [&_textarea]:text-cream [&_textarea]:placeholder:text-cream/30">
              <div className="grid grid-cols-2 gap-2">
                <Input label="First name" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Sunita" required />
                <Input label="Last name" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Patel" required />
              </div>
              <Input label="School / Centre name" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Sunrise Academy" required />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourschool.com" required />
              <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (416) 555-0100" />
              <div className="grid grid-cols-2 gap-2">
                <Select label="Number of students" value={students} onChange={(e) => setStudents(e.target.value)}>
                  <option>20–49 students</option>
                  <option>50–99 students</option>
                  <option>100–199 students</option>
                  <option>200–499 students</option>
                  <option>500+ students</option>
                </Select>
                <Input label="Location" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brampton, ON" />
              </div>
              <Textarea label="Anything else?" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. 3 locations, need centralized management…" />
            </div>

            <Button type="submit" variant="gold" fullWidth className="mt-4" disabled={sending} rightIcon={<span>→</span>}>
              {sending ? "Sending…" : "Send request — we'll call you"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function SchoolsFaqSection() {
  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">Schools FAQ</div>
          <h2 className="font-serif text-4xl font-bold leading-tight">Questions schools ask us.</h2>
        </div>
        <FaqAccordion items={[
          { q: "How quickly can we get started?", a: "Most schools are fully operational within 24 hours. Process: 30-minute call → import your roster via CSV → students take placement tests → first bulk PDF export. We handle setup and walk you through every step." },
          { q: "Do students need their own devices?", a: "No. The platform is designed to work entirely on paper — you print worksheets and students complete them by hand. Students can also solve online if you prefer, but print is primary and doesn't require any student device." },
          { q: "Can we use our own curriculum alongside Eduyro?", a: "Yes. The curriculum builder lets you create custom levels, add your own question types, and blend with the Eduyro base curriculum. Schools often layer BrightSteps as daily fluency drill alongside their main teaching." },
          { q: "How does the bulk PDF export work?", a: "Every morning, open Admin Panel → 'Bulk Export → Today's packets' → 30 seconds later you have a .zip with one PDF per student, auto-named (e.g. KaiLiu_3A_Day18.pdf), ready to print. Can also be scheduled to run automatically at 6am daily." },
          { q: "What is the 30-day free pilot?", a: "Any school with 20+ students gets a free 30-day pilot with full access — no payment required. After 30 days, you decide if it's working. Sign up and your pricing locks in for 12 months. No obligations." },
          { q: "Is there a minimum student count?", a: "School licenses start at 20 students. Smaller centres (under 20) use individual Premium plans at $19/student/month, which still includes the admin panel for managing up to 19 students." },
        ]} />
      </div>
    </section>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
