// src/app/coppa/verify/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";

function CoppaVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"review" | "card-entry" | "complete" | "denied">("review");
  const [processing, setProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      setLoading(false);
      return;
    }
    fetch(`/api/coppa/lookup?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setRequest(data.data);
        } else {
          setError(data.error || "Invalid or expired link");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function approve() {
    setProcessing(true);
    try {
      if (request?.consentMethod === "CREDIT_CARD_MICROCHARGE") {
        // Move to card-entry stage; Stripe Elements will be loaded
        setStage("card-entry");
      } else {
        // Other methods route through API directly
        const res = await fetch("/api/coppa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verificationToken: token, approve: true }),
        });
        const data = await res.json();
        if (data.success) {
          setStage("complete");
        } else {
          setError(data.error || "Verification failed");
        }
      }
    } finally {
      setProcessing(false);
    }
  }

  async function deny() {
    if (!confirm("Are you sure? Your child's account will be permanently locked.")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/coppa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken: token,
          approve: false,
          denialReason: "Parent denied via consent page",
        }),
      });
      if ((await res.json()).success) {
        setStage("denied");
      } else {
        setError("Couldn't record denial");
      }
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <CenteredCard><p className="text-muted text-sm">Loading verification request…</p></CenteredCard>;
  }

  if (error || !request) {
    return (
      <CenteredCard>
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-serif text-2xl font-bold mb-2">Link issue</h2>
          <p className="text-muted text-sm mb-6">{error ?? "Verification link is invalid or expired."}</p>
          <Link href="/"><Button variant="primary">Go to homepage</Button></Link>
        </div>
      </CenteredCard>
    );
  }

  if (stage === "complete") {
    return (
      <CenteredCard>
        <div className="text-center">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="font-serif text-2xl font-bold mb-2">Consent verified</h2>
          <p className="text-muted text-sm mb-2">{request.childFirstName}'s BrightSteps account is now active.</p>
          <p className="text-xs text-muted mb-6">A confirmation email has been sent to {request.parentEmail}.</p>
          <Link href="/parent"><Button variant="primary" fullWidth>Open parent dashboard →</Button></Link>
        </div>
      </CenteredCard>
    );
  }

  if (stage === "denied") {
    return (
      <CenteredCard>
        <div className="text-center">
          <div className="text-4xl mb-3">🛑</div>
          <h2 className="font-serif text-2xl font-bold mb-2">Consent denied</h2>
          <p className="text-muted text-sm mb-6">{request.childFirstName}'s account has been locked. No data will be collected.</p>
          <Link href="/"><Button variant="primary">Go to homepage</Button></Link>
        </div>
      </CenteredCard>
    );
  }

  if (stage === "card-entry") {
    return (
      <StripeVerificationStage
        token={token!}
        request={request}
        onComplete={() => setStage("complete")}
        onCancel={() => setStage("review")}
      />
    );
  }

  // review stage
  return (
    <CenteredCard>
      <div className="text-center mb-4">
        <div className="inline-block w-12 h-12 rounded-full bg-gold-light flex items-center justify-center text-2xl mb-3">👨‍👩‍👧</div>
        <h2 className="font-serif text-2xl font-bold leading-tight">Parental consent required</h2>
        <p className="text-xs text-muted mt-1">U.S. federal law (COPPA)</p>
      </div>

      <div className="bg-cream-dark rounded-lg p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted">Child:</span><strong>{request.childFirstName}</strong></div>
        <div className="flex justify-between"><span className="text-muted">Parent:</span><strong>{request.parentFullName}</strong></div>
        <div className="flex justify-between"><span className="text-muted">Email:</span><strong>{request.parentEmail}</strong></div>
        <div className="flex justify-between"><span className="text-muted">Verification:</span><strong>
          {request.consentMethod === "CREDIT_CARD_MICROCHARGE" ? "$0.50 charge (refunded)" : request.consentMethod.replace(/_/g, " ").toLowerCase()}
        </strong></div>
      </div>

      <div className="bg-brand-blue-light/40 border border-brand-blue/20 rounded-lg p-4 mb-4 text-xs leading-relaxed">
        <strong className="block mb-1.5 text-brand-blue">What we collect after consent:</strong>
        First name, age, grade level, and learning progress (worksheet scores, completion times). We do <em>not</em> sell, share, or use this data for advertising. You can revoke consent and delete the account anytime from <Link href="/parent" className="text-brand-blue underline">your parent dashboard</Link>.
      </div>

      <div className="space-y-2">
        <Button variant="green" fullWidth size="lg" loading={processing} onClick={approve}>
          ✓ I consent — continue verification
        </Button>
        <Button variant="secondary" fullWidth onClick={deny} disabled={processing}>
          ✗ Deny consent
        </Button>
      </div>

      <p className="text-[11px] text-muted text-center mt-4 leading-relaxed">
        By approving, you confirm you're {request.childFirstName}'s parent or legal guardian and you've read the{" "}
        <Link href="/privacy" className="text-brand-blue underline">privacy policy</Link>.
      </p>
    </CenteredCard>
  );
}

function StripeVerificationStage({
  token, request, onComplete, onCancel,
}: { token: string; request: any; onComplete: () => void; onCancel: () => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch("/api/coppa/setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationToken: token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setClientSecret(data.data.clientSecret);
          setSetupIntentId(data.data.setupIntentId);
        } else {
          setError(data.error);
        }
      });
  }, [token]);

  // For a real integration, you'd load @stripe/stripe-js + @stripe/react-stripe-js
  // and render <CardElement /> here. To keep this self-contained without adding
  // more deps, we show a placeholder that hands off to a Stripe-hosted page.
  // In production, replace this block with Stripe Elements.
  async function handleFakeStripeConfirm() {
    if (!setupIntentId) return;
    setProcessing(true);
    setError(null);
    try {
      // In real integration, Stripe.js confirms the SetupIntent client-side.
      // We then call /api/coppa/verify which uses the verified payment method
      // to charge $0.50 then refund. For now we just call verify directly.
      const res = await fetch("/api/coppa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken: token,
          setupIntentId,
          approve: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onComplete();
      } else {
        setError(data.error || "Verification failed");
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <CenteredCard>
      <h2 className="font-serif text-2xl font-bold mb-1">Verify your card</h2>
      <p className="text-xs text-muted mb-4">
        We'll charge $0.50 to confirm you own this card, then refund it immediately.
      </p>

      {error && (
        <div className="bg-brand-red-light border border-brand-red/30 text-brand-red text-xs rounded-md p-3 mb-3">
          {error}
        </div>
      )}

      {!clientSecret ? (
        <div className="py-8 text-center text-muted text-sm">Initializing secure payment form…</div>
      ) : (
        <div className="space-y-3">
          <div className="border border-border rounded-md p-4 bg-cream-dark/30 text-xs text-muted text-center">
            <p className="mb-1 font-semibold">Stripe payment form would render here.</p>
            <p>In production, Stripe Elements handles card input client-side. Payment details never touch our servers.</p>
            <code className="block mt-2 text-[10px] break-all opacity-50">setupIntent: {setupIntentId?.slice(0, 24)}…</code>
          </div>
          <Button variant="green" fullWidth size="lg" loading={processing} onClick={handleFakeStripeConfirm}>
            Confirm $0.50 verification charge
          </Button>
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={processing}>
            ← Back
          </Button>
        </div>
      )}
    </CenteredCard>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-dark flex flex-col">
      <nav className="bg-cream border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center">
          <BrandLogo size="sm" />
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Card className="max-w-md w-full" padding="lg">
          {children}
        </Card>
      </div>
    </div>
  );
}

export default function CoppaVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>}>
      <CoppaVerifyContent />
    </Suspense>
  );
}
