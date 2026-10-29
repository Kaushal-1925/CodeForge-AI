"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ArtifactFile } from "@/lib/api/types";

interface ArtifactViewerProps {
  files: ArtifactFile[];
}

export function ArtifactViewer({ files }: ArtifactViewerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted">
        No artifacts were written to this run workspace.
      </div>
    );
  }

  const selectedFile = files.find((file) => file.path === selectedPath) ?? files[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <nav
        aria-label="Generated files"
        className="max-h-96 overflow-auto rounded-xl border border-border/70 bg-canvas/50 p-2"
      >
        <ul className="space-y-1">
          {files.map((file) => (
            <li key={file.path}>
              <button
                type="button"
                className={cn(
                  "w-full truncate rounded-lg px-3 py-2 text-left font-mono text-xs transition",
                  file.path === selectedFile.path
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-white/5 hover:text-foreground",
                )}
                aria-pressed={file.path === selectedFile.path}
                onClick={() => setSelectedPath(file.path)}
              >
                {file.path}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/70 bg-canvas/50">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2">
          <span className="truncate font-mono text-xs text-muted">{selectedFile.path}</span>
          <span className="shrink-0 text-xs text-muted">{files.length} files</span>
        </div>
        <pre className="max-h-96 overflow-auto p-4 text-xs leading-5 text-foreground">
          <code>{selectedFile.content}</code>
        </pre>
      </div>
    </div>
  );
}
