from pathlib import Path

from app.graph.state import CodeForgeState
from app.services.artifact_writer import write_generated_files


def artifact_writer_agent(state: CodeForgeState) -> CodeForgeState:
    workspace = Path(state["workspace"])

    written_files = write_generated_files(
        state["files"],
        workspace,
    )

    state["current_agent"] = "artifact_writer"
    state["status"] = "artifacts_written"

    print(
        f"Written {len(written_files)} generated files to {workspace}"
    )

    return state