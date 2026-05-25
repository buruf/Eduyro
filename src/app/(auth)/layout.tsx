// src/app/(auth)/layout.tsx
import Link from "next/link";
import { BrandLogo } from "@/components/layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col bg-ink text-cream p-10 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <BrandLogo inverted />
          <Link href="/" className="text-xs text-cream/45 hover:text-cream/80 transition-colors">
            ← Back to home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center py-12 max-w-md">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-mid mb-3">
            Welcome back
          </div>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold leading-[1.05] tracking-tight">
            Every day is a<br />
            <em className="italic font-light text-gold-mid">step forward.</em>
          </h2>
          <p className="text-cream/60 mt-6 leading-relaxed max-w-sm">
            Eduyro gives every student a personalized path through mastery — one worksheet at a time. Join 12,000+ students already on the ladder.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10">
            <Stat value="23" label="Curriculum levels" />
            <Stat value="12,400+" label="Worksheets" />
            <Stat value="95%" label="Mastery threshold" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 max-w-md">
          <p className="font-serif italic font-light text-cream/85 leading-relaxed mb-3 text-sm">
            "My daughter went from Level M3 to Level M5 in two months. The daily routine made all the difference — it became as automatic as brushing her teeth."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-green text-white text-[10px] font-semibold flex items-center justify-center">
              MR
            </div>
            <div>
              <div className="text-xs text-cream/75">Maria Robinson</div>
              <div className="text-[10px] text-cream/40">Homeschool parent · Ontario</div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gold/5 border border-gold/10 pointer-events-none" />
        <div className="absolute -right-40 bottom-20 w-56 h-56 rounded-full bg-brand-blue/8 border border-brand-blue/15 pointer-events-none" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-cream-dark">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <BrandLogo />
            <Link href="/" className="text-xs text-muted hover:text-ink transition-colors">
              ← Home
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-2xl font-bold leading-none">{value}</div>
      <div className="text-[10px] text-cream/45 mt-1.5 leading-tight">{label}</div>
    </div>
  );
}
