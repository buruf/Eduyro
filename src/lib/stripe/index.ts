// src/lib/stripe/index.ts
// Stripe SDK and helpers
// PRICING MODEL:
//   - First child: $9.99/mo with 14-day trial
//   - Each additional child: $5.99/mo, no trial
//   - Billed on the same subscription using two line items
//   - Example: 3 kids = $9.99 + $5.99 + $5.99 = $21.97/mo

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10" as any,
  typescript: true,
  appInfo: { name: "Eduyro", version: "1.0.0" },
});

// ─────────────────────────────────────────────────────────────
// Plan configuration
// ─────────────────────────────────────────────────────────────

export const PLANS = {
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    description: "Per-child mastery learning",
    firstChildPriceMonthly: 9.99,
    additionalChildPriceMonthly: 5.99,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
    stripeAdditionalChildPriceId: process.env.STRIPE_PRICE_ADDITIONAL_CHILD,
    trialDays: 14, // Only for the first child
    limits: {
      sheetsPerDay: Infinity,
      subjects: 4,
      pdfDownloads: true,
      parentDashboard: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ─────────────────────────────────────────────────────────────
// Price calculation helpers
// ─────────────────────────────────────────────────────────────

export function calculateMonthlyTotal(childCount: number): number {
  if (childCount <= 0) return 0;
  return PLANS.PREMIUM.firstChildPriceMonthly + Math.max(0, childCount - 1) * PLANS.PREMIUM.additionalChildPriceMonthly;
}

export function formatMonthlyTotal(childCount: number): string {
  return `$${calculateMonthlyTotal(childCount).toFixed(2)}/mo`;
}

// ─────────────────────────────────────────────────────────────
// Create / retrieve customer
// ─────────────────────────────────────────────────────────────

export async function getOrCreateCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  existingStripeCustomerId?: string | null;
}): Promise<string> {
  if (params.existingStripeCustomerId) {
    try {
      const c = await stripe.customers.retrieve(params.existingStripeCustomerId);
      if (!c.deleted) return params.existingStripeCustomerId;
    } catch {}
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata ?? {},
  });
  return customer.id;
}

// ─────────────────────────────────────────────────────────────
// Create checkout session for first child (with trial)
// ─────────────────────────────────────────────────────────────

export async function createCheckoutSession(params: {
  customerId: string;
  plan: PlanId;
  quantity?: number;
  trialDays?: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const planConfig = PLANS[params.plan];
  if (!planConfig.stripePriceId) {
    throw new Error(`No Stripe price configured for plan ${params.plan}`);
  }

  const trialDays = params.trialDays ?? planConfig.trialDays ?? 14;

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: planConfig.stripePriceId as string,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: trialDays,
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      metadata: params.metadata,
    },
    payment_method_collection: "if_required",
    metadata: params.metadata,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });
}

// ─────────────────────────────────────────────────────────────
// Add additional child to existing subscription (no trial)
// ─────────────────────────────────────────────────────────────

export async function addChildToSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  const additionalPriceId = process.env.STRIPE_PRICE_ADDITIONAL_CHILD;
  if (!additionalPriceId) {
    throw new Error("STRIPE_PRICE_ADDITIONAL_CHILD not configured");
  }

  // Check if additional child line item already exists
  const existingItem = sub.items.data.find(
    (item) => item.price.id === additionalPriceId
  );

  if (existingItem) {
    // Increment quantity on existing additional child line item
    return stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: existingItem.id,
          quantity: (existingItem.quantity ?? 1) + 1,
        },
      ],
      proration_behavior: "create_prorations",
    });
  } else {
    // Add new additional child line item
    return stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          price: additionalPriceId,
          quantity: 1,
        },
      ],
      proration_behavior: "create_prorations",
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Customer portal (manage subscription)
// ─────────────────────────────────────────────────────────────

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// ─────────────────────────────────────────────────────────────
// Plan enforcement helpers
// ─────────────────────────────────────────────────────────────

export function canAccessFeature(
  plan: PlanId,
  feature: "pdfDownloads" | "parentDashboard"
): boolean {
  const limits = PLANS[plan].limits as any;
  return Boolean(limits[feature]);
}

export function getDailySheetLimit(plan: PlanId): number {
  return PLANS[plan].limits.sheetsPerDay;
}
