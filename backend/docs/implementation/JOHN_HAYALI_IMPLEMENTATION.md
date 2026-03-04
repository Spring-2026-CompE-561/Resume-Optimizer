# John Hayali Backend Implementation Plan

## Ownership
- Primary domain: Resume optimization pipeline and AI orchestration.
- Route ownership:
  - `POST /api/optimize`

## Files to Create

```text
backend/src/app/routes/optimize.py
backend/src/app/schemas/optimize.py
backend/src/app/models/optimization_run.py
backend/src/app/repositories/optimization_repository.py
backend/src/app/services/optimize/prompt_builder.py
backend/src/app/services/optimize/ai_client.py
backend/src/app/services/optimize/optimize_service.py
backend/src/test/unit/test_prompt_builder.py
backend/src/test/unit/test_optimize_service.py
backend/src/test/integration/test_optimize_route.py
```

## Implementation Detail

## 1) Optimization Request Validation
- Input:
  - `resume_id`
  - `job_posting_id`
- Verify both resources exist and belong to authenticated user.
- Return:
  - `404 RESUME_NOT_FOUND`
  - `404 JOB_POSTING_NOT_FOUND`
  - `401 AUTH_TOKEN_MISSING_OR_INVALID`

## 2) Prompt Construction
- Build deterministic prompt sections:
  - candidate resume text
  - job description summary
  - extracted keyword priorities
  - formatting constraints for output
- Keep prompt generation in a dedicated module (`prompt_builder.py`) for testing.

## 3) AI Invocation + Fallback
- Use a provider client wrapper (`ai_client.py`) so provider can be swapped.
- Capture latency and provider failure reasons.
- Handle failures with:
  - `422 AI_OPTIMIZATION_FAILED`
  - `429 AI_RATE_LIMITED`

## 4) Persistence
- Save each run to `optimization_runs`:
  - user id
  - optional linked resume/job IDs
  - optimized text
  - suggestions array
  - status metadata, created_at
- Keep records even if linked resume/job posting later deleted (`ON DELETE SET NULL` from migrations).

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

1. `/api/optimize` is deterministic and testable.
2. AI failures are safely translated to structured errors.
3. Optimization outputs are persisted for audit/history.
4. Integration tests verify endpoint-level behavior.

