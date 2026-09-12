from pathlib import Path
import shutil

from app.graph.state import CodeForgeState


TEMPLATE_DIRECTORY = (
    Path(__file__).resolve().parent.parent
    / "templates"
    / "generated_project"
)


def copy_directory_contents(source: Path, target: Path) -> None:
    target.mkdir(parents=True, exist_ok=True)

    for source_item in source.iterdir():
        target_item = target / source_item.name

        if source_item.is_dir():
            copy_directory_contents(source_item, target_item)
        else:
            # Template files are only initial scaffolding.
            # Never overwrite files that already exist.
            if not target_item.exists():
                shutil.copy2(source_item, target_item)


def write_generated_files(
    files: dict[str, str],
    workspace: Path,
) -> list[Path]:
    workspace = workspace.resolve()

    if not TEMPLATE_DIRECTORY.exists():
        raise ValueError(
            f"Generated project template does not exist: {TEMPLATE_DIRECTORY}"
        )

    # Initialize the workspace with missing template files only.
    copy_directory_contents(TEMPLATE_DIRECTORY, workspace)

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


def artifact_writer_agent(state: CodeForgeState) -> CodeForgeState:
    workspace = Path(state["workspace"])

    try:
        written_files = write_generated_files(
            state["files"],
            workspace,
        )

        state["validation_errors"] = []
        state["current_agent"] = "artifact_writer"
        state["status"] = "artifacts_written"

        return state

    except Exception as exc:
        state["validation_errors"] = [
            f"Artifact writing failed: {exc}"
        ]
        state["current_agent"] = "artifact_writer"
        state["status"] = "artifact_write_failed"

        return state