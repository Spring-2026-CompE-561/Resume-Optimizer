# Amarjot Sandhu Backend Implementation Plan

## Ownership
- Primary domain: Resume ingestion and resume CRUD.
- Route ownership:
  - `POST /api/resumes`
  - `GET /api/resumes`
  - `GET /api/resumes/{id}`
  - `DELETE /api/resumes/{id}`

## Files to Create

```text
backend/src/app/routes/resumes.py
backend/src/app/schemas/resume.py
backend/src/app/models/resume.py
backend/src/app/models/resume_skill.py
backend/src/app/repositories/resume_repository.py
backend/src/app/services/resumes/upload_service.py
backend/src/app/services/resumes/parse_service.py
backend/src/app/services/resumes/resume_skill_service.py
backend/src/test/unit/test_resume_parse_service.py
backend/src/test/integration/test_resume_routes.py
```

## Implementation Detail

## 1) Upload + Validation Pipeline
- Accept multipart file under `file`.
- Enforce allowed MIME types:
  - `application/pdf`
  - DOCX MIME
- Enforce max size (for example 5 MB).
- Store original file in `backend/storage/uploads`.

## 2) Parsing
- Parse PDF (`pdfplumber`) and DOCX (`python-docx`) into plain text.
- Normalize whitespace and line breaks.
- Save parsed output to DB (`parsed_text`) and optional artifact file in `backend/storage/parsed`.
- Raise explicit parse failures with `RESUME_PARSE_FAILED`.

## 3) Resume Data Model
- Fields:
  - `id`, `user_id`, `file_name`, `mime_type`, `storage_path`, `parsed_text`, `created_at`, `updated_at`
- Add `resume_skills` support for extracted categories/skills.
- Ensure `user_id` ownership checks are enforced for read/delete.

## 4) Route Contract and Errors
- Statuses:
  - `201` create
  - `200` list/get/delete
- Errors:
  - `401 AUTH_TOKEN_MISSING_OR_INVALID`
  - `403 RESUME_ACCESS_DENIED`
  - `404 RESUME_NOT_FOUND`
  - `413 FILE_TOO_LARGE`
  - `415 FILE_TYPE_UNSUPPORTED`
  - `422 RESUME_PARSE_FAILED`

## Required Tests

- Unit:
  - parser output for known PDF fixture
  - parser output for known DOCX fixture
  - reject unsupported MIME
- Integration:
  - upload/list/get/delete happy path
  - user A cannot access user B resume
  - oversized file rejection

## Definition of Done

1. Resume endpoints are complete and owner-safe.
2. File validation/parsing failures return structured errors.
3. Resume + resume_skill data persists with correct foreign keys.
4. Tests cover both success and failure paths.

