from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings


def _prepare_sqlite_directory(database_url: str) -> None:
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        return

    path = database_url.removeprefix(prefix)
    if not path or path == ":memory:":
        return

    database_path = Path(path)
    database_path.parent.mkdir(parents=True, exist_ok=True)


def _create_engine(database_url: str, echo: bool) -> Engine:
    connect_args: dict[str, object] = {}
    is_sqlite = database_url.startswith("sqlite")

    if is_sqlite:
        connect_args["check_same_thread"] = False

    engine = create_engine(
        database_url,
        echo=echo,
        connect_args=connect_args,
        pool_pre_ping=True,
    )

    if is_sqlite:

        @event.listens_for(engine, "connect")
        def _enable_sqlite_foreign_keys(
            dbapi_connection: object,
            _: object,
        ) -> None:
            cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


settings = get_settings()
_prepare_sqlite_directory(settings.database_url)

engine = _create_engine(
    settings.database_url,
    settings.database_echo,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def init_database() -> None:
    from app.database.base import Base
    from app.models import project, workflow_run  # noqa: F401

    Base.metadata.create_all(bind=engine)
