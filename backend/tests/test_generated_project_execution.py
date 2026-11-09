import shutil
import subprocess
from pathlib import Path

import pytest

from app.services.artifact_writer import write_generated_files
from app.services.docker_test_runner import DOCKER_IMAGE, run_tests_in_docker


def _docker_sandbox_is_ready() -> bool:
    if shutil.which("docker") is None:
        return False

    result = subprocess.run(
        ["docker", "image", "inspect", DOCKER_IMAGE],
        capture_output=True,
        check=False,
    )

    return result.returncode == 0


pytestmark = pytest.mark.skipif(
    not _docker_sandbox_is_ready(),
    reason=(
        f"Docker sandbox image '{DOCKER_IMAGE}' is not available. "
        "Build it with scripts/build-sandbox-image.sh."
    ),
)


def test_generated_project_can_run_tests_in_docker(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {"backend/tests/test_health.py": ("def test_health():\n    assert True\n")}

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


def test_docker_sandbox_does_not_run_as_root(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_user.py": (
            "import os\n\n\ndef test_not_root():\n    assert os.getuid() != 0\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests_in_docker(workspace)

    assert result["status"] == "passed"
    assert result["exit_code"] == 0
    assert "1 passed" in result["stdout"]


def test_docker_sandbox_times_out_long_running_tests(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_timeout.py": (
            "import time\n\n\ndef test_timeout():\n    time.sleep(10)\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests_in_docker(
        workspace,
        timeout_seconds=2,
    )

    assert result["status"] == "timeout"
    assert result["exit_code"] is None


def test_docker_sandbox_does_not_use_host_python_packages(tmp_path: Path):
    workspace = tmp_path / "generated-project"

    files = {
        "backend/tests/test_dependency_isolation.py": (
            "def test_dependency_isolation():\n"
            "    import importlib.util\n"
            "    assert importlib.util.find_spec('app') is None\n"
        )
    }

    write_generated_files(files, workspace)

    result = run_tests_in_docker(workspace)

    assert result["status"] == "passed"
    assert result["exit_code"] == 0
    assert "1 passed" in result["stdout"]
