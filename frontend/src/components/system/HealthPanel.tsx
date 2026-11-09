"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getHealth } from "@/lib/api/client";
import type { HealthResponse } from "@/lib/api/types";

type HealthState =
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export function HealthPanel() {
  const [state, setState] = useState<HealthState>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "success", data });
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

  function retry() {
    setState({ status: "loading" });
    setRefreshKey((value) => value + 1);
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Backend</p>
          <h2 className="mt-1 text-lg font-semibold">Service status</h2>
        </div>
        {state.status === "loading" && <StatusBadge tone="warning">Checking</StatusBadge>}
        {state.status === "success" && <StatusBadge tone="success">Online</StatusBadge>}
        {state.status === "error" && <StatusBadge tone="danger">Offline</StatusBadge>}
      </div>

      <div className="mt-5" aria-live="polite">
        {state.status === "loading" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Checking backend status...</p>
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        )}

        {state.status === "success" && (
          <div>
            <p className="text-sm font-medium text-success">Backend online.</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Service</dt>
                <dd className="mt-1 font-medium">{state.data.service}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Version</dt>
                <dd className="mt-1 font-medium">{state.data.version}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Environment</dt>
                <dd className="mt-1 font-medium">{state.data.environment}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
                <dd className="mt-1 font-medium">{state.data.status}</dd>
              </div>
            </dl>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert">
            <p className="text-sm font-medium text-danger">Backend unreachable.</p>
            <p className="mt-2 text-sm text-muted">{state.message}</p>
            <p className="mt-3 text-xs leading-5 text-muted">
              Start the API with{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-foreground">
                cd backend &amp;&amp; uv run uvicorn app.main:app --reload
              </code>
              .
            </p>
            <Button variant="secondary" className="mt-4" onClick={retry}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
