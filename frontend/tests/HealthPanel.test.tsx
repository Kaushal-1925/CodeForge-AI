import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthPanel } from "@/components/system/HealthPanel";

describe("HealthPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading state and then real health data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          service: "CodeForge AI",
          version: "0.1.0",
          environment: "test",
        }),
      }),
    );

    render(<HealthPanel />);

    expect(screen.getByText(/checking backend status/i)).toBeInTheDocument();
    expect(await screen.findByText(/backend online/i)).toBeInTheDocument();
    expect(screen.getByText("CodeForge AI")).toBeInTheDocument();
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("shows an actionable error when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    render(<HealthPanel />);

    expect(await screen.findByText(/backend unreachable/i)).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
