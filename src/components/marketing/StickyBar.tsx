// src/components/marketing/StickyBar.tsx
// Appears after hero scrolls out of view — persistent conversion nudge
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StickyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
      <div className="bg-ink/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-sm font-semibold text-cream">Eduyro</span>
            <div className="h-3 w-px bg-white/20" />
            <span className="text-xs text-cream/50 font-sans hidden sm:block">Kumon-style mastery · $9.99/month</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-xs text-cream/50 hover:text-cream transition-colors font-sans">Sign in</Link>
            <Link href="/placement" className="bg-gold text-ink text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-gold-mid transition-colors">
              Start free trial →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
