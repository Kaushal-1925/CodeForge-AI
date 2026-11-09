from pathlib import Path

from app.services.workspace_reader import (
    read_workspace_files,
)


def test_read_workspace_files(tmp_path: Path):
    backend = tmp_path / "backend"
    backend.mkdir()

    file_path = backend / "example.py"
    file_path.write_text(
        "print('hello')",
        encoding="utf-8",
    )

    files = read_workspace_files(tmp_path)

    assert files == {"backend/example.py": "print('hello')"}


def test_missing_workspace_returns_empty_dict(
    tmp_path: Path,
):
    workspace = tmp_path / "missing"

    assert read_workspace_files(workspace) == {}


def test_ignored_directories_are_not_read(
    tmp_path: Path,
):
    git_directory = tmp_path / ".git"
    git_directory.mkdir()

    git_file = git_directory / "config"
    git_file.write_text(
        "secret git data",
        encoding="utf-8",
    )

    normal_file = tmp_path / "main.py"
    normal_file.write_text(
        "print('hello')",
        encoding="utf-8",
    )

    files = read_workspace_files(tmp_path)

    assert "main.py" in files
    assert ".git/config" not in files


def test_large_files_are_skipped(
    tmp_path: Path,
):
    large_file = tmp_path / "large.txt"

    large_file.write_text(
        "x" * 100_001,
        encoding="utf-8",
    )

    files = read_workspace_files(tmp_path)

    assert "large.txt" not in files
