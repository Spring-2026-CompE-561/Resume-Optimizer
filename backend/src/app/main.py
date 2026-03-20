from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from src.app import models  # noqa: F401 - register all tables on Base
from src.app.api.v1.routes import api_router
from src.app.core.database import Base, engine
from src.app.core.settings import settings

logger = logging.getLogger(__name__)

if not logging.getLogger().handlers:
    logging.basicConfig(level=settings.log_level)

logger.setLevel(settings.log_level)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("Creating database tables for registered models")
    Base.metadata.create_all(bind=engine)
    logger.info("Application startup complete")
    yield


app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    openapi_url=settings.openapi_url,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
