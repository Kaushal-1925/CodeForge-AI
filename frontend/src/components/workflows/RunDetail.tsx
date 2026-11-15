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

const AGENT_PIPELINE = [
  { key: "architect", name: "Architect", color: "#60a5fa" },
  { key: "tech_lead", name: "Tech Lead", color: "#34d399" },
  { key: "developer", name: "Developer", color: "#c084fc" },
  { key: "tester", name: "Tester", color: "#fbbf24" },
];

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
        <p className="text-sm text-neutral-400">Loading workflow run...</p>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 backdrop-blur-xl" role="alert">
        <p className="text-sm font-medium text-red-400">Unable to load this workflow run.</p>
        <p className="mt-2 text-sm text-neutral-400">{state.message}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={refresh}>
            Retry
          </Button>
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-neutral-400 transition hover:bg-white/[0.04] hover:text-white"
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
      <nav className="text-sm text-neutral-500">
        <Link className="transition hover:text-white" href="/">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <Link className="transition hover:text-white" href={`/projects/${projectId}`}>
          Project
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Run {currentRun.id.slice(0, 8)}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">Workflow run</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-white">
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

      {/* Visual Multi-Agent Pipeline */}
      <section className="rounded-2xl border border-white/[0.06] bg-[#121318]/50 p-4 backdrop-blur-xl">
        <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">Agent Progression</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AGENT_PIPELINE.map((stage, idx) => {
            const isActive =
              currentRun.current_agent &&
              currentRun.current_agent.toLowerCase().includes(stage.key);
            const isFinished = completed;

            return (
              <div
                key={stage.key}
                className={`relative flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  isActive
                    ? "border-white/30 bg-white/[0.08] shadow-lg"
                    : isFinished
                    ? "border-emerald-500/20 bg-emerald-500/[0.03] text-neutral-400"
                    : "border-white/[0.05] bg-black/20 text-neutral-500"
                }`}
              >
                <div
                  className="grid h-6 w-6 place-items-center rounded-md font-mono text-xs font-semibold"
                  style={{
                    backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.06)",
                    color: isActive ? "#000000" : stage.color,
                  }}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{stage.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate font-mono">
                    {isActive ? "Active" : isFinished ? "Passed" : "Standby"}
                  </p>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </section>

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

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Current agent</dt>
              <dd className="mt-1 font-medium text-white">
                {currentRun.current_agent ? formatStatus(currentRun.current_agent) : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Current task</dt>
              <dd className="mt-1 font-medium text-white">{currentRun.current_task ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Iteration</dt>
              <dd className="mt-1 font-mono font-medium text-white">{currentRun.iteration}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Started</dt>
              <dd className="mt-1 font-medium text-neutral-300">{formatTimestamp(currentRun.started_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Completed</dt>
              <dd className="mt-1 font-medium text-neutral-300">{formatTimestamp(currentRun.completed_at)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-neutral-500">Approval</dt>
              <dd className="mt-1 font-medium text-neutral-300">
                {approvalStatusLabel(currentRun.approval_status)}
              </dd>
            </div>
          </dl>

          {!terminal && (
            <p className="mt-5 flex items-center gap-2 text-xs text-neutral-400" aria-live="polite">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
              Workflow in progress. Polling every {POLL_INTERVAL_MS / 1000} seconds.
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
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-500">Review</p>
          <h2 id="artifacts-heading" className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Generated artifacts
          </h2>
        </div>

        <div aria-live="polite">
          {!terminal && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-8 text-center text-sm text-neutral-500">
              Artifacts will appear here after the run reaches a terminal state.
            </div>
          )}

          {terminal && artifacts.status === "idle" && (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-2xl bg-white/[0.04]" />
              <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
          )}

          {terminal && artifacts.status === "error" && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 backdrop-blur-xl" role="alert">
              <p className="text-sm font-medium text-red-400">Unable to load generated artifacts.</p>
              <p className="mt-2 text-sm text-neutral-400">{artifacts.message}</p>
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
