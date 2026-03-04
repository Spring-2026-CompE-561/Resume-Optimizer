# HOWTO: Resume Optimizer Backend Implementation Plan

This document turns the current project writeup into an implementation-ready backend plan and directly addresses the grading feedback.

## 1) Feedback Fixes (What Changes)

| Teacher Feedback | Fix in This HOWTO |
|---|---|
| Project overview is slightly brief | Added detailed architecture, request flow, and backend-only scope. |
| API endpoints missing explicit error responses | Added explicit HTTP errors per endpoint with stable error codes. |
| No structured error schema | Added one shared `ErrorResponse` contract for all failures. |
| Password listed as string | Replaced `password` with `password_hash` (+ algorithm note). |
| No cascade/delete behavior in schema | Added `ON DELETE` behavior for every foreign key. |
| Additional considerations need depth | Added middleware order, security controls, testing plan, and rollout checklist. |

## 2) Expanded Project Overview

### Goal
Build a backend API that helps users optimize resumes for specific job postings using extraction + AI-assisted rewriting suggestions.

### Backend-Only Scope (Current Phase)
- User authentication and session/token lifecycle.
- Resume upload, parsing, storage, and retrieval.
- Job posting URL ingestion, scraping, normalization, and keyword extraction.
- Resume optimization workflow (`resume + job posting -> optimized text + suggestions`).
- Security, logging, validation, testing, and deployment readiness.

### End-to-End Backend Flow
1. User signs up or logs in and receives JWT tokens.
2. User uploads resume (`PDF`/`DOCX`), backend validates file type/size and parses text.
3. User submits job URL, backend scrapes content and extracts job metadata + keywords.
4. User calls optimize endpoint with `resume_id` and `job_posting_id`.
5. Backend builds a prompt, calls AI provider, stores optimization result, and returns output.

## 3) Recommended Backend Stack

- Framework: `FastAPI`
- DB: `PostgreSQL`
- ORM/migrations: `SQLAlchemy 2.x` + `Alembic`
- Auth: JWT access + refresh tokens (`python-jose`)
- Password hashing: `argon2id` (preferred) or `bcrypt` via `passlib`
- Parsing: `pdfplumber` (PDF), `python-docx` (DOCX)
- Scraping: `httpx` + `beautifulsoup4`
- Validation: `Pydantic`
- Tests: `pytest`, `httpx.AsyncClient`, `pytest-asyncio`

## 4) API Contract Requirements

### 4.1 Success Shape (Recommended)
```json
{
  "success": true,
  "data": {},
  "request_id": "5d65d2db-8bf7-4435-a834-9580b0269f21"
}
```

