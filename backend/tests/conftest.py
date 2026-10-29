from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.database.base import Base
from app.database.dependencies import get_db
from app.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    return Settings.model_validate(
        {
            "environment": "test",
            "debug": False,
            "log_level": "WARNING",
            "cors_origins": ["http://localhost:3000"],
            "database_url": "sqlite://",
            "deepseek_api_key": None,
        }
    )


@pytest.fixture
def db_engine(tmp_path: Path) -> Iterator[Engine]:
    database_path = tmp_path / "codeforge-test.db"
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection: object, _: object) -> None:
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)

    yield engine

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def session_factory(db_engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(
        bind=db_engine,
        autoflush=False,
        autocommit=False,
    )


@pytest.fixture
def db_session(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    with session_factory() as session:
        yield session


@pytest.fixture
def client(
    test_settings: Settings,
    session_factory: sessionmaker[Session],
) -> Iterator[TestClient]:
    application = create_app(test_settings)

    def override_get_db() -> Iterator[Session]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    application.dependency_overrides[get_settings] = lambda: test_settings
    application.dependency_overrides[get_db] = override_get_db

    with TestClient(application) as test_client:
        yield test_client

    application.dependency_overrides.clear()
