from fastapi import APIRouter

from src.app.routes import auth

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)


@api_router.get("/health", tags=["meta"])
def api_health_check() -> dict[str, str]:
    return {"status": "ok", "api": "v1"}
