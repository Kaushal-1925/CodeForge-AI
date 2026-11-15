"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { createProject } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

const STARTER_TEMPLATES = [
  {
    label: "Expense Tracker",
    name: "Expense Tracker CLI",
    desc: "Command-line expense logger with category totals and CSV export.",
  },
  {
    label: "URL Shortener",
    name: "URL Shortener Service",
    desc: "FastAPI service with 6-character shortlinks, click counts, and redirect routes.",
  },
  {
    label: "Markdown Parser",
    name: "Markdown Task Extractor",
    desc: "Parser that extracts checklist items, priority tags, and due dates from markdown notes.",
  },
];

interface CreateProjectFormProps {
  onCreated: (project: Project) => void;
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyTemplate(tpl: (typeof STARTER_TEMPLATES)[0]) {
    setName(tpl.name);
    setDescription(tpl.desc);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const project = await createProject({
        name: trimmedName,
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      onCreated(project);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Quick Template Selector */}
      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Templates
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {STARTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              type="button"
              onClick={() => applyTemplate(tpl)}
              disabled={submitting}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wider text-neutral-400" htmlFor="name">
          Project name
        </label>
        <input
          id="name"
          name="name"
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0c0d12]/80 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Invoice management service"
          disabled={submitting}
          maxLength={255}
          required
        />
      </div>
      <div>
        <label
          className="text-xs font-medium uppercase tracking-wider text-neutral-400"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/[0.08] bg-[#0c0d12]/80 px-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What should this project provide?"
          disabled={submitting}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!name.trim() || submitting}>
        {submitting ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
