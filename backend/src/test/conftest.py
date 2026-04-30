import atexit
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer

POSTGRES_CONTAINER = PostgresContainer(
    "postgres:16-alpine",
    driver="psycopg",
    username="resume",
    password="resume",
    dbname="resume_optimizer_test",
)
POSTGRES_CONTAINER.start()
atexit.register(POSTGRES_CONTAINER.stop)

os.environ["DATABASE_URL"] = POSTGRES_CONTAINER.get_connection_url()
os.environ.setdefault("OPTIMIZE_AI_MODE", "local")

from src.app.core.database import Base, get_db  # noqa: E402
from src.app.main import app  # noqa: E402

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
