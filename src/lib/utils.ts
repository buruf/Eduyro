// src/lib/utils.ts
// Shared utility helpers

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────
// Tailwind class merging
// ─────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
// Date/time formatting
// ─────────────────────────────────────────────

export function formatDate(date: Date | string, pattern = "MMM d, yyyy"): string {
  return format(typeof date === "string" ? new Date(date) : date, pattern);
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(typeof date === "string" ? new Date(date) : date, {
    addSuffix: true,
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m} min ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ─────────────────────────────────────────────
// Number formatting
// ─────────────────────────────────────────────

export function formatPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ─────────────────────────────────────────────
// String helpers
// ─────────────────────────────────────────────

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─────────────────────────────────────────────
// Status color helpers
// ─────────────────────────────────────────────

export function accuracyColor(pct: number): string {
  if (pct >= 95) return "text-brand-green";
  if (pct >= 85) return "text-gold-dark";
  if (pct >= 75) return "text-gold";
  return "text-brand-red";
}

export function statusColor(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    EXCELLENT: { bg: "bg-brand-blue-light", text: "text-brand-blue" },
    ON_TRACK: { bg: "bg-brand-green-light", text: "text-brand-green" },
    NEEDS_REVIEW: { bg: "bg-gold-light", text: "text-gold-dark" },
    NEEDS_SUPPORT: { bg: "bg-brand-red-light", text: "text-brand-red" },
    COMPLETED: { bg: "bg-brand-green-light", text: "text-brand-green" },
    IN_PROGRESS: { bg: "bg-brand-blue-light", text: "text-brand-blue" },
    NOT_STARTED: { bg: "bg-border", text: "text-muted" },
  };
  return map[status] ?? { bg: "bg-border", text: "text-muted" };
}

// ─────────────────────────────────────────────
// Type-safe sleep
// ─────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
