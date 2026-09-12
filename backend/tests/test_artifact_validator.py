from pathlib import Path

from app.services.artifact_validator import (
    validate_written_artifacts,
)


def test_written_artifacts_pass(tmp_path: Path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()

    file_path = (
        workspace
        / "backend"
        / "app"
        / "example.py"
    )

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    content = "print('hello')\n"

    file_path.write_text(
        content,
        encoding="utf-8",
    )

    files = {
        "backend/app/example.py": content
    }

    errors = validate_written_artifacts(
        files,
        workspace,
    )

    assert errors == []


def test_missing_artifact_fails(tmp_path: Path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()

    files = {
        "backend/app/missing.py": "print('hello')"
    }

    errors = validate_written_artifacts(
        files,
        workspace,
    )

    assert errors == [
        "Generated artifact was not written: "
        "backend/app/missing.py"
    ]


def test_modified_artifact_fails(tmp_path: Path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()

    file_path = (
        workspace
        / "backend"
        / "app"
        / "example.py"
    )

    file_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_path.write_text(
        "different content",
        encoding="utf-8",
    )

    files = {
        "backend/app/example.py": "expected content"
    }

    errors = validate_written_artifacts(
        files,
        workspace,
    )

    assert errors == [
        "Generated artifact content does not match: "
        "backend/app/example.py"
    ]
