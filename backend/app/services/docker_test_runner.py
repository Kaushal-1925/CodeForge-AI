import subprocess
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

        status = "passed" if result.returncode == 0 else "failed"

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