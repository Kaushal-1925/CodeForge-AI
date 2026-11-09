from app.services.file_validator import validate_generated_files


def test_valid_files() -> None:
    files = {
        "backend/app/main.py": "print('hello')",
        "backend/tests/test_main.py": "def test_example(): pass",
    }

    errors = validate_generated_files(files)

    assert errors == []


def test_empty_files() -> None:
    files = {}

    errors = validate_generated_files(files)

    assert "No files were generated." in errors


def test_reject_absolute_path() -> None:
    files = {
        "/etc/passwd": "malicious content",
    }

    errors = validate_generated_files(files)

    assert any("Absolute path" in error for error in errors)


def test_reject_path_traversal() -> None:
    files = {
        "backend/app/../../secret.txt": "secret",
    }

    errors = validate_generated_files(files)

    assert any("Path traversal" in error for error in errors)


def test_reject_unknown_directory() -> None:
    files = {
        "random/file.py": "print('hello')",
    }

    errors = validate_generated_files(files)

    assert any("outside the allowed" in error for error in errors)


def test_reject_empty_content() -> None:
    files = {
        "backend/app/main.py": "",
    }

    errors = validate_generated_files(files)

    assert any("empty" in error.lower() for error in errors)


def test_reject_hardcoded_secret() -> None:
    files = {
        "backend/app/config.py": "GROQ_API_KEY=super_secret_key",
    }

    errors = validate_generated_files(files)

    assert any("hardcoded secret" in error for error in errors)


def test_reject_deepseek_api_key() -> None:
    files = {
        "backend/app/config.py": "DEEPSEEK_API_KEY=super_secret_key",
    }

    errors = validate_generated_files(files)

    assert any("hardcoded secret" in error for error in errors)
