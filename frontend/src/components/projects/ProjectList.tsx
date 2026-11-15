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
      <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-10 text-center text-sm text-neutral-500 backdrop-blur-md">
        No active projects found. Create one above to launch an autonomous multi-agent run.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#121318]/50 px-5 py-4 transition-all hover:border-white/20 hover:bg-white/[0.04] backdrop-blur-xl group shadow-sm"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white transition group-hover:text-white">
                {project.name}
              </span>
              <span className="mt-1 block truncate text-xs text-neutral-400">
                {project.description ?? "No description provided"}
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
