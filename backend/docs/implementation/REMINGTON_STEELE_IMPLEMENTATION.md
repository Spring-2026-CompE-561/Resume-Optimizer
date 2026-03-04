# Remington Steele Backend Implementation Plan

## Ownership
- Primary domain: Platform foundation, schema/migrations, middleware, and CI quality gates.
- Cross-cutting ownership:
  - global error schema enforcement
  - request lifecycle middleware
  - DB migration baseline and FK delete behavior
  - API router bootstrap pattern aligned to `proffessor-backend`

## Files to Create

```text
backend/src/app/main.py
backend/src/app/api/v1/routes.py
backend/src/app/core/database.py
backend/src/app/core/settings.py
backend/src/app/middleware/request_id.py
backend/src/app/middleware/error_handler.py
backend/src/app/middleware/logging.py
backend/src/app/middleware/rate_limit.py
backend/src/app/schemas/error.py
backend/alembic/env.py
backend/alembic/versions/<timestamp>_initial_schema.py
backend/src/test/integration/test_error_schema.py
backend/src/test/integration/test_middleware_stack.py
```

## Implementation Detail

## 1) App Bootstrap (Professor Pattern)
- Build `FastAPI` app in `src/app/main.py`.
- Compose v1 routes through `src/app/api/v1/routes.py` (same style as professor example).
- Register route modules:
  - auth
  - resumes
  - job_postings
  - optimize

## 2) Database Foundation
- Configure SQLAlchemy engine and session factory in `core/database.py`.
- Create Alembic setup and baseline migration with core tables and constraints.
- Enforce FK delete behavior documented in `HOWTO.md`.

## 3) Standardized Error Envelope
- Define one reusable schema in `schemas/error.py`.
- Add global exception handler that always returns:
  - `success: false`
  - `error.code`
  - `error.message`
  - `error.details` (optional)
  - `request_id`
  - `timestamp`

## 4) Middleware Stack
- Request ID propagation middleware.
- Structured request logging middleware.
- Rate limiting middleware for auth and optimize routes.
- CORS configuration and production-safe defaults.

## 5) CI + Test Gate
- Add baseline CI commands:
  - lint
  - type/format checks if configured
  - unit tests
  - integration tests
- Ensure PR is blocked unless test suite passes.

## Required Tests

- Integration:
  - every failure route returns shared error schema
  - request ID appears in response and logs
  - rate limit returns consistent error code
- Migration sanity:
  - fresh DB upgrade works
  - rollback + re-upgrade works

## Definition of Done

1. App boots with a clean, versioned router architecture.
2. Migrations establish all required tables/constraints.
3. Error responses are globally consistent.
4. CI catches regressions before merge.

