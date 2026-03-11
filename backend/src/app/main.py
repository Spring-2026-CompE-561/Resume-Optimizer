from fastapi import FastAPI

from src.app.core.database import Base, engine
from src.app.models import password_reset_token  # noqa: F401 - register table
from src.app.models import refresh_token  # noqa: F401 - register table
from src.app.models import user  # noqa: F401 - register table
from src.app.routes import auth

app = FastAPI(
    title="Resume Optimizer API",
    version="0.1.0",
)

app.include_router(auth.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}
