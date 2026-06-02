// src/components/GdprBanner.tsx
// GDPR-compliant cookie consent banner.
// Shows for EU/EEA visitors, stores consent in localStorage.
// Minimal — only two choices: Accept or Manage (decline non-essential).
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "eduyro_cookie_consent";
const CONSENT_VERSION = "1"; // bump to re-show banner after policy changes

type ConsentState = "accepted" | "declined" | null;

export function GdprBanner() {
  const [show, setShow]       = useState(false);
  const [consent, setConsent] = useState<ConsentState>(null);

  useEffect(() => {
    // Only show if no consent recorded or version changed
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) { setShow(true); return; }
      const parsed = JSON.parse(stored);
      if (parsed.version !== CONSENT_VERSION) { setShow(true); return; }
      setConsent(parsed.consent);
    } catch {
      setShow(true);
    }
  }, []);

  const save = (value: ConsentState) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ consent: value, version: CONSENT_VERSION }));
    } catch {}
    setConsent(value);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-ink text-cream rounded-2xl shadow-elev border border-white/10 p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Cookie icon */}
        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gold">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-sm text-cream/90 leading-relaxed">
            We use essential cookies to keep you signed in and remember your preferences.
            We do not use advertising or tracking cookies.{" "}
            <Link href="/privacy" className="text-gold-mid underline underline-offset-2 hover:text-gold transition-colors">
              Privacy policy
            </Link>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => save("declined")}
            className="text-xs text-cream/50 hover:text-cream transition-colors font-sans px-3 py-1.5"
          >
            Essential only
          </button>
          <button
            onClick={() => save("accepted")}
            className="bg-gold text-ink text-xs font-bold px-5 py-2 rounded-lg hover:bg-gold-mid transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
