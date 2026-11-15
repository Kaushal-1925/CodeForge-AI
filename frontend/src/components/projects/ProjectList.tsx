"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteProject } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";
import { formatStatus, projectStatusTone } from "@/lib/workflow";

interface ProjectListProps {
  projects: Project[];
  onDeleted?: (projectId: string) => void;
}

export function ProjectList({ projects, onDeleted }: ProjectListProps) {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!projectToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteProject(projectToDelete.id);
      const deletedId = projectToDelete.id;
      setProjectToDelete(null);
      setIsDeleting(false);
      onDeleted?.(deletedId);
    } catch (error: unknown) {
      setIsDeleting(false);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete project");
    }
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-10 text-center text-sm text-neutral-500 backdrop-blur-md">
        No active projects found. Create one above to launch an autonomous multi-agent run.
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {projects.map((project) => (
          <li key={project.id}>
            <div className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#121318]/50 p-4 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.04] shadow-sm sm:px-5">
              <Link
                href={`/projects/${project.id}`}
                className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="block truncate text-sm font-medium text-white transition group-hover:text-white">
                    {project.name}
                  </span>
                  <StatusBadge tone={projectStatusTone(project.status)}>
                    {formatStatus(project.status)}
                  </StatusBadge>
                </div>
                <span className="mt-1 block truncate text-xs text-neutral-400">
                  {project.description ?? "No description provided"}
                </span>
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setProjectToDelete(project);
                  }}
                  aria-label={`Delete project ${project.name}`}
                  title={`Delete ${project.name}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-mono text-neutral-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.75"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Confirmation Modal */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
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
                <h3 id="delete-dialog-title" className="text-base font-semibold text-white">
                  Delete Project
                </h3>
                <p id="delete-dialog-description" className="mt-2 text-xs leading-relaxed text-neutral-300">
                  Are you sure you want to delete{" "}
                  <strong className="font-medium text-white">"{projectToDelete.name}"</strong>?
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
                  setProjectToDelete(null);
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
    </>
  );
}
