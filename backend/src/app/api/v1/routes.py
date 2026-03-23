from fastapi import APIRouter

from src.app.core import database as database_core
from src.app.exceptions.platform_exceptions import database_unavailable_exception
from src.app.routes import auth, job_postings, optimize, resumes

DOMAIN_ROUTERS = (
    auth.api_router,
    resumes.api_router,
    job_postings.api_router,
    optimize.api_router,
)

api_router = APIRouter(prefix="/api/v1")

for router in DOMAIN_ROUTERS:
    api_router.include_router(router)


@api_router.get("/health", tags=["meta"])
def api_health_check() -> dict[str, str]:
    return {"status": "ok", "api": "v1"}


@api_router.get("/health/db", tags=["meta"])
def api_database_health_check() -> dict[str, str]:
    if not database_core.is_database_healthy():
        raise database_unavailable_exception
    return {"status": "ok", "database": "up"}
