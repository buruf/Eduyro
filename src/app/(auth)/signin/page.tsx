// src/app/(auth)/signin/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "";
  const verified = params.get("verified") === "1";
  const checkEmail = params.get("check-email") === "1";
  const errorParam = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    errorParam === "invalid-token" ? "Invalid verification link" :
    errorParam === "expired-token" ? "Verification link expired" :
    null
  );

  async function handleResend() {
    if (!email) { setError("Enter your email address first"); return; }
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(data.data?.message ?? "Verification email sent.");
    } catch {
      setResendMessage("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Fetch session to get role and redirect to correct dashboard
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;

    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      const destination =
        role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin"
        : role === "PARENT" ? "/parent"
        : "/student";
      router.push(destination);
    }
    router.refresh();
  }

  function handleGoogleSignIn() {
    setLoading(true);
    signIn("google", { callbackUrl: callbackUrl || "/" });
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
      <h2 className="font-serif text-2xl font-bold mb-1">Welcome back</h2>
      <p className="text-sm text-muted mb-6">Sign in to access your worksheets and progress.</p>

      {checkEmail && (
        <div className="bg-brand-blue-light border border-brand-blue/30 text-brand-blue text-sm rounded-lg p-3 mb-4 text-center">
          📧 Verification email sent — check your inbox and spam folder before signing in.
        </div>
      )}
      {resendMessage && (
        <div className="bg-brand-green-light border border-brand-green/30 text-brand-green text-sm rounded-lg p-3 mb-4 text-center">
          ✓ {resendMessage}
        </div>
      )}
      {verified && (
        <div className="bg-brand-green-light border border-brand-green/30 text-brand-green text-sm rounded-lg p-3 mb-4">
          ✓ Email verified — you can now sign in.
        </div>
      )}

      {error && (
        <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full py-2.5 px-4 mb-3 border-[1.5px] border-border rounded-lg text-sm font-medium hover:border-ink hover:bg-cream transition-colors flex items-center justify-center gap-2.5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-5 text-xs text-muted">
        <div className="flex-1 h-px bg-border" />
        or with email
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-ink">Password</label>
            <Link href="/forgot-password" className="text-xs text-brand-blue hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-brand-blue"
          />
          Keep me signed in
        </label>

        <Button type="submit" variant="primary" fullWidth loading={loading} rightIcon={<span>→</span>}>
          Sign in
        </Button>
      </form>

        <p className="text-center text-sm text-muted mt-4">
        Didn't get the verification email?{" "}
          <button onClick={handleResend} disabled={resendLoading} className="text-brand-blue hover:underline disabled:opacity-50">
            {resendLoading ? "Sending..." : "Resend it"}
          </button>
        </p>
        <p className="text-center text-sm text-muted mt-2">
          Don't have an account?{" "}
        <Link href="/register" className="text-brand-blue font-medium hover:underline">
          Create one free
        </Link>
        </p>

        By signing in you agree to our{" "}
        <Link href="/terms" className="text-brand-blue">Terms</Link> and{" "}
        <Link href="/privacy" className="text-brand-blue">Privacy Policy</Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="bg-white border border-border rounded-2xl p-8 text-center text-muted">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
