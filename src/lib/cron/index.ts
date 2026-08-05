// src/lib/cron/index.ts
// Cron job system — runs scheduled tasks (daily packet generation, dunning, streak resets)
// Triggered by an external cron service (Vercel Cron, Upstash, or any HTTP scheduler)
// that hits POST /api/cron/[jobName] with the secret header.

import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Auth — require CRON_SECRET header on all cron routes
// ─────────────────────────────────────────────

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // FAIL CLOSED: if the secret is unconfigured, refuse — never expose cron jobs
  // (bulk PDF gen, dunning, streak resets) to anonymous callers. Only bypass in
  // local dev, and only when explicitly running outside production.
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CRON] CRON_SECRET not set — allowing in non-production only.");
      return true;
    }
    console.error("[CRON] CRON_SECRET not set in production — refusing all cron requests.");
    return false;
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Constant-time compare (avoid length/timing leaks).
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─────────────────────────────────────────────
// Audit logging for cron runs
// ─────────────────────────────────────────────

export interface CronRunResult {
  jobName: string;
  status: "success" | "partial" | "failure";
  durationMs: number;
  recordsProcessed: number;
  errors: string[];
  metadata?: Record<string, any>;
}

export async function recordCronRun(result: CronRunResult): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: `cron.${result.jobName}`,
        entityType: "system",
        entityId: "cron",
        metadata: {
          status: result.status,
          durationMs: result.durationMs,
          recordsProcessed: result.recordsProcessed,
          errors: result.errors,
          ...result.metadata,
        } as any,
      },
    });
  } catch (err) {
    console.error("[CRON] Failed to record audit log:", err);
  }
}

// ─────────────────────────────────────────────
// Job wrapper — handles timing, error capture, audit log
// ─────────────────────────────────────────────

export async function runCronJob<T>(
  jobName: string,
  job: () => Promise<{ recordsProcessed: number; metadata?: Record<string, any> }>
): Promise<CronRunResult> {
  const start = Date.now();
  const errors: string[] = [];
  let recordsProcessed = 0;
  let metadata: Record<string, any> | undefined;
  let status: CronRunResult["status"] = "success";

  try {
    const result = await job();
    recordsProcessed = result.recordsProcessed;
    metadata = result.metadata;
  } catch (err: any) {
    status = "failure";
    errors.push(err.message ?? String(err));
    console.error(`[CRON] ${jobName} failed:`, err);
  }

  const result: CronRunResult = {
    jobName,
    status,
    durationMs: Date.now() - start,
    recordsProcessed,
    errors,
    metadata,
  };

  await recordCronRun(result);
  return result;
}

// ─────────────────────────────────────────────
// Concurrency control — batch helpers
// ─────────────────────────────────────────────

export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<{ results: R[]; failures: Array<{ item: T; error: string }> }> {
  const results: R[] = [];
  const failures: Array<{ item: T; error: string }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(processor));
    settled.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        results.push(res.value);
      } else {
        failures.push({
          item: batch[idx],
          error: res.reason?.message ?? String(res.reason),
        });
      }
    });
  }

  return { results, failures };
}
