// tests/integration/shop-download.test.ts
import { resetMockDb, mockDb, getMockDbState } from "../__mocks__/prisma";

jest.mock("@/lib/db", () => ({ db: mockDb }));

// Mock the fulfillment helper for download URL generation
const downloadMocks = {
  getFreshDownloadUrl: jest.fn(async (key: string) => `http://test/${key}`),
};
jest.mock("@/lib/shop/fulfillment", () => ({
  getFreshDownloadUrl: (key: any) => downloadMocks.getFreshDownloadUrl(key),
}));

import { GET } from "@/app/api/shop/download/route";

function makeRequest(token?: string): any {
  const url = token
    ? `http://localhost:3000/api/shop/download?token=${token}`
    : "http://localhost:3000/api/shop/download";
  return {
    url,
    method: "GET",
    headers: new Map([["x-forwarded-for", "127.0.0.1"]]),
  } as any;
}

describe("GET /api/shop/download", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("rejects requests without a token", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown token", async () => {
    const res = await GET(makeRequest("nonexistent-token"));
    expect(res.status).toBe(404);
  });

  it("returns 410 (Gone) for expired purchases", async () => {
    // Seed an expired purchase
    mockDb.shopPurchase.create({
      data: {
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "COMPLETED",
        emailDelivery: true,
        downloadToken: "expired-tok",
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        downloadCount: 0,
      },
    });
    const res = await GET(makeRequest("expired-tok"));
    expect(res.status).toBe(410);
  });

  it("auto-marks an expired purchase as EXPIRED", async () => {
    mockDb.shopPurchase.create({
      data: {
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "COMPLETED",
        emailDelivery: true,
        downloadToken: "tok-expire-test",
        expiresAt: new Date(Date.now() - 1000),
        downloadCount: 0,
      },
    });
    await GET(makeRequest("tok-expire-test"));
    const updated = getMockDbState().shopPurchase.find((p) => p.downloadToken === "tok-expire-test");
    expect(updated?.status).toBe("EXPIRED");
  });

  it("returns PROCESSING status for paid-but-not-fulfilled purchases", async () => {
    mockDb.shopPurchase.create({
      data: {
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "PAID",
        emailDelivery: true,
        downloadToken: "tok-processing",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
    });
    const res = await GET(makeRequest("tok-processing"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("PROCESSING");
  });

  it("returns PENDING for not-yet-paid purchases", async () => {
    mockDb.shopPurchase.create({
      data: {
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "PENDING",
        emailDelivery: true,
        downloadToken: "tok-pending",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
    });
    const res = await GET(makeRequest("tok-pending"));
    const body = await res.json();
    expect(body.data.status).toBe("PENDING");
  });

  it("returns COMPLETED status with download files", async () => {
    const purchase = await mockDb.shopPurchase.create({
      data: {
        id: "p-completed",
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION,MULTIPLICATION",
        amountCents: 599,
        status: "COMPLETED",
        emailDelivery: true,
        downloadToken: "tok-completed",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
    });
    await mockDb.shopPurchaseFile.createMany({
      data: [
        { purchaseId: purchase.id, skill: "ADDITION", fileKey: "f1.pdf", fileUrl: "u1", fileSizeBytes: 100, sheetCount: 100 },
        { purchaseId: purchase.id, skill: "MULTIPLICATION", fileKey: "f2.pdf", fileUrl: "u2", fileSizeBytes: 200, sheetCount: 100 },
      ],
    });

    const res = await GET(makeRequest("tok-completed"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("COMPLETED");
    expect(body.data.files).toHaveLength(2);
    expect(body.data.skills).toEqual(["ADDITION", "MULTIPLICATION"]);
  });

  it("increments downloadCount on each access", async () => {
    await mockDb.shopPurchase.create({
      data: {
        id: "p-counter",
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "COMPLETED",
        emailDelivery: true,
        downloadToken: "tok-count",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
    });
    await GET(makeRequest("tok-count"));
    await GET(makeRequest("tok-count"));
    const updated = getMockDbState().shopPurchase.find((p) => p.downloadToken === "tok-count");
    expect(updated?.downloadCount).toBe(2);
  });

  it("returns 500 for failed-fulfillment purchases", async () => {
    await mockDb.shopPurchase.create({
      data: {
        customerEmail: "test@test.com",
        skillsCsv: "ADDITION",
        amountCents: 399,
        status: "FAILED",
        emailDelivery: true,
        downloadToken: "tok-failed",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
    });
    const res = await GET(makeRequest("tok-failed"));
    expect(res.status).toBe(500);
  });
});