### 4.2 Structured Error Schema (Required)
Use this response body for every non-2xx status:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": [
      { "field": "email", "issue": "not_found" }
    ]
  },
  "request_id": "5d65d2db-8bf7-4435-a834-9580b0269f21",
  "timestamp": "2026-03-04T23:10:00Z"
}
```

### Error Fields
- `code`: stable machine-readable string (used by tests and frontend).
- `message`: user-safe summary.
- `details`: optional field-level context.
- `request_id`: for tracing logs.
- `timestamp`: ISO-8601 UTC.

### 4.3 Explicit Error Responses Per Endpoint

| Endpoint | Success | Explicit Errors |
|---|---|---|
| `GET /health` | `200` | `500 INTERNAL_ERROR` |
| `POST /api/auth/signup` | `201` | `400 VALIDATION_ERROR`, `409 AUTH_EMAIL_IN_USE`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` |
| `POST /api/auth/login` | `200` | `400 VALIDATION_ERROR`, `401 AUTH_INVALID_CREDENTIALS`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` |
| `GET /api/me` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 USER_NOT_FOUND`, `500 INTERNAL_ERROR` |
| `POST /api/auth/logout` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `500 INTERNAL_ERROR` |
| `POST /api/auth/forgot-password` | `200` | `400 VALIDATION_ERROR`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR` |
| `POST /api/auth/reset-password` | `200` | `400 AUTH_RESET_TOKEN_INVALID_OR_EXPIRED`, `422 VALIDATION_ERROR`, `500 INTERNAL_ERROR` |
| `POST /api/auth/refresh` | `200` | `401 AUTH_REFRESH_TOKEN_INVALID`, `401 AUTH_REFRESH_TOKEN_REVOKED`, `500 INTERNAL_ERROR` |
| `POST /api/resumes` | `201` | `400 VALIDATION_ERROR`, `401 AUTH_TOKEN_MISSING_OR_INVALID`, `413 FILE_TOO_LARGE`, `415 FILE_TYPE_UNSUPPORTED`, `422 RESUME_PARSE_FAILED`, `500 INTERNAL_ERROR` |
| `GET /api/resumes` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `500 INTERNAL_ERROR` |
| `GET /api/resumes/{id}` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 RESUME_NOT_FOUND`, `403 RESUME_ACCESS_DENIED`, `500 INTERNAL_ERROR` |
| `DELETE /api/resumes/{id}` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 RESUME_NOT_FOUND`, `403 RESUME_ACCESS_DENIED`, `500 INTERNAL_ERROR` |
| `POST /api/job-postings` | `201` | `400 URL_INVALID`, `401 AUTH_TOKEN_MISSING_OR_INVALID`, `422 SCRAPE_FAILED`, `422 KEYWORD_EXTRACTION_FAILED`, `500 INTERNAL_ERROR` |
| `GET /api/job-postings` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `500 INTERNAL_ERROR` |
| `GET /api/job-postings/{id}` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 JOB_POSTING_NOT_FOUND`, `403 JOB_POSTING_ACCESS_DENIED`, `500 INTERNAL_ERROR` |
| `DELETE /api/job-postings/{id}` | `200` | `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 JOB_POSTING_NOT_FOUND`, `403 JOB_POSTING_ACCESS_DENIED`, `500 INTERNAL_ERROR` |
| `POST /api/optimize` | `200` | `400 VALIDATION_ERROR`, `401 AUTH_TOKEN_MISSING_OR_INVALID`, `404 RESUME_NOT_FOUND`, `404 JOB_POSTING_NOT_FOUND`, `422 AI_OPTIMIZATION_FAILED`, `429 AI_RATE_LIMITED`, `500 INTERNAL_ERROR` |

## 5) Corrected Data Models

### 5.1 User Model (Fixed)
- `id`: bigint PK
- `name`: varchar(120), required
- `email`: varchar(255), required, unique
- `password_hash`: text, required  **(not plain `password`)**
- `created_at`: timestamptz, default now
- `updated_at`: timestamptz, default now

Hashing requirement:
- Never store raw passwords.
- Hash using `argon2id` or `bcrypt`.
- Verify with constant-time comparison from vetted library.

### 5.2 Resume Model
- `id`, `user_id`, `file_name`, `mime_type`, `storage_path`, `parsed_text`, `created_at`, `updated_at`

### 5.3 JobPosting Model
- `id`, `user_id`, `url`, `job_title`, `company`, `job_description`, `raw_html_hash`, `created_at`, `updated_at`

### 5.4 Keyword Model
- `id`, `job_posting_id`, `term`, `category`, `significance_score`

### 5.5 ResumeSkill Model
- `id`, `resume_id`, `category`, `created_at`

### 5.6 JobPostingSkill Model
- `id`, `job_posting_id`, `category`, `created_at`

### 5.7 Supporting Auth/Workflow Models (Implementation Depth)
- `refresh_tokens`: token rotation + revocation.
- `password_reset_tokens`: one-time use + expiration.
- `optimization_runs`: stores outputs and metadata for reproducibility.

## 6) Database Schema Rules (Including Cascade/Delete Behavior)

Required foreign-key behavior:

- `resumes.user_id -> users.id ON DELETE CASCADE`
- `job_postings.user_id -> users.id ON DELETE CASCADE`
- `keywords.job_posting_id -> job_postings.id ON DELETE CASCADE`
- `resume_skills.resume_id -> resumes.id ON DELETE CASCADE`
- `job_posting_skills.job_posting_id -> job_postings.id ON DELETE CASCADE`
- `refresh_tokens.user_id -> users.id ON DELETE CASCADE`
- `password_reset_tokens.user_id -> users.id ON DELETE CASCADE`
- `optimization_runs.user_id -> users.id ON DELETE CASCADE`
- `optimization_runs.resume_id -> resumes.id ON DELETE SET NULL`
- `optimization_runs.job_posting_id -> job_postings.id ON DELETE SET NULL`

