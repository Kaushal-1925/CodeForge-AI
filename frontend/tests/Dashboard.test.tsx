import { fireEvent, render, screen } from "@testing-library/react";
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

  it("shows confirmation modal when clicking delete button on project card and calls DELETE API on confirmation", async () => {
    let deleted = false;
    let projectsList = [
      {
        id: "project-1",
        name: "Demo Project",
        description: "A generated demo.",
        status: "created",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";

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

        if (method === "DELETE" && url.endsWith("/projects/project-1")) {
          deleted = true;
          projectsList = [];
          return {
            ok: true,
            status: 204,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => projectsList,
        };
      }),
    );

    render(<Dashboard />);

    expect(await screen.findByText("Demo Project")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /delete project demo project/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click Delete -> confirmation modal appears
    fireEvent.click(deleteBtn);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

    // Click Cancel -> dialog closes without deleting
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleted).toBe(false);

    // Click Delete again -> confirm
    fireEvent.click(deleteBtn);
    const confirmBtn = await screen.findByRole("button", { name: "Delete Project" });
    fireEvent.click(confirmBtn);

    expect(deleted).toBe(true);
  });
});
