"use client";

import { useEffect, useState } from "react";

import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { ProjectList } from "@/components/projects/ProjectList";
import { HealthPanel } from "@/components/system/HealthPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { listProjects } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

type ProjectsState =
  | { status: "loading" }
  | { status: "success"; projects: Project[] }
  | { status: "error"; message: string };

export function Dashboard() {
  const [state, setState] = useState<ProjectsState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listProjects()
      .then((projects) => {
        if (!cancelled) {
          setState({ status: "success", projects });
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
  }, [refreshKey]);

  function refresh() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }

  function handleProjectCreated() {
    refresh();
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Create a project</CardTitle>
          <CardDescription>
            A project groups workflow runs and the workspaces they generate.
          </CardDescription>
          <div className="mt-5">
            <CreateProjectForm onCreated={handleProjectCreated} />
          </div>
        </Card>
        <HealthPanel />
      </section>

      <section aria-labelledby="projects-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Workspace</p>
            <h2 id="projects-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              Projects
            </h2>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={state.status === "loading"}>
            Refresh
          </Button>
        </div>

        <div aria-live="polite">
          {state.status === "loading" && (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-xl bg-white/5" />
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-6" role="alert">
              <p className="text-sm font-medium text-danger">Unable to load projects.</p>
              <p className="mt-2 text-sm text-muted">{state.message}</p>
              <Button variant="secondary" className="mt-4" onClick={refresh}>
                Retry
              </Button>
            </div>
          )}

          {state.status === "success" && <ProjectList projects={state.projects} />}
        </div>
      </section>
    </div>
  );
}
