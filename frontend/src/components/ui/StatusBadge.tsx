import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "neutral" | "accent";

const toneStyles: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
    dot: "bg-emerald-400",
  },
  warning: {
    badge: "border-amber-500/20 bg-amber-500/[0.08] text-amber-400",
    dot: "bg-amber-400",
  },
  danger: {
    badge: "border-red-500/20 bg-red-500/[0.08] text-red-400",
    dot: "bg-red-400",
  },
  neutral: {
    badge: "border-white/[0.08] bg-white/[0.04] text-neutral-400",
    dot: "bg-neutral-400",
  },
  accent: {
    badge: "border-blue-500/25 bg-blue-500/[0.08] text-blue-400",
    dot: "bg-blue-400",
  },
};

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ tone = "neutral", children, className, showDot = true }: StatusBadgeProps) {
  const currentTone = toneStyles[tone] || toneStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide backdrop-blur-md",
        currentTone.badge,
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", currentTone.dot)} />}
      <span>{children}</span>
    </span>
  );
}
