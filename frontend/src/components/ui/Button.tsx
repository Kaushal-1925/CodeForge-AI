import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-canvas hover:bg-accent/90 focus-visible:ring-accent focus-visible:ring-offset-canvas",
  secondary:
    "border border-border bg-white/5 text-foreground hover:bg-white/10 focus-visible:ring-accent focus-visible:ring-offset-canvas",
  ghost:
    "text-muted hover:bg-white/5 hover:text-foreground focus-visible:ring-accent focus-visible:ring-offset-canvas",
  danger:
    "bg-danger/90 text-canvas hover:bg-danger focus-visible:ring-danger focus-visible:ring-offset-canvas",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
