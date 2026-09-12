from pathlib import Path


MAX_FILE_SIZE = 100_000

IGNORED_DIRECTORIES = {
    ".git",
    ".venv",
    "__pycache__",
    "node_modules",
}


def read_workspace_files(
    workspace: Path,
) -> dict[str, str]:
    workspace = workspace.resolve()

    if not workspace.exists():
        return {}

    if not workspace.is_dir():
        raise ValueError(
            f"Workspace is not a directory: {workspace}"
        )

    files: dict[str, str] = {}

    for file_path in workspace.rglob("*"):
        if not file_path.is_file():
            continue

        if any(
            part in IGNORED_DIRECTORIES
            for part in file_path.parts
        ):
            continue

        resolved_file = file_path.resolve()

        if workspace not in resolved_file.parents:
            raise ValueError(
                f"File escapes workspace: {file_path}"
            )

        if resolved_file.stat().st_size > MAX_FILE_SIZE:
            continue

        relative_path = resolved_file.relative_to(workspace)

        try:
            content = resolved_file.read_text(
                encoding="utf-8"
            )
        except UnicodeDecodeError:
            continue

        files[str(relative_path)] = content

    return files
