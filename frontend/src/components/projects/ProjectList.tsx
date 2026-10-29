import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Project } from "@/lib/api/types";
import { formatStatus, projectStatusTone } from "@/lib/workflow";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        No projects yet. Create one to start a workflow run.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface/50 px-4 py-3 transition hover:border-accent/50 hover:bg-white/5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{project.name}</span>
              <span className="mt-1 block truncate text-sm text-muted">
                {project.description ?? "No description"}
              </span>
            </span>
            <StatusBadge tone={projectStatusTone(project.status)}>
              {formatStatus(project.status)}
            </StatusBadge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
