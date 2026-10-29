import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateProjectForm } from "@/components/projects/CreateProjectForm";

describe("CreateProjectForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a project and reports it to the caller", async () => {
    const project = {
      id: "project-1",
      name: "Demo Project",
      description: "A generated demo.",
      status: "created",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => project,
    });
    vi.stubGlobal("fetch", fetchMock);

    const onCreated = vi.fn();

    render(<CreateProjectForm onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: "Demo Project" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "A generated demo." },
    });
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(project);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/projects"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows an error when project creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Database unavailable" }),
      }),
    );

    render(<CreateProjectForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: "Failing Project" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
  });
});
