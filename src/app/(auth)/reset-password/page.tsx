// src/app/(auth)/reset-password/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Missing reset token");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords don't match");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => signOut({ callbackUrl: "/signin?password-reset=1" }), 2000);
    } catch {
      setError("Network error — try again");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-center shadow-card">
        <div className="w-14 h-14 mx-auto bg-brand-green-light rounded-full flex items-center justify-center text-xl mb-3">
          ✅
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">Password updated</h2>
        <p className="text-sm text-muted">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
      <h2 className="font-serif text-2xl font-bold mb-1">Choose a new password</h2>
      <p className="text-sm text-muted mb-5">Pick something strong — at least 8 characters.</p>

      {error && (
        <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Update password
        </Button>
      </form>

      <div className="text-center text-sm text-muted mt-5">
        <Link href="/signin" className="text-brand-blue hover:underline">Cancel</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white border border-border rounded-2xl p-8 text-center text-muted">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
