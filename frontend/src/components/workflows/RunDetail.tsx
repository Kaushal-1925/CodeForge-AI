"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApprovalPanel } from "@/components/workflows/ApprovalPanel";
import { ArtifactViewer } from "@/components/workflows/ArtifactViewer";
import { getWorkflowRun, getWorkflowRunArtifacts } from "@/lib/api/client";
import type { ArtifactFile, WorkflowRun } from "@/lib/api/types";
import {
  approvalStatusLabel,
  approvalStatusTone,
  formatStatus,
  formatTimestamp,
  isTerminalStatus,
  runStatusTone,
} from "@/lib/workflow";

const POLL_INTERVAL_MS = 2500;

interface RunDetailProps {
  projectId: string;
  runId: string;
}

type RunState =
  | { status: "loading" }
  | { status: "success"; run: WorkflowRun }
  | { status: "error"; message: string };

type ArtifactsState =
  | { status: "idle" }
  | { status: "success"; files: ArtifactFile[] }
  | { status: "error"; message: string };

export function RunDetail({ projectId, runId }: RunDetailProps) {
  const [state, setState] = useState<RunState>({ status: "loading" });
  const [artifacts, setArtifacts] = useState<ArtifactsState>({ status: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [artifactsRefreshKey, setArtifactsRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const run = await getWorkflowRun(projectId, runId);

        if (cancelled) {
          return;
        }

        setState({ status: "success", run });

        if (!isTerminalStatus(run.status)) {
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [projectId, runId, refreshKey]);

  const run = state.status === "success" ? state.run : null;
  const runStatus = run?.status;
  const terminal = runStatus ? isTerminalStatus(runStatus) : false;
  const completed = runStatus === "completed";

  useEffect(() => {
    if (!runStatus || !isTerminalStatus(runStatus)) {
      return;
    }

    let cancelled = false;

    getWorkflowRunArtifacts(projectId, runId)
      .then((response) => {
        if (!cancelled) {
          setArtifacts({ status: "success", files: response.files });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setArtifacts({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, runId, runStatus, artifactsRefreshKey]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  function refreshArtifacts() {
    setArtifacts({ status: "idle" });
    setArtifactsRefreshKey((value) => value + 1);
  }

  function handleApprovalUpdated(updatedRun: WorkflowRun) {
    setState({ status: "success", run: updatedRun });
  }

  if (state.status === "loading") {
    return (
      <Card>
        <p className="text-sm text-muted">Loading workflow run...</p>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6" role="alert">
        <p className="text-sm font-medium text-danger">Unable to load this workflow run.</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={refresh}>
            Retry
          </Button>
          <Link
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-foreground"
            href={`/projects/${projectId}`}
          >
            Back to project
          </Link>
        </div>
      </div>
    );
  }

  const currentRun = state.run;

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link className="transition hover:text-foreground" href="/">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <Link className="transition hover:text-foreground" href={`/projects/${projectId}`}>
          Project
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Run {currentRun.id.slice(0, 8)}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Workflow run</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-tight">
            {currentRun.user_request}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {completed && (
            <StatusBadge tone={approvalStatusTone(currentRun.approval_status)}>
              {approvalStatusLabel(currentRun.approval_status)}
            </StatusBadge>
          )}
          <StatusBadge tone={runStatusTone(currentRun.status)}>
            {formatStatus(currentRun.status)}
          </StatusBadge>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Execution status</CardTitle>
              <CardDescription>
                Run state is persisted by the backend and polled by this page.
              </CardDescription>
            </div>
            <Button variant="secondary" onClick={refresh}>
              Refresh
            </Button>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Current agent</dt>
              <dd className="mt-1 font-medium">
                {currentRun.current_agent ? formatStatus(currentRun.current_agent) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Current task</dt>
              <dd className="mt-1 font-medium">{currentRun.current_task ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Iteration</dt>
              <dd className="mt-1 font-medium">{currentRun.iteration}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Started</dt>
              <dd className="mt-1 font-medium">{formatTimestamp(currentRun.started_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Completed</dt>
              <dd className="mt-1 font-medium">{formatTimestamp(currentRun.completed_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Approval</dt>
              <dd className="mt-1 font-medium">
                {approvalStatusLabel(currentRun.approval_status)}
              </dd>
            </div>
          </dl>

          {!terminal && (
            <p className="mt-5 flex items-center gap-2 text-xs text-muted" aria-live="polite">
              <span className="h-2 w-2 animate-pulse rounded-full bg-warning" aria-hidden="true" />
              Workflow in progress. This page refreshes every {POLL_INTERVAL_MS / 1000} seconds.
            </p>
          )}
        </Card>

        <Card>
          {completed ? (
            <ApprovalPanel
              projectId={projectId}
              run={currentRun}
              onUpdated={handleApprovalUpdated}
            />
          ) : (
            <>
              <CardTitle>Change approval</CardTitle>
              <CardDescription>
                {terminal
                  ? "Approval is only available for completed runs. This run failed."
                  : "Approval controls become available after the workflow run completes."}
              </CardDescription>
            </>
          )}
        </Card>
      </section>

      <section aria-labelledby="artifacts-heading">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Review</p>
          <h2 id="artifacts-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Generated artifacts
          </h2>
        </div>

        <div aria-live="polite">
          {!terminal && (
            <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
              Artifacts will appear here after the run reaches a terminal state.
            </div>
          )}

          {terminal && artifacts.status === "idle" && (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
              <div className="h-40 animate-pulse rounded-xl bg-white/5" />
            </div>
          )}

          {terminal && artifacts.status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6" role="alert">
              <p className="text-sm font-medium text-danger">Unable to load generated artifacts.</p>
              <p className="mt-2 text-sm text-muted">{artifacts.message}</p>
              <Button variant="secondary" className="mt-4" onClick={refreshArtifacts}>
                Retry
              </Button>
            </div>
          )}

          {terminal && artifacts.status === "success" && <ArtifactViewer files={artifacts.files} />}
        </div>
      </section>
    </div>
  );
}
