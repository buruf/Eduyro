// src/app/api/checkout/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  ok, err, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { CheckoutSchema } from "@/lib/validation/schemas";
import {
  createCheckoutSession,
  getOrCreateCustomer,
  PLANS,
} from "@/lib/stripe";

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, CheckoutSchema);
    if ("status" in parsed) return parsed;
    const { plan, quantity, schoolId, successUrl, cancelUrl } = parsed.data;

    try {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        include: {
          subscription: true,
          teacher: { include: { school: { include: { subscription: true } } } },
        },
      });
      if (!user) return err("User not found", 404);

      // Determine target (user or school)
      const isSchoolPlan = plan.startsWith("SCHOOL_") || plan === "DISTRICT";
      const targetSchool = isSchoolPlan && schoolId
        ? await db.school.findUnique({ where: { id: schoolId }, include: { subscription: true } })
        : null;

      if (isSchoolPlan && !targetSchool) {
        return err("Invalid school for school plan", 400);
      }

      // Validate quantity range for school plans
      if (isSchoolPlan) {
        const limits: any = PLANS[plan as keyof typeof PLANS].limits;
        const q = quantity ?? 1;
        if (limits.minStudents && q < limits.minStudents) {
          return err(`This plan requires at least ${limits.minStudents} students`, 400);
        }
        if (limits.maxStudents && q > limits.maxStudents) {
          return err(`This plan supports up to ${limits.maxStudents} students. Upgrade to the next tier.`, 400);
        }
      }

      // Get or create Stripe customer
      const existingCustomerId = isSchoolPlan
        ? targetSchool?.stripeCustomerId
        : user.subscription?.stripeCustomerId;

      const customerId = await getOrCreateCustomer({
        email: user.email,
        name: user.name ?? undefined,
        existingStripeCustomerId: existingCustomerId,
        metadata: {
          userId: user.id,
          schoolId: targetSchool?.id ?? "",
        },
      });

      // Persist customer ID
      if (isSchoolPlan && targetSchool) {
        await db.school.update({
          where: { id: targetSchool.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await createCheckoutSession({
        customerId,
        plan: plan as any,
        quantity,
        trialDays: 7,
        successUrl,
        cancelUrl,
        metadata: {
          userId: user.id,
          schoolId: targetSchool?.id ?? "",
          plan,
        },
      });

      return ok({ checkoutUrl: session.url, sessionId: session.id });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
