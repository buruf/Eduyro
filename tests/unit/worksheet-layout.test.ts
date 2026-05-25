// tests/unit/worksheet-layout.test.ts
// Verifies the auto-scaling layout picks reasonable column/font choices
// for different problem counts. The goal: every count fits on one page.

import { getLayoutForCount, isOverflowRisk } from "@/lib/worksheet/layout";

describe("getLayoutForCount", () => {
  it("uses 1 column for very small worksheets", () => {
    const l = getLayoutForCount(5);
    expect(l.columns).toBe(1);
  });

  it("uses 2 columns for standard 20-problem sheets", () => {
    const l = getLayoutForCount(20);
    expect(l.columns).toBe(2);
  });

  it("uses 3 columns for ~40-problem sheets", () => {
    const l = getLayoutForCount(40);
    expect(l.columns).toBe(3);
  });

  it("uses 4 columns for 50-problem sheets", () => {
    const l = getLayoutForCount(50);
    expect(l.columns).toBe(4);
  });

  it("uses 5 columns for very dense sheets", () => {
    const l = getLayoutForCount(100);
    expect(l.columns).toBe(5);
  });

  it("font size never increases as count grows", () => {
    const counts = [5, 10, 20, 25, 32, 40, 50, 60, 100, 120, 150];
    let prevSize = Infinity;
    for (const c of counts) {
      const l = getLayoutForCount(c);
      const size = parseInt(l.fontSize);
      expect(size).toBeLessThanOrEqual(prevSize);
      prevSize = size;
    }
  });

  it("disables borders only at extreme densities", () => {
    expect(getLayoutForCount(50).showBorders).toBe(true);
    expect(getLayoutForCount(120).showBorders).toBe(false);
  });

  it("handles edge counts cleanly", () => {
    // 0 isn't a valid use case, but shouldn't crash
    const l = getLayoutForCount(0);
    expect(l.columns).toBeGreaterThanOrEqual(1);

    // 200 is the API cap
    const l2 = getLayoutForCount(200);
    expect(l2.columns).toBe(5);
    expect(l2.showBorders).toBe(false);
  });

  it("the 50-problem case (your reported overflow case) uses 4 columns and 9pt", () => {
    const l = getLayoutForCount(50);
    expect(l.columns).toBe(4);
    expect(l.fontSize).toBe("9pt");
  });
});

describe("isOverflowRisk", () => {
  it("returns false for counts that comfortably fit", () => {
    expect(isOverflowRisk(50)).toBe(false);
    expect(isOverflowRisk(100)).toBe(false);
    expect(isOverflowRisk(120)).toBe(false);
  });

  it("returns true past the densest comfortable count", () => {
    expect(isOverflowRisk(121)).toBe(true);
    expect(isOverflowRisk(200)).toBe(true);
  });
});