Index requirements:
- Unique: `users(email)`.
- Lookup: `resumes(user_id, created_at)`, `job_postings(user_id, created_at)`.
- Search support: `keywords(job_posting_id, term)`.
- Token checks: `refresh_tokens(user_id, revoked_at)`, `password_reset_tokens(token_hash, expires_at)`.

## 7) Middleware and Security Implementation Depth

Apply middleware in this order:
1. `RequestIDMiddleware` (generate/request-id pass-through)
2. Structured request logging (method/path/status/latency/request_id)
3. CORS policy (allowlist only, no wildcard in production)
4. Rate limiting (auth endpoints and optimize endpoint stricter)
5. Auth guard for protected routes
6. Global exception handler -> standardized `ErrorResponse`

Validation/security requirements:
- File upload allowlist: only `application/pdf` and DOCX MIME.
- File size limit: hard cap (example 5 MB).
- URL validation and domain sanity checks before scraping.
- JWT expiry + refresh token rotation.
- Secret management by environment variables only.

## 8) Implementation Phases and Definition of Done

### Phase 1: Foundation
- Initialize FastAPI app, config module, DB connection, Alembic.
- Add health endpoint and base middleware.
- Done when local server boots and migration pipeline works.

### Phase 2: Auth
- Signup/login/me/logout/refresh/forgot/reset endpoints.
- Hash passwords, issue/revoke tokens, add auth tests.
- Done when all auth endpoints pass unit + integration tests.

### Phase 3: Resume Pipeline
- Upload/list/get/delete resumes.
- Parse PDF/DOCX, persist metadata + parsed text.
- Done when parser handles valid files and rejects invalid types/sizes.

### Phase 4: Job Posting Pipeline
- Create/list/get/delete job postings.
- Scrape page, normalize content, extract keywords.
- Done when extraction path is deterministic and tested with fixtures.

### Phase 5: Optimization
- Implement `/api/optimize`.
- Build prompt from resume text + keywords + job description.
- Persist run history in `optimization_runs`.
- Done when outputs are stored and failures return structured errors.

### Phase 6: Hardening
- Add performance/security tests, endpoint rate limits, and log dashboards.
- Final OpenAPI verification and seed/demo scripts.
- Done when API contract and tests are stable for submission/demo.

## 9) Even Backend Task Split (20% Each)

Each person gets equal ownership by scope size and required deliverables (implementation + tests + docs).

| Team Member | Backend Ownership (Equal Share) | Required Deliverables |
|---|---|---|
| **Alden Cam** | Auth core (`signup`, `login`, `me`, `logout`, `refresh`, JWT helpers) | Endpoints, service layer, auth unit/integration tests, OpenAPI updates |
| **Amarjot Sandhu** | Resume pipeline (`POST/GET/GET{id}/DELETE` resumes, parser integration) | File validation/parsing module, DB integration, tests for pdf/docx/invalid files, API docs |
| **Eren Ugur** | Job posting pipeline (`POST/GET/GET{id}/DELETE` job-postings, scraping + keywords) | Scraper + extractor services, persistence logic, failure-path tests, API docs |
| **John Hayali** | Optimization workflow (`POST /api/optimize`, prompt assembly, result shaping) | AI orchestration service, optimization_runs persistence, fallback/error logic, endpoint tests |
| **Remington Steele** | Platform foundation (DB migrations, global error schema/handlers, middleware, CI test harness) | Alembic schema with cascade rules, standardized errors, middleware stack, CI + integration test pipeline |

### Equal-Work Rule
- Every member must complete:
1. One primary feature set.
2. DB/model updates for that feature.
3. Endpoint tests (success + error paths).
4. OpenAPI/spec documentation updates.

## 10) Submission Checklist (Backend)

- [ ] All endpoints implemented and match contract.
- [ ] Every endpoint has explicit error responses in OpenAPI.
- [ ] `ErrorResponse` schema used consistently.
- [ ] User model uses `password_hash`, never plaintext password.
- [ ] FK constraints include documented `ON DELETE` behavior.
- [ ] Unit + integration tests pass in CI.
- [ ] README and API docs reflect final backend behavior.
