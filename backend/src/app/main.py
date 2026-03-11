from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app import models  # noqa: F401 - register all tables on Base
from src.app.api.v1.routes import api_router
from src.app.core.database import Base, engine
from src.app.core.settings import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
