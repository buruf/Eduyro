// src/lib/time.ts
// The student's "day" must roll over at LOCAL midnight, not server (UTC)
// midnight. On Vercel, date-fns startOfDay(new Date()) is UTC midnight — which
// is 8:00 p.m. Eastern: a child practising Wednesday at 10:44 p.m. had her work
// counted as THURSDAY, consuming Thursday's quota ("all done for today" the
// next morning, no new sheets). All daily-quota windows use this instead.
//
// APP_TIMEZONE env overrides (IANA name); defaults to America/Toronto — the
// current customer base. Per-student timezones can layer on top later.

export function appDayStart(now: Date = new Date(), studentTz?: string | null): Date {
  const tz = studentTz || process.env.APP_TIMEZONE || "America/Toronto";
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
    // "24" can appear for midnight in some ICU versions — normalise.
    const secsIntoDay = ((+p.hour % 24) * 3600 + +p.minute * 60 + +p.second);
    return new Date(now.getTime() - secsIntoDay * 1000 - now.getMilliseconds());
  } catch {
    // Unknown timezone name → fall back to server-local midnight.
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
