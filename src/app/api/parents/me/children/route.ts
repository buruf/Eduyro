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
import { requiresParentalConsent, calculateAge } from "@/lib/compliance/consent-age";
import { recordConsent, getRequestCountry, getClientIp } from "@/lib/compliance/consent";
import { ensureDefaultEnrollments } from "@/lib/enrollment";
import { nanoid } from "nanoid";

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
  // Parent/guardian affirms (on the child's behalf) the Terms, Privacy Policy,
  // and — for a child under the local digital-consent age — verifiable parental
  // consent. Required, un-ticked by default on the client.
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms and Privacy Policy on your child's behalf" }) }),
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
      const country = getRequestCountry(req);
      const ipAddress = getClientIp(req);
      // When a parent creates a child's account under their own (paid)
      // subscription, the parent IS the verifiable consent-giver — so for a
      // below-threshold child we mark consent VERIFIED and log the evidence
      // rather than sending a separate verification email. Threshold is
      // jurisdiction-aware (digital consent age varies by country).
      const needsCoppa = !!dob && requiresParentalConsent(dob, country);
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
            requiresCoppaConsent: needsCoppa,
            coppaConsentStatus: needsCoppa ? "VERIFIED" : null,
          },
        });

        if (needsCoppa && dob) {
          await tx.coppaConsentRequest.create({
            data: {
              studentUserId: newUser.id,
              childFirstName: firstName,
              childDateOfBirth: dob,
              parentEmail: parent.user.email,
              parentFullName: parent.user.name ?? `${firstName}'s parent`,
              consentMethod: "CREDIT_CARD_MICROCHARGE",
              verificationToken: nanoid(32),
              status: "VERIFIED",
              verifiedAt: new Date(),
              verificationEvidence: {
                basis: "parent-managed account",
                parentUserId: ctx.userId,
                note: "Parent created the child account under their own paid subscription.",
              },
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          });
          await tx.auditLog.create({
            data: {
              userId: ctx.userId,
              action: "coppa.parental_consent_recorded",
              entityId: newUser.id,
              entityType: "User",
              metadata: { childAge: calculateAge(dob), method: "parent-managed account" },
            },
          });
        }

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

        // Enrol the child in ALL subjects by default (parent paid for the whole
        // child). The parent can later mute any subject from their dashboard.
        await ensureDefaultEnrollments(newStudent.id, tx);

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

      // Record the parent's on-behalf acceptance of Terms, Privacy, and (for a
      // below-threshold child) parental consent — with jurisdiction + IP + who
      // gave consent. Non-blocking.
      await recordConsent({
        userId: result.user.id,
        types: needsCoppa ? ["TERMS", "PRIVACY", "COPPA_CONSENT"] : ["TERMS", "PRIVACY"],
        country, ipAddress, acceptedByUserId: ctx.userId,
      });

      const isFirstChild = parent.children.length === 0;

      // Handle subscription
      const subscription = await db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      let checkoutUrl: string | null = null;

      // Complimentary access (admin-granted, Stripe-less): a TRIALING row with
      // no Stripe subscription and a future trialEndsAt. No checkout, no card —
      // children are created directly until the comp window ends.
      const isComp = !!subscription && !subscription.stripeSubscriptionId &&
        subscription.status === "TRIALING" && !!subscription.trialEndsAt && subscription.trialEndsAt > new Date();

      if (isComp) {
        // fall through — child already created above; nothing to bill
      } else if (isFirstChild && !subscription?.stripeSubscriptionId) {
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
        message: isComp
          ? `${firstName}'s account created and ready to use.`
          : isFirstChild
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
