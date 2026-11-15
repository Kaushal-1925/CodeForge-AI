import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-white/40",
  secondary:
    "border border-white/[0.08] bg-white/[0.04] text-neutral-200 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] backdrop-blur-md focus-visible:ring-2 focus-visible:ring-white/20",
  ghost:
    "text-neutral-400 hover:text-white hover:bg-white/[0.04] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/20",
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-500/30",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm transition-all duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
