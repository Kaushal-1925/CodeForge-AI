import re
from typing import Final

FORBIDDEN_TASK_PATTERNS: Final[dict[str, str]] = {
    "sqlite": "SQLite is not allowed. CodeForge uses PostgreSQL.",
    "asyncpg": "asyncpg is not allowed. CodeForge uses psycopg.",
    "python-dotenv": ("python-dotenv is not allowed. CodeForge uses pydantic-settings."),
    "app/db/": ("app/db/ is not allowed. Use the existing app/database/ infrastructure."),
    "database.py": ("database.py is not allowed. Use the existing app.database infrastructure."),
    "declarative_base": (
        "declarative_base() is not allowed. Use the existing SQLAlchemy DeclarativeBase."
    ),
    "another sqlalchemy base": ("Creating another SQLAlchemy Base is not allowed."),
    "another fastapi application": ("Creating another FastAPI application is not allowed."),
    "new python project": ("Creating a new Python project is not allowed."),
    "modify .env": ("Modifying .env through a generated task is not allowed."),
    "create .env": ("Creating .env through a generated task is not allowed."),
}


def _pattern_is_affirmatively_used(text: str, pattern: str) -> bool:
    for line in text.splitlines():
        # Remove markdown formatting characters
        line_clean = re.sub(r"[`\"'*]", "", line.strip().lower())
        if not line_clean or pattern not in line_clean:
            continue

        # Strip explicit negations including lists/conjunctions
        stripped_line = re.sub(
            rf"\b(?:no|not|without|avoid|avoiding|never|do\s+not\s+(?:use|create|introduce)|instead\s+of|rather\s+than|not\s+using)\s+(?:new\s+)?(?:[\w\.\/\-]+\s+(?:or|and|,)\s+)*{re.escape(pattern)}\b",
            "",
            line_clean,
            flags=re.IGNORECASE,
        )
        # Strip parenthetical negations
        stripped_line = re.sub(
            rf"\((?:no|not|without|avoid|not\s+using|do\s+not\s+(?:use|create|introduce))\s+(?:new\s+)?(?:[\w\.\/\-]+\s+(?:or|and|,)\s+)*{re.escape(pattern)}\)",
            "",
            stripped_line,
            flags=re.IGNORECASE,
        )

        if pattern in stripped_line:
            return True

    return False


def validate_tasks(tasks: list[str]) -> list[str]:
    errors: list[str] = []

    if not tasks:
        errors.append("No tasks were generated.")
        return errors

    for index, task in enumerate(tasks, start=1):
        if not task.strip():
            errors.append(f"Task {index} is empty.")
            continue

        for pattern, message in FORBIDDEN_TASK_PATTERNS.items():
            if _pattern_is_affirmatively_used(task, pattern):
                errors.append(f"Task {index}: {message}")

    return errors

