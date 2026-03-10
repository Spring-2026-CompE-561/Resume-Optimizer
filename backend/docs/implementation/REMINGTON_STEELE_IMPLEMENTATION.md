# Remington Steele Backend Implementation Plan

## Ownership
- Primary domain: Platform foundation, DB setup, CORS, and CI quality gates.
- Cross-cutting ownership:
  - exception pattern shared with the whole team (pre-defined `HTTPException` instances in `exceptions/` modules)
  - DB table creation via `Base.metadata.create_all()`
  - API router bootstrap pattern aligned to `proffessor-backend`

## Files to Create

```text
backend/src/app/main.py
backend/src/app/api/v1/routes.py
backend/src/app/core/database.py
backend/src/app/core/settings.py
backend/src/test/integration/test_bootstrap.py
```

## Implementation Detail

## 1) App Bootstrap (Professor Pattern)
- Build `FastAPI` app in `src/app/main.py`.
- Call `Base.metadata.create_all(bind=engine)` at startup to create all tables — **no Alembic, no migration files**.
- Import and register the central `api_router` from `src/app/api/v1/routes.py`.
- Add `CORSMiddleware` in `main.py` (the only middleware layer — matches professor-backend exactly).
- `api/v1/routes.py` creates one `APIRouter(prefix="/api/v1")` and includes each domain router:
  - auth
  - resumes
  - job_postings
  - optimize

Reference structure from professor-backend:
```python
# main.py
Base.metadata.create_all(bind=engine)
app = FastAPI(title=settings.app_name, ...)
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=[...], ...)

# api/v1/routes.py
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.api_router)
api_router.include_router(resumes.api_router)
api_router.include_router(job_postings.api_router)
api_router.include_router(optimize.api_router)
```

## 2) Database Foundation
- Configure SQLAlchemy engine and `SessionLocal` factory in `core/database.py`.
- Export `Base`, `engine`, and `get_db()` — exactly as in professor-backend `core/database.py`.
- **Do not use Alembic.** Tables are created with `Base.metadata.create_all(bind=engine)` in `main.py`.
- Each domain owner (Alden, Amarjot, Eren, John) must ensure their model files are imported before `create_all` runs so their tables are registered on `Base`.

## 3) Exception Pattern (Professor Pattern)
- **Do not create a `schemas/error.py` envelope** with `success`/`error.code`/`request_id` fields.
- Each domain owner creates `exceptions/<domain>_exceptions.py` with **pre-defined `HTTPException` instances**, exactly like professor-backend:

```python
# Example: exceptions/auth_exceptions.py  (Alden creates this)
from fastapi import HTTPException, status

invalid_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

email_in_use_exception = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Email already registered",
)
```

- Routes and services `raise` these pre-built instances directly — no global error-handler middleware needed.
- Remington must share this pattern with the team before domain work begins so everyone follows the same approach.

## 4) CORS and Settings
- `core/settings.py` uses `pydantic_settings.BaseSettings` with `.env` loading — same as professor-backend.
- Add `CORSMiddleware` in `main.py` for allowed origins.
- **No custom middleware files** (`request_id.py`, `error_handler.py`, `logging.py`, `rate_limit.py`) — professor-backend does not use any of these; keep the stack minimal.

## 5) CI + Test Gate
- Add baseline CI commands:
  - lint (ruff)
  - type/format checks if configured
  - unit tests
  - integration tests
- Ensure PR is blocked unless test suite passes.

## Required Tests

- Integration:
  - app starts and `/api/v1` routes are reachable
  - DB tables are created correctly on startup
  - unknown routes return 404

## Definition of Done

1. App boots with versioned router architecture matching professor-backend structure.
2. All domain tables are created via `Base.metadata.create_all()` on startup.
3. Exception pattern is documented and shared with the team before domain work begins.
4. CI catches regressions before merge.
