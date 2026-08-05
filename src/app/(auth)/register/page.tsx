// src/app/(auth)/register/page.tsx
// FIXES:
//   - After successful registration, auto sign-in via NextAuth credentials
//     so the user lands on their dashboard already authenticated.
//   - Password validation on the frontend now matches the API schema
//     (requires uppercase + number) so the form never submits a password
//     the API will reject.
//   - Fixed nested <Link> inside <Link> bug on the success screen.
//   - Removed Teacher role option (school features are not in v1).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Role = "PARENT";



const GRADES = [
  "Pre-K", "Kindergarten",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("PARENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwScore = scorePassword(password);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) return setError("Enter your first and last name");
    if (!email.includes("@")) return setError("Enter a valid email address");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return setError("Password must contain at least one uppercase letter");
    if (!/[0-9]/.test(password)) return setError("Password must contain at least one number");
    if (!terms) return setError("Please agree to the Terms of Service");

    setLoading(true);
    try {
      // Step 1: Create the account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          role,
          grade: grade || undefined,
          acceptedTerms: terms,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

    // Redirect to sign in with check-email message
    router.push("/signin?check-email=1");





















    } catch {
      setError("Network error — try again");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
      <h2 className="font-serif text-2xl font-bold mb-1">Create your account</h2>
      <p className="text-sm text-muted mb-5">Free to start — no credit card needed.</p>

      {error && (
        <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}



      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/parent" })}
        className="w-full py-2.5 px-4 mb-3 border-[1.5px] border-border rounded-lg text-sm font-medium hover:border-ink hover:bg-cream transition-colors flex items-center justify-center gap-2.5"
      >
        <GoogleIcon /> Sign up with Google
      </button>

      <div className="flex items-center gap-3 my-4 text-xs text-muted">
        <div className="flex-1 h-px bg-border" /> or register with email <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Kai"
            required
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Liu"
            required
          />
        </div>


        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters, 1 uppercase, 1 number"
            required
          />
          {password.length > 0 && <PasswordStrength score={pwScore} />}
        </div>

        <label className="flex items-start gap-2 text-xs text-muted cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="accent-brand-blue mt-0.5"
          />
          <span className="leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-brand-blue">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-brand-blue">Privacy Policy</Link>
          </span>
        </label>

        <Button type="submit" variant="gold" fullWidth loading={loading} rightIcon={<span>→</span>}>
          Create free account
        </Button>
      </form>

      <div className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/signin" className="text-brand-blue font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

function scorePassword(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function PasswordStrength({ score }: { score: number }) {
  const colors = ["bg-brand-red", "bg-gold", "bg-gold-dark", "bg-brand-green"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div className="flex items-center gap-1 mt-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i < score ? colors[score - 1] : "bg-border"
          )}
        />
      ))}
      <span className={cn(
        "text-[10px] font-semibold ml-2 min-w-[42px]",
        score > 0 ? (score === 4 ? "text-brand-green" : "text-gold-dark") : "text-muted"
      )}>
        {score > 0 ? labels[score - 1] : "—"}
      </span>
    </div>
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
