"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NewRunForm } from "@/components/workflows/NewRunForm";
import { RunList } from "@/components/workflows/RunList";
import { deleteProject, getProject, listWorkflowRuns } from "@/lib/api/client";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteProject(projectId);
      router.push("/");
    } catch (error: unknown) {
      setIsDeleting(false);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete project");
    }
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
        <div className="flex items-center gap-3">
          <StatusBadge tone={projectStatusTone(project.status)}>
            {formatStatus(project.status)}
          </StatusBadge>
          <Button
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            aria-label={`Delete project ${project.name}`}
          >
            Delete project
          </Button>
        </div>
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

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-project-title"
          aria-describedby="delete-project-description"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0d0f17]/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="delete-project-title" className="text-base font-semibold text-white">
                  Delete Project
                </h3>
                <p id="delete-project-description" className="mt-2 text-xs leading-relaxed text-neutral-300">
                  Are you sure you want to delete{" "}
                  <strong className="font-medium text-white">"{project.name}"</strong>?
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  This will permanently remove the project, its workflow runs, and workspace files. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
