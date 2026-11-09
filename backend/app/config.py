"""Backward-compatible settings access for the rebuilt application.

New code should import from :mod:`app.core.config`. This module keeps the
ported workflow modules and Alembic environment working with one settings
instance.
"""

from app.core.config import Settings, get_settings

settings = get_settings()

__all__ = ["Settings", "get_settings", "settings"]
