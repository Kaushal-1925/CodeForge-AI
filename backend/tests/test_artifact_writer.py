from pathlib import Path

from app.agents.artifact_writer import (
    write_generated_files,
)

def test_template_is_copied(tmp_path: Path):
    workspace = tmp_path / "workspace"

    files = {}

    written_files = write_generated_files(
        files,
        workspace,
    )

    assert written_files == []

    assert (
        workspace
        / "backend"
        / "app"
        / "main.py"
    ).exists()

    assert (
        workspace
        / "backend"
        / "app"
        / "database"
        / "base.py"
    ).exists()

    assert (
        workspace
        / "pyproject.toml"
    ).exists()

def test_generated_files_are_written(
    tmp_path: Path,
):
    workspace = tmp_path / "workspace"

    files = {
        "backend/app/models/example.py": (
            "class Example:\n"
            "    pass\n"
        )
    }

    written_files = write_generated_files(
        files,
        workspace,
    )

    generated_file = (
        workspace
        / "backend"
        / "app"
        / "models"
        / "example.py"
    )

    assert generated_file in written_files
    assert generated_file.read_text(
        encoding="utf-8"
    ) == (
        "class Example:\n"
        "    pass\n"
    )


def test_generated_file_cannot_escape_workspace(
    tmp_path: Path,
):
    workspace = tmp_path / "workspace"

    files = {
        "../outside.py": "malicious"
    }

    try:
        write_generated_files(
            files,
            workspace,
        )
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert "escapes workspace" in str(exc)
def test_template_does_not_overwrite_existing_workspace_file(tmp_path: Path):
    workspace = tmp_path / "workspace"

    existing_file = (
        workspace
        / "backend"
        / "app"
        / "main.py"
    )

    existing_file.parent.mkdir(parents=True, exist_ok=True)

    existing_content = """
from fastapi import FastAPI

app = FastAPI(title="My Generated Application")
"""

    existing_file.write_text(
        existing_content,
        encoding="utf-8",
    )

    write_generated_files(
        {},
        workspace,
    )

    assert existing_file.read_text(encoding="utf-8") == existing_content
