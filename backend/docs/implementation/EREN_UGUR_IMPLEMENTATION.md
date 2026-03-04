# Eren Ugur Backend Implementation Plan

## Ownership
- Primary domain: Job posting ingestion, scraping, and keyword extraction.
- Route ownership:
  - `POST /api/job-postings`
  - `GET /api/job-postings`
  - `GET /api/job-postings/{id}`
  - `DELETE /api/job-postings/{id}`

## Files to Create

```text
backend/src/app/routes/job_postings.py
backend/src/app/schemas/job_posting.py
backend/src/app/models/job_posting.py
backend/src/app/models/keyword.py
backend/src/app/models/job_posting_skill.py
backend/src/app/repositories/job_posting_repository.py
backend/src/app/services/job_postings/scrape_service.py
backend/src/app/services/job_postings/keyword_service.py
backend/src/test/unit/test_scrape_service.py
backend/src/test/unit/test_keyword_service.py
backend/src/test/integration/test_job_posting_routes.py
```

## Implementation Detail

## 1) URL Intake and Validation
- Validate URL scheme (`http`/`https`) and syntax.
- Reject malformed links with `URL_INVALID`.
- Capture source URL and content hash for dedupe checks.

## 2) Scraping Service
- Fetch remote HTML with timeout and retry policy.
- Parse job title/company/description using robust selectors + fallback extraction.
- Normalize text (strip scripts/styles, compact whitespace).
- Emit `SCRAPE_FAILED` when page content cannot be extracted.

## 3) Keyword Extraction
- Tokenize description and extract ranked keywords.
- Persist each keyword with:
  - `term`
  - `category` (optional)
  - `significance_score` (float)
- Persist derived `job_posting_skills`.
- Emit `KEYWORD_EXTRACTION_FAILED` if pipeline fails.

## 4) Ownership + Delete Semantics
- Ensure only owner can read/delete records.
- Deleting a job posting should cascade to keywords and job posting skills.

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
3. Error mapping is explicit and structured.
4. All route and service tests pass.

