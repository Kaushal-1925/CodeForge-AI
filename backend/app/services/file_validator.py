from pathlib import PurePosixPath


ALLOWED_PREFIXES = (
    "backend/app/",
    "backend/tests/",
    "frontend/",
)


def validate_generated_files(files: dict[str, str]) -> list[str]:
    errors: list[str] = []

    if not files:
        errors.append("No files were generated.")
        return errors

    for path, content in files.items():
        # Reject absolute paths.
        if path.startswith("/"):
            errors.append(f"Absolute path is not allowed: {path}")
            continue

        # Reject path traversal.
        parts = PurePosixPath(path).parts
        if ".." in parts:
            errors.append(f"Path traversal is not allowed: {path}")
            continue

        # Only allow files inside the generated project structure.
        if not path.startswith(ALLOWED_PREFIXES):
            errors.append(f"File path is outside the allowed project structure: {path}")

        # Reject empty file paths.
        if not path.strip():
            errors.append("A generated file has an empty path.")

        # Reject empty files.
        if not content.strip():
            errors.append(f"Generated file is empty: {path}")

        # Basic secret detection.
        dangerous_patterns = (
            "GROQ_API_KEY=",
            "DATABASE_PASSWORD=",
            "POSTGRES_PASSWORD=",
        )

        for pattern in dangerous_patterns:
            if pattern in content:
                errors.append(
                    f"Possible hardcoded secret found in: {path}"
                )

    return errors