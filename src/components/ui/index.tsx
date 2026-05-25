// src/components/ui/index.tsx
"use client";

import {
  forwardRef, HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes,
  TextareaHTMLAttributes, ReactNode, useEffect,
} from "react";
import { cn, initials } from "@/lib/utils";

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg" | "none";
}

const cardPad: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white border border-border rounded-lg",
        cardPad[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

export function CardHeader({
  title, subtitle, action, className,
}: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        {title && <h3 className="font-sans text-sm font-semibold">{title}</h3>}
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${props.name ?? Math.random().toString(36).slice(2)}`;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-3 py-2.5 border-[1.5px] rounded-md text-sm font-sans bg-white text-ink",
              "outline-none transition-colors",
              "focus:border-brand-blue",
              error ? "border-brand-red" : "border-border",
              leftIcon && "pl-9",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-brand-red">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-ink">{label}</label>}
      <select
        ref={ref}
        className={cn(
          "w-full px-3 py-2.5 border-[1.5px] rounded-md text-sm font-sans bg-white text-ink",
          "outline-none transition-colors focus:border-brand-blue cursor-pointer",
          error ? "border-brand-red" : "border-border",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-brand-red">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
);
Select.displayName = "Select";

// ─────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-ink">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3 py-2.5 border-[1.5px] rounded-md text-sm font-sans bg-white text-ink",
          "outline-none transition-colors focus:border-brand-blue resize-y min-h-[80px]",
          error ? "border-brand-red" : "border-border",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-brand-red">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

// ─────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────

type BadgeVariant = "blue" | "green" | "gold" | "red" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const badgeStyles: Record<BadgeVariant, string> = {
  blue: "bg-brand-blue-light text-brand-blue",
  green: "bg-brand-green-light text-brand-green",
  gold: "bg-gold-light text-gold-dark",
  red: "bg-brand-red-light text-brand-red",
  neutral: "bg-cream-dark text-muted",
};

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded",
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  bgColor?: string;
  className?: string;
}

const avatarSize: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
};

export function Avatar({ name, src, size = "md", bgColor = "#1B4F8A", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        className={cn("rounded-full object-cover", avatarSize[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0",
        avatarSize[size],
        className
      )}
      style={{ background: bgColor }}
    >
      {initials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const modalSize: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open, onClose, title, description, children, size = "md", className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white rounded-xl shadow-elev w-full max-h-[90vh] overflow-y-auto",
          modalSize[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="p-6 border-b border-border flex items-start justify-between">
            <div>
              {title && <h3 className="font-serif text-lg font-bold">{title}</h3>}
              {description && <p className="text-sm text-muted mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-ink text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md";
}

export function Toggle({ checked, onChange, label, size = "md" }: ToggleProps) {
  const width = size === "sm" ? "w-9 h-5" : "w-11 h-6";
  const dotSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const translate = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors",
          width,
          checked ? "bg-brand-blue" : "bg-border-mid"
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "inline-block transform bg-white rounded-full transition-transform shadow-sm",
            dotSize,
            checked ? translate : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  color?: "blue" | "green" | "gold" | "red";
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value, max = 100, color = "blue", size = "md", showLabel, className,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = {
    blue: "bg-brand-blue",
    green: "bg-brand-green",
    gold: "bg-gold",
    red: "bg-brand-red",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted">
          <span>Progress</span>
          <span className="font-medium">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full overflow-hidden bg-cream-dark",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn("h-full transition-all duration-500 rounded-full", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-6", className)}>
      {icon && <div className="text-4xl mb-3 opacity-60">{icon}</div>}
      <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  color?: "blue" | "green" | "gold" | "red" | "ink";
  className?: string;
}

const statColor: Record<NonNullable<StatCardProps["color"]>, string> = {
  blue: "text-brand-blue",
  green: "text-brand-green",
  gold: "text-gold",
  red: "text-brand-red",
  ink: "text-ink",
};

export function StatCard({ label, value, sub, color = "ink", className }: StatCardProps) {
  return (
    <Card className={cn("p-4", className)} padding="none">
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">{label}</div>
        <div className={cn("font-serif text-2xl font-bold leading-tight", statColor[color])}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-muted mt-1">{sub}</div>}
      </div>
    </Card>
  );
}
