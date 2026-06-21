// tests/integration/worksheet-preview.test.ts
import { POST } from "@/app/api/worksheet/preview/route";

function makeRequest(body: any): any {
  return {
    url: "http://localhost:3000/api/worksheet/preview",
    method: "POST",
    headers: new Map([
      ["content-type", "application/json"],
      ["x-forwarded-for", "127.0.0.1"],
    ]),
    json: async () => body,
  } as any;
}

describe("POST /api/worksheet/preview", () => {
  it("generates problems for a valid request", async () => {
    const req = makeRequest({
      subjectSlug: "MATH",
      levelCode: "M5",
      skillName: "×6, ×7, ×8 tables",
      problemCount: 10,
      timeLimitMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // MATH sheets page-fill via the layout-capacity engine (not a fixed count).
    expect(body.data.problems.length).toBeGreaterThan(5);
    expect(body.data.problems.length).toBeLessThanOrEqual(40);
    expect(body.data.answerKey).toHaveLength(body.data.problems.length);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ subjectSlug: "MATH" }));
    expect(res.status).toBe(422);
  });

  it("returns 400 for invalid subject slug", async () => {
    const req = makeRequest({
      subjectSlug: "INVALID",
      levelCode: "M5",
      skillName: "×6, ×7, ×8 tables",
      problemCount: 10,
      timeLimitMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("caps problemCount at 200", async () => {
    const req = makeRequest({
      subjectSlug: "MATH",
      levelCode: "M5",
      skillName: "×6, ×7, ×8 tables",
      problemCount: 500,
      timeLimitMinutes: 10,
    });
    const res = await POST(req);
    expect(res.status).toBe(422); // should reject as out of range
  });

  it("each problem has matching answer key entry", async () => {
    const req = makeRequest({
      subjectSlug: "MATH",
      levelCode: "M3",
      skillName: "Addition within 10",
      problemCount: 15,
      timeLimitMinutes: 10,
    });
    const res = await POST(req);
    const body = await res.json();
    const probIds = new Set(body.data.problems.map((p: any) => p.id));
    const keyIds = new Set(body.data.answerKey.map((k: any) => k.id));
    expect(probIds).toEqual(keyIds);
  });

  it("returns metadata about the worksheet", async () => {
    const req = makeRequest({
      subjectSlug: "READING",
      levelCode: "R5",
      skillName: "Main idea & details",
      problemCount: 5,
      timeLimitMinutes: 15,
      sheetNumber: 2,
      totalSheets: 5,
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.meta.subjectSlug).toBe("READING");
    expect(body.data.meta.levelCode).toBe("R5");
    expect(body.data.meta.sheetNumber).toBe(2);
    expect(body.data.meta.totalSheets).toBe(5);
  });

  it("accepts difficulty parameter within range", async () => {
    for (const d of [0.5, 1.0, 1.5, 2.0]) {
      const req = makeRequest({
        subjectSlug: "MATH",
        levelCode: "M5",
        skillName: "×6, ×7, ×8 tables",
        problemCount: 5,
        timeLimitMinutes: 10,
        difficulty: d,
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
  });

  it("rejects difficulty out of range", async () => {
    const req = makeRequest({
      subjectSlug: "MATH",
      levelCode: "M5",
      skillName: "×6, ×7, ×8 tables",
      problemCount: 5,
      timeLimitMinutes: 10,
      difficulty: 5.0,
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});
