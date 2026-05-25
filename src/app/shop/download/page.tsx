// src/app/shop/download/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo, PublicFooter } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface DownloadData {
  status: "PENDING" | "PROCESSING" | "COMPLETED";
  message?: string;
  customerEmail?: string;
  skills?: string[];
  amountCents?: number;
  files?: Array<{
    skill: string;
    label: string;
    sheetCount: number;
    fileSizeBytes: number;
    downloadUrl: string;
  }>;
  expiresAt?: string;
  downloadCount?: number;
}

function DownloadInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<DownloadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing download token. Check the link in your email.");
      return;
    }
    fetchData();
  }, [token]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/shop/download?token=${token}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        // If still processing, poll every 5s
        if (result.data.status === "PENDING" || result.data.status === "PROCESSING") {
          if (!polling) {
            setPolling(true);
            setTimeout(fetchData, 5000);
          }
        }
      } else {
        setError(result.error || "Couldn't load purchase details");
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    }
  }

  return (
    <>
      <nav className="bg-cream border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo />
          <Link href="/shop" className="text-xs text-muted hover:text-ink">← Back to shop</Link>
        </div>
      </nav>

      <main className="min-h-screen bg-cream-dark py-12 px-6">
        <div className="max-w-3xl mx-auto">
          {error ? (
            <Card padding="lg">
              <div className="text-center py-6">
                <div className="text-5xl mb-3">⚠️</div>
                <h1 className="font-serif text-2xl font-bold mb-2">{error}</h1>
                <p className="text-muted text-sm mb-6">
                  If you completed a purchase, check your email — we sent download links there.
                  Still stuck? Email <a href="mailto:support@eduyro.com" className="text-brand-blue underline">support@eduyro.com</a> and we'll help.
                </p>
                <Link href="/shop"><Button variant="primary">← Back to shop</Button></Link>
              </div>
            </Card>
          ) : !data ? (
            <Card padding="lg">
              <div className="text-center py-8 text-muted">Loading your purchase…</div>
            </Card>
          ) : data.status === "PENDING" || data.status === "PROCESSING" ? (
            <Card padding="lg">
              <div className="text-center py-6">
                <div className="inline-block w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                <h1 className="font-serif text-2xl font-bold mb-2">Generating your worksheets…</h1>
                <p className="text-muted text-sm mb-1">{data.message ?? "Building your PDFs."}</p>
                <p className="text-xs text-muted/70">This page refreshes automatically. Usually takes 30-60 seconds.</p>
              </div>
            </Card>
          ) : (
            <CompletedView data={data} />
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

function CompletedView({ data }: { data: DownloadData }) {
  const amount = data.amountCents != null ? `$${(data.amountCents / 100).toFixed(2)}` : "";
  const totalSheets = data.files?.reduce((s, f) => s + f.sheetCount, 0) ?? 0;
  const totalProblems = totalSheets * 25;

  return (
    <>
      <Card padding="lg" className="mb-4">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-full bg-brand-green-light items-center justify-center mb-3">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-serif text-3xl font-bold leading-tight mb-2">Your PDFs are ready</h1>
          <p className="text-muted text-sm">
            {amount && <>Paid <strong className="text-ink">{amount}</strong> · </>}
            {data.files?.length} pack{data.files && data.files.length !== 1 ? "s" : ""} · {totalSheets} sheets · {totalProblems.toLocaleString()} problems
          </p>
          {data.customerEmail && (
            <p className="text-[11px] text-muted/70 mt-1">Sent to {data.customerEmail}</p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {data.files?.map((file) => (
            <a
              key={file.skill}
              href={file.downloadUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 border border-border rounded-lg p-3 hover:border-brand-blue transition-colors group"
            >
              <div className="w-10 h-10 rounded-md bg-brand-red-light text-brand-red text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                PDF
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{file.label} Practice Pack</div>
                <div className="text-[11px] text-muted">
                  {file.sheetCount} sheets · {Math.round((file.fileSizeBytes ?? 0) / 1024)} KB · Answer keys included
                </div>
              </div>
              <Button variant="primary" size="sm">
                ↓ Download
              </Button>
            </a>
          ))}
        </div>

        <div className="bg-gold-light border-l-[3px] border-gold rounded-r-md p-3 text-xs text-gold-dark leading-relaxed">
          <strong>Save these PDFs to your computer.</strong> Your download links here work until{" "}
          <strong>{data.expiresAt ? formatDate(data.expiresAt, "PPP") : "30 days from purchase"}</strong>.
          After that, you'll need to email support to retrieve them.
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-sm font-semibold mb-2">What's next?</h3>
        <ul className="space-y-1.5 text-sm text-muted">
          <li>📥 <strong className="text-ink">Save the PDFs</strong> to a folder on your computer or Google Drive.</li>
          <li>🖨 <strong className="text-ink">Print one sheet at a time</strong> and have your child work through them in order.</li>
          <li>📈 <strong className="text-ink">Aim for 1-3 sheets per day</strong> — 10 minutes each. Mastery comes from consistency.</li>
          <li>💡 <strong className="text-ink">Want adaptive practice</strong> with progress tracking? <Link href="/register" className="text-brand-blue underline">Sign up for free</Link> to try the full Eduyro platform.</li>
        </ul>
      </Card>
    </>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>}>
      <DownloadInner />
    </Suspense>
  );
}
