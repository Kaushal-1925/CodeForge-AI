from pathlib import Path

from app.services.artifact_writer import (
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