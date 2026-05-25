// tests/integration/shop-checkout.test.ts
import { resetMockDb, mockDb, getMockDbState } from "../__mocks__/prisma";

jest.mock("@/lib/db", () => ({ db: mockDb }));

// IMPORTANT: jest.mock() factory must reference a "mock"-prefixed variable
// (Jest's convention), otherwise hoisting fails with "Cannot access before
// initialization." We use a global container so individual tests can still
// inspect the mock.
const mockState = {
  stripeCheckoutCreate: jest.fn(),
};

jest.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: any[]) => mockState.stripeCheckoutCreate(...args),
      },
    },
  },
}));

const mockStripeCheckoutCreate = mockState.stripeCheckoutCreate;

import { POST } from "@/app/api/shop/checkout/route";

function makeRequest(body: any): any {
  return {
    url: "http://localhost:3000/api/shop/checkout",
    method: "POST",
    headers: new Map([
      ["content-type", "application/json"],
      ["x-forwarded-for", "127.0.0.1"],
    ]),
    json: async () => body,
  } as any;
}

describe("POST /api/shop/checkout", () => {
  beforeEach(() => {
    resetMockDb();
    mockStripeCheckoutCreate.mockReset();
    mockStripeCheckoutCreate.mockImplementation(async (opts: any) => ({
      id: "cs_test_" + Math.random().toString(36).slice(2, 10),
      url: "https://checkout.stripe.com/test-session",
      ...opts,
    }));
  });

  it("creates a checkout session for a single skill", async () => {
    const req = makeRequest({ skills: ["ADDITION"], email: "buyer@example.com", emailDelivery: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.checkoutUrl).toMatch(/checkout\.stripe\.com/);
    expect(body.data.amountCents).toBe(399);
  });

  it("prices 2 skills at $5.99", async () => {
    const req = makeRequest({ skills: ["ADDITION", "SUBTRACTION"], email: "a@a.com", emailDelivery: true });
    const res = await POST(req);
    expect((await res.json()).data.amountCents).toBe(599);
  });

  it("prices 3 skills at $7.99", async () => {
    const req = makeRequest({ skills: ["ADDITION", "SUBTRACTION", "MULTIPLICATION"], email: "a@a.com", emailDelivery: true });
    const res = await POST(req);
    expect((await res.json()).data.amountCents).toBe(799);
  });

  it("prices all 4 skills at $9.99", async () => {
    const req = makeRequest({
      skills: ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"],
      email: "a@a.com",
      emailDelivery: true,
    });
    const res = await POST(req);
    expect((await res.json()).data.amountCents).toBe(999);
  });

  it("dedupes duplicate skills", async () => {
    const req = makeRequest({ skills: ["ADDITION", "ADDITION"], email: "a@a.com", emailDelivery: true });
    const res = await POST(req);
    expect((await res.json()).data.amountCents).toBe(399);
  });

  it("rejects empty skill list", async () => {
    const req = makeRequest({ skills: [], email: "a@a.com", emailDelivery: true });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("rejects invalid skill names", async () => {
    const req = makeRequest({ skills: ["INVALID_SKILL"], email: "a@a.com", emailDelivery: true });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("rejects missing email", async () => {
    const req = makeRequest({ skills: ["ADDITION"], emailDelivery: true });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("rejects malformed email", async () => {
    const req = makeRequest({ skills: ["ADDITION"], email: "not-an-email", emailDelivery: true });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("persists purchase record with PENDING status", async () => {
    const req = makeRequest({ skills: ["MULTIPLICATION"], email: "p@p.com", emailDelivery: true });
    await POST(req);
    const purchases = getMockDbState().shopPurchase;
    expect(purchases).toHaveLength(1);
    expect(purchases[0].status).toBe("PENDING");
    expect(purchases[0].customerEmail).toBe("p@p.com");
    expect(purchases[0].skillsCsv).toBe("MULTIPLICATION");
    expect(purchases[0].amountCents).toBe(399);
  });

  it("sets a 30-day expiry on the purchase", async () => {
    const req = makeRequest({ skills: ["ADDITION"], email: "p@p.com", emailDelivery: true });
    await POST(req);
    const purchase = getMockDbState().shopPurchase[0];
    const daysUntilExpiry = (new Date(purchase.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilExpiry).toBeGreaterThan(29);
    expect(daysUntilExpiry).toBeLessThan(31);
  });

  it("generates a unique download token per purchase", async () => {
    const req1 = makeRequest({ skills: ["ADDITION"], email: "a@a.com", emailDelivery: true });
    await POST(req1);
    const req2 = makeRequest({ skills: ["ADDITION"], email: "a@a.com", emailDelivery: true });
    await POST(req2);
    const purchases = getMockDbState().shopPurchase;
    expect(purchases[0].downloadToken).not.toBe(purchases[1].downloadToken);
  });

  it("passes shop_purchase metadata to Stripe", async () => {
    const req = makeRequest({ skills: ["DIVISION"], email: "x@x.com", emailDelivery: false });
    await POST(req);
    expect(mockStripeCheckoutCreate).toHaveBeenCalled();
    const stripeCall = mockStripeCheckoutCreate.mock.calls[0][0];
    expect(stripeCall.metadata.purpose).toBe("shop_purchase");
    expect(stripeCall.metadata.shopPurchaseId).toBeTruthy();
    expect(stripeCall.metadata.downloadToken).toBeTruthy();
  });

  it("forwards emailDelivery preference to the purchase record", async () => {
    const req = makeRequest({ skills: ["ADDITION"], email: "a@a.com", emailDelivery: false });
    await POST(req);
    const purchase = getMockDbState().shopPurchase[0];
    expect(purchase.emailDelivery).toBe(false);
  });
});
