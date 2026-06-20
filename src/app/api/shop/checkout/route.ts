// src/app/api/shop/checkout/route.ts
// POST /api/shop/checkout
// Body: { skills: ShopSkill[], email: string, emailDelivery: boolean }
// Returns: { checkoutUrl: string }
//
// Creates a Stripe Checkout Session for a one-off purchase.
// On payment success, Stripe redirects to /shop/download?token=...
// The webhook (/api/webhooks/stripe) catches the payment and generates PDFs.

import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ok, err, handleRouteError, parseRequest, withRateLimit } from "@/lib/api/helpers";
import { SHOP_SKILLS, calculatePrice, getBundle, type ShopSkill } from "@/lib/shop/pack-generator";

const CheckoutSchema = z.object({
  // À-la-carte skills (1–10). Optional when a bundleId is supplied.
  skills: z.array(z.enum(["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION", "FRACTIONS", "DECIMALS", "RATIOS", "PRE_ALGEBRA", "LINEAR_EQUATIONS", "POLYNOMIALS", "GEOMETRY"]))
    .max(10).optional(),
  // Curated bundle — the server expands it to its skill list and fixed price.
  bundleId: z.string().optional(),
  email: z.string().email(),
  emailDelivery: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, 10, 60_000); // 10/min per IP
  if (limited) return limited;

  const parsed = await parseRequest(req, CheckoutSchema);
  if ("status" in parsed) return parsed;
  const { skills, bundleId, email, emailDelivery } = parsed.data;

  try {
    // ── Resolve the order to (skills, price) ENTIRELY server-side ──
    // The client may send a bundleId or a skills list; it never sends a price.
    let uniqueSkills: ShopSkill[];
    let amountCents: number;
    let productName: string;

    if (bundleId) {
      const bundle = getBundle(bundleId);
      if (!bundle) return err("Unknown bundle", 400, "INVALID_BUNDLE");
      uniqueSkills = bundle.skills.slice();
      amountCents  = bundle.priceCents;          // server source of truth
      productName  = `${bundle.name} — ${bundle.gradeBand}`;
    } else {
      uniqueSkills = Array.from(new Set(skills ?? [])) as ShopSkill[];
      if (uniqueSkills.length < 1) return err("Select at least one skill or a bundle", 400, "NO_SKILLS");
      amountCents  = calculatePrice(uniqueSkills);
      productName  = uniqueSkills.length === 1
        ? `${SHOP_SKILLS[uniqueSkills[0]].label} Practice Pack`
        : `${uniqueSkills.length}-Skill Math Bundle`;
    }

    const downloadToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const skillLabels = uniqueSkills.map((s) => SHOP_SKILLS[s].label).join(", ");
    const productDescription = `${skillLabels} · 100 worksheets per skill · ~${uniqueSkills.length * 3000} problems · Answer keys included`;

    // Create the purchase record (PENDING)
    const purchase = await db.shopPurchase.create({
      data: {
        customerEmail: email.toLowerCase(),
        skillsCsv: uniqueSkills.join(","),
        amountCents,
        status: "PENDING",
        emailDelivery,
        downloadToken,
        expiresAt,
      },
    });

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: productDescription,
              metadata: { skills: uniqueSkills.join(",") },
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/shop/download?token=${downloadToken}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/shop/cancel`,
      metadata: {
        purpose: "shop_purchase",
        shopPurchaseId: purchase.id,
        downloadToken,
      },
      payment_intent_data: {
        metadata: {
          purpose: "shop_purchase",
          shopPurchaseId: purchase.id,
        },
      },
    });

    // Save the session ID on the purchase
    await db.shopPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return err("Stripe did not return a checkout URL", 500);
    }

    return ok({
      checkoutUrl: session.url,
      purchaseId: purchase.id,
      amountCents,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
