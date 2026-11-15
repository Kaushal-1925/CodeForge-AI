import re
from typing import Final

FORBIDDEN_ARCHITECTURE_PATTERNS: Final[dict[str, str]] = {
    "sqlite": "SQLite is not allowed. CodeForge uses PostgreSQL.",
    "database.py": "database.py is not allowed. Use the existing app.database infrastructure.",
    "db/session.py": "db/session.py is not allowed. Use app.database.session.",
    "db/base.py": "db/base.py is not allowed. Use app.database.base.",
    "asyncpg": "asyncpg is not allowed. Use the existing psycopg driver.",
    "flask": "Flask is not allowed. The approved backend framework is FastAPI.",
    "django": "Django is not allowed. The approved backend framework is FastAPI.",
}


def _pattern_is_affirmatively_used(text: str, pattern: str) -> bool:
    for line in text.splitlines():
        # Remove markdown formatting characters like backticks, asterisks, and quotes
        line_clean = re.sub(r"[`\"'*]", "", line.strip().lower())
        if not line_clean or pattern not in line_clean:
            continue

        # Strip explicit negations including lists/conjunctions like "no sqlite", "not sqlite", "do not use flask or django"
        stripped_line = re.sub(
            rf"\b(?:no|not|without|avoid|avoiding|never|do\s+not\s+(?:use|create|introduce)|instead\s+of|rather\s+than|not\s+using)\s+(?:new\s+)?(?:[\w\.\/]+\s+(?:or|and|,)\s+)*{re.escape(pattern)}\b",
            "",
            line_clean,
            flags=re.IGNORECASE,
        )
        # Strip parenthetical negations like "(no sqlite)" or "(do not use flask or django)"
        stripped_line = re.sub(
            rf"\((?:no|not|without|avoid|avoiding|never|do\s+not\s+(?:use|create|introduce)|not\s+using)\s+(?:new\s+)?(?:[\w\.\/]+\s+(?:or|and|,)\s+)*{re.escape(pattern)}\)",
            "",
            stripped_line,
            flags=re.IGNORECASE,
        )

        if pattern in stripped_line:
            return True

    return False


def validate_architecture(architecture: str) -> list[str]:
    errors: list[str] = []

    if not architecture.strip():
        errors.append("Architecture is empty.")
        return errors

    for pattern, message in FORBIDDEN_ARCHITECTURE_PATTERNS.items():
        if _pattern_is_affirmatively_used(architecture, pattern):
            errors.append(message)

    return errors

