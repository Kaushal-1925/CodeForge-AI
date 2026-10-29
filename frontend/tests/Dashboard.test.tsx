import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/components/dashboard/Dashboard";

describe("Dashboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders projects returned by the backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/health")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: "ok",
              service: "CodeForge AI",
              version: "0.1.0",
              environment: "test",
            }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "project-1",
              name: "Demo Project",
              description: "A generated demo.",
              status: "created",
            },
          ],
        };
      }),
    );

    render(<Dashboard />);

    expect(await screen.findByText("Demo Project")).toBeInTheDocument();
    expect(screen.getByText("A generated demo.")).toBeInTheDocument();
  });

  it("shows a retry state when projects cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/health")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: "ok",
              service: "CodeForge AI",
              version: "0.1.0",
              environment: "test",
            }),
          };
        }

        return {
          ok: false,
          status: 503,
          json: async () => ({ detail: "Service unavailable" }),
        };
      }),
    );

    render(<Dashboard />);

    expect(await screen.findByText(/unable to load projects/i)).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
  });
});
