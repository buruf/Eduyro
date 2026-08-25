// src/components/layout/index.tsx
"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Avatar } from "../ui";

// ─────────────────────────────────────────────────────────────
// Brand logo
// ─────────────────────────────────────────────────────────────

export function BrandLogo({
  size = "md", inverted, withText = true, className,
}: { size?: "sm" | "md" | "lg"; inverted?: boolean; withText?: boolean; className?: string }) {
  const sizeMap = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const iconSize = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };
  const textSize = { sm: "text-base", md: "text-lg", lg: "text-2xl" };

  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center rounded-lg", sizeMap[size], inverted ? "bg-gold" : "bg-ink")}>
        <svg viewBox="0 0 18 18" className={cn(iconSize[size], inverted ? "fill-ink" : "fill-gold-mid")}>
          <path d="M9 1L1.5 6.5V17H6.5V12H11.5V17H16.5V6.5L9 1Z" />
        </svg>
      </div>
      {withText && (
        <span className={cn("font-serif font-semibold tracking-tight", textSize[size], inverted ? "text-cream" : "text-ink")}>
          Edu<span className={inverted ? "text-gold-mid" : "text-gold"}>yro</span>
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Public Navbar
// ─────────────────────────────────────────────────────────────

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <BrandLogo />
        <div className="hidden md:flex items-center gap-8 text-sm text-muted">
          <Link href="/#how-it-works" className="hover:text-ink transition-colors">How it works</Link>
          <Link href="/#curriculum" className="hover:text-ink transition-colors">Curriculum</Link>
          <Link href="/lessons" className="hover:text-ink transition-colors">Lesson videos</Link>
          <Link href="/shop" className="hover:text-ink transition-colors">Shop workbooks</Link>
          <Link href="/#pricing" className="hover:text-ink transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-ink transition-colors">FAQ</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/signin" className="text-sm text-ink hover:text-gold transition-colors">Sign in</Link>
          <Link href="/placement" className="bg-ink text-cream text-sm px-4 py-2 rounded-md hover:bg-ink-soft transition-colors">
            Free placement test →
          </Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-ink" aria-label="Toggle menu">
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border p-4 space-y-3">
          <Link href="/#how-it-works" className="block text-sm text-muted">How it works</Link>
          <Link href="/#curriculum" className="block text-sm text-muted">Curriculum</Link>
          <Link href="/lessons" className="block text-sm text-muted">Lesson videos</Link>
          <Link href="/shop" className="block text-sm text-muted">Shop workbooks</Link>
          <Link href="/#pricing" className="block text-sm text-muted">Pricing</Link>
          <Link href="/#faq" className="block text-sm text-muted">FAQ</Link>
          <Link href="/signin" className="block text-sm text-ink">Sign in</Link>
          <Link href="/placement" className="block text-sm text-ink font-medium">Free placement test →</Link>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

export function PublicFooter() {
  return (
    <footer className="bg-ink text-cream/50 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <BrandLogo inverted />
            <p className="text-sm mt-4 max-w-xs leading-relaxed">
              Mastery-based education for every student. Print-first. Daily worksheets that work.
            </p>
          </div>
          <FooterColumn
            title="Platform"
            links={[
              { label: "Home", href: "/" },
              { label: "How it works", href: "/#how-it-works" },
              { label: "Curriculum", href: "/#curriculum" },
              { label: "Lesson videos", href: "/lessons" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Shop", href: "/shop" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { label: "About", href: "/about" },
              { label: "Terms", href: "/terms" },
              { label: "Privacy", href: "/privacy" },
              { label: "Accessibility", href: "/accessibility" },
            ]}
          />
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between text-xs">
          <span>© 2026 Eduyro Education Inc.</span>
          <div className="flex gap-6 mt-2 md:mt-0">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:support@eduyro.com">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h5 className="text-cream/90 text-xs font-semibold uppercase tracking-wider mb-4">{title}</h5>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm hover:text-gold-mid transition-colors">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard Sidebar
// Sign out is NOT in the sidebar — it's in the topbar.
// ─────────────────────────────────────────────────────────────

export interface SidebarItem {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
}

export function DashboardSidebar({
  items, user, roleBadge, footerContent, topContent,
}: {
  items: SidebarItem[];
  user: { name: string; subtitle: string; image?: string };
  roleBadge?: string;
  footerContent?: ReactNode;
  /** Rendered directly under the user block, ABOVE the nav items — e.g. the
      parent dashboard's child switcher. */
  topContent?: ReactNode;
}) {
  return (
    <aside className="bg-ink text-cream w-56 min-h-screen flex flex-col">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <BrandLogo inverted size="sm" />
          {roleBadge && (
            <span className="text-[9px] uppercase tracking-wider font-semibold bg-gold/20 text-gold-mid px-1.5 py-0.5 rounded">
              {roleBadge}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <Avatar name={user.name} src={user.image} size="md" />
        <div className="min-w-0">
          <div className="text-sm text-cream font-medium truncate">{user.name}</div>
          <div className="text-[11px] text-cream/45 truncate">{user.subtitle}</div>
        </div>
      </div>

      {topContent && <div className="px-3 py-3 border-b border-white/10">{topContent}</div>}

      <nav className="px-3 py-3 flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              item.active
                ? "bg-gold/15 text-gold-mid"
                : "text-cream/55 hover:text-cream hover:bg-white/5"
            )}
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {footerContent && <div className="p-3 border-t border-white/10">{footerContent}</div>}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard Topbar
// Sign out button is clearly visible in the top-right area.
// ─────────────────────────────────────────────────────────────

export function DashboardTopbar({
  title, subtitle, action, notificationCount = 0,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  notificationCount?: number;
}) {
  return (
    <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="font-serif text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {/* Notification bell */}
        <button className="relative w-9 h-9 border border-border rounded-lg flex items-center justify-center hover:bg-cream-dark transition-colors">
          🔔
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-white" />
          )}
        </button>
        {/* Sign out — always visible in top-right */}
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="h-9 px-3 border border-border rounded-lg text-xs text-muted hover:text-ink hover:bg-cream-dark transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
