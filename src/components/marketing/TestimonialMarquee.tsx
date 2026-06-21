// src/components/marketing/TestimonialMarquee.tsx
// Infinite scroll marquee of testimonials — more dynamic than static cards
"use client";

const TESTIMONIALS = [
  { q: "My daughter went from Level M3 to M5 in two months. The daily routine became as automatic as brushing her teeth.", name: "Maria R.", role: "Homeschool parent · Ontario", color: "#1B4F8A", av: "MR" },
  { q: "We pulled both kids from Kumon and switched to Eduyro. Same methodology, a fraction of the cost, and far better transparency.", name: "David K.", role: "Parent of two · Toronto", color: "#2D6A3F", av: "DK" },
  { q: "My son went from hating math to asking for his sheets every morning. Honestly didn't think it was possible.", name: "Sunita P.", role: "Parent · Brampton", color: "#C8902A", av: "SP" },
  { q: "The placement test alone was worth it. I finally understand where my child actually is, not where the school says he should be.", name: "James O.", role: "Parent · Mississauga", color: "#8A3F9F", av: "JO" },
  { q: "After 3 weeks of daily sheets, her teacher commented that she seemed like a completely different student in math.", name: "Priya N.", role: "Parent of one · Scarborough", color: "#1B4F8A", av: "PN" },
  { q: "I was paying $160/month for Kumon. Eduyro does the same thing for $9.99. I genuinely don't understand why more parents don't know about this.", name: "Ahmad S.", role: "Parent · Etobicoke", color: "#2D6A3F", av: "AS" },
];

function Card({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div className="flex-shrink-0 w-80 bg-white border border-border rounded-2xl p-6 mx-3">
      <div className="flex gap-0.5 mb-3">
        {[1,2,3,4,5].map(s => (
          <svg key={s} viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-gold">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <p className="font-serif italic font-light text-sm leading-relaxed mb-4 text-ink">&ldquo;{t.q}&rdquo;</p>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: t.color }}>
          {t.av}
        </div>
        <div>
          <div className="text-xs font-semibold text-ink">{t.name}</div>
          <div className="text-[10px] text-muted">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialMarquee() {
  // Double the array for seamless loop
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-20 bg-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold mb-3">What parents say</div>
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-4xl font-bold leading-tight">Real stories.<br />Real progress.</h2>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted font-sans">
            <div className="flex -space-x-1">
              {["#1B4F8A","#2D6A3F","#C8902A"].map(c => (
                <div key={c} className="w-6 h-6 rounded-full border-2 border-cream-dark" style={{ background: c }} />
              ))}
            </div>
            <span>Verified parent reviews</span>
          </div>
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #F5F0E8, transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(-90deg, #F5F0E8, transparent)" }} />

        <div
          className="flex"
          style={{
            animation: "marquee 40s linear infinite",
            width: "max-content",
          }}
        >
          {items.map((t, i) => <Card key={i} t={t} />)}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .flex[style*="marquee"] { animation: none; }
        }
      `}</style>
    </section>
  );
}
