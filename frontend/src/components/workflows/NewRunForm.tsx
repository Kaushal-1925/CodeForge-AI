"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { createWorkflowRun } from "@/lib/api/client";
import type { WorkflowRun } from "@/lib/api/types";

const PROMPT_SUGGESTIONS = [
  {
    label: "Expense Tracker CLI",
    prompt:
      "Build a Python CLI tool that allows users to log expenses with an amount, category, and date. Provide commands to list all expenses, show total spending broken down by category, and export the summary to a CSV file. Include complete pytest unit tests verifying all calculations and invalid input handling.",
  },
  {
    label: "URL Shortener API",
    prompt:
      "Create a FastAPI REST application that generates 6-character unique short codes for long URLs, handles redirects to the original destination, and tracks total visit counts per link. Store data in SQLite and include unit tests testing duplicate links, 404s for invalid slugs, and redirect mechanics.",
  },
  {
    label: "Markdown Task Parser",
    prompt:
      "Build a Python tool that scans markdown documents for checklist items (e.g., '- [ ]' and '- [x]'), extracts priority tags like #high or #urgent, extracts dates, and outputs a formatted JSON summary and console table. Include unit tests with sample markdown documents covering completed, uncompleted, and malformed tasks.",
  },
];

interface NewRunFormProps {
  projectId: string;
  onCreated: (run: WorkflowRun) => void;
}

export function NewRunForm({ projectId, onCreated }: NewRunFormProps) {
  const [userRequest, setUserRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPrompt(prompt: string) {
    setUserRequest(prompt);
  }

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
      {/* Quick Prompt Ideas */}
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Suggested Engineering Prompts
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((sug) => (
            <button
              key={sug.label}
              type="button"
              onClick={() => applyPrompt(sug.prompt)}
              disabled={submitting}
              className="rounded-lg border border-border/70 bg-surface/50 px-2.5 py-1 text-xs text-muted transition hover:border-accent/60 hover:bg-accent/10 hover:text-foreground"
            >
              + {sug.label}
            </button>
          ))}
        </div>
      </div>

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
