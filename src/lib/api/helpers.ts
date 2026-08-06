// src/lib/api/helpers.ts
// Standardized API response helpers and route middleware

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodSchema } from "zod";
import type { Role } from "@prisma/client";

// ─────────────────────────────────────────────
// Standard response builders
// ─────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function err(
  message: string,
  status = 400,
  code?: string,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    { success: false, error: message, ...(code && { code }), ...(details && { details }) },
    { status }
  );
}

export function unauthorized(message = "Authentication required") {
  return err(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "You do not have permission to do this") {
  return err(message, 403, "FORBIDDEN");
}

export function notFound(resource = "Resource") {
  return err(`${resource} not found`, 404, "NOT_FOUND");
}

export function conflict(message: string) {
  return err(message, 409, "CONFLICT");
}

export function validationError(details: Record<string, string[]>) {
  return err("Validation failed", 422, "VALIDATION_ERROR", details);
}

export function serverError(message = "An unexpected error occurred") {
  return err(message, 500, "SERVER_ERROR");
}

// ─────────────────────────────────────────────
// Auth middleware
// ─────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
}

export async function withAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return unauthorized();

    return await handler({
      userId: session.user.id,
      email: session.user.email!,
      role: session.user.role as Role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function withRole(
  req: NextRequest,
  roles: Role[],
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (ctx) => {
    if (!roles.includes(ctx.role)) return forbidden();
    return handler(ctx);
  });
}

// ─────────────────────────────────────────────
// Body parser with Zod validation
// ─────────────────────────────────────────────

export async function parseRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    result.error.errors.forEach((e) => {
      const path = e.path.join(".");
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });
    return validationError(details);
  }

  return { data: result.data };
}

// ─────────────────────────────────────────────
// Rate limiting (Upstash Redis, shared across instances;
// in-memory fallback when Redis is unconfigured/unreachable)
// ─────────────────────────────────────────────

import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Fallback Map is per-serverless-instance and resets on cold start — a
// best-effort speed-bump only. Real protection requires the Redis path.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimitInMemory(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Bounded memory: prune expired entries when the map grows.
  if (rateLimitMap.size > 5000) {
    for (const [k, v] of rateLimitMap) if (now > v.resetAt) rateLimitMap.delete(k);
  }

  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= limit) return false; // blocked

  entry.count++;
  return true; // allowed
}

// Fixed-window counter: INCR the key, set the TTL on first hit.
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  if (!redis) return rateLimitInMemory(identifier, limit, windowMs);

  try {
    const key = `rl:${identifier}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.pexpire(key, windowMs);
    return count <= limit;
  } catch {
    // Redis unreachable — degrade to the per-instance limiter rather than
    // blocking all traffic or letting everything through untracked.
    return rateLimitInMemory(identifier, limit, windowMs);
  }
}

export async function withRateLimit(
  req: NextRequest,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const allowed = await rateLimit(`${req.nextUrl.pathname}:${ip}`, limit, windowMs);
  if (!allowed) {
    return err("Too many requests. Please slow down.", 429, "RATE_LIMITED");
  }
  return null;
}

// ─────────────────────────────────────────────
// Error handler
// ─────────────────────────────────────────────

export function handleRouteError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return unauthorized();
    if (error.message === "FORBIDDEN") return forbidden();
    if (error.message === "NOT_FOUND") return notFound();

    // Prisma unique constraint violation
    if ((error as any).code === "P2002") {
      return conflict("A record with this value already exists");
    }
    // Prisma record not found
    if ((error as any).code === "P2025") {
      return notFound();
    }
  }

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return serverError(error.message);
  }

  return serverError();
}
