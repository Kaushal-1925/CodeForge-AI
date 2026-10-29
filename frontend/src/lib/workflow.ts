import type { ApprovalStatus } from "@/lib/api/types";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "accent";

const RUNNING_STATUSES = new Set(["started", "running", "in_progress"]);

export function isTerminalStatus(status: string): boolean {
  return status === "completed" || status === "failed";
}

export function formatStatus(status: string): string {
  return status
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function runStatusTone(status: string): BadgeTone {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (RUNNING_STATUSES.has(status)) return "warning";
  return "accent";
}

export function projectStatusTone(status: string): BadgeTone {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "running") return "warning";
  return "accent";
}

export function approvalStatusTone(status: ApprovalStatus): BadgeTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function approvalStatusLabel(status: ApprovalStatus): string {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending review";
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
