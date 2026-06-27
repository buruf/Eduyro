// src/lib/auth/index.ts
// NextAuth configuration — email/password + Google + Microsoft

import { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/signin",
    verifyRequest: "/verify-email",
    newUser: "/onboarding",
  },
  providers: [
    // Email + Password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // Suspended accounts cannot sign in (admin moderation).
        if (user.suspendedAt) {
          throw new Error("This account has been suspended. Contact support@eduyro.com.");
        }

        if (!user.emailVerified && process.env.NODE_ENV === "production") {
          throw new Error("Please verify your email before signing in");
        }

        // Block COPPA-pending children — parent must verify consent first
        if (user.requiresCoppaConsent && user.coppaConsentStatus !== "VERIFIED") {
          throw new Error(
            "This account is awaiting parental consent. Check the email sent to your parent."
          );
        }

        // Update last active
        await db.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Magic link email
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // On OAuth sign in, ensure user has a role set
      if (account?.provider === "google") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });
        if (existingUser && !existingUser.role) {
          await db.user.update({
            where: { id: existingUser.id },
            data: { role: "STUDENT" },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      // Handle session update (e.g. after role change)
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Refresh role from DB on each request (to catch role changes)
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      // Create role-specific record when a new user is created via OAuth
      if (user.email) {
        await db.user.update({
          where: { id: user.id },
          data: {
            role: "STUDENT",
            emailVerified: new Date(),
          },
        });
        // Create student record by default — can change role in onboarding
        await db.student.create({
          data: { userId: user.id },
        });
      }
    },

    async signIn({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
    },
  },
};

// ─────────────────────────────────────────────
// Helper: get session on the server
// ─────────────────────────────────────────────

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    include: {
      student: true,
      parent: true,
      teacher: { include: { school: true } },
    },
  });
}

// ─────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role as Role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
