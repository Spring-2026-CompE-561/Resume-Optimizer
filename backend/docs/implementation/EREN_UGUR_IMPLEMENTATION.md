# Eren Ugur Backend Implementation Plan

## Ownership
- Primary domain: Job posting ingestion, scraping, and keyword extraction.
- Route ownership:
  - `POST /api/v1/job-postings`
  - `GET /api/v1/job-postings`
  - `GET /api/v1/job-postings/{id}`
  - `DELETE /api/v1/job-postings/{id}`

## Files to Create

```text
backend/src/app/routes/job_postings.py
backend/src/app/schemas/job_posting.py
backend/src/app/models/job_posting.py
backend/src/app/models/keyword.py
backend/src/app/models/job_posting_skill.py
backend/src/app/repository/job_posting_repository.py
backend/src/app/services/scrape_service.py
backend/src/app/services/keyword_service.py
backend/src/app/exceptions/job_posting_exceptions.py
backend/src/test/unit/test_scrape_service.py
backend/src/test/unit/test_keyword_service.py
backend/src/test/integration/test_job_posting_routes.py
```

## Implementation Detail

## 1) URL Intake and Validation
- Validate URL scheme (`http`/`https`) and syntax.
- Raise `url_invalid_exception` from `exceptions/job_posting_exceptions.py` for malformed links.
- Capture source URL and content hash for dedupe checks.

## 2) Scraping Service
- `services/scrape_service.py` (flat file — matches professor-backend `services/` layout, no nested subdirectory).
- Fetch remote HTML with timeout and retry policy.
- Parse job title/company/description using robust selectors + fallback extraction.
- Normalize text (strip scripts/styles, compact whitespace).
- Raise `scrape_failed_exception` when page content cannot be extracted.

## 3) Keyword Extraction
- `services/keyword_service.py` (flat file).
- Tokenize description and extract ranked keywords.
- Persist each keyword with:
  - `term`
  - `category` (optional)
  - `significance_score` (float)
- Persist derived `job_posting_skills`.
- Raise `keyword_extraction_failed_exception` if pipeline fails.

## 4) Repository and Model Layout
- **Folder is `repository/` (singular)** — matches professor-backend naming, not `repositories/`.
- `repository/job_posting_repository.py` provides static methods (professor-backend pattern):
  - `create`, `get_by_id`, `get_all_by_user`, `delete`
- `models/job_posting.py`, `models/keyword.py`, `models/job_posting_skill.py` extend `Base` from `core/database.py`.
- No migration files — Remington's `Base.metadata.create_all()` creates tables on startup.
- Ensure cascade delete from job posting to keywords and job_posting_skills is set on the SQLAlchemy relationship (e.g., `cascade="all, delete-orphan"`).
- Route file (`routes/job_postings.py`) injects `db` via `Depends(get_db)` and the current user via `Depends(get_current_user)` from Alden's `core/dependencies.py`.

## 5) Exception Definitions
- Create `exceptions/job_posting_exceptions.py` with **pre-defined `HTTPException` instances** (professor-backend pattern). Do **not** use string error codes or a structured error envelope:

```python
from fastapi import HTTPException, status

job_posting_not_found_exception = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Job posting not found or access denied",
)
url_invalid_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="The provided URL is invalid",
)
scrape_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Failed to scrape content from the provided URL",
)
keyword_extraction_failed_exception = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Keyword extraction failed",
)
```

- The `401` case is handled by Alden's `token_invalid_exception` from `exceptions/auth_exceptions.py`.

## Required Tests

- Unit:
  - scraper returns normalized text from fixture HTML
  - keyword extraction returns deterministic top terms
- Integration:
  - create/list/get/delete job posting
  - owner-only access enforcement
  - scrape failure and invalid URL error behavior

## Definition of Done

1. Job posting routes persist stable extracted data.
2. Keywords and skills are generated and stored reliably.
3. Errors are pre-defined `HTTPException` instances raised directly.
4. All route and service tests pass.
