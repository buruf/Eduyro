// src/app/shop/cancel/page.tsx
import Link from "next/link";
import { BrandLogo, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";

export default function ShopCancelPage() {
  return (
    <>
      <nav className="bg-cream border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />
          <Link href="/" className="text-xs text-muted hover:text-ink">← Home</Link>
        </div>
      </nav>

      <main className="min-h-[60vh] bg-cream-dark flex items-center justify-center py-12 px-6">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="text-4xl mb-3">🤔</div>
          <h1 className="font-serif text-2xl font-bold mb-2">Checkout cancelled</h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            No worries — you weren't charged. Your selection wasn't saved, but you can pick again whenever you're ready.
          </p>
          <div className="flex gap-2">
            <Link href="/shop" className="flex-1">
              <Button variant="primary" fullWidth>← Back to shop</Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="secondary" fullWidth>Home</Button>
            </Link>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
