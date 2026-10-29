import { describe, expect, it } from "vitest";

import {
  approvalStatusLabel,
  approvalStatusTone,
  formatStatus,
  formatTimestamp,
  isTerminalStatus,
  projectStatusTone,
  runStatusTone,
} from "@/lib/workflow";

describe("workflow helpers", () => {
  it("formats backend statuses for display", () => {
    expect(formatStatus("developer_completed")).toBe("Developer Completed");
    expect(formatStatus("started")).toBe("Started");
    expect(formatStatus("")).toBe("");
  });

  it("maps statuses to badge tones", () => {
    expect(runStatusTone("completed")).toBe("success");
    expect(runStatusTone("failed")).toBe("danger");
    expect(runStatusTone("started")).toBe("warning");
    expect(runStatusTone("requirements_gathered")).toBe("accent");
    expect(projectStatusTone("running")).toBe("warning");
    expect(projectStatusTone("created")).toBe("accent");
  });

  it("maps approval statuses for display", () => {
    expect(approvalStatusLabel("pending")).toBe("Pending review");
    expect(approvalStatusLabel("approved")).toBe("Approved");
    expect(approvalStatusLabel("rejected")).toBe("Rejected");
    expect(approvalStatusTone("approved")).toBe("success");
    expect(approvalStatusTone("rejected")).toBe("danger");
    expect(approvalStatusTone("pending")).toBe("warning");
  });

  it("detects terminal workflow states", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("failed")).toBe(true);
    expect(isTerminalStatus("developer_completed")).toBe(false);
    expect(isTerminalStatus("started")).toBe(false);
  });

  it("handles missing and invalid timestamps", () => {
    expect(formatTimestamp(null)).toBe("Not recorded");
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });
});
