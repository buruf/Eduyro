// src/app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
      <Link href="/signin" className="text-xs text-muted hover:text-ink transition-colors inline-flex items-center gap-1 mb-5">
        ← Back to sign in
      </Link>
      <h2 className="font-serif text-2xl font-bold mb-1">Reset password</h2>
      <p className="text-sm text-muted mb-5">
        Enter your email and we'll send you a reset link within 2 minutes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Button type="submit" variant="primary" fullWidth loading={loading} rightIcon={<span>→</span>}>
          Send reset link
        </Button>
      </form>

      {sent && (
        <div className="mt-4 bg-brand-green-light border border-brand-green/30 text-brand-green text-sm rounded-lg p-3 text-center">
          ✅ If an account exists, we've sent a reset link.<br />
          <span className="text-xs">Check your inbox (and spam folder).</span>
        </div>
      )}

      <div className="text-center text-sm text-muted mt-6">
        Remembered it?{" "}
        <Link href="/signin" className="text-brand-blue font-medium hover:underline">Sign in</Link>
      </div>
    </div>
  );
}
