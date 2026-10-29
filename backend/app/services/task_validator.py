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


def validate_tasks(tasks: list[str]) -> list[str]:
    errors: list[str] = []

    if not tasks:
        errors.append("No tasks were generated.")
        return errors

    for index, task in enumerate(tasks, start=1):
        if not task.strip():
            errors.append(f"Task {index} is empty.")
            continue

        task_lower = task.lower()

        for pattern, message in FORBIDDEN_TASK_PATTERNS.items():
            if pattern in task_lower:
                errors.append(f"Task {index}: {message}")

    return errors
