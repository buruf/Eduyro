// src/app/api/parents/me/children/route.ts
// POST /api/parents/me/children
// Creates a new student account and links it to the authenticated parent.
// For the first child: starts a Stripe checkout session (trial).
// For additional children: adds to existing subscription immediately at $5.99/mo.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  ok, err, conflict, handleRouteError, withAuth, parseRequest,
} from "@/lib/api/helpers";
import { z } from "zod";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  addChildToSubscription,
} from "@/lib/stripe";

const AddChildSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    const parsed = await parseRequest(req, AddChildSchema);
    if ("status" in parsed) return parsed;
    const { firstName, lastName, email, password, grade, dateOfBirth } = parsed.data;

    try {
      const parent = await db.parent.findUnique({
        where: { userId: ctx.userId },
        include: {
          children: true,
          user: true,
        },
      });

      if (!parent) return err("Parent profile not found", 404);

      // Check if email is already taken
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) return conflict("An account with this email already exists");

      const dob = dateOfBirth ? new Date(dateOfBirth) : null;
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user + student + parent link in a transaction
      const result = await db.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            role: "STUDENT",
            provider: "EMAIL",
            dateOfBirth: dob,
            emailVerified: new Date(), // Parent created the account — verified
          },
        });

        const newStudent = await tx.student.create({
          data: {
            userId: newUser.id,
            grade: grade ?? null,
            dateOfBirth: dob,
          },
        });

        await tx.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: newStudent.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: ctx.userId,
            type: "SYSTEM",
            title: `${firstName} has been added!`,
            message: `${firstName}'s account is ready. They can now sign in and take the placement test.`,
          },
        });

        return { user: newUser, student: newStudent };
      });

      const isFirstChild = parent.children.length === 0;

      // Handle subscription
      const subscription = await db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      let checkoutUrl: string | null = null;

      if (isFirstChild && !subscription?.stripeSubscriptionId) {
        // First child — start checkout with 7-day trial
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const customerId = await getOrCreateCustomer({
          email: parent.user.email,
          name: parent.user.name ?? undefined,
          existingStripeCustomerId: subscription?.stripeCustomerId ?? null,
          metadata: { userId: ctx.userId },
        });

        const session = await createCheckoutSession({
          customerId,
          plan: "PREMIUM",
          trialDays: 7,
          successUrl: `${appUrl}/parent?subscribed=1`,
          cancelUrl: `${appUrl}/parent`,
          metadata: { userId: ctx.userId, plan: "PREMIUM" },
        });

        checkoutUrl = session.url;
      } else if (!isFirstChild && subscription?.stripeSubscriptionId) {
        // Additional child — add to existing subscription at $5.99/mo, no trial
        await addChildToSubscription(subscription.stripeSubscriptionId).catch((e) => {
          console.error("[add-child] Failed to update Stripe subscription:", e);
          // Non-blocking — child is still created, billing team can fix manually
        });
      }

      return ok({
        studentId: result.student.id,
        userId: result.user.id,
        name: `${firstName} ${lastName}`,
        email,
        isFirstChild,
        checkoutUrl, // Non-null for first child — frontend should redirect
        message: isFirstChild
          ? `${firstName}'s account created. Start your 7-day free trial to activate.`
          : `${firstName}'s account created. $5.99/mo added to your subscription.`,
      }, 201);
    } catch (error) {
      return handleRouteError(error);
    }
  });
}

export async function GET(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const parent = await db.parent.findUnique({
        where: { userId: ctx.userId },
        include: {
          children: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, name: true, email: true } },
                  progress: {
                    where: { status: "IN_PROGRESS" },
                    include: { level: { include: { subject: true } } },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!parent) return err("Parent profile not found", 404);

      const children = parent.children.map((link) => ({
        studentId: link.student.id,
        name: link.student.user.name,
        firstName: link.student.user.firstName,
        email: link.student.user.email,
        grade: link.student.grade,
        currentLevel: link.student.progress[0]?.level ?? null,
      }));

      return ok({ children });
    } catch (error) {
      return handleRouteError(error);
    }
  });
}
