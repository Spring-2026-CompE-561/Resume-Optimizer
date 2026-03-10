# John Hayali Backend Implementation Plan

## Ownership
- Primary domain: Resume optimization pipeline and AI orchestration.
- Route ownership:
  - `POST /api/v1/optimize`

## Files to Create

```text
backend/src/app/routes/optimize.py
backend/src/app/schemas/optimize.py
backend/src/app/models/optimization_run.py
backend/src/app/repository/optimization_repository.py
backend/src/app/services/prompt_builder.py
backend/src/app/services/ai_client.py
backend/src/app/services/optimize_service.py
backend/src/app/exceptions/optimize_exceptions.py
backend/src/test/unit/test_prompt_builder.py
backend/src/test/unit/test_optimize_service.py
backend/src/test/integration/test_optimize_route.py
```

## Implementation Detail

## 1) Optimization Request Validation
- Input:
  - `resume_id`
  - `job_posting_id`
- Verify both resources exist and belong to the authenticated user.
- Raise pre-defined exceptions from `exceptions/` (professor-backend pattern):
  - `resume_not_found_exception` from `exceptions/resume_exceptions.py` (Amarjot's)
  - `job_posting_not_found_exception` from `exceptions/job_posting_exceptions.py` (Eren's)
  - `token_invalid_exception` from `exceptions/auth_exceptions.py` (Alden's) — handled upstream by `get_current_user`

## 2) Prompt Construction
- `services/prompt_builder.py` (flat file — matches professor-backend `services/` layout, no nested subdirectory).
- Build deterministic prompt sections:
  - candidate resume text
  - job description summary
  - extracted keyword priorities
  - formatting constraints for output
- Keep prompt generation isolated in `prompt_builder.py` for unit testing.

## 3) AI Invocation + Fallback
- `services/ai_client.py` (flat file) — provider client wrapper so AI provider can be swapped.
- `services/optimize_service.py` (flat file) — orchestrates prompt building, AI call, and persistence.
- Capture latency and provider failure reasons.
- Raise pre-defined exceptions from `exceptions/optimize_exceptions.py` on failure.

## 4) Repository and Model Layout
- **Folder is `repository/` (singular)** — matches professor-backend naming, not `repositories/`.
- `repository/optimization_repository.py` provides static methods (professor-backend pattern):
  - `create`, `get_by_id`, `get_all_by_user`
- `models/optimization_run.py` extends `Base` from `core/database.py`.
- No migration files — Remington's `Base.metadata.create_all()` creates the `optimization_runs` table on startup.
- Keep records even if linked resume/job posting is deleted: set `nullable=True` on the FK columns and use `ondelete="SET NULL"` on the ForeignKey definition in the model (no Alembic needed — SQLAlchemy handles this in `create_all`).
- Route file (`routes/optimize.py`) injects `db` via `Depends(get_db)` and current user via `Depends(get_current_user)`.

## 5) Exception Definitions
- Create `exceptions/optimize_exceptions.py` with **pre-defined `HTTPException` instances** (professor-backend pattern). Do **not** use string error codes or a structured error envelope:

```python
from fastapi import HTTPException, status

ai_optimization_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="AI optimization failed",
)
ai_rate_limited_exception = HTTPException(
    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    detail="AI provider rate limit exceeded, please try again later",
)
```

## Required Tests

- Unit:
  - prompt includes required sections
  - service handles provider failure mapping
  - output formatting and suggestion parsing
- Integration:
  - full optimize happy path with stubbed AI
  - missing resume/job behavior
  - rate-limit/failure response shape

## Definition of Done

1. `/api/v1/optimize` is deterministic and testable.
2. AI failures are translated to pre-defined `HTTPException` instances.
3. Optimization outputs are persisted for audit/history.
4. Integration tests verify endpoint-level behavior.
