// tests/integration/webhook-routing.test.ts
// Tests the Stripe webhook handler routes shop purchases correctly.

import { resetMockDb, mockDb } from "../__mocks__/prisma";

jest.mock("@/lib/db", () => ({ db: mockDb }));

// Mock container — referenced inside factories to avoid hoisting issues
const webhookMocks: {
  handleShopPurchase: jest.Mock<Promise<void>, any[]>;
  constructEvent: jest.Mock<any, any[]>;
  subscriptionsRetrieve: jest.Mock<Promise<any>, any[]>;
} = {
  handleShopPurchase: jest.fn(async () => {}) as any,
  constructEvent: jest.fn() as any,
  subscriptionsRetrieve: jest.fn(async () => ({})) as any,
};

jest.mock("@/lib/shop/fulfillment", () => ({
  handleShopPurchaseCompleted: (session: any) => webhookMocks.handleShopPurchase(session),
}));

jest.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (body: any, sig: any, secret: any) => webhookMocks.constructEvent(body, sig, secret),
    },
    subscriptions: {
      retrieve: (id: any) => webhookMocks.subscriptionsRetrieve(id),
    },
  },
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function makeWebhookRequest(event: any): any {
  return {
    text: async () => JSON.stringify(event),
    headers: new Map([["stripe-signature", "test_sig"]]),
  } as any;
}

describe("POST /api/webhooks/stripe routing", () => {
  beforeEach(() => {
    resetMockDb();
    webhookMocks.handleShopPurchase.mockClear();
    webhookMocks.constructEvent.mockReset();
    // Default: constructEvent just parses the body as JSON (signature check bypassed)
    webhookMocks.constructEvent.mockImplementation((body: any) => JSON.parse(body));
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("routes shop_purchase checkouts to shop fulfillment handler", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          metadata: { purpose: "shop_purchase", shopPurchaseId: "p1" },
          payment_intent: "pi_test_456",
        },
      },
    };
    const res = await POST(makeWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(webhookMocks.handleShopPurchase).toHaveBeenCalledTimes(1);
    const call = (webhookMocks.handleShopPurchase.mock.calls as any[])[0];
    expect(call[0].metadata.purpose).toBe("shop_purchase");
  });

  it("does NOT call shop handler for subscription checkouts", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_sub_123",
          metadata: { userId: "u1", plan: "PRO" },
          subscription: "sub_test_456",
        },
      },
    };
    await POST(makeWebhookRequest(event));
    expect(webhookMocks.handleShopPurchase).not.toHaveBeenCalled();
  });

  it("logs unhandled event types without crashing", async () => {
    const event = {
      type: "payment_intent.payment_failed",
      data: { object: {} },
    };
    const res = await POST(makeWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(webhookMocks.handleShopPurchase).not.toHaveBeenCalled();
  });

  it("returns 400 when signature constructEvent throws", async () => {
    webhookMocks.constructEvent.mockImplementationOnce(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(makeWebhookRequest({ type: "anything" }));
    expect(res.status).toBe(400);
  });
});
