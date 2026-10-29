import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApprovalPanel } from "@/components/workflows/ApprovalPanel";
import type { WorkflowRun } from "@/lib/api/types";

const run: WorkflowRun = {
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

describe("ApprovalPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records an approval decision through the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...run, approval_status: "approved" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onUpdated = vi.fn();

    function Harness() {
      const [currentRun, setCurrentRun] = useState(run);

      return (
        <ApprovalPanel
          projectId="project-1"
          run={currentRun}
          onUpdated={(updatedRun) => {
            onUpdated(updatedRun);
            setCurrentRun(updatedRun);
          }}
        />
      );
    }

    render(<Harness />);

    expect(screen.getByText("Pending review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approve changes/i }));

    expect(await screen.findByText("Approved")).toBeInTheDocument();
    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ approval_status: "approved" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/projects/project-1/runs/run-1/approval"),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows the backend error when the decision cannot be recorded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          detail: "Only completed workflow runs can be approved or rejected",
        }),
      }),
    );

    render(<ApprovalPanel projectId="project-1" run={run} onUpdated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /reject changes/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/only completed workflow runs/i);
    });
  });
});
