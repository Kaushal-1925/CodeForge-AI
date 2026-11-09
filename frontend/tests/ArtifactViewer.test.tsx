import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArtifactViewer } from "@/components/workflows/ArtifactViewer";

const files = [
  {
    path: "backend/app/main.py",
    content: "print('hello')",
  },
  {
    path: "README.md",
    content: "# Generated project",
  },
];

describe("ArtifactViewer", () => {
  it("shows the first artifact and switches files", () => {
    render(<ArtifactViewer files={files} />);

    expect(screen.getByText("print('hello')")).toBeInTheDocument();
    expect(screen.getByText("2 files")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "README.md" }));

    expect(screen.getByText("# Generated project")).toBeInTheDocument();
  });

  it("shows an empty state when no artifacts exist", () => {
    render(<ArtifactViewer files={[]} />);

    expect(screen.getByText(/no artifacts were written/i)).toBeInTheDocument();
  });
});
