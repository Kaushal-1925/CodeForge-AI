from pathlib import Path

from app.services.artifact_writer import write_generated_files
from app.services.docker_test_runner import run_tests_in_docker


def test_generated_project_can_run_tests_in_docker(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_health.py": (
            "def test_health():\n"
            "    assert True\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests_in_docker(workspace)

    assert result["status"] == "passed"
    assert result["exit_code"] == 0
    assert "1 passed" in result["stdout"]

def test_docker_sandbox_cannot_modify_workspace(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_read_only.py": (
            "from pathlib import Path\n"
            "\n"
            "\n"
            "def test_workspace_is_read_only():\n"
            "    target = Path('/workspace/should_not_exist.txt')\n"
            "    try:\n"
            "        target.write_text('blocked', encoding='utf-8')\n"
            "    except OSError:\n"
            "        return\n"
            "    raise AssertionError('Workspace is writable')\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests_in_docker(workspace)

    assert result["status"] == "passed"
    assert result["exit_code"] == 0
    assert "1 passed" in result["stdout"]
    assert not (workspace / "should_not_exist.txt").exists()