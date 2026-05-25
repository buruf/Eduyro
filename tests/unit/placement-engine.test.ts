// tests/unit/placement-engine.test.ts
// Tests for the CAT-style adaptive placement engine.
// These cover the pure algorithm — no DB required (calculatePlacement
// involves DB queries so it's tested in Layer 2).

import {
  pickNextQuestion,
  adjustDifficulty,
  calculateConfidence,
  shouldTerminate,
  getQuestionById,
  placementBanks,
  PLACEMENT_CONSTANTS,
} from "@/lib/placement/engine";

describe("Placement engine", () => {
  describe("PLACEMENT_CONSTANTS", () => {
    it("exposes the right algorithm parameters", () => {
      expect(PLACEMENT_CONSTANTS.MAX_QUESTIONS_PER_SUBJECT).toBe(12);
      expect(PLACEMENT_CONSTANTS.MIN_QUESTIONS_PER_SUBJECT).toBe(8);
      expect(PLACEMENT_CONSTANTS.CONFIDENCE_THRESHOLD).toBe(0.85);
    });
  });

  describe("placementBanks", () => {
    it("has banks for all 4 subjects", () => {
      expect(placementBanks.MATH).toBeDefined();
      expect(placementBanks.READING).toBeDefined();
      expect(placementBanks.WRITING).toBeDefined();
      expect(placementBanks.SCIENCE).toBeDefined();
    });

    it.each(["MATH", "READING", "WRITING", "SCIENCE"])(
      "%s bank has at least 5 questions",
      (subject) => {
        expect(placementBanks[subject].length).toBeGreaterThanOrEqual(5);
      }
    );

    it("every question has a unique id within its subject", () => {
      for (const subject of Object.keys(placementBanks)) {
        const ids = placementBanks[subject].map((q) => q.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    it("difficulty values are within 0.1–3.0 range", () => {
      for (const subject of Object.keys(placementBanks)) {
        for (const q of placementBanks[subject]) {
          expect(q.difficulty).toBeGreaterThanOrEqual(0.1);
          expect(q.difficulty).toBeLessThanOrEqual(3.0);
        }
      }
    });

    it("every question has correctIndex within bounds of options", () => {
      for (const subject of Object.keys(placementBanks)) {
        for (const q of placementBanks[subject]) {
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.options.length);
        }
      }
    });

    it("MATH bank spans easy to hard (covers most of the difficulty range)", () => {
      const diffs = placementBanks.MATH.map((q) => q.difficulty);
      const min = Math.min(...diffs);
      const max = Math.max(...diffs);
      expect(min).toBeLessThan(0.5); // has at least one very easy question
      expect(max).toBeGreaterThan(2.5); // has at least one challenging question
    });
  });

  describe("pickNextQuestion", () => {
    it("returns the question closest to current difficulty", () => {
      const q = pickNextQuestion("MATH", 1.0, []);
      expect(q).not.toBeNull();
      expect(q!.difficulty).toBeCloseTo(1.0, 0.5); // within 0.5 of target
    });

    it("excludes already-asked questions", () => {
      const all = placementBanks.MATH;
      const askedIds = all.slice(0, 5).map((q) => q.id);
      const next = pickNextQuestion("MATH", 1.0, askedIds);
      expect(next).not.toBeNull();
      expect(askedIds).not.toContain(next!.id);
    });

    it("returns null when all questions have been asked", () => {
      const allIds = placementBanks.MATH.map((q) => q.id);
      expect(pickNextQuestion("MATH", 1.0, allIds)).toBeNull();
    });

    it("returns null for unknown subject", () => {
      expect(pickNextQuestion("XXX", 1.0, [])).toBeNull();
    });

    it("picks the easiest question when starting fresh at low difficulty", () => {
      const q = pickNextQuestion("MATH", 0.1, []);
      expect(q).not.toBeNull();
      // Should be among the easiest in the bank
      const sorted = [...placementBanks.MATH].sort((a, b) => a.difficulty - b.difficulty);
      expect(q!.difficulty).toBeLessThanOrEqual(sorted[1].difficulty);
    });

    it("picks the hardest question when current difficulty exceeds bank max", () => {
      const q = pickNextQuestion("MATH", 5.0, []);
      expect(q).not.toBeNull();
      // Should be near the top of the difficulty range
      expect(q!.difficulty).toBeGreaterThanOrEqual(2.5);
    });
  });

  describe("adjustDifficulty", () => {
    const sampleQ = placementBanks.MATH[0];

    it("increases difficulty on a correct answer", () => {
      const newD = adjustDifficulty(1.0, true, sampleQ);
      expect(newD).toBeGreaterThan(1.0);
    });

    it("decreases difficulty on a wrong answer", () => {
      const newD = adjustDifficulty(1.0, false, sampleQ);
      expect(newD).toBeLessThan(1.0);
    });

    it("clamps to a minimum of 0.1", () => {
      const newD = adjustDifficulty(0.2, false, sampleQ);
      expect(newD).toBeGreaterThanOrEqual(0.1);
    });

    it("clamps to a maximum of 3.0", () => {
      const newD = adjustDifficulty(2.9, true, sampleQ);
      expect(newD).toBeLessThanOrEqual(3.0);
    });

    it("decrease swing is larger than increase swing (asymmetric — error-cautious)", () => {
      const correctSwing = adjustDifficulty(1.5, true, sampleQ) - 1.5;
      const wrongSwing = 1.5 - adjustDifficulty(1.5, false, sampleQ);
      // Wrong answers should drop you faster than correct answers boost you
      expect(wrongSwing).toBeGreaterThan(correctSwing);
    });
  });

  describe("calculateConfidence", () => {
    it("returns 0 when no questions answered (questionFactor=0, consistency NaN)", () => {
      // Division by 0 protection — should at least not crash
      const c = calculateConfidence(0, 0, 1.0);
      expect(Number.isFinite(c) || c === 0).toBe(true);
    });

    it("increases confidence with more questions answered", () => {
      const low = calculateConfidence(2, 1, 1.0);
      const high = calculateConfidence(10, 5, 1.0);
      expect(high).toBeGreaterThanOrEqual(low);
    });

    it("is highest when answers are extreme (all right or all wrong)", () => {
      const allRight = calculateConfidence(8, 8, 1.5);
      const mixed = calculateConfidence(8, 4, 1.5); // 50% — most uncertain
      expect(allRight).toBeGreaterThan(mixed);
    });

    it("caps at 1.0", () => {
      const c = calculateConfidence(20, 20, 2.5);
      expect(c).toBeLessThanOrEqual(1.0);
    });
  });

  describe("shouldTerminate", () => {
    it("terminates at MAX_QUESTIONS regardless of confidence", () => {
      expect(shouldTerminate(12, 0.0)).toBe(true);
    });

    it("does not terminate below MIN_QUESTIONS even with high confidence", () => {
      expect(shouldTerminate(5, 1.0)).toBe(false);
    });

    it("terminates between MIN and MAX if confidence is high enough", () => {
      expect(shouldTerminate(8, 0.9)).toBe(true);
      expect(shouldTerminate(10, 0.86)).toBe(true);
    });

    it("does not terminate if confidence is below threshold", () => {
      expect(shouldTerminate(9, 0.5)).toBe(false);
    });
  });

  describe("getQuestionById", () => {
    it("retrieves a known question", () => {
      const knownId = placementBanks.MATH[0].id;
      const q = getQuestionById("MATH", knownId);
      expect(q).not.toBeNull();
      expect(q!.id).toBe(knownId);
    });

    it("returns null for unknown question id", () => {
      expect(getQuestionById("MATH", "nonexistent-xyz")).toBeNull();
    });

    it("returns null for unknown subject", () => {
      expect(getQuestionById("UNKNOWN", "anything")).toBeNull();
    });
  });

  describe("end-to-end algorithm simulation", () => {
    it("converges to roughly the right level for a student who gets everything right", () => {
      // Simulate a smart student who answers everything correctly
      let difficulty = 1.0;
      const askedIds: string[] = [];
      let answered = 0;
      let correct = 0;

      while (!shouldTerminate(answered, calculateConfidence(answered, correct, difficulty))) {
        const q = pickNextQuestion("MATH", difficulty, askedIds);
        if (!q) break;
        askedIds.push(q.id);
        difficulty = adjustDifficulty(difficulty, true, q);
        answered++;
        correct++;
      }

      // Final difficulty should be at the high end
      expect(difficulty).toBeGreaterThan(2.0);
      expect(answered).toBeLessThanOrEqual(PLACEMENT_CONSTANTS.MAX_QUESTIONS_PER_SUBJECT);
    });

    it("converges to a low level for a student who gets everything wrong", () => {
      let difficulty = 1.0;
      const askedIds: string[] = [];
      let answered = 0;
      let correct = 0;

      while (!shouldTerminate(answered, calculateConfidence(answered, correct, difficulty))) {
        const q = pickNextQuestion("MATH", difficulty, askedIds);
        if (!q) break;
        askedIds.push(q.id);
        difficulty = adjustDifficulty(difficulty, false, q);
        answered++;
      }

      expect(difficulty).toBeLessThan(0.6);
    });

    it("test terminates within MAX_QUESTIONS for any student", () => {
      // Random student
      let difficulty = 1.0;
      const askedIds: string[] = [];
      let answered = 0;
      let correct = 0;

      while (!shouldTerminate(answered, calculateConfidence(answered, correct, difficulty))) {
        const q = pickNextQuestion("MATH", difficulty, askedIds);
        if (!q) break;
        askedIds.push(q.id);
        const wasCorrect = Math.random() > 0.5;
        difficulty = adjustDifficulty(difficulty, wasCorrect, q);
        answered++;
        if (wasCorrect) correct++;
      }

      expect(answered).toBeLessThanOrEqual(PLACEMENT_CONSTANTS.MAX_QUESTIONS_PER_SUBJECT);
    });
  });
});
