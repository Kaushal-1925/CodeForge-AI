"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { createProject } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

interface CreateProjectFormProps {
  onCreated: (project: Project) => void;
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted" htmlFor="name">
          Project name
        </label>
        <input
          id="name"
          name="name"
          className="mt-2 w-full rounded-xl border border-border bg-canvas/70 px-3 py-2 text-sm outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
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
          className="text-xs font-medium uppercase tracking-wide text-muted"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-border bg-canvas/70 px-3 py-2 text-sm outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What should this project provide?"
          disabled={submitting}
        />
      </div>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!name.trim() || submitting}>
        {submitting ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
