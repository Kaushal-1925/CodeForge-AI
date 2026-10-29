"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { updateWorkflowRunApproval } from "@/lib/api/client";
import type { WorkflowRun } from "@/lib/api/types";
import { approvalStatusLabel, approvalStatusTone } from "@/lib/workflow";

interface ApprovalPanelProps {
  projectId: string;
  run: WorkflowRun;
  onUpdated: (run: WorkflowRun) => void;
}

export function ApprovalPanel({ projectId, run, onUpdated }: ApprovalPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approvalStatus: "approved" | "rejected") {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedRun = await updateWorkflowRunApproval(projectId, run.id, approvalStatus);
      onUpdated(updatedRun);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record the approval decision");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Change approval</p>
          <p className="mt-1 text-sm text-muted">
            Review the generated artifacts, then record an approval decision. This does not modify
            the generated files.
          </p>
        </div>
        <StatusBadge tone={approvalStatusTone(run.approval_status)}>
          {approvalStatusLabel(run.approval_status)}
        </StatusBadge>
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={submitting} onClick={() => decide("approved")}>
          {submitting ? "Recording..." : "Approve changes"}
        </Button>
        <Button variant="danger" disabled={submitting} onClick={() => decide("rejected")}>
          Reject changes
        </Button>
      </div>
    </div>
  );
}
