// src/app/error.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <nav className="border-b border-border bg-cream/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <BrandLogo />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="font-serif text-7xl font-bold text-brand-red mb-3">500</div>
          <h1 className="font-serif text-3xl font-bold mb-3">Something broke.</h1>
          <p className="text-muted leading-relaxed mb-2">
            We've logged the error and our team is on it. Please try again — and if it keeps happening, email{" "}
            <a href="mailto:support@eduyro.com" className="text-brand-blue underline">support@eduyro.com</a>.
          </p>
          {error.digest && (
            <p className="text-xs text-muted/60 font-mono mb-6">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={reset}>Try again</Button>
            <Link href="/"><Button variant="secondary">Back home</Button></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
