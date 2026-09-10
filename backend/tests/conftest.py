import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.dependencies import get_db
from app.main import app


TEST_DATABASE_URL = (
    "postgresql+psycopg://codeforge:codeforge_password"
    "@localhost:5432/codeforge_test"
)


@pytest.fixture
def client():
    engine = create_engine(TEST_DATABASE_URL)

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

    Base.metadata.drop_all(bind=engine)
    engine.dispose()
