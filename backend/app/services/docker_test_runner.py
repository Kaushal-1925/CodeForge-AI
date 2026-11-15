import os
import shutil
import subprocess
import sys
from pathlib import Path

DOCKER_IMAGE = "codeforge-test-runner:py311"


def run_tests_in_docker(
    workspace: Path,
    timeout_seconds: int = 30,
) -> dict[str, object]:
    workspace = workspace.resolve()

    if not workspace.exists():
        return {
            "status": "failed",
            "exit_code": None,
            "stdout": "",
            "stderr": f"Workspace does not exist: {workspace}",
        }

    # If docker is not installed or available on this system, fallback to local pytest runner
    if shutil.which("docker") is None:
        return _run_tests_locally(workspace, timeout_seconds)

    command = [
        "docker",
        "run",
        "--rm",
        "--network",
        "none",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--user",
        "65532:65532",
        "--cpus",
        "1",
        "--memory",
        "512m",
        "--pids-limit",
        "100",
        "--read-only",
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,nodev,mode=1777",
        "-v",
        f"{workspace}:/workspace:ro",
        "-w",
        "/workspace",
        DOCKER_IMAGE,
        "pytest",
        "-q",
        "-p",
        "no:cacheprovider",
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )

        # Return code 0 = passed; 5 = no tests collected yet (intermediate tasks before test files)
        status = "passed" if result.returncode in (0, 5) else "failed"

        return {
            "status": status,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    except subprocess.TimeoutExpired as exc:
        return {
            "status": "timeout",
            "exit_code": None,
            "stdout": exc.stdout or "",
            "stderr": exc.stderr or "",
        }

    except Exception:
        # If running via docker failed (e.g. daemon not running or image missing), fallback to local pytest
        return _run_tests_locally(workspace, timeout_seconds)


def _run_tests_locally(
    workspace: Path,
    timeout_seconds: int,
) -> dict[str, object]:
    # Locate test directory within workspace (e.g. backend/tests or tests)
    test_target = workspace
    if (workspace / "backend" / "tests").exists():
        test_target = workspace / "backend"
    elif (workspace / "tests").exists():
        test_target = workspace

    env = os.environ.copy()
    env["PYTHONPATH"] = str(test_target) + os.pathsep + env.get("PYTHONPATH", "")

    command = [
        sys.executable,
        "-m",
        "pytest",
        "-q",
        "-p",
        "no:cacheprovider",
    ]

    try:
        result = subprocess.run(
            command,
            cwd=str(test_target),
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )

        # Return code 0 = passed; 5 = no tests collected yet (intermediate tasks before test files)
        status = "passed" if result.returncode in (0, 5) else "failed"

        return {
            "status": status,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }

    except subprocess.TimeoutExpired as exc:
        return {
            "status": "timeout",
            "exit_code": None,
            "stdout": exc.stdout or "",
            "stderr": exc.stderr or "",
        }

    except Exception as exc:
        return {
            "status": "failed",
            "exit_code": None,
            "stdout": "",
            "stderr": str(exc),
        }
