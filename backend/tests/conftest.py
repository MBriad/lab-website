from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings, get_settings
from app.db.session import Base, get_db
from app.main import app


@pytest.fixture()
def session_factory(tmp_path: Path) -> Generator[sessionmaker[Session], None, None]:
    database_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(database_engine)
    testing_session = sessionmaker(
        bind=database_engine, autoflush=False, expire_on_commit=False, class_=Session
    )
    yield testing_session
    Base.metadata.drop_all(database_engine)
    database_engine.dispose()


@pytest.fixture()
def client(
    tmp_path: Path,
    session_factory: sessionmaker[Session],
) -> Generator[TestClient, None, None]:
    test_settings = Settings(
        database_url="sqlite://",
        secret_key="test-signing-key",
        media_root=tmp_path / "media",
        frontend_origins="http://testserver",
    )

    def override_db() -> Generator[Session, None, None]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_settings] = lambda: test_settings
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
