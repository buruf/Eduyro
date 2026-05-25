// tests/integration/shop-catalog.test.ts
// Tests the GET /api/shop/catalog endpoint — public, no auth, no DB calls.

import { GET } from "@/app/api/shop/catalog/route";

function makeRequest(): any {
  return {
    url: "http://localhost:3000/api/shop/catalog",
    method: "GET",
    headers: new Map(),
  } as any;
}

describe("GET /api/shop/catalog", () => {
  it("returns 200 with skill catalog", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("includes all 4 skills", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const skillIds = body.data.skills.map((s: any) => s.id);
    expect(skillIds).toContain("ADDITION");
    expect(skillIds).toContain("SUBTRACTION");
    expect(skillIds).toContain("MULTIPLICATION");
    expect(skillIds).toContain("DIVISION");
  });

  it("each skill has required fields", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    for (const skill of body.data.skills) {
      expect(skill.id).toBeTruthy();
      expect(skill.label).toBeTruthy();
      expect(skill.description).toBeTruthy();
      expect(skill.iconEmoji).toBeTruthy();
      expect(skill.totalSheets).toBeGreaterThan(0);
      expect(skill.estimatedProblems).toBeGreaterThan(0);
      expect(Array.isArray(skill.bands)).toBe(true);
      expect(skill.bands.length).toBeGreaterThan(0);
    }
  });

  it("each band has problemCount in its data", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    for (const skill of body.data.skills) {
      for (const band of skill.bands) {
        expect(band.problemCount).toBeGreaterThan(0);
        expect(band.sheetCount).toBeGreaterThan(0);
        expect(["easy", "standard", "challenging"]).toContain(band.difficulty);
      }
    }
  });

  it("returns pricing tiers for 1-4 skills", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.data.pricing).toHaveLength(4);
    const counts = body.data.pricing.map((p: any) => p.skillCount).sort();
    expect(counts).toEqual([1, 2, 3, 4]);
  });

  it("pricing has correct labels", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const findLabel = (n: number) => body.data.pricing.find((p: any) => p.skillCount === n)?.label;
    expect(findLabel(1)).toBe("$3.99");
    expect(findLabel(2)).toBe("$5.99");
    expect(findLabel(3)).toBe("$7.99");
    expect(findLabel(4)).toBe("$9.99");
  });

  it("estimated problems matches the sum of band counts", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    for (const skill of body.data.skills) {
      const expected = skill.bands.reduce(
        (sum: number, b: any) => sum + b.sheetCount * b.problemCount,
        0
      );
      expect(skill.estimatedProblems).toBe(expected);
    }
  });
});
