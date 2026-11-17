"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { createWorkflowRun } from "@/lib/api/client";
import type { WorkflowRun } from "@/lib/api/types";

const PROMPT_SUGGESTIONS = [
  {
    label: "Expense Tracker",
    prompt:
      "Build a Python CLI tool that allows users to log expenses with an amount, category, and date. Provide commands to list all expenses, show total spending broken down by category, and export the summary to a CSV file. Include complete pytest unit tests verifying all calculations and invalid input handling.",
  },
  {
    label: "URL Shortener",
    prompt:
      "Create a FastAPI REST application that generates 6-character unique short codes for long URLs, handles redirects to the original destination, and tracks total visit counts per link. Store data in PostgreSQL using SQLAlchemy and include unit tests testing duplicate links, 404s for invalid slugs, and redirect mechanics.",
  },
  {
    label: "Markdown Parser",
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
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("codeforge_deepseek_api_key");
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  });

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
      const trimmedKey = apiKey.trim();
      if (trimmedKey && typeof window !== "undefined") {
        localStorage.setItem("codeforge_deepseek_api_key", trimmedKey);
      }

      const run = await createWorkflowRun(projectId, {
        user_request: trimmedRequest,
        api_key: trimmedKey || undefined,
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
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Prompt Templates
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((sug) => (
            <button
              key={sug.label}
              type="button"
              onClick={() => applyPrompt(sug.prompt)}
              disabled={submitting}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              + {sug.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-neutral-400" htmlFor="request">
          Workflow request
        </label>
        <textarea
          id="request"
          name="request"
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-white/[0.08] bg-[#0c0d12]/80 px-3 py-2 text-sm leading-relaxed text-white placeholder:text-neutral-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
          value={userRequest}
          onChange={(event) => setUserRequest(event.target.value)}
          placeholder="Build a REST API for tracking invoices with authentication and tests."
          disabled={submitting}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-neutral-400" htmlFor="apiKey">
            DeepSeek API Key
          </label>
          <span className="text-[11px] text-neutral-500">
            {apiKey.trim() ? "Active for this run" : "Optional if already in .env"}
          </span>
        </div>
        <input
          id="apiKey"
          name="apiKey"
          type="password"
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0c0d12]/80 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="sk-... (paste key here or leave blank if configured in .env)"
          disabled={submitting}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!userRequest.trim() || submitting}>
        {submitting ? "Starting..." : "Start workflow"}
      </Button>
    </form>
  );
}
