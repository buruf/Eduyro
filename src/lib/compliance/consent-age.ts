// src/lib/compliance/consent-age.ts
// Worldwide "digital consent age" — the age below which a child cannot consent
// to data processing themselves and verifiable parental/guardian consent is
// required. Eduyro is global, so this is NOT just COPPA (US, 13).
//
// Sources this encodes (technical scaffolding — confirm with counsel before launch):
//   • US   — COPPA, under 13.
//   • EU   — GDPR Art. 8 sets a default of 16 but lets each member state lower it
//            to as low as 13. The per-country values below reflect each state's
//            enacted age (e.g. FR 15, DE 16, ES 14, IE 16, SE 13…).
//   • UK   — UK GDPR / Age Appropriate Design Code, 13.
//   • CA   — PIPEDA has no fixed age; 13 is the common operational threshold.
//   • BR   — LGPD treats under-12 as "children" needing specific parental consent.
//   • Unknown / unlisted country → conservative default of 16.
//
// `country` is an ISO-3166-1 alpha-2 code (e.g. "US", "GB", "FR").

export const DEFAULT_CONSENT_AGE = 16; // conservative GDPR default for unknown jurisdictions

// Per-country enacted digital-consent age. Omitted countries fall back to DEFAULT.
export const DIGITAL_CONSENT_AGE: Record<string, number> = {
  // North America
  US: 13, CA: 13, MX: 13,
  // EU/EEA member states (GDPR Art. 8 national choices)
  AT: 14, BE: 13, BG: 14, HR: 16, CY: 14, CZ: 15, DK: 13, EE: 13,
  FI: 13, FR: 15, DE: 16, GR: 15, HU: 16, IE: 16, IT: 14, LV: 13,
  LT: 14, LU: 16, MT: 13, NL: 16, PL: 16, PT: 13, RO: 16, SK: 16,
  SI: 15, ES: 14, SE: 13, IS: 13, LI: 16, NO: 13,
  // UK
  GB: 13,
  // Rest of world (common operational thresholds)
  AU: 13, NZ: 13, BR: 12, IN: 18, JP: 13, KR: 14, CN: 14, ZA: 18, CH: 16, SG: 13,
};

// The digital consent age for a country (defaults conservatively when unknown).
export function digitalConsentAge(country?: string | null): number {
  if (!country) return DEFAULT_CONSENT_AGE;
  return DIGITAL_CONSENT_AGE[country.toUpperCase()] ?? DEFAULT_CONSENT_AGE;
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// Jurisdiction-aware: does this child need verifiable parental consent?
export function requiresParentalConsent(dateOfBirth: Date | string, country?: string | null): boolean {
  return calculateAge(dateOfBirth) < digitalConsentAge(country);
}
