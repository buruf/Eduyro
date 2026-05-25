// tests/unit/coppa.test.ts
import { calculateAge, requiresParentalConsent, COPPA_AGE_THRESHOLD } from "@/lib/coppa";

describe("COPPA logic", () => {
  describe("calculateAge", () => {
    it("returns whole years for a clean birthday", () => {
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      expect(calculateAge(fiveYearsAgo)).toBe(5);
    });

    it("returns 0 for someone born this year", () => {
      const today = new Date();
      expect(calculateAge(today)).toBe(0);
    });

    it("handles pre-birthday correctly (one day before birthday this year)", () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setFullYear(tomorrow.getFullYear() - 13);
      // Born tomorrow's date 13 years ago → still 12 today
      expect(calculateAge(tomorrow)).toBe(12);
    });

    it("handles post-birthday correctly (one day after birthday this year)", () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setFullYear(yesterday.getFullYear() - 13);
      // Born yesterday's date 13 years ago → exactly 13 today
      expect(calculateAge(yesterday)).toBe(13);
    });

    it("accepts ISO string", () => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      expect(calculateAge(tenYearsAgo.toISOString())).toBe(10);
    });

    it("calculates ages above 18 correctly", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 25);
      dob.setMonth(dob.getMonth() - 3); // Definitely past this year's birthday
      expect(calculateAge(dob)).toBe(25);
    });
  });

  describe("requiresParentalConsent", () => {
    function dobYearsAgo(years: number, monthOffset = 0): Date {
      const d = new Date();
      d.setFullYear(d.getFullYear() - years);
      d.setMonth(d.getMonth() + monthOffset);
      // Subtract a day to guarantee we're past this year's birthday
      d.setDate(d.getDate() - 1);
      return d;
    }

    it("returns true for a 12-year-old (under 13)", () => {
      expect(requiresParentalConsent(dobYearsAgo(12))).toBe(true);
    });

    it("returns true for a 5-year-old", () => {
      expect(requiresParentalConsent(dobYearsAgo(5))).toBe(true);
    });

    it("returns false for a 13-year-old (at threshold)", () => {
      expect(requiresParentalConsent(dobYearsAgo(13))).toBe(false);
    });

    it("returns false for a 17-year-old", () => {
      expect(requiresParentalConsent(dobYearsAgo(17))).toBe(false);
    });

    it("returns false for an adult", () => {
      expect(requiresParentalConsent(dobYearsAgo(35))).toBe(false);
    });

    it("threshold value is 13 (legal COPPA age)", () => {
      expect(COPPA_AGE_THRESHOLD).toBe(13);
    });
  });
});
