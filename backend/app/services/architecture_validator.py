from typing import Final


FORBIDDEN_ARCHITECTURE_PATTERNS: Final[dict[str, str]] = {
    "sqlite": "SQLite is not allowed. CodeForge uses PostgreSQL.",
    "database.py": (
        "database.py is not allowed. Use the existing "
        "app.database infrastructure."
    ),
    "db/session.py": (
        "db/session.py is not allowed. Use "
        "app.database.session."
    ),
    "db/base.py": (
        "db/base.py is not allowed. Use "
        "app.database.base."
    ),
    "asyncpg": (
        "asyncpg is not allowed. Use the existing psycopg driver."
    ),
    "flask": "Flask is not allowed. The approved backend framework is FastAPI.",
    "django": "Django is not allowed. The approved backend framework is FastAPI.",
}


def validate_architecture(architecture: str) -> list[str]:
    errors: list[str] = []

    if not architecture.strip():
        errors.append("Architecture is empty.")
        return errors

    architecture_lower = architecture.lower()

    for pattern, message in FORBIDDEN_ARCHITECTURE_PATTERNS.items():
        if pattern in architecture_lower:
            errors.append(message)

    return errors

