"use client";
// Floating "Report a problem" button + modal, mounted on the student and
// parent dashboards. Posts to /api/feedback → triaged in admin Support.
import { useState } from "react";

export function ReportProblemButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("practice");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async () => {
    if (message.trim().length < 5) return;
    setState("sending");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim(), page: window.location.pathname }),
      });
      if (!r.ok) throw new Error();
      setState("sent");
      setTimeout(() => { setOpen(false); setState("idle"); setMessage(""); }, 1600);
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Report a problem"
        className="fixed bottom-4 right-4 z-40 bg-ink text-cream text-xs font-medium px-3.5 py-2 rounded-full shadow-elev hover:bg-ink/85 transition-colors"
      >
        🐞 Report a problem
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-elev" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-bold mb-1">Report a problem</h3>
            <p className="text-xs text-muted mb-3">Tell us what went wrong — we read every report.</p>
            <label className="text-xs font-semibold block mb-1">What is it about?</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-border rounded-md px-2 py-2 text-sm bg-white mb-3">
              <option value="practice">Practice / questions</option>
              <option value="worksheet">Printed worksheet / PDF</option>
              <option value="billing">Account / billing</option>
              <option value="other">Something else</option>
            </select>
            <label className="text-xs font-semibold block mb-1">What happened?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Describe the problem — which question or page, and what you expected…"
              className="w-full border border-border rounded-md px-2 py-2 text-sm resize-y mb-3"
            />
            {state === "error" && <p className="text-xs text-brand-red mb-2">Couldn't send — please try again.</p>}
            {state === "sent" ? (
              <p className="text-sm text-brand-green font-medium">✓ Thank you — report sent!</p>
            ) : (
              <div className="flex gap-2 justify-end">
                <button onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-muted hover:text-ink">Cancel</button>
                <button onClick={submit} disabled={state === "sending" || message.trim().length < 5}
                  className="px-4 py-2 text-sm font-medium bg-ink text-cream rounded-md disabled:opacity-50">
                  {state === "sending" ? "Sending…" : "Send report"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
