import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/app/(auth)/signin/page.tsx', 'utf8');

// Add checkEmail param and resendEmail state
c = c.replace(
  'const verified = params.get("verified") === "1";',
  `const verified = params.get("verified") === "1";
  const checkEmail = params.get("check-email") === "1";`
);

// Add resend state after loading state
c = c.replace(
  'const [loading, setLoading] = useState(false);',
  `const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);`
);

// Add resend function before handleSignIn
c = c.replace(
  'async function handleSignIn(e: React.FormEvent) {',
  `async function handleResend() {
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

  async function handleSignIn(e: React.FormEvent) {`
);

// Add banners
c = c.replace(
  '{verified && (',
  `{checkEmail && (
        <div className="bg-brand-blue-light border border-brand-blue/30 text-brand-blue text-sm rounded-lg p-3 mb-4 text-center">
          📧 Verification email sent — check your inbox and spam folder before signing in.
        </div>
      )}
      {resendMessage && (
        <div className="bg-brand-green-light border border-brand-green/30 text-brand-green text-sm rounded-lg p-3 mb-4 text-center">
          ✓ {resendMessage}
        </div>
      )}
      {verified && (`
);

// Add resend link after the sign in button
c = c.replace(
  "Don't have an account?",
  `Didn't get the verification email?{" "}
          <button onClick={handleResend} disabled={resendLoading} className="text-brand-blue hover:underline disabled:opacity-50">
            {resendLoading ? "Sending..." : "Resend it"}
          </button>
        </p>
        <p className="text-center text-sm text-muted mt-2">
          Don't have an account?`
);

writeFileSync('src/app/(auth)/signin/page.tsx', c, 'utf8');
console.log('Done');