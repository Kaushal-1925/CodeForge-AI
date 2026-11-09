import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RunDetail } from "@/components/workflows/RunDetail";

const completedRun = {
  id: "run-1",
  project_id: "project-1",
  user_request: "Build a demo application.",
  status: "completed",
  current_agent: "artifact_writer",
  current_task: "Write artifacts",
  iteration: 1,
  approval_status: "pending",
  started_at: "2026-10-28T10:00:00",
  completed_at: "2026-10-28T10:05:00",
};

describe("RunDetail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a completed run and its generated artifacts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/artifacts")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              run_id: "run-1",
              files: [
                {
                  path: "backend/app/main.py",
                  content: "print('generated')",
                },
              ],
            }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => completedRun,
        };
      }),
    );

    render(<RunDetail projectId="project-1" runId="run-1" />);

    expect(await screen.findByText("Build a demo application.")).toBeInTheDocument();
    expect(await screen.findByText("print('generated')")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve changes/i })).toBeInTheDocument();
    expect(screen.getByText("Artifact Writer")).toBeInTheDocument();
  });

  it("does not offer approval for a failed run", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/artifacts")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ run_id: "run-1", files: [] }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({ ...completedRun, status: "failed" }),
        };
      }),
    );

    render(<RunDetail projectId="project-1" runId="run-1" />);

    expect(
      await screen.findByText(/approval is only available for completed runs/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve changes/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/no artifacts were written/i)).toBeInTheDocument();
  });
});
