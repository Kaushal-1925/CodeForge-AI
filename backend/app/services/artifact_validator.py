from pathlib import Path


def validate_written_artifacts(
    files: dict[str, str],
    workspace: Path,
) -> list[str]:
    errors: list[str] = []

    workspace = workspace.resolve()

    if not workspace.exists():
        return [f"Workspace does not exist: {workspace}"]

    for relative_path, expected_content in files.items():
        file_path = (workspace / relative_path).resolve()

        if workspace not in file_path.parents:
            errors.append(
                f"Artifact escapes workspace: {relative_path}"
            )
            continue

        if not file_path.exists():
            errors.append(
                f"Generated artifact was not written: {relative_path}"
            )
            continue

        if not file_path.is_file():
            errors.append(
                f"Generated artifact is not a file: {relative_path}"
            )
            continue

        actual_content = file_path.read_text(
            encoding="utf-8"
        )

        if actual_content != expected_content:
            errors.append(
                f"Generated artifact content does not match: "
                f"{relative_path}"
            )

    return errors

