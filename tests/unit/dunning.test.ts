// tests/unit/dunning.test.ts
// Unit tests for the dunning sequence stage structure.
// The processDunningEmails function involves DB queries and is covered in
// Layer 2 (integration tests).

import { DUNNING_STAGES } from "@/lib/dunning";

describe("Dunning sequence", () => {
  describe("DUNNING_STAGES", () => {
    it("has at least 3 stages (graduated escalation)", () => {
      expect(DUNNING_STAGES.length).toBeGreaterThanOrEqual(3);
    });

    it("stages are ordered by day ascending", () => {
      for (let i = 1; i < DUNNING_STAGES.length; i++) {
        expect(DUNNING_STAGES[i].day).toBeGreaterThan(DUNNING_STAGES[i - 1].day);
      }
    });

    it("each stage has a unique day", () => {
      const days = DUNNING_STAGES.map((s) => s.day);
      expect(new Set(days).size).toBe(days.length);
    });

    it("each stage has a unique label", () => {
      const labels = DUNNING_STAGES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("each stage has a non-empty email subject", () => {
      for (const stage of DUNNING_STAGES) {
        expect(stage.subject).toBeTruthy();
        expect(stage.subject.length).toBeGreaterThan(5);
      }
    });

    it("first stage is gentle (day 1)", () => {
      expect(DUNNING_STAGES[0].day).toBe(1);
      expect(DUNNING_STAGES[0].label).toContain("soft");
    });

    it("last stage is the final warning (close to downgrade)", () => {
      const last = DUNNING_STAGES[DUNNING_STAGES.length - 1];
      expect(last.label).toMatch(/final|warning|last/);
      expect(last.day).toBeGreaterThanOrEqual(5);
    });

    it("respects a sensible total window (under 14 days)", () => {
      const last = DUNNING_STAGES[DUNNING_STAGES.length - 1];
      expect(last.day).toBeLessThanOrEqual(14);
    });
  });
});
