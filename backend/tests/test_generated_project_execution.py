from pathlib import Path

from app.services.artifact_writer import write_generated_files
from app.services.test_runner import run_tests


def test_generated_project_can_run_tests(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_health.py": (
            "def test_health():\n"
            "    assert True\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests(workspace)

    assert result["status"] == "passed"
    assert result["exit_code"] == 0
    assert "1 passed" in result["stdout"]
