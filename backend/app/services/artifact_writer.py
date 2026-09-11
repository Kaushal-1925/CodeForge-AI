import shutil
from pathlib import Path


def copy_directory_contents(
    source: Path,
    target: Path,
) -> None:
    target.mkdir(parents=True, exist_ok=True)

    for source_item in source.iterdir():
        target_item = target / source_item.name

        if source_item.is_dir():
            copy_directory_contents(source_item, target_item)
        else:
            if not target_item.exists():
                shutil.copy2(source_item, target_item)


def write_generated_files(
    files: dict[str, str],
    workspace: Path,
) -> list[Path]:
    workspace = workspace.resolve()

    project_root = Path.cwd().resolve()
    source_backend = project_root / "backend"

    if not source_backend.exists():
        raise ValueError(
            f"Existing backend directory does not exist: {source_backend}"
        )

    target_backend = workspace / "backend"
    target_backend.mkdir(parents=True, exist_ok=True)

    source_app = source_backend / "app"
    target_app = target_backend / "app"

    if source_app.exists():
        copy_directory_contents(source_app, target_app)

    written_files: list[Path] = []

    for relative_path, content in files.items():
        file_path = (workspace / relative_path).resolve()

        if workspace not in file_path.parents:
            raise ValueError(
                f"Generated file escapes workspace: {relative_path}"
            )

        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")

        written_files.append(file_path)

    return written_files