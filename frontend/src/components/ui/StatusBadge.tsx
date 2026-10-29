import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "neutral" | "accent";

const tones: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-border bg-white/5 text-muted",
  accent: "border-accent/30 bg-accent/10 text-accent",
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ tone = "neutral", children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
