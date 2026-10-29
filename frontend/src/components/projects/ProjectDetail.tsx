"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NewRunForm } from "@/components/workflows/NewRunForm";
import { RunList } from "@/components/workflows/RunList";
import { getProject, listWorkflowRuns } from "@/lib/api/client";
import type { Project, WorkflowRun } from "@/lib/api/types";
import { formatStatus, projectStatusTone } from "@/lib/workflow";

interface ProjectDetailProps {
  projectId: string;
}

type ProjectState =
  | { status: "loading" }
  | { status: "success"; project: Project; runs: WorkflowRun[] }
  | { status: "error"; message: string };

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const [state, setState] = useState<ProjectState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getProject(projectId), listWorkflowRuns(projectId)])
      .then(([project, runs]) => {
        if (!cancelled) {
          setState({ status: "success", project, runs });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  function handleRunCreated(run: WorkflowRun) {
    router.push(`/projects/${projectId}/runs/${run.id}`);
  }

  if (state.status === "loading") {
    return (
      <Card>
        <p className="text-sm text-muted">Loading project...</p>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6" role="alert">
        <p className="text-sm font-medium text-danger">Unable to load this project.</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={refresh}>
            Retry
          </Button>
          <Link
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-foreground"
            href="/"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const { project, runs } = state;

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link className="transition hover:text-foreground" href="/">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{project.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Project</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {project.description ?? "No description provided."}
          </p>
        </div>
        <StatusBadge tone={projectStatusTone(project.status)}>
          {formatStatus(project.status)}
        </StatusBadge>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardTitle>Start a workflow</CardTitle>
          <CardDescription>
            Describe the software you want the agents to plan, implement, and test.
          </CardDescription>
          <div className="mt-5">
            <NewRunForm projectId={projectId} onCreated={handleRunCreated} />
          </div>
        </Card>

        <Card>
          <CardTitle>Run history</CardTitle>
          <CardDescription>
            Every run is persisted with its status, current task, iteration, and approval decision.
          </CardDescription>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {runs.length} {runs.length === 1 ? "run" : "runs"} recorded
            </p>
            <Button variant="secondary" onClick={refresh}>
              Refresh
            </Button>
          </div>
        </Card>
      </section>

      <section aria-labelledby="runs-heading">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Execution</p>
          <h2 id="runs-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Workflow runs
          </h2>
        </div>
        <RunList projectId={projectId} runs={runs} />
      </section>
    </div>
  );
}
