from fastapi import APIRouter, HTTPException, status

from src.app.core import database as database_core
from src.app.routes import auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)


@api_router.get("/health", tags=["meta"])
def api_health_check() -> dict[str, str]:
    return {"status": "ok", "api": "v1"}


@api_router.get("/health/db", tags=["meta"])
def api_database_health_check() -> dict[str, str]:
    if not database_core.is_database_healthy():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is unavailable",
        )
    return {"status": "ok", "database": "up"}
