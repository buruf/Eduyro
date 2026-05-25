// src/app/not-found.tsx
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="border-b border-border bg-cream/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <BrandLogo />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="font-serif text-8xl font-bold text-gold mb-3">404</div>
          <h1 className="font-serif text-3xl font-bold mb-3">Lost your place?</h1>
          <p className="text-muted leading-relaxed mb-8">
            The page you're looking for doesn't exist. Maybe you took a wrong step — but mastery is built one step at a time, so let's get you back on the path.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/"><Button variant="primary">← Back home</Button></Link>
            <Link href="/placement"><Button variant="secondary">Take placement test</Button></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
