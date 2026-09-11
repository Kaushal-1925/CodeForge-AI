import os
import subprocess
from pathlib import Path


def run_tests(
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

    try:
        environment = os.environ.copy()
        environment.setdefault(
            "DATABASE_URL",
            "postgresql+psycopg://codeforge:codeforge_password@localhost:5432/codeforge_test",
            )
        environment.setdefault(
        "GROQ_API_KEY",
        "test-key",
        )

        backend_path = workspace / "backend"

        if backend_path.exists():
            existing_pythonpath = environment.get("PYTHONPATH", "")
            environment["PYTHONPATH"] = (
                f"{backend_path}:{existing_pythonpath}"
                if existing_pythonpath
                else str(backend_path)
            )

        result = subprocess.run(
            [
                "uv",
                "run",
                "pytest",
                "-q",
            ],
            cwd=workspace,
            env=environment,
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