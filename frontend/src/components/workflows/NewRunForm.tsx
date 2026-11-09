"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { createWorkflowRun } from "@/lib/api/client";
import type { WorkflowRun } from "@/lib/api/types";

interface NewRunFormProps {
  projectId: string;
  onCreated: (run: WorkflowRun) => void;
}

export function NewRunForm({ projectId, onCreated }: NewRunFormProps) {
  const [userRequest, setUserRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedRequest = userRequest.trim();

    if (!trimmedRequest || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const run = await createWorkflowRun(projectId, {
        user_request: trimmedRequest,
      });

      setUserRequest("");
      onCreated(run);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the workflow run");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="request">
          Workflow request
        </label>
        <textarea
          id="request"
          name="request"
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-border bg-canvas/70 px-3 py-2 text-sm leading-6 outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
          value={userRequest}
          onChange={(event) => setUserRequest(event.target.value)}
          placeholder="Build a REST API for tracking invoices with authentication and tests."
          disabled={submitting}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!userRequest.trim() || submitting}>
        {submitting ? "Starting..." : "Start workflow"}
      </Button>
    </form>
  );
}
