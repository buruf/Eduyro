// tests/integration/shop-sample.test.ts
// Verifies the public sample preview API.
//
// Contract (CHANGED in Batch 1): the sample endpoint now returns rendered
// HTML for in-browser preview, NOT a downloadable PDF URL. Samples are
// view-only (watermarked) so prospective buyers see the format without
// being able to grab a free copy of the pack.

import { GET } from "@/app/api/shop/sample/route";
import { NextRequest } from "next/server";

function makeRequest(skill?: string): NextRequest {
  const url = skill
    ? `http://localhost/api/shop/sample?skill=${encodeURIComponent(skill)}`
    : "http://localhost/api/shop/sample";
  return new NextRequest(url);
}

describe("GET /api/shop/sample", () => {
  it("returns 422 without a skill param", async () => {
    // 422 = Unprocessable Entity. The request is well-formed but the
    // required field is missing/invalid — validationError helper uses 422.
    const res = await GET(makeRequest());
    expect(res.status).toBe(422);
  });

  it("returns 422 for an invalid skill", async () => {
    const res = await GET(makeRequest("BOGUS"));
    expect(res.status).toBe(422);
  });

  it("returns 200 and sheetsHtml for ADDITION", async () => {
    const res = await GET(makeRequest("ADDITION"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.skill).toBe("ADDITION");
    expect(json.data.label).toBe("Addition");
    expect(json.data.sheetCount).toBe(2);
    expect(Array.isArray(json.data.sheetsHtml)).toBe(true);
    expect(json.data.sheetsHtml).toHaveLength(2);
    // No downloadUrl — samples are view-only now
    expect(json.data.downloadUrl).toBeUndefined();
  });

  it("works for all 4 valid skills", async () => {
    for (const skill of ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"]) {
      const res = await GET(makeRequest(skill));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.skill).toBe(skill);
      expect(json.data.sheetsHtml).toHaveLength(2);
    }
  });

  it("handles lowercase skill names (case insensitive)", async () => {
    const res = await GET(makeRequest("addition"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.skill).toBe("ADDITION");
  });

  it("includes a watermark in the rendered HTML", async () => {
    const res = await GET(makeRequest("ADDITION"));
    const json = await res.json();
    // The watermark text is baked into the HTML output
    const firstSheet = json.data.sheetsHtml[0];
    expect(firstSheet).toContain("SAMPLE");
    expect(firstSheet).toContain("NOT FOR PRINTING");
  });

  it("does NOT include answer key in samples", async () => {
    const res = await GET(makeRequest("ADDITION"));
    const json = await res.json();
    // Answer key class would only appear if isAnswerKey was true; the
    // sample is rendered with answers hidden (blank input boxes).
    const firstSheet = json.data.sheetsHtml[0];
    expect(firstSheet).not.toContain("Answer Key");
    expect(firstSheet).toContain("blank"); // blank boxes class is present
  });

  it("returns an explanatory note about view-only previews", async () => {
    const res = await GET(makeRequest("ADDITION"));
    const json = await res.json();
    expect(typeof json.data.note).toBe("string");
    expect(json.data.note.toLowerCase()).toContain("view-only");
  });
});
