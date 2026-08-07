// DEV-ONLY harness for eyeballing the mul-tens pilot tutorial without a
// student session. 404s in production. Logging posts will 401 (fake student) —
// the hook is fire-and-forget, so the UI flow is unaffected.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import MulTensPilotTutorial from "@/components/tutorial/pilot/MulTensPilotTutorial";

export default function PilotTutorialDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [status, setStatus] = useState("running");
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen bg-cream-dark p-4">
      <div className="mb-2 flex items-center gap-3 text-sm">
        <span>dev harness — status: <b>{status}</b></span>
        <button className="border rounded px-2 py-1" onClick={() => { setStatus("running"); setKey((k) => k + 1); }}>restart</button>
      </div>
      {status === "running" && (
        <MulTensPilotTutorial
          key={key}
          open
          studentId="dev-fake-student"
          onStart={() => setStatus("onStart called (→ practice)")}
          onClose={() => setStatus("onClose called")}
        />
      )}
    </div>
  );
}
