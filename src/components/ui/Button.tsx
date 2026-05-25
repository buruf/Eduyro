// src/components/ui/Button.tsx
"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "gold" | "blue" | "green" | "red" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-cream hover:bg-ink-soft",
  secondary: "bg-white text-ink border-[1.5px] border-border-mid hover:border-ink",
  gold: "bg-gold text-white hover:bg-gold-dark",
  blue: "bg-brand-blue text-white hover:bg-[#153F6E]",
  green: "bg-brand-green text-white hover:bg-[#1F4D2D]",
  red: "bg-brand-red text-white hover:bg-[#A53020]",
  ghost: "bg-transparent text-ink hover:bg-cream-dark",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className, variant = "primary", size = "md", loading, fullWidth,
    leftIcon, rightIcon, children, disabled, ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium font-sans",
          "transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
