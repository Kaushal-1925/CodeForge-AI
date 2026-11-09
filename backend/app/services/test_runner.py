from pathlib import Path

from app.services.docker_test_runner import run_tests_in_docker


def run_tests(
    workspace: Path,
    timeout_seconds: int = 30,
) -> dict[str, object]:
    return run_tests_in_docker(
        workspace=workspace,
        timeout_seconds=timeout_seconds,
    )
