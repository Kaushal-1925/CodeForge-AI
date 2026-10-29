import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { WorkflowRun } from "@/lib/api/types";
import {
  approvalStatusLabel,
  approvalStatusTone,
  formatStatus,
  formatTimestamp,
  runStatusTone,
} from "@/lib/workflow";

interface RunListProps {
  projectId: string;
  runs: WorkflowRun[];
}

export function RunList({ projectId, runs }: RunListProps) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        No workflow runs yet. Submit a request to start one.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {runs.map((run) => (
        <li key={run.id}>
          <Link
            href={`/projects/${projectId}/runs/${run.id}`}
            className="block rounded-xl border border-border/70 bg-surface/50 px-4 py-4 transition hover:border-accent/50 hover:bg-white/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="line-clamp-2 max-w-2xl text-sm font-medium">{run.user_request}</p>
              <div className="flex flex-wrap items-center gap-2">
                {run.status === "completed" && (
                  <StatusBadge tone={approvalStatusTone(run.approval_status)}>
                    {approvalStatusLabel(run.approval_status)}
                  </StatusBadge>
                )}
                <StatusBadge tone={runStatusTone(run.status)}>
                  {formatStatus(run.status)}
                </StatusBadge>
              </div>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <div className="flex gap-1.5">
                <dt>Started</dt>
                <dd>{formatTimestamp(run.started_at)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Iteration</dt>
                <dd>{run.iteration}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Agent</dt>
                <dd>{run.current_agent ? formatStatus(run.current_agent) : "Not recorded"}</dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}
