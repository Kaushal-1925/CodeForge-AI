from pathlib import Path

import pytest

from app.services.artifact_writer import write_generated_files


def test_write_generated_files(tmp_path: Path) -> None:
    files = {
        "backend/app/main.py": "print('hello')",
        "backend/tests/test_main.py": "def test_example(): pass",
    }

    written = write_generated_files(files, tmp_path)

    assert len(written) == 2

    main_file = tmp_path / "backend/app/main.py"
    test_file = tmp_path / "backend/tests/test_main.py"

    assert main_file.exists()
    assert test_file.exists()

    assert main_file.read_text() == "print('hello')"
    assert test_file.read_text() == "def test_example(): pass"


def test_reject_workspace_escape(tmp_path: Path) -> None:
    files = {
        "../outside.txt": "should not be written",
    }

    with pytest.raises(ValueError):
        write_generated_files(files, tmp_path)
